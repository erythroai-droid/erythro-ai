import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { verifyPaymentReturn } from '@/lib/payments/returnSig'
import { auditReportRateLimitConfig, consumeContactRateLimit, getRequestIp } from '@/lib/contactRateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Signed read of payment status for the return page.
 * No customer fields. The signature is the HMAC on the success URL.
 */
export async function GET(request: NextRequest) {
  const ip = getRequestIp(request)
  const limited = consumeContactRateLimit(`payment-status:${ip}`, Date.now(), undefined, auditReportRateLimitConfig())
  if (!limited.ok) {
    return NextResponse.json(
      { status: 'unknown' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } },
    )
  }

  const id = request.nextUrl.searchParams.get('id')
  const sig = request.nextUrl.searchParams.get('sig')
  if (!verifyPaymentReturn(id, sig)) {
    return NextResponse.json({ status: 'unknown' }, { status: 404 })
  }

  try {
    const payload = await getPayload({ config })
    const doc = await payload.findByID({
      collection: 'contact-submissions',
      id: Number(id),
      depth: 0,
      overrideAccess: true,
    })
    const status = doc?.paymentStatus
    const known = status === 'paid' || status === 'pending' || status === 'failed' || status === 'refunded'
    return NextResponse.json(
      { status: known ? status : 'unknown' },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[api/payment/status]', err instanceof Error ? err.message : 'error')
    return NextResponse.json({ status: 'pending' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
