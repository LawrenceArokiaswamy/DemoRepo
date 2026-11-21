import { test } from "node:test";
import assert from "node:assert/strict";
import { checkLimits, resetLimits } from "../src/security/rate-limit";
import { cleanText } from "../src/security/request";
import { setProvider } from "../src/ai";
import { OfflineProvider } from "../src/ai/offline";
import { setStore, Store } from "../src/store/db";
import * as svc from "../src/service";

test("rate limiter blocks after the limit and recovers after the window", () => {
  resetLimits();
  const limits = [{ key: "t", max: 3, windowMs: 1000 }];
  assert.equal(checkLimits(limits, 0), 0);
  assert.equal(checkLimits(limits, 1), 0);
  assert.equal(checkLimits(limits, 2), 0);
  assert.ok(checkLimits(limits, 3) > 0, "4th call in the window is blocked");
  assert.equal(checkLimits(limits, 1001), 0, "allowed again after the window");
});

test("a blocked request does not consume quota from the other limits", () => {
  resetLimits();
  const tight = { key: "a", max: 1, windowMs: 1000 };
  const loose = { key: "b", max: 2, windowMs: 1000 };
  assert.equal(checkLimits([tight, loose], 0), 0);
  assert.ok(checkLimits([tight, loose], 1) > 0);
  assert.equal(checkLimits([loose], 2), 0, "the blocked call did not count against b");
});

test("text inputs are stripped of control characters and length-capped", () => {
  assert.equal(cleanText("  hi\u0000there\u0007 ", 100), "hithere");
  assert.equal(cleanText("x".repeat(500), 10).length, 10);
  assert.equal(cleanText({ evil: true }, 10), "");
  assert.equal(cleanText("line1\nline2", 100), "line1\nline2");
});

test("learners only ever see their own courses, and course ids are unguessable", async () => {
  setStore(new Store(":memory:"));
  setProvider(new OfflineProvider());
  const a = await svc.createCourse("demo", "secret goal of alice", "alice");
  await svc.createCourse("demo", "", "bob");
  assert.match(a.id, /^[0-9a-f-]{36}$/);
  const bobs = svc.listCourses("bob");
  assert.equal(bobs.length, 1);
  assert.ok(bobs.every((c) => c.ownerId === "bob"));
  assert.ok(!JSON.stringify(bobs).includes("secret goal of alice"));
});

test("answer keys are never sent to the client", async () => {
  setStore(new Store(":memory:"));
  setProvider(new OfflineProvider());
  const c = await svc.createCourse("demo", "", "carol");
  for (let i = 0; i < 6; i++) {
    const s = await svc.next(c.id, "carol");
    if (s.item) {
      const json = JSON.stringify(s.item);
      assert.ok(!/"(correct|answer|solution|rubric|feedback|misconceptionId)"/.test(json), json);
      await svc.answer(c.id, "carol", { itemId: s.item.id, response: "0", confidence: "unsure" });
    } else if (s.activity.type === "lesson") {
      svc.completeLesson(c.id, "carol");
    }
  }
});
