'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  auditCalcCopy as copy,
  fillCalc,
  formatIls,
  formatPercent,
  tCalc,
  type CalcArea,
  type Localized,
} from '@/lib/auditCalcCopy'
import {
  CLIENT_PRESETS,
  LEAK_CAPS,
  LEAK_NEGLIGIBLE_BELOW,
  REVENUE_SLIDER,
  computeLeak,
  leakBreakdown,
  lightFor,
  lostClientsPerMonth,
  revenueToSlider,
  scoreLabelKey,
  sliderToRevenue,
  sprintPriceIls,
  type AuditPillars,
  type LightLevel,
  type ScoreLabelKey,
} from '@/lib/revenueLeak'
import { stageIssueText } from '@/lib/calcStageIssues'
import { hasPagespeedData, type PagespeedSnapshot } from '@/lib/pagespeedSnapshot'

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
export function CalcHeroStatsBar({ locale, dark = false }: { locale: string; dark?: boolean }) {
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
      label: isHe ? 'בדיקות קוד, טפסים ו-SEO + GEO. פירוט מלא בביקורת Pro' : isRu ? 'Проверок кода, форм и SEO + GEO. Полный разбор в аудите Pro' : 'Checks of code, forms & SEO + GEO. Full breakdown in the Pro audit',
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
      {/* Dark: thin white dividers between the numbers, as the stat tiles of the step 4 hero */}
      <div className={`grid grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))] w-full ${dark ? 'divide-white/10 max-lg:[&>*:nth-child(-n+4)]:border-b max-lg:[&>*:nth-child(odd)]:border-e lg:divide-x rtl:lg:divide-x-reverse [&>*]:border-white/10' : ''}`}>
        {stats.map((s, i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-center text-center px-2 sm:px-4 py-3 sm:py-3.5 lg:py-2 2xl:py-4 w-full ${
              i === 4 ? `col-span-2 lg:col-span-1 ${dark ? 'max-lg:!border-e-0' : ''}` : ''
            }`}
          >
            {/* No entrance fade: on mobile Safari opacity:0 + will-change often sticks and leaves empty tiles */}
            <div className="flex flex-col items-center justify-center w-full">
              <span className={`text-[10px] xl:text-[11px] font-semibold uppercase tracking-[0.04em] ${dark ? 'text-white/55' : 'text-[#64748b]'}`}>
                {s.category}
              </span>
              <div className={`mt-1 text-[24px] sm:text-[28px] lg:text-[24px] xl:text-[30px] 2xl:text-[36px] font-black leading-none tracking-[-0.02em] ${dark ? (i === 0 ? 'text-[#ff4542]' : 'text-white') : 'text-[#0f172a]'}`}>
                <bdi>{s.val}</bdi>
              </div>
              <div className={`mt-1.5 leading-snug text-balance max-w-[240px] ${dark ? 'text-xs text-white/60' : 'text-[10px] xl:text-[11px] uppercase text-[#475569]'}`}>
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
    <div className={`flex min-w-0 flex-col gap-3.5 sm:gap-4 lg:gap-3 transition-opacity duration-200 ${disabled ? 'opacity-35 pointer-events-none select-none' : ''}`}>
      {/* 1. Monthly Revenue Slider Block */}
      <div className="flex flex-col gap-[15px]">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={`${id}-rev`} className={`text-xs font-semibold uppercase tracking-[0.04em] ${isDark ? 'text-white/70' : 'text-[#475569]'}`}>
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
                  <div className="whitespace-nowrap rounded-[4px] bg-[#0f172a] px-2 py-0.5 text-[11px] font-medium text-white shadow-md">
                    {tCalc(copy.clearValues, locale)}
                  </div>
                  <div className="mx-auto size-0 border-x-[3px] border-x-transparent border-t-[3px] border-t-[#0f172a]" />
                </div>
              </div>
            ) : null}
            <div className={`flex items-center gap-1.5 rounded-[6px] border px-2.5 py-0.5 text-base font-bold tabular-nums whitespace-nowrap ${isDark ? 'border-white/20 bg-white/10 text-white' : 'border-[#cbd5e1] bg-[#f8fafc] text-[#0f172a]'}`}>
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
          <div className={`flex justify-between text-[11px] tabular-nums ${isDark ? 'text-white/55' : 'text-[#64748b]'}`}>
            <span>{compact(REVENUE_SLIDER.min, locale)} ₪</span>
            <span>{compact(50_000, locale)} ₪</span>
            <span>{compact(REVENUE_SLIDER.max, locale)} ₪</span>
          </div>
        </div>
      </div>

      {/* 2. Customer Presets Block */}
      <div className="flex flex-col gap-2 lg:gap-1.5">
        <span id={`${id}-cl`} className={`text-xs font-semibold uppercase tracking-[0.04em] ${isDark ? 'text-white/70' : 'text-[#475569]'}`}>
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
                className={`cursor-pointer rounded-[8px] border py-2 text-[13px] font-semibold tabular-nums text-center transition-all ${
                  isDark
                    ? on
                      ? 'border-[#e52421] bg-[#e52421] text-white'
                      : 'border-white/15 bg-white/[0.06] text-white/85 hover:border-white/35 hover:bg-white/15'
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

  // Dark glass by default (the calculator hero); the light variant keeps the report colours
  const ink = isDark ? 'text-white' : 'text-[#1e1e1e]'
  const muted = isDark ? 'text-white/60' : 'text-[#64748b]'
  const tile = isDark ? 'border-white/15 bg-white/[0.06]' : 'border-[#e0e0e0] bg-[#f8f8f8]'

  return (
    <div className={`flex flex-col gap-4 sm:gap-5 lg:gap-3 xl:gap-3.5 ${ink}`}>
      {/* 1. Domain chip and what is running (the step name is already in the tracker above the card) */}
      <div className="flex w-full flex-col gap-1.5">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          {domain ? (
            <span
              dir="ltr"
              title={domain}
              className={`inline-flex max-w-full items-center gap-1.5 truncate rounded-[4px] border-[0.75px] px-2 py-[3px] text-xs sm:max-w-[220px] ${isDark ? 'border-white/25 bg-white/10 text-white' : 'border-[#e0e0e0] bg-white text-[#1e1e1e]'}`}
            >
              <span className="truncate">{domain}</span>
            </span>
          ) : null}
        </div>
        <p className={`m-0 text-sm leading-[1.5] ${muted}`}>{tCalc(copy.step3CardSub, locale)}</p>
      </div>

      {/* 2. Percent done, time left and the progress bar (almost white fill, as the step tracker) */}
      <div className={`flex flex-col gap-3 rounded-[12px] border p-4 lg:gap-2 lg:p-3 ${tile}`}>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <div className="flex shrink-0 items-baseline gap-1">
            <span className={`text-[32px] font-black leading-none tracking-[-0.03em] tabular-nums ${ink}`}>
              <bdi>{Math.round(progress.percent)}</bdi>
            </span>
            <span className={`text-base font-bold ${muted}`}>%</span>
          </div>

          <div className={`flex min-w-0 max-w-full items-center gap-2 text-[13px] ${muted}`}>
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#86efac] opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-[#86efac]" />
            </span>
            <span className="truncate leading-tight sm:whitespace-normal">{remaining}</span>
          </div>
        </div>

        <div className={`relative h-1.5 w-full overflow-hidden rounded-full ${isDark ? 'bg-white/15' : 'bg-[#e0e0e0]'}`}>
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${Math.max(4, Math.min(100, progress.percent))}%`, background: isDark ? '#f1f5f9' : '#8b74c7' }}
          />
        </div>
      </div>

      {/* 3. Stages: done in mint, the running one in lilac, the rest dimmed */}
      <div className="flex flex-col gap-2 lg:gap-1.5">
        {stages.map((label, i) => {
          const done = i < current || progress.percent >= 100
          const active = i === current && !done
          return (
            <div
              key={i}
              className={`flex items-center justify-between gap-3 rounded-[10px] border px-3.5 py-2.5 text-[13px] transition-all duration-200 lg:py-1.5 ${
                active
                  ? isDark
                    ? 'border-[#c4b5fd]/50 bg-[#8b74c7]/25 font-medium text-white'
                    : 'border-[#d6cfe6] bg-[#f1edfa] font-medium text-[#3d2c66]'
                  : done
                    ? isDark
                      ? 'border-white/10 bg-white/[0.04] text-white/80'
                      : 'border-[#cfeccb] bg-[#eef9ec] text-[#1d7a12]'
                    : isDark
                      ? 'border-white/10 bg-transparent text-white/40'
                      : 'border-[#e0e0e0] bg-white text-[#94a3b8]'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                    done ? 'bg-[#86efac] text-[#14532d]' : active ? 'bg-[#8b74c7] text-white' : isDark ? 'border border-white/20 text-white/50' : 'border border-[#e0e0e0] text-[#94a3b8]'
                  }`}
                >
                  {done ? (
                    <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="truncate">{tCalc(label, locale).replace(/[:…]+$/, '')}</span>
              </div>

              {active ? (
                <span className={`flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] ${isDark ? 'text-[#c4b5fd]' : 'text-[#54408a]'}`}>
                  <span className="size-1.5 animate-pulse rounded-full bg-current" />
                  <span className="hidden sm:inline">{locale === 'he' ? 'בבדיקה' : locale === 'ru' ? 'Проверяем' : 'Scanning'}</span>
                </span>
              ) : null}
            </div>
          )
        })}
      </div>

      {/* 4. What the report will hold: three light glass tiles, each with a small mint check (no coloured edges) */}
      <div className="flex flex-col gap-2 lg:gap-1.5">
        <span className={`text-xs font-semibold uppercase tracking-[0.04em] ${muted}`}>{tCalc(copy.step3DeliverablesHeader, locale)}</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { t: copy.step3Deliverable1Title, s: copy.step3Deliverable1Sub },
            { t: copy.step3Deliverable2Title, s: copy.step3Deliverable2Sub },
            { t: copy.step3Deliverable3Title, s: copy.step3Deliverable3Sub },
          ].map((d) => (
            <div key={d.t.en} className={`flex min-w-0 items-start gap-2 rounded-[8px] border px-2.5 py-2 text-start ${isDark ? 'border-white/20 bg-white/[0.12]' : tile}`}>
              <svg className="mt-px size-3.5 shrink-0 text-[#86efac]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              <span className="flex min-w-0 flex-col">
                <span className={`text-xs font-bold leading-tight ${ink}`}>{tCalc(d.t, locale)}</span>
                <span className={`mt-0.5 text-[11px] leading-tight ${muted}`}>{tCalc(d.s, locale)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Keep-the-tab-open note */}
      <p className={`m-0 text-center text-xs leading-[1.5] ${muted}`}>{tCalc(copy.step3DoNotClose, locale)}</p>
    </div>
  )
}


function areaScores(p: AuditPillars): Record<CalcArea, number> {
  return { speed: p.speed, forms: p.leads, security: p.security, visibility: (p.seo + p.ai) / 2 }
}

type FunnelStage = {
  key: CalcArea
  short: Localized
  title: Localized
  action: Localized
  /** Already localized «where it breaks» text (may include lab numbers). */
  issue: string
  loss: number
  /** ₪ per month lost at this stage; 0 when revenue is unknown. */
  money: number
  score: number
  href?: string
}

/* Report 243 tokens: hairline borders, 4px caps badges, white action cards with #d6d6d6, red step blocks. */
const REPORT_BADGE = 'inline-flex w-fit items-center rounded-[4px] border-[0.75px] px-2 py-[3px] text-xs uppercase leading-[18px] tracking-[0.04em]'
const BADGE_TONE = {
  crit: 'border-[#fca5a5] bg-[#fff1f0] text-[#b91c1c]',
  warn: 'border-[#f8dcc0] bg-[#fff6ec] text-[#9a4a00]',
  ok: 'border-[#cfeccb] bg-[#eef9ec] text-[#1d7a12]',
  plain: 'border-[#d6d6d6] bg-white text-[#1e1e1e]',
} as const

function lossTone(loss: number): keyof typeof BADGE_TONE {
  return loss >= 10 ? 'crit' : loss > 0 ? 'warn' : 'ok'
}

/** "−₪8,600" or "−13%": a stage's loss in money when revenue is known, else in visitors. */
function stageLoss(s: FunnelStage, locale: string): string {
  if (s.money > 0) return `−${formatIls(s.money, locale)}`
  return s.loss > 0 ? `−${s.loss}%` : '0%'
}

const RING_R = 50
const RING_C = 2 * Math.PI * RING_R

/** First screen, full-bleed under the top bar: the loss in big numbers, 100 visitors as dots, top leaks, key stats. */
function LossHero({
  locale,
  domain,
  stages,
  revenue,
  monthly,
  yearly,
  lostPct,
  lostClients,
  score,
  scoreLevel,
  waHref,
}: {
  locale: string
  domain: string
  stages: FunnelStage[]
  revenue: number | null
  monthly: number
  yearly: number
  lostPct: number
  lostClients: number
  score: number
  scoreLevel: ScoreLabelKey
  waHref: string | null
}) {
  const money = monthly > 0
  const animated = useAnimatedNumber(money ? monthly : lostPct, 1400)
  const big = money ? formatIls(Math.round(animated / 10) * 10, locale) : `${Math.round(animated)}%`
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const leaking = stages.filter((s) => s.loss > 0)
  const ranked = [...stages].sort((a, b) => b.loss - a.loss)
  const top = ranked.filter((s) => s.loss > 0)
  const kept = 100 - lostPct

  // Inquiries won back if every leak is closed: the lost share measured against what reaches the form today.
  const upside = kept > 0 ? Math.round((lostPct / kept) * 100) : 0
  const scoreLevelFill: Record<ScoreLabelKey, { bg: string; text: string }> = {
    excellent: { bg: '#22bf16', text: '#ffffff' },
    green: { bg: '#22bf16', text: '#ffffff' },
    yellow: { bg: '#ff7900', text: '#ffffff' },
    red: { bg: '#e52421', text: '#ffffff' },
  }
  const badgeLoss = { bg: '#e52421', text: '#ffffff' } as const
  const badgeGain = { bg: '#22bf16', text: '#ffffff' } as const
  const badgeWarn = { bg: '#ff7900', text: '#ffffff' } as const
  /**
   * Tone drives LTR order: green → orange → red (problems last).
   * Score joins the group of its badge colour. HE mirrors via dir=rtl.
   */
  type StatTone = 'gain' | 'warn' | 'loss'
  const TONE_RANK: Record<StatTone, number> = { gain: 0, warn: 1, loss: 2 }
  const scoreTone: StatTone =
    scoreLevel === 'red' ? 'loss' : scoreLevel === 'yellow' ? 'warn' : 'gain'
  type StatTile = {
    value: string
    label: string
    red: boolean
    tone: StatTone
    badge: { bg: string; text: string; caption: string }
  }
  // Always four tiles, same stack: big value → short colour plaque → small label.
  const stats: StatTile[] = (
    [
      money
        ? {
            value: formatIls(yearly, locale),
            label: tCalc(copy.step4StatYear, locale),
            red: true,
            tone: 'loss' as StatTone,
            badge: { ...badgeLoss, caption: tCalc(copy.step4StatBadgeLoss, locale) },
          }
        : null,
      lostClients > 0
        ? {
            value: `≈ ${lostClients}`,
            label: tCalc(copy.step4StatClients, locale),
            red: true,
            tone: 'loss' as StatTone,
            badge: { ...badgeLoss, caption: tCalc(copy.step4StatBadgeLoss, locale) },
          }
        : null,
      upside > 0
        ? {
            value: `+${upside}%`,
            label: tCalc(copy.step4StatUpside, locale),
            red: false,
            tone: 'gain' as StatTone,
            badge: { ...badgeGain, caption: tCalc(copy.step4StatBadgeUpside, locale) },
          }
        : null,
      {
        value: `${score}/100`,
        label: tCalc(copy.step4StatScore, locale),
        red: scoreLevel === 'red',
        tone: scoreTone,
        badge: {
          ...scoreLevelFill[scoreLevel],
          caption: tCalc(copy.levelLabel[scoreLevel], locale),
        },
      },
      // Biggest leak: −N% on top, short «Leak» plaque, stage name below (e.g. Speed).
      top[0]
        ? {
            value: stageLoss(top[0], locale),
            label: tCalc(top[0].short, locale),
            red: true,
            tone: 'loss' as StatTone,
            badge: { ...badgeLoss, caption: tCalc(copy.step4StatBadgeLeak, locale) },
          }
        : null,
      {
        value: `${leaking.length} / ${stages.length}`,
        label: tCalc(copy.step4StatLeakStages, locale),
        red: false,
        tone: 'warn' as StatTone,
        badge: { ...badgeWarn, caption: tCalc(copy.step4StatBadgeStages, locale) },
      },
    ] as Array<StatTile | null>
  )
    .filter((s): s is StatTile => s !== null)
    .slice(0, 4)
    .sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone])

  // Floating "scroll down" hint: shown on the first screen, gone once the visitor starts scrolling.
  const [hint, setHint] = useState(true)
  useEffect(() => {
    const onScroll = () => setHint(window.scrollY < 120)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const toBreakdown = (e: React.MouseEvent) => {
    const el = document.getElementById('loss-breakdown')
    if (!el) return
    e.preventDefault()
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <section className="calc-loss-flow calc-snap-panel relative isolate ms-[calc(50%-50vw)] flex min-h-[calc(100svh-var(--calc-top,0px))] w-screen scroll-mt-[var(--calc-top,0px)] items-center overflow-clip text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="calc-lq-blob calc-loss-a" />
        <div className="calc-lq-blob calc-loss-b" />
        <div className="calc-lq-blob calc-loss-c" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#150f26]/10 via-transparent to-[#150f26]/40" />
      </div>

      <div className="mx-auto w-full max-w-[1536px] px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-14">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start lg:gap-14 xl:items-center">
          {/* Left: the loss itself */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-start">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[13px] leading-[1.5] text-white/70 lg:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-[4px] border-[0.75px] border-white/25 bg-white/10 px-2 py-[3px] text-xs text-white">
                <svg className="size-3.5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <bdi>{domain}</bdi>
              </span>
              <span>{tCalc(copy.step4MetaReport, locale)}</span>
            </div>

            <h1 className="m-0 mt-7 flex flex-col items-center gap-3 sm:mt-9 lg:items-start">
              <span className="text-[28px] font-black uppercase leading-[1.3] tracking-[0.01em] text-white sm:text-[40px] sm:leading-[1.25] lg:text-4xl lg:leading-[1.2] xl:text-[44px]">{tCalc(copy.step4HeroLabel, locale)}</span>
              {/* A percent is short, so on phones it can be much larger than a ₪ amount without hitting the edges */}
              <span className={`${money ? 'text-[56px]' : 'text-[88px]'} font-black leading-none tracking-[-0.04em] tabular-nums text-[#ff4542] [text-shadow:0_6px_40px_rgba(229,36,33,0.45)] sm:text-[96px] xl:text-[120px]`}>
                <bdi>{big}</bdi>
              </span>
              <span className="max-w-2xl text-balance text-[28px] font-black uppercase leading-[1.3] tracking-[0.01em] text-white sm:text-[40px] sm:leading-[1.25] lg:text-4xl lg:leading-[1.2] xl:text-[44px]">
                {money ? tCalc(copy.step4HeroPerMonth, locale) : tCalc(copy.step4HeroPctTail, locale)}
              </span>
            </h1>

            <p className="m-0 mt-5 max-w-xl text-balance text-base leading-[1.7] text-white/75 sm:text-lg lg:leading-[1.5]">
              {money && revenue
                ? fillCalc(tCalc(copy.step4HeroContextMoney, locale), { rev: formatIls(revenue, locale), p: lostPct, yearly: formatIls(yearly, locale) })
                : fillCalc(tCalc(copy.step4HeroContextPct, locale), { lost: lostPct })}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#e52421] px-6 py-3.5 text-sm font-semibold text-white no-underline shadow-[0_8px_28px_rgba(229,36,33,0.45)] transition hover:bg-[#d11d1a] hover:shadow-[0_10px_34px_rgba(229,36,33,0.6)] sm:text-base"
                >
                  {tCalc(copy.step4HeroCta, locale)}
                  <svg className="size-4 rtl:-scale-x-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </a>
              ) : null}
              <a
                href="#loss-breakdown"
                onClick={toBreakdown}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-sm font-semibold text-white no-underline transition hover:border-white/60 hover:bg-white/10 sm:text-base"
              >
                {tCalc(copy.step4HeroMore, locale)}
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
              </a>
            </div>
          </div>

          {/* Right: ring of who reaches an inquiry + the biggest leaks */}
          <div className="grid w-full gap-6 rounded-[16px] border border-white/15 bg-white/[0.07] p-5 backdrop-blur-md sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:p-7 lg:grid-cols-1 xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
            <div className="mx-auto w-full max-w-[15rem]">
            <p className="m-0 text-center text-xs uppercase leading-[18px] tracking-[0.04em] text-white/65">{tCalc(copy.step4RingTitle, locale)}</p>
            {/* Ring: red base = lost on the way, the light arc grows to the share that still reaches an inquiry */}
            <div className="relative mx-auto mt-4 aspect-square w-full max-w-[13rem]" role="img" aria-label={fillCalc(tCalc(copy.step4DotsAria, locale), { kept, lost: lostPct })}>
              <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r={RING_R} fill="none" stroke="#ff4542" strokeWidth="12" className="[filter:drop-shadow(0_0_6px_rgba(255,69,66,0.5))]" />
                <circle
                  cx="60"
                  cy="60"
                  r={RING_R}
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="12"
                  strokeDasharray={`${shown ? (RING_C * kept) / 100 : 0} ${RING_C}`}
                  className="transition-[stroke-dasharray] duration-[1400ms] ease-out motion-reduce:transition-none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <b className="text-[44px] font-black leading-none tracking-[-0.03em] tabular-nums text-white"><bdi>{kept}%</bdi></b>
                <span className="mt-1 max-w-[8rem] text-xs leading-[1.4] text-white/75">{tCalc(copy.step4RingCenter, locale)}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-col items-center gap-1 text-[13px] leading-[1.5]">
              <span className="inline-flex items-center gap-2 text-white"><i aria-hidden className="size-2.5 rounded-[2px] bg-[#f1f5f9]" />{tCalc(copy.step4RingLegendKept, locale)}</span>
              <span className="inline-flex items-center gap-2 text-white/75"><i aria-hidden className="size-2.5 rounded-[2px] bg-[#ff4542]" />{tCalc(copy.step4RingLegendLost, locale)}</span>
            </div>
            </div>

            {ranked.length ? (
              <div className="flex flex-col border-t border-white/15 pt-5 sm:border-s sm:border-t-0 sm:ps-6 sm:pt-0 lg:border-s-0 lg:border-t lg:ps-0 lg:pt-5 xl:border-s xl:border-t-0 xl:ps-6 xl:pt-0">
                <p className="m-0 text-xs uppercase leading-[18px] tracking-[0.04em] text-white/65">{tCalc(copy.step4LeaksByStage, locale)}</p>
                {/* Each bar is 100 visitors at that stage: white passes on, red is the shortfall */}
                <ul className="m-0 mt-4 flex list-none flex-col gap-3.5 p-0">
                  {ranked.map((s) => (
                    <li key={s.key} className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[15px] font-semibold leading-[1.5]">{tCalc(s.short, locale)}</span>
                        <b className={`text-lg font-bold tabular-nums ${s.loss > 0 ? 'text-[#ff6b68]' : 'text-white/60'}`}>
                          <bdi dir="ltr">{stageLoss(s, locale)}</bdi>
                        </b>
                      </div>
                      <div className="flex h-1.5 justify-end overflow-hidden rounded-full bg-[#f1f5f9]">
                        <div
                          className="h-full bg-[#ff4542] transition-[width] duration-700 ease-out motion-reduce:transition-none"
                          style={{ width: shown ? `${s.loss}%` : '0%' }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-white/15 pt-4">
                  <span className="whitespace-nowrap text-sm font-semibold uppercase leading-[1.5] tracking-[0.02em] text-white">{tCalc(copy.step4LeaksTotal, locale)}</span>
                  <b className="text-xl font-black tabular-nums text-[#ff4542]">
                    <bdi dir="ltr">{money ? `−${formatIls(monthly, locale)}` : `−${lostPct}%`}</bdi>
                  </b>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <dl className="m-0 mt-10 grid grid-cols-2 gap-3 lg:mt-12 lg:grid-cols-4 lg:items-stretch">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex h-full flex-col items-center justify-center rounded-[12px] border border-white/12 bg-white/[0.06] px-3 py-5 text-center backdrop-blur-sm sm:px-5 sm:py-6"
            >
              {/* Same stack on every tile: big value → colour plaque → small label */}
              <div className="flex flex-col items-center gap-1.5">
                <dd className={`m-0 text-2xl font-bold leading-none tracking-[-0.02em] tabular-nums sm:text-[34px] ${s.red ? 'text-[#ff6b68]' : 'text-white'}`}>
                  <bdi>{s.value}</bdi>
                </dd>
                <span
                  className="inline-flex items-center rounded-[4px] px-2.5 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.04em] sm:text-xs"
                  style={{ background: s.badge.bg, color: s.badge.text }}
                >
                  <bdi>{s.badge.caption}</bdi>
                </span>
                <dt className="m-0 text-[13px] leading-[1.35] text-white/70">{s.label}</dt>
              </div>
            </div>
          ))}
        </dl>
      </div>

      {/* Floating scroll hint, portalled to body so the page fade-in transform cannot pin it to the hero */}
      {shown
        ? createPortal(
            <a
              href="#loss-breakdown"
              onClick={toBreakdown}
              aria-label={tCalc(copy.step4HeroMore, locale)}
              tabIndex={hint ? 0 : -1}
              className={`fixed bottom-[4.5rem] left-1/2 z-40 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-[#e52421] text-white shadow-[0_8px_28px_rgba(229,36,33,0.5)] transition-opacity duration-300 hover:bg-[#d11d1a] ${hint ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            >
              <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-[#e52421] opacity-40 motion-reduce:hidden" />
              <svg className="relative size-6 animate-bounce motion-reduce:animate-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 6l6 6 6-6" />
                <path d="M6 12l6 6 6-6" />
              </svg>
            </a>,
            document.body,
          )
        : null}
    </section>
  )
}

/** Coral: the lighter companion of the brand red (same as the big loss number in the panel). */
const CORAL = '#ff4542'

/* Lilac from the loss panel, reused as the report's second brand colour below it. */
export const LILAC = { deep: '#3d2c66', base: '#54408a', mid: '#8b74c7', soft: '#f1edfa', wash: '#f9f7fd', ring: '#d6cfe6' } as const

/** Smooth in-page jump to an element id (instant when the visitor prefers reduced motion). */
function scrollToId(e: React.MouseEvent, id: string) {
  const el = document.getElementById(id)
  if (!el) return
  e.preventDefault()
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

/** Small caps tag next to a stage name (biggest-leak and share-of-losses). */
const STAGE_TAG = 'inline-flex items-center rounded-[3px] px-1.5 text-[10px] font-semibold uppercase leading-4 tracking-[0.04em] whitespace-nowrap'

/** Subtitle under a CardTitle, indented so it starts under the first letter (past the red bar and its gap). */
const TITLE_SUB = 'm-0 ps-[14px] text-base leading-[1.5] text-[#475569] sm:ps-[18px]'

/** Where the loss goes: stages ranked from the biggest leak with lilac share bars; red only marks the biggest leak and the total. */
function LossBreakdown({ locale, stages, monthly, total }: { locale: string; stages: FunnelStage[]; monthly: number; total: number }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])
  // Caller passes the same ordered leaking set used by StageTimeline (do not re-filter here).
  const ranked = [...stages].sort((a, b) => b.loss - a.loss)
  const share = (s: FunnelStage) => (total > 0 ? Math.round((s.loss / total) * 100) : 0)
  const money = monthly > 0
  // One tag: red "biggest leak · N% of all losses" for the first stage, lilac (like the number circles) for the rest
  const stageTag = (s: FunnelStage, biggest: boolean) => (
    <span
      className={STAGE_TAG}
      style={biggest ? { background: '#e52421', color: '#fff' } : { background: LILAC.soft, color: LILAC.base, boxShadow: `inset 0 0 0 1px ${LILAC.ring}` }}
    >
      {biggest ? `${tCalc(copy.step4BiggestLeak, locale)} · ` : null}
      {fillCalc(tCalc(copy.step4StageShareTag, locale), { s: share(s) })}
    </span>
  )

  return (
    <section
      id="loss-breakdown"
      className="relative isolate mt-2 scroll-mt-6 sm:mt-0 overflow-hidden rounded-[16px] border-[0.75px] border-[#e0e0e0] bg-[#f8f8f8] px-5 py-8 sm:px-10 sm:py-12 lg:p-[60px]"
    >
      <div className="flex flex-col gap-2">
        <CardTitle className="!text-[24px] !font-bold !leading-[1.3] !tracking-[-0.02em] sm:!text-[34px] lg:!text-[34px]">
          {tCalc(money ? copy.step4WhereTitle : copy.step4StagesHeading, locale)}
        </CardTitle>
        <p className={TITLE_SUB}>{tCalc(copy.step4WhereSub, locale)}</p>
      </div>

      {/* On desktop the rows share one grid (subgrid), so every bar starts right after the longest caption; the first track also holds the row padding */}
      <ol className="m-0 mt-8 flex list-none flex-col gap-2 p-0 lg:grid lg:grid-cols-[4rem_auto_minmax(0,1fr)_auto_auto] lg:gap-x-6">
        {ranked.map((s, i) => {
          const biggest = i === 0
          return (
            <li
              key={s.key}
              className={`grid grid-cols-[1.125rem_minmax(0,1fr)_auto_auto] items-center gap-x-2.5 gap-y-1.5 rounded-[12px] px-3.5 py-3 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto_auto] sm:gap-x-6 sm:gap-y-2.5 sm:px-5 sm:py-3.5 lg:col-span-5 lg:grid-cols-subgrid ${
                biggest
                  ? 'border border-s-[3px] border-[#e2e8f0] border-s-[#e52421] bg-white'
                  : 'border border-[#e8e8e8] bg-white'
              }`}
            >
              {/* The biggest leak is the one red accent of the list: red marker, red left border, red badge and amount */}
              <span
                className="flex size-[18px] items-center justify-center rounded-full text-[10px] font-bold tabular-nums sm:size-10 sm:text-sm"
                style={biggest ? { background: CORAL, color: '#fff' } : { background: LILAC.soft, color: LILAC.base, boxShadow: `inset 0 0 0 1px ${LILAC.ring}` }}
              >
                {i + 1}
              </span>
              {/* On a phone the title column is too narrow for the tag next to the amount: there the tag and caption
                  move to their own row under the title (the wrapper becomes display:contents) */}
              <div className="contents sm:block sm:min-w-0">
                <p className="col-start-2 row-start-1 m-0 flex min-w-0 flex-wrap items-center gap-2 text-base font-semibold leading-6 sm:leading-[1.4] text-[#1e1e1e] sm:text-[22px]">
                  {tCalc(s.short, locale)}
                  <span className="hidden sm:contents">{stageTag(s, biggest)}</span>
                </p>
                <div className="col-span-3 col-start-2 row-start-2 -mt-1 flex flex-col items-start gap-1.5 sm:mt-0.5 sm:block">
                  <span className="flex sm:hidden">{stageTag(s, biggest)}</span>
                  <p className="m-0 text-[13px] leading-[1.5] text-[#64748b] sm:text-sm lg:whitespace-nowrap">
                    {fillCalc(tCalc(copy.step4StageVisitors, locale), { p: s.loss })}
                  </p>
                </div>
              </div>
              {/* Share of all losses in lilac: it compares the stages, the red stays for the totals */}
              <div className="col-span-4 col-start-1 row-start-3 mt-1 flex items-center gap-3 sm:mt-0 sm:row-start-auto lg:col-span-1 lg:col-start-auto" aria-hidden>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: LILAC.soft }}>
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                    style={{ width: shown ? `${share(s)}%` : '0%', background: LILAC.mid }}
                  />
                </div>
              </div>
              <p className="col-start-3 row-start-1 m-0 text-end lg:col-start-auto lg:row-start-auto">
                <b
                  className={`block whitespace-nowrap text-[15px] font-bold leading-6 tracking-[-0.01em] tabular-nums sm:text-[30px] sm:leading-[1.1] sm:tracking-[-0.02em] ${biggest ? 'text-[#e52421]' : ''}`}
                  style={biggest ? undefined : { color: LILAC.deep }}
                >
                  <bdi dir="ltr">{stageLoss(s, locale)}</bdi>
                  {/* Phone: a short "/mo" on the amount line keeps the first row one line high, so the tag sits right under the title */}
                  {money ? <span className="ms-0.5 text-[11px] font-medium tracking-normal text-[#64748b] sm:hidden">{tCalc(copy.step4PerMonthShort, locale)}</span> : null}
                </b>
                {money ? <span className="hidden text-[13px] leading-[1.5] text-[#64748b] sm:inline">{tCalc(copy.step4HeroPerMonth, locale)}</span> : null}
              </p>
              {/* Jumps to the same-numbered step in "why it happens" */}
              <a
                href={`#why-${s.key}`}
                onClick={(e) => scrollToId(e, `why-${s.key}`)}
                aria-label={fillCalc(tCalc(copy.step4StageWhyLink, locale), { stage: tCalc(s.short, locale) })}
                title={fillCalc(tCalc(copy.step4StageWhyLink, locale), { stage: tCalc(s.short, locale) })}
                className={`col-start-4 row-start-1 flex size-6 items-center justify-center rounded-full border transition-colors sm:size-9 lg:col-start-auto lg:row-start-auto ${
                  biggest
                    ? 'border-[#e52421] text-[#e52421] hover:bg-[#e52421] hover:text-white'
                    : 'border-[#d6cfe6] text-[#54408a] hover:border-[#54408a] hover:bg-[#54408a] hover:text-white'
                }`}
              >
                <svg className="size-3.5 sm:size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
              </a>
            </li>
          )
        })}
      </ol>

      <div
        className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[12px] px-5 py-5 text-white sm:px-7 sm:py-6"
        style={{ background: `linear-gradient(120deg, ${LILAC.deep}, ${LILAC.base})` }}
      >
        <div className="min-w-0">
          <span className="block text-base font-bold uppercase leading-[1.4] tracking-[0.02em] sm:text-lg">{tCalc(copy.step4Total, locale)}</span>
          <span className="block text-[13px] leading-[1.5] text-white/65">{tCalc(copy.step4LeaksAcross, locale)}</span>
        </div>
        <b className="text-[28px] font-black leading-[1.1] tracking-[-0.02em] tabular-nums text-white sm:text-[38px]">
          <bdi dir="ltr">{money ? `−${formatIls(monthly, locale)}` : `−${total}%`}</bdi>
          {money ? <span className="ms-1.5 text-sm font-semibold tracking-normal text-white/70">{tCalc(copy.step4HeroPerMonth, locale)}</span> : null}
        </b>
      </div>
    </section>
  )
}

/** Stage-specific icons: what the visitor does there, and how that stage breaks. */
const STAGE_ICON_PATHS: Record<CalcArea, Record<'action' | 'issue', React.ReactNode>> = {
  visibility: {
    action: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
    issue: (<><path d="M3 3l18 18" /><path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c7 0 10 7 10 7a17 17 0 0 1-3.2 4.2" /><path d="M6.6 6.6C3.6 8.6 2 12 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>),
  },
  speed: {
    action: (<><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>),
    issue: (<><path d="M6 2h12M6 22h12" /><path d="M7 2v4a5 5 0 0 0 10 0V2M7 22v-4a5 5 0 0 1 10 0v4" /></>),
  },
  security: {
    action: (<><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></>),
    issue: (<><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="M12 8v4M12 16h.01" /></>),
  },
  forms: {
    action: (<><path d="m9 9 5 12 1.8-5.2L21 14Z" /><path d="M7.2 2.2 8 5.1M5.1 8l-2.9-.8M14 4.1 12 6M6 12l-1.9 2" /></>),
    issue: (<><circle cx="12" cy="12" r="9" /><path d="m15 9-6 6M9 9l6 6" /></>),
  },
}

function StageIcon({ kind, stage }: { kind: 'action' | 'issue'; stage: CalcArea }) {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {STAGE_ICON_PATHS[stage][kind]}
    </svg>
  )
}

/** Why it happens: the same ranked stages as the breakdown, each a card with "what the visitor does" and "where it breaks", joined by a timeline. */
function StageTimeline({ locale, stages, biggestKey, total }: { locale: string; stages: FunnelStage[]; biggestKey: CalcArea; total: number }) {
  const share = (s: FunnelStage) => (total > 0 ? Math.round((s.loss / total) * 100) : 0)
  return (
    <section className="my-2 flex flex-col gap-6 sm:my-0 sm:gap-8">
      {/* Same inner padding as the breakdown card, so this heading lines up under "where clients drop off" */}
      <div className="flex flex-col gap-2 border-x-[0.75px] border-transparent px-5 sm:px-10 lg:px-[60px]">
        <CardTitle className="!text-[24px] !font-bold !leading-[1.3] !tracking-[-0.02em] sm:!text-[34px] lg:!text-[34px]">
          {tCalc(copy.step4WhyTitle, locale)}
        </CardTitle>
        <p className={TITLE_SUB}>{tCalc(copy.step4WhySub, locale)}</p>
      </div>

      <ol className="m-0 flex list-none flex-col gap-3 p-0 sm:gap-4 md:gap-6">
        {stages.map((s, i) => {
          const last = i === stages.length - 1
          const biggest = s.key === biggestKey && s.loss > 0
          return (
            <li key={s.key} id={`why-${s.key}`} className="relative grid scroll-mt-6 grid-cols-1 md:grid-cols-[3.5rem_minmax(0,1fr)] md:gap-5">
              {/* Timeline (md+ only): connector from under this marker into the next one; below 768 the number moves into the card */}
              {!last ? (
                <span aria-hidden className="absolute bottom-[-24px] start-[27px] top-14 hidden w-0.5 md:block" style={{ background: LILAC.ring }} />
              ) : null}
              <span
                className="relative z-10 hidden size-14 items-center justify-center rounded-full text-xl font-bold tabular-nums text-white shadow-[0_0_0_5px_#eaeaea] md:flex"
                style={{ background: biggest ? CORAL : LILAC.base }}
              >
                {i + 1}
              </span>

              <article
                className={`min-w-0 rounded-[14px] border bg-white p-5 pb-6 sm:p-8 sm:pb-10 md:p-10 md:pb-14 lg:p-12 lg:pb-16 ${biggest ? 'border-[#e2e8f0] border-s-[3px] border-s-[#e52421]' : 'border-[#e8e8e8] border-s-[3px] border-s-[#8b74c7]'}`}
              >
                <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {/* Below 768 the timeline marker moves in here, as in the "where clients drop off" rows */}
                      <span
                        aria-hidden
                        className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums text-white md:hidden"
                        style={{ background: biggest ? CORAL : LILAC.base }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={STAGE_TAG + ' w-fit'}
                        style={biggest ? { background: '#e52421', color: '#fff' } : { background: LILAC.soft, color: LILAC.base, boxShadow: `inset 0 0 0 1px ${LILAC.ring}` }}
                      >
                        {biggest ? `${tCalc(copy.step4BiggestLeak, locale)} · ` : `${tCalc(s.short, locale)} · `}
                        {fillCalc(tCalc(copy.step4StageShareTag, locale), { s: share(s) })}
                      </span>
                    </div>
                    <h3 className="m-0 text-xl font-bold leading-[1.3] tracking-[-0.01em] text-[#1e1e1e] sm:text-[26px] lg:text-[28px]">{tCalc(s.title, locale)}</h3>
                  </div>
                  {/* The stage's loss sits on a small, low rectangular plate: coral for the biggest leak, lilac for the rest */}
                  <p className="m-0 flex shrink-0 flex-col items-center gap-1.5 text-center">
                    <b
                      className="inline-flex h-10 min-w-16 items-center justify-center rounded-[3px] px-3 text-lg font-extrabold leading-none tracking-[-0.02em] tabular-nums sm:h-11 sm:min-w-[4.5rem] sm:text-xl"
                      style={biggest ? { background: CORAL, color: '#fff' } : { background: LILAC.soft, color: LILAC.deep, boxShadow: `inset 0 0 0 1px ${LILAC.ring}` }}
                    >
                      <bdi dir="ltr">{stageLoss(s, locale)}</bdi>
                    </b>
                    <span className="whitespace-nowrap text-xs leading-[1.5] text-[#1e1e1e]">
                      {s.money > 0 ? tCalc(copy.step4HeroPerMonth, locale) : fillCalc(tCalc(copy.step4StageScore, locale), { score: Math.round(s.score) })}
                    </span>
                  </p>
                </header>

                {/* Cause and effect: what the visitor does → where the site breaks, joined by an arrow */}
                <div className="mt-6 grid items-stretch gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-3">
                  <div className="flex flex-col gap-3 rounded-[12px] p-5 sm:p-6" style={{ background: LILAC.wash, boxShadow: `inset 0 0 0 1px ${LILAC.soft}` }}>
                    <p className="m-0 flex items-center gap-3 text-[15px] font-bold leading-[1.3] sm:text-base" style={{ color: LILAC.deep }}>
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-[3px] text-white"
                        style={{ background: LILAC.base }}
                      >
                        <StageIcon kind="action" stage={s.key} />
                      </span>
                      {tCalc(copy.step4CardColUser, locale)}
                    </p>
                    <p className="m-0 text-base leading-[1.6] text-[#1e1e1e]">{tCalc(s.action, locale)}</p>
                  </div>

                  <span aria-hidden className="flex items-center justify-center text-[#8b74c7]">
                    {/* The arrow drifts along its own direction (the svg is rotated on md+), pointing from the action to the failure */}
                    <svg className="size-6 md:-rotate-90 md:rtl:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <g className="calc-arrow-nudge">
                        <path d="M12 5v14M6 13l6 6 6-6" />
                      </g>
                    </svg>
                  </span>

                  <div className="flex flex-col gap-3 rounded-[12px] border border-[#ececec] bg-[#fafafa] p-5 sm:p-6">
                    <p className="m-0 flex items-center gap-3 text-[15px] font-bold leading-[1.3] text-[#1e1e1e] sm:text-base">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-[3px] bg-[#ff4542] text-white">
                        <StageIcon kind="issue" stage={s.key} />
                      </span>
                      {tCalc(copy.step4CardColIssue, locale)}
                    </p>
                    <p className="m-0 text-base leading-[1.6] text-[#1e1e1e]">{s.issue}</p>
                    {s.href ? (
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[#1e1e1e] underline decoration-[#d6d6d6] underline-offset-4 transition-colors hover:text-[#e52421] hover:decoration-[#e52421]"
                      >
                        {tCalc(copy.step4PageSpeedLink, locale)}
                        <svg className="size-3.5 rtl:-scale-x-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** Finished audit: single central column matching executive audit report 243. */
export function CalcResult({
  locale,
  domain,
  websiteUrl,
  pillars,
  pagespeed,
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
  pagespeed?: PagespeedSnapshot | null
  revenue: number | null
  clients: number | null
  approximate: boolean
  reportHref: string | null
  waHref: string | null
  onWaText: (text: string) => void
}) {
  const breakdown = useMemo(() => leakBreakdown(pillars), [pillars])
  const [techOpen, setTechOpen] = useState(false)
  const techId = useId()
  const negligible = breakdown.total < LEAK_NEGLIGIBLE_BELOW
  const areas = areaScores(pillars)
  const overall = Math.round(Object.values(areas).reduce((a, b) => a + b, 0) / 4)

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

  // Sprint quote from the same integer zones the UI lists under «Что исправим»
  // (raw fractional breakdown can count a 0.3% visibility drip that rounds away on screen).
  const result = useMemo(() => {
    const base = computeLeak(breakdown, { mode: 'revenue', monthlyRevenue: revenue ?? 0 })
    const sprintPrice = sprintPriceIls({
      speed: losses.speed,
      forms: losses.forms,
      visibility: losses.visibility,
      security: losses.security,
      total: losses.total,
    })
    const paybackDays = base.monthly > 0 ? Math.max(1, Math.ceil(sprintPrice / (base.monthly / 30))) : null
    return { ...base, sprintPrice, paybackDays }
  }, [breakdown, losses, revenue])
  const hasMoney = !negligible && result.monthly > 0
  const lostClientsRaw = clients ? lostClientsPerMonth(breakdown, clients) : 0
  const lostClients = !negligible && lostClientsRaw > 0 ? lostClientsRaw : 0

  const percent = String(losses.total)

  const waText = !negligible
    ? fillCalc(tCalc(copy.waMessageWithLoss, locale), { percent, domain })
    : fillCalc(tCalc(copy.waMessageNoLoss, locale), { domain })
  useEffect(() => {
    onWaText(waText)
  }, [waText, onWaText])

  // The two full-screen panels (loss and fix) are soft snap points: when scrolling stops with a panel edge
  // within a third of the screen, the page glides so that panel fills the screen. JS rather than CSS scroll-snap,
  // which Safari and some embedded browsers apply unevenly. It only pulls a panel that is still ahead while scrolling
  // down: once its top has passed the top of the screen, or when scrolling up, the page scrolls freely.
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let timer = 0
    let glideUntil = 0
    let startY: number | null = null
    let lastY = window.scrollY
    const settle = () => {
      const dir = startY === null ? 0 : Math.sign(window.scrollY - startY)
      startY = null
      // Ignore the scroll events of our own glide
      if (Date.now() < glideUntil || dir <= 0) return
      const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--calc-top')) || 0
      const range = window.innerHeight / 3
      for (const el of document.querySelectorAll<HTMLElement>('.calc-snap-panel')) {
        const offset = el.getBoundingClientRect().top - (el.classList.contains('calc-loss-flow') ? top : 0)
        if (offset > 2 && offset < range) {
          glideUntil = Date.now() + 900
          window.scrollTo({ top: window.scrollY + offset, behavior: 'smooth' })
          return
        }
      }
    }
    const onScroll = () => {
      // Where this scroll gesture started: the position at the end of the previous one
      if (startY === null) startY = lastY
      lastY = window.scrollY
      window.clearTimeout(timer)
      timer = window.setTimeout(settle, 140)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const targetSite = websiteUrl || (domain.startsWith('http') ? domain : `https://${domain}`)
  const pagespeedUrl = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(targetSite)}`

  const overallLevel = scoreLabelKey(overall, losses.total)

  const diagnosticScales = [
    {
      key: 'speed',
      label: tCalc(copy.scaleSpeed, locale),
      score: pillars.speed,
      loss: losses.speed,
      impact: tCalc(copy.areaImpact.speed[scoreLabelKey(pillars.speed, losses.speed)], locale),
    },
    {
      key: 'leads',
      label: tCalc(copy.scaleLeads, locale),
      score: pillars.leads,
      loss: losses.forms,
      impact: tCalc(copy.areaImpact.forms[scoreLabelKey(pillars.leads, losses.forms)], locale),
    },
    {
      key: 'seo',
      label: tCalc(copy.scaleSeo, locale),
      score: pillars.seo,
      loss: losses.seo,
      impact: tCalc(copy.areaImpact.visibility[scoreLabelKey(pillars.seo, losses.seo)], locale),
    },
    {
      key: 'security',
      label: tCalc(copy.scaleSecurity, locale),
      score: pillars.security,
      loss: losses.security,
      impact: tCalc(copy.areaImpact.security[scoreLabelKey(pillars.security, losses.security)], locale),
    },
    {
      key: 'ai',
      label: tCalc(copy.scaleAi, locale),
      score: pillars.ai,
      loss: losses.ai,
      impact: tCalc(copy.areaImpact.visibility[scoreLabelKey(pillars.ai, losses.ai)], locale),
    },
  ] as const

  const stageMoney = (loss: number) => (hasMoney && losses.total > 0 ? Math.round((result.monthly * loss) / losses.total / 10) * 10 : 0)
  // Stages ranked by loss, biggest first. Breakdown + "why" share the same leaking set (loss > 0).
  const stages: FunnelStage[] = ([
    {
      key: 'visibility' as const,
      short: copy.step4StageShortSearch,
      title: copy.step4Stage1Title,
      action: copy.step4Stage1ActionDesc,
      issue: stageIssueText({
        area: 'visibility',
        locale,
        score: areas.visibility,
        loss: losses.visibility,
        seoScore: pillars.seo,
        aiScore: pillars.ai,
        pagespeed,
      }),
      loss: losses.visibility,
      money: stageMoney(losses.visibility),
      score: areas.visibility,
    },
    {
      key: 'speed' as const,
      short: copy.step4StageShortSpeed,
      title: copy.step4Stage2Title,
      action: copy.step4Stage2ActionDesc,
      issue: stageIssueText({
        area: 'speed',
        locale,
        score: pillars.speed,
        loss: losses.speed,
        pagespeed,
      }),
      loss: losses.speed,
      money: stageMoney(losses.speed),
      score: pillars.speed,
      href: pagespeedUrl,
    },
    {
      key: 'security' as const,
      short: copy.step4StageShortTrust,
      title: copy.step4Stage3Title,
      action: copy.step4Stage3ActionDesc,
      issue: stageIssueText({
        area: 'security',
        locale,
        score: pillars.security,
        loss: losses.security,
        pagespeed,
      }),
      loss: losses.security,
      money: stageMoney(losses.security),
      score: pillars.security,
    },
    {
      key: 'forms' as const,
      short: copy.step4StageShortForm,
      title: copy.step4Stage4Title,
      action: copy.step4Stage4ActionDesc,
      issue: stageIssueText({
        area: 'forms',
        locale,
        score: pillars.leads,
        loss: losses.forms,
        pagespeed,
      }),
      loss: losses.forms,
      money: stageMoney(losses.forms),
      score: pillars.leads,
    },
  ] as FunnelStage[]).sort((a, b) => b.loss - a.loss)
  const leakingOnly = stages.filter((s) => s.loss > 0)
  // Same list for "where money goes" and "why": leaking stages only (fallback to all if none).
  const leakingStages = leakingOnly.length > 0 ? leakingOnly : stages
  const biggest = leakingStages[0] ?? stages[0]

  return (
    <div className="w-full flex flex-col gap-8 sm:gap-10">
      {/* 1. The loss in numbers first: money per month (or share of clients), then year, clients, score */}
      <LossHero
        locale={locale}
        domain={domain}
        stages={stages}
        revenue={revenue}
        monthly={hasMoney ? result.monthly : 0}
        yearly={hasMoney ? result.yearly : 0}
        lostPct={losses.total}
        lostClients={lostClients}
        score={overall}
        scoreLevel={overallLevel}
        waHref={waHref}
      />

      {/* 2. Where that loss goes, stage by stage, biggest first */}
      <LossBreakdown locale={locale} stages={leakingStages} monthly={hasMoney ? result.monthly : 0} total={losses.total} />

      {/* 3. Why: the visitor's path step by step — same stages as the breakdown */}
      <StageTimeline locale={locale} stages={leakingStages} biggestKey={biggest.key} total={losses.total} />

      {/* 3. How we fix it: full-bleed sprint panel, the answer to the loss panel */}
      <FixSprintHero
        locale={locale}
        stages={leakingStages}
        lostPct={losses.total}
        sprintPrice={result.sprintPrice}
        paybackDays={hasMoney ? result.paybackDays : null}
        waHref={waHref}
      />

      {/* 4. Technical details for developers: full-bleed light lilac panel right under the sprint, collapsed by default */}
      <section className="calc-tech-flow ms-[calc(50%-50vw)] -mt-8 w-screen sm:-mt-10">
        <div className="mx-auto w-full max-w-[1536px] px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
          <button
            type="button"
            aria-expanded={techOpen}
            aria-controls={techId}
            onClick={() => setTechOpen((v) => !v)}
            className="flex w-full cursor-pointer select-none items-center justify-between gap-4 border-0 bg-transparent p-0 text-start"
          >
            <span className="flex min-w-0 items-center gap-4 sm:gap-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[3px] text-white sm:size-12" style={{ background: LILAC.base }}>
                <svg className="size-5 sm:size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
                </svg>
              </span>
              <span className="flex min-w-0 flex-col gap-1 text-start">
                <span className="text-lg font-bold leading-[1.3] tracking-[-0.01em] text-[#1e1e1e] sm:text-2xl">{tCalc(copy.step4TechSpoilerBtn, locale)}</span>
                <span className="text-sm leading-[1.5] text-[#475569] sm:text-base">{tCalc(copy.step4TechSpoilerSub, locale)}</span>
              </span>
            </span>
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-full border text-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:size-12 ${techOpen ? 'rotate-180' : ''}`}
              style={{ background: LILAC.base, borderColor: LILAC.base }}
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </span>
          </button>

          {/* Smooth open: the grid row grows from 0fr to 1fr, the content fades in; closed content stays out of the tab order */}
          <div
            id={techId}
            inert={!techOpen}
            className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${techOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          >
            <div className="min-h-0 overflow-hidden">
              <TechReport
                locale={locale}
                scales={diagnosticScales}
                pagespeed={pagespeed ?? null}
                domain={domain}
                overall={overall}
                approximate={approximate}
                reportHref={reportHref}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. CENTERED WHATSAPP CTA BLOCK */}
      <CalcCta locale={locale} waHref={waHref} locked={false} showNote={true} sprintPrice={result.sprintPrice} />
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

/** Report section (audit HTML report ".card"): light grey card, thin border, 60px padding on desktop. */
const REPORT_CARD = 'rounded-[10px] border-[0.75px] border-[#e0e0e0] bg-[#f8f8f8] px-5 py-8 sm:p-10 lg:p-[60px]'
/** Report badge: small caps in a thin bordered box (Inter, not mono: the site has one font). */
const REPORT_CHIP = 'inline-flex items-center whitespace-nowrap rounded-[4px] border px-2 py-[3px] text-[11px] font-medium uppercase leading-4 tracking-[0.04em] sm:text-xs'
/** Report status colours: green, orange, red (badges, segments, check tags). */
const REPORT_LEVEL: Record<LightLevel, { bar: string; chip: string }> = {
  green: { bar: '#22bf16', chip: 'border-[#cfeccb] bg-[#eef9ec] text-[#1d7a12]' },
  yellow: { bar: '#ff7900', chip: 'border-[#f8dcc0] bg-[#fff6ec] text-[#9a4a00]' },
  red: { bar: '#e52421', chip: 'border-[#fca5a5] bg-[#fff1f0] text-[#b91c1c]' },
}

/** Report heading: regular weight with the thin red bar before it. */
function ReportH2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="m-0 flex items-baseline text-[22px] font-normal normal-case leading-[1.4] tracking-[-0.01em] text-[#1e1e1e] sm:text-[26px] lg:text-[28px]">
      <span aria-hidden className="me-3 inline-block h-[1em] w-[2px] shrink-0 translate-y-[0.12em] self-start rounded-[2px] bg-[#e52421]" />
      <span className="min-w-0 text-balance">{children}</span>
    </h2>
  )
}

/** Four report segments filled in the status colour. */
function ReportSegs({ score, level }: { score: number; level: LightLevel }) {
  const on = segsOn(score)
  return (
    <div className="grid grid-cols-4 gap-1.5" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <i key={i} className="block h-[3px] rounded-[2px]" style={{ background: i < on ? REPORT_LEVEL[level].bar : '#e0e0e0' }} />
      ))}
    </div>
  )
}

type TechScale = { key: string; label: string; score: number; loss: number; impact: string }

/** Lighthouse score pill colours from the HTML audit report (`.p.g` / `.p.w` / `.p.b`). */
const CWV_PILL: Record<'g' | 'w' | 'b', string> = {
  g: '#22bf16',
  w: '#ff7900',
  b: '#e52421',
}

function cwvPillTone(score: number | null | undefined): 'g' | 'w' | 'b' | null {
  if (score == null || !Number.isFinite(score)) return null
  if (score >= 90) return 'g'
  if (score >= 50) return 'w'
  return 'b'
}

function CwvScorePill({ score }: { score: number | null | undefined }) {
  const tone = cwvPillTone(score)
  if (tone == null) {
    return (
      <span className="text-[15px] tabular-nums text-[#1e1e1e]">
        <bdi dir="ltr">—</bdi>
      </span>
    )
  }
  return (
    <span
      className="inline-block min-w-11 rounded-full px-2.5 py-[3px] text-center text-[13px] font-medium tabular-nums text-white"
      style={{ background: CWV_PILL[tone] }}
    >
      <bdi dir="ltr">{Math.round(score as number)}</bdi>
    </span>
  )
}

function CwvPlain({ value }: { value: string | null | undefined }) {
  return (
    <span className="text-[15px] tabular-nums text-[#1e1e1e]">
      <bdi dir="ltr">{value && value !== '' ? value : '—'}</bdi>
    </span>
  )
}

/** Same layout as the Free HTML report speed card: score pills + plain lab timings + funnel row. */
function CwvTable({ locale, pagespeed }: { locale: string; pagespeed: PagespeedSnapshot }) {
  const mobile = pagespeed.mobile
  const desktop = pagespeed.desktop
  const scoreRows: { label: string; key: 'performance' | 'accessibility' | 'bestPractices' | 'seo' }[] = [
    { label: tCalc(copy.step4CwvMetricPerf, locale), key: 'performance' },
    { label: tCalc(copy.step4CwvMetricA11y, locale), key: 'accessibility' },
    { label: tCalc(copy.step4CwvMetricBp, locale), key: 'bestPractices' },
    { label: tCalc(copy.step4CwvMetricSeo, locale), key: 'seo' },
  ]
  const timingRows: { label: string; key: 'fcp' | 'lcp' | 'cls' }[] = [
    { label: tCalc(copy.step4CwvMetricFcp, locale), key: 'fcp' },
    { label: tCalc(copy.step4CwvMetricLcp, locale), key: 'lcp' },
    { label: tCalc(copy.step4CwvMetricCls, locale), key: 'cls' },
  ]

  return (
    <section className={`${REPORT_CARD} flex flex-col`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportH2>{tCalc(copy.step4CwvTitle, locale)}</ReportH2>
        <span className={`${REPORT_CHIP} border-[#d6d6d6] bg-[#f0ebe3] text-[#1e1e1e]`}>{tCalc(copy.step4CwvTag, locale)}</span>
      </div>
      <div className="mt-[18px] overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-[15px]">
          <thead>
            <tr>
              <th
                scope="col"
                className="border-b border-[#e0e0e0] px-0 py-3.5 pe-3 text-start text-[11px] font-normal uppercase tracking-[0.04em] text-[#6b6254]"
              >
                {tCalc(copy.step4CwvColMetric, locale)}
              </th>
              <th
                scope="col"
                className="border-b border-[#e0e0e0] px-3 py-3.5 text-center text-[11px] font-normal uppercase tracking-[0.04em] text-[#6b6254]"
              >
                {tCalc(copy.step4CwvColMobile, locale)}
              </th>
              <th
                scope="col"
                className="border-b border-[#e0e0e0] px-3 py-3.5 text-center text-[11px] font-normal uppercase tracking-[0.04em] text-[#6b6254]"
              >
                {tCalc(copy.step4CwvColDesktop, locale)}
              </th>
            </tr>
          </thead>
          <tbody>
            {scoreRows.map((row) => (
              <tr key={row.key}>
                <th
                  scope="row"
                  className="border-b border-[#e0e0e0] px-0 py-3.5 pe-3 text-start text-xs font-normal uppercase tracking-[0.03em] text-[#1e1e1e]"
                >
                  {row.label}
                </th>
                <td className="border-b border-[#e0e0e0] px-3 py-3.5 text-center">
                  <CwvScorePill score={mobile?.[row.key] ?? null} />
                </td>
                <td className="border-b border-[#e0e0e0] px-3 py-3.5 text-center">
                  <CwvScorePill score={desktop?.[row.key] ?? null} />
                </td>
              </tr>
            ))}
            {timingRows.map((row) => (
              <tr key={row.key}>
                <th
                  scope="row"
                  className="border-b border-[#e0e0e0] px-0 py-3.5 pe-3 text-start text-xs font-normal uppercase tracking-[0.03em] text-[#1e1e1e]"
                >
                  {row.label}
                </th>
                <td className="border-b border-[#e0e0e0] px-3 py-3.5 text-center">
                  <CwvPlain value={mobile?.[row.key]} />
                </td>
                <td className="border-b border-[#e0e0e0] px-3 py-3.5 text-center">
                  <CwvPlain value={desktop?.[row.key]} />
                </td>
              </tr>
            ))}
            <tr>
              <th
                scope="row"
                className="px-0 py-3.5 pe-3 text-start text-xs font-normal uppercase tracking-[0.03em] text-[#1e1e1e]"
              >
                {tCalc(copy.step4CwvFunnel, locale)}
              </th>
              <td colSpan={2} className="px-3 py-3.5 text-center">
                <span
                  className="inline-block min-w-11 rounded-full px-2.5 py-[3px] text-center text-[13px] font-medium tabular-nums text-white"
                  style={{ background: CWV_PILL.g }}
                >
                  <bdi dir="ltr">{tCalc(copy.step4CwvFunnelCount, locale)}</bdi>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Expanded "technical details", laid out like the audit HTML report: scales, checklist, protocol. */
function TechReport({
  locale,
  scales,
  pagespeed,
  domain,
  overall,
  approximate,
  reportHref,
}: {
  locale: string
  scales: readonly TechScale[]
  pagespeed: PagespeedSnapshot | null
  domain: string
  overall: number
  approximate: boolean
  reportHref: string | null
}) {
  const [filter, setFilter] = useState<CheckFilter>('all')
  const shown = scales.filter((s) => filter === 'all' || lightFor(s.score) === filter)
  const filters: { key: CheckFilter; label: string }[] = [
    { key: 'all', label: tCalc(copy.filterAll, locale) },
    { key: 'green', label: tCalc(copy.levelLabel.green, locale) },
    { key: 'yellow', label: tCalc(copy.levelLabel.yellow, locale) },
    { key: 'red', label: tCalc(copy.levelLabel.red, locale) },
  ]
  const lossWord = tCalc(copy.step4TechLoss, locale)
  const protoStats = [
    { value: 'Free', label: tCalc(copy.step4TechChecks, locale), bar: REPORT_LEVEL.green.bar },
    { value: `${overall}`, label: tCalc(copy.protoScore, locale), bar: REPORT_LEVEL[lightFor(overall)].bar },
    { value: '5', label: tCalc(copy.step4TechAreas, locale), bar: REPORT_LEVEL.yellow.bar },
    { value: domain, label: tCalc(copy.step4TechSite, locale), bar: REPORT_LEVEL.red.bar },
  ]
  const showCwv = hasPagespeedData(pagespeed)

  return (
    <div className="mt-8 flex flex-col gap-4 sm:mt-10 sm:gap-5">
      {/* Scales: two columns split by thin lines, the fifth spans the row (report ".scales") */}
      <section className={`${REPORT_CARD} grid grid-cols-1 lg:grid-cols-2`}>
        <div className="col-span-full flex flex-wrap items-baseline justify-between gap-3 border-b border-[#e0e0e0] pb-6">
          <ReportH2>{tCalc(copy.step4DiagnosticScalesTitle, locale)}</ReportH2>
          <span className="text-xs uppercase tracking-[0.04em] text-[#64748b]">{tCalc(copy.step4TechScalesTag, locale)}</span>
        </div>
        {scales.map((s, i) => {
          const labelKey = scoreLabelKey(s.score, s.loss)
          const level = lightFor(s.score)
          const last = i === scales.length - 1
          const left = i % 2 === 0
          return (
            <div
              key={s.key}
              className={`flex flex-col gap-2.5 border-[#e0e0e0] py-6 ${
                last
                  ? 'pb-0 lg:col-span-2'
                  : `border-b ${left ? 'lg:border-e lg:pe-10' : 'lg:ps-10'}`
              }`}
            >
              {/* Title and status always stacked, so the score row and bars line up across both columns at every width */}
              <div className="flex flex-col items-start gap-2">
                <h3 className="m-0 text-lg font-medium leading-[1.4] text-[#1e1e1e] lg:text-xl">{s.label}</h3>
                <span className={`${REPORT_CHIP} ${REPORT_LEVEL[level].chip}`}>{tCalc(copy.levelLabel[labelKey], locale)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <b className="text-[28px] font-medium leading-none tracking-[-0.02em] text-[#1e1e1e] lg:text-[32px]">
                  <bdi dir="ltr">{Math.round(s.score)}
                  <small className="ms-1 text-sm font-normal text-[#94a3b8]">/ 100</small></bdi>
                </b>
                <span className="text-sm tabular-nums text-[#475569]">
                  {lossWord}{' '}
                  <b className="font-semibold" style={{ color: s.loss > 0 ? CORAL : '#1d7a12' }}>
                    <bdi dir="ltr">{s.loss > 0 ? `−${s.loss}%` : '0%'}</bdi>
                  </b>
                </span>
              </div>
              <ReportSegs score={s.score} level={level} />
              <p className="m-0 text-sm leading-[1.5] text-[#6b6254]">{s.impact}</p>
            </div>
          )
        })}
      </section>

      {showCwv && pagespeed ? <CwvTable locale={locale} pagespeed={pagespeed} /> : null}

      {/* Checklist: filter pills and expandable rows (report "full checklist") */}
      <section className={`${REPORT_CARD} flex flex-col gap-5`}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <ReportH2>{tCalc(copy.checkTitle, locale)}</ReportH2>
          <span className={`${REPORT_CHIP} border-[#d6d6d6] bg-white text-[#1e1e1e]`}>
            {fillCalc(tCalc(copy.checkTag, locale), { n: shown.length, total: scales.length })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2" role="group">
          {filters.map((f) => {
            const on = f.key === filter
            const tone = f.key === 'all' ? '#1e1e1e' : REPORT_LEVEL[f.key].bar
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f.key)}
                className="cursor-pointer rounded-full border px-3.5 py-2 text-xs font-medium uppercase tracking-[0.04em] transition-colors"
                style={on ? { background: tone, borderColor: tone, color: '#fff' } : { background: '#fff', borderColor: '#e0e0e0', color: '#1e1e1e' }}
              >
                {f.label}
              </button>
            )
          })}
        </div>
        <div className="flex flex-col gap-2.5">
          {shown.length === 0 ? <p className="m-0 text-base text-[#6b6254]">{tCalc(copy.noItems, locale)}</p> : null}
          {shown.map((s) => {
            const labelKey = scoreLabelKey(s.score, s.loss)
            const level = lightFor(s.score)
            return (
              <details key={s.key} className="group/row rounded-[10px] border border-[#e0e0e0] bg-white">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 [&::-webkit-details-marker]:hidden">
                  <span className={`${REPORT_CHIP} shrink-0 ${REPORT_LEVEL[level].chip}`}>{tCalc(copy.levelLabel[labelKey], locale)}</span>
                  <span className="min-w-0 flex-1 text-[15px] leading-snug text-[#1e1e1e] sm:text-base">{s.label}</span>
                  <b className="shrink-0 text-lg font-medium tabular-nums tracking-[-0.02em] text-[#1e1e1e]">
                    <bdi>{Math.round(s.score)}</bdi>
                  </b>
                  <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full border border-[#e0e0e0] text-[#1e1e1e] transition-transform group-open/row:rotate-180">
                    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3.5 6l4.5 4.5L12.5 6" />
                    </svg>
                  </span>
                </summary>
                <div className="flex flex-col gap-3 border-t border-[#e0e0e0] px-4 py-5 sm:px-6">
                  <ReportSegs score={s.score} level={level} />
                  <p className="m-0 text-[15px] leading-[1.5] text-[#6b6254]">{s.impact}</p>
                </div>
              </details>
            )
          })}
        </div>
        {approximate ? <p className="m-0 text-sm leading-[1.5] text-[#6b6254]">{tCalc(copy.scalesApprox, locale)}</p> : null}
      </section>

      {/* Protocol: stat tiles with a coloured top edge, then the method notes (report "audit protocol") */}
      <section className={`${REPORT_CARD} flex flex-col`}>
        <ReportH2>{tCalc(copy.step4AuditProtocolTitle, locale)}</ReportH2>
        <p className="m-0 mt-3 max-w-[720px] text-sm leading-[1.5] text-[#6b6254] sm:text-base">{tCalc(copy.step4AuditProtocolSub, locale)}</p>
        <dl className="m-0 mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:gap-4 lg:grid-cols-4">
          {protoStats.map((st) => (
            <div key={st.label} className="flex min-w-0 flex-col gap-1 rounded-[8px] border border-[#e0e0e0] border-t-2 bg-white px-4 py-4 sm:px-[22px] sm:py-5" style={{ borderTopColor: st.bar }}>
              <dt className="order-2 text-[11px] uppercase leading-4 tracking-[0.04em] text-[#6b6254] sm:text-xs">{st.label}</dt>
              <dd className="order-1 m-0 truncate text-[24px] font-medium leading-tight tracking-[-0.02em] text-[#1e1e1e] sm:text-[32px]">
                <bdi>{st.value}</bdi>
              </dd>
            </div>
          ))}
        </dl>
        <ul className="m-0 mt-6 flex list-none flex-col p-0 sm:mt-7">
          {copy.protoNotes.map((note) => (
            <li key={note.en} className="flex items-start gap-3 border-t border-[#e0e0e0] py-4 text-sm leading-[1.6] text-[#475569] last:pb-0 sm:text-[15px]">
              <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-[#e52421]" />
              {tCalc(note, locale)}
            </li>
          ))}
        </ul>
        {reportHref ? (
          <div className="mt-8 flex justify-center sm:mt-10">
            <a
              href={reportHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-14 w-full max-w-md cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1e1e1e] px-8 py-4 text-base font-semibold tracking-[0.01em] text-white no-underline shadow-[0_8px_24px_rgba(15,23,42,0.18)] transition-colors hover:bg-[#e52421] hover:shadow-[0_10px_28px_rgba(229,36,33,0.35)] sm:min-h-16 sm:px-10 sm:text-lg"
            >
              {tCalc(copy.openReport, locale)}
              <svg className="size-4 shrink-0 rtl:-scale-x-100 sm:size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </div>
        ) : null}
      </section>
    </div>
  )
}

/** Accent for gains on the lilac fix panel: mint, the opposite of the coral used for losses. */
const GAIN = { mint: '#86efac', soft: 'rgba(20,18,60,0.32)' } as const

/** "How we fix it": full-bleed lilac panel (blue-violet → rose-lilac) built like the loss panel — the sprint, its price, what it fixes per stage and what comes back. */
function FixSprintHero({
  locale,
  stages,
  lostPct,
  sprintPrice,
  paybackDays,
  waHref,
}: {
  locale: string
  stages: FunnelStage[]
  lostPct: number
  sprintPrice: number
  paybackDays: number | null
  waHref: string | null
}) {
  const leaking = stages.filter((s) => s.loss > 0)
  const kept = 100 - lostPct
  const upside = kept > 0 ? Math.round((lostPct / kept) * 100) : 0
  // What closing a stage brings back: money per month when revenue is known, else the share of visitors
  const backValue = (s: FunnelStage) => (s.money > 0 ? formatIls(s.money, locale) : `${s.loss}%`)
  const backTail = (s: FunnelStage) => tCalc(s.money > 0 ? copy.step4HeroPerMonth : copy.step4FixBackPctTail, locale)

  // Always four plaques: days + calculated price, then upside / payback / issue count / checks.
  // Timeline, price and payback are estimates until agreed with the client: they carry an asterisk (see the footnote)
  type FixTile = { value: string; label: string; gain: boolean; estimate: boolean }
  const issueCount = Math.max(1, leaking.length)
  const tiles: FixTile[] = [
    { value: tCalc(copy.step4FixTitleDays, locale), label: tCalc(copy.step4FixTileDays, locale), gain: false, estimate: true },
    { value: formatIls(sprintPrice, locale), label: tCalc(copy.step4FixPriceLabel, locale), gain: false, estimate: true },
    upside > 0 ? { value: `+${upside}%`, label: tCalc(copy.step4StatUpside, locale), gain: true, estimate: false } : null,
    paybackDays
      ? { value: fillCalc(tCalc(copy.step4FixPaybackValue, locale), { n: paybackDays }), label: tCalc(copy.step4FixTilePayback, locale), gain: true, estimate: true }
      : null,
    { value: '230+', label: tCalc(copy.step4FixTileChecks, locale), gain: false, estimate: false },
    { value: String(issueCount), label: tCalc(copy.step4FixTileIssues, locale), gain: false, estimate: false },
  ]
    .filter((t): t is FixTile => t !== null)
    .slice(0, 4)
  const tileCols = 'lg:grid-cols-4'
  const star = <span aria-hidden className="ms-0.5 align-super text-[0.5em] font-bold opacity-75">*</span>

  return (
    <section id="calc-offer" className="calc-fix-flow calc-snap-panel relative isolate ms-[calc(50%-50vw)] flex min-h-svh w-screen items-center overflow-clip text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="calc-lq-blob calc-fix-a" />
        <div className="calc-lq-blob calc-fix-b" />
        <div className="calc-lq-blob calc-fix-c" />
      </div>

      <div className="mx-auto w-full max-w-[1536px] px-4 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
          {/* Left: the promise, the bonus, the action */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-start">
            <span className="inline-flex items-center gap-2 rounded-[4px] border-[0.75px] border-white/25 bg-white/10 px-2 py-[3px] text-xs uppercase leading-[18px] tracking-[0.04em] text-white">
              <i aria-hidden className="size-1.5 rounded-full" style={{ background: GAIN.mint }} />
              {tCalc(copy.step4FixKicker, locale)}
            </span>

            <h2 className="m-0 mt-6 flex flex-col items-center gap-2 sm:mt-8 sm:gap-3 lg:items-start">
              <span className="text-[28px] font-black uppercase leading-[1.2] tracking-[0.01em] text-white sm:text-[40px] lg:text-4xl xl:text-[44px]">
                {tCalc(copy.step4FixTitlePre, locale)}
              </span>
              <span className="text-[64px] font-black leading-none tracking-[-0.04em] sm:text-[96px] xl:text-[112px]" style={{ color: GAIN.mint, textShadow: '0 6px 40px rgba(134,239,172,0.3)' }}>
                <bdi>{tCalc(copy.step4FixTitleDays, locale)}</bdi>
                {star}
              </span>
            </h2>

            <p className="m-0 mt-5 max-w-xl text-balance text-base leading-[1.7] text-white/80 sm:text-lg lg:leading-[1.5]">{tCalc(copy.step4FixSub, locale)}</p>

            {/* The Pro audit comes free with the sprint: the bonus is the accent of this column */}
            <div
              className="mt-7 flex w-full max-w-xl items-center gap-4 rounded-[14px] border p-4 text-start sm:p-5"
              style={{ borderColor: 'rgba(134,239,172,0.45)', background: 'linear-gradient(120deg, rgba(134,239,172,0.18), rgba(134,239,172,0.06))' }}
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-[3px] text-[#14532d]" style={{ background: GAIN.mint }}>
                <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <span className="inline-flex rounded-[3px] px-1.5 text-[10px] font-bold uppercase leading-4 tracking-[0.06em] text-[#14532d]" style={{ background: GAIN.mint }}>
                  {tCalc(copy.step4FixBonusTag, locale)}
                </span>
                <p className="m-0 mt-1.5 text-lg font-bold leading-[1.3] text-white sm:text-xl">{tCalc(copy.step4FixBonusTitle, locale)}</p>
                <p className="m-0 mt-0.5 text-sm leading-[1.5] text-white/75">{tCalc(copy.step4FixBonusBody, locale)}</p>
              </div>
              <p className="m-0 shrink-0 text-end leading-none">
                <s className="block text-base text-white/55 sm:text-lg"><bdi>{copy.offerOldPrice}</bdi></s>
                <b className="mt-1.5 block text-[40px] font-black sm:text-[48px] tracking-[-0.02em]" style={{ color: GAIN.mint }}><bdi><span className="me-0.5 align-[0.35em] text-[0.5em] font-bold">₪</span>{copy.offerNewPrice.replace('₪', '')}</bdi></b>
              </p>
            </div>

            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#e52421] px-7 py-4 text-sm font-semibold text-white no-underline shadow-[0_8px_28px_rgba(0,0,0,0.25)] transition hover:bg-[#d11d1a] sm:text-base"
              >
                {tCalc(copy.step4FixCta, locale)}
                <svg className="size-4 rtl:-scale-x-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
            ) : null}
          </div>

          {/* Right: what the sprint fixes, in the same order as the losses above, then the estimated total */}
          <div className="w-full rounded-[16px] border border-white/15 bg-white/[0.08] p-5 backdrop-blur-md sm:p-7">
            <p className="m-0 text-xs uppercase leading-[18px] tracking-[0.04em] text-white/70">{tCalc(copy.step4FixListTitle, locale)}</p>
            <ol className="m-0 mt-4 flex list-none flex-col p-0">
              {leaking.map((s, i) => (
                <li key={s.key} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 border-t border-white/10 py-4 first:border-t-0 first:pt-1">
                  <span
                    className="flex size-9 items-center justify-center rounded-full text-sm font-bold tabular-nums text-white"
                    style={{ background: i === 0 ? CORAL : 'rgba(255,255,255,0.18)' }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <span className="text-[17px] font-bold leading-[1.4] text-white">{tCalc(s.short, locale)}</span>
                      <span className="inline-flex items-center gap-1 rounded-[3px] px-1.5 text-xs font-semibold leading-5 tabular-nums" style={{ background: GAIN.soft, color: GAIN.mint }}>
                        <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                        <bdi dir="ltr">+{backValue(s)}</bdi> {backTail(s)}
                      </span>
                    </div>
                    <p className="m-0 mt-1 flex items-start gap-2 text-[15px] leading-[1.55] text-white/80">
                      <svg className="mt-[3px] size-4 shrink-0" style={{ color: GAIN.mint }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                      {tCalc(copy.areaFix[s.key], locale)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-1 grid grid-cols-1 gap-4 border-t border-white/20 pt-5 sm:grid-cols-2 sm:items-end sm:gap-6">
              <div className="flex flex-col gap-1.5">
                <span className="min-h-4 text-xs font-semibold uppercase leading-4 tracking-[0.04em] text-white/70">{tCalc(copy.step4FixTotal, locale)}</span>
                <b className="text-[32px] font-black leading-none tracking-[-0.03em] tabular-nums text-white sm:text-[40px]">
                  <bdi>{formatIls(sprintPrice, locale)}</bdi>
                  {star}
                </b>
              </div>
              <div className="flex flex-col gap-1.5 sm:items-end sm:text-end">
                <span className="min-h-4 text-xs font-semibold uppercase leading-4 tracking-[0.04em] text-white/70">{tCalc(copy.step4FixTotalTerm, locale)}</span>
                <b className="text-[32px] font-black leading-none tracking-[-0.03em] tabular-nums sm:text-[40px]" style={{ color: GAIN.mint }}>
                  <bdi>{tCalc(copy.step4FixTitleDays, locale)}</bdi>
                  {star}
                </b>
              </div>
            </div>
            <p className="m-0 mt-2 text-[13px] leading-[1.5] text-white/65">{tCalc(copy.step4FixEstimateNote, locale)}</p>
          </div>
        </div>

        <dl className={`m-0 mt-10 grid grid-cols-2 items-stretch gap-3 lg:mt-14 ${tileCols}`}>
          {tiles.map((t) => (
            <div
              key={t.label}
              className="flex h-full flex-col items-center justify-center rounded-[12px] border border-white/12 bg-white/[0.07] px-3 py-5 text-center backdrop-blur-sm sm:px-5 sm:py-6"
            >
              <div className="flex flex-col items-center gap-1.5">
                <dd
                  className="m-0 text-2xl font-bold leading-none tracking-[-0.02em] tabular-nums sm:text-[34px]"
                  style={{ color: t.gain ? GAIN.mint : '#fff' }}
                >
                  <bdi>{t.value}</bdi>
                  {t.estimate ? star : null}
                </dd>
                <dt className="m-0 text-[13px] leading-[1.35] text-white/75">{t.label}</dt>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export function CalcCta({
  locale,
  waHref,
  locked,
  showNote,
  sprintPrice,
}: {
  locale: string
  waHref: string | null
  locked: boolean
  showNote: boolean
  sprintPrice: number
}) {
  return (
    <>
      <section className="relative isolate flex flex-col items-center gap-4 px-[22px] py-12 text-center sm:gap-6 sm:px-8 sm:py-20 lg:px-[60px] lg:py-28">
        {/* The red line sets the width: the first line is taken out of sizing (zero width, centred overflow),
            so the plate and the text under it are exactly as wide as "get inquiries back" */}
        <div className="flex w-fit max-w-full flex-col items-stretch gap-4 sm:gap-6">
          <h2 className="m-0 font-semibold normal-case leading-[0.98] tracking-[-0.045em] text-[#1e1e1e] [font-size:clamp(36px,7.2vw,96px)]">
            <span className="flex w-0 min-w-full justify-center whitespace-nowrap">{tCalc(copy.ctaL1, locale)}</span>
            <span className="block whitespace-nowrap text-[#e52421]">{tCalc(copy.ctaL2, locale)}</span>
          </h2>
          {/* Fix total on the blue of the "we close the leaks" sprint panel, the amount in white with the shekel sign first */}
          <div className="calc-fix-flow relative isolate flex w-0 min-w-full flex-col items-center gap-1.5 overflow-hidden rounded-[14px] px-6 py-5 text-white sm:py-7">
            <div className="grid w-full grid-cols-1 items-end gap-4 sm:grid-cols-2 sm:gap-8">
              <div className="flex flex-col items-center gap-1.5">
                <span className="min-h-4 text-xs font-semibold uppercase leading-4 tracking-[0.04em] text-white/70">{tCalc(copy.step4FixTotal, locale)}</span>
                <b className="text-[40px] font-black leading-none tracking-[-0.03em] tabular-nums text-white sm:text-[52px]">
                  <bdi dir="ltr">
                    <span className="me-1 align-[0.3em] text-[0.55em] font-bold">₪</span>
                    {formatIls(sprintPrice, locale).replace('₪', '').trim()}
                  </bdi>
                  <span aria-hidden className="ms-0.5 align-super text-[0.45em] font-bold text-white/60">*</span>
                </b>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="min-h-4 text-xs font-semibold uppercase leading-4 tracking-[0.04em] text-white/70">{tCalc(copy.step4FixTotalTerm, locale)}</span>
                <b className="text-[40px] font-black leading-none tracking-[-0.03em] tabular-nums sm:text-[52px]" style={{ color: GAIN.mint }}>
                  <bdi>{tCalc(copy.step4FixTitleDays, locale)}</bdi>
                  <span aria-hidden className="ms-0.5 align-super text-[0.45em] font-bold text-white/60">*</span>
                </b>
              </div>
            </div>
            {/* The Pro audit comes free with the fix: old price struck through, ₪0 in mint, as on the sprint bonus */}
            {/* One run of inline text, so the price stays on the line with the last word instead of dropping below */}
            <span className="mt-1 block text-sm font-semibold leading-[1.5] text-white">
              <svg className="me-1.5 inline-block size-4 -translate-y-px align-middle" style={{ color: GAIN.mint }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              {tCalc(copy.step4FixIncludesPro, locale)}{' '}
              <span className="whitespace-nowrap">
                <s className="font-medium text-white/55"><bdi>{copy.offerOldPrice}</bdi></s>{' '}
                <b className="text-xl font-black leading-none" style={{ color: GAIN.mint }}><bdi>{copy.offerNewPrice}</bdi></b>
              </span>
            </span>
            <span className="text-xs leading-[1.5] text-white/65">{tCalc(copy.step4FixEstimateNote, locale)}</span>
          </div>
          {/* Same width as the plate; zero intrinsic width so it never widens the column, only fills it */}
          <p className="m-0 w-0 min-w-full text-sm leading-[1.5] text-[#6b6254] sm:text-base">{tCalc(copy.ctaBody, locale)}</p>
        </div>
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
