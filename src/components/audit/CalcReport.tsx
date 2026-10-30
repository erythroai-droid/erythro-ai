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
  LEAK_CAPS,
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
 * Calculator LP, design 2: every block follows the audit report template (light theme):
 * grey page, #f8f8f8 cards with a thin border, red bar before h2, outlined caps tags, white inner blocks,
 * 4-segment scales, big light numerals, ring gauge, top-3 cards, flow block, accordion checks, centred CTA.
 * Colours, sizes and spacing are measured from the report (render-v2-reports.mjs); the site font is Inter only.
 */

export const INK = '#1e1e1e'
export const MUTE = '#6b6254'
export const LINE = '#d6d6d6'
export const BRAND = '#e52421'

export const CARD = 'relative isolate overflow-hidden rounded-[10px] border border-[#e0e0e0] bg-[#f8f8f8] p-[22px] sm:p-8 lg:p-[60px]'
/** Compact card for the right-hand panel of a one-screen stage. */
export const PANEL = 'relative isolate p-[22px] sm:p-7 lg:p-8'
/** Outlined (hollow) giant lettering for background words and ghost numerals. */
const GHOST_STROKE = '[-webkit-text-stroke:1.5px_#d6d6d6] text-transparent select-none'
/** White block inside a card (report: flow, result box, tag). */
export const INNER = 'rounded-[10px] border border-[#d6d6d6] bg-white'
/** Report tag / badge: 12px caps in a small bordered box. */
export const TAG = 'inline-flex items-center gap-1 rounded border px-2 py-[3px] text-xs uppercase leading-[18px] tracking-[0.04em]'
export const LABEL = 'text-xs uppercase tracking-[0.04em] text-[#6b6254]'

const LEVEL_COLOR: Record<LightLevel, string> = { green: '#22bf16', yellow: '#ff7900', red: '#e52421' }
/** Strong tag (report ".tag.med"): used in top-3 cards and check rows. */
const LEVEL_STRONG: Record<LightLevel, string> = {
  green: 'border-[#22bf16] bg-[#d6f5d2] text-[#0e5a06]',
  yellow: 'border-[#ff7900] bg-[#ffe6cf] text-[#8f3f00]',
  red: 'border-[#e52421] bg-[#ffd9d8] text-[#a80d0a]',
}
/** Soft badge (report ".badge"): next to the scale titles. */
const LEVEL_SOFT: Record<LightLevel, string> = {
  green: 'border-[#cfecca] bg-[#eef9ec] text-[#1d7a12]',
  yellow: 'border-[#f8dcc0] bg-[#fff6ec] text-[#9a4a00]',
  red: 'border-[#f5c6c4] bg-[#fff0ef] text-[#a80d0a]',
}

export type CalcProgress = { percent: number; remaining: number; overdue: boolean }

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`m-0 flex items-start text-[28px] font-medium normal-case leading-[1.08] tracking-[-0.035em] text-[#1e1e1e] sm:text-[38px] lg:text-[48px] ${className}`}
    >
      <span aria-hidden className="me-3 mt-[0.08em] inline-block h-[0.9em] w-[3px] shrink-0 rounded-sm bg-[#e52421] sm:me-4" />
      <span className="min-w-0 text-balance">{children}</span>
    </h2>
  )
}

/** Card head: red-bar giant title, lead line and tag under it, a hollow ghost numeral filling the end side. */
function CardHead({
  title,
  tag,
  sub,
  no,
  compact,
}: {
  title: React.ReactNode
  tag?: React.ReactNode
  sub?: React.ReactNode
  no?: string
  compact?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className={`flex min-w-0 flex-col ${compact ? 'gap-3' : 'gap-4'}`}>
        <CardTitle className={compact ? '!text-[26px] sm:!text-[30px] lg:!text-[34px]' : ''}>{title}</CardTitle>
        {sub ? <p className="m-0 max-w-[620px] text-base leading-6 text-[#6b6254] sm:text-[17px]">{sub}</p> : null}
        {tag ? (
          <div className="flex flex-wrap items-center gap-2">
            <Tag>{tag}</Tag>
            <span aria-hidden className="h-px w-10 bg-[#d6d6d6]" />
          </div>
        ) : null}
      </div>
      {no ? (
        <span
          aria-hidden
          dir="ltr"
          className={`${GHOST_STROKE} -mt-2 shrink-0 text-[64px] font-semibold leading-[0.85] tracking-[-0.06em] ${compact ? 'sm:text-[88px]' : 'sm:text-[104px] lg:text-[148px]'}`}
        >
          {no}
        </span>
      ) : null}
    </div>
  )
}

function Tag({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`${TAG} border-[#d6d6d6] bg-white text-[#1e1e1e] ${className}`}>{children}</span>
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
        <i key={i} className="block h-[3px] rounded-sm" style={{ background: i < on ? color : LINE }} />
      ))}
    </div>
  )
}

function segsOn(score: number): number {
  return Math.max(score > 0 ? 1 : 0, Math.round(score / 25))
}

