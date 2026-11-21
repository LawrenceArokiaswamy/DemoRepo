import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyEvidence,
  bktPosterior,
  daysUntilReview,
  diagnosticFinished,
  effectiveMastery,
  GraphError,
  gradeLocally,
  MASTERY,
  newLearnerState,
  nextActivity,
  noiseFor,
  parseNumber,
  recordLesson,
  status,
  topologicalOrder,
  validateGraph,
  type CourseGraph,
  type Evidence,
  type LearnerCourseState,
} from "../src/engine";

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 0, 1);

// a -> b -> c -> d, plus a -> e
const graph: CourseGraph = validateGraph({
  concepts: [
    { id: "a", title: "A", summary: "", prerequisites: [], misconceptions: [] },
    {
      id: "b",
      title: "B",
      summary: "",
      prerequisites: ["a"],
      misconceptions: [{ id: "b-from-a", description: "confuses A", rootConceptId: "a" }],
    },
    { id: "c", title: "C", summary: "", prerequisites: ["b"], misconceptions: [] },
    { id: "d", title: "D", summary: "", prerequisites: ["c"], misconceptions: [] },
    { id: "e", title: "E", summary: "", prerequisites: ["a"], misconceptions: [] },
  ],
});

function ev(conceptId: string, score: number, extra: Partial<Evidence> = {}): Evidence {
  return {
    conceptId,
    itemId: `${conceptId}-${Math.random()}`,
    itemKind: "numeric",
    difficulty: 2,
    score,
    confidence: "unsure",
    at: T0,
    diagnostic: false,
    ...extra,
  };
}

function skipDiagnostic(s: LearnerCourseState): LearnerCourseState {
  return { ...s, diagnosticDone: true };
}

test("graph: topological order respects prerequisites and rejects cycles", () => {
  const order = topologicalOrder(graph);
  assert.ok(order.indexOf("a") < order.indexOf("b"));
  assert.ok(order.indexOf("c") < order.indexOf("d"));
  assert.throws(
    () =>
      validateGraph({
        concepts: [
          { id: "x", title: "", summary: "", prerequisites: ["y"], misconceptions: [] },
          { id: "y", title: "", summary: "", prerequisites: ["x"], misconceptions: [] },
        ],
      }),
    GraphError,
  );
});

test("graph: unknown prerequisites and self-loops are dropped", () => {
  const g = validateGraph({
    concepts: [{ id: "x", title: "", summary: "", prerequisites: ["x", "ghost"], misconceptions: [] }],
  });
  assert.deepEqual(g.concepts[0].prerequisites, []);
});

test("bkt: correct answers raise belief, wrong answers lower it", () => {
  const n = { guess: 0.2, slip: 0.1 };
  assert.ok(bktPosterior(0.5, 1, n) > 0.5);
  assert.ok(bktPosterior(0.5, 0, n) < 0.5);
  // partial credit lands in between
  const half = bktPosterior(0.5, 0.5, n);
  assert.ok(half < bktPosterior(0.5, 1, n) && half > bktPosterior(0.5, 0, n));
});

test("confidence: a confident error is stronger evidence than an unsure one", () => {
  let s = skipDiagnostic(newLearnerState(graph));
  s.concepts.a.pKnown = 0.7;
  const sure = applyEvidence(graph, s, ev("a", 0, { confidence: "sure" }));
  const unsure = applyEvidence(graph, s, ev("a", 0, { confidence: "unsure" }));
  assert.ok(sure.after < unsure.after);
  assert.equal(sure.state.concepts.a.confidentErrors, 1);
  // and a lucky guess counts for less than a sure correct answer
  assert.ok(noiseFor(ev("a", 1, { confidence: "guess" })).guess > noiseFor(ev("a", 1, { confidence: "sure" })).guess);
});

test("mastery: consistent correct practice reaches mastery", () => {
  let s = skipDiagnostic(newLearnerState(graph));
  let n = 0;
  while (s.concepts.a.pKnown < MASTERY && n < 20) {
    s = applyEvidence(graph, s, ev("a", 1)).state;
    n++;
  }
  assert.ok(n <= 6, `took ${n} answers`);
  assert.equal(status(s.concepts.a, T0), "mastered");
  assert.ok(s.concepts.a.masteredAt !== null);
});

test("forgetting: mastered concepts decay and become due for review", () => {
  let s = skipDiagnostic(newLearnerState(graph));
  for (let i = 0; i < 6; i++) s = applyEvidence(graph, s, ev("a", 1)).state;
  const c = s.concepts.a;
  assert.ok(effectiveMastery(c, T0) > effectiveMastery(c, T0 + 5 * DAY));
  const due = daysUntilReview(c, T0)!;
  assert.ok(due > 0);
  assert.equal(status(c, T0 + (due + 0.1) * DAY), "review");
});

test("spacing: a successful retrieval after a gap grows the half-life more", () => {
  let s = skipDiagnostic(newLearnerState(graph));
  for (let i = 0; i < 6; i++) s = applyEvidence(graph, s, ev("a", 1)).state;
  const h = s.concepts.a.halfLifeDays;
  const soon = applyEvidence(graph, s, ev("a", 1, { at: T0 + 0.01 * DAY })).state.concepts.a.halfLifeDays;
  const later = applyEvidence(graph, s, ev("a", 1, { at: T0 + 2 * DAY })).state.concepts.a.halfLifeDays;
  assert.ok(later > soon && soon > h);
  const failed = applyEvidence(graph, s, ev("a", 0, { at: T0 + 2 * DAY })).state.concepts.a.halfLifeDays;
  assert.ok(failed < h);
});

