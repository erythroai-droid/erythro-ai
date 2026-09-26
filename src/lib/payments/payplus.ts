/**
 * PayPlus REST API — server-side only.
 *
 * Hosted payment page (J4). Card data stays on PayPlus.
 * Docs: https://docs.payplus.co.il/reference/post_paymentpages-generatelink
 *
 * A callback is not proof of payment. Approval is the server-to-server
 * `PaymentPages/ipn-full` result, bound to our submission id and amount.
 */

import { createHmac } from 'node:crypto'
import { timingSafeStringEqual } from '@/lib/agentAuth'
import type { CreatePaymentInput, CreatePaymentResponse } from './types'

const PRODUCTION_API = 'https://restapi.payplus.co.il/api/v1.0'
const SANDBOX_API = 'https://restapidev.payplus.co.il/api/v1.0'

export type PayPlusConfig = {
  apiKey: string
  secretKey: string
  paymentPageUid: string
  baseUrl: string
  issueInvoice: boolean
  productUid: string
}

export function isPayPlusConfigured(): boolean {
  return Boolean(
    process.env.PAYPLUS_API_KEY?.trim() &&
      process.env.PAYPLUS_SECRET_KEY?.trim() &&
      process.env.PAYPLUS_PAYMENT_PAGE_UID?.trim(),
  )
}

export function getPayPlusConfig(): PayPlusConfig {
  const apiKey = process.env.PAYPLUS_API_KEY?.trim() || ''
  const secretKey = process.env.PAYPLUS_SECRET_KEY?.trim() || ''
  const paymentPageUid = process.env.PAYPLUS_PAYMENT_PAGE_UID?.trim() || ''
  if (!apiKey || !secretKey || !paymentPageUid) {
    throw new Error('[payplus] Missing PAYPLUS_API_KEY, PAYPLUS_SECRET_KEY, or PAYPLUS_PAYMENT_PAGE_UID')
  }
  const testMode = process.env.PAYPLUS_TEST_MODE === 'true'
  const baseUrl = (
    process.env.PAYPLUS_API_URL?.trim() || (testMode ? SANDBOX_API : PRODUCTION_API)
  ).replace(/\/+$/, '')
  return {
    apiKey,
    secretKey,
    paymentPageUid,
    baseUrl,
    issueInvoice: process.env.PAYPLUS_ISSUE_INVOICE === '1' || process.env.PAYPLUS_ISSUE_INVOICE === 'true',
    productUid: process.env.PAYPLUS_PRODUCT_UID?.trim() || '',
  }
}

function headers(cfg: PayPlusConfig): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'api-key': cfg.apiKey,
    'secret-key': cfg.secretKey,
  }
}

/** Agorot → shekels. PayPlus expects a decimal amount. */
function toMajor(amountMinor: number): number {
  return Math.round(amountMinor) / 100
}

function payPlusLanguage(locale: CreatePaymentInput['locale']): 'he' | 'en' {
  return locale === 'he' ? 'he' : 'en'
}

/**
 * HMAC of a PayPlus HTTP body (`hash` header, SHA-256, base64).
 * Returns null when the header is absent. A mismatch is logged but is not
 * the approval gate: JSON key order in their sample does not match the raw body.
 */
export function payPlusHashMatches(rawBody: string, hashHeader: string | null, secretKey: string): boolean | null {
  const hash = hashHeader?.trim()
  if (!hash || !rawBody || !secretKey) return null
  const direct = createHmac('sha256', secretKey).update(rawBody).digest('base64')
  if (timingSafeStringEqual(direct, hash)) return true
  try {
    const canonical = JSON.stringify(JSON.parse(rawBody))
    const second = createHmac('sha256', secretKey).update(canonical).digest('base64')
    if (timingSafeStringEqual(second, hash)) return true
  } catch {
    // Body is not JSON.
  }
  return false
}

