'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BorderBeam } from 'border-beam'
import AuditLpForm, { AUDIT_BEAM_PROPS, type AuditLpSubmitted } from '@/components/audit/AuditLpForm'
import {
  CARD,
  CalcCta,
  CalcHeroStatsBar,
  CalcNumbers,
  CalcResult,
  CalcWaiting,
  CardTitle,
  LILAC,
  OUTLINE_BTN,
  PRIMARY_BTN,
  type CalcProgress,
} from '@/components/audit/CalcReport'
import { useSiteContent } from '@/components/SiteContentProvider'
import type { AuditPageContent } from '@/lib/auditPage'
import {
  AUDIT_PROGRESS_EXPECTED_MS,
  AUDIT_REPORT_POLL_MS,
  buildAuditReportApiPath,
  estimateAuditProgressPercent,
  estimateAuditRemainingMinutes,
  formatAuditOrderId,
  nextAuditPollDelayMs,
  type AuditReportPublicPayload,
} from '@/lib/auditReport'
import { AUDIT_LP_LOCALES, auditLpHrefForLocale, mainSiteUrl, type AuditLpLocale } from '@/lib/auditLp'
import { auditCalcCopy as copy, fillCalc, tCalc } from '@/lib/auditCalcCopy'
import { pillarsFromOverall, type AuditPillars } from '@/lib/revenueLeak'

type Stage =
  | { name: 'form' }
  /** Email deep-link: fetch status before showing the analysis/waiting UI. */
  | { name: 'opening'; submitted: AuditLpSubmitted }
  | { name: 'waiting'; submitted: AuditLpSubmitted; startedAt: number }
  | { name: 'ready'; submitted: AuditLpSubmitted; report: AuditReportPublicPayload }
  | { name: 'failed'; submitted: AuditLpSubmitted }

function startedAtFromReport(json: AuditReportPublicPayload): number {
  for (const raw of [json.createdAt, json.updatedAt]) {
    if (typeof raw !== 'string' || !raw.trim()) continue
    const ms = Date.parse(raw)
    if (Number.isFinite(ms) && ms > 0) return ms
  }
  return Date.now()
}

/** Element inside the form card that receives the audit form's submit button. */
const SUBMIT_SLOT_ID = 'calc-submit-slot'
/** Element under the submit button that receives the form's legal note. */
const LEGAL_SLOT_ID = 'calc-legal-slot'

/** Host without protocol / www / path, for headings and the WhatsApp text. */
export function displayDomain(website: string): string {
  const raw = website.trim()
  if (!raw) return ''
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    return url.hostname.replace(/^www\./i, '')
  } catch {
    return raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] || raw
  }
}

/**
 * Calculator LP, design 2: Full-height Split-Screen architecture.
 * Left: Informational analytical context with 3 pillars and 5 loss metrics.
 * Right: Full-height dedicated coal console with integrated step tabs and dynamic form transitions.
 */
