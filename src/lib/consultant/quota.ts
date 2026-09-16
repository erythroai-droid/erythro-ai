import { createHash, createHmac, timingSafeEqual } from 'crypto'

import { otpPepper, readPositiveInt } from './config'

/**
 * Consultant-specific throttling. Modelled on `src/lib/contactRateLimit.ts`
 * but deliberately separate: the contact form can be opened up for QA
 * (`AUDIT_INTAKE_LIMITS_OPEN_FOR_QA`) and the chat must not inherit that.
 *
 * Anonymous quota is counted twice — in a signed httpOnly cookie and in an
 * IP-keyed sliding window. Dropping the cookie resets only the cookie half.
 */

export const ANON_COOKIE = 'consult_anon'

type RateBucket = { hits: number[] }
type RateStore = Map<string, RateBucket>

declare global {
  // Survives warm serverless invocations inside one isolate.
  var __erythroConsultRateLimit: RateStore | undefined
}

function store(): RateStore {
  if (!globalThis.__erythroConsultRateLimit) {
    globalThis.__erythroConsultRateLimit = new Map()
  }
  return globalThis.__erythroConsultRateLimit
}

export type RateLimitResult = {
  ok: boolean
  limit: number
  remaining: number
  retryAfterSec: number
}

/** Burst guard on `POST /api/consult`: default 20 requests / minute / IP. */
export function consultRateLimitConfig(): { limit: number; windowMs: number } {
  return {
    limit: readPositiveInt(process.env.CONSULT_RATE_LIMIT_MAX, 20),
    windowMs: readPositiveInt(process.env.CONSULT_RATE_LIMIT_WINDOW_MS, 60_000),
  }
}

/** Anonymous ceiling per IP over 24h — backstop for a dropped cookie. */
export function anonIpQuotaConfig(limit: number): { limit: number; windowMs: number } {
  return {
    limit: readPositiveInt(process.env.CONSULT_ANON_IP_MAX, Math.max(limit * 3, limit)),
    windowMs: readPositiveInt(process.env.CONSULT_ANON_WINDOW_MS, 24 * 60 * 60 * 1000),
  }
}

/** OTP emails per IP per hour. */
export function otpIpQuotaConfig(): { limit: number; windowMs: number } {
  return {
    limit: readPositiveInt(process.env.CONSULT_OTP_IP_MAX, 3),
    windowMs: readPositiveInt(process.env.CONSULT_OTP_WINDOW_MS, 60 * 60 * 1000),
  }
}

export function consumeRateLimit(
  key: string,
  config: { limit: number; windowMs: number },
  now = Date.now(),
): RateLimitResult {
  const { limit, windowMs } = config
  const bucket = store().get(key) || { hits: [] }
  const cutoff = now - windowMs
  bucket.hits = bucket.hits.filter((t) => t > cutoff)

  if (bucket.hits.length >= limit) {
    store().set(key, bucket)
    const oldest = bucket.hits[0] || now
    return {
      ok: false,
      limit,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    }
  }

  bucket.hits.push(now)
  store().set(key, bucket)

  if (store().size > 5000) {
    for (const [k, b] of store()) {
      b.hits = b.hits.filter((t) => t > cutoff)
      if (!b.hits.length) store().delete(k)
    }
  }

  return { ok: true, limit, remaining: Math.max(0, limit - bucket.hits.length), retryAfterSec: 0 }
}

/** IPs are hashed before they become cache keys so raw addresses stay out of memory dumps. */
export function hashIp(ip: string): string {
  return createHash('sha256')
    .update(`${ip}|${otpPepper() || 'consult'}`)
    .digest('base64url')
    .slice(0, 22)
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

  return headers.get('x-real-ip')?.trim()?.slice(0, 64) || 'unknown'
}

type AnonCounter = { used: number; resetAt: number }

function signAnon(payload: string, pepper: string): string {
  return createHmac('sha256', pepper).update(payload).digest('base64url')
}

export function readAnonCookie(
  cookieValue: string | undefined,
  now = Date.now(),
): AnonCounter {
  const pepper = otpPepper()
  const fresh: AnonCounter = { used: 0, resetAt: now + anonIpQuotaConfig(1).windowMs }
  if (!pepper || !cookieValue) return fresh

  const dot = cookieValue.lastIndexOf('.')
  if (dot <= 0) return fresh
  const payload = cookieValue.slice(0, dot)
  const signature = cookieValue.slice(dot + 1)
  const expected = signAnon(payload, pepper)
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return fresh
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AnonCounter
    if (!Number.isFinite(parsed.used) || parsed.resetAt <= now) return fresh
    return { used: Math.max(0, Math.floor(parsed.used)), resetAt: parsed.resetAt }
  } catch {
    return fresh
  }
}

export function writeAnonCookie(counter: AnonCounter): string | null {
  const pepper = otpPepper()
  if (!pepper) return null
  const payload = Buffer.from(JSON.stringify(counter)).toString('base64url')
  return `${payload}.${signAnon(payload, pepper)}`
}
