import type { Item } from "./types";

export interface Grade {
  /** 0..1 */
  score: number;
  feedback: string;
  misconceptionId?: string;
}

/** Grades the item kinds that need no AI. Returns null for "explain" items. */
export function gradeLocally(item: Item, response: string): Grade | null {
  if (item.kind === "mcq") {
    const opt = item.options?.find((o) => o.id === response);
    if (!opt) return { score: 0, feedback: "No option selected." };
    return { score: opt.correct ? 1 : 0, feedback: opt.feedback, misconceptionId: opt.correct ? undefined : opt.misconceptionId };
  }
  if (item.kind === "numeric") {
    const value = parseNumber(response);
    if (value === null || item.answer === undefined) {
      return { score: 0, feedback: "Please enter a number." };
    }
    const tol = item.tolerance ?? Math.max(1e-9, Math.abs(item.answer) * 0.01);
    const ok = Math.abs(value - item.answer) <= tol;
    return { score: ok ? 1 : 0, feedback: ok ? "Correct." : `Not quite — the answer is ${item.answer}.` };
  }
  return null;
}

/** Accepts "0.25", "25%", "1/4", "1,000". */
export function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(/,/g, "");
  if (!s) return null;
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (frac) {
    const d = Number(frac[2]);
    return d === 0 ? null : Number(frac[1]) / d;
  }
  const pct = s.match(/^(-?\d+(?:\.\d+)?)\s*%$/);
  if (pct) return Number(pct[1]) / 100;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
