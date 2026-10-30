'use client'

import React, { useEffect } from 'react'
import CookieConsent from '@/components/CookieConsent'
import WhatsAppButton from '@/components/WhatsAppButton'
import { SiteContentProvider } from '@/components/SiteContentProvider'
import AuditCalcFlow from '@/components/audit/AuditCalcFlow'
import { AuditLpFooter } from '@/components/audit/AuditLpClient'
import type { SiteContent } from '@/lib/defaultContent'
import type { AuditPageContent } from '@/lib/auditPage'
import { AUDIT_LP_LOCALES, auditLpHrefForLocale, mainSiteUrl, type AuditLpLocale } from '@/lib/auditLp'
import { auditCalcCopy as copy, tCalc } from '@/lib/auditCalcCopy'

/**
 * Calculator LP, design 2: styled like the audit report, light theme only.
 * Header is the report's own: red dot + wordmark, language links.
 * Fonts: Inter for Russian and English, Heebo for Hebrew.
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
        className="relative isolate min-h-screen overflow-x-hidden bg-[#F8F9FB] font-sans text-[#0F172A] flex flex-col justify-between selection:bg-[#e52421]/15 selection:text-[#e52421]"
        style={{
          fontFamily: isHebrew
            ? 'var(--font-heebo), "Heebo", system-ui, sans-serif'
            : 'var(--font-inter), var(--font-inter-cyrillic), "Inter", system-ui, sans-serif',
          ['--font-sans' as string]: isHebrew
            ? 'var(--font-heebo), "Heebo", system-ui, sans-serif'
            : 'var(--font-inter), var(--font-inter-cyrillic), "Inter", system-ui, sans-serif',
        }}
      >
        {/* Ambient Glows (Ramp / Fintech style: soft organic light) */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-[140px] -start-[140px] size-[560px] rounded-full bg-[#e52421]/[0.04] blur-[100px] animate-pulse motion-reduce:animate-none" />
          <div className="absolute top-1/4 -end-[160px] size-[640px] rounded-full bg-[#3b82f6]/[0.035] blur-[120px]" />
          <div className="absolute -bottom-[120px] start-1/3 size-[500px] rounded-full bg-[#10b981]/[0.03] blur-[110px]" />
        </div>

        <div className="flex w-full flex-1 flex-col gap-3 px-3 pt-3 sm:px-6 sm:pt-4 lg:px-8 lg:gap-3.5">
          <header className="flex items-center justify-between gap-4">
            {/* Official logo, the same file the site header uses on light backgrounds. */}
            <a href={mainSiteUrl('/')} aria-label="Erythro.ai" dir="ltr" className="flex transition-opacity hover:opacity-90">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo/Logo_digital-on-light.svg"
                alt="Erythro.ai"
                width={235}
                height={74}
                className="h-[52px] w-auto sm:h-[60px] lg:h-[66px]"
              />
            </a>

            <div className="flex items-center gap-3">
              {/* Live lab telemetry pill (Ramp style) */}
              <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white/80 px-3 py-1 shadow-xs backdrop-blur-sm">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#10b981] opacity-75 motion-reduce:hidden" />
                  <span className="relative inline-flex size-2 rounded-full bg-[#10b981]" />
                </span>
                <span className="font-mono text-[11px] font-semibold tracking-wider text-[#475569] uppercase">
                  {isHebrew ? 'מעבדת כרומיום פעילה' : locale === 'ru' ? 'Chromium Lab онлайн' : 'Chromium Lab Active'}
                </span>
              </div>

              {/* Segmented language selector */}
              <nav aria-label="Language" className="flex items-center gap-0.5 rounded-full border border-[#e2e8f0] bg-white/90 p-1 shadow-xs backdrop-blur-sm">
                {AUDIT_LP_LOCALES.map((l) => (
                  <a
                    key={l}
                    href={auditLpHrefForLocale(l, 'calc')}
                    aria-current={l === locale ? 'true' : undefined}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.04em] no-underline transition-all ${
                      l === locale
                        ? 'bg-[#0f172a] text-white shadow-xs'
                        : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                  >
                    {l}
                  </a>
                ))}
              </nav>
            </div>
          </header>

          <h1 className="sr-only">{tCalc(copy.sectionTitle, locale)}</h1>
          <AuditCalcFlow locale={locale} page={auditPageContent} />
        </div>

        <div id="footer" className="py-6 sm:py-[28px] shrink-0">
          <AuditLpFooter locale={locale} theme="light" />
        </div>

        <WhatsAppButton alwaysVisible />
        <CookieConsent locale={locale} theme="light" privacyHref={mainSiteUrl('/privacy')} />
      </div>
    </SiteContentProvider>
  )
}
