import { NextRequest, NextResponse } from 'next/server'

import { consultLocale, isConsultantConfigured } from '@/lib/consultant'
import { getCachedConsultantCopy } from '@/lib/consultantKnowledge.server'

export const runtime = 'nodejs'

/**
 * Editor-owned widget copy (greeting, verification prompts, storage notice).
 *
 * Served as its own endpoint so `ChatButton` — rendered from a dozen page
 * clients — does not need a new prop threaded through all of them. Shares the
 * site-content cache tag, so an admin save is reflected immediately.
 */
export async function GET(request: NextRequest) {
  const locale = consultLocale(request.nextUrl.searchParams.get('locale'))
  const copy = await getCachedConsultantCopy(locale)
  return NextResponse.json(
    { ...copy, enabled: copy.enabled && isConsultantConfigured() },
    { headers: { 'Cache-Control': 'private, max-age=60' } },
  )
}
