import { createHash } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { ANALYTICS_META_PIXEL_ID } from '@/lib/analyticsEager'
import { CONSENT_COOKIE, CONSENT_DECLINED } from '@/lib/privacyConsent'

const GRAPH_API_VERSION = 'v24.0'
const SEND_TIMEOUT_MS = 5_000

export type MetaLeadEvent = {
  /** Same value as the browser Pixel `eventID` (submission id) — Meta deduplicates on it. */
  eventId: string
  contentName: string
  email?: string | null
  phone?: string | null
  ip?: string | null
  userAgent?: string | null
  fbp?: string | null
  fbc?: string | null
  eventSourceUrl?: string | null
}

export type MetaCapiResult = { ok: true } | { ok: false; reason: string }

function accessToken(): string {
  return process.env.META_CAPI_ACCESS_TOKEN?.trim() || ''
}

export function isMetaCapiConfigured(): boolean {
  return Boolean(accessToken())
}

/** Visitor explicitly declined cookies in the banner. */
export function hasDeclinedConsent(request: NextRequest): boolean {
  return request.cookies.get(CONSENT_COOKIE)?.value === CONSENT_DECLINED
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function hashedEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase()
  return normalized ? sha256(normalized) : null
}

/** Meta expects digits only with the country code (E.164 without `+`). */
function hashedPhone(phone: string | null | undefined): string | null {
  const digits = phone?.replace(/\D/g, '') || ''
  return digits.length >= 7 ? sha256(digits) : null
}

/** `_fbc` cookie, or one built from `fbclid` in the page URL when the cookie was never set. */
function resolveFbc(cookieFbc: string | undefined, pageUrl: string | null): string | null {
  if (cookieFbc) return cookieFbc
  if (!pageUrl) return null
  try {
    const fbclid = new URL(pageUrl).searchParams.get('fbclid')
    return fbclid ? `fb.1.${Date.now()}.${fbclid}` : null
  } catch {
    return null
  }
}

/** Reads click ids, UA and page URL from the form POST (same-origin Referer carries the full URL). */
export function metaLeadEventFromRequest(
  request: NextRequest,
  input: Pick<MetaLeadEvent, 'eventId' | 'contentName' | 'email' | 'phone' | 'ip'>,
): MetaLeadEvent {
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  const eventSourceUrl = referer || (host ? `https://${host}/` : null)
  return {
    ...input,
    userAgent: request.headers.get('user-agent'),
    fbp: request.cookies.get('_fbp')?.value || null,
    fbc: resolveFbc(request.cookies.get('_fbc')?.value, referer),
    eventSourceUrl,
  }
}

/** Server-side Meta `Lead` (Conversions API). No-op when `META_CAPI_ACCESS_TOKEN` is unset. */
export async function sendMetaLeadEvent(event: MetaLeadEvent): Promise<MetaCapiResult> {
  const token = accessToken()
  if (!token) return { ok: false, reason: 'META_CAPI_ACCESS_TOKEN is not set' }

  const em = hashedEmail(event.email)
  const ph = hashedPhone(event.phone)
  const userData: Record<string, unknown> = {
    ...(em ? { em: [em] } : {}),
    ...(ph ? { ph: [ph] } : {}),
    ...(event.ip && event.ip !== 'unknown' ? { client_ip_address: event.ip } : {}),
    ...(event.userAgent ? { client_user_agent: event.userAgent } : {}),
    ...(event.fbp ? { fbp: event.fbp } : {}),
    ...(event.fbc ? { fbc: event.fbc } : {}),
  }

  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim()
  const body = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: 'website',
        ...(event.eventSourceUrl ? { event_source_url: event.eventSourceUrl } : {}),
        user_data: userData,
        custom_data: { content_name: event.contentName },
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
    access_token: token,
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${ANALYTICS_META_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      },
    )
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, reason: `HTTP ${res.status} ${text.slice(0, 300)}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) }
  }
}
