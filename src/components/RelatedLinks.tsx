'use client'

import React from 'react'
import Link from 'next/link'
import { tLocale, type PortfolioProject } from '@/lib/portfolioProjects'

type RelatedCase = Pick<PortfolioProject, 'slug' | 'title'>

interface RelatedCasesProps {
  locale: string
  theme?: 'light' | 'dark'
  cases: RelatedCase[]
}

interface RelatedServiceAuditProps {
  locale: string
  theme?: 'light' | 'dark'
  serviceSlug: string | null
  serviceLabel?: string
  /** Second CTA href; empty/null hides the audit link. */
  auditHref?: string | null
  /** Override for the audit CTA label; empty → locale default. */
  auditLabel?: string
}

function headingClass(isLight: boolean) {
  return `font-sans text-sm font-medium uppercase tracking-[0.14em] ${
    isLight ? 'text-coal-900' : 'text-gold-500'
  }`
}

function linkClass(isLight: boolean) {
  return `font-sans text-base underline-offset-4 transition-colors hover:underline ${
    isLight ? 'text-coal-800 hover:text-erythro-500' : 'text-gold-100 hover:text-gold-500'
  }`
}

function relatedCasesTitle(locale: string): string {
  if (locale === 'ru') return 'Связанные кейсы'
  if (locale === 'he') return 'מקרי בוחן קשורים'
  return 'Related cases'
}

function relatedServiceTitle(locale: string): string {
  if (locale === 'ru') return 'Связанная услуга'
  if (locale === 'he') return 'שירות קשור'
  return 'Related service'
}

function freeAuditLabel(locale: string): string {
  if (locale === 'ru') return 'Бесплатный AI-аудит'
  if (locale === 'he') return 'אודיט AI חינמי'
  return 'Free AI audit'
}

/** SSR-friendly related portfolio links on service pages. */
export function RelatedCases({ locale, theme = 'dark', cases }: RelatedCasesProps) {
  if (!cases.length) return null
  const isLight = theme === 'light'
  return (
    <nav aria-label={relatedCasesTitle(locale)} className="mt-10 flex w-full flex-col gap-3">
      <h2 className={headingClass(isLight)}>{relatedCasesTitle(locale)}</h2>
      <ul className="flex flex-col gap-2">
        {cases.map((item) => (
          <li key={item.slug}>
            <Link href={`/portfolio/${item.slug}`} className={linkClass(isLight)}>
              {tLocale(item.title, locale)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function safePublicHref(raw: string | null | undefined): string | null {
  const href = typeof raw === 'string' ? raw.trim() : ''
  if (!href) return null
  if (href.startsWith('/') && !href.startsWith('//')) return href
  if (/^https:\/\//i.test(href)) return href
  return null
}

/** Related service + free audit CTAs at the bottom of portfolio cases. */
export function RelatedServiceAndAudit({
  locale,
  theme = 'dark',
  serviceSlug,
  serviceLabel,
  auditHref = '/audit',
  auditLabel,
}: RelatedServiceAuditProps) {
  const isLight = theme === 'light'
  const label =
    serviceLabel ||
    (locale === 'ru' ? 'Услуги' : locale === 'he' ? 'שירותים' : 'Services')
  const resolvedAuditHref = safePublicHref(auditHref)
  const resolvedAuditLabel = auditLabel?.trim() || freeAuditLabel(locale)
  if (!serviceSlug && !resolvedAuditHref) return null
  return (
    <nav
      aria-label={relatedServiceTitle(locale)}
      className="mt-10 flex w-full flex-col gap-3 border-t border-current/10 pt-8"
    >
      <h2 className={headingClass(isLight)}>{relatedServiceTitle(locale)}</h2>
      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
        {serviceSlug ? (
          <li>
            <Link href={`/services/${serviceSlug}`} className={linkClass(isLight)}>
              {label}
            </Link>
          </li>
        ) : null}
        {resolvedAuditHref ? (
          <li>
            <Link href={resolvedAuditHref} className={linkClass(isLight)}>
              {resolvedAuditLabel}
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}

