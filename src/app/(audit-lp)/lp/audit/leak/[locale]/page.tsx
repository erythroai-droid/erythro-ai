import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LeakLpClient from '@/components/leak-lp/LeakLpClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getCachedAuditPage } from '@/lib/auditPage.server'
import { AUDIT_LP_LOCALES, LEAK_LP_HOST_BY_LOCALE, isAuditLpLocale, type AuditLpLocale } from '@/lib/auditLp'
import { tCalc } from '@/lib/auditCalcCopy'
import { leakLpCopy } from '@/lib/leakLpCopy'
import { ogImageFields, ogImageForLeakLp } from '@/lib/ogImages'

// AI-audit landing, served on ai-audit-{en,ru,he}.erythro.ai. Indexable (since 2026-11-20).
// Dynamic: parent (audit-lp) layout reads `x-lp-locale` for SSR lang/dir.

const OG_LOCALE: Record<AuditLpLocale, string> = { en: 'en_US', ru: 'ru_RU', he: 'he_IL' }

const leakLpCanonical = (locale: AuditLpLocale) => `https://${LEAK_LP_HOST_BY_LOCALE[locale]}/`

export function generateStaticParams() {
  return AUDIT_LP_LOCALES.map((locale) => ({ locale }))
}

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isAuditLpLocale(locale)) return {}
  const canonical = leakLpCanonical(locale)
  const ogTitle = tCalc(leakLpCopy.ogTitle, locale)
  const ogDescription = tCalc(leakLpCopy.ogDescription, locale)
  // Child openGraph replaces layout OG — must include images (PIT-079).
  const ogImage = ogImageForLeakLp(locale)
  return {
    title: `${tCalc(leakLpCopy.metaTitle, locale)} | Erythro.ai`,
    description: tCalc(leakLpCopy.metaDescription, locale),
    alternates: {
      canonical,
      languages: {
        en: leakLpCanonical('en'),
        ru: leakLpCanonical('ru'),
        he: leakLpCanonical('he'),
        'x-default': leakLpCanonical('en'),
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName: 'Erythro.ai',
      type: 'website',
      locale: OG_LOCALE[locale],
      images: [ogImageFields(ogImage, ogTitle)],
    },
    twitter: { card: 'summary_large_image', title: ogTitle, description: ogDescription, images: [ogImage] },
  }
}

export default async function LeakLpPage({ params }: PageProps) {
  const { locale } = await params
  if (!isAuditLpLocale(locale)) notFound()
  const [content, auditPageContent] = await Promise.all([getCachedSiteContent(), getCachedAuditPage()])
  return <LeakLpClient locale={locale} content={content} auditPageContent={auditPageContent} />
}
