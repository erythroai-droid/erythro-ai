'use client'

import React from 'react'
import Link from 'next/link'

export interface ProjectNavNeighbor {
  slug: string
  title: string
}

interface ProjectNavProps {
  locale: string
  theme?: 'light' | 'dark'
  prev: ProjectNavNeighbor | null
  next: ProjectNavNeighbor | null
  portfolioHref?: string
}

function tNav(locale: string) {
  if (locale === 'ru') {
    return { prev: 'Предыдущий', next: 'Следующий', portfolio: 'Все проекты' }
  }
  if (locale === 'he') {
    return { prev: 'הקודם', next: 'הבא', portfolio: 'כל הפרויקטים' }
  }
  return { prev: 'Previous', next: 'Next', portfolio: 'All projects' }
}

function ArrowIcon({ direction }: { direction: 'prev' | 'next' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="11"
      viewBox="0 0 10 11"
      fill="none"
      className={`h-2.5 w-2.5 shrink-0 ${direction === 'prev' ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path
        d="M9.67029 5.15683L5.15651 5.15753M5.15004 5.15753L0.250037 5.15753M5.15004 0.25L9.40026 4.5004C9.57253 4.67269 9.6693 4.90636 9.6693 5.15C9.6693 5.39364 9.57253 5.62731 9.40026 5.7996L5.15004 10.05"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ProjectNav({
  locale,
  theme = 'dark',
  prev,
  next,
  portfolioHref = '/portfolio',
}: ProjectNavProps) {
  const labels = tNav(locale)
  const isLight = theme === 'light'

  const outlineClass = isLight
    ? 'border-coal-900 text-coal-900 hover:bg-coal-900 hover:text-white active:bg-coal-900 active:text-white'
    : 'border-[var(--Button-Tertiary-link,#FFE9C7)] text-[var(--Button-Tertiary-link,#FFE9C7)] hover:bg-[var(--Button-Tertiary-link,#FFE9C7)] hover:text-coal-900 active:bg-[var(--Button-Tertiary-link,#FFE9C7)] active:text-coal-900'

  const accentClass = isLight
    ? 'border-transparent bg-erythro-500 text-white hover:bg-erythro-600 active:bg-erythro-700'
    : 'border-gold-500 bg-transparent text-gold-500 hover:bg-gold-500 hover:text-coal-900 active:bg-gold-500 active:text-coal-900'

  const baseBtn =
    'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[var(--xl,40px)] border px-4 py-0 font-sans text-[11px] font-medium uppercase tracking-[1.8px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-[0.97] active:duration-100 sm:h-11 sm:px-5 sm:text-[12px] sm:tracking-[2px]'

  return (
    <nav
      aria-label={locale === 'ru' ? 'Навигация по проектам' : locale === 'he' ? 'ניווט בין פרויקטים' : 'Project navigation'}
      className="flex w-full items-center justify-between gap-2 sm:gap-3"
    >
      {prev ? (
        <Link
          href={`/portfolio/${prev.slug}`}
          className={`${baseBtn} ${outlineClass}`}
          title={prev.title}
        >
          <ArrowIcon direction="prev" />
          <span>{labels.prev}</span>
        </Link>
      ) : (
        <span className={`${baseBtn} cursor-not-allowed opacity-35 ${outlineClass}`} aria-hidden>
          <ArrowIcon direction="prev" />
          <span>{labels.prev}</span>
        </span>
      )}

      <Link href={portfolioHref} className={`${baseBtn} ${accentClass}`}>
        {labels.portfolio}
      </Link>

      {next ? (
        <Link
          href={`/portfolio/${next.slug}`}
          className={`${baseBtn} ${outlineClass}`}
          title={next.title}
        >
          <span>{labels.next}</span>
          <ArrowIcon direction="next" />
        </Link>
      ) : (
        <span className={`${baseBtn} cursor-not-allowed opacity-35 ${outlineClass}`} aria-hidden>
          <span>{labels.next}</span>
          <ArrowIcon direction="next" />
        </span>
      )}
    </nav>
  )
}
