import React from 'react'
import type { Metadata } from 'next'
import ContactsClient from './ContactsClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { contactsPage, tContacts } from '@/lib/contactsPage'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

/**
 * Full Route Cache / CDN: static HTML with ISR. Must not call cookies()/headers()
 * anywhere in this tree. Locale hydrates client-side (PIT-056).
 */
export const dynamic = 'force-static'
export const revalidate = 60

export const metadata: Metadata = {
  title: `${tContacts(contactsPage.title, 'en')} | Erythro.ai`,
  description: tContacts(contactsPage.metaDescription, 'en'),
  alternates: { canonical: `/${contactsPage.slug}` },
  openGraph: {
    title: `${tContacts(contactsPage.title, 'en')} | Erythro.ai`,
    description: tContacts(contactsPage.metaDescription, 'en'),
    url: `${SITE_URL}/${contactsPage.slug}`,
    siteName: 'Erythro.ai',
    type: 'website',
  },
}

export default async function ContactsPage() {
  const content = await getCachedSiteContent()

  return (
    <ContactsClient
      initialLocale="en"
      content={content}
      clientHydratePrefs
    />
  )
}
