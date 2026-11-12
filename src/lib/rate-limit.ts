/**
 * Fixed-window rate limiter kept in memory.
 * Limitation (documented in SECURITY.md): on serverless platforms each instance
 * has its own memory, so limits are per-instance. For production, swap this for a
 * shared store such as Upstash Redis — the interface stays the same.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (b.count >= limit) return { ok: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  b.count++;
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }
  return { ok: true, remaining: limit - b.count, retryAfter: 0 };
}

export function clientIp(headers: Headers) {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export function _resetRateLimits() {
  buckets.clear();
}
