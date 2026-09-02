import { NextRequest, NextResponse } from 'next/server'
import { consumeContactRateLimit, getRequestIp } from '@/lib/contactRateLimit'
import { checkWebsiteReachable } from '@/lib/checkWebsite'
import { sanitizePlainText } from '@/lib/contactSanitize'

export const runtime = 'nodejs'

/**
 * Blur-check for audit website field: DNS to a public IP.
 * Rate-limited separately from form POST (same helper, different key).
 */
export async function POST(request: NextRequest) {
  const ip = getRequestIp(request)
  const limited = consumeContactRateLimit(`website-check:${ip}`, Date.now(), undefined, {
    limit: 30,
    windowMs: 60_000,
  })
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, reason: 'rate_limited' },
      {
        status: 429,
        headers: { 'Retry-After': String(limited.retryAfterSec) },
      },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, reason: 'format' }, { status: 400 })
  }

  const raw =
    body && typeof body === 'object' && !Array.isArray(body)
      ? sanitizePlainText((body as { website?: unknown }).website, 500)
      : ''

  const result = await checkWebsiteReachable(raw)
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 200 })
  }
  return NextResponse.json({ ok: true, hostname: result.hostname })
}
