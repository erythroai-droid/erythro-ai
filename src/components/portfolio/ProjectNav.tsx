'use client'

import React from 'react'
import Link from 'next/link'
import { tLocale, type LocaleMap } from '@/lib/portfolioProjects'
import { useSiteContent } from '@/components/SiteContentProvider'

export interface ProjectNavNeighbor {
  slug: string
  title: string | LocaleMap
}

export type ListingNavKind = 'portfolio' | 'solutions' | 'audit'

interface ProjectNavProps {
  locale: string
  theme?: 'light' | 'dark'
  prev: ProjectNavNeighbor | null
  next: ProjectNavNeighbor | null
  /** portfolio (default), solutions, or audit — labels + default paths */
  kind?: ListingNavKind
  /** Override list/index link (default: /portfolio, /#solutions, or /audit) */
  listHref?: string
  /** Override prev/next base path (default: /portfolio or /order) */
  itemBasePath?: string
  /** Render the index link next to prev/next */
  showListLink?: boolean
  /** Optional external project URL, rendered centered above the list button */
  visitHref?: string | null
  visitLabel?: string
  /**
   * Show a WhatsApp “Discuss on WhatsApp” CTA under the list button (portfolio case pages).
   * Prefills a message with the project title when provided.
   */
  discussWhatsApp?: boolean
  projectTitle?: string
  /** @deprecated Use listHref — kept for portfolio callers */
  portfolioHref?: string
}

function tNav(locale: string, kind: ListingNavKind) {
  if (kind === 'audit') {
    if (locale === 'ru') {
      return { prev: 'Назад', next: 'Далее', list: 'Все тарифы аудита' }
    }
    if (locale === 'he') {
      return { prev: 'הקודם', next: 'הבא', list: 'כל מחירי הביקורת' }
    }
    return { prev: 'Previous', next: 'Next', list: 'All audit plans' }
  }
  if (kind === 'solutions') {
    if (locale === 'ru') {
      return { prev: 'Назад', next: 'Далее', list: 'Все решения' }
    }
    if (locale === 'he') {
      return { prev: 'הקודם', next: 'הבא', list: 'כל הפתרונות' }
    }
    return { prev: 'Previous', next: 'Next', list: 'All solutions' }
  }
  if (locale === 'ru') {
    return { prev: 'Назад', next: 'Далее', list: 'Все проекты' }
  }
  if (locale === 'he') {
    return { prev: 'הקודם', next: 'הבא', list: 'כל הפרויקטים' }
  }
  return { prev: 'Previous', next: 'Next', list: 'All projects' }
}

function ArrowIcon({ direction }: { direction: 'prev' | 'next' }) {
  // SVG points toward the inline end (→). Mirror with rotate so:
  // LTR: next →, prev ←; RTL: next ←, prev →.
  const mirrorClass =
    direction === 'prev' ? 'rotate-180 rtl:rotate-0' : 'rtl:rotate-180'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="11"
      viewBox="0 0 10 11"
      fill="none"
      className={`h-2.5 w-2.5 shrink-0 ${mirrorClass}`}
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

function ExternalArrowIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  )
}

function discussWhatsAppLabel(locale: string): string {
  if (locale === 'ru') return 'Обсудить в WhatsApp'
  if (locale === 'he') return 'לדון ב-WhatsApp'
  return 'Discuss on WhatsApp'
}

function discussWhatsAppText(locale: string, projectTitle: string): string {
  const name = projectTitle.trim()
  if (locale === 'ru') {
    return name
      ? `Здравствуйте! Хочу обсудить проект «${name}».`
      : 'Здравствуйте! Хочу обсудить проект из портфолио.'
  }
  if (locale === 'he') {
    return name
      ? `שלום! אשמח לדון בפרויקט «${name}».`
      : 'שלום! אשמח לדון בפרויקט מהפורטפוליו.'
  }
  return name
    ? `Hi! I'd like to discuss the “${name}” project.`
    : "Hi! I'd like to discuss a portfolio project."
}

function newTabSrOnly(locale: string): string {
  if (locale === 'ru') return '(откроется в новой вкладке)'
  if (locale === 'he') return '(נפתח בכרטיסייה חדשה)'
  return '(opens in a new tab)'
}

