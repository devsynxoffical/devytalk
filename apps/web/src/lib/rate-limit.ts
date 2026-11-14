import "server-only";

const WINDOW_MS = 60_000;
const MAX_HITS = 5;
const hits = new Map<string, number[]>();

/** Simple per-process sliding window limiter. Good enough for one instance; a shared store is needed when there are several. */
export function isRateLimited(key: string, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) hits.clear();
  return recent.length > MAX_HITS;
}

/**
 * The address a request came from, for rate limiting.
 *
 * `X-Forwarded-For` is a list each proxy appends to; everything a client sends in it
 * is to the left of what our own proxies add. So only the entries added by proxies we
 * run can be believed: with one proxy in front (TRUSTED_PROXY_HOPS=1, the default)
 * that is the last entry. A client cannot choose it, so it cannot dodge the limit by
 * inventing addresses. With no proxy at all (TRUSTED_PROXY_HOPS=0) the header is
 * entirely the client's and is ignored: every request counts against one shared limit.
 */
export function clientAddress(headers: Headers, hops = Number(process.env.TRUSTED_PROXY_HOPS ?? 1)): string {
  const chain = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (!Number.isInteger(hops) || hops <= 0 || chain.length === 0) return "direct";
  return chain[Math.max(0, chain.length - hops)];
}
