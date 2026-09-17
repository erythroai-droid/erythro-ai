import { NextRequest, NextResponse } from 'next/server'

import { consultLocale } from '@/lib/consultant'
import { getCachedConsultantCopy } from '@/lib/consultantKnowledge.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Editor-owned widget copy (greeting, verification prompts, storage notice).
 *
 * Served as its own endpoint so `ChatButton` — rendered from a dozen page
 * clients — does not need a new prop threaded through all of them. Shares the
 * site-content cache tag, so an admin save is reflected immediately.
 *
 * HTTP cache is `no-store`: `enabled` is the public kill switch for the
 * launcher FABs. A 60s browser cache left the spark button on the page after
 * the editor turned the consultant off (PIT-089).
 */
export async function GET(request: NextRequest) {
  const locale = consultLocale(request.nextUrl.searchParams.get('locale'))
  const copy = await getCachedConsultantCopy(locale)
  return NextResponse.json(
    { ...copy, enabled: copy.enabled },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