export default function AuditCalcFlow({ locale, page }: { locale: string; page: AuditPageContent }) {
  const phone = useSiteContent().siteSettings.phone || ''
  const [stage, setStage] = useState<Stage>({ name: 'form' })
  const [now, setNow] = useState(() => Date.now())
  const [waText, setWaText] = useState('')
  const [formStep, setFormStep] = useState<1 | 2>(1)
  /** Off by default: revenue fields stay disabled until the user opts in for ₪. */
  const [skipToPercent, setSkipToPercent] = useState(true)
  const [revenue, setRevenue] = useState<number | null>(null)
  const [clients, setClients] = useState<number | null>(null)
  /** Keep ?report=&k=&rev=&clients= when switching leak-{locale} hosts. */
  const [resumeSearch, setResumeSearch] = useState('')

  const currentStep =
    stage.name === 'ready' ? 4 : stage.name === 'waiting' || stage.name === 'opening' ? 3 : formStep

  const stepLabels: Record<string, Record<1 | 2 | 3 | 4, string>> = {
    ru: {
      1: 'Ввод сайта и контактов',
      2: 'Доход и параметры бизнеса',
      3: 'Анализ воронки и аудит',
      4: 'Анализ проблем и точки роста',
    },
    en: {
      1: 'Enter website & contacts',
      2: 'Business & revenue metrics',
      3: 'Funnel analysis & audit',
      4: 'Funnel bottlenecks & growth plan',
    },
    he: {
      1: 'הזנת אתר ופרטי קשר',
      2: 'הכנסות ופרמטרי עסק',
      3: 'ניתוח משפך ובדיקה',
      4: 'אבחון כשלים ותוכנית שיפור',
    },
  }

  const waiting = stage.name === 'waiting' ? stage : null
  const opening = stage.name === 'opening' ? stage : null
  const pollTarget = waiting ?? opening

  // Deep link from the report-ready email: ?report={id}&k={token}&rev=&clients=
  // Dev preview: ?preview=step2|waiting|ready|failed
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const r = Number(q.get('rev'))
    const c = Number(q.get('clients'))
    if (r > 0) setRevenue(r)
    if (c > 0) setClients(c)

    const reportIdRaw = q.get('report')
    const accessKey = q.get('k')?.trim() || null
    const reportId = reportIdRaw && /^\d+$/.test(reportIdRaw) ? Number(reportIdRaw) : null
    if (reportId && accessKey) {
      const siteParam = q.get('site') || q.get('website') || ''
      setResumeSearch(window.location.search || '')
      // Do not jump straight into the "analysis running" UI — fetch first.
      // Ready emails must land on step 4, not a fake re-run of step 3.
      setStage({
        name: 'opening',
        submitted: {
          id: reportId,
          accessKey,
          website: siteParam,
          reportHref: null,
        },
      })
      return
    }

    if (process.env.NODE_ENV === 'production') return
    const preview = q.get('preview')
    if (!preview) return
    const siteParam = q.get('site') || q.get('website') || 'https://fast-taxi.co.il'
    const submitted: AuditLpSubmitted = {
      id: 0,
      accessKey: null,
      website: siteParam,
      reportHref: null,
    }
    if (preview === 'ready') {
      setStage({
        name: 'ready',
        submitted,
        report: {
          id: 0,
          orderId: 'AUD-0',
          status: 'report_sent',
          auditScore: 48,
          pillars: { speed: 35, leads: 72, seo: 62, security: 45, ai: 85 },
          pagespeed: {
            mobile: {
              performance: 42,
              accessibility: 88,
              bestPractices: 75,
              seo: 90,
              fcp: '2.8 s',
              lcp: '4.2 s',
              cls: '0.28',
              tbt: '420 ms',
              speedIndex: '5.1 s',
              tti: '6.4 s',
            },
            desktop: {
              performance: 78,
              accessibility: 92,
              bestPractices: 83,
              seo: 95,
              fcp: '1.1 s',
              lcp: '1.8 s',
              cls: '0.05',
              tbt: '80 ms',
              speedIndex: '2.0 s',
              tti: '2.4 s',
            },
          },
          reportUrl: null,
          htmlPreview: null,
          readyHtmlUrl: null,
          website: submitted.website,
          updatedAt: null,
          createdAt: null,
        },
      })
    } else if (preview === 'waiting') {
      setStage({ name: 'waiting', submitted: { ...submitted, accessKey: 'preview' }, startedAt: Date.now() - 120_000 })
    } else if (preview === 'failed') {
      setStage({ name: 'failed', submitted })
    } else if (preview === 'step2') {
      setSkipToPercent(true)
      setFormStep(2)
    }
  }, [])

  // Poll / open report status (email deep-link + live waiting). First tick is immediate.
  useEffect(() => {
    if (!pollTarget) return
    const { submitted } = pollTarget
    const fromDeepLink = pollTarget.name === 'opening'
    if (submitted.accessKey === 'preview') return
    if (!submitted.accessKey) {
      setStage({ name: 'failed', submitted })
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const tick = async () => {
      let delay = AUDIT_REPORT_POLL_MS
      try {
        const res = await fetch(buildAuditReportApiPath(submitted.id, submitted.accessKey!), {
          cache: 'no-store',
        })
        if (cancelled) return
        if (res.status === 404 || res.status === 400) {
          setStage({ name: 'failed', submitted })
          return
        }
        delay = nextAuditPollDelayMs(res.status, res.headers.get('Retry-After'))
        if (res.ok) {
          const json = (await res.json()) as AuditReportPublicPayload
          if (cancelled) return
          const nextSubmitted = {
            ...submitted,
            website: submitted.website || json.website || '',
          }
          if (json.status === 'report_sent') {
            setStage({
              name: 'ready',
              submitted: nextSubmitted,
              report: json,
            })
            return
          }
          if (json.status === 'failed') {
            setStage({ name: 'failed', submitted: nextSubmitted })
            return
          }
          // Still running — promote opening → waiting once (do not setState every poll).
          if (fromDeepLink) {
            setStage({
              name: 'waiting',
              submitted: nextSubmitted,
              startedAt: startedAtFromReport(json),
            })
            return
          }
        }
      } catch {
        // network glitch; retry
      }
      if (!cancelled) timer = setTimeout(tick, delay)
    }

    void tick()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [pollTarget])

  // Timer for smooth progress bar during waiting
  useEffect(() => {
    if (!waiting) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [waiting])

  const domain = useMemo(() => {
    if (
      stage.name === 'waiting' ||
      stage.name === 'opening' ||
      stage.name === 'ready' ||
      stage.name === 'failed'
    ) {
      return displayDomain(stage.submitted.website)
    }
    return ''
  }, [stage])

  const report = stage.name === 'ready' ? stage.report : null

  const pillars: AuditPillars | null = useMemo(() => {
    if (!report) return null
    if (report.pillars) return report.pillars
    if (typeof report.auditScore === 'number') return pillarsFromOverall(report.auditScore)
    // report_sent without score/pillars still must show step 4 (email deep-link).
    if (report.status === 'report_sent') return pillarsFromOverall(50)
    return null
  }, [report])

  const progress: CalcProgress = useMemo(() => {
    if (!waiting) return { percent: 0, remaining: 0, overdue: false }
    return {
      percent: estimateAuditProgressPercent({
        status: 'in_progress',
        createdAtMs: waiting.startedAt,
        nowMs: now,
      }),
      remaining: estimateAuditRemainingMinutes(waiting.startedAt, now),
      overdue: now - waiting.startedAt > AUDIT_PROGRESS_EXPECTED_MS * 2,
    }
  }, [waiting, now])

  const waNumber = phone.replace(/[^0-9]/g, '')
  const waHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}` : ''

  // The report's full-screen panels fill the viewport below this top bar: expose its height as --calc-top
  const headerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const root = document.documentElement
    const sync = () => root.style.setProperty('--calc-top', `${el.offsetHeight}px`)
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.removeProperty('--calc-top')
    }
  }, [])

  // Failed view. Must stay below every hook: an earlier return changes the hook count and crashes React (PIT-160).
  if (stage.name === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <section className={`${CARD} flex flex-col items-start gap-4 max-w-[600px] w-full p-8`}>
          <CardTitle>{tCalc(copy.failedTitle, locale)}</CardTitle>
          <p className="m-0 text-[15px] text-[#6b6254]">
            {stage.submitted.website
              ? fillCalc(tCalc(copy.failedLeadWithDomain, locale), {
                  domain: displayDomain(stage.submitted.website),
                })
              : tCalc(copy.failedLead, locale)}
          </p>
          <p className="m-0 text-[13px] text-[#857b6c]">{tCalc(copy.failedHint, locale)}</p>
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${PRIMARY_BTN} mt-2 inline-flex items-center gap-2`}
            >
              <span>💬</span>
              <span>{tCalc(copy.chatWithEngineer, locale)}</span>
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => setStage({ name: 'form' })}
            className={`${OUTLINE_BTN} mt-2 text-xs text-[#857b6c]`}
          >
            {tCalc(copy.tryAgain, locale)}
          </button>
        </section>
      </div>
    )
  }

  // Tracker above the glass form: white on the dark panel, an almost white fill like the loss bars of the step 4 hero
  const tracker = (
    <div className={`w-full flex-col gap-2 shrink-0 ${currentStep <= 3 ? 'hidden sm:flex' : 'flex'}`}>
      <div className="flex items-center gap-2.5">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 text-xs font-bold tabular-nums text-white">
          {currentStep}
        </span>
        <span className="text-base font-bold leading-[1.3] text-white">
          {stepLabels[locale]?.[currentStep as 1 | 2 | 3 | 4] || stepLabels.ru[currentStep as 1 | 2 | 3 | 4]}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${(currentStep / 4) * 100}%`, background: '#f1f5f9' }}
        />
      </div>

      <div className="flex items-center justify-between text-xs font-medium text-white/60">
        <span>
          {locale === 'he' ? `שלב ${currentStep} מתוך 4` : locale === 'ru' ? `Шаг ${currentStep} из 4` : `Step ${currentStep} of 4`}
        </span>
        <span className="tabular-nums">{currentStep * 25}%</span>
      </div>
    </div>
  )

  // ITSUA-INSPIRED TECHNICAL STUDIO LAYOUT
  return (
    <div
      className={`relative isolate min-h-screen flex flex-col justify-between w-full !bg-[#eaeaea] text-[#1e1e1e] overflow-x-hidden overflow-y-auto selection:bg-[#e52421]/15 selection:text-[#e52421] ${
        stage.name === 'ready'
          ? ''
          : 'lg:min-h-screen [@media(min-height:720px)_and_(min-width:1024px)]:h-screen [@media(min-height:720px)_and_(min-width:1024px)]:max-h-screen [@media(min-height:720px)_and_(min-width:1024px)]:overflow-hidden'
      }`}
    >
      {/* ================= 1. TOP BAR (FULL WIDTH) ================= */}
      <header ref={headerRef} className="w-full border-b border-[#cbd5e1] bg-white/70 backdrop-blur-xs px-5 sm:px-8 lg:px-12 py-2.5 sm:py-3 lg:py-2.5 flex items-center justify-between gap-4 shrink-0 z-20 animate-hero-fade">
        <a href={mainSiteUrl('/')} aria-label="Erythro.ai" dir="ltr" className="flex transition-opacity hover:opacity-90">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo/Logo_digital-on-light.svg"
            alt="Erythro.ai"
            width={235}
            height={74}
            className="h-[43px] sm:h-[50px] lg:h-[53px] w-auto"
          />
        </a>

        {/* Live Chromium Lab Badge on top bar with GREEN pulsing indicator */}
        <div className="hidden sm:flex items-center gap-2.5 select-none">
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border-[0.75px] border-[#e0e0e0] bg-white px-2 py-[3px] text-[11px] font-medium uppercase leading-4 tracking-[0.04em] text-[#1e1e1e]">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#86efac] opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[#86efac]" />
            </span>
            {tCalc(copy.heroKicker, locale)}
          </span>
          <span className="h-px w-5 bg-[#cbd5e1]" />
          <span className="text-[11px] uppercase leading-4 tracking-[0.04em] text-[#64748b]">
            CHROMIUM LAB 2026
          </span>
        </div>

        {/* Language Selector */}
        <nav aria-label="Language" className="flex items-center gap-0.5 rounded-full border border-[#cbd5e1] bg-white p-1">
          {AUDIT_LP_LOCALES.map((l) => {
            const base = auditLpHrefForLocale(l, 'calc')
            const href = resumeSearch
              ? `${base.replace(/\/?$/, '')}${resumeSearch.startsWith('?') ? resumeSearch : `?${resumeSearch}`}`
              : base
            return (
              <a
                key={l}
                href={href}
                aria-current={l === locale ? 'true' : undefined}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.04em] no-underline transition-all ${
                  l === locale ? 'bg-[#0f172a] text-white' : 'text-[#64748b] hover:text-[#e52421]'
                }`}
              >
                {l}
              </a>
            )
          })}
        </nav>
      </header>

      {/* ================= 2. MAIN CONTENT ================= */}
      {stage.name === 'ready' && report && pillars ? (
        <main className="w-full flex-1 flex flex-col items-center px-4 sm:px-8 lg:px-12 pb-8 sm:pb-10 lg:pb-14 animate-hero-fade">
          {/* Same side padding and content width as the full-bleed loss panel, so every block below lines up with it */}
          <div className="w-full max-w-[1440px] mx-auto">
            <CalcResult
              locale={locale}
              domain={domain}
              websiteUrl={stage.submitted.website}
              pillars={pillars}
              pagespeed={report.pagespeed}
              revenue={revenue}
              clients={clients}
              approximate={report.pillars == null}
              reportHref={stage.submitted.reportHref || report.readyHtmlUrl}
              waHref={waHref}
              onWaText={setWaText}
            />
          </div>
        </main>
      ) : (
        <main className="calc-loss-flow relative isolate overflow-clip w-full flex-1 min-h-0 flex flex-col text-white pt-7 sm:pt-9 md:pt-11 pb-0 lg:pt-1 xl:pt-2">
        {/* Same deep lilac panel and slow glows as the loss hero of step 4.
            The glows are clipped on this layer: left to main they add hidden scroll range that traps the page (PIT-157). */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="calc-lq-blob calc-loss-a" />
          <div className="calc-lq-blob calc-loss-b" />
          <div className="calc-lq-blob calc-loss-c" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#150f26]/10 via-transparent to-[#150f26]/40" />
        </div>
        <div className="my-auto w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,480px)] gap-8 sm:gap-11 md:gap-13 lg:gap-12 xl:gap-16 items-center">
          {/* Left column (desktop left / mobile first): big title and subtitle, enters from the left */}
          <div key={`hero-left-${currentStep}`} className="order-1 flex flex-col justify-center text-start animate-hero-left">
            {/* Kicker as the domain chip of the step 4 hero: translucent white on the dark panel */}
            <div className="mb-5 flex flex-wrap items-center gap-2.5 sm:mb-7">
              {currentStep === 1 ? (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-[4px] bg-[#86efac] px-2.5 py-1 text-sm font-black uppercase leading-[18px] tracking-[0.06em] text-[#052e16] shadow-[0_0_24px_rgba(134,239,172,0.35)]">
                  {tCalc(copy.heroFreeBadge, locale)}
                  <span aria-hidden="true" className="font-bold">· 0 ₪</span>
                </span>
              ) : null}
              <div className="inline-flex w-fit items-center gap-2 rounded-[4px] border-[0.75px] border-white/25 bg-white/10 px-2 py-[3px] text-xs font-medium uppercase leading-[18px] tracking-[0.04em] text-white">
                <span className="relative flex size-1.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#86efac] opacity-75 motion-reduce:hidden" /><span className="relative inline-flex size-1.5 rounded-full bg-[#86efac]" /></span>
                <span>
                  {tCalc(
                    currentStep === 1
                      ? copy.heroKicker
                      : currentStep === 2
                        ? copy.heroStep2Kicker
                        : copy.heroStep3Kicker,
                    locale,
                  )}
                </span>
              </div>
            </div>

            <h2 className="m-0 font-black uppercase leading-[1.04] sm:leading-[1.03] lg:leading-[1.02] tracking-[-0.035em] text-white text-[clamp(26px,10vw,38px)] sm:text-[52px] lg:text-[56px] xl:text-[68px] 2xl:text-[80px] text-balance">
              {/* One run of text: lines break by width, not after each phrase */}
              <span>
                {tCalc(
                  currentStep === 1
                    ? copy.heroL1
                    : currentStep === 2
                      ? copy.heroStep2L1
                      : copy.heroStep3L1,
                  locale,
                )}{' '}
                <span className="text-[#ff4542] [text-shadow:0_6px_40px_rgba(229,36,33,0.45)]">
                  <bdi>
                    {tCalc(
                      currentStep === 1
                        ? copy.heroL2
                        : currentStep === 2
                          ? copy.heroStep2L2
                          : copy.heroStep3L2,
                      locale,
                    )}
                  </bdi>
                </span>
              </span>{' '}
              <span>
                {tCalc(
                  currentStep === 1
                    ? copy.heroL3
                    : currentStep === 2
                      ? copy.heroStep2L3
                      : copy.heroStep3L3,
                  locale,
                )}
              </span>
            </h2>

            {currentStep === 1 ? (
              <p className="m-0 mt-5 max-w-2xl text-base leading-[1.6] text-white/75 sm:hidden">
                {tCalc(copy.mobile.heroSubPrefix, locale)}
                <span className="rounded-[3px] bg-[#e52421] px-1.5 font-bold text-white [box-decoration-break:clone]">
                  {tCalc(copy.mobile.heroSubHighlight, locale)}
                </span>
              </p>
            ) : null}
            <p className={`m-0 mt-5 sm:mt-6 max-w-2xl text-base leading-[1.6] text-white/75 sm:text-lg lg:text-base xl:text-lg ${currentStep === 1 ? 'hidden sm:block' : ''}`}>
              {tCalc(
                currentStep === 1
                  ? copy.heroSubFormPrefix
                  : currentStep === 2
                    ? copy.heroStep2SubPrefix
                    : copy.heroStep3SubPrefix,
                locale,
              )}
              <span className="inline-block whitespace-nowrap rounded-[3px] bg-[#e52421] px-1.5 font-bold text-white align-baseline">
                {tCalc(
                  currentStep === 1
                    ? copy.heroSubFormHighlight
                    : currentStep === 2
                      ? copy.heroStep2SubHighlight
                      : copy.heroStep3SubHighlight,
                  locale,
                )}
              </span>
            </p>

            <div className={`mt-5 sm:mt-6 flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/70 ${currentStep <= 3 ? 'hidden sm:flex' : 'flex'}`}>
              {currentStep === 1 ? (
                <>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-1.5 rounded-full" style={{ background: LILAC.mid }} />
                    {locale === 'he' ? 'ללא צורך בגישת ניהול' : locale === 'ru' ? 'Без доступа к админке' : 'No admin access needed'}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-[#86efac]" />
                    {locale === 'he' ? 'אודיט מהיר חינם' : locale === 'ru' ? 'Бесплатный экспресс-аудит' : 'Free Quick Audit'}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-white/50" />
                    {tCalc(copy.step1Guarantee2, locale)}
                  </span>
                </>
              ) : currentStep === 2 ? (
                <>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-[#c4b5fd]" />
                    {tCalc(copy.step2OptionalBadge, locale)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-[#86efac]" />
                    {tCalc(copy.step2PercentBadge, locale)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-white/50" />
                    {tCalc(copy.step1Guarantee2, locale)}
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-2">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#86efac] opacity-75 motion-reduce:hidden" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-[#86efac]" />
                    </span>
                    {tCalc(copy.step3EngineBadge, locale)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-[#ff4542]" />
                    {locale === 'he' ? '230+ בדיקות אוטומטיות' : locale === 'ru' ? '230+ тестов воронки' : '230+ funnel tests'}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-white/50" />
                    {tCalc(copy.step3AutoEmailBadge, locale)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right column (desktop right / mobile under the title): step tracker and form card, enters from the right */}
          <div className="order-2 flex flex-col items-center lg:items-stretch w-full animate-hero-right">
            <div className={`w-full flex flex-col gap-3 sm:gap-4 lg:gap-3 xl:gap-4.5 ${
              currentStep === 2 || currentStep === 3
                ? 'max-w-[440px] sm:max-w-[470px] lg:max-w-[440px] xl:max-w-[480px]'
                : 'max-w-[440px] xl:max-w-[480px]'
            }`}>
              {tracker}

              {stage.name === 'form' ? (
                /* Form card in glassmorphism on the dark hero panel: translucent white, blur, thin light edge */
                <div className={`w-full rounded-[20px] border border-white/20 bg-white/[0.08] text-white shadow-[0_8px_24px_-14px_rgba(10,6,25,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm lg:backdrop-blur-xl transition-all duration-300 ${
                  formStep === 2 ? 'p-6 sm:p-8 lg:p-7 xl:p-8 flex flex-col gap-3 lg:gap-2.5 xl:gap-3' : 'p-6 sm:p-8 lg:p-7 xl:p-8 flex flex-col gap-4'
                }`}>
                  {/* Form heading inside the form card */}
                  {formStep === 1 ? (
                    <div>
                      <h3 className="m-0 flex items-stretch gap-3 before:block before:w-[2px] before:h-[0.727em] before:mt-[calc((1lh-1.21em)/2+0.242em)] before:self-start before:shrink-0 before:bg-[#ff4542] text-lg font-bold leading-[1.3] tracking-[-0.01em] text-white sm:text-xl">
                        <span className="sm:hidden">{tCalc(copy.mobile.step1Heading, locale)}</span>
                        <span className="hidden sm:inline">{tCalc(copy.step1Heading, locale)}</span>
                      </h3>
                      <p className="m-0 mt-1.5 text-sm leading-[1.5] text-white/70">
                        <span className="sm:hidden">{tCalc(copy.mobile.step1Sub, locale)}</span>
                        <span className="hidden sm:inline">{tCalc(copy.step1Sub, locale)}</span>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="m-0 flex items-stretch gap-3 before:block before:w-[2px] before:h-[0.727em] before:mt-[calc((1lh-1.21em)/2+0.242em)] before:self-start before:shrink-0 before:bg-[#ff4542] text-lg font-bold leading-[1.3] tracking-[-0.01em] text-white sm:text-xl">
                        <span className="sm:hidden">{tCalc(copy.mobile.step2Heading, locale)}</span>
                        <span className="hidden sm:inline">{tCalc(copy.step2Heading, locale)}</span>
                      </h3>
                      <p className="m-0 mt-1.5 text-sm leading-[1.5] text-white/70">
                        <span className="sm:hidden">{tCalc(copy.mobile.step2Sub, locale)}</span>
                        <span className="hidden sm:inline">{tCalc(copy.step2Sub, locale)}</span>
                      </p>
                    </div>
                  )}

                  {/* The audit form stays mounted on step 2 (hidden) so its values and validation survive. */}
                  <div className={formStep === 1 ? 'block' : 'hidden'}>
                    <AuditLpForm
                      locale={locale}
                      theme="dark"
                      neon
                      page={page}
                      bare
                      websiteFirst
                      calcRevenue={revenue}
                      calcClients={clients}
                      leadChannel="leak_calc"
                      submitLabelMobile={tCalc(
                        formStep === 1
                          ? copy.mobile.submit
                          : skipToPercent
                            ? copy.mobile.step2SubmitPercent
                            : copy.mobile.step2SubmitMoney,
                        locale,
                      )}
                      submitLabel={tCalc(
                        formStep === 1
                          ? copy.nextStepCalc
                          : skipToPercent
                            ? copy.submitPercent
                            : copy.submitMoney,
                        locale,
                      )}
                      holdSubmit={formStep === 1}
                      onValidated={() => {
                        setSkipToPercent(true)
                        setRevenue(null)
                        setClients(null)
                        setFormStep(2)
                      }}
                      onInvalid={() => setFormStep(1)}
                      legalTargetId={LEGAL_SLOT_ID}
                      submitTargetId={SUBMIT_SLOT_ID}
                      submitClassName="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-erythro-500 px-8 py-3.5 text-sm font-medium uppercase text-white shadow-none transition-[box-shadow,transform,opacity] duration-300 ease-out hover:shadow-[0_4px_20px_0_rgba(229,36,33,0.45)] disabled:cursor-wait disabled:hover:shadow-none"
                      onSubmitted={(submitted) => {
                        // The slider stays live while the form is sending: keep the numbers that were saved,
                        // so this screen and the emailed report show the same loss (PIT-158).
                        setRevenue(submitted.calcRevenue ?? null)
                        setClients(submitted.calcClients ?? null)
                        setNow(Date.now())
                        setStage({ name: 'waiting', submitted, startedAt: Date.now() })
                      }}
                    />
                  </div>

                  {formStep === 2 ? (
                    <div className="flex flex-col gap-3.5 sm:gap-4">
                      {/* Phones: checkbox first; sliders stay hidden until opt-in. Desktop keeps numbers above. */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!skipToPercent}
                        onClick={() => {
                          if (skipToPercent) {
                            setSkipToPercent(false)
                          } else {
                            setSkipToPercent(true)
                            setRevenue(null)
                            setClients(null)
                          }
                        }}
                        className={`group order-1 sm:order-2 w-full flex items-center justify-between gap-3 rounded-[12px] border p-3 sm:p-3.5 lg:p-2.5 text-start transition-all duration-200 cursor-pointer ${
                          !skipToPercent
                            ? 'border-[#c4b5fd]/60 bg-[#8b74c7]/25'
                            : 'border-white/15 bg-white/[0.06] hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-start">
                          <span
                            className={`flex size-5 shrink-0 items-center justify-center rounded-[5px] border transition-all ${
                              !skipToPercent
                                ? 'border-[#c4b5fd] bg-[#8b74c7] text-white'
                                : 'border-white/30 bg-white/5 text-transparent group-hover:border-white/50'
                            }`}
                          >
                            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold leading-snug text-white">
                              {tCalc(copy.step2EnableRevenue, locale)}
                            </span>
                            <span className="mt-0.5 text-xs leading-snug text-white/60">
                              {tCalc(copy.step2EnableRevenueHint, locale)}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-colors ${
                            !skipToPercent
                              ? 'border-[#c4b5fd]/60 bg-[#8b74c7] text-white'
                              : 'border-white/20 bg-white/10 text-white/80'
                          }`}
                        >
                          {skipToPercent ? '%' : '₪'}
                        </span>
                      </button>

                      <div className={`order-2 sm:order-1 ${skipToPercent ? 'hidden sm:block' : 'block'}`}>
                        <CalcNumbers
                          locale={locale}
                          revenue={revenue}
                          clients={clients}
                          onRevenue={(r) => {
                            setRevenue(r)
                            setSkipToPercent(false)
                          }}
                          onClients={(c) => {
                            setClients(c)
                            setSkipToPercent(false)
                          }}
                          onReset={() => {
                            setRevenue(null)
                            setClients(null)
                          }}
                          theme="dark"
                          disabled={skipToPercent}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className={`flex flex-col items-center ${
                    formStep === 2
                      ? // Phones: keep submit clear of the "clients / month" chips when revenue is open
                        `gap-2 sm:gap-2.5 ${skipToPercent ? 'pt-0' : 'pt-5 sm:pt-0'}`
                      : 'gap-4 sm:gap-4.5 pt-2 sm:pt-2.5'
                  }`}>
                    <div id={SUBMIT_SLOT_ID} className="flex w-full justify-center h-[46px] sm:h-[48px] lg:h-[48px] xl:h-[52px] [&_button]:!w-full [&_button]:!text-sm [&_button]:!font-medium [&_button]:!uppercase" />

                    {/* Stays mounted on step 2 (hidden): the form's portal keeps this element. */}
                    <div id={LEGAL_SLOT_ID} className={formStep === 1 ? 'w-full' : 'hidden'} />

                    {formStep === 1 ? null : (
                      <div className="flex items-center justify-between w-full px-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFormStep(1)
                            setSkipToPercent(true)
                            setRevenue(null)
                            setClients(null)
                          }}
                          className="cursor-pointer inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <span aria-hidden="true" className="rtl:rotate-180">←</span>
                          <span className="sm:hidden">{tCalc(copy.back, locale)}</span>
                          <span className="hidden sm:inline">{tCalc(copy.backToPreviousStep, locale)}</span>
                        </button>

                        {/* Desktop only: on phones % is already the default CTA */}
                        <button
                          type="button"
                          onClick={() => {
                            setRevenue(null)
                            setClients(null)
                            setSkipToPercent(true)
                            setTimeout(() => {
                              const btn = document.getElementById(SUBMIT_SLOT_ID)?.querySelector('button')
                              btn?.click()
                            }, 0)
                          }}
                          className="hidden sm:inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <span>{tCalc(copy.skipStep, locale)}</span>
                          <span aria-hidden="true" className="rtl:rotate-180">→</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {stage.name === 'opening' ? (
                <div className="w-full rounded-[20px] border border-white/20 bg-white/[0.08] text-white shadow-[0_8px_24px_-14px_rgba(10,6,25,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm lg:backdrop-blur-xl p-6 sm:p-8 lg:p-6 flex flex-col items-center justify-center gap-3 min-h-[220px]">
                  <span className="relative flex size-3">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#86efac] opacity-75 motion-reduce:hidden" />
                    <span className="relative inline-flex size-3 rounded-full bg-[#86efac]" />
                  </span>
                  <p className="m-0 text-sm font-medium text-white/80">
                    {locale === 'he'
                      ? 'פותחים את התוצאות…'
                      : locale === 'ru'
                        ? 'Открываем результаты…'
                        : 'Opening your results…'}
                  </p>
                </div>
              ) : null}

              {stage.name === 'waiting' ? (
                <div className="w-full rounded-[20px] border border-white/20 bg-white/[0.08] text-white shadow-[0_8px_24px_-14px_rgba(10,6,25,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm lg:backdrop-blur-xl p-6 sm:p-8 lg:p-6 flex flex-col gap-3">
                  <CalcWaiting locale={locale} domain={domain} progress={progress} theme="dark" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {/* Key numbers under the hero: edge to edge on the same dark panel, five equal columns (steps 1–3 only) */}
        <section className="mt-8 w-full shrink-0 border-t border-white/10 sm:mt-10 lg:mt-2">
          <CalcHeroStatsBar locale={locale} dark />
        </section>
      </main>
      )}

      {/* ================= 4. MICRO FOOTER ================= */}
      <footer className="w-full px-5 sm:px-8 lg:px-12 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#475569] shrink-0 bg-[#f8f8f8]">
        <div className="flex items-center gap-4">
          <span>© {new Date().getFullYear()} Erythro.ai</span>
          <span>·</span>
          <a href={mainSiteUrl('/privacy')} className="hover:text-[#0f172a] transition-colors">
            {locale === 'he' ? 'מדיניות פרטיות' : locale === 'ru' ? 'Конфиденциальность' : 'Privacy Policy'}
          </a>
          <span>·</span>
          <span>Chromium Engine 2026</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span>🔒</span>
            {locale === 'he' ? 'הצפנת SSL מאובטחת' : locale === 'ru' ? 'Шифрование SSL 256-bit' : 'SSL 256-bit secure'}
          </span>
          <span>·</span>
          <span>{locale === 'he' ? 'ללא העברת נתונים לצד שלישי' : locale === 'ru' ? 'Без передачи третьим лицам' : 'Strict Privacy'}</span>
        </div>
      </footer>
    </div>
  )
}
