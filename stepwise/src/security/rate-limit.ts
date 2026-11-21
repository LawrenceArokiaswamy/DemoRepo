/**
 * In-memory sliding-window rate limiter. Protects against abuse and, above
 * all, against runaway AI spend. For several server instances, replace the
 * Map with a shared store such as Redis.
 */
const hits = new Map<string, number[]>();

export interface Limit {
  key: string;
  max: number;
  windowMs: number;
}

/** Returns seconds to wait if any limit is exceeded; otherwise records the hit and returns 0. */
export function checkLimits(limits: Limit[], now = Date.now()): number {
  let wait = 0;
  for (const l of limits) {
    const recent = (hits.get(l.key) ?? []).filter((t) => now - t < l.windowMs);
    hits.set(l.key, recent);
    if (recent.length >= l.max) wait = Math.max(wait, Math.ceil((recent[0] + l.windowMs - now) / 1000));
  }
  if (wait === 0) for (const l of limits) hits.get(l.key)!.push(now);
  if (hits.size > 50_000) sweep(now);
  return wait;
}

function sweep(now: number) {
  for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > 86_400_000) hits.delete(k);
}

export function resetLimits() {
  hits.clear();
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const MIN = 60_000;
const envInt = (name: string, dflt: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : dflt;
};

/** Creating a course is the expensive AI call, so it gets per-learner, per-IP and global caps. */
export function courseCreationLimits(learner: string, ip: string): Limit[] {
  return [
    { key: `create:l:${learner}`, max: envInt("STEPWISE_COURSES_PER_LEARNER_PER_DAY", 5), windowMs: DAY },
    { key: `create:ip:${ip}`, max: envInt("STEPWISE_COURSES_PER_IP_PER_DAY", 10), windowMs: DAY },
    { key: "create:global", max: envInt("STEPWISE_COURSES_PER_DAY", 100), windowMs: DAY },
  ];
}

export function activityLimits(learner: string, ip: string): Limit[] {
  return [
    { key: `act:l:${learner}`, max: 60, windowMs: MIN },
    { key: `act:ip:${ip}`, max: 300, windowMs: MIN },
  ];
}
