import { NextRequest, NextResponse } from 'next/server'

import { consultLocale } from '@/lib/consultant'
import { fetchConsultantCopy } from '@/lib/consultantKnowledge.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Editor-owned widget copy (greeting, verification prompts, storage notice).
 *
 * Served as its own endpoint so `ChatButton` — rendered from a dozen page
 * clients — does not need a new prop threaded through all of them.
 *
 * HTTP cache is `no-store` and the Payload read is uncached: `enabled` is the
 * public kill switch for the launcher. A data-cache or a client heuristic that
 * ignored `enabled: false` without a greeting left the button on the page
 * after the editor turned the consultant off (PIT-089).
 */
export async function GET(request: NextRequest) {
  const locale = consultLocale(request.nextUrl.searchParams.get('locale'))
  // Uncached: `enabled` is the public launcher kill switch (PIT-089).
  const copy = await fetchConsultantCopy(locale)
  return NextResponse.json(
    { ...copy, enabled: copy.enabled === true },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
