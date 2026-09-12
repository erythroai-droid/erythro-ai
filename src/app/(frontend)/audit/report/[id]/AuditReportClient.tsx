'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '@/components/Navbar'
import FooterSection from '@/components/FooterSection'
import { AccessibilityPanel } from '@/components/accessibility'
import CookieConsent from '@/components/CookieConsent'
import { SiteContentProvider } from '@/components/SiteContentProvider'
import { ContactModalProvider } from '@/components/ContactModal'
import LetsTalkSection from '@/components/LetsTalkSection'
import ChatButton from '@/components/ChatButton'
import HeaderChipStrip from '@/components/HeaderChipStrip'
import type { SiteContent } from '@/lib/defaultContent'
import { useSitePrefs } from '@/hooks/useSitePrefs'
import {
  auditReportCopy,
  estimateAuditProgressPercent,
  estimateAuditRemainingMinutes,
  formatAuditOrderId,
  isPublicReportUrl,
  nextAuditPollDelayMs,
  parseAuditTimestampMs,
  tReport,
  tReportFill,
  AUDIT_REPORT_POLL_MS,
  type AuditReportPublicPayload,
  type AuditReportStatus,
} from '@/lib/auditReport'

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

  const fetchStatus = useCallback(async (): Promise<
    { action: 'stop' } | { action: 'retry'; delayMs: number }
  > => {
    try {
      const res = await fetch(`/api/audit/report/${reportId}`, { cache: 'no-store' })
      if (res.status === 404 || res.status === 400) {
        setError('not_found')
        setData(null)
        return { action: 'stop' }
      }
      if (res.status === 429) {
        return {
          action: 'retry',
          delayMs: nextAuditPollDelayMs(res.status, res.headers.get('Retry-After')),
        }
      }
      if (!res.ok) {
        setError('network')
        return { action: 'retry', delayMs: AUDIT_REPORT_POLL_MS }
      }
      const json = (await res.json()) as AuditReportPublicPayload
      if (json.status === 'report_sent' && json.readyHtmlUrl) {
        window.location.replace(json.readyHtmlUrl)
        return { action: 'stop' }
      }
      setData(json)
      setError(null)
      if (json.status === 'failed') {
        return { action: 'stop' }
      }
      return { action: 'retry', delayMs: AUDIT_REPORT_POLL_MS }
    } catch {
      setError('network')
      return { action: 'retry', delayMs: AUDIT_REPORT_POLL_MS }
    }
  }, [reportId])

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const tick = async () => {
      const next = await fetchStatus()
      if (cancelled || next.action === 'stop') return
      timer = setTimeout(tick, next.delayMs)
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
            <h1 className={`m-0 font-sans text-2xl font-medium uppercase tracking-[0.08em] md:text-3xl ${
              isLight ? 'text-coal-900' : 'text-gold-500'
            }`}>
              {tReport(auditReportCopy.title, locale)}
            </h1>

            <div className={`mt-8 rounded-[20px] border p-5 sm:p-8 ${surface}`}>
              {error === 'not_found' ? (
                <p className={`m-0 text-base ${muted}`}>{tReport(auditReportCopy.notFound, locale)}</p>
              ) : error === 'network' && !data ? (
                <p className={`m-0 text-base ${muted}`} role="alert">
                  {tReport(auditReportCopy.network, locale)}
                </p>
              ) : (
                <>
                  {error === 'network' ? (
                    <p className={`mb-4 mt-0 text-base ${muted}`} role="alert">
                      {tReport(auditReportCopy.network, locale)}
                    </p>
                  ) : null}
                  <ReportBody
                    data={data}
                    reportId={reportId}
                    locale={locale}
                    muted={muted}
                    isLight={isLight}
                  />
                </>
              )}
            </div>
          </main>

          <LetsTalkSection locale={locale} variant="simple" />
          <FooterSection locale={locale} theme={theme} pinSpacer={false} />
          <ChatButton locale={locale} theme={theme} />
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

function useAuditProgress(status: AuditReportStatus | null, createdAt: string | null) {
  const fallbackStartRef = useRef(Date.now())
  const [percent, setPercent] = useState(() =>
    estimateAuditProgressPercent({
      status,
      createdAtMs: parseAuditTimestampMs(createdAt),
      nowMs: Date.now(),
    }),
  )
  const [remainingMin, setRemainingMin] = useState(() =>
    estimateAuditRemainingMinutes(parseAuditTimestampMs(createdAt) ?? Date.now(), Date.now()),
  )

  useEffect(() => {
    if (status === 'report_sent') {
      setPercent(100)
      setRemainingMin(0)
      return
    }
    if (status === 'failed') {
      setPercent(0)
      return
    }

    const createdAtMs = parseAuditTimestampMs(createdAt)
    const startMs = createdAtMs ?? fallbackStartRef.current

    const tick = () => {
      const now = Date.now()
      setPercent(
        estimateAuditProgressPercent({
          status,
          createdAtMs: startMs,
          nowMs: now,
        }),
      )
      setRemainingMin(estimateAuditRemainingMinutes(startMs, now))
    }

    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [status, createdAt])

  return { percent, remainingMin }
}

function AuditWaitingProgress({
  status,
  createdAt,
  locale,
  muted,
  isLight,
}: {
  status: AuditReportStatus | null
  createdAt: string | null
  locale: string
  muted: string
  isLight: boolean
}) {
  const { percent, remainingMin } = useAuditProgress(status, createdAt)
  const displayPct = Math.round(percent)
  const fillClass = isLight ? 'bg-erythro-500' : 'bg-gold-500'
  const trackClass = isLight ? 'bg-black/10' : 'bg-white/15'
  const etaText =
    remainingMin > 0
      ? tReportFill(auditReportCopy.remaining, locale, { n: remainingMin })
      : tReport(auditReportCopy.finishing, locale)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p
          className={`m-0 text-sm font-medium uppercase tracking-[0.12em] ${
            isLight ? 'text-coal-900' : 'text-gold-500'
          }`}
        >
          {tReport(auditReportCopy.progressLabel, locale)}
        </p>
        <p
          className={`m-0 font-mono text-sm tabular-nums ${
            isLight ? 'font-semibold text-coal-900' : 'text-gold-500'
          }`}
        >
          {displayPct}%
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={tReport(auditReportCopy.progressLabel, locale)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayPct}
        aria-valuetext={`${displayPct}%. ${etaText}`}
        className={`relative h-2.5 w-full overflow-hidden rounded-full ${trackClass}`}
      >
        <div
          className={`h-full w-full origin-start rounded-full motion-reduce:transition-none ${fillClass} transition-transform duration-500 ease-out`}
          style={{ transform: `scaleX(${Math.max(0.04, percent / 100)})` }}
        />
        <div
          className={`audit-report-progress-sheen pointer-events-none absolute inset-y-0 start-0 w-1/3 ${
            isLight ? 'bg-white/50' : 'bg-white/20'
          }`}
          aria-hidden
        />
      </div>
      <p className={`m-0 text-sm ${muted}`} aria-live="polite">
        {etaText}
      </p>
      <p className={`m-0 text-sm ${muted}`}>{tReport(auditReportCopy.etaTypical, locale)}</p>
    </div>
  )
}

function EmailNotice({ locale, isLight }: { locale: string; isLight: boolean }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-[10px] border px-4 py-3 sm:px-5 sm:py-4 ${
        isLight
          ? 'border-emerald-700/30 bg-emerald-500/15 text-emerald-950'
          : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
      }`}
    >
      <svg
        className={`mt-0.5 size-5 shrink-0 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path
          d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="m5 7 7 5 7-5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="m-0 min-w-0 text-sm leading-6">
        {tReport(auditReportCopy.emailNotice, locale)}
      </p>
    </div>
  )
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
  const status = data?.status ?? null
  const showWaiting = !data || status === 'new' || status === 'in_progress'
  const orderId = data?.orderId || formatAuditOrderId(reportId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p
          className={`m-0 text-sm font-medium uppercase tracking-[0.12em] ${
            isLight ? 'text-coal-900' : 'text-gold-500'
          }`}
        >
          {status ? statusLabel(status, locale) : tReport(auditReportCopy.queued, locale)}
        </p>
        <p className="m-0 text-base">
          <span className={isLight ? 'font-semibold text-coal-900' : 'text-gold-500'}>
            {tReport(auditReportCopy.orderId, locale)}:
          </span>{' '}
          <code className="font-mono text-[0.95em] tracking-wide">{orderId}</code>
        </p>
        <p className={`m-0 text-sm ${muted}`}>{tReport(auditReportCopy.orderIdHint, locale)}</p>
        {data?.website ? (
          <p className={`m-0 break-all text-sm ${muted}`}>{data.website}</p>
        ) : null}
        {showWaiting ? (
          <p className={`m-0 text-base ${muted}`}>{tReport(auditReportCopy.waiting, locale)}</p>
        ) : null}
        {status === 'failed' ? (
          <p className={`m-0 text-base ${muted}`}>{tReport(auditReportCopy.failed, locale)}</p>
        ) : null}
        {typeof data?.auditScore === 'number' ? (
          <p className="m-0 text-base">
            <span className={isLight ? 'font-semibold text-coal-900' : 'text-gold-500'}>
              {tReport(auditReportCopy.score, locale)}:
            </span>{' '}
            {data.auditScore}
          </p>
        ) : null}
      </div>

      {showWaiting ? (
        <>
          <AuditWaitingProgress
            status={status}
            createdAt={data?.createdAt ?? null}
            locale={locale}
            muted={muted}
            isLight={isLight}
          />
          <EmailNotice locale={locale} isLight={isLight} />
        </>
      ) : null}

      {data?.status === 'report_sent' &&
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
