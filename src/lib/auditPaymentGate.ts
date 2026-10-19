/**
 * Paid Grow checkouts create a contact-submission with
 * `paymentStatus=pending` before the customer pays.
 * Reconcile / trigger / public report must never run those — only free (`none`) or `paid`.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

export type AuditPaymentGateDoc = {
  paymentStatus?: string | null
  paymentAmount?: number | null
}

/** True when the audit must not be auto-queued (unpaid / failed / refunded checkout). */
export function isUnpaidAuditCheckout(doc: AuditPaymentGateDoc): boolean {
  const status = String(doc.paymentStatus || 'none').trim()
  if (status === 'pending' || status === 'failed' || status === 'refunded') return true
  const amount = typeof doc.paymentAmount === 'number' ? doc.paymentAmount : 0
  if (amount > 0 && status !== 'paid') return true
  return false
}

/** Load submission and refuse unpaid Grow checkouts (defense in depth for trigger). */
export async function assertAuditMayRun(
  submissionId: number | string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const id = Number(submissionId)
  if (!Number.isFinite(id) || id <= 0) return { ok: false, reason: 'invalid_submission' }
  try {
    const payload = await getPayload({ config })
    const doc = await payload.findByID({
      collection: 'contact-submissions',
      id,
      depth: 0,
      overrideAccess: true,
    })
    if (!doc || doc.source !== 'audit') return { ok: false, reason: 'not_audit' }
    if (
      isUnpaidAuditCheckout({
        paymentStatus: typeof doc.paymentStatus === 'string' ? doc.paymentStatus : null,
        paymentAmount: typeof doc.paymentAmount === 'number' ? doc.paymentAmount : null,
      })
    ) {
      return { ok: false, reason: 'unpaid_checkout' }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[auditPaymentGate] assert failed:', message)
    return { ok: false, reason: 'lookup_failed' }
  }
}
