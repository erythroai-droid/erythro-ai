'use client'

import React from 'react'

export interface ProjectPerformanceScoresData {
  performance?: number | null
  accessibility?: number | null
  bestPractices?: number | null
  seo?: number | null
  /** e.g. "2/2" */
  agentBrowse?: string | null
}

interface ProjectPerformanceScoresProps {
  locale?: string
  theme?: 'light' | 'dark'
  scores: ProjectPerformanceScoresData
}

const R = 22
const C = 2 * Math.PI * R

function clampScore(n: unknown): number | null {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null
  return Math.max(0, Math.min(100, Math.round(n)))
}

function scoreTone(
  score: number,
  isLight: boolean,
): { stroke: string; text: string; track: string } {
  if (score >= 90) {
    return {
      stroke: isLight ? 'stroke-emerald-500' : 'stroke-emerald-400',
      text: isLight ? 'text-emerald-600' : 'text-emerald-400',
      track: isLight ? 'stroke-emerald-500/15' : 'stroke-emerald-400/25',
    }
  }
  if (score >= 50) {
    return {
      stroke: isLight ? 'stroke-amber-500' : 'stroke-amber-400',
      text: isLight ? 'text-amber-600' : 'text-amber-400',
      track: isLight ? 'stroke-amber-500/15' : 'stroke-amber-400/25',
    }
  }
  return {
    stroke: isLight ? 'stroke-erythro-500' : 'stroke-erythro-400',
    text: isLight ? 'text-erythro-500' : 'text-erythro-400',
    track: isLight ? 'stroke-erythro-500/15' : 'stroke-erythro-400/25',
  }
}

function Gauge({
  score,
  label,
  isLight,
}: {
  score: number
  label: string
  isLight: boolean
}) {
  const tone = scoreTone(score, isLight)
  const offset = C * (1 - score / 100)
  return (
    <li className="flex min-w-[4.5rem] flex-col items-center gap-2 text-center">
      <div className="relative size-[64px]" aria-hidden>
        <svg viewBox="0 0 52 52" className="size-full -rotate-90">
          <circle
            cx="26"
            cy="26"
            r={R}
            fill="none"
            strokeWidth="4"
            className={tone.track}
          />
          <circle
            cx="26"
            cy="26"
            r={R}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            className={tone.stroke}
            strokeDasharray={C}
            strokeDashoffset={offset}
          />
        </svg>
        <span
          dir="ltr"
          className={`absolute inset-0 flex items-center justify-center font-sans text-base font-semibold tabular-nums ${tone.text}`}
        >
          {score}
        </span>
      </div>
      <span
        className={`max-w-[7.5rem] font-sans text-[11px] leading-snug ${
          isLight ? 'text-coal-600' : 'text-white/80'
        }`}
      >
        {label}
      </span>
    </li>
  )
}

function AgentPill({
  value,
  label,
  isLight,
}: {
  value: string
  label: string
  isLight: boolean
}) {
  return (
    <li className="flex min-w-[4.5rem] flex-col items-center gap-2 text-center">
      <div
        className="flex h-[64px] items-center justify-center"
        aria-hidden
      >
        <span
          dir="ltr"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-sm font-semibold tabular-nums ${
            isLight
              ? 'bg-emerald-500/15 text-emerald-600'
              : 'bg-emerald-400/20 text-emerald-400'
          }`}
        >
          <span
            className={`size-2 shrink-0 rounded-full ${
              isLight ? 'bg-emerald-500' : 'bg-emerald-400'
            }`}
          />
          {value}
        </span>
      </div>
      <span
        className={`max-w-[7.5rem] font-sans text-[11px] leading-snug ${
          isLight ? 'text-coal-600' : 'text-white/80'
        }`}
      >
        {label}
      </span>
    </li>
  )
}

function labelsFor(locale: string) {
  if (locale === 'ru') {
    return {
      section: 'Производительность',
      performance: 'Производительность',
      accessibility: 'Специальные возможности',
      bestPractices: 'Рекомендации',
      seo: 'Поисковая оптимизация',
      agentBrowse: 'Агентный просмотр',
    }
  }
  if (locale === 'he') {
    return {
      section: 'ביצועים',
      performance: 'ביצועים',
      accessibility: 'נגישות',
      bestPractices: 'שיטות מומלצות',
      seo: 'קידום אתרים',
      agentBrowse: 'צפייה בסוכן',
    }
  }
  return {
    section: 'Performance',
    performance: 'Performance',
    accessibility: 'Accessibility',
    bestPractices: 'Best Practices',
    seo: 'SEO',
    agentBrowse: 'Agent browse',
  }
}

/** Lighthouse-style score row for portfolio project pages. */
export default function ProjectPerformanceScores({
  locale = 'en',
  theme = 'dark',
  scores,
}: ProjectPerformanceScoresProps) {
  const isLight = theme === 'light'
  const L = labelsFor(locale)
  const performance = clampScore(scores.performance)
  const accessibility = clampScore(scores.accessibility)
  const bestPractices = clampScore(scores.bestPractices)
  const seo = clampScore(scores.seo)
  const agentBrowse =
    typeof scores.agentBrowse === 'string' ? scores.agentBrowse.trim() : ''

  const items: React.ReactNode[] = []
  if (performance != null) {
    items.push(
      <Gauge key="perf" score={performance} label={L.performance} isLight={isLight} />,
    )
  }
  if (accessibility != null) {
    items.push(
      <Gauge
        key="a11y"
        score={accessibility}
        label={L.accessibility}
        isLight={isLight}
      />,
    )
  }
  if (bestPractices != null) {
    items.push(
      <Gauge
        key="bp"
        score={bestPractices}
        label={L.bestPractices}
        isLight={isLight}
      />,
    )
  }
  if (seo != null) {
    items.push(<Gauge key="seo" score={seo} label={L.seo} isLight={isLight} />)
  }
  if (agentBrowse) {
    items.push(
      <AgentPill
        key="agent"
        value={agentBrowse}
        label={L.agentBrowse}
        isLight={isLight}
      />,
    )
  }
  if (!items.length) return null

  return (
    <section
      aria-label={L.section}
      className={`w-full border-t pt-6 ${
        isLight ? 'border-coal-900/15' : 'border-white/15'
      }`}
    >
      <ul className="m-0 flex list-none flex-wrap items-start justify-start gap-x-6 gap-y-5 p-0 sm:gap-x-8">
        {items}
      </ul>
    </section>
  )
}
