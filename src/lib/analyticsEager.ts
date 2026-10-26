import { isAuditLpHost } from '@/lib/auditLp'

/** Google Ads / GA4 / Meta IDs — keep in sync with Ads & Events Manager. */
export const ANALYTICS_GA_ID = 'G-F3BTVWGDRS'
export const ANALYTICS_AW_ID = 'AW-18453652197'
export const ANALYTICS_META_PIXEL_ID = '2395401914532727'

declare global {
  interface Window {
    /** Injects gtag.js + Meta Pixel once (no-op if already requested or analytics disabled). */
    __erythroLoadAnalyticsScripts?: () => void
    __ERYTHRO_ANALYTICS_SCRIPTS_REQUESTED__?: boolean
    __ERYTHRO_ANALYTICS_DEFERRED__?: boolean
    __ERYTHRO_ANALYTICS_DISABLED__?: boolean
  }
}

/**
 * True when ad / conversion surfaces need gtag + Meta immediately (PIT-108):
 * paid click params, ads LP hosts, `/lp/audit/*`, `/audit`, `/order/*`.
 * Organic marketing pages (`/`, `/portfolio`, …) defer network until consent or conversion.
 */
export function needsEagerAdAnalytics(
  pathname: string,
  search?: string,
  hostname?: string,
): boolean {
  const cleanPath = (pathname || '/').split('?')[0] || '/'
  const host =
    hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '')

  if (isAuditLpHost(host)) return true
  if (cleanPath === '/audit' || cleanPath.startsWith('/audit/')) return true
  if (cleanPath.startsWith('/lp/audit')) return true
  if (cleanPath.startsWith('/order/')) return true

  const rawSearch =
    search !== undefined
      ? search
      : typeof window !== 'undefined'
        ? window.location.search
        : ''
  if (!rawSearch) return false

  try {
    const sp = new URLSearchParams(
      rawSearch.startsWith('?') ? rawSearch.slice(1) : rawSearch,
    )
    return (
      sp.has('fbclid') ||
      sp.has('gclid') ||
      sp.has('gbraid') ||
      sp.has('wbraid') ||
      sp.has('utm_source') ||
      sp.has('utm_campaign') ||
      sp.has('utm_medium')
    )
  } catch {
    return false
  }
}

/** Start loading gtag.js + fbevents if the organic path deferred them. */
export function requestAnalyticsScripts(): void {
  if (typeof window === 'undefined') return
  try {
    window.__erythroLoadAnalyticsScripts?.()
  } catch {
    // ignore
  }
}
