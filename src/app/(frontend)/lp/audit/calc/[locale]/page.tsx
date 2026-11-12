import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AuditCalcClient from '@/components/audit/AuditCalcClient'
import WebApplicationJsonLd from '@/components/WebApplicationJsonLd'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getCachedAuditPage } from '@/lib/auditPage.server'
import {
  AUDIT_LP_LOCALES,
  auditLpCanonicalUrl,
  auditLpLanguageAlternates,
  isAuditLpLocale,
  type AuditLpLocale,
} from '@/lib/auditLp'
import { auditCalcCopy, tCalc } from '@/lib/auditCalcCopy'
import { ogImageFields, ogImageForLeakCalc } from '@/lib/ogImages'

export const dynamic = 'force-static'
export const revalidate = 60

const OG_LOCALE: Record<AuditLpLocale, string> = {
  en: 'en_US',
  ru: 'ru_RU',
  he: 'he_IL',
}

const LEAK_CALC_FEATURES = [
  'Homepage technical audit (mobile & desktop)',
  'Core Web Vitals / PageSpeed',
  'Lead-form & conversion friction',
  'Google + AI visibility (ChatGPT, Perplexity)',
  'Monthly revenue / lead loss in ₪',
]

export function generateStaticParams() {
  return AUDIT_LP_LOCALES.map((locale) => ({ locale }))
}

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: raw } = await params
  if (!isAuditLpLocale(raw)) return {}

  const title = `${tCalc(auditCalcCopy.metaTitle, raw)} | Erythro.ai`
  const description = tCalc(auditCalcCopy.metaDescription, raw)
  const canonical = auditLpCanonicalUrl(raw, 'calc')
  // Child openGraph replaces layout OG — must include images (PIT-079).
  const ogImage = ogImageForLeakCalc(raw)
  const ogImages = [ogImageFields(ogImage, title)]

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: auditLpLanguageAlternates('calc'),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Erythro.ai',
      type: 'website',
      locale: OG_LOCALE[raw],
      images: ogImages,
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  }
}

export default async function AuditCalcPage({ params }: PageProps) {
  const { locale: raw } = await params
  if (!isAuditLpLocale(raw)) notFound()

  const [content, auditPageContent] = await Promise.all([
    getCachedSiteContent(),
    getCachedAuditPage(),
  ])

  const title = `${tCalc(auditCalcCopy.metaTitle, raw)} | Erythro.ai`
  const canonical = auditLpCanonicalUrl(raw, 'calc')

  return (
    <>
      <WebApplicationJsonLd
        name={title}
        description={tCalc(auditCalcCopy.aiDescription, raw)}
        locale={raw}
        url={canonical}
        id={`${canonical.replace(/\/$/, '')}#app`}
        featureList={LEAK_CALC_FEATURES}
      />
      <AuditCalcClient locale={raw} content={content} auditPageContent={auditPageContent} />
    </>
  )
}
