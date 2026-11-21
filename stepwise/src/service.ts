import { randomUUID } from "node:crypto";
import { getProvider, type CourseContext, type LearnerContext } from "./ai";
import type { ItemDraft } from "./ai/schemas";
import {
  applyEvidence,
  calibrationSummary,
  conceptMap,
  daysUntilReview,
  depths,
  diagnosticFinished,
  dueForReview,
  effectiveMastery,
  frontier,
  gradeLocally,
  MASTERY,
  newLearnerState,
  nextActivity,
  recordLesson,
  reconcile,
  status,
  validateGraph,
  type Activity,
  type Confidence,
  type ConceptId,
  type CourseGraph,
  type Item,
  type LearnerCourseState,
  type Lesson,
} from "./engine";
import { getStore, type CourseRecord, type PendingActivity } from "./store/db";

export class NotFoundError extends Error {}
export class ConflictError extends Error {}

const now = () => Date.now();

// ---------------------------------------------------------------- courses

export async function createCourse(topic: string, goal: string, ownerId: string): Promise<CourseRecord> {
  const draft = await getProvider().generateCourse(topic, goal);
  const usedMisconceptionIds = new Set<string>();
  const graph: CourseGraph = validateGraph({
    concepts: draft.concepts.map((c) => ({
      id: c.id,
      title: c.title,
      summary: c.summary,
      prerequisites: c.prerequisites,
      misconceptions: c.misconceptions
        .map((m) => {
          let id = m.id;
          while (usedMisconceptionIds.has(id)) id = `${c.id}-${id}`;
          usedMisconceptionIds.add(id);
          return { id, description: m.description, rootConceptId: m.rootConceptId ?? undefined };
        }),
    })),
  });
  if (graph.concepts.length === 0) throw new Error("The generated course had no concepts.");
  const course: CourseRecord = {
    id: randomUUID(), // unguessable: course links are unlisted, not public
    ownerId,
    title: draft.title,
    description: draft.description,
    topic,
    goal,
    graph,
    createdAt: now(),
  };
  getStore().saveCourse(course);
  return course;
}

export function listCourses(learnerId: string) {
  return getStore().coursesFor(learnerId);
}

function requireCourse(courseId: string): CourseRecord {
  const c = getStore().getCourse(courseId);
  if (!c) throw new NotFoundError("Course not found.");
  return c;
}

// ---------------------------------------------------------------- material

const inflight = new Map<string, Promise<void>>();

function courseContext(course: CourseRecord, conceptId: ConceptId): CourseContext {
  const byId = conceptMap(course.graph);
  const concept = byId.get(conceptId);
  if (!concept) throw new NotFoundError(`Concept ${conceptId} not found.`);
  return {
    courseTitle: course.title,
    concept,
    prerequisites: concept.prerequisites.map((p) => byId.get(p)!).filter(Boolean),
  };
}

function learnerContext(course: CourseRecord, state: LearnerCourseState, conceptId: ConceptId): LearnerContext {
  const byId = conceptMap(course.graph);
  const s = state.concepts[conceptId];
  const concept = byId.get(conceptId)!;
  return {
    mastered: course.graph.concepts.filter((c) => state.concepts[c.id]?.pKnown >= MASTERY).map((c) => c.title),
    misconceptions: Object.keys(s?.misconceptions ?? {})
      .map((id) => concept.misconceptions.find((m) => m.id === id)?.description)
      .filter((d): d is string => !!d),
    previousKeyIdeas: getStore().lessonsFor(course.id, conceptId).map((l) => l.keyIdea),
  };
}

function toItem(conceptId: ConceptId, d: ItemDraft): Item | null {
  const difficulty = Math.min(3, Math.max(1, Math.round(d.difficulty))) as 1 | 2 | 3;
  const base = { id: randomUUID(), conceptId, difficulty, prompt: d.prompt, solution: d.solution };
  if (d.kind === "mcq") {
    if (d.options.length < 2 || d.options.filter((o) => o.correct).length !== 1) return null;
    return {
      ...base,
      kind: "mcq",
      options: d.options.map((o, i) => ({
        id: String.fromCharCode(97 + i),
        text: o.text,
        correct: o.correct,
        feedback: o.feedback,
        misconceptionId: o.misconceptionId ?? undefined,
      })),
    };
  }
  if (d.kind === "numeric") {
    if (d.answer === null) return null;
    return { ...base, kind: "numeric", answer: d.answer, tolerance: d.tolerance ?? undefined };
  }
  if (!d.rubric.length) return null;
  return { ...base, kind: "explain", rubric: d.rubric };
}

