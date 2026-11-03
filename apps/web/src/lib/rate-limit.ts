import "server-only";

const WINDOW_MS = 60_000;
const MAX_HITS = 5;
const hits = new Map<string, number[]>();

/** Simple per-process sliding window limiter. Good enough for one instance; use Redis when scaling out. */
export function isRateLimited(key: string, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) hits.clear();
  return recent.length > MAX_HITS;
}
