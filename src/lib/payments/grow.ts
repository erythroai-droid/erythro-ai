/**
 * Grow (Meshulam) Light API — server-side only.
 *
 * Hosted payment page. Card data stays on Grow.
 * Docs: https://developers.grow.business/reference/the-process
 *
 * The browser return (`response=success`) has no charge details. The notify
 * POST is unsigned. A charge is accepted only after `getTransactionInfo`
 * matches our stored process token, the order amount, and statusCode 2.
 * `approveTransaction` then closes Grow's loop; it is not the proof.
 */

import { parsePhoneNumberFromString } from 'libphonenumber-js'
import { timingSafeStringEqual } from '@/lib/agentAuth'
import type { CreatePaymentInput, CreatePaymentResponse } from './types'

const PRODUCTION_API = 'https://secure.meshulam.co.il'
const SANDBOX_API = 'https://sandbox.meshulam.co.il'

/** Paid. Other codes (including delayed `11`) stay pending. */
export const GROW_PAID_STATUS = '2'

const PROCESS_SEP = '|'

export type GrowConfig = {
  userId: string
  pageCode: string
  apiKey: string
  baseUrl: string
}

export type GrowNotice = {
  statusCode: string
  sum: number | null
  transactionId: string
  transactionToken: string
  processId: string
  processToken: string
  transactionTypeId: string
  paymentType: string
  firstPaymentSum: string
  periodicalPaymentSum: string
  paymentsNum: string
  allPaymentsNum: string
  paymentDate: string
  asmachta: string
  description: string
  fullName: string
  payerPhone: string
  payerEmail: string
  cardSuffix: string
  cardType: string
  cardTypeCode: string
  cardBrand: string
  cardBrandCode: string
  cardExp: string
  cField1: string
}

export function isGrowConfigured(): boolean {
  return Boolean(process.env.GROW_USER_ID?.trim() && process.env.GROW_PAGE_CODE?.trim())
}

export function getGrowConfig(): GrowConfig {
  const userId = process.env.GROW_USER_ID?.trim() || ''
  const pageCode = process.env.GROW_PAGE_CODE?.trim() || ''
  if (!userId || !pageCode) {
    throw new Error('[grow] Missing GROW_USER_ID or GROW_PAGE_CODE')
  }
  const testMode = process.env.GROW_TEST_MODE === 'true'
  const baseUrl = (process.env.GROW_API_URL?.trim() || (testMode ? SANDBOX_API : PRODUCTION_API)).replace(
    /\/+$/,
    '',
  )
  return {
    userId,
    pageCode,
    apiKey: process.env.GROW_API_KEY?.trim() || '',
    baseUrl,
  }
}

export function encodeGrowProcessRef(processId: string, processToken: string): string {
  return `${processId}${PROCESS_SEP}${processToken}`
}

export function decodeGrowProcessRef(stored: string | null | undefined): {
  processId: string
  processToken: string
} | null {
  const raw = stored?.trim() || ''
  const sep = raw.indexOf(PROCESS_SEP)
  if (sep <= 0 || sep >= raw.length - 1) return null
  return { processId: raw.slice(0, sep), processToken: raw.slice(sep + 1) }
}

export function growProcessRefsMatch(stored: string | null | undefined, notice: GrowNotice): boolean {
  const saved = decodeGrowProcessRef(stored)
  if (!saved || !notice.processId || !notice.processToken) return false
  if (saved.processId !== notice.processId) return false
  return timingSafeStringEqual(saved.processToken, notice.processToken)
}

/** Grow's payment page requires an Israeli mobile, `05XXXXXXXX`. */
export function toGrowIsraeliMobile(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parsed = parsePhoneNumberFromString(trimmed, 'IL')
  if (!parsed?.isValid() || parsed.country !== 'IL') return null
  const kind = parsed.getType()
  if (kind && kind !== 'MOBILE' && kind !== 'FIXED_LINE_OR_MOBILE') return null
  const national = parsed.nationalNumber
  if (!/^5\d{8}$/.test(national)) return null
  return `0${national}`
}

