import { NextRequest, NextResponse } from 'next/server'

import {
  clearConsultCookie,
  consumeRateLimit,
  createVerifiedCookie,
  getRequestIp,
  hashIp,
  isOtpEnabled,
  otpPepper,
  OTP_CHALLENGE_COOKIE,
  OTP_LIMITS,
  OTP_VERIFIED_COOKIE,
  serializeConsultCookie,
  verifyOtpChallenge,
} from '@/lib/consultant'

export const runtime = 'nodejs'

/**
 * Exchanges the six digits for a signed `consult_verified` cookie (~24 h).
 * There is no users table: the cookie *is* the verification, and it also
 * carries the daily message counter.
 *
 * The code is submitted from a dedicated widget field, never as a chat
 * message, so it stays out of the transcript and out of Gemini's logs.
 */
export async function POST(request: NextRequest) {
  if (!isOtpEnabled()) {
    return NextResponse.json({ message: 'Verification disabled' }, { status: 404 })
  }
  if (!otpPepper()) {
    return NextResponse.json({ message: 'Verification unavailable' }, { status: 503 })
  }

  const ip = getRequestIp(request)
  // Brute-force guard independent of the per-challenge attempt counter, which
  // a client could drop along with the cookie.
  const attempts = consumeRateLimit(`consult-otp-verify:${hashIp(ip)}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  })
  if (!attempts.ok) {
    return NextResponse.json(
      { message: 'too_many_attempts' },
      { status: 429, headers: { 'Retry-After': String(attempts.retryAfterSec) } },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const raw = (body || {}) as Record<string, unknown>
  const code = (typeof raw.code === 'string' ? raw.code : '').replace(/\D/g, '').slice(0, 6)
  if (code.length !== 6) {
    return NextResponse.json({ message: 'invalid_code' }, { status: 400 })
  }

  const outcome = verifyOtpChallenge(request.cookies.get(OTP_CHALLENGE_COOKIE)?.value, code)
  if (!outcome.ok) {
    // Same shape for every failure — no hint about which address was used.
    const response = NextResponse.json({ message: 'invalid_code' }, { status: 400 })
    if (outcome.cookie) {
      response.headers.append(
        'Set-Cookie',
        serializeConsultCookie(OTP_CHALLENGE_COOKIE, outcome.cookie, OTP_LIMITS.ttlMs / 1000),
      )
    } else {
      response.headers.append('Set-Cookie', clearConsultCookie(OTP_CHALLENGE_COOKIE))
    }
    return response
  }

  const verified = createVerifiedCookie(outcome.email)
  if (!verified) {
    return NextResponse.json({ message: 'Verification unavailable' }, { status: 503 })
  }

  const response = NextResponse.json({ ok: true, email: outcome.email })
  response.headers.append(
    'Set-Cookie',
    serializeConsultCookie(OTP_VERIFIED_COOKIE, verified, OTP_LIMITS.verifiedTtlMs / 1000),
  )
  response.headers.append('Set-Cookie', clearConsultCookie(OTP_CHALLENGE_COOKIE))
  return response
}
