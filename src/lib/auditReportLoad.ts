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
  id?: number | string | null
  source?: string | null
  auditStatus?: string | null
  auditScore?: number | null
  reportUrl?: string | null
  reportAccessToken?: string | null
  htmlResult?: string | null
  auditSummary?: unknown
  website?: string | null
  paymentStatus?: string | null
  paymentAmount?: number | null
  updatedAt?: string | null
  createdAt?: string | null
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
  try {
    const payload = await getPayload({ config })
    const doc = await payload.findByID({
      collection: 'contact-submissions',
      id,
      depth: 0,
      overrideAccess: true,
      // Report HTML is served from R2 via auditSummary.storageKey (PIT-egress).
      select: { htmlResult: false },
    })
    if (!doc || doc.source !== 'audit') return null
    return doc as AuditReportDoc
  } catch (err) {
    // Payload findByID throws Not Found (status 404) for missing rows — map to null
    // so /api/audit/report returns 404 (not 500) and the LP can stop polling.
    const status =
      typeof err === 'object' && err && 'status' in err
        ? Number((err as { status?: unknown }).status)
        : NaN
    if (status === 404) return null
    const msg = err instanceof Error ? err.message : String(err)
    if (/not\s*found/i.test(msg)) return null
    throw err
  }
}

/** Preferred public path for A44 figma assets (also mirrored under /api/audit/assets). */
export const AUDIT_REPORT_ASSET_BASE = '/templates/figma-assets'

/**
 * A44 HTML uses filesystem-relative asset paths (`../../templates/figma-assets/...`).
 * When served from `/api/audit/report/[id]/html` those resolve under `/api/audit/...`
 * and 404. Map them to site-root static files (and normalize older API proxy URLs).
 */
export function rewriteAuditReportAssetUrls(html: string): string {
  return html
    .replace(/(?:\.\.\/)+templates\/figma-assets\//g, `${AUDIT_REPORT_ASSET_BASE}/`)
    .replace(/\/api\/audit\/templates\/figma-assets\//g, `${AUDIT_REPORT_ASSET_BASE}/`)
    .replace(/\/api\/audit\/assets\/figma-assets\//g, `${AUDIT_REPORT_ASSET_BASE}/`)
}

const FINDING_CLIP_STYLE = `<style data-erythro-finding-clip>
.findings-grid{overflow:hidden!important}
.finding-card,.finding-box,.finding-box .issue{box-sizing:border-box!important;max-width:100%!important;overflow:hidden!important;overflow-wrap:anywhere!important;word-break:break-word!important}
.finding-box{width:auto!important}
.finding-box .issue{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:6!important}
</style>`

/** Clip already-stored reports whose cards have no overflow rules. */
export function clipAuditReportFindingOverflow(html: string): string {
  if (html.includes('data-erythro-finding-clip')) return html
  const head = html.lastIndexOf('</head>')
  if (head >= 0) return html.slice(0, head) + FINDING_CLIP_STYLE + html.slice(head)
  return FINDING_CLIP_STYLE + html
}

/**
 * Reads only `htmlResult` for one row. `findAuditSubmission` skips the column to keep
 * Supabase egress low, so the inline copy is fetched on demand — only when R2 has nothing
 * (worker could not upload, or R2 is briefly unavailable). PIT-173.
 */
async function loadInlineHtmlResult(id: AuditReportDoc['id']): Promise<string | null> {
  const numericId = typeof id === 'number' ? id : Number(id)
  if (!Number.isFinite(numericId) || numericId <= 0) return null
  try {
    const payload = await getPayload({ config })
    const row = await payload.findByID({
      collection: 'contact-submissions',
      id: numericId,
      depth: 0,
      overrideAccess: true,
      // Include-style select: the collection beforeOperation hook leaves it as is.
      select: { htmlResult: true },
    })
    const html = (row as { htmlResult?: unknown } | null)?.htmlResult
    return typeof html === 'string' && html.length > 0 ? html : null
  } catch (err) {
    console.error('[auditReportLoad] inline htmlResult read failed:', err)
    return null
  }
}

/** Full report HTML — prefer R2 (`storageKey`); CMS `htmlResult` as fallback. */
export async function resolveAuditReportHtml(
  doc: AuditReportDoc,
  status: AuditReportStatus,
): Promise<string | null> {
  let html: string | null = null
  const key = storageKeyFromSummary(doc.auditSummary)
  if (key && (status === 'report_sent' || status === 'in_progress')) {
    const fromR2 = await getR2ObjectText(key)
    if (fromR2) html = fromR2.slice(0, AUDIT_REPORT_HTML_MAX)
  }
  if (!html && (status === 'report_sent' || status === 'in_progress')) {
    // `htmlResult` is filled only if the caller selected it; otherwise read it on demand.
    const inline =
      typeof doc.htmlResult === 'string' && doc.htmlResult.length > 0
        ? doc.htmlResult
        : await loadInlineHtmlResult(doc.id)
    if (inline) html = inline.slice(0, AUDIT_REPORT_HTML_MAX)
  }
  return html ? clipAuditReportFindingOverflow(rewriteAuditReportAssetUrls(html)) : null
}