/** Generates a concept's first lesson and item bank once, shared by every learner. */
async function ensurePack(course: CourseRecord, conceptId: ConceptId, state: LearnerCourseState) {
  const store = getStore();
  if (store.getLesson(course.id, conceptId, 0) && store.itemsFor(course.id, conceptId).length) return;
  const key = `${course.id}:${conceptId}`;
  if (!inflight.has(key)) {
    inflight.set(
      key,
      (async () => {
        const pack = await getProvider().generateConceptPack(
          courseContext(course, conceptId),
          learnerContext(course, state, conceptId),
        );
        store.saveLesson(course.id, { conceptId, variant: 0, ...pack.lesson });
        store.saveItems(
          course.id,
          pack.items.map((d) => toItem(conceptId, d)).filter((i): i is Item => i !== null),
        );
      })().finally(() => inflight.delete(key)),
    );
  }
  await inflight.get(key);
}

async function ensureLesson(course: CourseRecord, state: LearnerCourseState, conceptId: ConceptId, variant: number): Promise<Lesson> {
  const store = getStore();
  await ensurePack(course, conceptId, state);
  const existing = store.getLesson(course.id, conceptId, variant);
  if (existing) return existing;
  const draft = await getProvider().generateLesson(
    courseContext(course, conceptId),
    learnerContext(course, state, conceptId),
    variant,
  );
  const lesson: Lesson = { conceptId, variant, ...draft };
  store.saveLesson(course.id, lesson);
  return lesson;
}

async function pickItem(course: CourseRecord, state: LearnerCourseState, conceptId: ConceptId, difficulty: 1 | 2 | 3): Promise<Item> {
  const store = getStore();
  await ensurePack(course, conceptId, state);
  let items = store.itemsFor(course.id, conceptId);
  const fresh = (list: Item[]) => list.filter((i) => !state.recentItems.includes(i.id));
  let candidates = fresh(items).filter((i) => i.difficulty === difficulty);
  if (!candidates.length && getProvider().canGenerateAnyTopic) {
    const drafts = await getProvider().generateItems(
      courseContext(course, conceptId),
      difficulty,
      items.map((i) => i.prompt),
    );
    const made = drafts.map((d) => toItem(conceptId, d)).filter((i): i is Item => i !== null);
    store.saveItems(course.id, made);
    items = [...items, ...made];
    candidates = fresh(made).filter((i) => i.difficulty === difficulty);
  }
  if (!candidates.length) {
    // nearest difficulty among unseen, then the least recently seen of all
    candidates = fresh(items).sort((a, b) => Math.abs(a.difficulty - difficulty) - Math.abs(b.difficulty - difficulty));
  }
  if (!candidates.length) {
    candidates = [...items].sort((a, b) => state.recentItems.indexOf(b.id) - state.recentItems.indexOf(a.id));
  }
  if (!candidates.length) throw new Error("No practice items are available for this concept.");
  return candidates[0];
}

// ---------------------------------------------------------------- learner state

function loadState(learnerId: string, course: CourseRecord) {
  const found = getStore().getLearnerState(learnerId, course.id);
  return {
    state: found ? reconcile(course.graph, found.state) : newLearnerState(course.graph),
    pending: found?.pending ?? null,
  };
}

/** What the client may see of an item: never the answer key. */
export function publicItem(item: Item) {
  return {
    id: item.id,
    kind: item.kind,
    difficulty: item.difficulty,
    prompt: item.prompt,
    options: item.options?.map((o) => ({ id: o.id, text: o.text })),
  };
}
export type PublicItem = ReturnType<typeof publicItem>;

export interface ServedActivity {
  activity: Activity;
  conceptTitle?: string;
  lesson?: Lesson;
  item?: PublicItem;
  progress: { mastered: number; total: number };
}

function progressOf(course: CourseRecord, state: LearnerCourseState) {
  return {
    mastered: course.graph.concepts.filter((c) => state.concepts[c.id]?.pKnown >= MASTERY).length,
    total: course.graph.concepts.length,
  };
}

