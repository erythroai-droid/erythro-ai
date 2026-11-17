'use client'

import React from 'react'
import AuditLpForm from '@/components/audit/AuditLpForm'
import { CalcNumbers, CalcWaiting } from '@/components/audit/CalcReport'
import { displayDomain } from '@/components/audit/AuditCalcFlow'
import type { AuditPageContent } from '@/lib/auditPage'
import { auditCalcCopy as copy, fillCalc, tCalc } from '@/lib/auditCalcCopy'
import type { useLeakCalcFlow } from '@/components/leak-lp/useLeakCalcFlow'

const SUBMIT_SLOT_ID = 'leak-submit-slot'
const LEGAL_SLOT_ID = 'leak-legal-slot'

type Flow = ReturnType<typeof useLeakCalcFlow>

/** Funnel card (steps 1–3) for the product window. Light, tactile, Searchable-style. */
export default function LeakCalcPanel({
  locale,
  page,
  flow,
  waHref,
  sampleHref,
}: {
  locale: string
  page: AuditPageContent
  flow: Flow
  waHref: string
  sampleHref: string
}) {
  const { stage, formStep, skipToPercent, revenue, clients } = flow
  const t = (f: { en: string; ru: string; he: string }) => tCalc(f, locale)
  const stepNow = stage.name === 'waiting' || stage.name === 'opening' ? 3 : formStep

  if (stage.name === 'failed') {
    return (
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <h3 className="lk-bar m-0 text-lg font-semibold leading-[1.3] text-[var(--lk-ink)]">{t(copy.failedTitle)}</h3>
        <p className="m-0 text-[15px] leading-[1.6] text-[var(--lk-muted)]">
          {stage.submitted.website
            ? fillCalc(t(copy.failedLeadWithDomain), { domain: displayDomain(stage.submitted.website) })
            : t(copy.failedLead)}
        </p>
        <p className="m-0 text-[13px] leading-[1.5] text-[var(--lk-faint)]">{t(copy.failedHint)}</p>
        <div className="flex flex-wrap gap-2.5 pt-1">
          {waHref ? (
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="lk-btn-primary inline-flex h-10 items-center rounded-[7px] px-4 text-sm font-medium no-underline">
              {t(copy.chatWithEngineer)}
            </a>
          ) : null}
          <button type="button" onClick={() => flow.setStage({ name: 'form' })} className="lk-btn-secondary inline-flex h-10 cursor-pointer items-center rounded-[7px] px-4 text-sm font-medium">
            {t(copy.tryAgain)}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Step rail */}
      <div className="flex items-center gap-1.5 border-b border-[var(--lk-line)] px-5 py-3 sm:px-7">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${n <= stepNow ? 'bg-[var(--lk-red)]' : 'bg-[var(--lk-stone-150)]'}`}
          />
        ))}
        <span className="ms-2 shrink-0 text-xs font-medium tabular-nums text-[var(--lk-faint)]">
          {fillCalc(t(copy.stepOf), { n: stepNow, total: 3 })}
        </span>
      </div>

      {stage.name === 'form' ? (
        <div className="flex flex-col gap-4 p-5 sm:p-7">
          <div>
            <h3 className="lk-bar m-0 text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--lk-ink)] sm:text-xl">
              {formStep === 1 ? t(copy.step1Heading) : t(copy.step2Heading)}
            </h3>
            <p className="m-0 mt-1.5 text-sm leading-[1.5] text-[var(--lk-muted)]">
              {formStep === 1 ? t(copy.step1Sub) : t(copy.step2Sub)}
            </p>
          </div>

          <div className={`lk-form ${formStep === 1 ? 'block' : 'hidden'}`}>
            <AuditLpForm
              locale={locale}
              theme="light"
              page={page}
              bare
              websiteFirst
              calcRevenue={revenue}
              calcClients={clients}
              leadChannel="leak_calc"
              submitLabelMobile={t(formStep === 1 ? copy.mobile.submit : skipToPercent ? copy.mobile.step2SubmitPercent : copy.mobile.step2SubmitMoney)}
              submitLabel={t(formStep === 1 ? copy.nextStepCalc : skipToPercent ? copy.submitPercent : copy.submitMoney)}
              holdSubmit={formStep === 1}
              onValidated={() => {
                flow.setSkipToPercent(true)
                flow.setRevenue(null)
                flow.setClients(null)
                flow.setFormStep(2)
              }}
              onInvalid={() => flow.setFormStep(1)}
              legalTargetId={LEGAL_SLOT_ID}
              submitTargetId={SUBMIT_SLOT_ID}
              submitClassName="lk-btn-primary flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] px-6 text-[15px] font-medium disabled:cursor-wait"
              onSubmitted={(submitted) => {
                flow.setRevenue(submitted.calcRevenue ?? null)
                flow.setClients(submitted.calcClients ?? null)
                flow.setNow(Date.now())
                flow.setStage({ name: 'waiting', submitted, startedAt: Date.now() })
              }}
            />
          </div>

          {formStep === 2 ? (
            <div className="flex flex-col gap-3.5">
              <button
                type="button"
                role="switch"
                aria-checked={!skipToPercent}
                onClick={() => {
                  if (skipToPercent) flow.setSkipToPercent(false)
                  else {
                    flow.setSkipToPercent(true)
                    flow.setRevenue(null)
                    flow.setClients(null)
                  }
                }}
                className={`group flex w-full cursor-pointer items-center justify-between gap-3 rounded-[10px] border p-3.5 text-start transition-colors ${
                  !skipToPercent ? 'border-[var(--lk-red)]/40 bg-[var(--lk-red)]/[0.04]' : 'border-[var(--lk-line)] bg-white hover:bg-[var(--lk-stone-50)]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${!skipToPercent ? 'bg-[var(--lk-red)]' : 'bg-[var(--lk-stone-150)]'}`}
                  >
                    <span
                      className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-[inset-inline-start] duration-200 ${!skipToPercent ? 'start-[18px]' : 'start-0.5'}`}
                    />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-medium leading-snug text-[var(--lk-ink)]">{t(copy.step2EnableRevenue)}</span>
                    <span className="mt-0.5 text-xs leading-snug text-[var(--lk-faint)]">{t(copy.step2EnableRevenueHint)}</span>
                  </span>
                </span>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[7px] border border-[var(--lk-line)] bg-[var(--lk-stone-50)] text-sm font-semibold text-[var(--lk-ink-2)]">
                  {skipToPercent ? '%' : '₪'}
                </span>
              </button>

              <div className={skipToPercent ? 'hidden' : 'block'}>
                <CalcNumbers
                  locale={locale}
                  revenue={revenue}
                  clients={clients}
                  onRevenue={(r) => {
                    flow.setRevenue(r)
                    flow.setSkipToPercent(false)
                  }}
                  onClients={(c) => {
                    flow.setClients(c)
                    flow.setSkipToPercent(false)
                  }}
                  onReset={() => {
                    flow.setRevenue(null)
                    flow.setClients(null)
                  }}
                  theme="light"
                  disabled={skipToPercent}
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-col items-center gap-3 pt-1">
            <div id={SUBMIT_SLOT_ID} className="flex h-12 w-full justify-center [&_button]:!h-12 [&_button]:!w-full" />
            <div id={LEGAL_SLOT_ID} className={formStep === 1 ? 'w-full text-center' : 'hidden'} />

            {formStep === 1 ? (
              <a
                href={sampleHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--lk-muted)] underline decoration-[var(--lk-line)] underline-offset-4 transition-colors hover:text-[var(--lk-ink)] hover:decoration-[var(--lk-ink)]"
              >
                {t(copy.sampleReport)}
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-3.5 rtl:-scale-x-100">
                  <path d="M5 3.5h7.5V11M12.5 3.5 3.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ) : (
              <div className="flex w-full items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    flow.setFormStep(1)
                    flow.setSkipToPercent(true)
                    flow.setRevenue(null)
                    flow.setClients(null)
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] px-2 py-1.5 text-[13px] font-medium text-[var(--lk-muted)] transition-colors hover:bg-[var(--lk-stone-100)] hover:text-[var(--lk-ink)]"
                >
                  <span aria-hidden="true" className="rtl:rotate-180">←</span>
                  {t(copy.back)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    flow.setRevenue(null)
                    flow.setClients(null)
                    flow.setSkipToPercent(true)
                    setTimeout(() => document.getElementById(SUBMIT_SLOT_ID)?.querySelector('button')?.click(), 0)
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] px-2 py-1.5 text-[13px] font-medium text-[var(--lk-muted)] transition-colors hover:bg-[var(--lk-stone-100)] hover:text-[var(--lk-ink)]"
                >
                  {t(copy.skipStep)}
                  <span aria-hidden="true" className="rtl:rotate-180">→</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {stage.name === 'opening' ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8">
          <span className="relative flex size-2.5">
            <span className="lk-ping absolute inline-flex size-full rounded-full bg-[var(--lk-green)] opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-[var(--lk-green)]" />
          </span>
          <p className="m-0 text-sm font-medium text-[var(--lk-muted)]">
            {locale === 'he' ? 'פותחים את התוצאות…' : locale === 'ru' ? 'Открываем результаты…' : 'Opening your results…'}
          </p>
        </div>
      ) : null}

      {stage.name === 'waiting' ? (
        <div className="flex flex-col gap-3 p-5 sm:p-7">
          <CalcWaiting locale={locale} domain={displayDomain(stage.submitted.website)} progress={flow.progress} theme="light" />
        </div>
      ) : null}
    </div>
  )
}
