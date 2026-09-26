import { NextRequest, NextResponse } from 'next/server'
import { handlePayPlusCallback } from '@/lib/payments/fulfillPayment'

export const runtime = 'nodejs'
export const maxDuration = 30

function formToRecord(raw: string): Record<string, unknown> {
  const params = new URLSearchParams(raw)
  const body: Record<string, unknown> = {}
  params.forEach((value, key) => {
    body[key] = value
  })
  return body
}

async function readCallback(request: NextRequest): Promise<{
  body: Record<string, unknown>
  rawBody: string
}> {
  if (request.method === 'GET') {
    const body: Record<string, unknown> = {}
    request.nextUrl.searchParams.forEach((value, key) => {
      body[key] = value
    })
    return { body, rawBody: request.nextUrl.searchParams.toString() }
  }

  const rawBody = await request.text()
  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return { body: formToRecord(rawBody), rawBody }
  }
  try {
    const parsed = JSON.parse(rawBody) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { body: parsed as Record<string, unknown>, rawBody }
    }
  } catch {
    // Fall through.
  }
  return { body: {}, rawBody }
}

/**
 * PayPlus IPN. GET and POST: dashboard callback method varies.
 * The charge is accepted only after PaymentPages/ipn-full matches amount and submission.
 */
async function receive(request: NextRequest): Promise<NextResponse> {
  const { body, rawBody } = await readCallback(request)
  const outcome = await handlePayPlusCallback({
    body,
    rawBody,
    hashHeader: request.headers.get('hash'),
  })
  return NextResponse.json(outcome.body, { status: outcome.httpStatus })
}

export function GET(request: NextRequest) {
  return receive(request)
}

export function POST(request: NextRequest) {
  return receive(request)
}
