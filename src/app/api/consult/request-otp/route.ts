import { NextRequest, NextResponse } from 'next/server'

import { sendConsultantMail } from '@/lib/contactNotification'
import { EMAIL_RE } from '@/lib/contactFormValidation'
import {
  canResend,
  consultLocale,
  consumeRateLimit,
  createOtpChallenge,
  escapeHtml,
  generateOtpCode,
  getRequestIp,
  hashIp,
  isOtpEnabled,
  isProductionRuntime,
  isRoleMailbox,
  normalizeEmail,
  otpIpQuotaConfig,
  otpPepper,
  OTP_CHALLENGE_COOKIE,
  OTP_LIMITS,
  serializeConsultCookie,
  type ConsultLocale,
} from '@/lib/consultant'
import { readTurnstileToken, verifyTurnstileToken } from '@/lib/turnstile'

export const runtime = 'nodejs'
export const maxDuration = 20

/**
 * Temporary email verification for the chat — not an account system.
 * Delete this route together with `verify-otp` when real auth lands
 * (`CONSULT_EMAIL_OTP=0`).
 *
 * The response is always `ok` after the format check so the endpoint cannot be
 * used to enumerate which addresses exist.
 */

const SUBJECT: Record<ConsultLocale, string> = {
  ru: 'Код подтверждения чата Erythro.ai',
  en: 'Erythro.ai chat verification code',
  he: 'קוד אימות לצ׳אט Erythro.ai',
}

const BODY: Record<ConsultLocale, (code: string, minutes: number) => string> = {
  ru: (code, minutes) =>
    [
      `Код подтверждения: ${code}`,
      '',
      `Введите его в чате на erythro.ai. Код действует ${minutes} минут.`,
      'Если вы не запрашивали код — просто проигнорируйте это письмо.',
    ].join('\n'),
  en: (code, minutes) =>
    [
      `Your verification code: ${code}`,
      '',
      `Enter it in the chat on erythro.ai. The code is valid for ${minutes} minutes.`,
      'If you did not request it, ignore this email.',
    ].join('\n'),
  he: (code, minutes) =>
    [
      `קוד האימות שלך: ${code}`,
      '',
      `הזינו אותו בצ׳אט באתר erythro.ai. הקוד תקף ${minutes} דקות.`,
      'אם לא ביקשתם קוד, אפשר להתעלם מהמייל.',
    ].join('\n'),
}

export async function POST(request: NextRequest) {
  if (!isOtpEnabled()) {
    return NextResponse.json({ message: 'Verification disabled' }, { status: 404 })
  }
  if (!otpPepper()) {
    // Without a pepper nothing can be signed; failing loudly beats a fake ok.
    if (isProductionRuntime()) {
      return NextResponse.json({ message: 'Verification unavailable' }, { status: 503 })
    }
    return NextResponse.json({ message: 'CONSULT_OTP_PEPPER is not set' }, { status: 503 })
  }

  const ip = getRequestIp(request)
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const turnstile = await verifyTurnstileToken({
    token: readTurnstileToken(body),
    action: 'consult',
    remoteip: ip === 'unknown' ? undefined : ip,
  })
  if (!turnstile.ok) {
    return NextResponse.json({ message: turnstile.message }, { status: turnstile.status })
  }

  const payload = (body || {}) as Record<string, unknown>
  const locale = consultLocale(payload.locale)
  const email = normalizeEmail(typeof payload.email === 'string' ? payload.email : '')

  if (!EMAIL_RE.test(email) || isRoleMailbox(email)) {
    return NextResponse.json({ message: 'invalid_email' }, { status: 400 })
  }

  if (!canResend(request.cookies.get(OTP_CHALLENGE_COOKIE)?.value)) {
    return NextResponse.json(
      { message: 'resend_too_soon' },
      { status: 429, headers: { 'Retry-After': String(OTP_LIMITS.resendIntervalMs / 1000) } },
    )
  }

  const quotaConfig = otpIpQuotaConfig()
  const perIp = consumeRateLimit(`consult-otp-ip:${hashIp(ip)}`, quotaConfig)
  const perEmail = consumeRateLimit(`consult-otp-mail:${hashIp(email)}`, quotaConfig)
  if (!perIp.ok || !perEmail.ok) {
    const retry = Math.max(perIp.retryAfterSec, perEmail.retryAfterSec)
    return NextResponse.json(
      { message: 'too_many_codes' },
      { status: 429, headers: { 'Retry-After': String(retry) } },
    )
  }

  const code = generateOtpCode()
  const challenge = createOtpChallenge(email, code)
  if (!challenge) {
    return NextResponse.json({ message: 'Verification unavailable' }, { status: 503 })
  }

  const minutes = Math.round(OTP_LIMITS.ttlMs / 60_000)
  const text = BODY[locale](code, minutes)
  const sent = await sendConsultantMail({
    to: email,
    subject: SUBJECT[locale],
    text,
    html: `<pre style="white-space:pre-wrap;font-family:inherit;font-size:16px">${escapeHtml(text)}</pre>`,
  })

  if (!sent.sent) {
    console.error('[api/consult/request-otp] mail failed:', sent.reason)
    return NextResponse.json({ message: 'mail_failed' }, { status: 502 })
  }

  const response = NextResponse.json({ ok: true, expiresInSec: OTP_LIMITS.ttlMs / 1000 })
  response.headers.append(
    'Set-Cookie',
    serializeConsultCookie(OTP_CHALLENGE_COOKIE, challenge.cookie, OTP_LIMITS.ttlMs / 1000),
  )
  return response
}