/** Ring from the report score block: dashed track, thick arc, bold label inside. */
function Gauge({ fraction, label, color, size = 150 }: { fraction: number; label: string; color: string; size?: number }) {
  const r = 66
  const c = 2 * Math.PI * r
  const shown = Math.min(1, Math.max(0, fraction))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 150 150" className="size-full -rotate-90" aria-hidden>
        <circle cx="75" cy="75" r={r} fill="none" stroke="#c9c9c9" strokeWidth="3" strokeDasharray="1.5 6" strokeLinecap="round" />
        <circle
          cx="75"
          cy="75"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${c * shown} ${c}`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center px-5 text-center text-base font-bold leading-5 text-[#1e1e1e]">
        <span>{label}</span>
      </div>
    </div>
  )
}

/** Tag row above the card, right under the logo: gold badge, outlined step / date tags, live indicator. */
export function CalcTags({ locale, kind, step }: { locale: string; kind: 'form' | 'waiting' | 'ready'; step: 1 | 2 | 3 | 4 }) {
  const [date, setDate] = useState('')
  useEffect(() => {
    setDate(new Intl.DateTimeFormat(intlTag(locale), { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date()))
  }, [locale])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`${TAG} border-[#1e1e1e] bg-[#1e1e1e] text-[#ffe9c7]`}>
        {tCalc(kind === 'form' ? copy.sectionTitle : copy.badgeYours, locale)}
      </span>
      <Tag>{fillCalc(tCalc(copy.stepOf, locale), { n: step, total: 4 })}</Tag>
      {kind === 'ready' ? (
        date ? <Tag>{fillCalc(tCalc(copy.checkedOn, locale), { d: date })}</Tag> : null
      ) : (
        <Tag>{tCalc(copy.headTagFree, locale)}</Tag>
      )}
      <span className="ms-auto inline-flex items-center gap-2 text-xs uppercase tracking-[0.04em] text-[#6b6254] max-sm:hidden">
        <span aria-hidden className="size-2 animate-pulse rounded-full bg-[#22bf16] motion-reduce:animate-none" />
        {tCalc(copy.heroLive, locale)}
      </span>
    </div>
  )
}

