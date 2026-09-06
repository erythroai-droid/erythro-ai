import React from 'react'
import type { Metadata } from 'next'
import AboutClient from './AboutClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { aboutPage, tAbout } from '@/lib/aboutPage'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

/**
 * Full Route Cache / CDN: static HTML with ISR. Must not call cookies()/headers()
 * anywhere in this tree. Locale hydrates client-side (PIT-056).
 */
export const dynamic = 'force-static'
export const revalidate = 60

export const metadata: Metadata = {
  title: `${tAbout(aboutPage.title, 'en')} | Erythro.ai`,
  description: tAbout(aboutPage.metaDescription, 'en'),
  alternates: { canonical: `/${aboutPage.slug}` },
  openGraph: {
    title: `${tAbout(aboutPage.title, 'en')} | Erythro.ai`,
    description: tAbout(aboutPage.metaDescription, 'en'),
    url: `${SITE_URL}/${aboutPage.slug}`,
    siteName: 'Erythro.ai',
    type: 'website',
  },
}

export default async function AboutPage() {
  const content = await getCachedSiteContent()

  return (
    <AboutClient
      initialLocale="en"
      content={content}
      clientHydratePrefs
    />
  )
}
