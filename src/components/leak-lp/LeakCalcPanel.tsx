'use client'

import React from 'react'
import AuditLpForm from '@/components/audit/AuditLpForm'
import { CalcNumbers, CalcWaiting } from '@/components/audit/CalcReport'
import { displayDomain } from '@/components/audit/AuditCalcFlow'
import type { AuditPageContent } from '@/lib/auditPage'
import { auditCalcCopy as baseCopy, fillCalc, tCalc } from '@/lib/auditCalcCopy'
import type { useLeakCalcFlow } from '@/components/leak-lp/useLeakCalcFlow'

const SUBMIT_SLOT_ID = 'leak-submit-slot'
const LEGAL_SLOT_ID = 'leak-legal-slot'

// This landing sells an audit, not a loss calculator: the shared funnel copy is reworded here (this LP only),
// so the form talks about the audit and an optional impact estimate instead of "losses".
const copy = {
  ...baseCopy,
  step1Heading: { en: 'Free AI website audit', ru: 'Бесплатный AI-аудит сайта', he: 'אודיט AI חינמי לאתר' },
  step1Sub: {
    en: 'Enter your website and email — we check speed, lead forms and visibility in Google and AI search.',
    ru: 'Укажите сайт и email — проверим скорость, формы заявок и видимость в Google и AI-поиске.',
    he: 'הזינו אתר ואימייל — נבדוק מהירות, טפסי לידים ונראות בגוגל ובחיפוש AI.',
  },
  step2Heading: { en: 'Business details', ru: 'Параметры бизнеса', he: 'פרטי העסק' },
  step2Sub: {
    en: 'Optional: add revenue and clients to estimate the impact of fixes in ₪.',
    ru: 'По желанию: укажите выручку и клиентов — оценим эффект исправлений в ₪.',
    he: 'לא חובה: הוסיפו הכנסה ולקוחות כדי להעריך את השפעת התיקונים ב-₪.',
  },
  step2EnableRevenue: { en: 'Add an impact estimate in ₪', ru: 'Добавить оценку эффекта в ₪', he: 'להוסיף הערכת השפעה ב-₪' },
  step2EnableRevenueHint: {
    en: 'If off, the audit runs without a financial estimate',
    ru: 'Если выключено — аудит без финансовой оценки',
    he: 'כבוי — האודיט ללא הערכה כספית',
  },
  submitMoney: { en: 'Run the audit →', ru: 'Запустить аудит →', he: 'להפעלת האודיט ←' },
  submitPercent: { en: 'Run the audit →', ru: 'Запустить аудит →', he: 'להפעלת האודיט ←' },
  mobile: {
    ...baseCopy.mobile,
    step2SubmitMoney: { en: 'Run the audit', ru: 'Запустить аудит', he: 'להפעלת האודיט' },
    step2SubmitPercent: { en: 'Run the audit', ru: 'Запустить аудит', he: 'להפעלת האודיט' },
  },
}

// Form header meta and the "you get" list shown on step 1.
const FORM_META = {
  kind: { en: 'Express audit · Free', ru: 'Экспресс-аудит · Free', he: 'אודיט מהיר · חינם' },
  time: { en: '~5 min', ru: '~5 мин', he: '~5 דק׳' },
  gets: [
    { en: 'Prioritised fix plan', ru: 'План исправлений по приоритету', he: 'תוכנית תיקונים לפי עדיפות' },
    { en: 'Top-3 issues', ru: 'Топ-3 проблемы', he: '3 הבעיות המרכזיות' },
    { en: 'Report by email', ru: 'Отчёт на email', he: 'דוח למייל' },
  ],
}

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

  if (stage.name === 'failed') {
    return (
      <div className="flex flex-col gap-4 p-7 sm:p-10">
        <h3 className="lk-bar m-0 text-lg leading-[1.3] text-[var(--lk-ink)]">{t(copy.failedTitle)}</h3>
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
      {stage.name === 'form' ? (
        <div className="flex flex-col gap-4 p-6 sm:p-9">
          {/* Report-style meta row: what this is and how long it takes. */}
          <div className="-mt-1 flex items-center justify-between gap-3 border-b border-[var(--lk-line)] pb-3.5">
            <span className="lk-label">{t(FORM_META.kind)}</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--lk-faint)]">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-3.5">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              {t(FORM_META.time)}
            </span>
          </div>
          <div>
            <h3 className="m-0 text-[22px] !font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--lk-ink)] sm:text-[26px]">
              {formStep === 1 ? t(copy.step1Heading) : t(copy.step2Heading)}
            </h3>
            <p className="m-0 mt-2.5 text-sm leading-[1.5] text-[var(--lk-muted)]">
              {formStep === 1 ? t(copy.step1Sub) : t(copy.step2Sub)}
            </p>
          </div>
          {formStep === 1 ? (
            // What the visitor gets back, so the two fields feel worth filling.
            <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
              {FORM_META.gets.map((g) => (
                <li key={g.en} className="inline-flex items-center gap-1.5 text-[13px] leading-[1.4] text-[var(--lk-ink-2)]">
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4 shrink-0 text-[var(--lk-green)]">
                    <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity="0.12" />
                    <path d="M5 8.2l2 2 4-4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t(g)}
                </li>
              ))}
            </ul>
          ) : null}

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
              submitClassName="lk-btn-red flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] px-6 text-[15px] font-medium disabled:cursor-wait"
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
                  !skipToPercent ? 'border-[var(--lk-ink)]/25 bg-[var(--lk-stone-50)]' : 'border-[var(--lk-line)] bg-white hover:bg-[var(--lk-stone-50)]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${!skipToPercent ? 'bg-[var(--lk-ink)]' : 'bg-[var(--lk-stone-150)]'}`}
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

              <div className={`lk-calc ${skipToPercent ? 'hidden' : 'block'}`}>
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
        <div className="flex flex-col gap-3 p-6 sm:p-9">
          <CalcWaiting locale={locale} domain={displayDomain(stage.submitted.website)} progress={flow.progress} theme="light" />
        </div>
      ) : null}
    </div>
  )
}
