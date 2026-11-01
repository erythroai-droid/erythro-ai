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

export const INK = '#0f172a'
export const MUTE = '#64748b'
export const LINE = '#e2e8f0'
export const BRAND = '#e52421'

export const CARD = 'relative isolate overflow-hidden rounded-[16px] border border-[#e2e8f0] bg-white p-[22px] sm:p-8 lg:p-[60px] shadow-[0_4px_24px_rgba(15,23,42,0.03)]'
/** Compact card for the right-hand panel of a one-screen stage, with ~48px padding on desktop. */
export const PANEL = 'relative isolate px-[22px] py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-[46px]'
/** Outlined (hollow) giant lettering for background words and ghost numerals. */
const GHOST_STROKE = '[-webkit-text-stroke:1.5px_#e2e8f0] text-transparent select-none'
/** White block inside a card (report: flow, result box, tag). */
export const INNER = 'rounded-[16px] border border-[#e2e8f0] bg-white'
/** Report tag / badge: 12px caps in a small bordered box. */
export const TAG = 'inline-flex items-center gap-1 rounded-md border border-[#e2e8f0] px-2.5 py-[3px] text-xs uppercase leading-[18px] tracking-[0.04em] font-mono'
export const LABEL = 'text-xs uppercase tracking-[0.04em] text-[#64748b]'

const LEVEL_COLOR: Record<LightLevel, string> = { green: '#10b981', yellow: '#c99839', red: '#e52421' }
/** Strong tag (report ".tag.med"): used in top-3 cards and check rows. */
const LEVEL_STRONG: Record<LightLevel, string> = {
  green: 'border-[#10b981] bg-[#ecfdf5] text-[#065f46]',
  yellow: 'border-[#c99839] bg-[#fefce8] text-[#854d0e]',
  red: 'border-[#e52421] bg-[#fef2f2] text-[#991b1b]',
}
/** Soft badge (report ".badge"): next to the scale titles. */
const LEVEL_SOFT: Record<LightLevel, string> = {
  green: 'border-[#a7f3d0] bg-[#f0fdf4] text-[#047857]',
  yellow: 'border-[#fef08a] bg-[#fffbeb] text-[#a16207]',
  red: 'border-[#fecaca] bg-[#fff1f2] text-[#be123c]',
}

