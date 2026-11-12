import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AuditLpClient from '@/components/audit/AuditLpClient'
import WebApplicationJsonLd from '@/components/WebApplicationJsonLd'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getCachedAuditPage } from '@/lib/auditPage.server'
import { tAudit } from '@/lib/auditPage'
import {
  AUDIT_LP_LOCALES,
  auditLpCanonicalUrl,
  auditLpCopyFor,
  auditLpLanguageAlternates,
  auditLpPublicOrigin,
  isAuditLpLocale,
  tAuditLp,
  type AuditLpLocale,
} from '@/lib/auditLp'
import { ogImageFields, ogImageForPlan } from '@/lib/ogImages'

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
  const title = `${tAuditLp(copy.metaTitle || copy.sectionTitle, locale)} | Erythro.ai`
  const description =
    tAudit(page.metaDescription, locale) ||
    (copy.metaDescription ? tAuditLp(copy.metaDescription, locale) : '') ||
    tAuditLp(copy.subhead, locale)
  const canonical = auditLpCanonicalUrl(locale)
  const origin = auditLpPublicOrigin(locale)
  // Child openGraph replaces layout OG — must include images (PIT-079).
  const ogImage = ogImageForPlan('audit-free')
  const ogImages = [ogImageFields(ogImage, title)]

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: auditLpLanguageAlternates('free'),
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
      locale: OG_LOCALE[locale],
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
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

  const copy = auditLpCopyFor('free')
  const title = `${tAuditLp(copy.metaTitle || copy.sectionTitle, raw)} | Erythro.ai`
  const canonical = auditLpCanonicalUrl(raw)
  const description =
    (copy.aiDescription ? tAuditLp(copy.aiDescription, raw) : '') ||
    tAudit(auditPageContent.metaDescription, raw) ||
    (copy.metaDescription ? tAuditLp(copy.metaDescription, raw) : '') ||
    tAuditLp(copy.subhead, raw)

  return (
    <>
      <WebApplicationJsonLd
        name={title}
        description={description}
        locale={raw}
        url={canonical}
        id={`${canonical.replace(/\/$/, '')}#app`}
      />
      <AuditLpClient
        locale={raw}
        product="free"
        content={content}
        auditPageContent={auditPageContent}
      />
    </>
  )
}
