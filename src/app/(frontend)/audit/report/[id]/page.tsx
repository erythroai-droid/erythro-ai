import React from 'react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import AuditReportClient from './AuditReportClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getRequestPrefs } from '@/lib/requestPrefs'
import { isSiteLocale } from '@/lib/sitePrefs'
import {
  auditReportCopy,
  buildAuditReportHtmlPath,
  parseAuditReportId,
  tReport,
} from '@/lib/auditReport'
import {
  parseReportAccessToken,
  reportAccessTokenMatches,
} from '@/lib/auditReportAccess'
import { isUnpaidAuditCheckout } from '@/lib/auditPaymentGate'
import {
  findAuditSubmission,
  normalizeAuditStatus,
  resolveAuditReportHtml,
} from '@/lib/auditReportLoad'

const SUPPORTED_LOCALES = ['en', 'ru', 'he']
const DEFAULT_LOCALE = 'en'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ k?: string; lang?: string }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params
  const { lang: langParam } = await searchParams
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const locale = isSiteLocale(langParam)
    ? langParam
    : cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)
      ? cookieLocale
      : DEFAULT_LOCALE

  const title = `${tReport(auditReportCopy.title, locale)} | Erythro.ai`
  const description = tReport(auditReportCopy.waiting, locale)

  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: `/audit/report/${id}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/audit/report/${id}`,
      siteName: 'Erythro.ai',
      type: 'website',
    },
  }
}

export default async function AuditReportPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { k: rawKey, lang: langParam } = await searchParams
  const reportId = parseAuditReportId(id)
  const accessKey = parseReportAccessToken(rawKey)
  if (!reportId || !accessKey) {
    notFound()
  }

  let ready = false
  try {
    const doc = await findAuditSubmission(reportId)
    if (!doc || !reportAccessTokenMatches(doc.reportAccessToken, accessKey)) {
      notFound()
    }
    if (
      isUnpaidAuditCheckout({
        paymentStatus: doc.paymentStatus,
        paymentAmount: doc.paymentAmount,
      })
    ) {
      notFound()
    }
    const status = normalizeAuditStatus(doc.auditStatus)
    if (status === 'report_sent') {
      const html = await resolveAuditReportHtml(doc, status)
      ready = Boolean(html)
    }
  } catch {
    // Fall through to status UI if CMS/R2 is briefly unavailable
  }
  if (ready) {
    redirect(buildAuditReportHtmlPath(reportId, accessKey))
  }

  const prefs = await getRequestPrefs()
  // Prefer ?lang= from ads LP (cross-subdomain; cookie on audit-* does not apply here).
  const initialLocale = isSiteLocale(langParam) ? langParam : prefs.initialLocale
  const content = await getCachedSiteContent()

  return (
    <AuditReportClient
      reportId={id}
      accessKey={accessKey}
      initialLocale={initialLocale}
      initialTheme={prefs.initialTheme}
      content={content}
    />
  )
}
