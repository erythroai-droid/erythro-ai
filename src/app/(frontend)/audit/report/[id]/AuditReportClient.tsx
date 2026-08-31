'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import FooterSection from '@/components/FooterSection'
import { AccessibilityPanel } from '@/components/accessibility'
import CookieConsent from '@/components/CookieConsent'
import { SiteContentProvider } from '@/components/SiteContentProvider'
import { ContactModalProvider } from '@/components/ContactModal'
import LetsTalkSection from '@/components/LetsTalkSection'
import WhatsAppButton from '@/components/WhatsAppButton'
import HeaderChipStrip from '@/components/HeaderChipStrip'
import type { SiteContent } from '@/lib/defaultContent'
import { useSitePrefs } from '@/hooks/useSitePrefs'
import {
  auditReportCopy,
  formatAuditOrderId,
  isPublicReportUrl,
  tReport,
  type AuditReportPublicPayload,
  type AuditReportStatus,
} from '@/lib/auditReport'

const POLL_MS = 4000

interface AuditReportClientProps {
  reportId: string
  initialLocale: string
  initialTheme?: 'light' | 'dark'
  content: SiteContent
}

export default function AuditReportClient({
  reportId,
  initialLocale,
  initialTheme,
  content,
}: AuditReportClientProps) {
  const a11yTranslations = content.accessibility
  const { locale, setLocale, theme, setTheme } = useSitePrefs(initialLocale, 'dark', initialTheme)
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false)
  const [data, setData] = useState<AuditReportPublicPayload | null>(null)
  const [error, setError] = useState<'not_found' | 'network' | null>(null)

  const pickA11y = (field?: Record<string, string> | null) =>
    (field && (field[locale] || field.en)) || ''

  const a11yLabels = useMemo(
    () => ({
      title: pickA11y(a11yTranslations.title),
      reset: pickA11y(a11yTranslations.reset),
      poweredBy: pickA11y(a11yTranslations.poweredBy),
      statementLink: pickA11y(a11yTranslations.statementLink),
      closeLabel: pickA11y(a11yTranslations.closeLabel),
      screenReaderEnabled: pickA11y(a11yTranslations.screenReaderEnabled),
      biggerText: pickA11y(a11yTranslations.biggerText),
      dyslexia: pickA11y(a11yTranslations.dyslexia),
      contrast: pickA11y(a11yTranslations.contrast),
      monochrome: pickA11y(a11yTranslations.monochrome),
      highlightLinks: pickA11y(a11yTranslations.highlightLinks),
      pauseAnimations: pickA11y(a11yTranslations.pauseAnimations),
      spacing: pickA11y(a11yTranslations.spacing),
      cursor: pickA11y(a11yTranslations.cursor),
      keyboardNavigation: pickA11y(a11yTranslations.keyboardNavigation),
      screenReader: pickA11y(a11yTranslations.screenReader),
    }),
    [locale, a11yTranslations],
  )

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/audit/report/${reportId}`, { cache: 'no-store' })
      if (res.status === 404 || res.status === 400) {
        setError('not_found')
        setData(null)
        return 'stop' as const
      }
      if (!res.ok) {
        setError('network')
        return 'retry' as const
      }
      const json = (await res.json()) as AuditReportPublicPayload
      if (json.status === 'report_sent' && json.readyHtmlUrl) {
        window.location.replace(json.readyHtmlUrl)
        return 'stop' as const
      }
      setData(json)
      setError(null)
      if (json.status === 'failed') {
        return 'stop' as const
      }
      return 'retry' as const
    } catch {
      setError('network')
      return 'retry' as const
    }
  }, [reportId])

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const tick = async () => {
      const next = await fetchStatus()
      if (cancelled || next === 'stop') return
      timer = setTimeout(tick, POLL_MS)
    }

    void tick()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [fetchStatus])

  const isLight = theme === 'light'
  const surface = isLight
    ? 'border-black/10 bg-white/80 text-coal-900'
    : 'border-white/10 bg-coal-950/70 text-white'
  const muted = isLight ? 'text-coal-700/80' : 'text-white/70'

  return (
    <SiteContentProvider value={content}>
      <ContactModalProvider locale={locale}>
        <div
          dir={locale === 'he' ? 'rtl' : 'ltr'}
          className={`relative min-h-screen font-sans transition-colors duration-500 ${
            isLight ? 'bg-gold-100' : 'bg-coal-900'
          }`}
        >
          <div className="relative z-10 lg:contents">
            <HeaderChipStrip page="legal" />
          </div>
          <Navbar
            currentLocale={locale}
            setLocale={setLocale}
            theme={theme}
            setTheme={setTheme}
            onOpenAccessibility={() => setIsAccessibilityOpen(true)}
            forceBurger
            headerContrast="auto"
          />

          <main id="audit-report-page" className="relative z-[1] mx-auto w-full max-w-5xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
            <h1 className="m-0 font-sans text-2xl font-medium uppercase tracking-[0.08em] text-gold-500 md:text-3xl">
              {tReport(auditReportCopy.title, locale)}
            </h1>

            <div className={`mt-8 rounded-[20px] border p-5 sm:p-8 ${surface}`}>
              {error === 'not_found' ? (
                <p className={`m-0 text-base ${muted}`}>{tReport(auditReportCopy.notFound, locale)}</p>
              ) : (
                <ReportBody
                  data={data}
                  reportId={reportId}
                  locale={locale}
                  muted={muted}
                  isLight={isLight}
                />
              )}
            </div>
          </main>

          <LetsTalkSection locale={locale} variant="simple" />
          <FooterSection locale={locale} theme={theme} pinSpacer={false} />
          <WhatsAppButton />
          <CookieConsent locale={locale} theme={theme} />
          <AccessibilityPanel
            isOpen={isAccessibilityOpen}
            onClose={() => setIsAccessibilityOpen(false)}
            labels={a11yLabels}
            screenReaderTargets={[
              { id: 'audit-report-page', label: pickA11y(a11yTranslations.screenReaderDetails) },
              { id: 'footer', label: pickA11y(a11yTranslations.screenReaderFooter) },
            ]}
            rtl={locale === 'he'}
            showPoweredBy
          />
        </div>
      </ContactModalProvider>
    </SiteContentProvider>
  )
}

function statusLabel(status: AuditReportStatus, locale: string): string {
  switch (status) {
    case 'in_progress':
      return tReport(auditReportCopy.inProgress, locale)
    case 'report_sent':
      return tReport(auditReportCopy.ready, locale)
    case 'failed':
      return tReport(auditReportCopy.failed, locale)
    default:
      return tReport(auditReportCopy.queued, locale)
  }
}

function ReportBody({
  data,
  reportId,
  locale,
  muted,
  isLight,
}: {
  data: AuditReportPublicPayload | null
  reportId: string
  locale: string
  muted: string
  isLight: boolean
}) {
  if (!data) {
    return (
      <p className={`m-0 text-base ${muted}`}>{tReport(auditReportCopy.waiting, locale)}</p>
    )
  }

  const showWaiting = data.status === 'new' || data.status === 'in_progress'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="m-0 text-sm font-medium uppercase tracking-[0.12em] text-gold-500">
          {statusLabel(data.status, locale)}
        </p>
        <p className="m-0 text-base">
          <span className="text-gold-500">{tReport(auditReportCopy.orderId, locale)}:</span>{' '}
          <code className="font-mono text-[0.95em] tracking-wide">{data.orderId || formatAuditOrderId(reportId)}</code>
        </p>
        <p className={`m-0 text-sm ${muted}`}>{tReport(auditReportCopy.orderIdHint, locale)}</p>
        {data.website ? (
          <p className={`m-0 break-all text-sm ${muted}`}>{data.website}</p>
        ) : null}
        {showWaiting ? (
          <p className={`m-0 text-base ${muted}`}>{tReport(auditReportCopy.waiting, locale)}</p>
        ) : null}
        {data.status === 'failed' ? (
          <p className={`m-0 text-base ${muted}`}>{tReport(auditReportCopy.failed, locale)}</p>
        ) : null}
        {typeof data.auditScore === 'number' ? (
          <p className="m-0 text-base">
            <span className="text-gold-500">{tReport(auditReportCopy.score, locale)}:</span>{' '}
            {data.auditScore}
          </p>
        ) : null}
      </div>

      {data.status === 'report_sent' &&
      isPublicReportUrl(data.reportUrl) &&
      data.reportUrl &&
      !data.reportUrl.includes(`/audit/report/${reportId}`) ? (
        <a
          href={data.reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex w-fit rounded-[40px] border px-8 py-3 text-sm uppercase tracking-widest transition-colors ${
            isLight
              ? 'border-erythro-500 text-erythro-500 hover:bg-erythro-500 hover:text-white'
              : 'border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-coal-900'
          }`}
        >
          {tReport(auditReportCopy.openExternal, locale)}
        </a>
      ) : null}
    </div>
  )
}
