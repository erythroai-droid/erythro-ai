import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LeakLpClient from '@/components/leak-lp/LeakLpClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getCachedAuditPage } from '@/lib/auditPage.server'
import { AUDIT_LP_LOCALES, isAuditLpLocale, mainSiteUrl, type AuditLpLocale } from '@/lib/auditLp'
import { tCalc } from '@/lib/auditCalcCopy'
import { leakLpCopy } from '@/lib/leakLpCopy'
import { ogImageFields, ogImageForLeakCalc } from '@/lib/ogImages'

export const dynamic = 'force-static'
export const revalidate = 3600

const OG_LOCALE: Record<AuditLpLocale, string> = {
  en: 'en_US',
  ru: 'ru_RU',
  he: 'he_IL',
}

/** Premium leak LP lives on the main host for now (no ads subdomain yet). */
function leakLpUrl(locale: AuditLpLocale): string {
  return mainSiteUrl(`/lp/audit/leak/${locale}`)
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

  const title = `${tCalc(leakLpCopy.metaTitle, raw)} | Erythro.ai`
  const description = tCalc(leakLpCopy.metaDescription, raw)
  const canonical = leakLpUrl(raw)
  // Child openGraph replaces layout OG — must include images (PIT-079).
  const ogImage = ogImageForLeakCalc(raw)

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: leakLpUrl('en'),
        ru: leakLpUrl('ru'),
        he: leakLpUrl('he'),
        'x-default': leakLpUrl('en'),
      },
    },
    // Not indexed until the design is approved.
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Erythro.ai',
      type: 'website',
      locale: OG_LOCALE[raw],
      images: [ogImageFields(ogImage, title)],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  }
}

export default async function LeakLpPage({ params }: PageProps) {
  const { locale: raw } = await params
  if (!isAuditLpLocale(raw)) notFound()

  const [content, auditPageContent] = await Promise.all([getCachedSiteContent(), getCachedAuditPage()])

  return <LeakLpClient locale={raw} content={content} auditPageContent={auditPageContent} />
}