export default function ProjectNav({
  locale,
  theme = 'dark',
  prev,
  next,
  kind = 'portfolio',
  listHref,
  itemBasePath,
  portfolioHref,
  showListLink = true,
  visitHref = null,
  visitLabel,
  discussWhatsApp = false,
  projectTitle = '',
}: ProjectNavProps) {
  const labels = tNav(locale, kind)
  const isLight = theme === 'light'
  const sitePhone = useSiteContent().siteSettings.phone || ''
  const waNumber = sitePhone.replace(/[^0-9]/g, '')
  const waHref =
    discussWhatsApp && waNumber
      ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
          discussWhatsAppText(locale, projectTitle),
        )}`
      : ''
  const basePath = itemBasePath ?? (kind === 'solutions' || kind === 'audit' ? '/order' : '/portfolio')
  const indexHref =
    listHref ?? portfolioHref ?? (kind === 'audit' ? '/audit' : kind === 'solutions' ? '/#solutions' : '/portfolio')
  const neighborTitle = (title: string | LocaleMap) =>
    typeof title === 'string' ? title : tLocale(title, locale)
  const ariaLabel =
    kind === 'audit'
      ? locale === 'ru'
        ? 'Навигация по тарифам аудита'
        : locale === 'he'
          ? 'ניווט בין תעריפי ביקורת'
          : 'Audit plans navigation'
      : kind === 'solutions'
        ? locale === 'ru'
          ? 'Навигация по решениям'
          : locale === 'he'
            ? 'ניווט בין פתרונות'
            : 'Solutions navigation'
        : locale === 'ru'
          ? 'Навигация по проектам'
          : locale === 'he'
            ? 'ניווט בין פרויקטים'
            : 'Project navigation'

  const outlineClass = isLight
    ? 'border-coal-900 text-coal-900 hover:bg-coal-900 hover:text-white active:bg-coal-900 active:text-white'
    : 'border-[var(--Button-Tertiary-link,#FFE9C7)] text-[var(--Button-Tertiary-link,#FFE9C7)] hover:bg-[var(--Button-Tertiary-link,#FFE9C7)] hover:text-coal-900 active:bg-[var(--Button-Tertiary-link,#FFE9C7)] active:text-coal-900'

  const accentClass = isLight
    ? 'border-transparent bg-erythro-500 text-white hover:bg-erythro-600 active:bg-erythro-700'
    : 'border-gold-500 bg-transparent text-gold-500 hover:bg-gold-500 hover:text-coal-900 active:bg-gold-500 active:text-coal-900'

  const baseBtn =
    'inline-flex h-10 max-w-full min-w-0 items-center justify-center gap-1.5 rounded-[var(--xl,40px)] border px-3 py-0 font-sans text-[10px] font-medium uppercase tracking-[1.2px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-[0.97] active:duration-100 sm:h-11 sm:px-5 sm:text-[12px] sm:tracking-[2px]'

  const sideBtn = `${baseBtn} px-2.5 sm:px-5`
  const whatsappClass =
    'border-[#25D366] bg-[#25D366] text-white hover:border-[#1ebe57] hover:bg-[#1ebe57] active:border-[#1aa34d] active:bg-[#1aa34d]'
  const newTabHint = newTabSrOnly(locale)

  const prevControl = prev ? (
    <Link
      href={`${basePath}/${prev.slug}`}
      className={`${sideBtn} justify-self-start ${outlineClass}`}
      title={neighborTitle(prev.title)}
      aria-label={labels.prev}
    >
      <ArrowIcon direction="prev" />
      <span className="hidden sm:inline">{labels.prev}</span>
    </Link>
  ) : (
    <span
      className={`${sideBtn} cursor-not-allowed justify-self-start opacity-35 ${outlineClass}`}
      aria-hidden
    >
      <ArrowIcon direction="prev" />
      <span className="hidden sm:inline">{labels.prev}</span>
    </span>
  )

  const nextControl = next ? (
    <Link
      href={`${basePath}/${next.slug}`}
      className={`${sideBtn} justify-self-end ${outlineClass}`}
      title={neighborTitle(next.title)}
      aria-label={labels.next}
    >
      <span className="hidden sm:inline">{labels.next}</span>
      <ArrowIcon direction="next" />
    </Link>
  ) : (
    <span
      className={`${sideBtn} cursor-not-allowed justify-self-end opacity-35 ${outlineClass}`}
      aria-hidden
    >
      <span className="hidden sm:inline">{labels.next}</span>
      <ArrowIcon direction="next" />
    </span>
  )

  return (
    <nav aria-label={ariaLabel} className="flex w-full flex-col items-center gap-6 sm:gap-8">
      {visitHref ? (
        <Link
          href={visitHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`group ${baseBtn} w-auto max-w-full px-4 sm:px-5 ${accentClass}`}
        >
          {visitLabel || 'Visit project'}
          <ExternalArrowIcon />
          <span className="sr-only">{newTabHint}</span>
        </Link>
      ) : null}

      <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-x-3">
        <div className="col-start-1 justify-self-start">{prevControl}</div>

        {showListLink ? (
          <Link
            href={indexHref}
            className={`${baseBtn} col-start-2 w-auto max-w-full justify-self-center px-3 text-center sm:px-5 ${accentClass}`}
          >
            {labels.list}
          </Link>
        ) : (
          <span className="col-start-2" aria-hidden />
        )}

        <div className="col-start-3 justify-self-end">{nextControl}</div>
      </div>

      {waHref ? (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`group ${baseBtn} w-auto max-w-full px-4 sm:px-5 ${whatsappClass}`}
        >
          {discussWhatsAppLabel(locale)}
          <ExternalArrowIcon />
          <span className="sr-only">{newTabHint}</span>
        </a>
      ) : null}
    </nav>
  )
}
