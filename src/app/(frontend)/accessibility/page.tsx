import React from 'react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import LegalPageClient from '../legal/LegalPageClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getLegalPage, tLegal } from '@/lib/legalPages'

const SUPPORTED_LOCALES = ['en', 'ru', 'he']
const DEFAULT_LOCALE = 'en'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'
const PAGE_ID = 'accessibility' as const

export async function generateMetadata(): Promise<Metadata> {
  const page = getLegalPage(PAGE_ID)
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
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const initialLocale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE
  const content = await getCachedSiteContent()

  return <LegalPageClient initialLocale={initialLocale} content={content} pageId={PAGE_ID} />
}
