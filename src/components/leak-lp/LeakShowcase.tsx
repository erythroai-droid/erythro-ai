'use client'

import React from 'react'
import { formatIls, tCalc, type Localized } from '@/lib/auditCalcCopy'
import { leakLpCopy as c } from '@/lib/leakLpCopy'
import { CountUp } from '@/components/leak-lp/motion'

export type ShowcaseTab = 'loss' | 'speed' | 'forms' | 'ai'
export const SHOWCASE_TABS: ShowcaseTab[] = ['loss', 'speed', 'forms', 'ai']
export const SHOWCASE_TAB_LABEL: Record<ShowcaseTab, Localized> = {
  loss: c.tabLoss,
  speed: c.tabSpeed,
  forms: c.tabForms,
  ai: c.tabAi,
}

const LOSS_SPLIT: { k: ShowcaseTab | 'security'; v: number; label: Localized }[] = [
  { k: 'speed', v: 42, label: c.tabSpeed },
  { k: 'forms', v: 27, label: c.tabForms },
  { k: 'ai', v: 19, label: c.tabAi },
  { k: 'security', v: 12, label: { en: 'Trust & security', ru: 'Доверие и защита', he: 'אמון ואבטחה' } },
]
const SPLIT_COLOR = ['#e52421', '#f0705c', '#f6ab9c', '#e6e3de']

function PanelHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-[var(--lk-line)] px-5 py-3.5">
      <span className="text-sm font-medium text-[var(--lk-ink)]">{title}</span>
      {hint ? <span className="text-xs text-[var(--lk-faint)]">· {hint}</span> : null}
    </div>
  )
}

