import { setConsentValue, CONSENT_ACCEPTED } from '@/lib/privacyConsent'

const PURCHASE_SEND_TO = 'AW-18453652197/-mcPCMys6Z0dEOXFsd9E'
const LEAD_SEND_TO = 'AW-18453652197/L4VgCMWPhZ4dEOXFsd9E'
const SENT_KEY_PREFIX = 'erythro:ads-purchase:'
const LEAD_KEY_PREFIX = 'erythro:ads-lead:'
const META_LEAD_KEY_PREFIX = 'erythro:meta-lead:'

declare global {
  interface Window {
    fbq?: (
      command: string,
      eventOrAction?: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void
  }
}

/** Google Ads «Покупка». Fires once per submission per browser; Ads also dedupes by transaction_id. */
export function trackAdsPurchase(transactionId: string, value: number | null) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function' || !transactionId) return

  const key = `${SENT_KEY_PREFIX}${transactionId}`
  try {
    if (window.localStorage.getItem(key)) return
    window.localStorage.setItem(key, '1')
  } catch {
    // Storage blocked: rely on transaction_id dedupe in Google Ads.
  }

  window.gtag('event', 'conversion', {
    send_to: PURCHASE_SEND_TO,
    transaction_id: transactionId,
    ...(typeof value === 'number' && value > 0 ? { value, currency: 'ILS' } : {}),
  })
}

/** Google Ads «Отправка формы». Fires once per free-audit submission. */
export function trackAdsLead(transactionId: string) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function' || !transactionId) return

  const key = `${LEAD_KEY_PREFIX}${transactionId}`
  try {
    if (window.localStorage.getItem(key)) return
    window.localStorage.setItem(key, '1')
  } catch {
    // Storage blocked: rely on transaction_id dedupe in Google Ads.
  }

  window.gtag('event', 'conversion', {
    send_to: LEAD_SEND_TO,
    transaction_id: transactionId,
    value: 1,
    currency: 'ILS',
  })
}

/** Meta Pixel standard event «Lead». Fires once per free-audit submission. */
export function trackMetaLead(transactionId: string) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function' || !transactionId) return

  const key = `${META_LEAD_KEY_PREFIX}${transactionId}`
  try {
    if (window.localStorage.getItem(key)) return
    window.localStorage.setItem(key, '1')
  } catch {
    // Storage blocked: fire once per call site success path.
  }

  // Ensure Meta Pixel is unblocked/granted upon successful lead submission
  try {
    window.fbq('consent', 'grant')
  } catch {
    // Storage blocked or fbq error
  }

  window.fbq('track', 'Lead', { content_name: 'free_audit' }, { eventID: transactionId })
}

/** Free-audit success: Google Ads + Meta Lead (same transaction id). */
export function trackFreeAuditLead(transactionId: string) {
  try {
    setConsentValue(CONSENT_ACCEPTED)
  } catch {
    // ignore
  }
  trackAdsLead(transactionId)
  trackMetaLead(transactionId)
}

