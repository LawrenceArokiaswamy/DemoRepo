/**
 * Simulates learners with hidden knowledge and compares the adaptive engine
 * against a fixed curriculum (every lesson in order, a fixed number of
 * questions each — how most video courses work).
 *
 *   npm run simulate
 */
import { demoCourse } from "../src/ai/demo-course";
import {
  applyEvidence,
  diagnosticFinished,
  MASTERY,
  newLearnerState,
  nextActivity,
  recordLesson,
  topologicalOrder,
  validateGraph,
  type CourseGraph,
  type LearnerCourseState,
} from "../src/engine";

const graph: CourseGraph = validateGraph({
  concepts: demoCourse.concepts.map((c) => ({ ...c, misconceptions: c.misconceptions.map((m) => ({ ...m, rootConceptId: m.rootConceptId ?? undefined })) })),
});
const order = topologicalOrder(graph);
const byId = new Map(graph.concepts.map((c) => [c.id, c]));

// Deterministic RNG so runs are reproducible.
let seed = 42;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);

const P_RIGHT_IF_KNOWN = 0.9;
// Each question is multiple choice (4 options) or a typed numeric answer, and
// the engine is told which — so its guess model matches reality.
const KINDS = [
  { kind: "mcq" as const, guess: 0.25 },
  { kind: "numeric" as const, guess: 0.03 },
];
const P_LEARN_FROM_LESSON = 0.6;
const P_LEARN_FROM_FEEDBACK = 0.15;

interface Learner {
  knows: Set<string>;
}

function makeLearner(): Learner {
  // Prior knowledge respects prerequisites: you only know a concept if you know its foundations.
  const level = rand(); // 0 = novice, 1 = expert
  const knows = new Set<string>();
  for (const id of order) {
    const ready = byId.get(id)!.prerequisites.every((p) => knows.has(p));
    if (ready && rand() < level) knows.add(id);
  }
  return { knows };
}

function canLearn(l: Learner, id: string) {
  return byId.get(id)!.prerequisites.every((p) => l.knows.has(p));
}

function respond(l: Learner, id: string, guess: number): number {
  return rand() < (l.knows.has(id) ? P_RIGHT_IF_KNOWN : guess) ? 1 : 0;
}

function runAdaptive(l: Learner) {
  let s: LearnerCourseState = newLearnerState(graph);
  let steps = 0;
  let lessons = 0;
  const t = Date.UTC(2026, 0, 1);
  while (steps < 300) {
    if (!s.diagnosticDone && s.diagnosticAsked > 0 && diagnosticFinished(graph, s)) s = { ...s, diagnosticDone: true };
    const a = nextActivity(graph, s, t);
    if (a.type === "complete") break;
    steps++;
    if (a.type === "lesson") {
      lessons++;
      s = recordLesson(s, a.conceptId);
      if (canLearn(l, a.conceptId) && rand() < P_LEARN_FROM_LESSON) l.knows.add(a.conceptId);
      continue;
    }
    const k = KINDS[Math.floor(rand() * KINDS.length)];
    const score = respond(l, a.conceptId, k.guess);
    s = applyEvidence(graph, s, {
      conceptId: a.conceptId,
      itemId: String(steps),
      itemKind: k.kind,
      optionCount: 4,
      difficulty: a.type === "diagnostic" ? 2 : a.difficulty,
      score,
      confidence: "unsure",
      at: t,
      diagnostic: a.type === "diagnostic",
    }).state;
    if (a.type === "diagnostic") s.diagnosticAsked++;
    else if (!score && canLearn(l, a.conceptId) && rand() < P_LEARN_FROM_FEEDBACK) l.knows.add(a.conceptId);
  }
  const believed = graph.concepts.filter((c) => s.concepts[c.id].pKnown >= MASTERY).map((c) => c.id);
  return {
    steps,
    lessons,
    trulyKnown: l.knows.size,
    falseMastery: believed.filter((id) => !l.knows.has(id)).length,
  };
}

function runFixed(l: Learner, questionsPerConcept: number) {
  let steps = 0;
  for (const id of order) {
    steps++; // lesson
    if (canLearn(l, id) && rand() < P_LEARN_FROM_LESSON) l.knows.add(id);
    for (let q = 0; q < questionsPerConcept; q++) {
      steps++;
      const k = KINDS[Math.floor(rand() * KINDS.length)];
      if (!respond(l, id, k.guess) && canLearn(l, id) && rand() < P_LEARN_FROM_FEEDBACK) l.knows.add(id);
    }
  }
  return { steps, trulyKnown: l.knows.size };
}

const N = 2000;
const total = graph.concepts.length;
const agg = { aSteps: 0, aKnown: 0, aFalse: 0, aComplete: 0, aLessons: 0, fSteps: 0, fKnown: 0, fComplete: 0 };
const byPrior: Record<string, { n: number; a: number; f: number }> = {};
for (let i = 0; i < N; i++) {
  const learner = makeLearner();
  const prior = learner.knows.size;
  const a = runAdaptive({ knows: new Set(learner.knows) });
  const f = runFixed({ knows: new Set(learner.knows) }, 3);
  agg.aSteps += a.steps;
  agg.aKnown += a.trulyKnown;
  agg.aFalse += a.falseMastery;
  agg.aLessons += a.lessons;
  agg.aComplete += a.trulyKnown === total ? 1 : 0;
  agg.fSteps += f.steps;
  agg.fKnown += f.trulyKnown;
  agg.fComplete += f.trulyKnown === total ? 1 : 0;
  const bucket = prior <= 2 ? "novice (0–2 known)" : prior <= 5 ? "some (3–5 known)" : "advanced (6–8 known)";
  byPrior[bucket] ??= { n: 0, a: 0, f: 0 };
  byPrior[bucket].n++;
  byPrior[bucket].a += a.steps;
  byPrior[bucket].f += f.steps;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
console.log(`Simulated ${N} learners on "${demoCourse.title}" (${total} concepts)\n`);
console.log("                                   adaptive    fixed curriculum");
console.log(`avg activities (lessons+questions)  ${(agg.aSteps / N).toFixed(1).padStart(8)}    ${(agg.fSteps / N).toFixed(1).padStart(8)}`);
console.log(`learners who truly know everything  ${pct(agg.aComplete / N).padStart(8)}    ${pct(agg.fComplete / N).padStart(8)}`);
console.log(`concepts truly known at the end     ${pct(agg.aKnown / N / total).padStart(8)}    ${pct(agg.fKnown / N / total).padStart(8)}`);
console.log(`avg lessons shown                   ${(agg.aLessons / N).toFixed(1).padStart(8)}    ${String(total).padStart(8)}`);
console.log(`concepts marked mastered but not    ${(agg.aFalse / N).toFixed(2).padStart(8)}         n/a`);
console.log("\nActivities by prior knowledge:");
for (const [k, v] of Object.entries(byPrior)) {
  console.log(`  ${k.padEnd(22)} adaptive ${(v.a / v.n).toFixed(1).padStart(5)}   fixed ${(v.f / v.n).toFixed(1).padStart(5)}   (${v.n} learners)`);
}
