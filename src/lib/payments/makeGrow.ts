/**
 * Grow checkout through Make.
 *
 * The site does not call Meshulam. It posts the order to a Make scenario
 * (Create Payment Link) and reads the hosted URL from that scenario's reply.
 * After Grow notifies Make, Make approves the transaction and posts the paid
 * result to /api/payment/make-paid.
 */

import { timingSafeStringEqual } from '@/lib/agentAuth'
import type { CreatePaymentInput, CreatePaymentResponse } from './types'

export function isMakeGrowConfigured(): boolean {
  return Boolean(makeWebhookUrl() && makeNotifyUrl())
}

export function makePaymentSecret(): string {
  return process.env.MAKE_PAYMENT_SECRET?.trim() || ''
}

export function makePaidAuthorized(headerValue: string | null | undefined): boolean {
  const expected = makePaymentSecret()
  if (!expected || typeof headerValue !== 'string') return false
  const provided = headerValue.trim()
  return Boolean(provided) && timingSafeStringEqual(provided, expected)
}

function makeWebhookUrl(): string {
  return process.env.MAKE_GROW_WEBHOOK_URL?.trim() || ''
}

function makeNotifyUrl(): string {
  return process.env.MAKE_GROW_NOTIFY_URL?.trim() || ''
}

function httpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname !== 'localhost'
  } catch {
    return false
  }
}

function isHostedPaymentUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    if (host === 'erythro.ai' || host.endsWith('.erythro.ai')) return false
    if (host === 'make.com' || host.endsWith('.make.com')) return false
    return true
  } catch {
    return false
  }
}

/** Prefer an explicit url field. Ignore the success page and the Make hook. */
export function paymentUrlFromMakeReply(root: unknown): string | null {
  const preferred = preferredUrl(root, 0)
  if (preferred) return preferred
  return firstHostedUrl(root, 0)
}

function preferredUrl(value: unknown, depth: number): string | null {
  if (depth > 5 || !value || typeof value !== 'object') return null
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = preferredUrl(item, depth + 1)
      if (found) return found
    }
    return null
  }
  const rec = value as Record<string, unknown>
  for (const key of ['url', 'paymentUrl', 'link', 'paymentLink']) {
    if (typeof rec[key] === 'string' && isHostedPaymentUrl(rec[key] as string)) {
      return (rec[key] as string).trim()
    }
  }
  for (const nested of Object.values(rec)) {
    const found = preferredUrl(nested, depth + 1)
    if (found) return found
  }
  return null
}

function firstHostedUrl(value: unknown, depth: number): string | null {
  if (depth > 5 || value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return isHostedPaymentUrl(trimmed) ? trimmed : null
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstHostedUrl(item, depth + 1)
      if (found) return found
    }
    return null
  }
  if (typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      const found = firstHostedUrl(nested, depth + 1)
      if (found) return found
    }
  }
  return null
}

export async function createMakeGrowPayment(
  input: CreatePaymentInput,
): Promise<CreatePaymentResponse> {
  const webhook = makeWebhookUrl()
  const notifyUrl = makeNotifyUrl()
  if (!httpsUrl(webhook) || !httpsUrl(notifyUrl)) {
    return { ok: false, message: 'Make Grow webhook URLs are not public HTTPS' }
  }
  if (!httpsUrl(input.successUrl) || !httpsUrl(input.cancelUrl)) {
    return { ok: false, message: 'Make Grow requires public HTTPS success and cancel URLs' }
  }

  const submissionId = input.metadata?.submissionId || ''
  const fullName = input.customer.name.trim()
  const phone = (input.customer.phone || '').trim()
  const price = (Math.round(input.amount) / 100).toFixed(2)
  const body = {
    fullName,
    phone,
    email: input.customer.email.trim(),
    title: input.description,
    productName: input.description,
    price,
    quantity: '1',
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    notifyUrl,
    cField1: submissionId,
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    })
    const text = await res.text()
    let parsed: unknown = text
    try {
      parsed = JSON.parse(text) as unknown
    } catch {
      parsed = text
    }
    if (!res.ok) {
      console.error('[make-grow] webhook HTTP', res.status)
      return { ok: false, message: 'Make did not accept the payment request' }
    }
    const paymentUrl = paymentUrlFromMakeReply(parsed)
    if (!paymentUrl) {
      console.error('[make-grow] webhook reply has no payment URL')
      return { ok: false, message: 'Make did not return a payment URL' }
    }
    return {
      ok: true,
      paymentUrl,
      transactionUid: submissionId ? `make:${submissionId}` : 'make',
    }
  } catch (err) {
    console.error('[make-grow] webhook error:', err instanceof Error ? err.message : 'network')
    return { ok: false, message: 'Could not reach Make' }
  }
}
