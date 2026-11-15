import React from 'react'
import type { Metadata } from 'next'
import ContactsClient from './ContactsClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { contactsPage, tContacts } from '@/lib/contactsPage'
import { defaultShareImages } from '@/lib/ogImages'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

/**
 * Full Route Cache / CDN: static HTML with ISR. Must not call cookies()/headers()
 * anywhere in this tree. Locale hydrates client-side (PIT-056).
 */
export const dynamic = 'force-static'
export const revalidate = 60

const CONTACTS_TITLE = `${tContacts(contactsPage.title, 'en')} | Erythro.ai`
const CONTACTS_DESCRIPTION = tContacts(contactsPage.metaDescription, 'en')
const { openGraphImages, twitterImages } = defaultShareImages(CONTACTS_TITLE)

export const metadata: Metadata = {
  title: CONTACTS_TITLE,
  description: CONTACTS_DESCRIPTION,
  alternates: { canonical: `/${contactsPage.slug}` },
  // Child openGraph replaces layout OG — must include images (PIT-079).
  openGraph: {
    title: CONTACTS_TITLE,
    description: CONTACTS_DESCRIPTION,
    url: `${SITE_URL}/${contactsPage.slug}`,
    siteName: 'Erythro.ai',
    type: 'website',
    images: openGraphImages,
  },
  twitter: {
    card: 'summary_large_image',
    title: CONTACTS_TITLE,
    description: CONTACTS_DESCRIPTION,
    images: twitterImages,
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