export type NormalizedPayPlusTx = {
  transactionUid: string
  paymentRequestUid: string
  statusCode: string
  /** Shekels, when PayPlus sent a number. */
  amountMajor: number | null
  currency: string
  moreInfo: string
  transactionType: string
  invoiceUrl: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** Callback and IPN bodies nest the charge under `transaction`. Flat fields are accepted too. */
export function normalizePayPlusTransaction(root: unknown): NormalizedPayPlusTx | null {
  const rec = asRecord(root)
  if (!rec) return null
  const data = asRecord(rec.data)
  const nested = asRecord(rec.transaction) || asRecord(data?.transaction)
  const tx = nested || rec
  const transactionUid = readString(tx.uid || tx.transaction_uid || rec.transaction_uid)
  const paymentRequestUid = readString(
    tx.payment_request_uid || rec.payment_request_uid || rec.page_request_uid,
  )
  const statusCode = readString(tx.status_code || rec.status_code)
  if (!transactionUid && !paymentRequestUid && !statusCode) return null
  const amountRaw = tx.amount ?? rec.amount
  const invoice = asRecord(rec.invoice) || asRecord(data?.invoice)
  return {
    transactionUid,
    paymentRequestUid,
    statusCode,
    amountMajor: typeof amountRaw === 'number' && Number.isFinite(amountRaw) ? amountRaw : null,
    currency: readString(tx.currency || rec.currency).toUpperCase(),
    moreInfo: readString(tx.more_info || rec.more_info),
    transactionType: readString(rec.transaction_type || tx.transaction_type),
    invoiceUrl: readString(invoice?.original_url),
  }
}

export function isApprovedStatusCode(code: string): boolean {
  return code === '000' || code === '0'
}

export function isRefundType(transactionType: string): boolean {
  return /refund/i.test(transactionType)
}

export function amountsMatchShekels(expected: number, charged: number): boolean {
  if (!Number.isFinite(expected) || !Number.isFinite(charged)) return false
  return Math.round(expected * 100) === Math.round(charged * 100)
}

/** `more_info` is written as `submission:123` when the link is created. */
export function parseSubmissionIdFromMoreInfo(moreInfo: string | undefined | null): string | null {
  if (!moreInfo) return null
  const match = String(moreInfo).match(/^submission:(\d+)$/)
  return match?.[1] ?? null
}

export async function createPaymentLink(input: CreatePaymentInput): Promise<CreatePaymentResponse> {
  const cfg = getPayPlusConfig()
  const url = `${cfg.baseUrl}/PaymentPages/GenerateLink`
  const amount = toMajor(input.amount)

  const body: Record<string, unknown> = {
    payment_page_uid: cfg.paymentPageUid,
    charge_method: 1,
    amount,
    currency_code: input.currency || 'ILS',
    sendEmailApproval: true,
    sendEmailFailure: true,
    language_code: payPlusLanguage(input.locale),
    expiry_datetime: '60',
    payments_selected: 1,
    description: input.description,
    refURL_success: input.successUrl,
    refURL_failure: input.cancelUrl,
    refURL_cancel: input.cancelUrl,
    refURL_callback: input.webhookUrl,
    send_failure_callback: true,
    customer: {
      customer_name: input.customer.name,
      email: input.customer.email,
      ...(input.customer.phone ? { phone: input.customer.phone } : {}),
    },
  }

  if (input.metadata?.submissionId) body.more_info = `submission:${input.metadata.submissionId}`
  if (input.metadata?.planSlug) body.more_info_1 = `plan:${input.metadata.planSlug}`
  if (cfg.issueInvoice) body.initial_invoice = true
  if (cfg.productUid) {
    body.items = [{ product_uid: cfg.productUid, quantity: 1, price: amount }]
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: headers(cfg),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    })
    const json = (await res.json()) as PayPlusGenerateLinkResponse
    if (json?.results?.status === 'success' && json?.data?.payment_page_link) {
      return {
        ok: true,
        paymentUrl: json.data.payment_page_link,
        transactionUid: json.data.page_request_uid || '',
      }
    }
    console.error(
      '[payplus] generateLink failed',
      json?.results?.code ?? '',
      json?.results?.description || res.status,
    )
    return {
      ok: false,
      message: 'PayPlus returned an error',
      code: String(json?.results?.code ?? ''),
    }
  } catch (err) {
    console.error('[payplus] generateLink error:', err instanceof Error ? err.message : 'network')
    return { ok: false, message: 'Network error' }
  }
}

export type IpnLookup = {
  found: boolean
  tx: NormalizedPayPlusTx | null
}

/**
 * Server-to-server read of the charge. `payment_request_uid` is the page
 * request we stored at link creation; `transaction_uid` arrives on the callback.
 */
export async function lookupIpn(ids: {
  transactionUid?: string
  paymentRequestUid?: string
}): Promise<IpnLookup> {
  const transactionUid = ids.transactionUid?.trim() || ''
  const paymentRequestUid = ids.paymentRequestUid?.trim() || ''
  if (!transactionUid && !paymentRequestUid) return { found: false, tx: null }

  const cfg = getPayPlusConfig()
  const payload: Record<string, unknown> = { related_transaction: false }
  if (transactionUid) payload.transaction_uid = transactionUid
  else payload.payment_request_uid = paymentRequestUid

  try {
    const res = await fetch(`${cfg.baseUrl}/PaymentPages/ipn-full`, {
      method: 'POST',
      headers: headers(cfg),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })
    const json = (await res.json()) as unknown
    const rec = asRecord(json)
    const results = asRecord(rec?.results)
    const resultStatus = readString(results?.status).toLowerCase()
    if (resultStatus && resultStatus !== 'success') {
      return { found: false, tx: normalizePayPlusTransaction(json) }
    }
    const tx = normalizePayPlusTransaction(json)
    if (!tx || (!tx.transactionUid && !tx.statusCode && !tx.moreInfo)) {
      return { found: false, tx }
    }
    return { found: true, tx }
  } catch (err) {
    console.error('[payplus] ipn lookup error:', err instanceof Error ? err.message : 'network')
    return { found: false, tx: null }
  }
}

interface PayPlusGenerateLinkResponse {
  results?: { status?: string; code?: number; description?: string }
  data?: { page_request_uid?: string; payment_page_link?: string }
}
