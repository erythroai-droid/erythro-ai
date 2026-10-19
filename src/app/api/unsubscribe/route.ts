import { NextRequest, NextResponse } from 'next/server'
import {
  recordMailUnsubscribe,
  verifyMailUnsubscribeToken,
} from '@/lib/mailUnsubscribe'

export const runtime = 'nodejs'

/**
 * Confirm commercial mail opt-out (team@ Pro / KP). Token from email footer.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const token = String(body.t || body.token || '').trim()
  const email = verifyMailUnsubscribeToken(token)
  if (!email) {
    return NextResponse.json({ code: 'invalid_token' }, { status: 400 })
  }

  try {
    const result = await recordMailUnsubscribe({
      email,
      source: String(body.source || 'pro_offer').slice(0, 64),
    })
    return NextResponse.json({
      ok: true,
      email: result.email,
      already: result.already,
    })
  } catch (err) {
    console.error('[api/unsubscribe]', err instanceof Error ? err.message : err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