/** Returns the learner's current activity, choosing and preparing a new one if needed. */
export async function next(courseId: string, learnerId: string): Promise<ServedActivity> {
  const course = requireCourse(courseId);
  const store = getStore();
  let { state, pending } = loadState(learnerId, course);
  const byId = conceptMap(course.graph);

  if (!pending) {
    if (!state.diagnosticDone && state.diagnosticAsked > 0 && diagnosticFinished(course.graph, state)) {
      state = { ...state, diagnosticDone: true };
      store.logEvent({
        learnerId,
        courseId,
        conceptId: null,
        type: "placement-complete",
        at: now(),
        data: { asked: state.diagnosticAsked, placedOut: progressOf(course, state).mastered },
      });
    }
    const activity = nextActivity(course.graph, state, now());
    pending = { activity, servedAt: now() };
    if (activity.type === "lesson") {
      pending.lessonVariant = activity.variant;
    } else if (activity.type !== "complete") {
      const difficulty = activity.type === "diagnostic" ? 2 : activity.difficulty;
      pending.itemId = (await pickItem(course, state, activity.conceptId, difficulty)).id;
    }
    store.saveLearnerState(learnerId, courseId, state, pending);
  }

  const a = pending.activity;
  const out: ServedActivity = { activity: a, progress: progressOf(course, state) };
  if (a.type !== "complete") out.conceptTitle = byId.get(a.conceptId)?.title;
  if (a.type === "lesson") out.lesson = await ensureLesson(course, state, a.conceptId, pending.lessonVariant ?? 0);
  if (pending.itemId) {
    const item = store.getItem(pending.itemId);
    if (!item) throw new Error("Item missing.");
    out.item = publicItem(item);
  }

  // Warm up material for what is likely to come next, so the learner rarely waits.
  for (const id of frontier(course.graph, state, now()).slice(0, 2)) {
    void ensurePack(course, id, state).catch(() => {});
  }
  return out;
}

export function completeLesson(courseId: string, learnerId: string) {
  const course = requireCourse(courseId);
  const store = getStore();
  const { state, pending } = loadState(learnerId, course);
  if (pending?.activity.type !== "lesson") throw new ConflictError("No lesson is in progress.");
  const conceptId = pending.activity.conceptId;
  const updated = recordLesson(state, conceptId);
  updated.activitiesSinceReview += 1;
  store.transaction(() => {
    store.saveLearnerState(learnerId, courseId, updated, null);
    store.logEvent({ learnerId, courseId, conceptId, type: "lesson", at: now(), data: { variant: pending.lessonVariant ?? 0 } });
  });
}

export interface AnswerResult {
  score: number;
  correct: boolean;
  feedback: string;
  solution: string;
  correctOptionId?: string;
  correctAnswer?: number;
  conceptTitle: string;
  before: number;
  after: number;
  newlyMastered: boolean;
  propagated: { title: string; before: number; after: number; why: string }[];
  misconception?: string;
  progress: { mastered: number; total: number };
}

export async function answer(
  courseId: string,
  learnerId: string,
  input: { itemId: string; response: string; confidence: Confidence },
): Promise<AnswerResult> {
  const course = requireCourse(courseId);
  const store = getStore();
  const { state, pending } = loadState(learnerId, course);
  if (!pending?.itemId || pending.itemId !== input.itemId || pending.activity.type === "lesson" || pending.activity.type === "complete") {
    throw new ConflictError("That question is no longer active. Reload to continue.");
  }
  const activity = pending.activity;
  const item = store.getItem(input.itemId);
  if (!item) throw new NotFoundError("Item not found.");
  const ctx = courseContext(course, item.conceptId);

  let grade = gradeLocally(item, input.response);
  if (!grade) {
    const g = await getProvider().gradeExplanation(ctx, item, input.response);
    grade = { score: Math.min(1, Math.max(0, g.score)), feedback: g.feedback, misconceptionId: g.misconceptionId ?? undefined };
  }
  const misconception = ctx.concept.misconceptions.find((m) => m.id === grade.misconceptionId);

  const at = now();
  const result = applyEvidence(course.graph, state, {
    conceptId: item.conceptId,
    itemId: item.id,
    itemKind: item.kind,
    difficulty: item.difficulty,
    score: grade.score,
    confidence: input.confidence,
    misconceptionId: misconception?.id,
    optionCount: item.options?.length,
    at,
    diagnostic: activity.type === "diagnostic",
  });
  const updated = result.state;
  if (activity.type === "diagnostic") updated.diagnosticAsked += 1;
  updated.activitiesSinceReview = activity.type === "review" ? 0 : updated.activitiesSinceReview + 1;

  const byId = conceptMap(course.graph);
  const propagated = result.propagated.map((p) => ({ title: byId.get(p.conceptId)?.title ?? p.conceptId, before: p.before, after: p.after, why: p.why }));
  store.transaction(() => {
    store.saveLearnerState(learnerId, courseId, updated, null);
    store.logEvent({
      learnerId,
      courseId,
      conceptId: item.conceptId,
      type: activity.type === "diagnostic" ? "placement" : "answer",
      at,
      data: {
        activity: activity.type,
        itemId: item.id,
        kind: item.kind,
        difficulty: item.difficulty,
        response: input.response.slice(0, 2000),
        confidence: input.confidence,
        score: grade.score,
        misconceptionId: misconception?.id ?? null,
        before: result.before,
        after: result.after,
        propagated: result.propagated,
        msToAnswer: at - pending.servedAt,
      },
    });
    if (result.newlyMastered) {
      store.logEvent({ learnerId, courseId, conceptId: item.conceptId, type: "mastered", at, data: {} });
    }
  });

  return {
    score: grade.score,
    correct: grade.score >= 0.7,
    feedback: grade.feedback,
    solution: item.solution,
    correctOptionId: item.options?.find((o) => o.correct)?.id,
    correctAnswer: item.answer,
    conceptTitle: ctx.concept.title,
    before: result.before,
    after: result.after,
    newlyMastered: result.newlyMastered,
    propagated,
    misconception: misconception?.description,
    progress: progressOf(course, updated),
  };
}

