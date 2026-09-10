import { NextRequest, NextResponse } from 'next/server'
import { reconcileRequestAuthorized } from '@/lib/agentAuth'
import {
  DEFAULT_IN_PROGRESS_STALE_MINUTES,
  DEFAULT_NEW_STALE_MINUTES,
  reconcileStuckAudits,
} from '@/lib/auditReconcile'

export const runtime = 'nodejs'
export const maxDuration = 60

function authorized(request: NextRequest): boolean {
  return reconcileRequestAuthorized(request.headers)
}

function parseStaleOptions(body: {
  staleMinutes?: number
  newStaleMinutes?: number
  inProgressStaleMinutes?: number
}): { newStaleMinutes?: number; inProgressStaleMinutes?: number } {
  const newStaleMinutes =
    typeof body.newStaleMinutes === 'number'
      ? body.newStaleMinutes
      : typeof body.staleMinutes === 'number'
        ? body.staleMinutes
        : undefined
  const inProgressStaleMinutes =
    typeof body.inProgressStaleMinutes === 'number'
      ? body.inProgressStaleMinutes
      : undefined
  return { newStaleMinutes, inProgressStaleMinutes }
}

/**
 * Cron / n8n entry: find stuck audit submissions and re-queue the worker.
 * Auth: `X-Agent-Secret-Key` or `Authorization: Bearer` (CRON_SECRET / AGENT_SECRET_TOKEN).
 * Vercel Cron hits GET every 2 minutes; n8n keeps POST.
 */
async function run(request: NextRequest, body: Record<string, unknown> = {}) {
  if (!authorized(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await reconcileStuckAudits(parseStaleOptions(body))
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('[api/audit/reconcile] failed:', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return run(request, {
    newStaleMinutes: DEFAULT_NEW_STALE_MINUTES,
    inProgressStaleMinutes: DEFAULT_IN_PROGRESS_STALE_MINUTES,
  })
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  return run(request, body)
}
