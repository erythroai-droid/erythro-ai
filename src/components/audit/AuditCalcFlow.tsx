'use client'

import React, { useEffect, useMemo, useState } from 'react'
import AuditLpForm, { type AuditLpSubmitted } from '@/components/audit/AuditLpForm'
import {
  CARD,
  CalcCta,
  CalcFormShell,
  CalcHead,
  CalcNumbers,
  CalcResult,
  CalcSplit,
  CalcTags,
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
 * Calculator LP, design 2 (audit-report style, light theme).
 * Steps: 1 contacts (site + email) → 2 revenue and customers → 3 audit running → 4 report with the loss estimate.
 */
export default function AuditCalcFlow({ locale, page }: { locale: string; page: AuditPageContent }) {
  const phone = useSiteContent().siteSettings.phone || ''
  const [stage, setStage] = useState<Stage>({ name: 'form' })
  const [now, setNow] = useState(() => Date.now())
  const [waText, setWaText] = useState('')
  const [formStep, setFormStep] = useState<1 | 2>(1)
  const [revenue, setRevenue] = useState<number | null>(null)
  const [clients, setClients] = useState<number | null>(null)

  const waiting = stage.name === 'waiting' ? stage : null

  // Dev only: ?preview=step2|waiting|ready|failed shows that step with sample data, no audit is run;
  // ?rev=150000&clients=50 pre-fills the numbers.
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

  // Poll the report status until the worker finishes the audit.
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
        /* network blip: retry */
      }
      if (!cancelled) timer = setTimeout(tick, delay)
    }
    void tick()

    const clock = window.setInterval(() => setNow(Date.now()), 5000)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      window.clearInterval(clock)
    }
  }, [waiting])

  const report = stage.name === 'ready' ? stage.report : null
  const score = report?.auditScore ?? 0
  const pillars = useMemo<AuditPillars | null>(
    () => (report ? (report.pillars ?? pillarsFromOverall(score)) : null),
    [report, score],
  )
  const domain = stage.name === 'form' ? '' : displayDomain(stage.submitted.website)

  const progress: CalcProgress =
    stage.name === 'waiting'
      ? {
          percent: estimateAuditProgressPercent({
            status: 'in_progress',
            createdAtMs: stage.startedAt,
            nowMs: now,
          }),
          remaining: estimateAuditRemainingMinutes(stage.startedAt, now),
          overdue: now - stage.startedAt > AUDIT_PROGRESS_EXPECTED_MS * 2,
        }
      : { percent: stage.name === 'ready' ? 100 : 0, remaining: 0, overdue: false }

  const waNumber = phone.replace(/[^0-9]/g, '')
  const waHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}` : null

  const currentStep: 1 | 2 | 3 | 4 =
    stage.name === 'form' ? formStep : stage.name === 'waiting' ? 3 : 4

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col gap-3 lg:gap-3.5">
      {stage.name === 'form' || stage.name === 'waiting' ? (
        <>
        <CalcTags locale={locale} kind={stage.name} step={currentStep} />
        <CalcSplit
          locale={locale}
          left={<CalcHead locale={locale} kind={stage.name} domain={domain} />}
          right={
            <>
      {stage.name === 'form' ? (
        <CalcFormShell locale={locale} step={formStep}>
          {/* The audit form stays mounted on step 2 (hidden) so its values and validation survive. */}
          <div
            className={`audit-calc-form-wrap ${formStep === 1 ? 'block' : 'hidden'} [&_.audit-pill-shell]:!rounded-xl [&_.audit-pill-shell]:!border-[#d6d6d6] [&_.audit-pill-shell]:!bg-white [&_.audit-pill-shell]:shadow-[0_1px_3px_rgba(0,0,0,0.03)] [&_.audit-pill-shell:focus-within]:!border-[#1e1e1e] [&_.audit-pill-shell:focus-within]:!ring-2 [&_.audit-pill-shell:focus-within]:!ring-[#1e1e1e]/10 [&_.audit-pill-shell]:transition-all [&_input]:!text-base [&_input]:!font-medium [&_input]:!text-[#1e1e1e] [&_input]:!placeholder-[#8f8a80]`}
          >
            <AuditLpForm
              locale={locale}
              theme="light"
              page={page}
              bare
              submitLabel={tCalc(formStep === 1 ? copy.nextStepCalc : copy.submit, locale)}
              holdSubmit={formStep === 1}
              onValidated={() => setFormStep(2)}
              onInvalid={() => setFormStep(1)}
              submitTargetId={SUBMIT_SLOT_ID}
              submitClassName={PRIMARY_BTN}
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
            />
          ) : null}
          <div className="flex flex-col items-center gap-3.5 pt-1">
            <div id={SUBMIT_SLOT_ID} className="flex w-full justify-center empty:hidden [&_button]:!w-full" />
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-center text-[11px] font-medium uppercase tracking-[0.04em] text-[#6b6254]">
              <span className="inline-flex items-center gap-1.5">
                <span className="font-bold text-[#22bf16]">✓</span>
                {tCalc(copy.step1Guarantee1, locale)}
              </span>
              <span className="text-[#d6d6d6] max-sm:hidden">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="font-bold text-[#22bf16]">✓</span>
                {tCalc(copy.step1Guarantee2, locale)}
              </span>
              <span className="text-[#d6d6d6] max-sm:hidden">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="font-bold text-[#22bf16]">✓</span>
                {tCalc(copy.step1Guarantee3, locale)}
              </span>
            </div>
            {formStep === 2 ? (
              <button
                type="button"
                onClick={() => setFormStep(1)}
                className="cursor-pointer border-0 bg-transparent p-0 text-sm text-[#6b6254] underline underline-offset-4 hover:text-[#1e1e1e]"
              >
                ← {tCalc(copy.back, locale)}
              </button>
            ) : null}
          </div>
        </CalcFormShell>
      ) : null}

      {stage.name === 'waiting' ? <CalcWaiting locale={locale} domain={domain} progress={progress} /> : null}
            </>
          }
        />
        </>
      ) : null}

      {stage.name === 'failed' ? (
        <section className={`${CARD} flex flex-col items-start gap-4`}>
          <CardTitle>{tCalc(copy.failedTitle, locale)}</CardTitle>
          <p className="m-0 max-w-[560px] text-[15px] text-[#6b6254]">
            {fillCalc(tCalc(copy.failedBody, locale), { orderId: formatAuditOrderId(stage.submitted.id) })}
          </p>
          <button
            type="button"
            onClick={() => {
              setFormStep(1)
              setStage({ name: 'form' })
            }}
            className={`${OUTLINE_BTN} !w-auto !px-8 py-3.5`}
          >
            {tCalc(copy.tryAgain, locale)}
          </button>
        </section>
      ) : null}

      {report && pillars ? (
        <CalcResult
          locale={locale}
          domain={domain}
          pillars={pillars}
          revenue={revenue}
          clients={clients}
          approximate={report.pillars == null}
          reportHref={stage.name === 'ready' ? stage.submitted.reportHref : null}
          waHref={waHref}
          onWaText={setWaText}
        />
      ) : null}

      {stage.name === 'waiting' || stage.name === 'ready' ? (
        <CalcCta locale={locale} waHref={waHref} locked={stage.name === 'waiting'} showNote={stage.name === 'ready'} />
      ) : null}
    </div>
  )
}
