import { setConsentValue, CONSENT_ACCEPTED } from '@/lib/privacyConsent'

const GA_ID = 'G-F3BTVWGDRS'
const PURCHASE_SEND_TO = 'AW-18453652197/-mcPCMys6Z0dEOXFsd9E'
const LEAD_SEND_TO = 'AW-18453652197/L4VgCMWPhZ4dEOXFsd9E'
const SENT_KEY_PREFIX = 'erythro:ads-purchase:'
const LEAD_KEY_PREFIX = 'erythro:ads-lead:'
const GA_PURCHASE_KEY_PREFIX = 'erythro:ga-purchase:'
const GA_LEAD_KEY_PREFIX = 'erythro:ga-lead:'
const META_LEAD_KEY_PREFIX = 'erythro:meta-lead:'

declare global {
  interface Window {
    __ERYTHRO_GA_CONFIGURED__?: boolean
    fbq?: (
      command: string,
      eventOrAction?: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void
  }
}

/**
 * Synchronously grants consent and initializes GA4 config if a user submits a form
 * (with form privacy consent) or completes a purchase before clicking the cookie banner.
 */
export function ensureAnalyticsConsentAndGaConfig() {
  if (typeof window === 'undefined') return

  try {
    setConsentValue(CONSENT_ACCEPTED)
  } catch {
    // Storage blocked
  }

  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
      functionality_storage: 'granted',
      security_storage: 'granted',
    })

    if (!window.__ERYTHRO_GA_CONFIGURED__) {
      window.__ERYTHRO_GA_CONFIGURED__ = true
      window.gtag('config', GA_ID, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        send_page_view: true,
      })
    }
  }
}

/** GA4 Key Events «purchase» + «close_convert_lead». Fires once per transactionId. */
export function trackGaPurchase(transactionId: string, value: number | null) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function' || !transactionId) return

  const key = `${GA_PURCHASE_KEY_PREFIX}${transactionId}`
  try {
    if (window.localStorage.getItem(key)) return
    window.localStorage.setItem(key, '1')
  } catch {
    // Storage blocked
  }

  const numericValue = typeof value === 'number' && value > 0 ? value : 1

  window.gtag('event', 'purchase', {
    send_to: GA_ID,
    transaction_id: transactionId,
    value: numericValue,
    currency: 'ILS',
  })

  window.gtag('event', 'close_convert_lead', {
    send_to: GA_ID,
    transaction_id: transactionId,
    value: numericValue,
    currency: 'ILS',
  })
}

/** GA4 Key Event «qualify_lead» (and optional «close_convert_lead» for package orders). */
export function trackGaLead(
  transactionId: string,
  options?: { leadSource?: string; planSlug?: string; closeConvert?: boolean },
) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function' || !transactionId) return

  const key = `${GA_LEAD_KEY_PREFIX}${transactionId}`
  try {
    if (window.localStorage.getItem(key)) return
    window.localStorage.setItem(key, '1')
  } catch {
    // Storage blocked
  }

  const eventParams: Record<string, unknown> = {
    send_to: GA_ID,
    transaction_id: transactionId,
    value: 1,
    currency: 'ILS',
    ...(options?.leadSource ? { lead_source: options.leadSource } : {}),
    ...(options?.planSlug ? { plan_slug: options.planSlug } : {}),
  }

  window.gtag('event', 'qualify_lead', eventParams)

  if (options?.closeConvert) {
    window.gtag('event', 'close_convert_lead', eventParams)
  }
}

/** Google Ads «Покупка» + GA4 «purchase» / «close_convert_lead». Fires once per submission per browser. */
export function trackAdsPurchase(transactionId: string, value: number | null) {
  if (typeof window === 'undefined' || !transactionId) return

  ensureAnalyticsConsentAndGaConfig()

  if (typeof window.gtag === 'function') {
    const key = `${SENT_KEY_PREFIX}${transactionId}`
    let alreadySent = false
    try {
      if (window.localStorage.getItem(key)) {
        alreadySent = true
      } else {
        window.localStorage.setItem(key, '1')
      }
    } catch {
      // Storage blocked: rely on transaction_id dedupe in Google Ads.
    }

    if (!alreadySent) {
      window.gtag('event', 'conversion', {
        send_to: PURCHASE_SEND_TO,
        transaction_id: transactionId,
        ...(typeof value === 'number' && value > 0 ? { value, currency: 'ILS' } : {}),
      })
    }
  }

  trackGaPurchase(transactionId, value)
}

/** Google Ads «Отправка формы». Fires once per submission. */
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

/** Meta Pixel standard event «Lead». Fires once per submission. */
export function trackMetaLead(transactionId: string, contentName = 'free_audit') {
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

  window.fbq('track', 'Lead', { content_name: contentName }, { eventID: transactionId })
}

/** Free-audit success: Google Ads + GA4 qualify_lead + Meta Lead (same transaction id). */
export function trackFreeAuditLead(transactionId: string) {
  ensureAnalyticsConsentAndGaConfig()
  trackAdsLead(transactionId)
  trackGaLead(transactionId, { leadSource: 'audit', planSlug: 'audit-free' })
  trackMetaLead(transactionId, 'free_audit')
}

/** Package order lead (/order/free-start, /order/enterprise-custom, etc.). */
export function trackOrderLead(transactionId: string, planSlug: string) {
  if (planSlug === 'audit-free') {
    trackFreeAuditLead(transactionId)
    return
  }
  ensureAnalyticsConsentAndGaConfig()
  trackAdsLead(transactionId)
  trackGaLead(transactionId, {
    leadSource: 'order',
    planSlug,
    closeConvert: true,
  })
  trackMetaLead(transactionId, planSlug || 'order_lead')
}

/** Contact form / modal lead (/contacts or ContactModal). */
export function trackContactLead(transactionId: string, source = 'contact') {
  ensureAnalyticsConsentAndGaConfig()
  trackAdsLead(transactionId)
  trackGaLead(transactionId, { leadSource: source })
  trackMetaLead(transactionId, source)
}
