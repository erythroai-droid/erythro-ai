import { getPayload } from 'payload'
import config from '@payload-config'
import { getR2ObjectText } from '@/lib/r2'
import type { AuditReportStatus } from '@/lib/auditReport'

export const AUDIT_REPORT_HTML_MAX = 2_000_000

const ALLOWED_STATUS = new Set<AuditReportStatus>([
  'new',
  'in_progress',
  'report_sent',
  'failed',
])

export type AuditReportDoc = {
  source?: string | null
  auditStatus?: string | null
  auditScore?: number | null
  reportUrl?: string | null
  htmlResult?: string | null
  auditSummary?: unknown
  website?: string | null
  updatedAt?: string | null
}

export function storageKeyFromSummary(summary: unknown): string | null {
  if (!summary || typeof summary !== 'object') return null
  const key = (summary as { storageKey?: unknown }).storageKey
  return typeof key === 'string' && key.trim() ? key.trim() : null
}

export function normalizeAuditStatus(raw: unknown): AuditReportStatus {
  const status = typeof raw === 'string' ? raw : 'new'
  return ALLOWED_STATUS.has(status as AuditReportStatus)
    ? (status as AuditReportStatus)
    : 'new'
}

export async function findAuditSubmission(id: number): Promise<AuditReportDoc | null> {
  const payload = await getPayload({ config })
  const doc = await payload.findByID({
    collection: 'contact-submissions',
    id,
    depth: 0,
    overrideAccess: true,
  })
  if (!doc || doc.source !== 'audit') return null
  return doc as AuditReportDoc
}

/**
 * A44 HTML uses filesystem-relative asset paths (`../../templates/figma-assets/...`).
 * When served from `/api/audit/report/[id]/html` those resolve under `/api/audit/...`
 * and 404. Map them to site-root static files in `public/templates/figma-assets/`.
 */
export function rewriteAuditReportAssetUrls(html: string): string {
  return html
    .replace(/(?:\.\.\/)+templates\/figma-assets\//g, '/templates/figma-assets/')
    .replace(/\/api\/audit\/templates\/figma-assets\//g, '/templates/figma-assets/')
}

/** Full report HTML from CMS or R2. */
export async function resolveAuditReportHtml(
  doc: AuditReportDoc,
  status: AuditReportStatus,
): Promise<string | null> {
  let html: string | null = null
  if (typeof doc.htmlResult === 'string' && doc.htmlResult.length > 0) {
    html = doc.htmlResult.slice(0, AUDIT_REPORT_HTML_MAX)
  } else if (status === 'report_sent') {
    const key = storageKeyFromSummary(doc.auditSummary)
    if (key) {
      const fromR2 = await getR2ObjectText(key)
      if (fromR2) html = fromR2.slice(0, AUDIT_REPORT_HTML_MAX)
    }
  }
  return html ? rewriteAuditReportAssetUrls(html) : null
}
