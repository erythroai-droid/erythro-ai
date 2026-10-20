import { NextRequest, NextResponse } from 'next/server'
import { agentSecretAuthorized } from '@/lib/agentAuth'
import { parseAuditReportId } from '@/lib/auditReport'
import {
  trySendAuditProOffer,
  trySendAuditProOfferNudge,
  trySendAuditProOfferReminder,
  trySendPaidAuditDevOffer,
} from '@/lib/auditProOffer'

export const runtime = 'nodejs'
export const maxDuration = 30

type RouteParams = { params: Promise<{ id: string }> }
type ProOfferKind = 'offer' | 'nudge' | 'reminder' | 'paid_dev'

/**
 * POST /api/audit/internal/[id]/pro-offer
 * Body: { force?: boolean, kind?: 'offer' | 'nudge' | 'reminder' | 'paid_dev' }
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
  let kind: ProOfferKind = 'offer'
  try {
    const body = (await request.json().catch(() => null)) as {
      force?: unknown
      kind?: unknown
    } | null
    force = Boolean(body?.force)
    if (body?.kind === 'reminder') kind = 'reminder'
    else if (body?.kind === 'nudge') kind = 'nudge'
    else if (body?.kind === 'paid_dev') kind = 'paid_dev'
  } catch {
    force = false
  }

  try {
    const result =
      kind === 'reminder'
        ? await trySendAuditProOfferReminder(id, { force })
        : kind === 'nudge'
          ? await trySendAuditProOfferNudge(id, { force })
          : kind === 'paid_dev'
            ? await trySendPaidAuditDevOffer(id, { force })
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
