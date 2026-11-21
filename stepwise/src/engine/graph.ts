import type { Concept, ConceptId, CourseGraph } from "./types";

export class GraphError extends Error {}

/**
 * Validates a concept graph and returns it with prerequisites cleaned
 * (unknown ids and self-references dropped). Throws on cycles: a cycle means
 * no concept in it could ever be taught first.
 */
export function validateGraph(graph: CourseGraph): CourseGraph {
  const ids = new Set<ConceptId>();
  for (const c of graph.concepts) {
    if (ids.has(c.id)) throw new GraphError(`Duplicate concept id: ${c.id}`);
    ids.add(c.id);
  }
  const concepts: Concept[] = graph.concepts.map((c) => ({
    ...c,
    prerequisites: [...new Set(c.prerequisites)].filter((p) => p !== c.id && ids.has(p)),
    misconceptions: c.misconceptions.map((m) => ({
      ...m,
      rootConceptId: m.rootConceptId && ids.has(m.rootConceptId) ? m.rootConceptId : undefined,
    })),
  }));
  const cleaned = { concepts };
  topologicalOrder(cleaned); // throws on cycle
  return cleaned;
}

/** Kahn's algorithm. Stable: ties keep the authored order. */
export function topologicalOrder(graph: CourseGraph): ConceptId[] {
  const indeg = new Map<ConceptId, number>();
  const dependents = new Map<ConceptId, ConceptId[]>();
  for (const c of graph.concepts) {
    indeg.set(c.id, c.prerequisites.length);
    for (const p of c.prerequisites) {
      if (!dependents.has(p)) dependents.set(p, []);
      dependents.get(p)!.push(c.id);
    }
  }
  const order: ConceptId[] = [];
  const queue = graph.concepts.filter((c) => c.prerequisites.length === 0).map((c) => c.id);
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const d of dependents.get(id) ?? []) {
      const n = indeg.get(d)! - 1;
      indeg.set(d, n);
      if (n === 0) queue.push(d);
    }
  }
  if (order.length !== graph.concepts.length) {
    const stuck = graph.concepts.filter((c) => !order.includes(c.id)).map((c) => c.id);
    throw new GraphError(`Prerequisite cycle among: ${stuck.join(", ")}`);
  }
  return order;
}

/** Longest-path depth from the roots: 0 for concepts with no prerequisites. */
export function depths(graph: CourseGraph): Map<ConceptId, number> {
  const byId = conceptMap(graph);
  const depth = new Map<ConceptId, number>();
  for (const id of topologicalOrder(graph)) {
    const prereqs = byId.get(id)!.prerequisites;
    depth.set(id, prereqs.length ? Math.max(...prereqs.map((p) => depth.get(p)!)) + 1 : 0);
  }
  return depth;
}

export function conceptMap(graph: CourseGraph): Map<ConceptId, Concept> {
  return new Map(graph.concepts.map((c) => [c.id, c]));
}

/** All transitive prerequisites, nearest first. */
export function ancestors(graph: CourseGraph, id: ConceptId): ConceptId[] {
  const byId = conceptMap(graph);
  const seen = new Set<ConceptId>();
  const out: ConceptId[] = [];
  let frontier = byId.get(id)?.prerequisites ?? [];
  while (frontier.length) {
    const next: ConceptId[] = [];
    for (const p of frontier) {
      if (seen.has(p)) continue;
      seen.add(p);
      out.push(p);
      next.push(...(byId.get(p)?.prerequisites ?? []));
    }
    frontier = next;
  }
  return out;
}

/** All transitive dependents, nearest first. */
export function descendants(graph: CourseGraph, id: ConceptId): ConceptId[] {
  const dependents = new Map<ConceptId, ConceptId[]>();
  for (const c of graph.concepts) {
    for (const p of c.prerequisites) {
      if (!dependents.has(p)) dependents.set(p, []);
      dependents.get(p)!.push(c.id);
    }
  }
  const seen = new Set<ConceptId>();
  const out: ConceptId[] = [];
  let frontier = dependents.get(id) ?? [];
  while (frontier.length) {
    const next: ConceptId[] = [];
    for (const d of frontier) {
      if (seen.has(d)) continue;
      seen.add(d);
      out.push(d);
      next.push(...(dependents.get(d) ?? []));
    }
    frontier = next;
  }
  return out;
}
