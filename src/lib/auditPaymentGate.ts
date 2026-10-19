/**
 * Paid Grow checkouts create a contact-submission with
 * `paymentStatus=pending` and default `auditStatus=new` before the customer pays.
 * Reconcile / auto-queue must never run those — only free (`none`) or `paid`.
 */

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
