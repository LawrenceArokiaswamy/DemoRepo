import { ancestors, conceptMap, descendants } from "./graph";
import type {
  Confidence,
  ConceptId,
  ConceptState,
  CourseGraph,
  Evidence,
  LearnerCourseState,
} from "./types";

/**
 * The learner model.
 *
 * Each concept carries a Bayesian Knowledge Tracing (BKT) posterior — the
 * probability the learner holds the concept — plus a memory half-life that
 * models forgetting. Evidence is weighted by item difficulty and by the
 * learner's stated confidence, and is propagated along the prerequisite graph.
 */

export const MASTERY = 0.95; // pKnown at or above this = mastered
export const READY = 0.8; // prerequisites must be retrievable at this level to unlock a concept
export const REVIEW_BELOW = 0.85; // a mastered concept whose recall drops below this is due for review
export const PRIOR = 0.2; // prior that an unseen concept is already known
export const LEARN_RATE = 0.15; // BKT transit: chance of learning from one practice-with-feedback
export const MIN_CORRECT_FOR_MASTERY = 2; // one lucky answer never certifies mastery
const INFERRED_KNOWN = 0.9; // belief for a concept implied by placement: likely known, still confirmed
const DAY = 86_400_000;
const RETENTION_FLOOR = 0.3; // recall never decays below this fraction of what was learned

export type ConceptStatus = "unseen" | "learning" | "struggling" | "mastered" | "review";

export function newConceptState(conceptId: ConceptId): ConceptState {
  return {
    conceptId,
    pKnown: PRIOR,
    halfLifeDays: 1,
    attempts: 0,
    correct: 0,
    wrongStreak: 0,
    lastEvidenceAt: null,
    masteredAt: null,
    lessonsSeen: 0,
    misconceptions: {},
    confidentErrors: 0,
    inferred: false,
  };
}

export function newLearnerState(graph: CourseGraph): LearnerCourseState {
  return {
    concepts: Object.fromEntries(graph.concepts.map((c) => [c.id, newConceptState(c.id)])),
    diagnosticDone: false,
    diagnosticAsked: 0,
    calibration: {
      guess: { n: 0, correct: 0 },
      unsure: { n: 0, correct: 0 },
      sure: { n: 0, correct: 0 },
    },
    recentItems: [],
    remediationTarget: null,
    activitiesSinceReview: 0,
  };
}

/** Adds state for concepts added to the graph after the learner started. */
export function reconcile(graph: CourseGraph, state: LearnerCourseState): LearnerCourseState {
  const next = structuredClone(state);
  for (const c of graph.concepts) next.concepts[c.id] ??= newConceptState(c.id);
  return next;
}

/** Fraction of what was learned that is still retrievable now (forgetting curve). */
export function retention(s: ConceptState, now: number): number {
  if (s.lastEvidenceAt === null) return 1;
  const days = Math.max(0, now - s.lastEvidenceAt) / DAY;
  const r = Math.pow(2, -days / s.halfLifeDays);
  return RETENTION_FLOOR + (1 - RETENTION_FLOOR) * r;
}

/** Probability the learner could use the concept right now. */
export function effectiveMastery(s: ConceptState, now: number): number {
  return s.pKnown * retention(s, now);
}

export function status(s: ConceptState, now: number): ConceptStatus {
  if (s.attempts === 0 && s.lessonsSeen === 0 && (!s.inferred || s.pKnown < 0.5)) return "unseen";
  if (s.pKnown >= MASTERY) return effectiveMastery(s, now) < REVIEW_BELOW ? "review" : "mastered";
  if (s.wrongStreak >= 2) return "struggling";
  return "learning";
}

/** Days until a mastered concept's recall falls to the review threshold. */
export function daysUntilReview(s: ConceptState, now: number): number | null {
  if (s.pKnown < MASTERY || s.lastEvidenceAt === null) return null;
  // Solve pKnown * (floor + (1-floor) * 2^(-t/h)) = REVIEW_BELOW for t.
  const target = (REVIEW_BELOW / s.pKnown - RETENTION_FLOOR) / (1 - RETENTION_FLOOR);
  if (target <= 0) return null;
  const tDays = -s.halfLifeDays * Math.log2(target);
  const elapsed = (now - s.lastEvidenceAt) / DAY;
  return tDays - elapsed;
}

