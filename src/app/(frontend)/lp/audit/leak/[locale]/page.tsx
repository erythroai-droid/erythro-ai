import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LeakLpClient from '@/components/leak-lp/LeakLpClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getCachedAuditPage } from '@/lib/auditPage.server'
import { AUDIT_LP_LOCALES, isAuditLpLocale } from '@/lib/auditLp'
import { tCalc } from '@/lib/auditCalcCopy'
import { leakLpCopy } from '@/lib/leakLpCopy'

// Test route for the new premium leak landing. Not linked anywhere and noindex until it replaces /lp/audit/calc.
export const dynamic = 'force-static'
export const revalidate = 3600

export function generateStaticParams() {
  return AUDIT_LP_LOCALES.map((locale) => ({ locale }))
}

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isAuditLpLocale(locale)) return {}
  return {
    title: `${tCalc(leakLpCopy.metaTitle, locale)} | Erythro.ai`,
    description: tCalc(leakLpCopy.metaDescription, locale),
    robots: { index: false, follow: false },
  }
}

export default async function LeakLpPage({ params }: PageProps) {
  const { locale } = await params
  if (!isAuditLpLocale(locale)) notFound()
  const [content, auditPageContent] = await Promise.all([getCachedSiteContent(), getCachedAuditPage()])
  return <LeakLpClient locale={locale} content={content} auditPageContent={auditPageContent} />
}
