'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { pushAiReferralToDataLayer } from '@/lib/aiReferral'
import { readCampaignConfigParams } from '@/lib/adsConversion'
import { isProductionAnalyticsHost } from '@/lib/vercelHost'
import {
  clearAnalyticsCookies,
  CONSENT_ACCEPTED,
  CONSENT_DECLINED,
  CONSENT_EVENT,
  hasAcceptedConsent,
  type ConsentValue,
} from '@/lib/privacyConsent'

const GA_ID = 'G-F3BTVWGDRS'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: (
      command: string,
      eventOrAction?: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void
    __ERYTHRO_GA_ID__?: string
    __ERYTHRO_GA_CONFIGURED__?: boolean
    __ERYTHRO_META_PAGEVIEW_SENT__?: boolean
    __ERYTHRO_INITIAL_UTM__?: Record<string, string | undefined>
    __ERYTHRO_AW_ID__?: string
    __ERYTHRO_META_PIXEL_ID__?: string
    __ERYTHRO_ANALYTICS_DISABLED__?: boolean
  }
}

function updateAnalyticsConsent(consent: ConsentValue) {
  if (typeof window === 'undefined') return
  if (!isProductionAnalyticsHost(window.location.hostname)) return
  const accepted = consent === CONSENT_ACCEPTED

  if (typeof window.gtag === 'function') {
    const granted = accepted ? 'granted' : 'denied'
    window.gtag('consent', 'update', {
      ad_storage: granted,
      ad_user_data: granted,
      ad_personalization: granted,
      analytics_storage: granted,
      functionality_storage: 'granted',
      security_storage: 'granted',
    })
  }

  if (typeof window.fbq === 'function') {
    window.fbq('consent', accepted ? 'grant' : 'revoke')
    if (accepted && !window.__ERYTHRO_META_PAGEVIEW_SENT__) {
      window.__ERYTHRO_META_PAGEVIEW_SENT__ = true
      window.fbq('track', 'PageView')
    }
  }
}

export default function AnalyticsLoader() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!isProductionAnalyticsHost(window.location.hostname)) return
    const accepted = hasAcceptedConsent()
    setEnabled(accepted)
    if (accepted) updateAnalyticsConsent(CONSENT_ACCEPTED)

    const onConsentChanged = (event: Event) => {
      const value = (event as CustomEvent<ConsentValue>).detail
      if (value === CONSENT_ACCEPTED) {
        setEnabled(true)
        updateAnalyticsConsent(CONSENT_ACCEPTED)
        return
      }
      updateAnalyticsConsent(CONSENT_DECLINED)
      clearAnalyticsCookies()
    }

    window.addEventListener(CONSENT_EVENT, onConsentChanged)
    return () => window.removeEventListener(CONSENT_EVENT, onConsentChanged)
  }, [])

  useEffect(() => {
    if (!enabled) return
    pushAiReferralToDataLayer()
    if (typeof window !== 'undefined' && typeof window.gtag === 'function' && !window.__ERYTHRO_GA_CONFIGURED__) {
      window.__ERYTHRO_GA_CONFIGURED__ = true
      window.gtag('config', GA_ID, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        send_page_view: true,
        ...readCampaignConfigParams(),
      })
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <Analytics />
      {/* gtag.js already loaded in AnalyticsBootstrap (AW-…); do not load a second copy */}
      <Script id="google-analytics-config" strategy="afterInteractive">
        {`
          if (typeof window.gtag === 'function' && !window.__ERYTHRO_GA_CONFIGURED__) {
            window.__ERYTHRO_GA_CONFIGURED__ = true;
            gtag('config', '${GA_ID}', Object.assign({
              anonymize_ip: true,
              allow_google_signals: false,
              allow_ad_personalization_signals: false,
              send_page_view: true
            }, window.__ERYTHRO_INITIAL_UTM__ || {}));
          }
        `}
      </Script>
    </>
  )
}