interface Noise {
  guess: number;
  slip: number;
}

/**
 * Guess/slip parameters for one observation. A correct answer on a harder item
 * is stronger evidence; a "guess" correct answer is weak evidence; a confident
 * wrong answer is strong evidence of a gap.
 */
export function noiseFor(ev: Evidence): Noise {
  let guess =
    ev.itemKind === "mcq" ? 1 / Math.max(2, ev.optionCount ?? 4) : ev.itemKind === "numeric" ? 0.05 : 0.1;
  let slip = [0, 0.08, 0.12, 0.18][ev.difficulty];
  guess *= [0, 1, 0.8, 0.6][ev.difficulty];
  const conf: Confidence = ev.confidence;
  if (conf === "guess") guess = Math.max(guess, 0.5);
  if (conf === "sure") {
    guess *= 0.6;
    slip *= 0.5;
  }
  return { guess: clamp(guess, 0.01, 0.6), slip: clamp(slip, 0.01, 0.3) };
}

/** One BKT step with a fractional score in [0, 1]. */
export function bktPosterior(p: number, score: number, noise: Noise): number {
  const { guess, slip } = noise;
  const pIfCorrect = (p * (1 - slip)) / (p * (1 - slip) + (1 - p) * guess);
  const pIfWrong = (p * slip) / (p * slip + (1 - p) * (1 - guess));
  return clamp(score * pIfCorrect + (1 - score) * pIfWrong, 0.001, 0.999);
}

export interface EvidenceResult {
  state: LearnerCourseState;
  before: number;
  after: number;
  /** Other concepts whose belief changed, and why. */
  propagated: { conceptId: ConceptId; before: number; after: number; why: string }[];
  newlyMastered: boolean;
}

