import { getPayload } from 'payload'
import config from '@payload-config'
import { triggerAuditAgent } from '@/lib/auditAgentTrigger'

export const DEFAULT_NEW_STALE_MINUTES = 2
export const DEFAULT_IN_PROGRESS_STALE_MINUTES = 20
export const MAX_RECONCILE_RETRIES = 3
const MAX_STALE_MINUTES = 120
const SCAN_LIMIT = 25

export type ReconcileOptions = {
  newStaleMinutes?: number
  inProgressStaleMinutes?: number
}

export type ReconcileResultRow = Record<string, unknown>

export type ReconcileRunResult = {
  ok: true
  newStaleMinutes: number
  inProgressStaleMinutes: number
  scanned: number
  results: ReconcileResultRow[]
}

function clampStaleMinutes(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return fallback
  return Math.min(Math.floor(value), MAX_STALE_MINUTES)
}

function cutoffIso(staleMinutes: number): string {
  return new Date(Date.now() - staleMinutes * 60_000).toISOString()
}

/**
 * Re-queue audits that never left `new`, or `in_progress` jobs that stalled.
 * `new` uses a short window so a missed worker trigger is retried in ~2 minutes.
 * `in_progress` stays longer so a healthy Pro run is not double-queued.
 */
export async function reconcileStuckAudits(
  options: ReconcileOptions = {},
): Promise<ReconcileRunResult> {
  const newStaleMinutes = clampStaleMinutes(
    options.newStaleMinutes,
    DEFAULT_NEW_STALE_MINUTES,
  )
  const inProgressStaleMinutes = clampStaleMinutes(
    options.inProgressStaleMinutes,
    DEFAULT_IN_PROGRESS_STALE_MINUTES,
  )

  const payload = await getPayload({ config })
  const seen = new Set<number | string>()
  type AuditDoc = {
    id: number | string
    website?: unknown
    retryCount?: unknown
    auditLanguage?: unknown
    locale?: unknown
    planSlug?: unknown
    email?: unknown
    name?: unknown
  }
  const docs: AuditDoc[] = []

  for (const [status, minutes] of [
    ['new', newStaleMinutes],
    ['in_progress', inProgressStaleMinutes],
  ] as const) {
    const found = await payload.find({
      collection: 'contact-submissions',
      depth: 0,
      limit: SCAN_LIMIT,
      overrideAccess: true,
      where: {
        and: [
          { source: { equals: 'audit' } },
          { auditStatus: { equals: status } },
          { updatedAt: { less_than: cutoffIso(minutes) } },
        ],
      },
      sort: 'updatedAt',
    })
    for (const doc of found.docs) {
      if (seen.has(doc.id)) continue
      seen.add(doc.id)
      docs.push(doc)
    }
  }

  const results: ReconcileResultRow[] = []

  for (const doc of docs) {
    const website = typeof doc.website === 'string' ? doc.website.trim() : ''
    if (!website) {
      results.push({ id: doc.id, action: 'skip', reason: 'no_website' })
      continue
    }

    const retries = typeof doc.retryCount === 'number' ? doc.retryCount : 0
    if (retries >= MAX_RECONCILE_RETRIES) {
      await payload.update({
        collection: 'contact-submissions',
        id: doc.id,
        data: {
          auditStatus: 'failed',
          errorLast: `Auto-failed after ${MAX_RECONCILE_RETRIES} reconcile retries`,
        },
        overrideAccess: true,
      })
      results.push({ id: doc.id, action: 'failed', retryCount: retries })
      continue
    }

    const nextRetry = retries + 1
    await payload.update({
      collection: 'contact-submissions',
      id: doc.id,
      data: { retryCount: nextRetry },
      overrideAccess: true,
    })

    const triggered = await triggerAuditAgent(
      {
        submissionId: doc.id,
        targetUrl: website,
        locale:
          (typeof doc.auditLanguage === 'string' && doc.auditLanguage) ||
          (typeof doc.locale === 'string' && doc.locale) ||
          undefined,
        planSlug: typeof doc.planSlug === 'string' ? doc.planSlug : undefined,
        clientEmail: typeof doc.email === 'string' ? doc.email : undefined,
        clientName: typeof doc.name === 'string' ? doc.name : undefined,
      },
      { attempts: 2 },
    )

    results.push({
      id: doc.id,
      action: 'requeue',
      retryCount: nextRetry,
      queued: triggered.ok,
      reason: triggered.ok ? undefined : triggered.reason,
    })
  }

  return {
    ok: true,
    newStaleMinutes,
    inProgressStaleMinutes,
    scanned: docs.length,
    results,
  }
}
