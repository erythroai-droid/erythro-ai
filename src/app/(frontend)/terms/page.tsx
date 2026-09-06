import React from 'react'
import type { Metadata } from 'next'
import LegalPageClient from '../legal/LegalPageClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getCachedLegalPage } from '@/lib/legalPages.server'
import { tLegal } from '@/lib/legalPages'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'
const PAGE_ID = 'terms' as const

/**
 * Full Route Cache / CDN: static HTML with ISR. Must not call cookies()/headers()
 * anywhere in this tree. Locale hydrates client-side (PIT-056).
 */
export const dynamic = 'force-static'
export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCachedLegalPage(PAGE_ID)
  const title = `${tLegal(page.title, 'en')} | Erythro.ai`
  const description = tLegal(page.metaDescription, 'en')

  return {
    title,
    description,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${page.slug}`,
      siteName: 'Erythro.ai',
      type: 'website',
    },
  }
}

export default async function TermsPage() {
  const [content, page] = await Promise.all([getCachedSiteContent(), getCachedLegalPage(PAGE_ID)])

  return (
    <LegalPageClient
      initialLocale="en"
      content={content}
      page={page}
      clientHydratePrefs
    />
  )
}