/** Applies one graded answer to the learner model. Pure: returns a new state. */
export function applyEvidence(graph: CourseGraph, prev: LearnerCourseState, ev: Evidence): EvidenceResult {
  const state = reconcile(graph, prev);
  const s = state.concepts[ev.conceptId];
  if (!s) throw new Error(`Unknown concept ${ev.conceptId}`);
  const byId = conceptMap(graph);
  const before = s.pKnown;
  const wasMastered = s.pKnown >= MASTERY;
  const correct = ev.score >= 0.7;
  const recallBefore = effectiveMastery(s, ev.at);

  // Evidence is judged against what the learner can retrieve *now*, so a
  // forgotten concept is not credited at its old level.
  // Placement starts from an uninformative prior so one solid answer can place
  // a learner out of a concept.
  const prior =
    s.lastEvidenceAt === null
      ? ev.diagnostic && s.attempts === 0
        ? Math.max(s.pKnown, 0.5)
        : s.pKnown
      : Math.max(0.01, recallBefore);
  let p = bktPosterior(prior, ev.score, noiseFor(ev));
  // Practice with feedback teaches; a diagnostic only measures.
  if (!ev.diagnostic) p = p + (1 - p) * LEARN_RATE * (correct ? 1 : 0.5);

  // Forgetting model: successful retrieval after a gap strengthens memory
  // more (spacing effect); failure shortens the half-life.
  if (s.lastEvidenceAt !== null && before >= 0.6) {
    const gapDays = (ev.at - s.lastEvidenceAt) / DAY;
    if (correct) {
      const spacing = clamp(gapDays / s.halfLifeDays, 0, 2);
      s.halfLifeDays = clamp(s.halfLifeDays * (1.3 + 0.85 * spacing), 0.5, 365);
    } else {
      s.halfLifeDays = clamp(s.halfLifeDays * 0.5, 0.5, 365);
    }
  }

  s.attempts += 1;
  s.inferred = false;
  s.lastEvidenceAt = ev.at;
  if (correct) {
    s.correct += 1;
    s.wrongStreak = 0;
  } else {
    s.wrongStreak += 1;
    if (ev.confidence === "sure") s.confidentErrors += 1;
  }
  // Belief can approach but not cross the mastery line on a single direct answer.
  s.pKnown = s.correct < MIN_CORRECT_FOR_MASTERY ? Math.min(p, MASTERY - 0.01) : p;
  if (ev.misconceptionId) {
    s.misconceptions[ev.misconceptionId] = (s.misconceptions[ev.misconceptionId] ?? 0) + 1;
  }
  const newlyMastered = !wasMastered && s.pKnown >= MASTERY;
  if (newlyMastered && s.masteredAt === null) s.masteredAt = ev.at;

  state.calibration[ev.confidence].n += 1;
  if (correct) state.calibration[ev.confidence].correct += 1;
  state.recentItems = [ev.itemId, ...state.recentItems.filter((i) => i !== ev.itemId)].slice(0, 12);

  const propagated: EvidenceResult["propagated"] = [];
  const set = (id: ConceptId, value: number, why: string) => {
    const t = state.concepts[id];
    if (!t || Math.abs(t.pKnown - value) < 1e-6) return;
    propagated.push({ conceptId: id, before: t.pKnown, after: value, why });
    t.pKnown = value;
    if (t.attempts === 0) t.inferred = true;
  };

  if (ev.diagnostic) {
    // Placement: a solid answer on a concept implies its prerequisites; a
    // failed one implies the concepts built on it are not held yet.
    if (correct && ev.difficulty >= 2) {
      for (const a of ancestors(graph, ev.conceptId)) {
        const t = state.concepts[a];
        if (t && t.attempts === 0) {
          set(a, Math.max(t.pKnown, INFERRED_KNOWN), "implied by a correct placement answer");
          t.lastEvidenceAt ??= ev.at; // so it enters the review schedule
        }
      }
    } else if (!correct) {
      for (const d of descendants(graph, ev.conceptId)) {
        const t = state.concepts[d];
        if (t && t.attempts === 0) set(d, Math.min(t.pKnown, 0.1), "depends on a concept not yet held");
      }
    }
  } else if (correct) {
    // Using a concept successfully is weak evidence for what it rests on.
    const direct = byId.get(ev.conceptId)?.prerequisites ?? [];
    for (const a of direct) {
      const t = state.concepts[a];
      if (t && t.pKnown < 0.9) set(a, t.pKnown + (0.9 - t.pKnown) * 0.3, "used successfully in a later concept");
    }
  }

  // A misconception rooted in an earlier concept means that concept is weaker
  // than believed: repair it before building further.
  const misconception = byId
    .get(ev.conceptId)
    ?.misconceptions.find((m) => m.id === ev.misconceptionId);
  if (!correct && misconception?.rootConceptId) {
    const root = state.concepts[misconception.rootConceptId];
    if (root) {
      set(root.conceptId, Math.min(root.pKnown, root.pKnown * 0.5), `error traced to it: ${misconception.description}`);
      if (!ev.diagnostic) state.remediationTarget = root.conceptId;
    }
  }
  if (state.remediationTarget && state.concepts[state.remediationTarget]?.pKnown >= MASTERY) {
    state.remediationTarget = null;
  }

  return { state, before, after: s.pKnown, propagated, newlyMastered };
}

/** Marks that the learner read an explanation of a concept. */
export function recordLesson(prev: LearnerCourseState, conceptId: ConceptId): LearnerCourseState {
  const state = structuredClone(prev);
  const s = state.concepts[conceptId];
  if (s) {
    s.lessonsSeen += 1;
    s.wrongStreak = 0; // a fresh explanation resets the struggle counter
  }
  return state;
}

/** How well the learner's confidence predicts correctness. */
export function calibrationSummary(state: LearnerCourseState) {
  const rate = (c: Confidence) => {
    const b = state.calibration[c];
    return b.n ? b.correct / b.n : null;
  };
  const sure = rate("sure");
  return {
    guess: rate("guess"),
    unsure: rate("unsure"),
    sure,
    overconfident: sure !== null && state.calibration.sure.n >= 5 && sure < 0.7,
  };
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
