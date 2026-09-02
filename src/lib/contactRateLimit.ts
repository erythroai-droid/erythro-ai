type RateBucket = {
  hits: number[]
}

export type RateLimitResult = {
  ok: boolean
  limit: number
  remaining: number
  retryAfterSec: number
}

type RateLimitStore = Map<string, RateBucket>

declare global {
  // Persist across warm serverless invocations in the same isolate.
  // eslint-disable-next-line no-var
  var __erythroContactRateLimit: RateLimitStore | undefined
}

function getStore(): RateLimitStore {
  if (!globalThis.__erythroContactRateLimit) {
    globalThis.__erythroContactRateLimit = new Map()
  }
  return globalThis.__erythroContactRateLimit
}

function readPositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

/** Defaults: 5 submissions / 60s / IP. Override with env on Vercel. */
export function contactRateLimitConfig(): { limit: number; windowMs: number } {
  return {
    limit: readPositiveInt(process.env.CONTACT_RATE_LIMIT_MAX, 5),
    windowMs: readPositiveInt(process.env.CONTACT_RATE_LIMIT_WINDOW_MS, 60_000),
  }
}

export function getRequestIp(request: Request): string {
  const headers = request.headers
  const cf = headers.get('cf-connecting-ip')?.trim()
  if (cf) return cf.slice(0, 64)

  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first.slice(0, 64)
  }

  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) return realIp.slice(0, 64)

  return 'unknown'
}

/**
 * Sliding-window rate limit (best-effort in-memory).
 * Complements Cloudflare edge rules; not a shared store across all Vercel isolates.
 */
export function consumeContactRateLimit(
  key: string,
  now = Date.now(),
  store = getStore(),
  config?: { limit: number; windowMs: number },
): RateLimitResult {
  const { limit, windowMs } = config || contactRateLimitConfig()
  const bucket = store.get(key) || { hits: [] }
  const cutoff = now - windowMs
  bucket.hits = bucket.hits.filter((t) => t > cutoff)

  if (bucket.hits.length >= limit) {
    store.set(key, bucket)
    const oldest = bucket.hits[0] || now
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
    return { ok: false, limit, remaining: 0, retryAfterSec }
  }

  bucket.hits.push(now)
  store.set(key, bucket)

  // Opportunistic cleanup to avoid unbounded growth in long-lived isolates.
  if (store.size > 5000) {
    for (const [k, b] of store) {
      b.hits = b.hits.filter((t) => t > cutoff)
      if (!b.hits.length) store.delete(k)
    }
  }

  return {
    ok: true,
    limit,
    remaining: Math.max(0, limit - bucket.hits.length),
    retryAfterSec: 0,
  }
}

/** Test helper — clears the in-memory store. */
export function resetContactRateLimitStoreForTests(): void {
  getStore().clear()
}
