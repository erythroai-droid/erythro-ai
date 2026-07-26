import React from 'react'
import type { Metadata } from 'next'
import PortfolioClient from './PortfolioClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getCachedPortfolioProjects } from '@/lib/cmsPages'
import { getRequestPrefs } from '@/lib/requestPrefs'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

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
  const { initialLocale, initialTheme } = await getRequestPrefs()

  const [content, projects] = await Promise.all([
    getCachedSiteContent(),
    getCachedPortfolioProjects(initialLocale),
  ])

  return (
    <PortfolioClient
      initialLocale={initialLocale}
      initialTheme={initialTheme}
      content={content}
      projects={projects}
    />
  )
}