/** Hero text of a stage: giant headline, lead and facts. Sits directly on the shared backing, no card of its own. */
export function CalcHead({
  locale,
  kind,
  domain,
  children,
  showFacts = true,
}: {
  locale: string
  kind: 'form' | 'waiting' | 'ready'
  domain: string
  children?: React.ReactNode
  showFacts?: boolean
}) {
  const isForm = kind === 'form'
  const l1 = tCalc(isForm ? copy.heroL1 : kind === 'waiting' ? copy.heroWaitL1 : copy.heroReadyL1, locale)
  const l3 = tCalc(isForm ? copy.heroL3 : kind === 'waiting' ? copy.heroWaitL3 : copy.heroReadyL3, locale)
  const sub = tCalc(isForm ? copy.heroSubForm : kind === 'waiting' ? copy.heroSubWait : copy.heroSubReady, locale)

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col justify-between gap-4 px-[22px] pb-5 pt-6 sm:px-7 lg:px-8 lg:pb-6 lg:pt-6">
      <div className="flex flex-col gap-4">
        <div className={`items-center gap-2.5 ${children ? 'hidden' : 'flex'}`}>
          <span className="inline-flex items-center gap-1.5 rounded bg-[#1e1e1e] px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-[#ffe9c7]">
            <span className="size-1.5 rounded-full bg-[#e52421]" />
            {tCalc(copy.heroKicker, locale)}
          </span>
          <span className="h-px w-6 bg-[#d6d6d6]" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#6b6254]">
            AUTONOMOUS CHROMIUM LAB
          </span>
        </div>
        <h2
          className={`m-0 font-bold normal-case leading-[0.93] tracking-[-0.04em] text-[#1e1e1e] ${
            children
              ? '[font-size:clamp(38px,min(5.2vw,7.5vh),86px)]'
              : '[font-size:clamp(48px,min(6.5vw,9.5vh),108px)]'
          }`}
        >
          <span className="block">
            {l1}{' '}
            <span className="text-[#e52421]">
              <bdi>{isForm ? tCalc(copy.heroL2, locale) : domain}</bdi>
            </span>
          </span>
          <span className="block text-[#1e1e1e]">{l3}</span>
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {!children ? (
          <div className="flex flex-col gap-3">
            <p className="m-0 max-w-[560px] text-base leading-snug text-[#1e1e1e] sm:text-[17px]">{sub}</p>
            {isForm ? (
              <div className="flex flex-col gap-2 pt-0.5">
                <p className="m-0 font-mono text-[11px] font-medium uppercase tracking-wider text-[#6b6254]">
                  {tCalc(copy.step1ScopeTitle, locale)}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {copy.step1Scopes.map((scope) => (
                    <div
                      key={scope.code}
                      className="flex items-start gap-2 rounded-[6px] border border-[#d6d6d6] bg-white p-2.5 shadow-sm transition-colors hover:border-[#1e1e1e]"
                    >
                      <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-[3px] bg-[#1e1e1e] font-mono text-[9px] font-bold text-white">
                        ✓
                      </span>
                      <div className="min-w-0">
                        <p className="m-0 text-xs font-semibold leading-tight text-[#1e1e1e]">
                          {tCalc(scope.title, locale)}
                        </p>
                        <p className="m-0 mt-0.5 text-[11px] leading-tight text-[#6b6254]">
                          {tCalc(scope.desc, locale)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {children}
        {showFacts ? (
          <dl className="m-0 grid grid-cols-3 gap-2.5 sm:gap-3">
            {copy.heroFacts.map((f, i) => (
              <div
                key={f.big}
                className="group relative flex flex-col justify-between rounded-[8px] border border-[#d6d6d6] bg-white p-3 sm:p-3.5 shadow-sm transition-all hover:border-[#1e1e1e]"
              >
                <div className="flex items-center justify-between gap-1 pb-1">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#6b6254]">
                    {'tag' in f ? f.tag : `0${i + 1}`}
                  </span>
                  <span
                    aria-hidden
                    className={`size-1.5 rounded-full ${
                      i === 0 ? 'bg-[#e52421]' : i === 1 ? 'bg-[#1e1e1e]' : 'bg-[#22bf16]'
                    }`}
                  />
                </div>
                <dt className="text-[26px] sm:text-[34px] font-semibold leading-none tracking-[-0.03em] text-[#1e1e1e]">
                  <bdi>{f.big}</bdi>
                </dt>
                <dd className="m-0 mt-1.5 text-[11px] font-medium uppercase leading-snug tracking-[0.03em] text-[#6b6254]">
                  {tCalc(f.label, locale)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </div>
  )
}

/** One-screen stage on a single shared backing: hero text on the start side, working area on the other. */
export function CalcSplit({ locale, left, right }: { locale: string; left: React.ReactNode; right: React.ReactNode }) {
  return (
    <section className="relative isolate flex flex-col overflow-hidden rounded-[10px] border border-[#e0e0e0] bg-[#f8f8f8]">
      <div className="grid flex-1 items-stretch lg:grid-cols-[1.08fr_1fr]">
        {left}
        <div className="flex min-w-0 flex-col bg-white border-t border-[#e0e0e0] lg:border-t-0 lg:border-s [&>*]:flex-1">{right}</div>
      </div>
    </section>
  )
}

/** Step tracker: done steps ink, current step red, the rest grey. */
export function CalcStepper({ locale, current }: { locale: string; current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="m-0 grid list-none grid-cols-4 gap-1.5 p-0">
      {copy.stepper.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3 | 4
        const isCurrent = n === current
        const isPast = n < current
        return (
          <li
            key={n}
            className={`flex min-w-0 flex-col gap-1 rounded-[4px] border p-2 transition-colors ${
              isCurrent
                ? 'border-[#d6d6d6] bg-white shadow-sm border-t-2 border-t-[#e52421]'
                : isPast
                  ? 'border-[#e0e0e0] bg-[#fcfcfc]'
                  : 'border-[#eaeaea] bg-[#f8f8f8] opacity-70'
            }`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div className="flex items-center justify-between">
              <span
                className={`flex size-4.5 items-center justify-center rounded-[3px] font-mono text-[10px] font-bold ${
                  isCurrent
                    ? 'bg-[#e52421] text-white'
                    : isPast
                      ? 'bg-[#1e1e1e] text-white'
                      : 'bg-[#d6d6d6] text-[#6b6254]'
                }`}
              >
                {isPast ? '✓' : `0${n}`}
              </span>
              {isCurrent ? (
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#e52421] max-sm:hidden">
                  NOW
                </span>
              ) : null}
            </div>
            <span
              className={`truncate text-xs leading-tight ${
                isCurrent ? 'font-semibold text-[#1e1e1e]' : isPast ? 'font-medium text-[#1e1e1e]' : 'text-[#6b6254]'
              }`}
            >
              {tCalc(label, locale)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Outline button from the report footer; ink fill on hover. */
export const OUTLINE_BTN =
  'flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#1e1e1e] bg-white px-[26px] text-sm font-semibold tracking-[0.01em] text-[#1e1e1e] transition-colors hover:bg-[#1e1e1e] hover:text-white disabled:cursor-wait disabled:opacity-70'

/** High-contrast primary action button for the calculator audit launch. */
export const PRIMARY_BTN =
  'group relative flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-[#1e1e1e] px-8 py-4 text-base font-semibold tracking-[0.02em] text-white shadow-[0_4px_16px_rgba(30,30,30,0.18)] transition-all duration-200 hover:bg-[#e52421] hover:shadow-[0_8px_24px_rgba(229,36,33,0.32)] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70'

/** Report "flow-out" list: green ticks. */
function TickList({ items }: { items: readonly string[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((text) => (
        <li key={text} className="flex items-start gap-2.5 text-[15px] leading-snug text-[#1e1e1e]">
          <span aria-hidden className="mt-px text-[#22bf16]">
            ✓
          </span>
          {text}
        </li>
      ))}
    </ul>
  )
}

function FlowLabel({ children }: { children: React.ReactNode }) {
  return <h4 className="m-0 mb-3 text-xs font-normal uppercase leading-5 tracking-[0.04em] text-[#6b6254]">{children}</h4>
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit max-w-full items-center rounded-full border border-[#22bf16] bg-[#d6f5d2] px-3.5 py-[5px] text-[15px] text-[#0e5a06]">
      <bdi className="truncate">{children}</bdi>
    </span>
  )
}

/** Steps 1-2 of the form: the stepper and the active step in a white block. */
export function CalcFormShell({
  locale,
  step,
  children,
}: {
  locale: string
  step: 1 | 2
  children: React.ReactNode
}) {
  const isStep1 = step === 1
  return (
    <section className={`${PANEL} flex h-full min-w-0 flex-col justify-center gap-3.5 sm:gap-4`}>
      <CardHead
        compact
        title={tCalc(isStep1 ? copy.step1Heading : copy.step2Heading, locale)}
        sub={tCalc(isStep1 ? copy.step1Sub : copy.step2Sub, locale)}
        tag={fillCalc(tCalc(copy.stepOf, locale), { n: step, total: 4 })}
        no={`0${step}`}
      />
      <CalcStepper locale={locale} current={step} />
      <div className={`${INNER} flex min-w-0 flex-col gap-4 rounded-[6px] px-5 py-4 sm:px-6 shadow-sm`}>
        <div className="flex items-center justify-between border-b border-[#e8e8e8] pb-2 text-xs uppercase tracking-wider text-[#6b6254]">
          <span className="flex items-center gap-2 font-mono font-medium text-[#1e1e1e]">
            <span className="size-2 rounded-full bg-[#22bf16] animate-pulse" />
            {tCalc(isStep1 ? copy.stepSite : copy.stepNumbers, locale)}
          </span>
          <span className="font-mono text-[11px] rounded border border-[#d6d6d6] bg-[#f9f9f9] px-2 py-0.5 text-[#6b6254]">
            {isStep1 ? 'HEADLESS CHROMIUM' : 'REVENUE CONVERTER'}
          </span>
        </div>
        {children}
      </div>
    </section>
  )
}

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
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium tabular-nums transition-colors ${
                  on
                    ? 'border-[#1e1e1e] bg-[#1e1e1e] text-white'
                    : 'border-[#d6d6d6] bg-white text-[#1e1e1e] hover:border-[#1e1e1e]'
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

/** Audit in progress: percent + ring, then the report's "flow" block: what we check → what the auditor does → what you get. */
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
  const ringLabel =
    !progress.overdue && progress.remaining > 0 ? `≈ ${progress.remaining} ${tCalc(copy.minShort, locale)}` : '…'

  return (
    <section className={`${PANEL} flex h-full min-w-0 flex-col justify-center gap-4`}>
      <CardHead compact title={fillCalc(tCalc(copy.waitingTitle, locale), { domain })} tag={tCalc(copy.waitingTag, locale)} no="03" />

      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="min-w-0">
          <div className="text-[56px] font-medium leading-none tracking-[-0.04em] text-[#1e1e1e] sm:text-[72px]">
            <bdi>{Math.round(progress.percent)}</bdi>
            <small className="ms-1 text-[22px] font-normal tracking-normal text-[#6b6254]">%</small>
          </div>
          <p role="status" aria-live="polite" className="m-0 mt-3.5 max-w-[520px] text-base text-[#6b6254]">
            {remaining}
          </p>
        </div>
        <Gauge fraction={progress.percent / 100} label={ringLabel} color={BRAND} />
      </div>

      <div className="border-t border-[#d6d6d6]" />

      <div className={`flex flex-col gap-3 px-5 py-4 sm:px-6 ${INNER}`}>
        <div>
          <FlowLabel>{tCalc(copy.flowIn, locale)}</FlowLabel>
          <div className="flex flex-wrap items-start gap-2">
            <Pill>{domain}</Pill>
            <Pill>{tCalc(copy.pillHome, locale)}</Pill>
            <Pill>{tCalc(copy.pillMobile, locale)}</Pill>
          </div>
        </div>
        <div>
          <FlowLabel>{tCalc(copy.flowSteps, locale)}</FlowLabel>
          <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
            {stages.map((label, i) => {
              const done = i < current || progress.percent >= 100
              const active = i === current && !done
              return (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#d6d6d6] bg-[#f8f8f8] px-3.5 py-2.5 text-[15px] leading-snug"
                >
                  <span className={done || active ? 'text-[#1e1e1e]' : 'text-[#6b6254]'}>
                    {tCalc(label, locale).replace(/…$/, '')}
                  </span>
                  {done ? (
                    <span className="text-[11px] font-medium text-[#22bf16]">{tCalc(copy.statusOk, locale)}</span>
                  ) : active ? (
                    <span
                      aria-hidden
                      className="size-2 shrink-0 animate-pulse rounded-full bg-[#ff7900] motion-reduce:animate-none"
                    />
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}

const AREAS: CalcArea[] = ['speed', 'forms', 'visibility', 'security']

function areaScores(p: AuditPillars): Record<CalcArea, number> {
  return { speed: p.speed, forms: p.leads, security: p.security, visibility: (p.seo + p.ai) / 2 }
}

const AREA_OF_SCALE = { speed: 'speed', leads: 'forms', seo: 'visibility', security: 'security', ai: 'visibility' } as const

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className={`${INNER} min-w-0 px-4 py-4 sm:px-[22px] sm:py-5`}>
      <b className="block text-[22px] font-medium leading-tight tracking-[-0.02em] text-[#1e1e1e] sm:text-[32px]">
        <bdi className="whitespace-nowrap">{value}</bdi>
      </b>
      <span className={LABEL}>{label}</span>
    </div>
  )
}

/** Finished audit: score block, per-area scales, top-3 cards, accordion checks, calculation protocol, sprint offer. */
export function CalcResult({
  locale,
  domain,
  pillars,
  revenue,
  clients,
  approximate,
  reportHref,
  waHref,
  onWaText,
}: {
  locale: string
  domain: string
  pillars: AuditPillars
  revenue: number | null
  clients: number | null
  approximate: boolean
  reportHref: string | null
  waHref: string | null
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
  const overallLevel = lightFor(overall)

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

  const rows = AREAS.map((area) => {
    const score = areas[area]
    const points = breakdown[area]
    const money = hasMoney && breakdown.total > 0 ? (result.monthly * points) / breakdown.total : 0
    return { area, score, level: lightFor(score), points, money }
  })
  const weakest = rows.reduce((a, b) => (b.score < a.score ? b : a), rows[0])
  const top3 = [...rows]
    .filter((r) => r.level !== 'green')
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)

  return (
    <>
      {/* One screen: hero with the loss figure + working panel with scales and top-3 */}
      <CalcTags locale={locale} kind="ready" step={4} />
      <CalcSplit
        locale={locale}
        left={
          <CalcHead locale={locale} kind="ready" domain={domain} showFacts={false}>
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  {negligible ? (
                    <p className="m-0 max-w-[560px] text-[22px] leading-snug text-[#1e1e1e]">{tCalc(copy.goodShape, locale)}</p>
                  ) : (
                    <>
                      <p className={`m-0 mb-2 ${LABEL}`}>{tCalc(hasMoney ? copy.lostMoney : copy.donutCenter, locale)}</p>
                      <div className="font-medium leading-none tracking-[-0.04em] text-[#1e1e1e] [font-size:clamp(44px,min(6vw,10vh),100px)]">
                        <bdi>{hasMoney ? formatIls(monthly, locale) : percent}</bdi>
                        <small className="ms-2 inline-block whitespace-nowrap text-[20px] font-normal tracking-normal text-[#6b6254]">
                          {hasMoney ? tCalc(copy.perMonth, locale) : '%'}
                        </small>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <p className="m-0 max-w-[620px] text-[15px] leading-6 text-[#6b6254]">
                {!negligible && hasMoney ? `${fillCalc(tCalc(copy.percentLine, locale), { p: percent })} ` : ''}
                {!negligible && !hasMoney ? `${tCalc(copy.addNumbersHint, locale)} ` : ''}
                {fillCalc(tCalc(copy.scoreNote, locale), {
                  score: overall,
                  area: tCalc(copy.areaTitle[weakest.area], locale),
                  value: Math.round(weakest.score),
                })}
              </p>
              {stats.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {stats.map((st) => (
                    <div key={st.label} className={`${INNER} min-w-0 px-3 py-3`}>
                      <b className="block text-[20px] font-medium leading-tight tracking-[-0.02em] text-[#1e1e1e] sm:text-[24px]">
                        <bdi className="whitespace-nowrap">{st.value}</bdi>
                      </b>
                      <span className={`${LABEL} block text-[11px] leading-tight`}>{st.label}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${OUTLINE_BTN} !w-fit !px-8 py-3.5 no-underline`}
                >
                  {tCalc(copy.waButton, locale)}
                  <span aria-hidden className="rtl:rotate-180">
                    →
                  </span>
                </a>
              ) : null}
            </div>
          </CalcHead>
        }
        right={
          <section className={`${PANEL} flex h-full min-w-0 flex-col justify-center gap-5`}>
            <div className="flex items-center justify-between gap-4">
              <CardHead compact title={tCalc(copy.whereLeaks, locale)} tag={tCalc(copy.scalesTag, locale)} />
              <Gauge size={116}fraction={overall / 100} label={tCalc(copy.levelLabel[overallLevel], locale)} color={LEVEL_COLOR[overallLevel]} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {rows.map(({ area, score, level, money }) => (
                <div key={area} className={`${INNER} flex flex-col gap-2 px-4 py-3.5`}>
                  <h3 className="m-0 flex items-center gap-2 text-[15px] font-medium normal-case leading-tight tracking-normal text-[#1e1e1e]">
                    <i aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: LEVEL_COLOR[level] }} />
                    {tCalc(copy.areaTitle[area], locale)}
                  </h3>
                  <div className="flex items-baseline justify-between gap-2">
                    <b className="text-[28px] font-medium leading-none tracking-[-0.02em] text-[#1e1e1e]">
                      <bdi>{Math.round(score)}</bdi>
                    </b>
                    {money > 0 ? (
                      <span className="text-[13px] text-[#6b6254]">
                        <bdi className="font-medium text-[#1e1e1e]">−{formatIls(Math.round(money / 10) * 10, locale)}</bdi>{' '}
                        {tCalc(copy.perMonth, locale)}
                      </span>
                    ) : null}
                  </div>
                  <Segs on={segsOn(score)} color={LEVEL_COLOR[level]} />
                </div>
              ))}
            </div>
            {top3.length > 0 && !negligible ? (
              <div className="flex flex-col gap-2.5">
                <p className={`m-0 ${LABEL}`}>{tCalc(copy.top3Title, locale)}</p>
                {top3.map(({ area, money }, i) => (
                  <a
                    key={area}
                    href="#calc-top3"
                    className={`${INNER} flex items-center gap-3 px-3.5 py-2.5 text-[#1e1e1e] no-underline transition-colors hover:border-[#1e1e1e]`}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-[5px] bg-[#e52421] text-sm font-semibold text-white">
                      <bdi>{String(i + 1).padStart(2, '0')}</bdi>
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px]">{tCalc(copy.areaTitle[area], locale)}</span>
                    {money > 0 ? (
                      <b className="shrink-0 text-[15px] font-semibold">
                        <bdi>−{formatIls(Math.round(money / 10) * 10, locale)}</bdi>
                      </b>
                    ) : null}
                    <span aria-hidden className="text-[#6b6254]">
                      ↓
                    </span>
                  </a>
                ))}
              </div>
            ) : null}
          </section>
        }
      />

      {/* 3. Top-3 sources of loss */}
      {top3.length > 0 && !negligible ? (
        <section id="calc-top3" className={`${CARD} flex scroll-mt-6 flex-col gap-6`}>
          <CardHead title={tCalc(copy.top3Title, locale)} sub={tCalc(copy.top3Sub, locale)} no="01" />
          <div className="flex flex-col gap-5">
            {top3.map(({ area, level, money }, i) => (
              <article
                key={area}
                className="relative isolate grid grid-cols-[44px_1fr] gap-x-4 overflow-hidden rounded-xl border border-t-[3px] border-[#d6d6d6] border-t-[#e52421] bg-white px-5 py-5 sm:grid-cols-[60px_1fr] sm:gap-x-[18px] sm:px-8 sm:py-7"
              >
                <span
                  aria-hidden
                  dir="ltr"
                  className={`${GHOST_STROKE} pointer-events-none absolute -top-3 end-4 -z-10 text-[96px] font-semibold leading-none tracking-[-0.06em] sm:text-[150px]`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="grid size-11 place-items-center rounded-[5px] bg-[#e52421] text-lg font-semibold tracking-[-0.03em] text-white sm:size-[60px] sm:text-[22px]">
                  <bdi>{String(i + 1).padStart(2, '0')}</bdi>
                </div>
                <div className="min-w-0">
                  <h3 className="m-0 text-lg font-medium normal-case leading-[30px] tracking-normal text-[#1e1e1e] sm:text-xl">
                    {tCalc(copy.areaTitle[area], locale)}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`${TAG} ${LEVEL_STRONG[level]}`}>{tCalc(copy.levelLabel[level], locale)}</span>
                  </div>
                </div>
                <div className="col-span-2 mt-4 sm:col-span-1 sm:col-start-2 sm:mt-5">
                  <TopRow dot={BRAND} label={tCalc(copy.rowProblem, locale)}>
                    {tCalc(copy.areaImpact[area][level], locale)}
                  </TopRow>
                  <TopRow dot="#ff7900" label={tCalc(copy.rowLoss, locale)}>
                    {money > 0 ? (
                      <>
                        <b className="font-semibold">
                          <bdi>{fillCalc(tCalc(copy.lossPerMonth, locale), { amount: formatIls(Math.round(money / 10) * 10, locale) })}</bdi>
                        </b>{' '}
                      </>
                    ) : null}
                    {tCalc(copy.areaLoss[area], locale)}
                  </TopRow>
                  <TopRow dot="#22bf16" label={tCalc(copy.rowSolution, locale)} last>
                    {tCalc(copy.areaFix[area], locale)}{' '}
                    <a href="#calc-offer" className="font-semibold text-[#e52421] no-underline hover:underline">
                      {tCalc(copy.fixLink, locale)}
                    </a>
                  </TopRow>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* 4. Checks: filter pills + accordion rows, like "Полный чеклист аудита" */}
      <CalcChecks locale={locale} pillars={pillars} approximate={approximate} />

      {/* 5. Calculation protocol, like "Протокол выполненного аудита" */}
      <section className={`${CARD} flex flex-col gap-6`}>
        <CardHead title={tCalc(copy.protoTitle, locale)} sub={tCalc(copy.protoSub, locale)} no="03" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat value={revenue == null ? '—' : formatIls(revenue, locale)} label={tCalc(copy.sliderRevenue, locale)} />
          <Stat value={clients == null ? '—' : clients} label={tCalc(copy.clientsLabel, locale)} />
          <Stat value={`${overall} / 100`} label={tCalc(copy.protoScore, locale)} />
        </div>
        <ul className={`m-0 flex list-none flex-col gap-3 px-5 py-5 sm:px-6 ${INNER}`}>
          {copy.protoNotes.map((note) => (
            <li key={note.en} className="flex items-start gap-2.5 text-[15px] leading-snug text-[#1e1e1e]">
              <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[#6b6254]" />
              {tCalc(note, locale)}
            </li>
          ))}
        </ul>
        {reportHref ? (
          <a
            href={reportHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`${OUTLINE_BTN} !w-fit !px-8 py-3.5 no-underline`}
          >
            {tCalc(copy.openReport, locale)}
          </a>
        ) : null}
      </section>

      {/* 6. Sprint offer as a report "action" card */}
      <CalcSprint locale={locale} areas={top3.map((r) => r.area)} />
    </>
  )
}

function TopRow({
  dot,
  label,
  last,
  children,
}: {
  dot: string
  label: string
  last?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={`grid gap-1 py-2.5 text-base leading-6 text-[#1e1e1e] sm:grid-cols-[200px_1fr] sm:gap-4 ${
        last ? 'pb-0' : 'border-b border-[#e0e0e0]'
      }`}
    >
      <b className="flex items-center gap-2 text-xs font-normal uppercase leading-[18px] tracking-[0.04em] text-[#6b6254]">
        <i aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: dot }} />
        {label}
      </b>
      <span>{children}</span>
    </div>
  )
}

type CheckFilter = 'all' | LightLevel

/** Scale scores as report check rows (accordion) with level filter pills. */
function CalcChecks({
  locale,
  pillars,
  approximate,
}: {
  locale: string
  pillars: AuditPillars
  approximate: boolean
}) {
  const [filter, setFilter] = useState<CheckFilter>('all')
  const items = [
    { key: 'speed', label: tCalc(copy.scaleSpeed, locale), value: pillars.speed },
    { key: 'leads', label: tCalc(copy.scaleLeads, locale), value: pillars.leads },
    { key: 'seo', label: tCalc(copy.scaleSeo, locale), value: pillars.seo },
    { key: 'security', label: tCalc(copy.scaleSecurity, locale), value: pillars.security },
    { key: 'ai', label: tCalc(copy.scaleAi, locale), value: pillars.ai },
  ] as const
  const shown = items.filter((it) => filter === 'all' || lightFor(it.value) === filter)
  const filters: { key: CheckFilter; label: string }[] = [
    { key: 'all', label: tCalc(copy.filterAll, locale) },
    { key: 'green', label: tCalc(copy.levelLabel.green, locale) },
    { key: 'yellow', label: tCalc(copy.levelLabel.yellow, locale) },
    { key: 'red', label: tCalc(copy.levelLabel.red, locale) },
  ]

  return (
    <section className={`${CARD} flex flex-col gap-6`}>
      <CardHead
        title={tCalc(copy.checkTitle, locale)}
        tag={fillCalc(tCalc(copy.checkTag, locale), { n: shown.length, total: items.length })}
        no="02"
      />
      <div className="flex flex-wrap gap-2.5" role="group">
        {filters.map((f) => {
          const on = f.key === filter
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f.key)}
              className={`cursor-pointer rounded-full border px-3.5 py-2 text-xs uppercase tracking-[0.04em] transition-colors ${
                on
                  ? 'border-[#1e1e1e] bg-[#1e1e1e] text-white'
                  : 'border-[#d6d6d6] bg-white text-[#1e1e1e] hover:border-[#1e1e1e]'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>
      <div className="flex flex-col gap-3">
        {shown.length === 0 ? <p className="m-0 text-base text-[#6b6254]">{tCalc(copy.noItems, locale)}</p> : null}
        {shown.map((it) => {
          const level = lightFor(it.value)
          return (
            <details key={it.key} className="group rounded-[10px] border border-[#d6d6d6] bg-white">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 sm:py-5 sm:pe-6 sm:ps-[26px] [&::-webkit-details-marker]:hidden">
                <span className={`${TAG} shrink-0 ${LEVEL_STRONG[level]}`}>{tCalc(copy.levelLabel[level], locale)}</span>
                <span className="min-w-0 flex-1 text-base leading-snug text-[#1e1e1e]">{it.label}</span>
                <b className="shrink-0 text-xl font-medium tracking-[-0.02em] text-[#1e1e1e]">
                  <bdi>{Math.round(it.value)}</bdi>
                </b>
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-[#d6d6d6] bg-white text-[#1e1e1e] transition-transform group-open:rotate-180"
                >
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 6l4.5 4.5L12.5 6" />
                  </svg>
                </span>
              </summary>
              <div className="flex flex-col gap-3 border-t border-[#e0e0e0] px-5 py-5 sm:px-[26px]">
                <Segs on={segsOn(it.value)} color={LEVEL_COLOR[level]} />
                <p className="m-0 text-[15px] leading-snug text-[#6b6254]">
                  {tCalc(copy.areaImpact[AREA_OF_SCALE[it.key]][level], locale)}
                </p>
              </div>
            </details>
          )
        })}
      </div>
      {approximate ? <p className="m-0 text-base leading-[26px] text-[#6b6254]">{tCalc(copy.scalesApprox, locale)}</p> : null}
    </section>
  )
}

/** Report "action" card: orange side stripe, price badge, white list of what is fixed. */
function CalcSprint({ locale, areas }: { locale: string; areas: CalcArea[] }) {
  return (
    <section
      id="calc-offer"
      className="grid scroll-mt-6 gap-6 rounded-[10px] border border-s-4 border-[#d6d6d6] border-s-[#e8650a] bg-white px-5 py-6 sm:grid-cols-[1fr_auto] sm:px-7 sm:py-[26px]"
    >
      <div className="min-w-0">
        <h3 className="m-0 text-[19px] font-semibold normal-case leading-[1.35] tracking-normal text-[#1e1e1e]">
          {tCalc(copy.sprintTitle, locale)}
        </h3>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Tag>{tCalc(copy.sprintBadge, locale)}</Tag>
          <span className={`${TAG} ${LEVEL_STRONG.yellow}`}>{tCalc(copy.offerTitle, locale)}</span>
        </div>
        <p className="m-0 mt-3.5 max-w-[640px] text-base leading-6 text-[#6b6254]">
          {tCalc(copy.offerBody, locale)}{' '}
          <bdi className="whitespace-nowrap text-[#1e1e1e]">
            <s>{copy.offerOldPrice}</s> → <strong>{copy.offerNewPrice}</strong>
          </bdi>
        </p>
        {areas.length > 0 ? (
          <div className="mt-5 rounded-lg border border-[#d6d6d6] border-t-2 border-t-[#e8650a] bg-[#fdfaf6] px-5 py-4">
            <p className={`m-0 mb-3 ${LABEL}`}>{tCalc(copy.sprintIncludes, locale)}</p>
            <TickList items={areas.map((a) => `${tCalc(copy.areaTitle[a], locale)}: ${tCalc(copy.areaFix[a], locale)}`)} />
          </div>
        ) : null}
      </div>
      <div className="flex h-fit min-w-[92px] flex-col items-center justify-center rounded-md bg-[#e8650a] px-4 py-3 text-white">
        <span className="text-[11px] uppercase tracking-[0.08em] opacity-90">{tCalc(copy.sprintBadge, locale)}</span>
        <b className="text-[32px] font-semibold leading-tight tracking-[-0.03em] sm:text-[44px]">
          <bdi>{formatIls(SPRINT_PRICE_ILS, locale)}</bdi>
        </b>
      </div>
    </section>
  )
}

/** Report-style footer: centred CTA block, WhatsApp pill (locked while the audit runs), disclaimer below. */
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
    <>
      <section className="relative isolate flex flex-col items-center gap-6 overflow-hidden rounded-[10px] border border-[#e0e0e0] bg-[#f8f8f8] px-[22px] py-14 text-center sm:px-8 sm:py-20 lg:px-[60px] lg:py-28">
        <h2 className="m-0 font-semibold normal-case leading-[0.98] tracking-[-0.045em] text-[#1e1e1e] [font-size:clamp(36px,7.2vw,96px)]">
          <span className="block">{tCalc(copy.ctaL1, locale)}</span>
          <span className="block text-[#e52421]">{tCalc(copy.ctaL2, locale)}</span>
        </h2>
        <p className="m-0 max-w-[560px] text-base leading-6 text-[#6b6254] sm:text-lg">{tCalc(copy.ctaBody, locale)}</p>
        {waHref && locked ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            title={tCalc(copy.waLocked, locale)}
            className="flex cursor-not-allowed items-center justify-center gap-3 rounded-full border border-[#d6d6d6] bg-[#ececec] px-[26px] py-3.5 text-sm font-semibold text-[#6b6254]"
          >
            {tCalc(copy.waLocked, locale)}
          </button>
        ) : waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-2.5 rounded-full border border-[#1e1e1e] bg-white px-[26px] py-3.5 text-sm font-semibold text-[#1e1e1e] no-underline transition-colors hover:bg-[#1e1e1e] hover:text-white"
          >
            {tCalc(copy.waButton, locale)}
            <span aria-hidden className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1">
              →
            </span>
          </a>
        ) : null}
        {showNote ? <p className="m-0 text-sm text-[#6b6254]">{tCalc(copy.waNote, locale)}</p> : null}
      </section>
      <p className="m-0 mx-auto max-w-[960px] px-4 text-center text-xs leading-[1.6] text-[#6b6b6b]">
        {tCalc(copy.disclaimer, locale)}
      </p>
    </>
  )
}
