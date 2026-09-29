/**
 * Payment provider abstraction types.
 * Grow is the live checkout. PayPlus remains for an old callback only.
 */

export type PaymentProvider = 'grow' | 'payplus'

export type PaymentStatus = 'none' | 'pending' | 'paid' | 'failed' | 'refunded'

export interface CreatePaymentInput {
  /** Amount in minor units (agorot). e.g. 29900 = ₪299.00 */
  amount: number
  /** ISO 4217 currency code. Defaults to ILS. */
  currency?: string
  /** Human-readable description shown on the payment page. */
  description: string
  /** Customer details for the payment page. */
  customer: {
    name: string
    email: string
    phone?: string
  }
  /** Site locale. PayPlus page language is he or en (ru uses en). */
  locale?: 'en' | 'ru' | 'he'
  /** URL to redirect to after successful payment. */
  successUrl: string
  /** URL to redirect to if payment is cancelled. */
  cancelUrl: string
  /** Server-side webhook URL for payment notifications. */
  webhookUrl: string
  /** Arbitrary metadata stored alongside the transaction (e.g. submissionId). */
  metadata?: Record<string, string>
}

export interface CreatePaymentResult {
  ok: true
  /** URL to redirect the customer to for payment. */
  paymentUrl: string
  /** Provider-assigned transaction/page UID for tracking. */
  transactionUid: string
}

export interface CreatePaymentError {
  ok: false
  message: string
  /** Raw provider error code, if any. */
  code?: string
}

export type CreatePaymentResponse = CreatePaymentResult | CreatePaymentError
