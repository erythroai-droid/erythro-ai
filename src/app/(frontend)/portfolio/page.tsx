import React from 'react'
import type { Metadata } from 'next'
import PortfolioClient from './PortfolioClient'
import { getCachedShellSiteContent } from '@/lib/getSiteContent'
import {
  getCachedPortfolioCategories,
  getCachedPortfolioProjectCards,
} from '@/lib/cmsPages'
import { buildPortfolioFilters } from '@/lib/portfolioProjects'
import { defaultShareImages } from '@/lib/ogImages'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

/**
 * Full Route Cache / CDN: static HTML with ISR. Must not call cookies()/headers()
 * anywhere in this tree. Shell CMS + locale hydrate client-side.
 */
export const dynamic = 'force-static'
export const revalidate = 60

const PORTFOLIO_TITLE = 'Portfolio | Erythro.ai'
const PORTFOLIO_DESCRIPTION =
  'Projects built end-to-end — AI agents, CRM systems, websites, and digital products by Erythro.ai.'
const { openGraphImages, twitterImages } = defaultShareImages(PORTFOLIO_TITLE)

export const metadata: Metadata = {
  title: PORTFOLIO_TITLE,
  description: PORTFOLIO_DESCRIPTION,
  alternates: {
    canonical: '/portfolio',
  },
  // Child openGraph replaces layout OG — must include images (PIT-079).
  // Without this, messengers scrape the first project card (e.g. La Scala).
  openGraph: {
    title: PORTFOLIO_TITLE,
    description: 'Projects built end-to-end by Erythro.ai.',
    url: `${SITE_URL}/portfolio`,
    siteName: 'Erythro.ai',
    type: 'website',
    images: openGraphImages,
  },
  twitter: {
    card: 'summary_large_image',
    title: PORTFOLIO_TITLE,
    description: PORTFOLIO_DESCRIPTION,
    images: twitterImages,
  },
}

export default async function PortfolioPage() {
  const [content, projects, categoryFilters] = await Promise.all([
    getCachedShellSiteContent(),
    getCachedPortfolioProjectCards(),
    getCachedPortfolioCategories(),
  ])

  const filters = buildPortfolioFilters(categoryFilters)

  return (
    <PortfolioClient
      initialLocale="en"
      content={content}
      projects={projects}
      filters={filters}
      clientHydratePrefs
    />
  )
}
