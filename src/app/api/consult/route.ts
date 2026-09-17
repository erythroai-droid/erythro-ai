import { NextRequest } from 'next/server'

import {
  ANON_COOKIE,
  advanceVerifiedCookie,
  consultLocale,
  consultNoticeResponse,
  consultRateLimitConfig,
  consumeRateLimit,
  createConsultHandler,
  getRequestIp,
  hashIp,
  isOtpEnabled,
  isConsultantConfigured,
  OTP_VERIFIED_COOKIE,
  anonIpQuotaConfig,
  readAnonCookie,
  readVerifiedCookie,
  serializeConsultCookie,
  translateViaService,
  writeAnonCookie,
  type ConsultLocale,
  type ConsultMessage,
} from '@/lib/consultant'
import {
  getCachedConsultantKnowledge,
  getCachedConsultantRules,
  fetchConsultantCopy,
} from '@/lib/consultantKnowledge.server'
import {
  escalateTech,
  identifyClient,
  persistSession,
  resolveConsultIdentity,
  submitBrief,
} from '@/lib/consultantStore.server'
import { readTurnstileToken, verifyTurnstileToken } from '@/lib/turnstile'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_MESSAGES = 40
const MAX_TEXT = 4000

/**
 * AI consultant chat.
 *
 * Transport concerns live here (captcha, IP limits, anonymous quota, signed
 * cookies); the conversation itself is handled by the portable module in
 * `src/lib/consultant/`. Deliberately *not* wired to
 * `AUDIT_INTAKE_LIMITS_OPEN_FOR_QA`: opening the contact form for QA must not
 * open the chat.
 */

type IncomingMessage = { role?: unknown; parts?: unknown; text?: unknown }

function parseMessages(raw: unknown): ConsultMessage[] {
  if (!Array.isArray(raw)) return []
  return raw
    .slice(-MAX_MESSAGES)
    .map((entry: IncomingMessage): ConsultMessage | null => {
      const role = entry?.role === 'assistant' ? 'assistant' : 'user'
      // Accept a bare `text` too so a minimal host does not have to build parts.
      const parts = Array.isArray(entry?.parts)
        ? entry.parts
            .filter(
              (part): part is { type: string; text: string } =>
                Boolean(part) &&
                typeof part === 'object' &&
                (part as { type?: unknown }).type === 'text' &&
                typeof (part as { text?: unknown }).text === 'string',
            )
            .map((part) => ({ type: 'text' as const, text: part.text.slice(0, MAX_TEXT) }))
        : typeof entry?.text === 'string'
          ? [{ type: 'text' as const, text: entry.text.slice(0, MAX_TEXT) }]
          : []
      const filled = parts.filter((part) => part.text.trim().length > 0)
      return filled.length ? { role, parts: filled } : null
    })
    .filter((message): message is ConsultMessage => message !== null)
}

export async function POST(request: NextRequest) {
  if (!isConsultantConfigured()) {
    return consultNoticeResponse('unconfigured', 503)
  }

  const ip = getRequestIp(request)
  const burst = consumeRateLimit(`consult:${hashIp(ip)}`, consultRateLimitConfig())
  if (!burst.ok) {
    return consultNoticeResponse('rate_limited', 429)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ message: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const payload = (body || {}) as Record<string, unknown>
  const locale: ConsultLocale = consultLocale(payload.locale)
  const copy = await fetchConsultantCopy(locale)
  if (!copy.enabled) {
    return consultNoticeResponse('unconfigured', 503)
  }

  const turnstile = await verifyTurnstileToken({
    token: readTurnstileToken(body),
    action: 'consult',
    remoteip: ip === 'unknown' ? undefined : ip,
  })
  if (!turnstile.ok) {
    return new Response(JSON.stringify({ message: turnstile.message }), {
      status: turnstile.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const messages = parseMessages(payload.messages)
  if (!messages.length) {
    return new Response(JSON.stringify({ message: 'No messages' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const otpEnabled = isOtpEnabled()
  const rules = await getCachedConsultantRules(locale)
  const verified = readVerifiedCookie(request.cookies.get(OTP_VERIFIED_COOKIE)?.value)
  const cookies: string[] = []

  if (verified) {
    if (verified.used >= rules.verifiedMessageLimit) {
      return consultNoticeResponse('daily_quota_exhausted', 429)
    }
    const next = advanceVerifiedCookie(verified, { usedDelta: 1 })
    if (next) cookies.push(serializeConsultCookie(OTP_VERIFIED_COOKIE, next, 24 * 60 * 60))
  } else if (otpEnabled) {
    const counter = readAnonCookie(request.cookies.get(ANON_COOKIE)?.value)
    const ipQuota = consumeRateLimit(
      `consult-anon:${hashIp(ip)}`,
      anonIpQuotaConfig(rules.anonMessageLimit),
    )
    if (counter.used >= rules.anonMessageLimit || !ipQuota.ok) {
      return consultNoticeResponse('otp_required', 200)
    }
    const nextCookie = writeAnonCookie({ used: counter.used + 1, resetAt: counter.resetAt })
    if (nextCookie) {
      cookies.push(
        serializeConsultCookie(
          ANON_COOKIE,
          nextCookie,
          Math.max(60, Math.floor((counter.resetAt - Date.now()) / 1000)),
        ),
      )
    }
  }

  const identity = verified
    ? { verifiedEmail: verified.email, ...(await resolveConsultIdentity(verified.email)) }
    : { verifiedEmail: null, sessionId: null, phone: null }

  const handler = createConsultHandler({
    getKnowledge: getCachedConsultantKnowledge,
    getRules: getCachedConsultantRules,
    resolveIdentity: resolveConsultIdentity,
    translate: translateViaService,
    identifyClient: (input) => identifyClient({ ...input, ip }),
    persistSession,
    escalateTech,
    submitBrief,
  })

  const response = await handler.respond({ locale, messages, identity, otpEnabled })

  // Quota counters ride along with the stream headers; they are committed the
  // moment the request is accepted, not when the answer finishes.
  if (!cookies.length) return response
  const headers = new Headers(response.headers)
  for (const cookie of cookies) headers.append('Set-Cookie', cookie)
  return new Response(response.body, { status: response.status, headers })
}
