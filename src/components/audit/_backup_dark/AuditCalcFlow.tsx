'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { BorderBeam } from 'border-beam'
import AuditLpForm, { AUDIT_BEAM_PROPS, type AuditLpSubmitted } from '@/components/audit/AuditLpForm'
import {
  CARD,
  CalcCta,
  CalcHeroPillars,
  CalcHeroStatsBar,
  CalcNumbers,
  CalcResult,
  CalcWaiting,
  CardTitle,
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
  | { name: 'waiting'; submitted: AuditLpSubmitted; startedAt: number }
  | { name: 'ready'; submitted: AuditLpSubmitted; report: AuditReportPublicPayload }
  | { name: 'failed'; submitted: AuditLpSubmitted }

/** Element inside the form card that receives the audit form's submit button. */
const SUBMIT_SLOT_ID = 'calc-submit-slot'

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
  const [revenue, setRevenue] = useState<number | null>(null)
  const [clients, setClients] = useState<number | null>(null)

  const currentStep = stage.name === 'ready' ? 4 : stage.name === 'waiting' ? 3 : formStep

  const stepLabels: Record<string, Record<1 | 2 | 3 | 4, string>> = {
    ru: {
      1: 'Ввод сайта и контактов',
      2: 'Доход и параметры бизнеса',
      3: 'Анализ воронки и аудит',
      4: 'Расчёт финансовых утечек',
    },
    en: {
      1: 'Enter website & contacts',
      2: 'Business & revenue metrics',
      3: 'Funnel analysis & audit',
      4: 'Revenue leakage report',
    },
    he: {
      1: 'הזנת אתר ופרטי קשר',
      2: 'הכנסות ופרמטרי עסק',
      3: 'ניתוח משפך ובדיקה',
      4: 'דוח חישוב הפסדים',
    },
  }

  const waiting = stage.name === 'waiting' ? stage : null

  // Dev preview support: ?preview=step2|waiting|ready|failed
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    const q = new URLSearchParams(window.location.search)
    const r = Number(q.get('rev'))
    const c = Number(q.get('clients'))
    if (r > 0) setRevenue(r)
    if (c > 0) setClients(c)
    const preview = q.get('preview')
    if (!preview) return
    const submitted: AuditLpSubmitted = {
      id: 0,
      accessKey: null,
      website: 'https://www.mysite.co.il',
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
      setFormStep(2)
    }
  }, [])

  // Poll report status
  useEffect(() => {
    if (!waiting) return
    const { submitted } = waiting
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
          if (json.status === 'report_sent') {
            setStage({ name: 'ready', submitted, report: json })
            return
          }
          if (json.status === 'failed') {
            setStage({ name: 'failed', submitted })
            return
          }
        }
      } catch {
        // network glitch; retry
      }
      if (!cancelled) timer = setTimeout(tick, delay)
    }

    timer = setTimeout(tick, AUDIT_REPORT_POLL_MS)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [waiting])

  // Timer for smooth progress bar during waiting
  useEffect(() => {
    if (!waiting) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [waiting])

  const domain = useMemo(() => {
    if (stage.name === 'waiting' || stage.name === 'ready' || stage.name === 'failed') {
      return displayDomain(stage.submitted.website)
    }
    return ''
  }, [stage])

  const report = stage.name === 'ready' ? stage.report : null

  const pillars: AuditPillars | null = useMemo(() => {
    if (!report) return null
    if (report.pillars) return report.pillars
    if (typeof report.auditScore === 'number') return pillarsFromOverall(report.auditScore)
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

  // Ready view (full results)
  if (stage.name === 'ready' && report && pillars) {
    return (
      <div className="flex flex-col gap-6 lg:gap-8 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-6">
        <header className="flex items-center justify-between gap-4 py-2 border-b border-[#e2e8f0]">
          <a href={mainSiteUrl('/')} aria-label="Erythro.ai" dir="ltr" className="flex transition-opacity hover:opacity-90">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo/Logo_digital-on-light.svg" alt="Erythro.ai" width={235} height={74} className="h-[48px] sm:h-[56px] w-auto" />
          </a>
          <nav aria-label="Language" className="flex items-center gap-0.5 rounded-full border border-[#e2e8f0] bg-white p-1 shadow-xs">
            {AUDIT_LP_LOCALES.map((l) => (
              <a
                key={l}
                href={auditLpHrefForLocale(l, 'calc')}
                aria-current={l === locale ? 'true' : undefined}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.04em] no-underline transition-all ${
                  l === locale ? 'bg-[#0f172a] text-white shadow-xs' : 'text-[#64748b] hover:text-[#e52421]'
                }`}
              >
                {l}
              </a>
            ))}
          </nav>
        </header>

        <CalcResult
          locale={locale}
          domain={domain}
          pillars={pillars}
          revenue={revenue}
          clients={clients}
          approximate={report.pillars == null}
          reportHref={stage.submitted.reportHref}
          waHref={waHref}
          onWaText={setWaText}
        />
        <CalcCta locale={locale} waHref={waHref} locked={false} showNote={true} />
      </div>
    )
  }

  // Failed view
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

  // VARIANT 2: Full-height Split-Screen (Form & Waiting)
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen flex flex-col lg:flex-row w-full overflow-x-hidden lg:overflow-hidden">
      {/* ================= LEFT COLUMN: INFORMATIONAL HERO ================= */}
      <div className="w-full lg:w-[58%] xl:w-[60%] 2xl:w-[62%] lg:h-full flex flex-col justify-between bg-[#f8f8f8] px-5 sm:px-8 lg:px-10 xl:px-14 py-5 sm:py-6 lg:py-6 xl:py-7 border-b lg:border-b-0 lg:border-e border-[#e2e8f0] overflow-y-auto shrink-0">
        {/* Left Header */}
        <header className="h-[46px] sm:h-[54px] lg:h-[58px] flex items-center justify-between gap-4 shrink-0">
          <a href={mainSiteUrl('/')} aria-label="Erythro.ai" dir="ltr" className="flex transition-opacity hover:opacity-90">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo/Logo_digital-on-light.svg"
              alt="Erythro.ai"
              width={235}
              height={74}
              className="h-[46px] sm:h-[54px] lg:h-[58px] w-auto"
            />
          </a>

          {/* Live Chromium Lab Badge on same line as logo, near the black block with GREEN indicator */}
          <div className="hidden sm:flex items-center gap-2.5 select-none ms-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0f172a] shadow-xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              {tCalc(copy.heroKicker, locale)}
            </span>
            <span className="h-px w-6 bg-[#cbd5e1]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#64748b]">
              CHROMIUM LAB 2026
            </span>
          </div>

          {/* Mobile-only language selector */}
          <nav aria-label="Language" className="flex lg:hidden items-center gap-0.5 rounded-full border border-[#e2e8f0] bg-white p-1 shadow-xs">
            {AUDIT_LP_LOCALES.map((l) => (
              <a
                key={l}
                href={auditLpHrefForLocale(l, 'calc')}
                aria-current={l === locale ? 'true' : undefined}
                className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.04em] no-underline transition-all ${
                  l === locale ? 'bg-[#0f172a] text-white shadow-xs' : 'text-[#64748b] hover:text-[#e52421]'
                }`}
              >
                {l}
              </a>
            ))}
          </nav>
        </header>

        {/* Informational Center Content */}
        <div className="flex flex-col justify-center gap-4 sm:gap-5 lg:gap-5 xl:gap-6 my-auto py-4">
          {/* Giant Headline */}
          <h2 className="m-0 font-black uppercase leading-[1.03] tracking-[-0.03em] text-[#0f172a] text-[46px] sm:text-[62px] lg:text-[72px] xl:text-[90px] text-balance">
            <span className="block">
              {tCalc(copy.heroL1, locale)}&nbsp;
              <span className="text-[#e52421]">
                <bdi>{tCalc(copy.heroL2, locale)}</bdi>
              </span>
            </span>
            <span className="block text-[#0f172a]">
              {tCalc(copy.heroL3, locale)}
            </span>
          </h2>

          {/* Subtitle in single line without awkward line breaks */}
          <p className="m-0 text-xs sm:text-sm lg:text-[13px] xl:text-[14px] 2xl:text-[14.5px] text-[#64748b] leading-normal max-w-none xl:whitespace-nowrap">
            {tCalc(copy.heroSubForm, locale)}
          </p>

          {/* 3 Problem Breakdown Cards with Sketch Icons + Added Breathing Room */}
          <div className="pt-4 sm:pt-5 lg:pt-6 xl:pt-7">
            <CalcHeroPillars locale={locale} />
          </div>
        </div>

        {/* Bottom Section: 5 Stats Bar + Micro-footer */}
        <div className="flex flex-col gap-3 shrink-0 pt-2">
          <CalcHeroStatsBar locale={locale} />
          <div className="pt-3 border-t border-[#e2e8f0]/80 flex flex-wrap items-center justify-between text-[11px] text-[#64748b]">
            <span>© {new Date().getFullYear()} Erythro.ai</span>
            <div className="flex items-center gap-3">
              <a href={mainSiteUrl('/privacy')} className="hover:text-[#0f172a] transition-colors">
                {locale === 'he' ? 'מדיניות פרטיות' : locale === 'ru' ? 'Конфиденциальность' : 'Privacy Policy'}
              </a>
              <span>·</span>
              <span>Chromium Engine 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RIGHT COLUMN: DEDICATED ACTION CONSOLE ================= */}
      <div className="relative isolate w-full lg:w-[42%] xl:w-[40%] 2xl:w-[38%] min-h-screen lg:min-h-0 lg:h-full flex flex-col justify-between bg-coal-900 dark-gradient-bg text-white px-5 sm:px-8 lg:px-8 xl:px-10 py-5 sm:py-6 lg:py-6 xl:py-7 border-s border-white/10 overflow-y-auto">
        <div className="solution-section-noise absolute inset-0 z-0 pointer-events-none opacity-40" aria-hidden />

        {/* Right Console Header */}
        <div className="relative z-10 h-[46px] sm:h-[54px] lg:h-[58px] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-white/90">
              {locale === 'he' ? 'מנוע חישוב פעיל' : locale === 'ru' ? 'КОНСОЛЬ АУДИТА ВОРОНКИ' : 'ACTIVE CALC ENGINE'}
            </span>
          </div>

          {/* Desktop Language Selector styled for coal header */}
          <nav aria-label="Language" className="hidden lg:flex items-center gap-1 rounded-full border border-white/10 bg-coal-800/80 p-1 backdrop-blur-md shadow-xs">
            {AUDIT_LP_LOCALES.map((l) => (
              <a
                key={l}
                href={auditLpHrefForLocale(l, 'calc')}
                aria-current={l === locale ? 'true' : undefined}
                className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.04em] no-underline transition-all ${
                  l === locale
                    ? 'bg-white text-coal-900 shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {l}
              </a>
            ))}
          </nav>
        </div>

        {/* Right Console Form Area */}
        <div className="relative z-10 my-auto py-3 w-full">
          {/* Step-by-Step tracker above the form (higher, rounded-[2px], not blue, 4 steps) */}
          <div className="w-full max-w-[470px] mx-auto mb-6 sm:mb-8 flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[2px] bg-[#e52421] font-sans text-xs sm:text-sm font-bold text-white shadow-xs">
                {currentStep}
              </span>
              <span className="text-base sm:text-lg font-bold tracking-tight text-white">
                {stepLabels[locale]?.[currentStep as 1 | 2 | 3 | 4] || stepLabels.ru[currentStep as 1 | 2 | 3 | 4]}
              </span>
            </div>

            {/* Progress Line */}
            <div className="h-[3px] w-full overflow-hidden rounded-[2px] bg-white/15">
              <div
                className="h-full rounded-[2px] bg-[#e52421] transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-white/60 font-medium">
              <span>
                {locale === 'he'
                  ? `שלב ${currentStep} מתוך 4`
                  : locale === 'ru'
                    ? `Шаг ${currentStep} из 4`
                    : `Step ${currentStep} of 4`}
              </span>
              <span className="text-[11px] font-mono text-white/40">
                {currentStep * 25}%
              </span>
            </div>
          </div>

          {stage.name === 'form' ? (
            <div className="w-full max-w-[470px] mx-auto">
              <div className="audit-beam-hue overflow-visible p-4 -m-4">
                <BorderBeam {...AUDIT_BEAM_PROPS} theme="dark">
                  <div className="relative z-[1] w-full rounded-[20px] border border-white/10 bg-coal-500 p-6 sm:p-8 flex flex-col gap-5 text-white transition-all duration-300">
                    {/* Restored form heading inside the form card */}
                    {formStep === 1 ? (
                      <div>
                        <h3 className="m-0 flex items-stretch gap-2.5 before:block before:w-[3px] before:h-[0.727em] before:mt-[calc((1lh-1.21em)/2+0.242em)] before:self-start before:shrink-0 before:bg-[#e52421] text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight">
                          {tCalc(copy.step1Heading, locale)}
                        </h3>
                        <p className="m-0 mt-1.5 text-xs sm:text-[13px] text-white/70 leading-relaxed">
                          {tCalc(copy.step1Sub, locale)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h3 className="m-0 flex items-stretch gap-2.5 before:block before:w-[3px] before:h-[0.727em] before:mt-[calc((1lh-1.21em)/2+0.242em)] before:self-start before:shrink-0 before:bg-[#e52421] text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight">
                          {tCalc(copy.step2Heading, locale)}
                        </h3>
                        <p className="m-0 mt-1.5 text-xs sm:text-[13px] text-white/70 leading-relaxed">
                          {tCalc(copy.step2Sub, locale)}
                        </p>
                      </div>
                    )}

                    {/* The audit form stays mounted on step 2 (hidden) so its values and validation survive. */}
                    <div className={formStep === 1 ? 'block' : 'hidden'}>
                      <AuditLpForm
                        locale={locale}
                        theme="dark"
                        page={page}
                        bare
                        websiteFirst
                        submitLabel={tCalc(formStep === 1 ? copy.nextStepCalc : copy.submit, locale)}
                        holdSubmit={formStep === 1}
                        onValidated={() => setFormStep(2)}
                        onInvalid={() => setFormStep(1)}
                        submitTargetId={SUBMIT_SLOT_ID}
                        submitClassName="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-erythro-500 px-8 py-3.5 text-sm font-medium uppercase tracking-widest text-white shadow-none transition-[box-shadow,transform,opacity] duration-300 ease-out hover:shadow-[0_3px_20px_0_rgba(229,36,33,0.45)] disabled:cursor-wait disabled:hover:shadow-none"
                        onSubmitted={(submitted) => {
                          setNow(Date.now())
                          setStage({ name: 'waiting', submitted, startedAt: Date.now() })
                        }}
                      />
                    </div>

                    {formStep === 2 ? (
                      <CalcNumbers
                        locale={locale}
                        revenue={revenue}
                        clients={clients}
                        onRevenue={setRevenue}
                        onClients={setClients}
                        theme="dark"
                      />
                    ) : null}

                    <div className="flex flex-col items-center gap-3 pt-1">
                      <div id={SUBMIT_SLOT_ID} className="flex w-full justify-center empty:hidden [&_button]:!w-full [&_button]:!text-sm [&_button]:!font-medium [&_button]:!tracking-widest [&_button]:!uppercase" />

                      {formStep === 1 ? (
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[10.5px] sm:text-[11px] font-medium text-white/60">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-bold text-[#10b981]">✓</span>
                            {tCalc(copy.step1Guarantee1, locale)}
                          </span>
                          <span className="text-white/20">·</span>
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-bold text-[#10b981]">✓</span>
                            {tCalc(copy.step1Guarantee2, locale)}
                          </span>
                          <span className="text-white/20">·</span>
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-bold text-[#10b981]">✓</span>
                            {tCalc(copy.step1Guarantee3, locale)}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setFormStep(1)}
                          className="cursor-pointer border-0 bg-transparent p-0 text-sm text-white/70 underline underline-offset-4 hover:text-[#e52421] transition-colors"
                        >
                          ← {tCalc(copy.back, locale)}
                        </button>
                      )}
                    </div>
                  </div>
                </BorderBeam>
              </div>
            </div>
          ) : null}

          {stage.name === 'waiting' ? (
            <div className="w-full max-w-[470px] mx-auto">
              <div className="audit-beam-hue overflow-visible p-4 -m-4">
                <BorderBeam {...AUDIT_BEAM_PROPS} theme="dark">
                  <div className="relative z-[1] w-full rounded-[20px] border border-white/10 bg-coal-500 p-6 sm:p-8 flex flex-col gap-5 text-white">
                    <CalcWaiting locale={locale} domain={domain} progress={progress} theme="dark" />
                  </div>
                </BorderBeam>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Console Bottom Footer */}
        <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50 shrink-0">
          <span className="flex items-center gap-1.5">
            <span>🔒</span>
            {locale === 'he' ? 'הצפנת SSL מאובטחת' : locale === 'ru' ? 'Шифрование SSL 256-bit' : 'SSL 256-bit secure'}
          </span>
          <span>{locale === 'he' ? 'ללא העברת נתונים לצד שלישי' : locale === 'ru' ? 'Без передачи третьим лицам' : 'Strict Privacy'}</span>
        </div>
      </div>
    </div>
  )
}
