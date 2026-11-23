import React from 'react'
import type { Metadata } from 'next'
import AuditClient from './AuditClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getCachedAuditPage } from '@/lib/auditPage.server'
import { tAudit } from '@/lib/auditPage'
import { ogImageFields, ogImageForPlan } from '@/lib/ogImages'

/**
 * Full Route Cache / CDN: static HTML with ISR. Must not call cookies()/headers()
 * anywhere in this tree. Locale/theme hydrate client-side (PIT-056).
 */
export const dynamic = 'force-static'
export const revalidate = 3600

const DEFAULT_LOCALE = 'en'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCachedAuditPage()
  const title = `${tAudit(page.title, DEFAULT_LOCALE)} | Erythro.ai`
  const description = tAudit(page.metaDescription, DEFAULT_LOCALE)
  const slug = page.slug || 'audit'
  // Child openGraph replaces layout OG — must include images (PIT-079).
  const ogImage = ogImageForPlan('audit-free')
  const ogImages = [ogImageFields(ogImage, title)]

  return {
    title,
    description,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${slug}`,
      siteName: 'Erythro.ai',
      type: 'website',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function AuditPage() {
  const [content, auditPageContent] = await Promise.all([
    getCachedSiteContent(),
    getCachedAuditPage(),
  ])

  return (
    <AuditClient
      initialLocale={DEFAULT_LOCALE}
      content={content}
      auditPageContent={auditPageContent}
      clientHydratePrefs
    />
  )
}
