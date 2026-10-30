'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  auditCalcCopy as copy,
  fillCalc,
  formatIls,
  formatPercent,
  tCalc,
  type CalcArea,
} from '@/lib/auditCalcCopy'
import {
  CLIENT_PRESETS,
  LEAK_NEGLIGIBLE_BELOW,
  REVENUE_SLIDER,
  SPRINT_PRICE_ILS,
  computeLeak,
  leakBreakdown,
  lightFor,
  lostClientsPerMonth,
  revenueToSlider,
  sliderToRevenue,
  type AuditPillars,
  type LightLevel,
} from '@/lib/revenueLeak'

/**
 * Calculator LP, design 2: every block follows the audit report (light theme):
 * grey page, white 10px cards, thin red bar before h2, 4-segment scale bars, big light numerals.
 * Colours and sizes are taken from the report template (render-v2-reports.mjs).
 */

export const INK = '#1e1e1e'
export const MUTE = '#6b6254'
export const LINE = '#e8e8e8'
export const BRAND = '#e52421'

export const CARD = 'rounded-[10px] bg-white p-5 sm:p-8'
/** Small caps label (the report uses mono here; the site font is Inter only). */
export const LABEL = 'text-[11px] font-medium uppercase tracking-[0.04em] text-[#6b6254]'

const LEVEL_COLOR: Record<LightLevel, string> = { green: '#22bf16', yellow: '#ff7900', red: '#e52421' }
const LEVEL_BADGE: Record<LightLevel, string> = {
  green: 'border-[#22bf16] bg-[#d6f5d2] text-[#0e5a06]',
  yellow: 'border-[#ff7900] bg-[#ffe6cf] text-[#8f3f00]',
  red: 'border-[#e52421] bg-[#ffd9d8] text-[#a80d0a]',
}

export type CalcProgress = { percent: number; remaining: number; overdue: boolean }

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="m-0 flex items-center text-2xl font-normal normal-case leading-snug tracking-normal text-[#1e1e1e]">
      <span aria-hidden className="me-3 inline-block h-[1em] w-0.5 shrink-0 rounded-sm bg-[#e52421]" />
      {children}
    </h2>
  )
}

function intlTag(locale: string): string {
  return locale === 'ru' ? 'ru-RU' : locale === 'he' ? 'he-IL' : 'en-US'
}

function compact(n: number, locale: string): string {
  return new Intl.NumberFormat(intlTag(locale), { notation: 'compact', maximumFractionDigits: 0 }).format(n)
}

/** Eases the shown number towards `target`; jumps straight there when motion is reduced. */
function useAnimatedNumber(target: number, durationMs = 1200): number {
  const [value, setValue] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const start = from.current
    if (reduced || start === target) {
      from.current = target
      setValue(target)
      return
    }
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / durationMs)
      const next = start + (target - start) * (1 - Math.pow(1 - t, 3))
      from.current = next
      setValue(next)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])
  return value
}

/** Four thin segments, like the report's scale bars: the first `on` are filled. */
function Segs({ on, color }: { on: number; color: string }) {
  return (
    <div className="grid grid-cols-4 gap-1.5" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <i
          key={i}
          className="block h-[3px] rounded-sm"
          style={{ background: i < on ? color : LINE }}
        />
      ))}
    </div>
  )
}

