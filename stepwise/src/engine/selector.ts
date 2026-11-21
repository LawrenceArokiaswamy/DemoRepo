import { ancestors, conceptMap, depths, descendants, topologicalOrder } from "./graph";
import { effectiveMastery, MASTERY, READY, retention, REVIEW_BELOW } from "./mastery";
import type { Activity, ConceptId, CourseGraph, LearnerCourseState } from "./types";

/**
 * The teaching policy: given the learner model, what should happen next?
 *
 *   1. Placement — find the edge of what the learner already holds.
 *   2. Repair — fix a prerequisite an error was traced to.
 *   3. Review — retrieve mastered concepts before they are forgotten.
 *   4. Advance — teach/practice the next concept whose prerequisites are ready.
 */

export const REVIEW_EVERY = 3; // interleave a due review at most every N activities

export function maxDiagnosticQuestions(graph: CourseGraph): number {
  return Math.min(10, Math.max(2, Math.ceil(graph.concepts.length * 0.5)));
}

/** Concepts the placement has no information about yet. */
function uncertain(graph: CourseGraph, state: LearnerCourseState): ConceptId[] {
  return graph.concepts
    .map((c) => c.id)
    .filter((id) => {
      const s = state.concepts[id];
      return s && s.attempts === 0 && s.pKnown > 0.15 && s.pKnown < 0.85;
    });
}

export function diagnosticFinished(graph: CourseGraph, state: LearnerCourseState): boolean {
  return (
    state.diagnosticDone ||
    state.diagnosticAsked >= maxDiagnosticQuestions(graph) ||
    uncertain(graph, state).length === 0
  );
}

/**
 * Picks the placement question that splits the remaining uncertainty best:
 * a binary search over the prerequisite graph. Answering it right resolves
 * its ancestors; answering it wrong resolves its descendants.
 */
function pickDiagnostic(graph: CourseGraph, state: LearnerCourseState): ConceptId | null {
  const open = new Set(uncertain(graph, state));
  if (!open.size) return null;
  const depth = depths(graph);
  let best: ConceptId | null = null;
  let bestScore = -1;
  for (const id of open) {
    const up = ancestors(graph, id).filter((a) => open.has(a)).length;
    const down = descendants(graph, id).filter((d) => open.has(d)).length;
    const score = Math.min(up, down) * 10 + up + down;
    if (score > bestScore || (score === bestScore && depth.get(id)! < depth.get(best!)!)) {
      best = id;
      bestScore = score;
    }
  }
  return best;
}

function difficultyFor(p: number): 1 | 2 | 3 {
  return p < 0.5 ? 1 : p < 0.8 ? 2 : 3;
}

/** Concepts whose prerequisites are all retrievable now, and not yet mastered. */
export function frontier(graph: CourseGraph, state: LearnerCourseState, now: number): ConceptId[] {
  const byId = conceptMap(graph);
  return topologicalOrder(graph).filter((id) => {
    const s = state.concepts[id];
    if (!s || s.pKnown >= MASTERY) return false;
    return byId.get(id)!.prerequisites.every((p) => effectiveMastery(state.concepts[p], now) >= READY);
  });
}

export function dueForReview(graph: CourseGraph, state: LearnerCourseState, now: number): ConceptId[] {
  return graph.concepts
    .map((c) => c.id)
    .filter((id) => {
      const s = state.concepts[id];
      return s && s.pKnown >= MASTERY && effectiveMastery(s, now) < REVIEW_BELOW;
    })
    .sort((a, b) => retention(state.concepts[a], now) - retention(state.concepts[b], now));
}