/** Grow rejects a single given name. Letters, spaces, apostrophes, hyphens. */
export function toGrowFullName(raw: string): string | null {
  const cleaned = raw
    .replace(/[^\p{L}\p{M}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const parts = cleaned.split(' ').filter((part) => part.length > 1)
  if (parts.length < 2) return null
  return parts.join(' ').slice(0, 80)
}

export function toGrowDescription(raw: string): string {
  const ascii = raw
    .replace(/&/g, ' ')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return (ascii || 'Erythro AI audit').slice(0, 180)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function str(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function parseShekels(value: unknown): number | null {
  const raw = str(value).replace(/[^\d.-]/g, '')
  if (!raw) return null
  const amount = Number(raw)
  return Number.isFinite(amount) ? amount : null
}

export function amountsMatchShekels(expected: number, charged: number): boolean {
  if (!Number.isFinite(expected) || !Number.isFinite(charged)) return false
  return Math.round(expected * 100) === Math.round(charged * 100)
}

function noticeFrom(data: Record<string, unknown>): GrowNotice | null {
  const custom = asRecord(data.customFields)
  const transactionId = str(data.transactionId)
  const processId = str(data.processId)
  const statusCode = str(data.statusCode)
  if (!transactionId && !processId && !statusCode) return null
  return {
    statusCode,
    sum: parseShekels(data.sum),
    transactionId,
    transactionToken: str(data.transactionToken),
    processId,
    processToken: str(data.processToken),
    transactionTypeId: str(data.transactionTypeId),
    paymentType: str(data.paymentType),
    firstPaymentSum: str(data.firstPaymentSum),
    periodicalPaymentSum: str(data.periodicalPaymentSum),
    paymentsNum: str(data.paymentsNum),
    allPaymentsNum: str(data.allPaymentsNum),
    paymentDate: str(data.paymentDate),
    asmachta: str(data.asmachta),
    description: str(data.description),
    fullName: str(data.fullName),
    payerPhone: str(data.payerPhone),
    payerEmail: str(data.payerEmail),
    cardSuffix: str(data.cardSuffix),
    cardType: str(data.cardType),
    cardTypeCode: str(data.cardTypeCode),
    cardBrand: str(data.cardBrand),
    cardBrandCode: str(data.cardBrandCode),
    cardExp: str(data.cardExp),
    cField1: str(custom?.cField1 || data.cField1),
  }
}

/** Callback is form-data, often nested under `data`, sometimes JSON of the same shape. */
export function parseGrowNotice(root: unknown): GrowNotice | null {
  const rec = asRecord(root)
  if (!rec) return null
  const data = asRecord(rec.data)
  return noticeFrom(data || rec)
}

export function isGrowCallback(root: unknown): boolean {
  const notice = parseGrowNotice(root)
  return Boolean(notice && (notice.processId || notice.transactionId))
}

function apiOk(json: unknown): boolean {
  const root = asRecord(json)
  return str(root?.status) === '1'
}

function errText(json: unknown): string {
  const root = asRecord(json)
  const err = root?.err
  if (typeof err === 'string') return err.slice(0, 300)
  const rec = asRecord(err)
  if (!rec) return ''
  const id = rec.id
  const idText = id && typeof id === 'object' ? JSON.stringify(id) : str(id)
  const message = str(rec.message)
  return [idText, message].filter(Boolean).join(' ').slice(0, 300)
}

function httpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname !== 'localhost'
  } catch {
    return false
  }
}

async function postForm(path: string, fields: Record<string, string>): Promise<unknown> {
  const cfg = getGrowConfig()
  const body = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value !== '') body.append(key, value)
  }
  const res = await fetch(`${cfg.baseUrl}/api/light/server/1.0/${path}`, {
    method: 'POST',
    body,
    signal: AbortSignal.timeout(20_000),
  })
  const text = await res.text()
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { status: 0, err: text.slice(0, 200) }
  }
}

