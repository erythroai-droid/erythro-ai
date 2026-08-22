'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { pushAiReferralToDataLayer } from '@/lib/aiReferral'
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
    __ERYTHRO_GA_ID__?: string
  }
}

function updateAnalyticsConsent(consent: ConsentValue) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: consent === CONSENT_ACCEPTED ? 'granted' : 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
  })
}

export default function AnalyticsLoader() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(hasAcceptedConsent())

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
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <Analytics />
      <Script
        id="google-analytics-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          if (typeof window.gtag !== 'function') {
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
          }
          gtag('config', '${GA_ID}', {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            send_page_view: true
          });
        `}
      </Script>
    </>
  )
}