function LossPanel({ locale }: { locale: string }) {
  const t = (f: Localized) => tCalc(f, locale)
  // 12-month mini area (sample)
  const pts = [32, 34, 31, 38, 41, 39, 46, 44, 51, 49, 55, 58]
  const w = 320
  const h = 92
  const max = 64
  const line = pts.map((p, i) => `${(i / (pts.length - 1)) * w},${h - (p / max) * h}`).join(' ')
  return (
    <div className="lk-panel flex flex-col">
      <PanelHead title={t(c.pvLossTitle)} hint={t(c.pvLossHint)} />
      <div className="grid gap-5 p-5 sm:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-[34px] font-medium leading-none tracking-[-0.03em] text-[var(--lk-ink)]">
                <CountUp to={18400} format={(n) => formatIls(Math.round(n / 10) * 10, locale)} />
              </span>
              <span className="rounded-[5px] bg-[var(--lk-red)]/10 px-1.5 py-0.5 text-xs font-medium text-[var(--lk-red-700)]">
                −23 {t(c.pvLossLeads)}
              </span>
            </div>
          </div>
          <svg viewBox={`0 0 ${w} ${h + 4}`} className="h-auto w-full" aria-hidden="true">
            <defs>
              <linearGradient id="lk-loss-grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#e52421" stopOpacity="0.18" />
                <stop offset="1" stopColor="#e52421" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((g) => (
              <line key={g} x1="0" x2={w} y1={h * g} y2={h * g} stroke="#efece7" strokeWidth="1" />
            ))}
            <polygon points={`0,${h} ${line} ${w},${h}`} fill="url(#lk-loss-grad)" />
            <polyline points={line} fill="none" stroke="#e52421" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" pathLength={1} className="lk-draw" data-in="" />
          </svg>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium text-[var(--lk-faint)]">{t(c.pvLossBySource)}</span>
          <div className="flex h-2 w-full overflow-hidden rounded-full">
            {LOSS_SPLIT.map((s, i) => (
              <span key={s.k} style={{ width: `${s.v}%`, background: SPLIT_COLOR[i] }} />
            ))}
          </div>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {LOSS_SPLIT.map((s, i) => (
              <li key={s.k} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="flex items-center gap-2 text-[var(--lk-ink-2)]">
                  <span className="size-2 rounded-[2px]" style={{ background: SPLIT_COLOR[i] }} />
                  {t(s.label)}
                </span>
                <span className="tabular-nums text-[var(--lk-muted)]">{s.v}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Ring({ value, label, tone }: { value: number; label: string; tone: 'bad' | 'mid' | 'good' }) {
  const r = 26
  const len = 2 * Math.PI * r
  const color = tone === 'bad' ? '#e52421' : tone === 'mid' ? '#f59e0b' : '#16a34a'
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-[68px]">
        <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#efece7" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={len}
            strokeDashoffset={len * (1 - value / 100)}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[17px] font-medium tabular-nums text-[var(--lk-ink)]">
          {value}
        </span>
      </div>
      <span className="text-xs text-[var(--lk-muted)]">{label}</span>
    </div>
  )
}

function SpeedPanel({ locale }: { locale: string }) {
  const t = (f: Localized) => tCalc(f, locale)
  const rows = [
    { m: 'LCP', v: '4.2 s', s: 'bad' as const, target: '≤ 2.5 s' },
    { m: 'CLS', v: '0.28', s: 'bad' as const, target: '≤ 0.1' },
    { m: 'TBT', v: '420 ms', s: 'mid' as const, target: '≤ 200 ms' },
    { m: 'FCP', v: '2.8 s', s: 'mid' as const, target: '≤ 1.8 s' },
  ]
  const tone = { bad: 'bg-[#e52421]', mid: 'bg-[#f59e0b]', good: 'bg-[#16a34a]' }
  return (
    <div className="lk-panel flex flex-col">
      <PanelHead title={t(c.pvSpeedTitle)} hint="Google Lighthouse" />
      <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex justify-center gap-5">
          <Ring value={42} label="Mobile" tone="bad" />
          <Ring value={78} label="Desktop" tone="mid" />
        </div>
        <ul className="m-0 flex list-none flex-col divide-y divide-[var(--lk-line)] p-0" dir="ltr">
          {rows.map((r) => (
            <li key={r.m} className="flex items-center justify-between gap-3 py-2 text-[13px]">
              <span className="flex items-center gap-2 font-medium text-[var(--lk-ink-2)]">
                <span className={`size-1.5 rounded-full ${tone[r.s]}`} />
                {r.m}
              </span>
              <span className="text-[var(--lk-faint)]">{r.target}</span>
              <span className="min-w-[64px] text-end font-medium tabular-nums text-[var(--lk-ink)]">{r.v}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="m-0 border-t border-[var(--lk-line)] px-5 py-3 text-xs leading-[1.5] text-[var(--lk-muted)]">{t(c.pvSpeedHint)}</p>
    </div>
  )
}

function FormsPanel({ locale }: { locale: string }) {
  const t = (f: Localized) => tCalc(f, locale)
  const fields = [
    { en: 'Full name', ru: 'Имя и фамилия', he: 'שם מלא' },
    { en: 'Phone', ru: 'Телефон', he: 'טלפון' },
    { en: 'Email', ru: 'Email', he: 'אימייל' },
    { en: 'Company', ru: 'Компания', he: 'חברה' },
    { en: 'Budget', ru: 'Бюджет', he: 'תקציב' },
  ]
  return (
    <div className="lk-panel flex flex-col">
      <PanelHead title={t(c.pvFormsTitle)} hint="Mobile · 390px" />
      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_1fr]">
        <div className="relative rounded-[10px] border border-[var(--lk-line)] bg-[var(--lk-stone-50)] p-3">
          <div className="flex flex-col gap-1.5">
            {fields.map((f, i) => (
              <div
                key={i}
                className={`flex h-7 items-center rounded-[5px] border bg-white px-2 text-[11px] text-[var(--lk-faint)] ${i >= 3 ? 'border-[var(--lk-red)]/50' : 'border-[var(--lk-line)]'}`}
              >
                {t(f)}
              </div>
            ))}
            <div className="mt-1 flex h-7 items-center justify-center rounded-[5px] border border-dashed border-[var(--lk-red)]/60 text-[11px] text-[var(--lk-red-700)]">
              ↓ 1 280px
            </div>
          </div>
        </div>
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {c.bFormsIssues.map((iss, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] leading-[1.45] text-[var(--lk-ink-2)]">
              <span className="mt-[3px] flex size-4 shrink-0 items-center justify-center rounded-full bg-[var(--lk-red)]/10 text-[10px] font-semibold text-[var(--lk-red-700)]">
                {i + 1}
              </span>
              {t(iss)}
            </li>
          ))}
          <li className="mt-1 flex items-center gap-2 text-[13px] text-[var(--lk-muted)]">
            <span className="rounded-[5px] bg-[var(--lk-red)]/10 px-1.5 py-0.5 text-xs font-medium text-[var(--lk-red-700)]">−27%</span>
            {t(c.pvLossLeads)}
          </li>
        </ul>
      </div>
    </div>
  )
}

function AiPanel({ locale }: { locale: string }) {
  const t = (f: Localized) => tCalc(f, locale)
  const rows = [
    { n: `${t(c.pvAiCompetitor)} A`, pos: 1, you: false },
    { n: `${t(c.pvAiCompetitor)} B`, pos: 2, you: false },
    { n: `${t(c.pvAiCompetitor)} C`, pos: 3, you: false },
    { n: t(c.pvAiYou), pos: null, you: true },
  ]
  return (
    <div className="lk-panel flex flex-col">
      <PanelHead title={t(c.pvAiTitle)} hint="ChatGPT · Perplexity · Gemini" />
      <div className="flex flex-col gap-4 p-5">
        <div className="ms-auto max-w-[85%] rounded-[12px] rounded-ee-[4px] bg-[var(--lk-stone-100)] px-3.5 py-2.5 text-[13px] leading-[1.5] text-[var(--lk-ink-2)]">
          {t(c.pvAiPrompt)}
        </div>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {rows.map((r, i) => (
            <li
              key={i}
              className={`flex items-center justify-between gap-3 rounded-[8px] border px-3 py-2 text-[13px] ${
                r.you ? 'border-[var(--lk-red)]/40 bg-[var(--lk-red)]/[0.04]' : 'border-[var(--lk-line)] bg-white'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className={`flex size-5 items-center justify-center rounded-full text-[11px] font-medium tabular-nums ${r.you ? 'bg-[var(--lk-red)] text-white' : 'bg-[var(--lk-stone-100)] text-[var(--lk-muted)]'}`}>
                  {r.pos ?? '–'}
                </span>
                <span className={r.you ? 'font-medium text-[var(--lk-ink)]' : 'text-[var(--lk-ink-2)]'}>{r.n}</span>
              </span>
              {r.you ? <span className="text-xs font-medium text-[var(--lk-red-700)]">{t(c.pvAiMissing)}</span> : <span className="h-1.5 w-12 rounded-full bg-[var(--lk-stone-150)]" />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function LeakShowcase({ locale, tab }: { locale: string; tab: ShowcaseTab }) {
  return (
    <div key={tab} className="min-h-[300px]">
      {tab === 'loss' ? <LossPanel locale={locale} /> : null}
      {tab === 'speed' ? <SpeedPanel locale={locale} /> : null}
      {tab === 'forms' ? <FormsPanel locale={locale} /> : null}
      {tab === 'ai' ? <AiPanel locale={locale} /> : null}
    </div>
  )
}
