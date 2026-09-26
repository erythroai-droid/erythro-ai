import { after } from 'next/server'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  amountsMatchShekels,
  getPayPlusConfig,
  isApprovedStatusCode,
  isPayPlusConfigured,
  isRefundType,
  lookupIpn,
  normalizePayPlusTransaction,
  parseSubmissionIdFromMoreInfo,
  payPlusHashMatches,
  type NormalizedPayPlusTx,
} from '@/lib/payments/payplus'
import {
  resolveNotifyRecipients,
  sendClientAcknowledgement,
  sendContactNotification,
  type SiteEmailSettings,
} from '@/lib/contactNotification'
import { triggerAuditAgent } from '@/lib/auditAgentTrigger'
import { formatSubmissionTicketId } from '@/lib/submissionTicket'

export type CallbackOutcome = {
  httpStatus: number
  body: Record<string, unknown>
}

function lookupIds(tx: NormalizedPayPlusTx | null): {
  transactionUid: string
  paymentRequestUid: string
} {
  return {
    transactionUid: tx?.transactionUid || '',
    paymentRequestUid: tx?.paymentRequestUid || '',
  }
}

function sqlRows(result: unknown): Array<{ id: number }> {
  if (Array.isArray(result)) return result as Array<{ id: number }>
  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows?: unknown }).rows
    if (Array.isArray(rows)) return rows as Array<{ id: number }>
  }
  return []
}

/**
 * One callback → one fulfillment. The row flips to `paid` only when it is not
 * already paid or refunded, so a PayPlus retry does not queue a second audit.
 */
async function claimStatus(
  subId: number,
  status: 'paid' | 'failed' | 'refunded',
  transactionUid: string,
): Promise<boolean> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle
  const result =
    status === 'paid'
      ? await db.execute(sql`
          UPDATE "contact_submissions"
          SET "payment_status" = 'paid',
              "payment_transaction_id" = ${transactionUid},
              "updated_at" = now()
          WHERE "id" = ${subId}
            AND COALESCE("payment_status", 'none') NOT IN ('paid', 'refunded')
          RETURNING "id"
        `)
      : status === 'refunded'
        ? await db.execute(sql`
            UPDATE "contact_submissions"
            SET "payment_status" = 'refunded',
                "payment_transaction_id" = ${transactionUid},
                "updated_at" = now()
            WHERE "id" = ${subId}
              AND "payment_status" = 'paid'
            RETURNING "id"
          `)
        : await db.execute(sql`
            UPDATE "contact_submissions"
            SET "payment_status" = 'failed',
                "payment_transaction_id" = ${transactionUid},
                "updated_at" = now()
            WHERE "id" = ${subId}
              AND COALESCE("payment_status", 'none') IN ('none', 'pending', 'failed')
            RETURNING "id"
          `)
  return sqlRows(result).length > 0
}

async function fulfillPaid(subId: number, tx: NormalizedPayPlusTx): Promise<void> {
  const payload = await getPayload({ config })
  const updated = await payload.findByID({
    collection: 'contact-submissions',
    id: subId,
    depth: 0,
    overrideAccess: true,
  })
  if (!updated) return

  const source = (updated.source || 'audit') as 'contact' | 'order' | 'audit'
  const name = updated.name || ''
  const email = updated.email || ''
  const invoiceLine = tx.invoiceUrl ? `\nInvoice: ${tx.invoiceUrl}` : ''
  const settings = (await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    overrideAccess: true,
  })) as SiteEmailSettings
  const notifyTo = resolveNotifyRecipients(settings, source)

  const mailed = await sendContactNotification(notifyTo, {
    name,
    email,
    phone: updated.phone || undefined,
    message: `PAID via PayPlus\n\n${updated.message || ''}${invoiceLine}`,
    locale: updated.locale || 'en',
    source,
    website: updated.website || undefined,
    auditLanguage: updated.auditLanguage || undefined,
    planSlug: updated.planSlug || undefined,
    planTotal: updated.planTotal || undefined,
    submissionId: updated.id,
  })
  if (!mailed.sent) {
    console.error('[payplus] staff email not sent:', mailed.reason)
  }

  const acked = await sendClientAcknowledgement({
    name,
    email,
    locale: updated.locale || 'en',
    source,
    submissionId: updated.id,
  })
  if (!acked.sent) {
    console.error('[payplus] client ack not sent:', acked.reason)
  }

  if (source === 'audit' && updated.website) {
    const triggerInput = {
      submissionId: updated.id,
      targetUrl: updated.website,
      locale: updated.auditLanguage || updated.locale || undefined,
      planSlug: updated.planSlug || undefined,
      clientEmail: email || undefined,
      clientName: name || undefined,
    }
    const triggered = await triggerAuditAgent(triggerInput, { attempts: 1 })
    if (!triggered.ok) {
      console.error('[payplus] audit worker not queued:', triggered.reason)
      after(async () => {
        const retry = await triggerAuditAgent(triggerInput, { attempts: 2 })
        if (!retry.ok) {
          console.error('[payplus] background requeue failed:', retry.reason, 'id=', updated.id)
        }
      })
    }
  }
}

async function notifyRefund(subId: number): Promise<void> {
  const payload = await getPayload({ config })
  const updated = await payload.findByID({
    collection: 'contact-submissions',
    id: subId,
    depth: 0,
    overrideAccess: true,
  })
  if (!updated) return
  const source = (updated.source || 'audit') as 'contact' | 'order' | 'audit'
  const settings = (await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    overrideAccess: true,
  })) as SiteEmailSettings
  const mailed = await sendContactNotification(resolveNotifyRecipients(settings, source), {
    name: updated.name || '',
    email: updated.email || '',
    phone: updated.phone || undefined,
    message: `REFUNDED via PayPlus\n\n${updated.message || ''}`,
    locale: updated.locale || 'en',
    source,
    website: updated.website || undefined,
    planSlug: updated.planSlug || undefined,
    planTotal: updated.planTotal || undefined,
    submissionId: updated.id,
  })
  if (!mailed.sent) console.error('[payplus] refund email not sent:', mailed.reason)
}

