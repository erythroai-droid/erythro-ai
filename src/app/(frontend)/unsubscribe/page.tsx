import React from 'react'
import type { Metadata } from 'next'
import UnsubscribeClient from './UnsubscribeClient'
import {
  unsubscribeCopy,
  verifyMailUnsubscribeToken,
} from '@/lib/mailUnsubscribe'
import { isSiteLocale } from '@/lib/sitePrefs'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ t?: string; lang?: string }>
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!user || !domain) return email
  const visible = user.slice(0, Math.min(2, user.length))
  return `${visible}***@${domain}`
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { lang } = await searchParams
  const locale = isSiteLocale(lang) ? lang : 'en'
  const copy = unsubscribeCopy(locale)
  return {
    title: `${copy.title} | Erythro.ai`,
    robots: { index: false, follow: false },
  }
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { t, lang } = await searchParams
  const locale = isSiteLocale(lang) ? lang : 'en'
  const email = verifyMailUnsubscribeToken(t)
  return (
    <UnsubscribeClient
      locale={locale}
      token={email && t ? t.trim() : null}
      emailMasked={email ? maskEmail(email) : null}
    />
  )
}
