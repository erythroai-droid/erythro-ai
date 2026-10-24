import { NextRequest, NextResponse } from 'next/server'
import { recordMailOpen, verifyMailOpenToken } from '@/lib/mailOpenTrack'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 1x1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

/**
 * Open-tracking pixel for team@ commercial mail. Always answers with the GIF
 * (a failed write must never show a broken image in the recipient's client).
 */
export async function GET(request: NextRequest) {
  const parsed = verifyMailOpenToken(request.nextUrl.searchParams.get('t'))
  if (parsed) {
    try {
      await recordMailOpen({ ...parsed, userAgent: request.headers.get('user-agent') })
    } catch (err) {
      console.error('[api/mail/open]', err instanceof Error ? err.message.slice(0, 160) : err)
    }
  }
  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(PIXEL.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  })
}
