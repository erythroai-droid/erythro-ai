import { createHmac, randomInt, timingSafeEqual } from 'crypto'

import { otpPepper } from './config'

/**
 * Temporary email verification — deliberately *not* an account system.
 *
 * Everything is stateless and signed with `CONSULT_OTP_PEPPER`: Vercel spreads
 * `request-otp` and `verify-otp` across isolates, so an in-memory code store
 * would lose codes at random. The challenge cookie carries
 * `HMAC(email + code + exp)`; verification recomputes the digest from the
 * submitted code, so the plaintext code never leaves the mailbox.
 *
 * Remove this module together with `/api/consult/request-otp` and
 * `verify-otp` once real authentication lands (`CONSULT_EMAIL_OTP=0`).
 */

export const OTP_CHALLENGE_COOKIE = 'consult_otp'
export const OTP_VERIFIED_COOKIE = 'consult_verified'

const OTP_TTL_MS = 10 * 60 * 1000
const VERIFIED_TTL_MS = 24 * 60 * 60 * 1000
const RESEND_INTERVAL_MS = 60 * 1000
const MAX_ATTEMPTS = 5

/** Mailboxes that cannot receive a human reply — rejected before sending. */
const ROLE_LOCALPARTS = new Set([
  'noreply',
  'no-reply',
  'donotreply',
  'do-not-reply',
  'mailer-daemon',
  'postmaster',
  'bounce',
  'bounces',
  'abuse',
])

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase().slice(0, 254)
}

export function isRoleMailbox(email: string): boolean {
  const localPart = normalizeEmail(email).split('@')[0] || ''
  return ROLE_LOCALPARTS.has(localPart)
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

function sign(payload: string, pepper: string): string {
  return createHmac('sha256', pepper).update(payload).digest('base64url')
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function encode(value: object, pepper: string): string {
  const payload = Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${payload}.${sign(payload, pepper)}`
}

function decode<T>(token: string | undefined, pepper: string): T | null {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const payload = token.slice(0, dot)
  const signature = token.slice(dot + 1)
  if (!safeEqual(sign(payload, pepper), signature)) return null
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as T
  } catch {
    return null
  }
}

type OtpChallenge = {
  email: string
  /** HMAC of email + code + exp; the code itself is never stored. */
  digest: string
  exp: number
  issuedAt: number
  attempts: number
}

type VerifiedSession = {
  email: string
  exp: number
  /** UTC day bucket for the per-email daily message ceiling. */
  day: string
  used: number
  sessionId?: number
}

export function dayBucket(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10)
}

function codeDigest(email: string, code: string, exp: number, pepper: string): string {
  return sign(`${email}|${code}|${exp}`, pepper)
}

export function createOtpChallenge(
  email: string,
  code: string,
  now = Date.now(),
): { cookie: string; expiresAt: number } | null {
  const pepper = otpPepper()
  if (!pepper) return null
  const exp = now + OTP_TTL_MS
  const challenge: OtpChallenge = {
    email: normalizeEmail(email),
    digest: codeDigest(normalizeEmail(email), code, exp, pepper),
    exp,
    issuedAt: now,
    attempts: 0,
  }
  return { cookie: encode(challenge, pepper), expiresAt: exp }
}

export type OtpVerifyOutcome =
  | { ok: true; email: string }
  | { ok: false; reason: 'expired' | 'invalid' | 'too_many_attempts'; cookie?: string }

export function verifyOtpChallenge(
  cookieValue: string | undefined,
  code: string,
  now = Date.now(),
): OtpVerifyOutcome {
  const pepper = otpPepper()
  if (!pepper) return { ok: false, reason: 'invalid' }
  const challenge = decode<OtpChallenge>(cookieValue, pepper)
  if (!challenge) return { ok: false, reason: 'expired' }
  if (challenge.exp <= now) return { ok: false, reason: 'expired' }
  if (challenge.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'too_many_attempts' }

  const expected = codeDigest(challenge.email, code.trim(), challenge.exp, pepper)
  if (!safeEqual(expected, challenge.digest)) {
    const next: OtpChallenge = { ...challenge, attempts: challenge.attempts + 1 }
    return { ok: false, reason: 'invalid', cookie: encode(next, pepper) }
  }
  return { ok: true, email: challenge.email }
}

/** Blocks resend spam even when the IP limiter has room. */
export function canResend(cookieValue: string | undefined, now = Date.now()): boolean {
  const pepper = otpPepper()
  if (!pepper) return false
  const challenge = decode<OtpChallenge>(cookieValue, pepper)
  if (!challenge) return true
  return now - challenge.issuedAt >= RESEND_INTERVAL_MS
}

export function createVerifiedCookie(
  email: string,
  now = Date.now(),
  carry?: { used?: number; sessionId?: number },
): string | null {
  const pepper = otpPepper()
  if (!pepper) return null
  const session: VerifiedSession = {
    email: normalizeEmail(email),
    exp: now + VERIFIED_TTL_MS,
    day: dayBucket(now),
    used: carry?.used ?? 0,
    ...(carry?.sessionId ? { sessionId: carry.sessionId } : {}),
  }
  return encode(session, pepper)
}

export type VerifiedState = {
  email: string
  used: number
  sessionId: number | null
}

export function readVerifiedCookie(
  cookieValue: string | undefined,
  now = Date.now(),
): VerifiedState | null {
  const pepper = otpPepper()
  if (!pepper) return null
  const session = decode<VerifiedSession>(cookieValue, pepper)
  if (!session || session.exp <= now) return null
  // Counter resets at UTC midnight without invalidating the verification.
  const used = session.day === dayBucket(now) ? session.used : 0
  return { email: session.email, used, sessionId: session.sessionId ?? null }
}

/** Re-issues the cookie with an incremented daily counter / attached session. */
export function advanceVerifiedCookie(
  state: VerifiedState,
  patch: { usedDelta?: number; sessionId?: number | null },
  now = Date.now(),
): string | null {
  return createVerifiedCookie(state.email, now, {
    used: state.used + (patch.usedDelta ?? 0),
    sessionId: patch.sessionId ?? state.sessionId ?? undefined,
  })
}

export const OTP_LIMITS = {
  ttlMs: OTP_TTL_MS,
  verifiedTtlMs: VERIFIED_TTL_MS,
  resendIntervalMs: RESEND_INTERVAL_MS,
  maxAttempts: MAX_ATTEMPTS,
}