/** Step tracker: done steps ink, current step red, the rest grey. */
export function CalcStepper({ locale, current }: { locale: string; current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="m-0 grid list-none grid-cols-4 gap-1.5 p-0">
      {copy.stepper.map((label, i) => {
        const n = i + 1
        const color = n < current ? INK : n === current ? BRAND : LINE
        return (
          <li key={n} className="flex min-w-0 flex-col gap-2" aria-current={n === current ? 'step' : undefined}>
            <i className="block h-[3px] rounded-sm" style={{ background: color }} />
            <span
              className={`truncate text-[13px] leading-tight ${
                n === current ? 'font-medium text-[#1e1e1e]' : n < current ? 'text-[#1e1e1e]' : 'text-[#6b6254]'
              }`}
            >
              <bdi>{n}</bdi> · {tCalc(label, locale)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Outline button from the report footer; red on hover. */
export const OUTLINE_BTN =
  'flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-[#1e1e1e] bg-transparent px-6 text-sm font-medium uppercase tracking-[0.04em] text-[#1e1e1e] transition-colors hover:border-[#e52421] hover:bg-[#e52421] hover:text-white disabled:cursor-wait disabled:opacity-70'

/** Step 2 of the form: monthly revenue (log slider) and customers per month. Both optional. */
export function CalcNumbers({
  locale,
  revenue,
  clients,
  onRevenue,
  onClients,
}: {
  locale: string
  revenue: number | null
  clients: number | null
  onRevenue: (v: number) => void
  onClients: (v: number | null) => void
}) {
  const id = useId()
  const pos = revenue == null ? 0 : revenueToSlider(revenue)
  const pct = pos / 10
  const thumb =
    '[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#e52421] [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_#e52421] [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#e52421]'

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <label htmlFor={`${id}-rev`} className="text-base text-[#1e1e1e]">
            {tCalc(copy.sliderRevenue, locale)}
          </label>
          <bdi className="text-[28px] font-medium leading-none tracking-[-0.02em] tabular-nums text-[#1e1e1e]" aria-hidden>
            {revenue == null ? '—' : formatIls(revenue, locale)}
          </bdi>
        </div>
        <div dir="ltr" className="flex flex-col gap-2">
          <input
            id={`${id}-rev`}
            type="range"
            min={0}
            max={1000}
            step={1}
            value={pos}
            onChange={(e) => onRevenue(sliderToRevenue(Number(e.target.value)))}
            aria-valuetext={revenue == null ? '' : formatIls(revenue, locale)}
            className={`h-[3px] w-full cursor-pointer appearance-none rounded-sm ${thumb}`}
            style={{ background: `linear-gradient(to right, ${BRAND} ${pct}%, ${LINE} ${pct}%)` }}
          />
          <div className="flex justify-between text-[12px] tabular-nums text-[#6b6254]">
            <span>{compact(REVENUE_SLIDER.min, locale)} ₪</span>
            <span>{compact(100_000, locale)} ₪</span>
            <span>{compact(REVENUE_SLIDER.max, locale)} ₪</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span id={`${id}-cl`} className="text-base text-[#1e1e1e]">
          {tCalc(copy.clientsLabel, locale)}
        </span>
        <div role="radiogroup" aria-labelledby={`${id}-cl`} className="flex flex-wrap gap-2">
          {CLIENT_PRESETS.map((v) => {
            const on = v === clients
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onClients(on ? null : v)}
                className={`cursor-pointer rounded-full px-4 py-2 text-[15px] tabular-nums transition-colors ${
                  on ? 'bg-[#1e1e1e] text-white' : 'bg-[#f9f9f9] text-[#1e1e1e] hover:bg-[#ececec]'
                }`}
              >
                <bdi dir="ltr">{v === CLIENT_PRESETS[CLIENT_PRESETS.length - 1] ? `${v}+` : v}</bdi>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Audit in progress: big percent, the four checks as report "flow steps", remaining time. */
export function CalcWaiting({
  locale,
  domain,
  progress,
}: {
  locale: string
  domain: string
  progress: CalcProgress
}) {
  const stages = copy.progressStages
  const current = Math.min(stages.length - 1, Math.floor((progress.percent / 100) * stages.length))
  const remaining = progress.overdue
    ? tCalc(copy.waitingLong, locale)
    : `${progress.remaining > 0 ? `${fillCalc(tCalc(copy.waitingRemaining, locale), { n: progress.remaining })}. ` : ''}${tCalc(copy.waitingShort, locale)}`

  return (
    <section className={`${CARD} flex flex-col gap-8`}>
      <CardTitle>{fillCalc(tCalc(copy.waitingTitle, locale), { domain })}</CardTitle>
      <div className="grid items-end gap-8 sm:grid-cols-[auto_1fr]">
        <div className="text-[72px] font-medium leading-none tracking-[-0.04em] text-[#1e1e1e] sm:text-[96px]">
          <bdi>{Math.round(progress.percent)}</bdi>
          <small className="ms-1 text-[22px] font-normal tracking-normal text-[#6b6254]">%</small>
        </div>
        <div className="flex flex-col gap-3">
          <Segs on={current + 1} color={BRAND} />
          <p role="status" aria-live="polite" className="m-0 text-[15px] text-[#6b6254]">
            {remaining}
          </p>
        </div>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 rounded-[10px] bg-[#f9f9f9] p-4 sm:p-6">
        {stages.map((label, i) => {
          const done = i < current || progress.percent >= 100
          const active = i === current && !done
          return (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#e8e8e8] bg-white px-3.5 py-3 text-sm"
            >
              <span className={done || active ? 'text-[#1e1e1e]' : 'text-[#6b6254]'}>{tCalc(label, locale)}</span>
              {done ? (
                <span className="text-xs font-medium text-[#22bf16]" aria-hidden>
                  ✓
                </span>
              ) : active ? (
                <span
                  aria-hidden
                  className="size-2 animate-pulse rounded-full bg-[#ff7900] motion-reduce:animate-none"
                />
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Ring gauge from the report score block: `percent` of inquiries lost. */
function Gauge({ percent, label, color }: { percent: number; label: string; color: string }) {
  const r = 62
  const c = 2 * Math.PI * r
  const shown = Math.min(100, Math.max(0, percent))
  return (
    <div className="relative size-[150px] shrink-0">
      <svg viewBox="0 0 150 150" className="size-full -rotate-90" aria-hidden>
        <circle cx="75" cy="75" r={r} fill="none" stroke={LINE} strokeWidth="10" />
        <circle
          cx="75"
          cy="75"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-lg text-[#1e1e1e]">
        <bdi>{label}</bdi>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg border border-[#1e1e1e] bg-[#f9f9f9] px-4 py-3.5">
      <b className="block text-[26px] font-medium leading-tight tracking-[-0.02em] text-[#1e1e1e]">
        <bdi>{value}</bdi>
      </b>
      <span className={LABEL}>{label}</span>
    </div>
  )
}

const AREAS: CalcArea[] = ['speed', 'forms', 'visibility', 'security']

function areaScores(p: AuditPillars): Record<CalcArea, number> {
  return { speed: p.speed, forms: p.leads, security: p.security, visibility: (p.seo + p.ai) / 2 }
}

/** Finished audit: loss headline, per-area scales, the sprint arithmetic. Reports the WhatsApp text upward. */
export function CalcResult({
  locale,
  domain,
  pillars,
  revenue,
  clients,
  approximate,
  reportHref,
  onWaText,
}: {
  locale: string
  domain: string
  pillars: AuditPillars
  revenue: number | null
  clients: number | null
  approximate: boolean
  reportHref: string | null
  onWaText: (text: string) => void
}) {
  const breakdown = useMemo(() => leakBreakdown(pillars), [pillars])
  const negligible = breakdown.total < LEAK_NEGLIGIBLE_BELOW
  const result = computeLeak(breakdown, { mode: 'revenue', monthlyRevenue: revenue ?? 0 })
  const hasMoney = !negligible && result.monthly > 0
  const lostClientsRaw = clients ? lostClientsPerMonth(breakdown, clients) : 0
  const lostClients = !negligible && lostClientsRaw > 0 ? lostClientsRaw : 0
  const areas = areaScores(pillars)
  const overall = Math.round(Object.values(areas).reduce((a, b) => a + b, 0) / 4)
  const gaugeColor = LEVEL_COLOR[lightFor(overall)]

  const waText = hasMoney
    ? fillCalc(tCalc(copy.waMessageWithLoss, locale), { amount: formatIls(result.monthly, locale), domain })
    : fillCalc(tCalc(copy.waMessageNoLoss, locale), { domain })
  useEffect(() => {
    onWaText(waText)
  }, [waText, onWaText])

  const monthly = useAnimatedNumber(hasMoney ? result.monthly : 0)
  const percent = formatPercent(result.percent, locale)
  const paybackLabel =
    result.paybackDays == null
      ? null
      : result.paybackDays <= 60
        ? fillCalc(tCalc(copy.paybackDays, locale), { n: result.paybackDays })
        : fillCalc(tCalc(copy.paybackMonths, locale), { n: Math.round(result.paybackDays / 30) })

  const stats: { value: React.ReactNode; label: string }[] = []
  if (!negligible) {
    if (hasMoney) stats.push({ value: formatIls(result.yearly, locale), label: tCalc(copy.lostYearly, locale) })
    if (lostClients > 0) stats.push({ value: `≈ ${lostClients}`, label: tCalc(copy.lostClients, locale) })
    stats.push({ value: formatIls(SPRINT_PRICE_ILS, locale), label: tCalc(copy.sprintCost, locale) })
    if (hasMoney && paybackLabel) stats.push({ value: paybackLabel, label: tCalc(copy.payback, locale) })
  }

  return (
    <>
      <section className={`${CARD} flex flex-col gap-6`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded border border-[#1e1e1e] bg-[#1e1e1e] px-2 py-[3px] text-[11px] font-medium uppercase tracking-[0.04em] text-[#ffe9c7]">
            {tCalc(copy.badgeYours, locale)}
          </span>
          <span className="text-2xl font-normal text-[#1e1e1e]">
            <bdi>{domain}</bdi>
          </span>
        </div>

        <div className="grid items-end gap-6 sm:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            {negligible ? (
              <p className="m-0 max-w-[520px] text-xl leading-snug text-[#1e1e1e]">{tCalc(copy.goodShape, locale)}</p>
            ) : hasMoney ? (
              <>
                <p className={`m-0 mb-2 ${LABEL}`}>{tCalc(copy.lostMoney, locale)}</p>
                <div className="text-[56px] font-medium leading-none tracking-[-0.04em] text-[#1e1e1e] sm:text-[96px]">
                  <bdi>{formatIls(monthly, locale)}</bdi>
                </div>
              </>
            ) : (
              <>
                <p className={`m-0 mb-2 ${LABEL}`}>{tCalc(copy.donutCenter, locale)}</p>
                <div className="text-[72px] font-medium leading-none tracking-[-0.04em] text-[#1e1e1e] sm:text-[96px]">
                  <bdi>{percent}</bdi>
                  <small className="ms-1 text-[22px] font-normal tracking-normal text-[#6b6254]">%</small>
                </div>
                <p className="m-0 mt-3.5 max-w-[520px] text-[15px] text-[#6b6254]">{tCalc(copy.addNumbersHint, locale)}</p>
              </>
            )}
            {!negligible && hasMoney ? (
              <p className="m-0 mt-3.5 max-w-[520px] text-[15px] text-[#6b6254]">
                {fillCalc(tCalc(copy.percentLine, locale), { p: percent })}
              </p>
            ) : null}
          </div>
          {!negligible ? <Gauge percent={result.percent * 2.4} label={`${percent}%`} color={gaugeColor} /> : null}
        </div>

        {stats.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 border-t border-[#e8e8e8] pt-6 lg:grid-cols-4">
            {stats.map((s) => (
              <Stat key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        ) : null}
      </section>

      <section className={`${CARD} grid grid-cols-1 sm:grid-cols-2`}>
        {AREAS.map((area, i) => {
          const score = areas[area]
          const level = lightFor(score)
          const points = breakdown[area === 'forms' ? 'forms' : area]
          const money = hasMoney && breakdown.total > 0 ? (result.monthly * points) / breakdown.total : 0
          const even = i % 2 === 1
          return (
            <div
              key={area}
              className={`flex flex-col gap-2.5 border-b border-[#e8e8e8] py-6 last:border-b-0 sm:last:border-b-0 ${
                even ? 'sm:ps-10' : 'sm:border-e sm:pe-10'
              } ${i >= 2 ? 'sm:border-b-0 sm:pb-0' : ''} ${i < 2 ? 'sm:pt-0' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="m-0 text-lg font-medium normal-case tracking-normal text-[#1e1e1e]">
                  {tCalc(copy.areaTitle[area], locale)}
                </h3>
                <span
                  className={`rounded border px-2 py-[3px] text-[11px] font-medium uppercase tracking-[0.04em] ${LEVEL_BADGE[level]}`}
                >
                  {tCalc(copy.levelLabel[level], locale)}
                </span>
              </div>
              <div className="flex items-baseline gap-2 text-lg text-[#1e1e1e]">
                <b className="text-[28px] font-medium tracking-[-0.02em]">
                  <bdi>{Math.round(score)}</bdi>
                </b>
                <span className="text-[#6b6254]">/ 100</span>
                {money > 0 ? (
                  <span className="ms-auto text-[15px] text-[#6b6254]">
                    <bdi>−{formatIls(Math.round(money / 10) * 10, locale)}</bdi> {tCalc(copy.perMonth, locale)}
                  </span>
                ) : null}
              </div>
              <Segs on={Math.max(score > 0 ? 1 : 0, Math.round(score / 25))} color={LEVEL_COLOR[level]} />
              <p className="m-0 text-sm text-[#6b6254]">{tCalc(copy.areaImpact[area][level], locale)}</p>
            </div>
          )
        })}
      </section>

      <CalcDetails locale={locale} pillars={pillars} approximate={approximate} reportHref={reportHref} />
    </>
  )
}

/** Collapsible raw scale scores, styled like a report check. */
function CalcDetails({
  locale,
  pillars,
  approximate,
  reportHref,
}: {
  locale: string
  pillars: AuditPillars
  approximate: boolean
  reportHref: string | null
}) {
  const rows = [
    { label: tCalc(copy.scaleSpeed, locale), value: pillars.speed },
    { label: tCalc(copy.scaleLeads, locale), value: pillars.leads },
    { label: tCalc(copy.scaleSeo, locale), value: pillars.seo },
    { label: tCalc(copy.scaleSecurity, locale), value: pillars.security },
    { label: tCalc(copy.scaleAi, locale), value: pillars.ai },
  ]
  return (
    <details className={`${CARD} group`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-medium text-[#1e1e1e] [&::-webkit-details-marker]:hidden">
        {tCalc(copy.detailsSummary, locale)}
        <span aria-hidden className="text-[#6b6254] transition-transform group-open:rotate-180">
          ⌄
        </span>
      </summary>
      <ul className="m-0 mt-5 flex list-none flex-col gap-4 p-0">
        {rows.map((row) => (
          <li key={row.label} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 text-[15px] text-[#1e1e1e]">
              <span>{row.label}</span>
              <bdi>{Math.round(row.value)}</bdi>
            </div>
            <Segs
              on={Math.max(row.value > 0 ? 1 : 0, Math.round(row.value / 25))}
              color={LEVEL_COLOR[lightFor(row.value)]}
            />
          </li>
        ))}
      </ul>
      {approximate ? <p className="m-0 mt-4 text-sm text-[#6b6254]">{tCalc(copy.scalesApprox, locale)}</p> : null}
      {reportHref ? (
        <a
          href={reportHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex text-sm font-medium text-[#1e1e1e] underline underline-offset-4 hover:text-[#e52421]"
        >
          {tCalc(copy.openReport, locale)}
        </a>
      ) : null}
    </details>
  )
}

/** Report-style footer block: offer line, WhatsApp button (locked while the audit runs), disclaimer. */
export function CalcCta({
  locale,
  waHref,
  locked,
  showNote,
}: {
  locale: string
  waHref: string | null
  locked: boolean
  showNote: boolean
}) {
  return (
    <section className="flex flex-col gap-5 px-1 py-4 sm:px-8">
      <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
        <div>
          <CardTitle>{tCalc(copy.offerTitle, locale)}</CardTitle>
          <p className="m-0 mt-2.5 max-w-[560px] text-[15px] text-[#6b6254]">
            {tCalc(copy.offerBody, locale)}{' '}
            <bdi className="whitespace-nowrap text-[#1e1e1e]">
              <s>{copy.offerOldPrice}</s> → <strong>{copy.offerNewPrice}</strong>
            </bdi>
          </p>
        </div>
        {waHref && locked ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            title={tCalc(copy.waLocked, locale)}
            className="flex cursor-not-allowed items-center justify-center gap-3 rounded-full bg-[#1e1e1e]/30 px-8 py-5 text-lg font-semibold text-white"
          >
            {tCalc(copy.waLocked, locale)}
          </button>
        ) : waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-3 rounded-full bg-[#e52421] px-8 py-5 text-lg font-semibold text-white no-underline transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(229,36,33,0.45)]"
          >
            {tCalc(copy.waButton, locale)}
            <span aria-hidden className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1">
              →
            </span>
          </a>
        ) : null}
      </div>
      {showNote ? <p className="m-0 text-sm text-[#6b6254]">{tCalc(copy.waNote, locale)}</p> : null}
      <p className="m-0 border-t border-[#e8e8e8] pt-4 text-center text-xs text-[#6b6254]">
        {tCalc(copy.disclaimer, locale)}
      </p>
    </section>
  )
}
