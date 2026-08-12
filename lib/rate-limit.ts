/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Note: state lives in the module scope of a single serverless instance, so it
 * resets on cold starts and is not shared between concurrent instances. That's
 * enough to stop naive floods against the contact form; if abuse ever becomes a
 * real problem, swap this for a shared store (Upstash Redis, Vercel KV).
 */

type Bucket = number[]

const buckets = new Map<string, Bucket>()

// Drop buckets that can no longer contain a live hit, so the map doesn't grow
// without bound across the lifetime of a warm instance.
function prune(now: number, windowMs: number) {
  for (const [key, hits] of buckets) {
    if (hits.length === 0 || now - hits[hits.length - 1] > windowMs) {
      buckets.delete(key)
    }
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()

  if (buckets.size > 5000) prune(now, windowMs)

  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)

  if (hits.length >= max) {
    const retryAfterMs = windowMs - (now - hits[0])
    buckets.set(key, hits)
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    }
  }

  hits.push(now)
  buckets.set(key, hits)

  return { allowed: true, remaining: max - hits.length, retryAfterSeconds: 0 }
}
