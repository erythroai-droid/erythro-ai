import React from 'react'
import type { Metadata } from 'next'
import PortfolioClient from './PortfolioClient'
import { getCachedShellSiteContent } from '@/lib/getSiteContent'
import {
  getCachedPortfolioCategories,
  getCachedPortfolioProjectCards,
} from '@/lib/cmsPages'
import { buildPortfolioFilters } from '@/lib/portfolioProjects'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

/**
 * Full Route Cache / CDN: static HTML with ISR. Must not call cookies()/headers()
 * anywhere in this tree. Shell CMS + locale hydrate client-side.
 */
export const dynamic = 'force-static'
export const revalidate = 60

export const metadata: Metadata = {
  title: 'Portfolio | Erythro.ai',
  description: 'Projects built end-to-end — AI agents, CRM systems, websites, and digital products by Erythro.ai.',
  alternates: {
    canonical: '/portfolio',
  },
  openGraph: {
    title: 'Portfolio | Erythro.ai',
    description: 'Projects built end-to-end by Erythro.ai.',
    url: `${SITE_URL}/portfolio`,
    siteName: 'Erythro.ai',
    type: 'website',
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
