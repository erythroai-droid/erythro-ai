import React from 'react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import ContactsClient from './ContactsClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { contactsPage, tContacts } from '@/lib/contactsPage'
import { getRequestPrefs } from '@/lib/requestPrefs'

const SUPPORTED_LOCALES = ['en', 'ru', 'he']
const DEFAULT_LOCALE = 'en'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const locale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  const title = `${tContacts(contactsPage.title, locale)} | Erythro.ai`
  const description = tContacts(contactsPage.metaDescription, locale)

  return {
    title,
    description,
    alternates: { canonical: `/${contactsPage.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${contactsPage.slug}`,
      siteName: 'Erythro.ai',
      type: 'website',
    },
  }
}

export default async function ContactsPage() {
  const { initialLocale, initialTheme } = await getRequestPrefs()
  const content = await getCachedSiteContent()

  return (
    <ContactsClient
      initialLocale={initialLocale}
      initialTheme={initialTheme}
      content={content}
    />
  )
}
