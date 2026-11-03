'use client'

import React, { useEffect } from 'react'
import CookieConsent from '@/components/CookieConsent'
import WhatsAppButton from '@/components/WhatsAppButton'
import { SiteContentProvider } from '@/components/SiteContentProvider'
import AuditCalcFlow from '@/components/audit/AuditCalcFlow'
import type { SiteContent } from '@/lib/defaultContent'
import type { AuditPageContent } from '@/lib/auditPage'
import type { AuditLpLocale } from '@/lib/auditLp'
import { auditCalcCopy as copy, tCalc } from '@/lib/auditCalcCopy'
import { mainSiteUrl } from '@/lib/auditLp'

/**
 * Calculator LP, design 2: Full-height Split-Screen architecture.
 * Left column: White/light informational hero with 3 pillars and 5 loss metrics.
 * Right column: Full-height dark coal action console with integrated step-by-step tracker.
 */
export default function AuditCalcClient({
  locale,
  content,
  auditPageContent,
}: {
  locale: AuditLpLocale
  content: SiteContent
  auditPageContent: AuditPageContent
}) {
  const isHebrew = locale === 'he'

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = isHebrew ? 'rtl' : 'ltr'
  }, [locale, isHebrew])

  return (
    <SiteContentProvider value={content}>
      <div
        dir={isHebrew ? 'rtl' : 'ltr'}
        lang={locale}
        className="relative isolate min-h-screen bg-[#f8f8f8] font-sans text-[#0F172A] selection:bg-[#e52421]/15 selection:text-[#e52421]"
        style={{
          fontFamily: isHebrew
            ? 'var(--font-heebo), "Heebo", system-ui, sans-serif'
            : 'var(--font-inter), var(--font-inter-cyrillic), "Inter", system-ui, sans-serif',
          ['--font-sans' as string]: isHebrew
            ? 'var(--font-heebo), "Heebo", system-ui, sans-serif'
            : 'var(--font-inter), var(--font-inter-cyrillic), "Inter", system-ui, sans-serif',
        }}
      >
        <h1 className="sr-only">{tCalc(copy.sectionTitle, locale)}</h1>
        <AuditCalcFlow locale={locale} page={auditPageContent} />
        <WhatsAppButton
          alwaysVisible
          className="fixed bottom-24 sm:bottom-28 end-5 sm:end-8 z-[70] flex h-[54px] w-[54px] items-center justify-center"
        />
        <CookieConsent locale={locale} theme="light" privacyHref={mainSiteUrl('/privacy')} />
      </div>
    </SiteContentProvider>
  )
}