// ---------------------------------------------------------------- progress view

export function courseView(courseId: string, learnerId: string) {
  const course = requireCourse(courseId);
  const { state } = loadState(learnerId, course);
  const t = now();
  const depth = depths(course.graph);
  const due = new Set(dueForReview(course.graph, state, t));
  const events = getStore().events(learnerId, courseId, 300);
  const concepts = course.graph.concepts.map((c) => {
    const s = state.concepts[c.id];
    const history = events
      .filter((e) => e.conceptId === c.id && (e.type === "answer" || e.type === "placement"))
      .reverse()
      .map((e) => ({ at: e.at, p: e.data.after as number, score: e.data.score as number }));
    return {
      id: c.id,
      title: c.title,
      summary: c.summary,
      prerequisites: c.prerequisites,
      depth: depth.get(c.id) ?? 0,
      status: status(s, t),
      pKnown: s.pKnown,
      recall: effectiveMastery(s, t),
      attempts: s.attempts,
      correct: s.correct,
      lessonsSeen: s.lessonsSeen,
      confidentErrors: s.confidentErrors,
      inferred: s.inferred,
      halfLifeDays: s.halfLifeDays,
      reviewInDays: daysUntilReview(s, t),
      due: due.has(c.id),
      misconceptions: Object.entries(s.misconceptions).map(([id, n]) => ({
        description: c.misconceptions.find((m) => m.id === id)?.description ?? id,
        count: n,
      })),
      history,
    };
  });
  const answers = events.filter((e) => e.type === "answer" || e.type === "placement");
  return {
    course: { id: course.id, title: course.title, description: course.description, topic: course.topic, goal: course.goal },
    started: answers.length > 0 || events.some((e) => e.type === "lesson"),
    placementDone: state.diagnosticDone,
    concepts,
    calibration: calibrationSummary(state),
    stats: {
      answered: answers.length,
      correct: answers.filter((e) => (e.data.score as number) >= 0.7).length,
      lessons: events.filter((e) => e.type === "lesson").length,
      dueReviews: due.size,
      minutes: Math.round(answers.reduce((acc, e) => acc + Math.min(5 * 60_000, (e.data.msToAnswer as number) ?? 0), 0) / 60_000),
      ...progressOf(course, state),
    },
    timeline: events.slice(0, 40).map((e) => ({
      at: e.at,
      type: e.type,
      concept: e.conceptId ? conceptMap(course.graph).get(e.conceptId)?.title ?? e.conceptId : null,
      score: (e.data.score as number | undefined) ?? null,
      before: (e.data.before as number | undefined) ?? null,
      after: (e.data.after as number | undefined) ?? null,
    })),
  };
}
export type CourseView = ReturnType<typeof courseView>;

export function aiMode() {
  const p = getProvider();
  return { provider: p.name, anyTopic: p.canGenerateAnyTopic };
}
