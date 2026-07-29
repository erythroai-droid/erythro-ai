import React from 'react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import LegalPageClient from '../legal/LegalPageClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getCachedLegalPage, tLegal } from '@/lib/legalPages'
import { getRequestPrefs } from '@/lib/requestPrefs'

const SUPPORTED_LOCALES = ['en', 'ru', 'he']
const DEFAULT_LOCALE = 'en'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'
const PAGE_ID = 'accessibility' as const

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCachedLegalPage(PAGE_ID)
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const locale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  const title = `${tLegal(page.title, locale)} | Erythro.ai`
  const description = tLegal(page.metaDescription, locale)

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

export default async function AccessibilityStatementPage() {
  const { initialLocale, initialTheme } = await getRequestPrefs()
  const [content, page] = await Promise.all([getCachedSiteContent(), getCachedLegalPage(PAGE_ID)])

  return (
    <LegalPageClient
      initialLocale={initialLocale}
      initialTheme={initialTheme}
      content={content}
      page={page}
    />
  )
}
