/**
 * Signed access for /order/audit-pro-ads (email CTA only).
 * Token: `{submissionId}.{expUnixSec}.{hmac}` over PAYLOAD_SECRET.
 */
import { createHmac } from 'node:crypto'
import { timingSafeStringEqual } from '@/lib/agentAuth'

/** Match auditProOffer PRO_OFFER_PROMO_MS (72h). */
const DEFAULT_PROMO_MS = 72 * 60 * 60 * 1000

function secret(): string {
  return process.env.PAYLOAD_SECRET?.trim() || ''
}

export type ProOfferCheckoutClaims = {
  submissionId: string
  expSec: number
}

export function signProOfferCheckoutAccess(
  submissionId: string | number,
  expiresAtMs: number = Date.now() + DEFAULT_PROMO_MS,
): string {
  const key = secret()
  if (!key) throw new Error('[pro-offer] PAYLOAD_SECRET is required to sign checkout access')
  const sid = String(submissionId).trim()
  if (!/^\d+$/.test(sid)) throw new Error('[pro-offer] submissionId must be numeric')
  const expSec = Math.floor(expiresAtMs / 1000)
  const payload = `${sid}.${expSec}`
  const sig = createHmac('sha256', key).update(`pro-offer-checkout:${payload}`).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyProOfferCheckoutAccess(
  token: string | null | undefined,
  nowMs: number = Date.now(),
): ProOfferCheckoutClaims | null {
  const raw = token?.trim() || ''
  if (!raw) return null
  const key = secret()
  if (!key) return null

  const parts = raw.split('.')
  if (parts.length !== 3) return null
  const [sid, expStr, sig] = parts
  if (!/^\d+$/.test(sid) || !/^\d+$/.test(expStr) || !sig) return null

  const expSec = Number(expStr)
  if (!Number.isFinite(expSec) || expSec * 1000 < nowMs) return null

  const payload = `${sid}.${expSec}`
  const expected = createHmac('sha256', key)
    .update(`pro-offer-checkout:${payload}`)
    .digest('base64url')
  if (!timingSafeStringEqual(expected, sig)) return null

  return { submissionId: sid, expSec }
}
