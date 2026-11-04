import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AuditCalcClient from '@/components/audit/AuditCalcClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getCachedAuditPage } from '@/lib/auditPage.server'
import {
  AUDIT_LP_LOCALES,
  auditLpCanonicalUrl,
  isAuditLpLocale,
  type AuditLpLocale,
} from '@/lib/auditLp'
import { auditCalcCopy, tCalc } from '@/lib/auditCalcCopy'

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

  const title = `${tCalc(auditCalcCopy.sectionTitle, raw)} | Erythro.ai`
  const description = tCalc(auditCalcCopy.headline, raw)
  const canonical = auditLpCanonicalUrl(raw, 'calc')

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
      locale: OG_LOCALE[raw],
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function AuditCalcPage({ params }: PageProps) {
  const { locale: raw } = await params
  if (!isAuditLpLocale(raw)) notFound()

  const [content, auditPageContent] = await Promise.all([
    getCachedSiteContent(),
    getCachedAuditPage(),
  ])

  return <AuditCalcClient locale={raw} content={content} auditPageContent={auditPageContent} />
}
