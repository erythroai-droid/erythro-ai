import { NextRequest, NextResponse } from 'next/server'
import { consumeContactRateLimit, getRequestIp } from '@/lib/contactRateLimit'
import { checkWebsiteReachable } from '@/lib/checkWebsite'
import { sanitizeWebsiteInput } from '@/lib/contactSanitize'
import { normalizeAuditWebsite } from '@/lib/auditFormValidation'
import { AUDIT_LAB_IP, checkLabAccess, isPaidAuditCheckoutSlug } from '@/lib/auditLabAccess'

export const runtime = 'nodejs'

/**
 * Blur-check for audit website field: DNS to a public IP.
 * Paid plans also ask the worker whether the lab IP gets a bot challenge (PIT-150).
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

  const fields = body && typeof body === 'object' && !Array.isArray(body)
    ? (body as { website?: unknown; planSlug?: unknown })
    : {}
  const raw = sanitizeWebsiteInput(fields.website, 500)

  const result = await checkWebsiteReachable(raw)
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 200 })
  }

  // The lab must see the site before the client pays. A worker that does not answer does not
  // block the checkout — the paid run then waits for access instead.
  if (isPaidAuditCheckoutSlug(String(fields.planSlug || ''))) {
    const access = await checkLabAccess(normalizeAuditWebsite(raw))
    if (access.checked && access.blocked) {
      return NextResponse.json(
        { ok: false, reason: 'bot_protected', protection: access.protection, labIp: AUDIT_LAB_IP },
        { status: 200 },
      )
    }
    if (!access.checked) console.warn(`[check-website] lab access unknown: ${access.reason}`)
  }
  return NextResponse.json({ ok: true, hostname: result.hostname })
}
