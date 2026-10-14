import React from 'react'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import AuditReportClient from './AuditReportClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getRequestPrefs } from '@/lib/requestPrefs'
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
  searchParams: Promise<{ k?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const locale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

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
  const { k: rawKey } = await searchParams
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

  const { initialLocale, initialTheme } = await getRequestPrefs()
  const content = await getCachedSiteContent()

  return (
    <AuditReportClient
      reportId={id}
      accessKey={accessKey}
      initialLocale={initialLocale}
      initialTheme={initialTheme}
      content={content}
    />
  )
}
