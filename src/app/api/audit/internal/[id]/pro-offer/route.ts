import { NextRequest, NextResponse } from 'next/server'
import { agentSecretAuthorized } from '@/lib/agentAuth'
import { parseAuditReportId } from '@/lib/auditReport'
import {
  trySendAuditProOffer,
  trySendAuditProOfferReminder,
} from '@/lib/auditProOffer'

export const runtime = 'nodejs'
export const maxDuration = 30

type RouteParams = { params: Promise<{ id: string }> }

/**
 * POST /api/audit/internal/[id]/pro-offer
 * Body: { force?: boolean, kind?: 'offer' | 'reminder' }
 * Auth: X-Agent-Secret-Key.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!agentSecretAuthorized(request.headers.get('x-agent-secret-key'))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id: rawId } = await params
  const id = parseAuditReportId(rawId)
  if (!id) return NextResponse.json({ message: 'Invalid id' }, { status: 400 })

  let force = false
  let kind: 'offer' | 'reminder' = 'offer'
  try {
    const body = (await request.json().catch(() => null)) as {
      force?: unknown
      kind?: unknown
    } | null
    force = Boolean(body?.force)
    if (body?.kind === 'reminder') kind = 'reminder'
  } catch {
    force = false
  }

  try {
    const result =
      kind === 'reminder'
        ? await trySendAuditProOfferReminder(id, { force })
        : await trySendAuditProOffer(id, { force })
    if (!result.ok) {
      const status =
        result.reason === 'not_found'
          ? 404
          : result.reason === 'not_due_yet' || result.reason === 'offer_not_sent_yet'
            ? 409
            : result.reason === 'TEAM_SMTP_PASS not set'
              ? 503
              : 400
      return NextResponse.json({ ok: false, kind, ...result }, { status })
    }
    return NextResponse.json({ ok: true, kind, ...result })
  } catch (err) {
    console.error('[api/audit/internal/pro-offer] failed:', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
