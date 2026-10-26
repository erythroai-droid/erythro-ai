import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AuditLpClient from '@/components/audit/AuditLpClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getCachedAuditPage } from '@/lib/auditPage.server'
import { tAudit } from '@/lib/auditPage'
import {
  AUDIT_LP_LOCALES,
  auditLpCanonicalUrl,
  auditLpCopyFor,
  auditLpPublicOrigin,
  isAuditLpLocale,
  tAuditLp,
  type AuditLpLocale,
} from '@/lib/auditLp'

export const dynamic = 'force-static'
export const revalidate = 60

const OG_LOCALE: Record<AuditLpLocale, string> = {
  en: 'en_US',
  ru: 'ru_RU',
  he: 'he_IL',
}

export function generateStaticParams() {
  return AUDIT_LP_LOCALES.map((locale) => ({ locale }))
}

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: raw } = await params
  if (!isAuditLpLocale(raw)) return {}

  const locale = raw
  const page = await getCachedAuditPage()
  const copy = auditLpCopyFor('free')
  const title = `${tAuditLp(copy.sectionTitle, locale)} | Erythro.ai`
  const description = tAudit(page.metaDescription, locale) || tAuditLp(copy.subhead, locale)
  const canonical = auditLpCanonicalUrl(locale)
  const origin = auditLpPublicOrigin(locale)

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Erythro.ai',
      type: 'website',
      locale: OG_LOCALE[locale],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    // metadataBase stays the main site from root layout; absolute OG url uses origin.
    other: {
      'lp-origin': origin,
    },
  }
}

export default async function AuditLpPage({ params }: PageProps) {
  const { locale: raw } = await params
  if (!isAuditLpLocale(raw)) notFound()

  const [content, auditPageContent] = await Promise.all([
    getCachedSiteContent(),
    getCachedAuditPage(),
  ])

  return (
    <AuditLpClient
      locale={raw}
      product="free"
      content={content}
      auditPageContent={auditPageContent}
    />
  )
}
