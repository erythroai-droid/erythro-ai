import { ANALYTICS_GA_ID } from '@/lib/analyticsEager'
import { readCampaignConfigParams } from '@/lib/adsConversion'

/**
 * GA4 funnel events for the AI-audit landing (ai-audit-{en,ru,he}.erythro.ai, /lp/audit/leak/{locale}).
 *
 * Every event carries `lp: 'ai_audit'` + `lp_locale`, so the landing is separable from the calculator in GA4.
 * Events go through gtag (Consent Mode): before the cookie banner is accepted GA gets cookieless pings only,
 * no `_ga` cookie is set here (we never grant consent from these events — PIT: calc funnel test rollback).
 *
 * Events:
 * - `lp_step`        step: form | details | waiting | ready | failed  (`details` = form step 2; ready also sends `report_id`)
 * - `form_start`     first typing in the form (once per page view)
 * - `whatsapp_click` placement: header | faq | result | other
 * - `lp_cta_click`   cta: sample_report | open_report | to_form | nav | report_cta | …
 * - `promo_video`    action: sound_on | sound_off | next | prev | dot | complete; video label
 * The lead itself stays `qualify_lead` (lead_source = ai_audit) from trackFreeAuditLead.
 */

export type LeakLpEventName = 'lp_step' | 'form_start' | 'whatsapp_click' | 'lp_cta_click' | 'promo_video'

const LP_TAG = 'ai_audit'

function lpLocale(): string {
  if (typeof window === 'undefined') return ''
  const m = window.location.hostname.match(/^ai-audit-(en|ru|he)\./) || window.location.pathname.match(/\/lp\/audit\/leak\/(en|ru|he)/)
  return m ? m[1] : ''
}

/** True on the AI-audit landing (subdomain or internal path). */
export function isLeakLpPage(): boolean {
  return lpLocale() !== ''
}

export function trackLeakLp(name: LeakLpEventName, params: Record<string, string | number | undefined> = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  const clean: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') clean[k] = v
  try {
    window.gtag('event', name, {
      send_to: ANALYTICS_GA_ID,
      lp: LP_TAG,
      lp_locale: lpLocale(),
      ...readCampaignConfigParams(),
      ...clean,
    })
  } catch {
    // gtag not ready / blocked
  }
}

/** Delegated click tracking for links / buttons inside the landing (`root`). Returns a cleanup. */
export function bindLeakLpClickTracking(root: HTMLElement, sampleHref = ''): () => void {
  const onClick = (e: MouseEvent) => {
    const el = (e.target as Element | null)?.closest?.('a, button')
    if (!el || !root.contains(el)) return
    if (el.closest('.lk-promo')) return // the video slider reports its own events
    const explicit = el.getAttribute('data-ga')
    const href = el instanceof HTMLAnchorElement ? el.href : ''
    const label = (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 80)

    if (/wa\.me|api\.whatsapp\.com/.test(href)) {
      const placement = el.closest('header') ? 'header' : el.closest('#faq') ? 'faq' : el.closest('.lk-result') ? 'result' : 'other'
      trackLeakLp('whatsapp_click', { placement, label })
      return
    }
    if (explicit) {
      trackLeakLp('lp_cta_click', { cta: explicit, label })
      return
    }
    if (href.includes('/audit/report/') || /[?&]report=/.test(href)) {
      const sample = Boolean(sampleHref) && href.split('#')[0] === sampleHref.split('#')[0]
      trackLeakLp('lp_cta_click', { cta: sample ? 'sample_report' : 'open_report', label })
      return
    }
    if (el.closest('header') && href.includes('#')) {
      trackLeakLp('lp_cta_click', { cta: 'nav', target: href.split('#')[1], label })
      return
    }
    if (el.closest('.lk-result') && (el.className.toString().includes('lk-btn') || el.className.toString().includes('calc-cta'))) {
      trackLeakLp('lp_cta_click', { cta: 'report_cta', label })
    }
  }
  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
