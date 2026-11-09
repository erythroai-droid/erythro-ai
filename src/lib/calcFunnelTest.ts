import { readCampaignConfigParams } from '@/lib/adsConversion'
import { ANALYTICS_GA_ID, requestAnalyticsScripts } from '@/lib/analyticsEager'
import { CONSENT_ACCEPTED, CONSENT_DECLINED, getConsentValue } from '@/lib/privacyConsent'

/**
 * TEMPORARY test: GA4 step events on the leak calculator before cookie consent.
 * Purpose: find where visitors drop off. No cookies (`client_storage: 'none'`), ad storage stays denied,
 * and the «Decline» button stops it.
 * To remove: delete this file and every `calcFunnel` call in AuditCalcFlow.tsx, plus `onSubmitFailed` in AuditLpForm.tsx.
 */
export type CalcFunnelEvent =
  | 'calc_01_view'
  | 'calc_02_form_focus'
  | 'calc_03_step1_done'
  | 'calc_04_step2_input'
  | 'calc_05_lead_sent'
  | 'calc_06_report_ready'
  | 'calc_07_whatsapp_click'
  | 'calc_return_from_email'
  | 'calc_skip_step2'
  | 'calc_percent_mode'
  | 'calc_err_invalid'
  | 'calc_err_submit'
  | 'calc_err_audit'

const sent = new Set<CalcFunnelEvent>()
let started = false

function randomClientId(): string {
  const random = window.crypto.getRandomValues(new Uint32Array(1))[0]
  return `${random}.${Math.floor(Date.now() / 1000)}`
}

/** Sends one step, at most once per page load. */
export function calcFunnel(event: CalcFunnelEvent, params?: Record<string, string | number>) {
  if (!started || sent.has(event) || typeof window.gtag !== 'function') return
  if (getConsentValue() === CONSENT_DECLINED) return
  sent.add(event)
  window.gtag('event', event, { send_to: ANALYTICS_GA_ID, ...params })
}

/** `email_return`: opened from the report email; the URL holds the report key and must not reach GA4. */
export function startCalcFunnel(entry: 'landing' | 'email_return') {
  if (started || typeof window === 'undefined' || typeof window.gtag !== 'function') return
  const consent = getConsentValue()
  if (consent === CONSENT_DECLINED) return
  started = true

  requestAnalyticsScripts()
  const accepted = consent === CONSENT_ACCEPTED
  if (!accepted) window.gtag('consent', 'update', { analytics_storage: 'granted' })

  if (!window.__ERYTHRO_GA_CONFIGURED__) {
    window.__ERYTHRO_GA_CONFIGURED__ = true
    window.gtag('config', ANALYTICS_GA_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: true,
      ...(accepted ? {} : { client_storage: 'none', client_id: randomClientId() }),
      ...(entry === 'email_return'
        ? { page_location: `${window.location.origin}${window.location.pathname}` }
        : readCampaignConfigParams()),
    })
  }

  calcFunnel(entry === 'email_return' ? 'calc_return_from_email' : 'calc_01_view')
}
