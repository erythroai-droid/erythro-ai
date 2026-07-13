import React from 'react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import PortfolioClient from './PortfolioClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'

const SUPPORTED_LOCALES = ['en', 'ru', 'he']
const DEFAULT_LOCALE = 'en'
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
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const initialLocale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  const content = await getCachedSiteContent()

  return <PortfolioClient initialLocale={initialLocale} content={content} />
}