export type CalcProgress = { percent: number; remaining: number; overdue: boolean }

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`m-0 flex items-stretch text-[28px] font-medium normal-case leading-[1.08] tracking-[-0.035em] text-[#1e1e1e] sm:text-[38px] lg:text-[48px] ${className}`}
    >
      <span aria-hidden className="me-3 mt-[calc((1lh-1.21em)/2+0.242em)] inline-block h-[0.727em] w-[2px] shrink-0 self-start bg-[#e52421] sm:me-4" />
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
  isDark = false,
}: {
  title: React.ReactNode
  tag?: React.ReactNode
  sub?: React.ReactNode
  no?: string
  compact?: boolean
  isDark?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className={`flex min-w-0 flex-col ${compact ? 'gap-3' : 'gap-4'}`}>
        <CardTitle className={compact ? `!text-[26px] sm:!text-[30px] lg:!text-[34px] ${isDark ? '!text-white' : '!text-[#0f172a]'}` : isDark ? '!text-white' : '!text-[#0f172a]'}>{title}</CardTitle>
        {sub ? <p className={`m-0 max-w-[620px] text-base leading-6 ${isDark ? 'text-white/70' : 'text-[#475569]'} sm:text-[17px]`}>{sub}</p> : null}
        {tag ? (
          <div className="flex flex-wrap items-center gap-2">
            <Tag isDark={isDark}>{tag}</Tag>
            <span aria-hidden className={`h-px w-10 ${isDark ? 'bg-white/10' : 'bg-[#e2e8f0]'}`} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Tag({ children, className = '', isDark = false }: { children: React.ReactNode; className?: string; isDark?: boolean }) {
  return <span className={`${TAG} ${isDark ? 'border-white/10 bg-white/10 text-white' : 'border-[#d6d6d6] bg-white text-[#1e1e1e]'} ${className}`}>{children}</span>
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
function Gauge({ fraction, label, color, size = 150 }: { fraction: number; label: React.ReactNode; color: string; size?: number }) {
  const r = 66
  const c = 2 * Math.PI * r
  const shown = Math.min(1, Math.max(0, fraction))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 150 150" className="size-full -rotate-90" aria-hidden>
        <circle cx="75" cy="75" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" strokeDasharray="2 6" strokeLinecap="round" />
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
      <div className="absolute inset-0 grid place-items-center px-2 text-center text-xs sm:text-sm font-bold leading-tight text-[#0f172a]">
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
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0f172a]">
        {tCalc(kind === 'form' ? copy.sectionTitle : copy.badgeYours, locale)}
      </span>
      <span className="inline-flex items-center rounded-full border border-[#e2e8f0] bg-white px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-[#475569]">
        {fillCalc(tCalc(copy.stepOf, locale), { n: step, total: 4 })}
      </span>
      {kind === 'ready' ? (
        date ? (
          <span className="inline-flex items-center rounded-full border border-[#e2e8f0] bg-white px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-[#475569]">
            {fillCalc(tCalc(copy.checkedOn, locale), { d: date })}
          </span>
        ) : null
      ) : (
        <span className="inline-flex items-center rounded-full border border-[#e2e8f0] bg-white px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-[#475569]">
          {tCalc(copy.headTagFree, locale)}
        </span>
      )}
    </div>
  )
}

function ScopeBadge({ code }: { code: string }) {
  if (code === 'CWV-01') {
    return (
      <span className="font-mono text-[9px] sm:text-[10px] font-bold text-[#2563eb] bg-[#eff6ff] border border-[#bfdbfe] px-1.5 py-0.5 rounded-[4px]">
        LCP 0.8s
      </span>
    )
  }
  if (code === 'LEAD-02') {
    return (
      <span className="font-mono text-[9px] sm:text-[10px] font-bold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] px-1.5 py-0.5 rounded-[4px]">
        0 LEAKS
      </span>
    )
  }
  if (code === 'SEO-03') {
    return (
      <span className="font-mono text-[9px] sm:text-[10px] font-bold text-[#d97706] bg-[#fffbeb] border border-[#fde68a] px-1.5 py-0.5 rounded-[4px]">
        INDEX 100%
      </span>
    )
  }
  return (
    <span className="font-mono text-[9px] sm:text-[10px] font-bold text-[#7c3aed] bg-[#f5f3ff] border border-[#ddd6fe] px-1.5 py-0.5 rounded-[4px]">
      LLM READY
    </span>
  )
}

function ScopeIcon({ code }: { code: string }) {
  if (code === 'CWV-01') {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-[#eff6ff] text-[#2563eb] shadow-xs">
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </span>
    )
  }
  if (code === 'LEAD-02') {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-[#ecfdf5] text-[#059669] shadow-xs">
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v4m0 8v4m-8-8h4m8 0h4" />
        </svg>
      </span>
    )
  }
  if (code === 'SEO-03') {
    return (
      <span className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-[#fffbeb] text-[#d97706] shadow-xs">
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
        </svg>
      </span>
    )
  }
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-[6px] bg-[#f5f3ff] text-[#7c3aed] shadow-xs">
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </span>
  )
}

/** Spacious Duralux-style modern 3-pillar breakdown: light pastel accents, breathing room, strict 10px radius, fills width. */
export function CalcHeroPillars({ locale }: { locale: string }) {
  const isRu = locale === 'ru'
  const isHe = locale === 'he'

  const items = [
    {
      id: 'traffic',
      badge: isHe ? '40%- קליקים' : isRu ? '−40% кликов' : '−40% clicks',
      title: isHe ? 'בזבוז תנועה ממומנת' : isRu ? 'Слив платного трафика' : 'Wasted ad traffic',
      desc: isHe
        ? 'גולשים נוטשים כשהעמוד במובייל נטען מעל 2.5 שניות.'
        : isRu
          ? 'Клиенты уходят, если мобильная страница открывается дольше 2.5 секунд.'
          : 'Visitors bounce when mobile pages take over 2.5s to load.',
      impactLabel: isHe ? 'הפסד:' : isRu ? 'ПОТЕРИ:' : 'LOSS:',
      impactVal: isHe ? 'בזבוז תקציב' : isRu ? 'СЛИВ БЮДЖЕТА' : 'BUDGET DRAIN',
      imageSrc: '/images/calc/problem-traffic.jpg',
    },
    {
      id: 'leads',
      badge: isHe ? 'שגיאות טפסים' : isRu ? 'Сбои форм' : 'Form glitches',
      title: isHe ? 'שיבושי טפסי לידים' : isRu ? 'Срыв заявок в формах' : 'Broken lead forms',
      desc: isHe
        ? 'שגיאות ולידציה, קפצ׳ה ושיבושי מובייל חוסמים פניות מלהגיע ל-CRM.'
        : isRu
          ? 'Ошибки валидации, капчи и мобильной вёрстки срывают отправку лидов в CRM.'
          : 'Validation bugs, captchas, and mobile glitches drop leads before CRM.',
      impactLabel: isHe ? 'הפסד:' : isRu ? 'ПОТЕРИ:' : 'LOSS:',
      impactVal: isHe ? 'אובדן לידים' : isRu ? 'СОРВАННЫЕ ЛИДЫ' : 'LOST LEADS',
      imageSrc: '/images/calc/problem-leads.jpg',
    },
    {
      id: 'ai',
      badge: isHe ? '0 מתוך 8 AI' : isRu ? '0 из 8 AI' : '0 of 8 AI',
      title: isHe ? 'עיוורון AI וחיפוש' : isRu ? 'Слепая зона AI и поиска' : 'AI & search blindspots',
      desc: isHe
        ? 'האתר שקוף לתשובות ChatGPT עם פגיעה באמינות מאזהרות דפדפן.'
        : isRu
          ? 'Сайт невидим для ответов ChatGPT, а предупреждения безопасности отпугивают клиентов.'
          : 'Site is invisible to ChatGPT answers with lost trust from browser warnings.',
      impactLabel: isHe ? 'הפסד:' : isRu ? 'ПОТЕРИ:' : 'LOSS:',
      impactVal: isHe ? 'אפס תנועה מ-AI' : isRu ? 'НУЛЕВОЙ СПРОС С AI' : 'ZERO AI DEMAND',
      imageSrc: '/images/calc/problem-ai.jpg',
    },
  ]

  return (
    <div className="w-full max-w-full sm:max-w-[92%] lg:max-w-[88%] xl:max-w-[85%] mt-auto text-start select-none">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[30px] w-full items-stretch">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between overflow-hidden rounded-[10px] border border-[#cbd5e1] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all hover:border-[#94a3b8] hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]"
          >
            {/* Top Media Thumbnail - reduced by 20% */}
            <div className="relative h-[144px] sm:h-[156px] lg:h-[160px] xl:h-[180px] 2xl:h-[195px] w-full overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageSrc}
                alt={item.title}
                className="size-full object-cover object-center transition-transform duration-300 hover:scale-105"
              />
              <span className="absolute top-2 end-2 rounded-[3px] bg-[#e52421] px-2 py-0.5 font-mono text-[9px] sm:text-[9.5px] font-bold tracking-tight text-white shadow-xs">
                {item.badge}
              </span>
            </div>

            {/* Card Content & Structured Split Loss Bar */}
            <div className="flex flex-1 flex-col justify-between p-3 sm:p-3.5 xl:p-4">
              <div>
                <h4 className="m-0 text-[12px] sm:text-[12.5px] xl:text-[13px] font-bold uppercase leading-snug tracking-tight text-[#0f172a]">
                  {item.title}
                </h4>
                <p className="m-0 mt-1 text-[11px] sm:text-[11.5px] leading-snug text-[#475569]">
                  {item.desc}
                </p>
              </div>

              {/* Split bottom footer with 20px extra margin after text */}
              <div className="mt-[32px] flex items-center justify-between border-t border-[#f1f5f9] pt-2 text-[10.5px]">
                <span className="font-mono text-[9.5px] sm:text-[10px] font-bold tracking-wider text-[#64748b]">
                  {item.impactLabel}
                </span>
                <span className="rounded-[3px] bg-[#0f172a] px-2.5 py-1 font-mono text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wider text-white shadow-2xs">
                  {item.impactVal}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 5 concrete statistics values in ITSUA technical grid format across full width. */
export function CalcHeroStatsBar({ locale }: { locale: string }) {
  const isRu = locale === 'ru'
  const isHe = locale === 'he'

  const stats = [
    {
      category: isHe ? 'פרסום' : isRu ? 'РЕКЛАМА' : 'ADS BUDGET',
      val: isHe ? 'עד 35%' : isRu ? 'до 35%' : 'up to 35%',
      label: isHe ? 'מתקציב הפרסום הולך לקליקים ללא לידים' : isRu ? 'Рекламного бюджета уходит на клики без заявок' : 'Ad spend wasted on non-converting clicks',
    },
    {
      category: isHe ? 'סמארטפונים' : isRu ? 'СМАРТФОНЫ' : 'SMARTPHONES',
      val: isHe ? '>2.5 שנ׳' : isRu ? '>2.5 с' : '>2.5 s',
      label: isHe ? 'זמן טעינה שלאחריו הגולשים עוזבים את האתר' : isRu ? 'Время загрузки, после которого клиент закрывает сайт' : 'Load time after which visitors leave the site',
    },
    {
      category: isHe ? 'טסטים' : isRu ? 'ТЕСТЫ' : 'TESTS',
      val: '230+',
      label: isHe ? 'בדיקות אוטומטיות לקוד, טפסי הזמנה ו-SEO + GEO' : isRu ? 'Автоматических проверок кода, форм заказа и SEO + GEO' : 'Automated checks of code, checkout forms & SEO + GEO',
    },
    {
      category: isHe ? 'מהירות' : isRu ? 'СКОРОСТЬ' : 'SPEED',
      val: isHe ? '5 דקות' : isRu ? '5 минут' : '5 min',
      label: isHe ? 'זמן לאבחון אונליין מלא של האתר' : isRu ? 'Время полной онлайн-диагностики сайта' : 'Time for complete online site diagnostics',
    },
    {
      category: isHe ? 'בלי ספאם' : isRu ? 'БЕЗ СПАМА' : 'NO SPAM',
      val: '0',
      label: isHe ? 'שיחות מנציגים, הדוח יישלח למייל' : isRu ? 'Звонков от менеджеров, отчёт придёт на почту' : 'Calls from sales reps, report sent to your email',
    },
  ]

  return (
    <div className="w-full select-none">
      <div className="grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-[#cbd5e1] rtl:divide-x-reverse w-full">
        {stats.map((s, i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-center text-center px-2 sm:px-4 py-3 sm:py-3.5 lg:py-2.5 xl:py-3.5 2xl:py-4.5 w-full ${
              i === 4 ? 'col-span-2 lg:col-span-1' : ''
            } ${
              i % 2 === 1 && i !== 4 ? 'border-s border-[#cbd5e1] lg:border-s-0' : ''
            }`}
          >
            {/* The outer grid/border stays fixed; only the digits & labels animate in */}
            <div className="flex flex-col items-center justify-center w-full animate-hero-up">
              <span className="font-mono text-[9px] sm:text-[9.5px] xl:text-[10px] font-semibold uppercase text-[#64748b]">
                {s.category}
              </span>
              <div className="mt-0.5 sm:mt-1 text-[24px] sm:text-[28px] lg:text-[24px] xl:text-[30px] 2xl:text-[36px] font-black text-[#0f172a] leading-none">
                <bdi>{s.val}</bdi>
              </div>
              <div className="mt-1 sm:mt-1.5 font-mono text-[9px] sm:text-[9.5px] xl:text-[10px] uppercase text-[#475569] leading-snug text-balance max-w-[220px]">
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Big graphic curved arrow pointing from the hero headline to the form card, dynamically centered in the space between them. */
export function CalcHeroBigArrow() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<{ left?: string; transform?: string; width?: string }>({})

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const update = () => {
      const parent = el.offsetParent as HTMLElement | null
      if (!parent) return

      const h2 = parent.querySelector('h2')
      const form = parent.querySelector('form')
      if (!h2 || !form) return

      const parentRect = parent.getBoundingClientRect()
      const formRect = form.getBoundingClientRect()
      const isRtl = document.documentElement.dir === 'rtl'

      // Measure line 1 of headline text
      const span1 = h2.children[0] as HTMLElement | undefined
      let headlineEdge: number
      if (span1) {
        const range = document.createRange()
        range.selectNodeContents(span1)
        const line1Rect = range.getBoundingClientRect()
        headlineEdge = isRtl ? line1Rect.left : line1Rect.right
      } else {
        const h2Rect = h2.getBoundingClientRect()
        headlineEdge = isRtl ? h2Rect.left : h2Rect.right
      }

      const formEdge = isRtl ? formRect.right : formRect.left
      const rawDistance = isRtl ? (headlineEdge - formEdge) : (formEdge - headlineEdge)
      const center = (headlineEdge + formEdge) / 2
      const relCenter = center - parentRect.left

      // Dynamic responsive width: larger on wide screens (up to 260px), safely scaled on narrower spaces
      const targetW = Math.min(260, Math.max(140, Math.round(Math.max(130, rawDistance - 36) * 0.82)))

      setStyle({
        left: `${relCenter}px`,
        transform: isRtl ? 'translateX(-50%) scaleX(-1)' : 'translateX(-50%)',
        width: `${targetW}px`,
      })
    }

    update()
    window.addEventListener('resize', update)
    const ro = new ResizeObserver(update)
    if (el.offsetParent) ro.observe(el.offsetParent)

    return () => {
      window.removeEventListener('resize', update)
      ro.disconnect()
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      style={{
        left: style.left ?? '50%',
        transform: style.transform ?? 'translateX(-50%)',
        width: style.width ?? '220px',
      }}
      className="hidden lg:block absolute top-[15px] xl:top-[22px] pointer-events-none select-none z-10"
      aria-hidden="true"
    >
      <img
        src="/images/calc/hero-arrow-purple.png"
        alt=""
        width={891}
        height={316}
        className="w-full h-auto drop-shadow-[0_3px_12px_rgba(72,64,187,0.22)]"
      />
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
  compact = false,
}: {
  locale: string
  kind: 'form' | 'waiting' | 'ready'
  domain: string
  children?: React.ReactNode
  showFacts?: boolean
  compact?: boolean
}) {
  const isForm = kind === 'form'
  const l1 = tCalc(isForm ? copy.heroL1 : kind === 'waiting' ? copy.heroWaitL1 : copy.heroReadyL1, locale)
  const l3 = tCalc(isForm ? copy.heroL3 : kind === 'waiting' ? copy.heroWaitL3 : copy.heroReadyL3, locale)
  const sub = tCalc(isForm ? copy.heroSubForm : kind === 'waiting' ? copy.heroSubWait : copy.heroSubReady, locale)

  return (
    <div
      className={`flex flex-col ${
        compact
          ? 'h-full justify-between gap-4 sm:gap-6'
          : 'justify-center gap-6 lg:gap-8 py-2'
      }`}
    >
      <div className={`flex flex-col ${compact ? 'gap-2 sm:gap-2.5' : 'gap-4'}`}>
        <div className={`items-center gap-2.5 ${children || compact ? 'hidden' : 'flex'}`}>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white/90 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0f172a] shadow-xs backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#e52421] opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-[#e52421]" />
            </span>
            {tCalc(copy.heroKicker, locale)}
          </span>
          <span className="h-px w-6 bg-[#cbd5e1]" />
          <span className="font-mono text-xs uppercase tracking-wider text-[#64748b]">
            CHROMIUM LAB 2026
          </span>
        </div>

        <h2
          className={`m-0 font-bold normal-case leading-[1.03] tracking-[-0.035em] text-[#0f172a] text-balance ${
            compact
              ? 'text-[40px] leading-[1.02] sm:text-6xl lg:min-w-0 lg:max-w-none lg:text-start lg:text-[clamp(44px,calc((100cqw-clamp(320px,38cqw,470px)-32px)/9.5),92px)]'
              : children
                ? '[font-size:clamp(36px,min(5vw,7.2vh),72px)]'
                : '[font-size:clamp(44px,min(5.5vw,8.5vh),82px)]'
          }`}
        >
          <span className="block">
            {l1}{' '}
            <span className="text-[#e52421]">
              <bdi>{isForm ? tCalc(copy.heroL2, locale) : domain}</bdi>
            </span>
          </span>
          <span className="block text-[#0f172a]">{l3}</span>
        </h2>

        {/* First screen: subtitle with red accent badge */}
        {compact && isForm ? (
          <p className="m-0 mt-2 sm:mt-2.5 text-sm sm:text-base lg:text-[15px] xl:text-[16px] text-[#475569] font-normal leading-relaxed max-w-[580px] xl:max-w-none xl:whitespace-nowrap">
            {tCalc(copy.heroSubLossPrefix, locale)}
            <span className="inline-block whitespace-nowrap rounded-[2px] bg-[#e52421] px-1.5 py-0.5 text-xs sm:text-[13px] font-bold text-white tracking-normal leading-tight mx-1 align-baseline">
              {tCalc(copy.heroSubLossBadge, locale)}
            </span>
            {tCalc(copy.heroSubLossSuffix, locale)}
          </p>
        ) : !compact ? (
          <p className="m-0 font-normal leading-relaxed text-[#475569] mt-2 max-w-[520px] text-lg sm:text-xl">
            {sub}
          </p>
        ) : null}
      </div>

      {compact && isForm ? (
        <CalcHeroPillars locale={locale} />
      ) : null}

      {children}

      {showFacts && !compact ? (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-6 border-t border-[#e2e8f0]/80 mt-2">
          {copy.heroFacts.map((f, i) => (
            <div
              key={f.big}
              className="group flex items-baseline gap-2.5 transition-transform duration-200 hover:-translate-y-0.5 cursor-default"
            >
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0f172a] transition-colors group-hover:text-[#e52421]">
                <bdi>{f.big}</bdi>
              </span>
              <span className="text-xs font-mono uppercase tracking-wider text-[#64748b] transition-colors group-hover:text-[#e52421]">
                {tCalc(f.label, locale)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** One-screen stage on a single shared backing: hero text on the start side, working area on the other. */
export function CalcSplit({ locale, left, right }: { locale: string; left: React.ReactNode; right: React.ReactNode }) {
  return (
    <section className="relative flex flex-1 flex-col justify-center py-4 lg:py-8 w-full max-w-[1360px] mx-auto px-4 sm:px-6">
      <div className="grid flex-1 items-center gap-8 lg:gap-16 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="flex min-w-0 flex-col justify-center">{left}</div>
        <div className="flex min-w-0 flex-col justify-center">{right}</div>
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
            className={`flex min-w-0 flex-col gap-1 rounded-[6px] border p-2 transition-all duration-200 ${
              isCurrent
                ? 'border-[#cbd5e1] bg-white shadow-xs border-t-2 border-t-[#e52421]'
                : isPast
                  ? 'border-[#e2e8f0] bg-[#f8fafc]'
                  : 'border-[#f1f5f9] bg-[#f8fafc]/60 opacity-60'
            }`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div className="flex items-center justify-between">
              <span
                className={`flex size-4.5 items-center justify-center rounded-[4px] font-mono text-[10px] font-bold ${
                  isCurrent
                    ? 'bg-[#e52421] text-white'
                    : isPast
                      ? 'bg-[#0f172a] text-white'
                      : 'bg-[#e2e8f0] text-[#64748b]'
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
                isCurrent ? 'font-semibold text-[#0f172a]' : isPast ? 'font-medium text-[#0f172a]' : 'text-[#64748b]'
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

/** High-contrast primary action button for the calculator audit launch (Ruby Action). */
export const PRIMARY_BTN =
  'group relative flex w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-[#e52421] px-8 py-4 text-base font-semibold tracking-[0.02em] text-white shadow-[0_4px_20px_rgba(229,36,33,0.28)] transition-all duration-200 hover:bg-[#d11d1a] hover:shadow-[0_8px_28px_rgba(229,36,33,0.42)] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70'

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

/** Vertical step-by-step tracker situated right on the dividing boundary between the two columns. */
export function CalcVerticalStepper({
  locale,
  step,
  stageName,
}: {
  locale: string
  step: 1 | 2
  stageName: string
}) {
  const steps = [
    { id: 1, label: locale === 'he' ? 'אתר' : locale === 'ru' ? 'Сайт' : 'Site' },
    { id: 2, label: locale === 'he' ? 'הכנסות' : locale === 'ru' ? 'Доход' : 'Revenue' },
    { id: 3, label: locale === 'he' ? 'בדיקה' : locale === 'ru' ? 'Тест' : 'Audit' },
    { id: 4, label: locale === 'he' ? 'דוח' : locale === 'ru' ? 'Отчёт' : 'Report' },
  ]

  const activeStep = stageName === 'ready' ? 4 : stageName === 'waiting' ? 3 : step

  return (
    <div
      aria-label="Progress tracker"
      className="hidden lg:flex absolute inset-y-0 start-[58%] xl:start-[60%] 2xl:start-[62%] -translate-x-1/2 rtl:translate-x-1/2 z-30 flex-col items-center justify-center select-none pointer-events-none"
    >
      {/* Continuous vertical line spanning the full height of the screen along the boundary */}
      <div className="absolute inset-y-0 w-[2px] bg-white/60 left-1/2 -translate-x-1/2 z-0 shadow-xs" />

      {/* 4 Step Badges spaced vertically along the boundary line */}
      <div className="relative z-10 flex flex-col items-center justify-between gap-10 xl:gap-14 py-6">
        {steps.map((s) => {
          const isActive = activeStep === s.id
          const isDone = activeStep > s.id

          return (
            <div
              key={s.id}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.14)] transition-all duration-300 pointer-events-auto ${
                isActive
                  ? 'bg-white border-2 border-[#4840bb] shadow-[0_6px_24px_rgba(72,64,187,0.35)] scale-110 ring-4 ring-[#4840bb]/20'
                  : isDone
                    ? 'bg-white border border-emerald-400 text-emerald-700 shadow-sm'
                    : 'bg-white/95 border border-[#e2e8f0] text-[#94a3b8] shadow-xs'
              }`}
            >
              <span
                className={`flex size-5 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                  isActive
                    ? 'bg-[#4840bb] text-white shadow-xs'
                    : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#f1f5f9] text-[#94a3b8]'
                }`}
              >
                {isDone ? '✓' : `0${s.id}`}
              </span>
              <span
                className={`text-xs font-bold tracking-tight whitespace-nowrap ${
                  isActive
                    ? 'text-[#0f172a]'
                    : isDone
                      ? 'text-emerald-700'
                      : 'text-[#64748b]'
                }`}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CalcConsoleStepper({
  locale,
  step,
  stageName,
}: {
  locale: string
  step: 1 | 2
  stageName: string
}) {
  const steps = [
    { id: 1, label: locale === 'he' ? 'אתר' : locale === 'ru' ? 'Сайт' : 'Site' },
    { id: 2, label: locale === 'he' ? 'הכנסות' : locale === 'ru' ? 'Доход' : 'Revenue' },
    { id: 3, label: locale === 'he' ? 'בדיקה' : locale === 'ru' ? 'Тест' : 'Audit' },
    { id: 4, label: locale === 'he' ? 'דוח' : locale === 'ru' ? 'Отчёт' : 'Report' },
  ]

  const activeStep = stageName === 'ready' ? 4 : stageName === 'waiting' ? 3 : step

  return (
    <div className="w-full max-w-[470px] mx-auto mb-3.5 select-none">
      <div className="grid grid-cols-4 gap-1.5 p-1 rounded-[10px] bg-coal-500/80 border border-white/10 backdrop-blur-sm shadow-xs">
        {steps.map((s) => {
          const isActive = activeStep === s.id
          const isDone = activeStep > s.id
          return (
            <div
              key={s.id}
              className={`flex items-center justify-center gap-1.5 text-center py-2 px-1.5 rounded-[7px] transition-all duration-200 ${
                isActive
                  ? 'bg-white text-coal-900 shadow-sm font-bold'
                  : isDone
                    ? 'bg-emerald-500 text-white font-bold shadow-2xs'
                    : 'bg-transparent text-white/50 hover:text-white font-medium'
              }`}
            >
              <span className={`font-mono text-[10px] font-bold ${isActive ? 'text-coal-900' : isDone ? 'text-white' : 'text-white/50'}`}>
                {isDone ? '✓' : `0${s.id}`}
              </span>
              <span className={`text-[11.5px] sm:text-xs font-bold leading-tight truncate ${isActive ? 'text-coal-900' : 'text-white/80'}`}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Steps 1-2 of the form: clean floating white panel with audit report top red border (Mercury/Brex/Report style). */
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
  const steps = [
    { id: 1, label: locale === 'he' ? 'אתר' : locale === 'ru' ? 'Сайт' : 'Site' },
    { id: 2, label: locale === 'he' ? 'הכנסות' : locale === 'ru' ? 'Доход' : 'Revenue' },
    { id: 3, label: locale === 'he' ? 'בדיקה' : locale === 'ru' ? 'Тест' : 'Audit' },
    { id: 4, label: locale === 'he' ? 'דוח' : locale === 'ru' ? 'Отчёт' : 'Report' },
  ]

  return (
    <div className="w-full relative overflow-hidden rounded-[10px] border border-[#e2e8f0] border-t-[4px] border-t-[#4840bb] bg-white p-5 sm:p-7 lg:p-6 shadow-[0_16px_48px_-12px_rgba(72,64,187,0.18),0_4px_16px_rgba(15,23,42,0.04)] flex flex-col gap-4 sm:gap-5 lg:gap-3.5">
      {/* Step-by-Step interactive 4-segment tracker */}
      <div className="w-full pb-3 border-b border-[#f1f5f9]">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {steps.map((s) => {
            const isActive = step === s.id
            const isDone = step > s.id
            return (
              <div
                key={s.id}
                className={`flex flex-col items-center justify-center text-center py-1.5 px-1 rounded-[6px] transition-all ${
                  isActive
                    ? 'bg-[#4840bb]/10 border border-[#4840bb]/35 text-[#4840bb]'
                    : isDone
                      ? 'bg-[#10b981]/10 text-[#10b981]'
                      : 'bg-[#f8fafc] text-[#94a3b8]'
                }`}
              >
                <span className={`font-mono text-[9.5px] sm:text-[10px] font-bold ${isActive ? 'text-[#4840bb]' : isDone ? 'text-[#10b981]' : 'text-[#94a3b8]'}`}>
                  {isDone ? '✓' : `0${s.id}`}
                </span>
                <span className={`text-[11px] font-bold leading-tight ${isActive ? 'text-[#0f172a]' : isDone ? 'text-[#10b981]' : 'text-[#64748b]'}`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="m-0 flex items-stretch gap-3 before:block before:w-[2px] before:h-[0.727em] before:mt-[calc((1lh-1.21em)/2+0.242em)] before:self-start before:shrink-0 before:bg-[#e52421] text-lg sm:text-xl lg:text-2xl font-bold text-[#0f172a] tracking-tight">
          {tCalc(isStep1 ? copy.step1Heading : copy.step2Heading, locale)}
        </h3>
        <p className="m-0 mt-1 text-[11px] sm:text-xs text-[#5b6b80] leading-relaxed">
          {tCalc(isStep1 ? copy.step1Sub : copy.step2Sub, locale)}
        </p>
      </div>

      <div className="flex flex-col gap-4 pt-0.5">
        {children}
      </div>
    </div>
  )
}

/** Step 2 of the form: monthly revenue (log slider) and customers per month. Both optional. */
export function CalcNumbers({
  locale,
  revenue,
  clients,
  onRevenue,
  onClients,
  onReset,
  theme = 'light',
  disabled = false,
}: {
  locale: string
  revenue: number | null
  clients: number | null
  onRevenue: (v: number | null) => void
  onClients: (v: number | null) => void
  onReset?: () => void
  theme?: 'light' | 'dark'
  disabled?: boolean
}) {
  const isDark = theme === 'dark'
  const isRtl = locale === 'he'
  const id = useId()
  const pos = revenue == null ? 0 : revenueToSlider(revenue)
  const pct = pos / 10
  const gradientDir = isRtl ? 'to left' : 'to right'
  const hasValues = revenue != null || clients != null
  const handleReset = () => {
    if (onReset) {
      onReset()
    } else {
      onRevenue(null)
      onClients(null)
    }
  }
  const thumb =
    '[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[2.5px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#e52421] [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(229,36,33,0.45)] hover:[&::-webkit-slider-thumb]:scale-110 transition-transform [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[2.5px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#e52421]'

  return (
    <div className={`flex min-w-0 flex-col gap-3.5 sm:gap-4 lg:gap-3 xl:gap-4 transition-opacity duration-200 ${disabled ? 'opacity-35 pointer-events-none select-none' : ''}`}>
      {/* 1. Monthly Revenue Slider Block */}
      <div className="flex flex-col gap-[15px]">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={`${id}-rev`} className={`font-mono text-[11px] sm:text-xs font-bold uppercase ${isDark ? 'text-white/80' : 'text-[#475569]'}`}>
            {tCalc(copy.sliderRevenue, locale)}
          </label>
          <div className="flex items-center gap-1.5">
            {hasValues && !disabled ? (
              <div className="relative group/clear flex items-center">
                <button
                  type="button"
                  onClick={handleReset}
                  title={tCalc(copy.clearValues, locale)}
                  aria-label={tCalc(copy.clearValues, locale)}
                  className={`cursor-pointer relative flex size-4 sm:size-4.5 items-center justify-center rounded-full border transition-all duration-150 after:absolute after:-inset-2 after:content-[''] ${
                    isDark
                      ? 'border-white/20 bg-white/10 text-white/60 hover:bg-[#e52421] hover:border-[#e52421] hover:text-white'
                      : 'border-[#cbd5e1] bg-[#f8fafc] text-[#64748b] hover:bg-[#e52421] hover:border-[#e52421] hover:text-white'
                  }`}
                >
                  <svg className="size-2" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="3" y1="3" x2="7" y2="7" />
                    <line x1="7" y1="3" x2="3" y2="7" />
                  </svg>
                </button>
                {/* Floating tooltip on hover/focus */}
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full mb-1.5 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 opacity-0 group-hover/clear:opacity-100 group-focus-within/clear:opacity-100 transition-opacity duration-150 z-30"
                >
                  <div className="whitespace-nowrap rounded-[4px] bg-[#0f172a] px-2 py-0.5 text-[10px] font-mono font-medium text-white shadow-md">
                    {tCalc(copy.clearValues, locale)}
                  </div>
                  <div className="mx-auto size-0 border-x-[3px] border-x-transparent border-t-[3px] border-t-[#0f172a]" />
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-1.5 rounded-[6px] border border-[#cbd5e1] bg-[#f8fafc] px-2.5 py-0.5 font-mono text-sm sm:text-base font-black text-[#0f172a] tabular-nums whitespace-nowrap">
              <bdi>{revenue == null ? '—' : formatIls(revenue, locale)}</bdi>
            </div>
          </div>
        </div>

        <div dir={isRtl ? 'rtl' : 'ltr'} className="flex flex-col gap-1.5">
          <input
            id={`${id}-rev`}
            type="range"
            dir={isRtl ? 'rtl' : 'ltr'}
            min={0}
            max={1000}
            step={1}
            value={pos}
            disabled={disabled}
            onChange={(e) => onRevenue(sliderToRevenue(Number(e.target.value)))}
            aria-valuetext={revenue == null ? '' : formatIls(revenue, locale)}
            className={`h-[5px] w-full cursor-pointer appearance-none rounded-full ${thumb}`}
            style={{
              background: isDark
                ? `linear-gradient(${gradientDir}, ${BRAND} ${pct}%, rgba(255,255,255,0.2) ${pct}%)`
                : `linear-gradient(${gradientDir}, ${BRAND} ${pct}%, #cbd5e1 ${pct}%)`,
            }}
          />
          <div className={`flex justify-between font-mono text-[10px] sm:text-[10.5px] tabular-nums ${isDark ? 'text-white/60' : 'text-[#64748b]'}`}>
            <span>{compact(REVENUE_SLIDER.min, locale)} ₪</span>
            <span>{compact(50_000, locale)} ₪</span>
            <span>{compact(REVENUE_SLIDER.max, locale)} ₪</span>
          </div>
        </div>
      </div>

      {/* 2. Customer Presets Block */}
      <div className="flex flex-col gap-2">
        <span id={`${id}-cl`} className={`font-mono text-[11px] sm:text-xs font-bold uppercase ${isDark ? 'text-white/80' : 'text-[#475569]'}`}>
          {tCalc(copy.clientsLabel, locale)}
        </span>
        <div role="radiogroup" aria-labelledby={`${id}-cl`} className="grid grid-cols-6 gap-1.5 sm:gap-2">
          {CLIENT_PRESETS.map((v) => {
            const on = v === clients
            return (
              <button
                key={v}
                type="button"
                role="radio"
                disabled={disabled}
                aria-checked={on}
                onClick={() => onClients(on ? null : v)}
                className={`cursor-pointer rounded-[6px] border py-1 sm:py-1.5 xl:py-2 text-xs sm:text-[13px] font-mono font-bold tabular-nums text-center transition-all ${
                  isDark
                    ? on
                      ? 'border-[#e52421] bg-[#e52421] text-white'
                      : 'border-white/20 bg-white/10 text-white/80 hover:border-white/40 hover:bg-white/20'
                    : on
                      ? 'border-[#e52421] bg-[#e52421] text-white scale-[1.02]'
                      : 'border-[#cbd5e1] bg-[#f8fafc] text-[#334155] hover:border-[#94a3b8] hover:bg-white hover:text-[#0f172a]'
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

/** Audit in progress: technical ITSUA studio layout with progress bar, stages checklist and live terminal line. */
export function CalcWaiting({
  locale,
  domain,
  progress,
  theme = 'light',
}: {
  locale: string
  domain: string
  progress: CalcProgress
  theme?: 'light' | 'dark'
}) {
  const isDark = theme === 'dark'
  const stages = copy.progressStages
  const current = Math.min(stages.length - 1, Math.floor((progress.percent / 100) * stages.length))
  const remaining = progress.overdue
    ? tCalc(copy.waitingLong, locale)
    : progress.remaining > 0
      ? fillCalc(tCalc(copy.waitingRemaining, locale), { n: progress.remaining })
      : tCalc(copy.waitingShort, locale)

  const isRtl = locale === 'he'

  return (
    <div className={`flex flex-col gap-3.5 sm:gap-4.5 ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>
      {/* 1. Card Heading with red indicator and auto-wrapping / truncating domain badge */}
      <div className="flex flex-col gap-1 w-full">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 min-w-0">
          <h3 className="m-0 flex items-center gap-2 text-base sm:text-lg lg:text-[18.5px] font-bold text-[#0f172a] shrink-0">
            <span className="inline-block w-[3px] h-4 bg-[#e52421] rounded-full shrink-0" />
            <span>{tCalc(copy.step3CardHeading, locale)}</span>
          </h3>

          {domain ? (
            <span
              dir="ltr"
              title={domain}
              className="inline-flex max-w-full sm:max-w-[220px] items-center rounded-[5px] border border-[#cbd5e1] bg-[#f8fafc] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#0f172a] truncate"
            >
              <span className="truncate">{domain}</span>
            </span>
          ) : null}
        </div>
        <p className="m-0 text-xs sm:text-[12.5px] text-[#475569] leading-relaxed">
          {tCalc(copy.step3CardSub, locale)}
        </p>
      </div>

      {/* 2. Progress Numbers + Dynamic Progress Bar (identical h-[3px] to step tracker) */}
      <div className="rounded-[12px] border border-[#cbd5e1] border-s-[3.5px] border-s-[#a855f7] bg-[#f8fafc] p-3 sm:p-3.5 flex flex-col gap-2 sm:gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 min-w-0">
          <div className="flex items-baseline gap-1.5 shrink-0">
            <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              <bdi>{Math.round(progress.percent)}</bdi>
            </span>
            <span className="font-mono text-sm font-semibold text-[#64748b]">%</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs sm:text-[12.5px] text-[#64748b] min-w-0 max-w-full">
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#a855f7] opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-[#a855f7]" />
            </span>
            <span className="leading-tight truncate sm:whitespace-normal">{remaining}</span>
          </div>
        </div>

        {/* Progress Track: identical thickness to step-by-step tracker */}
        <div className="h-[3px] w-full overflow-hidden rounded-[2px] bg-[#cbd5e1] relative">
          <div
            className={`h-full rounded-[2px] transition-all duration-500 ${
              isRtl
                ? 'bg-gradient-to-l from-[#a855f7] to-[#e52421]'
                : 'bg-gradient-to-r from-[#a855f7] to-[#e52421]'
            }`}
            style={{ width: `${Math.max(4, Math.min(100, progress.percent))}%` }}
          />
        </div>
      </div>

      {/* 3. Stages Checklist (4 items) */}
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {stages.map((label, i) => {
          const done = i < current || progress.percent >= 100
          const active = i === current && !done
          return (
            <div
              key={i}
              className={`flex items-center justify-between gap-3 rounded-[8px] border px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs transition-all duration-200 ${
                active
                  ? 'border-[#a855f7] bg-[#faf5ff] text-[#0f172a] font-medium shadow-xs'
                  : done
                    ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]'
                    : 'border-[#e2e8f0] bg-white text-[#94a3b8]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`font-mono text-[11px] shrink-0 ${done ? 'text-emerald-700/60' : 'text-[#94a3b8]'}`}>
                  0{i + 1}
                </span>
                <span className="truncate">
                  {tCalc(label, locale).replace(/[:…]+$/, '')}
                </span>
              </div>

              {done ? (
                <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-700 shrink-0">
                  <span>✓</span>
                  <span>OK</span>
                </span>
              ) : active ? (
                <span className="flex items-center gap-1.5 font-mono text-[10.5px] font-bold text-[#a855f7] uppercase shrink-0">
                  <span className="size-1.5 rounded-full bg-[#a855f7] animate-pulse" />
                  <span>{locale === 'he' ? 'בבדיקה' : locale === 'ru' ? 'Тест...' : 'Scanning'}</span>
                </span>
              ) : (
                <span className="font-mono text-[11px] text-[#cbd5e1] shrink-0">
                  —
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* 4. What's in your report teaser: 3 compact horizontal blocks in 1 row */}
      <div className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc]/90 p-2.5 sm:p-3 flex flex-col gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
          <span className="size-1.5 rounded-full bg-[#a855f7]" />
          <span>{tCalc(copy.step3DeliverablesHeader, locale)}</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <div className="rounded-[7px] border border-[#cbd5e1]/70 border-s-[3px] border-s-[#e52421] bg-white px-2 py-1.5 sm:py-2 flex flex-col text-start min-w-0">
            <span className="font-bold text-[11px] sm:text-xs text-[#0f172a] leading-tight truncate">
              {tCalc(copy.step3Deliverable1Title, locale)}
            </span>
            <span className="text-[10px] text-[#64748b] leading-tight mt-0.5 truncate">
              {tCalc(copy.step3Deliverable1Sub, locale)}
            </span>
          </div>

          <div className="rounded-[7px] border border-[#cbd5e1]/70 border-s-[3px] border-s-[#e07a5f] bg-white px-2 py-1.5 sm:py-2 flex flex-col text-start min-w-0">
            <span className="font-bold text-[11px] sm:text-xs text-[#0f172a] leading-tight truncate">
              {tCalc(copy.step3Deliverable2Title, locale)}
            </span>
            <span className="text-[10px] text-[#64748b] leading-tight mt-0.5 truncate">
              {tCalc(copy.step3Deliverable2Sub, locale)}
            </span>
          </div>

          <div className="rounded-[7px] border border-[#cbd5e1]/70 border-s-[3px] border-s-emerald-500 bg-white px-2 py-1.5 sm:py-2 flex flex-col text-start min-w-0">
            <span className="font-bold text-[11px] sm:text-xs text-[#0f172a] leading-tight truncate">
              {tCalc(copy.step3Deliverable3Title, locale)}
            </span>
            <span className="text-[10px] text-[#64748b] leading-tight mt-0.5 truncate">
              {tCalc(copy.step3Deliverable3Sub, locale)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Do Not Close Tab Notice */}
      <p className="m-0 text-center font-mono text-[10.5px] sm:text-[11px] text-[#64748b] leading-tight pt-0.5">
        {tCalc(copy.step3DoNotClose, locale)}
      </p>
    </div>
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

/** Finished audit: single central column matching executive audit report 243. */
export function CalcResult({
  locale,
  domain,
  websiteUrl,
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
  websiteUrl?: string
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

  // Coherent integer loss model: every row in the report and the 5 diagnostic scales
  // sum up strictly and mathematically to the exact same total.
  const losses = useMemo(() => {
    const speed = Math.round(breakdown.speed)
    const forms = Math.round(breakdown.forms)

    // Visibility total from breakdown
    const rawVis = breakdown.visibility
    const visTotal = Math.round(rawVis)
    const gapSeo = Math.max(0, 100 - pillars.seo)
    const gapAi = Math.max(0, 100 - pillars.ai)
    const sumGap = gapSeo + gapAi || 1
    let seo = Math.round(visTotal * (gapSeo / sumGap))
    let ai = visTotal - seo
    if (seo < 0) { seo = 0; ai = visTotal }
    if (ai < 0) { ai = 0; seo = visTotal }
    const visibility = seo + ai

    // Exact integer target: 22% for preview (breakdown.total 22.6)
    let targetTotal = Math.floor(breakdown.total)
    if (breakdown.total - targetTotal >= 0.75) {
      targetTotal = Math.round(breakdown.total)
    }
    let security = targetTotal - (speed + forms + visibility)
    if (security < 0) {
      security = Math.max(0, Math.round(breakdown.security))
      targetTotal = speed + forms + visibility + security
    }

    return {
      speed,
      forms,
      seo,
      ai,
      security,
      visibility,
      total: targetTotal,
    }
  }, [breakdown, pillars])

  const percent = String(losses.total)

  const waText = !negligible
    ? fillCalc(tCalc(copy.waMessageWithLoss, locale), { percent, domain })
    : fillCalc(tCalc(copy.waMessageNoLoss, locale), { domain })
  useEffect(() => {
    onWaText(waText)
  }, [waText, onWaText])

  const targetSite = websiteUrl || (domain.startsWith('http') ? domain : `https://${domain}`)
  const pagespeedUrl = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(targetSite)}`

  const diagnosticScales = [
    { key: 'speed', label: tCalc(copy.scaleSpeed, locale), score: pillars.speed, loss: losses.speed, impact: tCalc(copy.areaImpact.speed[lightFor(pillars.speed)], locale) },
    { key: 'leads', label: tCalc(copy.scaleLeads, locale), score: pillars.leads, loss: losses.forms, impact: tCalc(copy.areaImpact.forms[lightFor(pillars.leads)], locale) },
    { key: 'seo', label: tCalc(copy.scaleSeo, locale), score: pillars.seo, loss: losses.seo, impact: tCalc(copy.areaLoss.visibility, locale) },
    { key: 'security', label: tCalc(copy.scaleSecurity, locale), score: pillars.security, loss: losses.security, impact: tCalc(copy.areaImpact.security[lightFor(pillars.security)], locale) },
    { key: 'ai', label: tCalc(copy.scaleAi, locale), score: pillars.ai, loss: losses.ai, impact: tCalc(copy.areaImpact.visibility[lightFor(pillars.ai)], locale) },
  ] as const

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
    <div className="w-full flex flex-col gap-8 sm:gap-10">
      {/* 0. Top Meta Badges Row (Light, without shadow, light gray border only) */}
      <div className="w-full flex flex-wrap items-center gap-2 sm:gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0f172a]">
          {locale === 'ru' ? 'Отчёт об аудите · Pro' : locale === 'he' ? 'דוח ביקורת · Pro' : 'Executive Audit Report · Pro'}
        </span>
        <span className="inline-flex items-center rounded-full border border-[#e2e8f0] bg-white px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-[#475569]">
          {locale === 'ru' ? 'Проверено: 230+ тестов воронки' : locale === 'he' ? 'נבדק: 230+ בדיקות משפך' : 'Verified: 230+ funnel tests'}
        </span>
        <span className="inline-flex items-center rounded-full border border-[#e2e8f0] bg-white px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-[#475569]">
          {locale === 'ru' ? `Локаль: ${locale.toUpperCase()}` : locale === 'he' ? `שפה: ${locale.toUpperCase()}` : `Locale: ${locale.toUpperCase()}`}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1 font-mono text-[11px] font-medium text-[#0f172a]">
          <svg className="size-3.5 text-[#64748b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <bdi className="font-semibold">{domain}</bdi>
        </span>
      </div>

      {/* 1. HERO SECTION: 2-COLUMN SPLIT (Left: Headline & Points, Right: 2 Cards - Conversion Loss & Overall Score) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 xl:gap-8 items-stretch my-2 sm:my-3">
        {/* Left Column: Big Headline identical to steps 1-3 */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between text-start">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-1.5 sm:mb-2">
              <span className="text-[#e52421]">§ 04</span>
              <span>—</span>
              <span>{tCalc(copy.step4Kicker, locale).replace(/^§\s*04\s*[-—]\s*/, '')}</span>
            </div>

            <h1 className="m-0 font-black uppercase leading-[1.04] sm:leading-[1.03] lg:leading-[1.02] tracking-[-0.035em] text-[#0f172a] text-[30px] sm:text-[38px] lg:text-[40px] xl:text-[48px] 2xl:text-[54px] text-start text-balance">
              <span className="block">{tCalc(copy.step4HeroL1, locale)}</span>
              <span className="block text-[#0f172a]">
                <bdi>{tCalc(copy.step4HeroL2, locale)}</bdi>
              </span>
            </h1>

            <p className="m-0 mt-3 sm:mt-3.5 lg:mt-3 text-xs sm:text-sm lg:text-[13px] xl:text-[14px] text-[#475569] leading-relaxed max-w-xl text-start">
              {tCalc(copy.step4SubPrefix, locale)}
              <span>{tCalc(copy.step4SubHighlight, locale)}</span>
            </p>
          </div>

          <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs font-mono text-[#64748b]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {tCalc(copy.step3EngineBadge, locale)}
            </span>
            <span className="hidden sm:inline text-[#cbd5e1]">/</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#e07a5f]" />
              {tCalc(copy.step3TestsBadge, locale)}
            </span>
            <span className="hidden sm:inline text-[#cbd5e1]">/</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#64748b]" />
              {tCalc(copy.step3AutoEmailBadge, locale)}
            </span>
          </div>
        </div>

        {/* Right Column: 2 Cards (Conversion Loss + Overall Funnel Health Score) */}
        <div className="lg:col-span-7 xl:col-span-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:gap-5 items-stretch h-full">
            {/* Card 1: Потери конверсии (Главный фокус аудита) */}
            <div
              className="relative isolate rounded-[16px] border border-[#e2e8f0] border-t-[4px] bg-white p-5 sm:p-6 shadow-[0_4px_24px_rgba(15,23,42,0.03)] flex flex-col justify-between"
              style={{ borderTopColor: '#e52421' }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-[#f1f5f9] pb-3 mb-3.5">
                  <div>
                    <span className="block font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#e52421]">
                      {tCalc(copy.step4CardLossKicker, locale)}
                    </span>
                    <h3 className="m-0 text-base sm:text-lg font-bold text-[#0f172a]">
                      {tCalc(copy.kpiLossTitle, locale)}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]">
                    <span className="size-1.5 rounded-full bg-[#e52421]" />
                    <span>{tCalc(copy.step4LossMetricLabel, locale)}</span>
                  </span>
                </div>

                <div className="flex flex-col">
                  <div className="text-[36px] sm:text-[44px] font-black leading-none tracking-[-0.03em] text-[#e52421]">
                    <bdi>{fillCalc(tCalc(copy.step4LossMetricVal, locale), { p: percent })}</bdi>
                  </div>
                  <p className="m-0 mt-2 text-xs text-[#64748b] leading-snug">
                    {tCalc(copy.step4LossMetricSub, locale)}
                  </p>
                </div>

                <div className="mt-3.5 flex flex-col gap-1.5 pt-3 border-t border-[#f1f5f9] text-[11px] font-mono">
                  <div className="flex justify-between items-center text-[#475569]">
                    <span className="truncate">{tCalc(copy.step4FrictionSpeed, locale)}</span>
                    <b className="text-[#e52421] shrink-0 font-bold">-{losses.speed}%</b>
                  </div>
                  <div className="flex justify-between items-center text-[#475569]">
                    <span className="truncate">{tCalc(copy.step4FrictionForms, locale)}</span>
                    <b className="text-[#e52421] shrink-0 font-bold">-{losses.forms}%</b>
                  </div>
                  <div className="flex justify-between items-center text-[#475569]">
                    <span className="truncate">{tCalc(copy.step4FrictionVisibility, locale)}</span>
                    <b className="text-[#e52421] shrink-0 font-bold">-{losses.visibility}%</b>
                  </div>
                  <div className="flex justify-between items-center text-[#475569]">
                    <span className="truncate">{tCalc(copy.step4FrictionSecurity, locale)}</span>
                    <b className="text-[#e52421] shrink-0 font-bold">-{losses.security}%</b>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
                {lostClients > 0 ? (
                  <>
                    <span className="text-[#64748b] font-mono">{tCalc(copy.step4LostClientsLabel, locale)}</span>
                    <span className="font-bold text-[#0f172a] font-mono">
                      ≈ {lostClients} {tCalc(copy.lostClients, locale).toLowerCase()}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[#64748b] font-mono">{tCalc(copy.step4PriorityLabel, locale)}</span>
                    <span className="font-bold text-[#e52421] font-mono">
                      {tCalc(copy.step4PriorityVal, locale)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Card 2: Общая оценка воронки */}
            <div
              className="relative isolate rounded-[16px] border border-[#e2e8f0] border-t-[4px] bg-white p-5 sm:p-6 shadow-[0_4px_24px_rgba(15,23,42,0.03)] flex flex-col justify-between"
              style={{ borderTopColor: LEVEL_COLOR[overallLevel] }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-[#f1f5f9] pb-3 mb-3.5">
                  <div>
                    <span className="block font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                      {tCalc(copy.step4CardHealthKicker, locale)}
                    </span>
                    <h3 className="m-0 text-base sm:text-lg font-bold text-[#0f172a]">
                      {locale === 'ru' ? 'Общая оценка воронки' : locale === 'he' ? 'ציון משפך כולל' : 'Overall Funnel Health'}
                    </h3>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                    overallLevel === 'green' ? 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]' :
                    overallLevel === 'amber' ? 'bg-[#fffbeb] text-[#92400e] border border-[#fde68a]' :
                    'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
                  }`}>
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: LEVEL_COLOR[overallLevel] }} />
                    <span>{tCalc(copy.levelLabel[overallLevel], locale)}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <div className="text-[36px] sm:text-[44px] font-bold leading-none tracking-[-0.03em] text-[#0f172a]">
                      <bdi>{overall}</bdi>
                      <span className="text-[16px] font-normal text-[#94a3b8] ms-1">/ 100</span>
                    </div>
                    <p className="m-0 mt-2 text-xs text-[#64748b] leading-snug">
                      {fillCalc(tCalc(copy.scoreNote, locale), {
                        score: overall,
                        area: tCalc(copy.areaTitle[weakest.area], locale),
                        value: Math.round(weakest.score),
                      })}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <Gauge
                      size={100}
                      fraction={overall / 100}
                      label={
                        <span className="block text-xs font-bold leading-tight">
                          {tCalc(copy.levelLabel[overallLevel], locale)}
                        </span>
                      }
                      color={LEVEL_COLOR[overallLevel]}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
                <span className="text-[#64748b] font-mono">
                  {locale === 'ru' ? 'Протокол аудита:' : locale === 'he' ? 'פרוטוקול ביקורת:' : 'Audit protocol:'}
                </span>
                <span className="font-semibold text-[#0f172a] font-mono">
                  {locale === 'ru' ? '230+ тестов' : locale === 'he' ? '230+ בדיקות' : '230+ tests'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Revenue Note if provided */}
      {hasMoney && revenue ? (
        <div className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-3.5 text-xs sm:text-sm text-[#475569] flex items-center justify-between flex-wrap gap-2">
          <span>
            {fillCalc(tCalc(copy.step4RevenueNote, locale), {
              rev: formatIls(revenue, locale),
              monthly: formatIls(result.monthly, locale),
              yearly: formatIls(result.yearly, locale),
            })}
          </span>
          {lostClients > 0 ? (
            <span className="font-medium text-[#0f172a]">
              ≈ {lostClients} {tCalc(copy.lostClients, locale).toLowerCase()}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* 2. РЕЗУЛЬТАТЫ ДИАГНОСТИКИ (Диагностические шкалы + плашки проверок в заголовке + ненавязчивый PageSpeed) */}
      <section className="relative isolate overflow-hidden rounded-[16px] border border-[#e2e8f0] bg-white p-5 sm:p-6 lg:p-7 shadow-[0_4px_24px_rgba(15,23,42,0.03)] flex flex-col gap-5">
        {/* Header row: Название + белая плашка «основные показатели» + плашка «В сумме: 22% потерь» + компактные светлые плашки */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 border-b border-[#f1f5f9] pb-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <h2 className="m-0 text-lg sm:text-xl font-bold tracking-tight text-[#0f172a]">
              {tCalc(copy.step4DiagnosticScalesTitle, locale)}
            </h2>
            <span className="inline-flex items-center rounded-md border border-[#e2e8f0] bg-white px-2.5 py-1 text-xs font-mono uppercase tracking-wider text-[#64748b]">
              {locale === 'ru' ? 'основные показатели' : locale === 'he' ? 'מדדים עיקריים' : 'key metrics'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-[#991b1b]">
              <span className="size-1.5 rounded-full bg-[#e52421]" />
              <span>{fillCalc(tCalc(copy.step4TotalLossBadge, locale), { p: losses.total })}</span>
            </span>
          </div>

          {/* Компактные светлые плашки без тени — только лёгкая серая обводка */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 font-mono text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-2.5 py-1 text-[#0f172a]">
              <b className="font-bold">174</b>
              <span className="text-[11px] uppercase tracking-wider text-[#64748b]">
                {locale === 'ru' ? 'проверок' : locale === 'he' ? 'בדיקות' : 'checks'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-2.5 py-1 text-[#0f172a]">
              <b className="font-bold">1</b>
              <span className="text-[11px] uppercase tracking-wider text-[#64748b]">
                {locale === 'ru' ? 'язык сайта' : locale === 'he' ? 'שפת אתר' : 'language'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-2.5 py-1 text-[#0f172a]">
              <b className="font-bold">10</b>
              <span className="text-[11px] uppercase tracking-wider text-[#64748b]">
                {locale === 'ru' ? 'URL воронки' : locale === 'he' ? 'כתובות' : 'funnel URLs'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-2.5 py-1 text-[#0f172a]">
              <b className="font-bold">2</b>
              <span className="text-[11px] uppercase tracking-wider text-[#64748b]">
                {locale === 'ru' ? 'Lighthouse' : locale === 'he' ? 'Lighthouse' : 'Lighthouse'}
              </span>
            </span>
          </div>
        </div>

        {/* 5 шкал: компактные карточки без пустоты, с крупными заголовками и акцентной плашкой потерь */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 xl:gap-4 items-stretch">
          {diagnosticScales.map((item) => {
            const level = lightFor(item.score)
            const borderTopColor = LEVEL_COLOR[level]
            return (
              <div
                key={item.key}
                className="rounded-[14px] border border-[#e2e8f0] border-t-[3px] bg-white p-3.5 sm:p-4 flex flex-col gap-2.5 shadow-[0_2px_10px_rgba(15,23,42,0.02)] transition-all hover:border-[#cbd5e1]"
                style={{ borderTopColor }}
              >
                <div className="flex items-start justify-between gap-2 min-h-[38px]">
                  <h3 className="m-0 flex items-start gap-1.5 text-[15px] sm:text-[16px] font-bold text-[#0f172a] leading-snug">
                    <i aria-hidden className="size-2 shrink-0 rounded-full mt-1.5" style={{ background: borderTopColor }} />
                    <span>{item.label}</span>
                  </h3>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <b className="text-[26px] sm:text-[28px] font-bold text-[#0f172a] tracking-tight leading-none">
                    <bdi>{Math.round(item.score)}</bdi>
                    <small className="text-xs font-normal text-[#94a3b8] ms-1">/ 100</small>
                  </b>
                  <span className={`${TAG} ${LEVEL_STRONG[level]} text-[10px]`}>
                    {tCalc(copy.levelLabel[level], locale)}
                  </span>
                </div>

                <Segs on={segsOn(item.score)} color={borderTopColor} />

                <div className="flex items-center justify-between text-xs font-mono py-1 px-2.5 rounded-md bg-[#fef2f2] border border-[#fee2e2]">
                  <span className="text-[#991b1b] font-medium">
                    {locale === 'ru' ? 'Потери:' : locale === 'he' ? 'איבוד:' : 'Loss:'}
                  </span>
                  <b className={`font-bold ${item.loss > 0 ? 'text-[#e52421]' : 'text-emerald-600'}`}>
                    {item.loss > 0 ? `-${item.loss}%` : '0%'}
                  </b>
                </div>

                <p className="m-0 text-[11.5px] sm:text-xs text-[#64748b] leading-snug">
                  {item.impact}
                </p>
              </div>
            )
          })}
        </div>

        {/* Небольшая серая плашка с ссылкой Google PageSpeed прямо под шкалами */}
        <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#64748b]">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[#10b981]" />
            <span>
              {locale === 'ru'
                ? 'Независимая проверка: вы можете самостоятельно протестировать показатели сайта в Google PageSpeed Insights'
                : locale === 'he'
                  ? 'אימות עצמאי: ניתן לבדוק את נתוני האתר ב-Google PageSpeed Insights'
                  : 'Independent verification: test website metrics on Google PageSpeed Insights'}
            </span>
          </div>
          <a
            href={pagespeedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-3 py-1.5 font-medium text-[#0f172a] hover:bg-[#f1f5f9] transition-colors no-underline text-xs"
          >
            <span>{locale === 'ru' ? 'Проверить в PageSpeed' : locale === 'he' ? 'בדיקה ב-PageSpeed' : 'Verify in PageSpeed'}</span>
            <span aria-hidden className="rtl:rotate-180">↗</span>
          </a>
        </div>
      </section>

      {/* 3. ТОП-3 КЛЮЧЕВЫЕ ТОЧКИ СБОЕВ ВОРОНКИ (без гигантских цифр 01, 02) */}
      {top3.length > 0 && !negligible ? (
        <section id="calc-top3" className={`${CARD} flex scroll-mt-6 flex-col gap-6`}>
          <CardHead
            title={tCalc(copy.step4Top3Title, locale)}
            sub={tCalc(copy.step4Top3Sub, locale)}
          />
          <div className="flex flex-col gap-5">
            {top3.map(({ area, level }, i) => {
              const borderAccent = i === 0 ? 'border-t-[#e52421]' : i === 1 ? 'border-t-[#e07a5f]' : 'border-t-[#c99839]'
              return (
                <article
                  key={area}
                  className={`relative isolate flex flex-col gap-4 overflow-hidden rounded-xl border border-t-[4px] border-[#e2e8f0] ${borderAccent} bg-white p-5 sm:p-7 shadow-2xs`}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-[#f1f5f9] pb-3">
                    <h3 className="m-0 flex items-stretch gap-3 before:block before:w-[2px] before:h-[0.727em] before:mt-[calc((1lh-1.21em)/2+0.242em)] before:self-start before:shrink-0 before:bg-[#e52421] text-lg sm:text-xl font-medium normal-case leading-snug tracking-tight text-[#0f172a]">
                      {tCalc(copy.areaTitle[area], locale)}
                    </h3>
                    <span className={`${TAG} ${LEVEL_STRONG[level]}`}>{tCalc(copy.levelLabel[level], locale)}</span>
                  </div>
                  <div className="flex flex-col">
                    <TopRow dot="#e52421" label={tCalc(copy.step4RowProblem, locale)}>
                      {tCalc(copy.areaImpact[area][level], locale)}
                    </TopRow>
                    <TopRow dot="#e07a5f" label={tCalc(copy.step4RowImpact, locale)}>
                      {tCalc(copy.areaLoss[area], locale)}
                    </TopRow>
                    <TopRow dot="#10b981" label={tCalc(copy.step4RowSolution, locale)} last>
                      {tCalc(copy.areaFix[area], locale)}{' '}
                      <a href="#calc-offer" className="font-semibold text-[#e52421] no-underline hover:underline ms-1">
                        {tCalc(copy.fixLink, locale)}
                      </a>
                    </TopRow>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* 6. FULL AUDIT CHECKLIST (230+ Checks) */}
      <CalcChecks locale={locale} pillars={pillars} approximate={approximate} />

      {/* 7. AUDIT PROTOCOL & METHODOLOGY */}
      <section className={`${CARD} flex flex-col gap-6`}>
        <CardHead
          title={tCalc(copy.step4AuditProtocolTitle, locale)}
          sub={tCalc(copy.step4AuditProtocolSub, locale)}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat value={domain} label={tCalc(copy.stepSite, locale)} />
          <Stat value="230+ проверок" label="Chromium Engine 2026" />
          <Stat value={`${overall} / 100`} label={tCalc(copy.protoScore, locale)} />
        </div>
        <ul className={`m-0 flex list-none flex-col gap-3 px-5 py-5 sm:px-6 ${INNER}`}>
          {copy.protoNotes.map((note) => (
            <li key={note.en} className="flex items-start gap-2.5 text-[15px] leading-snug text-[#1e1e1e]">
              <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[#64748b]" />
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

      {/* 8. ACTIONABLE FIX SPRINT */}
      <CalcSprint locale={locale} areas={top3.map((r) => r.area)} />

      {/* 9. CENTERED CTA BLOCK */}
      <CalcCta locale={locale} waHref={waHref} locked={false} showNote={true} />
    </div>
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

/** Report "action" card: emerald side stripe, price badge, white list of what is fixed. */
function CalcSprint({ locale, areas }: { locale: string; areas: CalcArea[] }) {
  return (
    <section
      id="calc-offer"
      className="grid scroll-mt-6 gap-6 rounded-[14px] border border-s-[4px] border-[#e2e8f0] border-s-[#10b981] bg-white p-6 sm:grid-cols-[1fr_auto] sm:p-8 shadow-2xs"
    >
      <div className="min-w-0">
        <h3 className="m-0 flex items-stretch gap-3 before:block before:w-[2px] before:h-[0.727em] before:mt-[calc((1lh-1.21em)/2+0.242em)] before:self-start before:shrink-0 before:bg-[#e52421] text-[20px] sm:text-[22px] font-semibold text-[#0f172a]">
          {tCalc(copy.sprintTitle, locale)}
        </h3>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Tag>{tCalc(copy.sprintBadge, locale)}</Tag>
          <span className={`${TAG} ${LEVEL_STRONG.green}`}>{tCalc(copy.offerTitle, locale)}</span>
        </div>
        <p className="m-0 mt-3.5 max-w-[640px] text-base leading-6 text-[#475569]">
          {tCalc(copy.offerBody, locale)}{' '}
          <bdi className="whitespace-nowrap text-[#0f172a]">
            <s>{copy.offerOldPrice}</s> → <strong>{copy.offerNewPrice}</strong>
          </bdi>
        </p>
        {areas.length > 0 ? (
          <div className="mt-5 rounded-lg border border-[#e2e8f0] border-t-2 border-t-[#10b981] bg-[#f8fafc] px-5 py-4">
            <p className={`m-0 mb-3 ${LABEL}`}>{tCalc(copy.sprintIncludes, locale)}</p>
            <TickList items={areas.map((a) => `${tCalc(copy.areaTitle[a], locale)}: ${tCalc(copy.areaFix[a], locale)}`)} />
          </div>
        ) : null}
      </div>
      <div className="flex h-fit min-w-[120px] flex-col items-center justify-center rounded-xl bg-[#0f172a] px-5 py-4 text-white shrink-0 self-start">
        <span className="text-[11px] uppercase tracking-wider text-white/70">{tCalc(copy.sprintBadge, locale)}</span>
        <b className="text-[32px] font-bold leading-tight tracking-tight sm:text-[38px] text-white">
          <bdi>{formatIls(SPRINT_PRICE_ILS, locale)}</bdi>
        </b>
        <span className="text-[11px] text-[#10b981] mt-0.5 font-medium">3–5 дн. спринт</span>
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
