'use client'

import React from 'react'
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
  return (
    <SiteContentProvider value={content}>
      <div
        dir={locale === 'he' ? 'rtl' : 'ltr'}
        className="min-h-screen bg-[#eaeaea] font-sans text-[#1e1e1e]"
      >
        <div className="flex w-full flex-col gap-2.5 px-3 pb-6 pt-2 sm:px-6 sm:pt-3 lg:px-8 lg:pb-8 lg:gap-3">
          <header className="flex items-center justify-between gap-4">
            {/* Official logo, the same file the site header uses on light backgrounds. */}
            <a href={mainSiteUrl('/')} aria-label="Erythro.ai" dir="ltr" className="flex">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo/Logo_digital-on-light.svg"
                alt="Erythro.ai"
                width={235}
                height={74}
                className="h-[52px] w-auto sm:h-[60px] lg:h-[64px]"
              />
            </a>
            <nav aria-label="Language" className="flex items-center gap-1">
              {AUDIT_LP_LOCALES.map((l) => (
                <a
                  key={l}
                  href={auditLpHrefForLocale(l, 'calc')}
                  aria-current={l === locale ? 'true' : undefined}
                  className={`rounded border px-2 py-[3px] text-xs uppercase tracking-[0.04em] no-underline transition-colors ${
                    l === locale
                      ? 'border-[#1e1e1e] bg-[#1e1e1e] text-white'
                      : 'border-[#d6d6d6] bg-white text-[#1e1e1e] hover:border-[#1e1e1e]'
                  }`}
                >
                  {l}
                </a>
              ))}
            </nav>
          </header>

          <h1 className="sr-only">{tCalc(copy.sectionTitle, locale)}</h1>
          <AuditCalcFlow locale={locale} page={auditPageContent} />
        </div>

        <div id="footer">
          <AuditLpFooter locale={locale} theme="light" />
        </div>

        <WhatsAppButton alwaysVisible />
        <CookieConsent locale={locale} theme="light" privacyHref={mainSiteUrl('/privacy')} />
      </div>
    </SiteContentProvider>
  )
}