test("propagation: a misconception rooted in a prerequisite sends the learner back to repair it", () => {
  let s = skipDiagnostic(newLearnerState(graph));
  s.concepts.a.pKnown = 0.96;
  s.concepts.b.lessonsSeen = 1;
  const r = applyEvidence(graph, s, ev("b", 0, { misconceptionId: "b-from-a" }));
  assert.ok(r.state.concepts.a.pKnown < 0.6);
  assert.equal(r.state.remediationTarget, "a");
  const next = nextActivity(graph, r.state, T0);
  assert.equal(next.type !== "complete" && next.conceptId, "a");
});

test("diagnostic: placement brackets knowledge and resolves the graph quickly", () => {
  // A learner who knows a, b and e but not c or d.
  const knows = new Set(["a", "b", "e"]);
  let s = newLearnerState(graph);
  let asked = 0;
  while (!diagnosticFinished(graph, s)) {
    const act = nextActivity(graph, s, T0);
    assert.equal(act.type, "diagnostic");
    if (act.type !== "diagnostic") break;
    s = applyEvidence(graph, s, ev(act.conceptId, knows.has(act.conceptId) ? 1 : 0, { diagnostic: true })).state;
    s.diagnosticAsked += 1;
    asked++;
  }
  assert.ok(asked <= 3, `asked ${asked}`);
  assert.ok(s.concepts.a.pKnown > 0.8 && s.concepts.b.pKnown > 0.8);
  assert.ok(s.concepts.d.pKnown < 0.2);
  // After placement, what they know is confirmed with a question — never lectured —
  // and c is next once that's done.
  let placed: LearnerCourseState = { ...s, diagnosticDone: true };
  for (let i = 0; i < 10; i++) {
    const act = nextActivity(graph, placed, T0);
    if (act.type === "complete" || act.conceptId === "c") break;
    assert.notEqual(act.type, "lesson", "known concepts must not be re-taught");
    assert.ok(knows.has(act.conceptId), `confirming ${act.conceptId}`);
    placed = applyEvidence(graph, placed, ev(act.conceptId, 1)).state;
  }
  const next = nextActivity(graph, placed, T0);
  assert.equal(next.type !== "complete" && next.conceptId, "c");
});

test("policy: check first, teach on a miss, practice, re-teach after two misses, then check foundations", () => {
  let s = skipDiagnostic(newLearnerState(graph));
  const first = nextActivity(graph, s, T0);
  assert.equal(first.type, "practice", "an unmeasured concept is checked before it is taught");
  assert.equal(first.type === "practice" && first.conceptId, "a");
  s = applyEvidence(graph, s, ev("a", 0)).state;
  assert.equal(nextActivity(graph, s, T0).type, "lesson", "a missed check leads to the lesson");
  s = recordLesson(s, "a");
  assert.equal(nextActivity(graph, s, T0).type, "practice");
  s = applyEvidence(graph, s, ev("a", 0)).state;
  s = applyEvidence(graph, s, ev("a", 0)).state;
  const reteach = nextActivity(graph, s, T0);
  assert.equal(reteach.type, "lesson");
  assert.equal(reteach.type === "lesson" && reteach.variant, 1);

  // b keeps failing after two explanations while its prerequisite a is shaky
  let t = skipDiagnostic(newLearnerState(graph));
  t.concepts.a.pKnown = 0.85;
  t.concepts.a.lastEvidenceAt = T0;
  t.concepts.b.lessonsSeen = 2;
  t.concepts.b.wrongStreak = 2;
  t.concepts.b.attempts = 4;
  const down = nextActivity(graph, t, T0);
  assert.equal(down.type, "practice");
  assert.equal(down.type === "practice" && down.conceptId, "a");
});

test("policy: due reviews are interleaved with new material", () => {
  let s = skipDiagnostic(newLearnerState(graph));
  for (let i = 0; i < 6; i++) s = applyEvidence(graph, s, ev("a", 1)).state;
  const later = T0 + 30 * DAY;
  s.activitiesSinceReview = 5;
  const act = nextActivity(graph, s, later);
  assert.equal(act.type, "review");
  assert.equal(act.type === "review" && act.conceptId, "a");
});

test("policy: course completes when everything is mastered", () => {
  let s = skipDiagnostic(newLearnerState(graph));
  for (const id of ["a", "b", "c", "d", "e"]) s.concepts[id].pKnown = 0.99;
  assert.equal(nextActivity(graph, s, T0).type, "complete");
});

test("grading: numeric parsing and MCQ misconception capture", () => {
  assert.equal(parseNumber("25%"), 0.25);
  assert.equal(parseNumber("1/4"), 0.25);
  assert.equal(parseNumber("1,000"), 1000);
  assert.equal(parseNumber("abc"), null);
  const g = gradeLocally(
    {
      id: "i",
      conceptId: "b",
      kind: "mcq",
      difficulty: 1,
      prompt: "",
      solution: "",
      options: [
        { id: "x", text: "", correct: true, feedback: "yes" },
        { id: "y", text: "", correct: false, misconceptionId: "b-from-a", feedback: "no" },
      ],
    },
    "y",
  )!;
  assert.equal(g.score, 0);
  assert.equal(g.misconceptionId, "b-from-a");
});