function bindsToStoredRequest(stored: string | null | undefined, tx: NormalizedPayPlusTx): boolean {
  const saved = stored?.trim() || ''
  if (!saved || (tx.transactionUid && saved === tx.transactionUid)) return true
  if (!tx.paymentRequestUid) return true
  return saved === tx.paymentRequestUid
}

/**
 * PayPlus callback (JSON, form, or query). Approval comes from IPN lookup,
 * not from the redirect and not from the callback body alone.
 */
export async function handlePayPlusCallback(input: {
  body: Record<string, unknown>
  rawBody: string
  hashHeader: string | null
}): Promise<CallbackOutcome> {
  if (!isPayPlusConfigured()) {
    console.error('[payplus] callback while gateway is not configured')
    return { httpStatus: 503, body: { ok: false, reason: 'not_configured' } }
  }

  const hinted = normalizePayPlusTransaction(input.body)
  const ids = lookupIds(hinted)
  if (!ids.transactionUid && !ids.paymentRequestUid) {
    console.warn('[payplus] callback missing transaction uid')
    return { httpStatus: 400, body: { ok: false, reason: 'missing_uid' } }
  }

  let secret = ''
  try {
    secret = getPayPlusConfig().secretKey
  } catch {
    return { httpStatus: 503, body: { ok: false, reason: 'not_configured' } }
  }
  const hash = payPlusHashMatches(input.rawBody, input.hashHeader, secret)
  if (hash === false) {
    console.warn('[payplus] callback hash mismatch; confirming via IPN')
  }

  const lookup = await lookupIpn(ids)
  if (!lookup.found || !lookup.tx) {
    console.warn('[payplus] IPN not ready', ids.transactionUid || ids.paymentRequestUid)
    return { httpStatus: 503, body: { ok: false, reason: 'ipn_pending' } }
  }

  const tx = lookup.tx
  const submissionId = parseSubmissionIdFromMoreInfo(tx.moreInfo)
  if (!submissionId) {
    console.error('[payplus] IPN missing submission more_info')
    return { httpStatus: 503, body: { ok: false, reason: 'missing_reference' } }
  }
  const subId = Number(submissionId)

  const payload = await getPayload({ config })
  const existing = await payload.findByID({
    collection: 'contact-submissions',
    id: subId,
    depth: 0,
    overrideAccess: true,
  })
  if (!existing) {
    console.error('[payplus] submission missing id=', subId)
    return { httpStatus: 200, body: { ok: false, reason: 'unknown_submission' } }
  }

  if (!bindsToStoredRequest(existing.paymentTransactionId, tx)) {
    console.error('[payplus] payment request uid does not match submission', subId)
    return { httpStatus: 200, body: { ok: false, reason: 'request_mismatch' } }
  }

  const approved = isApprovedStatusCode(tx.statusCode)
  const refund = approved && isRefundType(tx.transactionType)
  console.info(
    '[payplus] ipn',
    'id=',
    subId,
    'status=',
    tx.statusCode || 'none',
    'type=',
    tx.transactionType || 'charge',
    'amount=',
    tx.amountMajor ?? 'n/a',
    'hash=',
    hash === null ? 'absent' : hash ? 'ok' : 'mismatch',
  )

  if (!approved) {
    const claimed = await claimStatus(subId, 'failed', tx.transactionUid || tx.paymentRequestUid)
    return { httpStatus: 200, body: { ok: true, status: claimed ? 'failed' : 'unchanged' } }
  }

  if (refund) {
    const claimed = await claimStatus(subId, 'refunded', tx.transactionUid || existing.paymentTransactionId || '')
    if (claimed) await notifyRefund(subId)
    return { httpStatus: 200, body: { ok: true, status: claimed ? 'refunded' : 'already' } }
  }

  if ((tx.currency || 'ILS') !== 'ILS') {
    console.error('[payplus] currency mismatch', tx.currency, 'id=', subId)
    return { httpStatus: 200, body: { ok: false, reason: 'currency_mismatch' } }
  }
  const expected = typeof existing.paymentAmount === 'number' ? existing.paymentAmount : NaN
  if (tx.amountMajor == null || !amountsMatchShekels(expected, tx.amountMajor)) {
    console.error('[payplus] amount mismatch expected=', expected, 'charged=', tx.amountMajor, 'id=', subId)
    return { httpStatus: 200, body: { ok: false, reason: 'amount_mismatch' } }
  }

  const claimed = await claimStatus(subId, 'paid', tx.transactionUid || tx.paymentRequestUid)
  if (!claimed) {
    return { httpStatus: 200, body: { ok: true, status: 'already_paid' } }
  }

  try {
    await fulfillPaid(subId, tx)
  } catch (err) {
    console.error('[payplus] fulfill error:', err instanceof Error ? err.message : 'unknown')
    const payload = await getPayload({ config })
    await payload.db.drizzle.execute(sql`
      UPDATE "contact_submissions"
      SET "payment_status" = 'pending',
          "updated_at" = now()
      WHERE "id" = ${subId}
        AND "payment_status" = 'paid'
    `)
    return { httpStatus: 503, body: { ok: false, reason: 'fulfill_failed' } }
  }

  return {
    httpStatus: 200,
    body: { ok: true, status: 'approved', ticketId: formatSubmissionTicketId('audit', subId) },
  }
}
