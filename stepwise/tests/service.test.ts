import { test } from "node:test";
import assert from "node:assert/strict";
import { setProvider } from "../src/ai";
import { OfflineProvider } from "../src/ai/offline";
import { demoPacks } from "../src/ai/demo-course";
import type { AIProvider } from "../src/ai/provider";
import { setStore, Store } from "../src/store/db";
import * as svc from "../src/service";
import type { PublicItem } from "../src/service";

setStore(new Store(":memory:"));
setProvider(new OfflineProvider());

/** Answers correctly using the demo answer key, for concepts the simulated learner knows. */
function correctResponse(item: PublicItem): string {
  for (const pack of Object.values(demoPacks)) {
    const d = pack.items.find((i) => i.prompt === item.prompt);
    if (!d) continue;
    if (d.kind === "mcq") return item.options![d.options.findIndex((o) => o.correct)].id;
    if (d.kind === "numeric") return String(d.answer);
    return d.rubric.map((g) => g.split("|")[0]).join(" ");
  }
  throw new Error("unknown item");
}
function wrongResponse(item: PublicItem): string {
  if (item.kind === "mcq") {
    for (const pack of Object.values(demoPacks)) {
      const d = pack.items.find((i) => i.prompt === item.prompt);
      if (d) return item.options![d.options.findIndex((o) => !o.correct)].id;
    }
  }
  return item.kind === "numeric" ? "-12345" : "no idea";
}

async function runLearner(learnerId: string, courseId: string, knows: Set<string>, maxSteps = 400) {
  const log: string[] = [];
  for (let step = 0; step < maxSteps; step++) {
    const served = await svc.next(courseId, learnerId);
    const a = served.activity;
    if (a.type === "complete") return { log, steps: step, done: true };
    log.push(`${a.type}:${a.conceptId}`);
    if (a.type === "lesson") {
      assert.ok(served.lesson && served.lesson.steps.length > 0);
      svc.completeLesson(courseId, learnerId);
      knows.add(a.conceptId); // in this simulation, a lesson teaches the concept
      continue;
    }
    assert.ok(served.item, "practice must serve an item");
    // answer keys never reach the client
    assert.ok(!("solution" in served.item) && !JSON.stringify(served.item).includes('"correct"'));
    const right = knows.has(a.conceptId);
    const res = await svc.answer(courseId, learnerId, {
      itemId: served.item.id,
      response: right ? correctResponse(served.item) : wrongResponse(served.item),
      confidence: right ? "sure" : "unsure",
    });
    assert.equal(res.correct, right, `${a.type}:${a.conceptId} graded wrongly`);
  }
  return { log, steps: maxSteps, done: false };
}

test("end to end: a beginner is taught every concept and reaches completion", async () => {
  const course = await svc.createCourse("demo", "", "owner");
  assert.equal(course.graph.concepts.length, 8);
  const r = await runLearner("beginner", course.id, new Set());
  assert.ok(r.done, `did not finish in ${r.steps} steps`);
  const view = svc.courseView(course.id, "beginner");
  assert.equal(view.stats.mastered, view.stats.total);
  assert.ok(view.placementDone);
  // every concept got an explanation
  for (const c of view.concepts) assert.ok(c.lessonsSeen >= 1, `${c.id} never taught`);
});

test("end to end: placement skips what an expert already knows", async () => {
  const course = await svc.createCourse("demo", "", "owner");
  const all = new Set(course.graph.concepts.map((c) => c.id));
  const expert = await runLearner("expert", course.id, new Set(all));
  const beginner = svc.courseView(course.id, "expert");
  assert.ok(expert.done);
  const lessons = expert.log.filter((l) => l.startsWith("lesson")).length;
  assert.equal(lessons, 0, "an expert should not be lectured");
  assert.ok(expert.steps < 30, `expert took ${expert.steps} steps`);
  assert.equal(beginner.stats.mastered, beginner.stats.total);
});

test("end to end: a learner who knows the basics starts at the right place", async () => {
  const course = await svc.createCourse("demo", "", "owner");
  const knows = new Set(["percent", "mean", "median", "probability"]);
  const r = await runLearner("intermediate", course.id, knows);
  assert.ok(r.done);
  const taught = r.log.filter((l) => l.startsWith("lesson")).map((l) => l.split(":")[1]);
  for (const k of ["percent", "mean", "median", "probability"]) {
    assert.ok(!taught.includes(k), `re-taught ${k}, which the learner already knew`);
  }
});

test("answers are only accepted for the activity actually served", async () => {
  const course = await svc.createCourse("demo", "", "owner");
  const served = await svc.next(course.id, "cheater");
  assert.ok(served.item);
  await assert.rejects(
    svc.answer(course.id, "cheater", { itemId: "not-the-served-item", response: "a", confidence: "sure" }),
    svc.ConflictError,
  );
  // refreshing returns the same activity rather than a new one
  const again = await svc.next(course.id, "cheater");
  assert.equal(again.item?.id, served.item.id);
});

test("every answer is recorded in the learning log with before/after belief", async () => {
  const course = await svc.createCourse("demo", "", "owner");
  await runLearner("logged", course.id, new Set(), 25);
  const view = svc.courseView(course.id, "logged");
  assert.ok(view.stats.answered > 0);
  const answered = view.timeline.filter((t) => t.type === "answer" || t.type === "placement");
  assert.ok(answered.every((t) => typeof t.before === "number" && typeof t.after === "number"));
});

test("with a generative provider, re-teaching asks for a new explanation and new items are generated", async () => {
  const offline: AIProvider = new OfflineProvider();
  const calls = { lesson: 0, items: 0 };
  const generative: AIProvider = {
    name: "fake-claude",
    canGenerateAnyTopic: true,
    generateCourse: (t, g) => offline.generateCourse("demo", g),
    generateConceptPack: (c, l) => offline.generateConceptPack(c, l),
    generateLesson: async (c, l, v) => {
      calls.lesson++;
      return offline.generateLesson(c, l, v);
    },
    generateItems: async (ctx, difficulty) => {
      calls.items++;
      return [
        { kind: "numeric", difficulty, prompt: `Generated ${ctx.concept.id} ${difficulty} ${calls.items}`, options: [], answer: 1, tolerance: null, rubric: [], solution: "1" },
      ];
    },
    gradeExplanation: (c, i, r) => offline.gradeExplanation(c, i, r),
  };
  setProvider(generative);
  try {
    const course = await svc.createCourse("anything", "", "owner");
    // a learner who never gets anything right
    for (let i = 0; i < 40; i++) {
      const s = await svc.next(course.id, "stuck");
      if (s.activity.type === "lesson") svc.completeLesson(course.id, "stuck");
      else if (s.item) await svc.answer(course.id, "stuck", { itemId: s.item.id, response: "-999", confidence: "unsure" });
    }
    assert.ok(calls.lesson >= 1, "expected a re-teach with a new explanation");
    assert.ok(calls.items >= 1, "expected new items once the bank ran out");
  } finally {
    setProvider(new OfflineProvider());
  }
});