/** Teach or practice one concept, deciding between explanation and practice. */
function workOn(
  graph: CourseGraph,
  state: LearnerCourseState,
  id: ConceptId,
  now: number,
  why: string,
): Activity {
  const s = state.concepts[id];
  const byId = conceptMap(graph);
  // Struggling even after re-teaching: the gap is probably underneath. Go down
  // to the weakest prerequisite that is not solid.
  if (s.wrongStreak >= 2 && s.lessonsSeen >= 2) {
    const weak = (byId.get(id)?.prerequisites ?? [])
      .map((p) => ({ p, m: effectiveMastery(state.concepts[p], now) }))
      .filter((x) => x.m < MASTERY)
      .sort((a, b) => a.m - b.m)[0];
    if (weak) {
      const w = state.concepts[weak.p];
      return {
        type: "practice",
        conceptId: weak.p,
        difficulty: difficultyFor(w.pKnown),
        reason: `Repeated errors on "${byId.get(id)!.title}" — checking the foundation "${byId.get(weak.p)!.title}" first.`,
      };
    }
  }
  // Never measured and not inferred from placement: check before teaching, so
  // nothing the learner already holds is lectured.
  if (s.attempts === 0 && s.lessonsSeen === 0 && !s.inferred) {
    return {
      type: "practice",
      conceptId: id,
      difficulty: 2,
      reason: `Quick check on "${byId.get(id)!.title}" — if you already know it, we skip the lesson.`,
    };
  }
  if (s.lessonsSeen === 0 && s.pKnown < 0.6) {
    return { type: "lesson", conceptId: id, variant: 0, reason: why };
  }
  if (s.wrongStreak >= 2) {
    return {
      type: "lesson",
      conceptId: id,
      variant: s.lessonsSeen,
      reason: `Two misses in a row — explaining "${byId.get(id)!.title}" a different way.`,
    };
  }
  return { type: "practice", conceptId: id, difficulty: difficultyFor(s.pKnown), reason: why };
}

export function nextActivity(graph: CourseGraph, state: LearnerCourseState, now: number): Activity {
  const byId = conceptMap(graph);

  if (!diagnosticFinished(graph, state)) {
    const id = pickDiagnostic(graph, state);
    if (id) {
      return {
        type: "diagnostic",
        conceptId: id,
        reason: "Placement: finding where your current understanding ends, so nothing you know is re-taught.",
      };
    }
  }

  const target = state.remediationTarget;
  if (target && state.concepts[target] && state.concepts[target].pKnown < MASTERY) {
    const t = state.concepts[target];
    // The learner has shown this before: re-check it rather than re-teach it.
    if (t.correct > 0 && t.wrongStreak === 0) {
      return {
        type: "practice",
        conceptId: target,
        difficulty: 2,
        reason: `Your last answer pointed to "${byId.get(target)!.title}" — a quick check that this foundation is solid.`,
      };
    }
    return workOn(graph, state, target, now, `Your last answer pointed to a gap in "${byId.get(target)!.title}" — repairing it before building on it.`);
  }

  const due = dueForReview(graph, state, now);
  const front = frontier(graph, state, now);
  if (due.length && (state.activitiesSinceReview >= REVIEW_EVERY || front.length === 0)) {
    const id = due[0];
    return {
      type: "review",
      conceptId: id,
      difficulty: 3,
      reason: `Spaced review: "${byId.get(id)!.title}" is about to fade from memory. Retrieving it now makes it last longer.`,
    };
  }

  if (front.length) {
    // Finish what is in progress before opening something new.
    const inProgress = front.find((id) => {
      const s = state.concepts[id];
      return s.attempts > 0 || s.lessonsSeen > 0;
    });
    const id = inProgress ?? front[0];
    const s = state.concepts[id];
    const why = inProgress
      ? `Building "${byId.get(id)!.title}" to mastery (${Math.round(s.pKnown * 100)}% so far).`
      : s.pKnown >= 0.6
        ? `You seem to know "${byId.get(id)!.title}" already — confirming with a harder problem.`
        : `Next step: "${byId.get(id)!.title}". Everything it depends on is in place.`;
    return workOn(graph, state, id, now, why);
  }

  if (due.length) {
    return { type: "review", conceptId: due[0], difficulty: 3, reason: "Spaced review." };
  }
  return { type: "complete", reason: "Every concept in this course is mastered. Come back for spaced reviews." };
}
