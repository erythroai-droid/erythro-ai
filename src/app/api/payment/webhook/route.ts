import { NextRequest, NextResponse } from 'next/server'
import { handleGrowCallback, handlePayPlusCallback } from '@/lib/payments/fulfillPayment'
import { isGrowCallback } from '@/lib/payments/grow'
import { isPayPlusConfigured } from '@/lib/payments/payplus'

export const runtime = 'nodejs'
export const maxDuration = 30

function assignBracket(root: Record<string, unknown>, key: string, value: string) {
  const parts = key
    .split('[')
    .map((part) => part.replace(/\]$/, ''))
    .filter(Boolean)
  if (parts.length === 0) return
  let cursor = root
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    const existing = cursor[part]
    if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
      cursor[part] = {}
    }
    cursor = cursor[part] as Record<string, unknown>
  }
  cursor[parts[parts.length - 1]] = value
}

function nestEntries(entries: Iterable<[string, string]>): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  for (const [key, value] of entries) assignBracket(body, key, value)
  return body
}

async function readCallback(request: NextRequest): Promise<{
  body: Record<string, unknown>
  rawBody: string
}> {
  if (request.method === 'GET') {
    return { body: nestEntries(request.nextUrl.searchParams.entries()), rawBody: request.nextUrl.searchParams.toString() }
  }

  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    const entries: Array<[string, string]> = []
    form.forEach((value, key) => {
      if (typeof value === 'string') entries.push([key, value])
    })
    return { body: nestEntries(entries), rawBody: '' }
  }

  const rawBody = await request.text()
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return { body: nestEntries(new URLSearchParams(rawBody).entries()), rawBody }
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
 * Grow notifyUrl (form POST) and leftover PayPlus IPN.
 * Neither body is proof. Grow is confirmed with getTransactionInfo.
 */
async function receive(request: NextRequest): Promise<NextResponse> {
  const { body, rawBody } = await readCallback(request)
  const outcome = isGrowCallback(body)
    ? await handleGrowCallback(body)
    : isPayPlusConfigured()
      ? await handlePayPlusCallback({
          body,
          rawBody,
          hashHeader: request.headers.get('hash'),
        })
      : await handleGrowCallback(body)
  return NextResponse.json(outcome.body, { status: outcome.httpStatus })
}

export function GET(request: NextRequest) {
  return receive(request)
}

export function POST(request: NextRequest) {
  return receive(request)
}
