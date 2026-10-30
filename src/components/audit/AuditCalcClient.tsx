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
        className="min-h-screen bg-[#f3f3f3] font-sans text-[#1e1e1e]"
      >
        <div className="mx-auto flex w-full max-w-[1170px] flex-col gap-4 px-4 pb-16 pt-6">
          <header className="flex items-center justify-between gap-4 py-2">
            <a
              href={mainSiteUrl('/')}
              className="flex items-center gap-2 text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#1e1e1e] no-underline"
            >
              <i aria-hidden className="block size-3.5 rounded-full bg-[#e52421]" />
              erythro.ai
            </a>
            <nav aria-label="Language" className="flex items-center gap-1">
              {AUDIT_LP_LOCALES.map((l) => (
                <a
                  key={l}
                  href={auditLpHrefForLocale(l, 'calc')}
                  aria-current={l === locale ? 'true' : undefined}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.04em] no-underline transition-colors ${
                    l === locale
                      ? 'border-[#1e1e1e] bg-[#1e1e1e] text-white'
                      : 'border-[#e8e8e8] bg-white text-[#1e1e1e] hover:border-[#1e1e1e]'
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