export async function createGrowPayment(input: CreatePaymentInput): Promise<CreatePaymentResponse> {
  const fullName = toGrowFullName(input.customer.name)
  const phone = toGrowIsraeliMobile(input.customer.phone || '')
  if (!fullName || !phone) {
    return { ok: false, message: 'Grow customer name or phone is not acceptable' }
  }
  if (!httpsUrl(input.successUrl) || !httpsUrl(input.cancelUrl)) {
    return { ok: false, message: 'Grow requires public HTTPS success and cancel URLs' }
  }

  const cfg = getGrowConfig()
  const sum = (Math.round(input.amount) / 100).toFixed(2)
  const fields: Record<string, string> = {
    pageCode: cfg.pageCode,
    userId: cfg.userId,
    chargeType: '1',
    sum,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    description: toGrowDescription(input.description),
    'pageField[fullName]': fullName,
    'pageField[phone]': phone,
    'pageField[email]': input.customer.email.trim(),
    paymentNum: '1',
    saveCardToken: '0',
    notifyUrl: input.webhookUrl,
    cField1: input.metadata?.submissionId || '',
  }
  if (cfg.apiKey) fields.apiKey = cfg.apiKey

  try {
    const json = await postForm('createPaymentProcess', fields)
    if (!apiOk(json)) {
      console.error('[grow] createPaymentProcess failed', errText(json))
      return { ok: false, message: 'Grow returned an error', code: errText(json) }
    }
    const data = asRecord(asRecord(json)?.data)
    const paymentUrl = str(data?.url || data?.paymentUrl || data?.link)
    const processId = str(data?.processId)
    const processToken = str(data?.processToken)
    if (!paymentUrl || !processId || !processToken) {
      console.error('[grow] createPaymentProcess missing url or process token')
      return { ok: false, message: 'Grow did not return a payment URL' }
    }
    return {
      ok: true,
      paymentUrl,
      transactionUid: encodeGrowProcessRef(processId, processToken),
    }
  } catch (err) {
    console.error('[grow] createPaymentProcess error:', err instanceof Error ? err.message : 'network')
    return { ok: false, message: 'Could not reach Grow' }
  }
}

export async function lookupGrowTransaction(notice: GrowNotice): Promise<GrowNotice | null> {
  if (!notice.transactionId || !notice.transactionToken) return null
  const cfg = getGrowConfig()
  try {
    const json = await postForm('getTransactionInfo', {
      pageCode: cfg.pageCode,
      transactionId: notice.transactionId,
      transactionToken: notice.transactionToken,
    })
    if (!apiOk(json)) {
      console.warn('[grow] getTransactionInfo not ready', errText(json))
      return null
    }
    const direct = parseGrowNotice(json)
    if (direct?.statusCode || direct?.transactionId) return direct
    const nested = asRecord(asRecord(asRecord(json)?.data)?.transaction)
    return nested ? parseGrowNotice({ data: nested }) : null
  } catch (err) {
    console.error('[grow] getTransactionInfo error:', err instanceof Error ? err.message : 'network')
    return null
  }
}

/** Ack only. Grow may capture the charge even when this call fails. */
export async function approveGrowTransaction(notice: GrowNotice): Promise<boolean> {
  if (!notice.transactionId || !notice.transactionToken) return false
  const cfg = getGrowConfig()
  const fields: Record<string, string> = {
    pageCode: cfg.pageCode,
    transactionId: notice.transactionId,
    transactionToken: notice.transactionToken,
    transactionTypeId: notice.transactionTypeId,
    paymentType: notice.paymentType,
    sum: notice.sum == null ? '' : String(notice.sum),
    firstPaymentSum: notice.firstPaymentSum,
    periodicalPaymentSum: notice.periodicalPaymentSum,
    paymentsNum: notice.paymentsNum,
    allPaymentsNum: notice.allPaymentsNum,
    paymentDate: notice.paymentDate,
    asmachta: notice.asmachta,
    description: notice.description,
    fullName: notice.fullName,
    payerPhone: notice.payerPhone,
    payerEmail: notice.payerEmail,
    cardSuffix: notice.cardSuffix,
    cardType: notice.cardType,
    cardTypeCode: notice.cardTypeCode,
    cardBrand: notice.cardBrand,
    cardBrandCode: notice.cardBrandCode,
    cardExp: notice.cardExp,
    processId: notice.processId,
    processToken: notice.processToken,
  }
  try {
    const json = await postForm('approveTransaction', fields)
    if (apiOk(json)) return true
    const errRec = asRecord(asRecord(json)?.err)
    const errId = str(errRec?.id)
    if (errId === '712') return true
    console.error('[grow] approveTransaction failed', errText(json))
    return false
  } catch (err) {
    console.error('[grow] approveTransaction error:', err instanceof Error ? err.message : 'network')
    return false
  }
}
