import React from 'react'
import type { Metadata } from 'next'
import AboutClient from './AboutClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { aboutPage, tAbout } from '@/lib/aboutPage'
import { defaultShareImages } from '@/lib/ogImages'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

/**
 * Full Route Cache / CDN: static HTML with ISR. Must not call cookies()/headers()
 * anywhere in this tree. Locale hydrates client-side (PIT-056).
 */
export const dynamic = 'force-static'
export const revalidate = 60

const ABOUT_TITLE = `${tAbout(aboutPage.title, 'en')} | Erythro.ai`
const ABOUT_DESCRIPTION = tAbout(aboutPage.metaDescription, 'en')
const { openGraphImages, twitterImages } = defaultShareImages(ABOUT_TITLE)

export const metadata: Metadata = {
  title: ABOUT_TITLE,
  description: ABOUT_DESCRIPTION,
  alternates: { canonical: `/${aboutPage.slug}` },
  // Child openGraph replaces layout OG — must include images (PIT-079).
  openGraph: {
    title: ABOUT_TITLE,
    description: ABOUT_DESCRIPTION,
    url: `${SITE_URL}/${aboutPage.slug}`,
    siteName: 'Erythro.ai',
    type: 'website',
    images: openGraphImages,
  },
  twitter: {
    card: 'summary_large_image',
    title: ABOUT_TITLE,
    description: ABOUT_DESCRIPTION,
    images: twitterImages,
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
