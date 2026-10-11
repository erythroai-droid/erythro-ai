import { NextRequest, NextResponse } from 'next/server'
import { fulfillMakeGrowPaid } from '@/lib/payments/fulfillPayment'
import { makePaidAuthorized, makePaymentSecret } from '@/lib/payments/makeGrow'

export const runtime = 'nodejs'
export const maxDuration = 30

function shekels(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const amount = Number(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(amount) ? amount : null
}

/**
 * Make calls this after Grow Approve Transaction succeeds.
 * Header `x-make-payment-secret` must match MAKE_PAYMENT_SECRET.
 * Body is the Grow notify fields: cField1, transactionId, sum, statusCode 2.
 */
export async function POST(request: NextRequest) {
  if (!makePaymentSecret()) {
    console.error('[api/payment/make-paid] MAKE_PAYMENT_SECRET is not set')
    return NextResponse.json({ ok: false, reason: 'not_configured' }, { status: 503 })
  }
  if (!makePaidAuthorized(request.headers.get('x-make-payment-secret'))) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 })
  }

  const submissionId = Number(String(body.submissionId ?? body.cField1 ?? '').trim())
  const transactionId = String(body.transactionId ?? '').trim()
  const statusCode = String(body.statusCode ?? '').trim()
  const sum = shekels(body.sum)
  if (!Number.isInteger(submissionId) || submissionId <= 0 || !transactionId || sum == null) {
    return NextResponse.json({ ok: false, reason: 'missing_fields' }, { status: 400 })
  }
  if (statusCode !== '2') {
    return NextResponse.json({ ok: true, status: 'ignored' })
  }

  const outcome = await fulfillMakeGrowPaid({ submissionId, transactionId, sum })
  return NextResponse.json(outcome.body, { status: outcome.httpStatus })
}
