import { getPayload } from 'payload'
import config from '@payload-config'
import { triggerAuditAgent } from '@/lib/auditAgentTrigger'
import { isUnpaidAuditCheckout } from '@/lib/auditPaymentGate'
import {
  sendDueAuditProOfferNudges,
  sendDueAuditProOfferReminders,
  sendDueAuditProOffers,
} from '@/lib/auditProOffer'

export const DEFAULT_NEW_STALE_MINUTES = 2
export const DEFAULT_IN_PROGRESS_STALE_MINUTES = 20
export const MAX_RECONCILE_RETRIES = 3
/** Paid audit waiting for the client to open access to the lab: re-check interval (PIT-150). */
export const WAITING_ACCESS_RECHECK_MINUTES = 30
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
  proOffers?: {
    scanned: number
    results: ReconcileResultRow[]
  }
}

function clampStaleMinutes(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return fallback
  return Math.min(Math.floor(value), MAX_STALE_MINUTES)
}

function waitingAccessOf(summary: unknown): { lastCheck?: string } | null {
  if (!summary || typeof summary !== 'object') return null
  const w = (summary as { waitingAccess?: unknown }).waitingAccess
  if (!w || typeof w !== 'object' || (w as { expired?: unknown }).expired) return null
  return w as { lastCheck?: string }
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
    paymentStatus?: unknown
    paymentAmount?: unknown
    auditSummary?: unknown
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
          // Exclude Grow pending/failed at query time (PIT-114). Free = none / no amount.
          {
            or: [
              { paymentStatus: { equals: 'paid' } },
              {
                and: [
                  {
                    or: [
                      { paymentStatus: { equals: 'none' } },
                      { paymentStatus: { exists: false } },
                    ],
                  },
                  {
                    or: [
                      { paymentAmount: { exists: false } },
                      { paymentAmount: { equals: 0 } },
                    ],
                  },
                ],
              },
            ],
          },
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
    if (
      isUnpaidAuditCheckout({
        paymentStatus: typeof doc.paymentStatus === 'string' ? doc.paymentStatus : null,
        paymentAmount: typeof doc.paymentAmount === 'number' ? doc.paymentAmount : null,
      })
    ) {
      results.push({ id: doc.id, action: 'skip', reason: 'unpaid_checkout' })
      continue
    }

    const website = typeof doc.website === 'string' ? doc.website.trim() : ''
    if (!website) {
      results.push({ id: doc.id, action: 'skip', reason: 'no_website' })
      continue
    }

    // Paid audit behind bot protection: the worker keeps it `in_progress` with
    // auditSummary.waitingAccess and decides the 72 h limit itself. Re-check every 30 min
    // without spending reconcile retries (PIT-150).
    const waiting = waitingAccessOf(doc.auditSummary)
    if (waiting) {
      const last = Date.parse(waiting.lastCheck || '')
      if (Number.isFinite(last) && Date.now() - last < WAITING_ACCESS_RECHECK_MINUTES * 60_000) {
        results.push({ id: doc.id, action: 'skip', reason: 'waiting_access_recent' })
        continue
      }
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
        action: 'recheck_access',
        queued: triggered.ok,
        reason: triggered.ok ? undefined : triggered.reason,
      })
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

  let proOffers: ReconcileRunResult['proOffers']
  try {
    const due = await sendDueAuditProOffers(25)
    const nudges = await sendDueAuditProOfferNudges(25)
    const reminders = await sendDueAuditProOfferReminders(25)
    proOffers = {
      scanned: due.scanned + nudges.scanned + reminders.scanned,
      results: [
        ...due.results.map((row) => ({
          id: row.id,
          action: 'pro_offer',
          ok: row.result.ok,
          status: row.result.ok ? row.result.status : undefined,
          reason: row.result.reason,
        })),
        ...nudges.results.map((row) => ({
          id: row.id,
          action: 'pro_offer_nudge',
          ok: row.result.ok,
          status: row.result.ok ? row.result.status : undefined,
          reason: row.result.reason,
        })),
        ...reminders.results.map((row) => ({
          id: row.id,
          action: 'pro_offer_reminder',
          ok: row.result.ok,
          status: row.result.ok ? row.result.status : undefined,
          reason: row.result.reason,
        })),
      ],
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[auditReconcile] pro offer sweep failed:', message)
    proOffers = { scanned: 0, results: [{ action: 'pro_offer_error', reason: message }] }
  }

  return {
    ok: true,
    newStaleMinutes,
    inProgressStaleMinutes,
    scanned: docs.length,
    results,
    proOffers,
  }
}
