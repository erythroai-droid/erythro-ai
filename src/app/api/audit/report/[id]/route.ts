import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  consumeContactRateLimit,
  getRequestIp,
} from '@/lib/contactRateLimit'
import {
  AUDIT_REPORT_HTML_PREVIEW_MAX,
  isPublicReportUrl,
  parseAuditReportId,
  type AuditReportPublicPayload,
  type AuditReportStatus,
} from '@/lib/auditReport'
import { getR2ObjectText } from '@/lib/r2'

export const runtime = 'nodejs'

const ALLOWED_STATUS = new Set<AuditReportStatus>([
  'new',
  'in_progress',
  'report_sent',
  'failed',
])

type RouteParams = { params: Promise<{ id: string }> }

function storageKeyFromSummary(summary: unknown): string | null {
  if (!summary || typeof summary !== 'object') return null
  const key = (summary as { storageKey?: unknown }).storageKey
  return typeof key === 'string' && key.trim() ? key.trim() : null
}

/**
 * Public, non-PII status endpoint for /audit/report/[id] polling.
 * Does not return name, email, phone, or error stacks.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const ip = getRequestIp(request)
  const limited = consumeContactRateLimit(`audit-report:${ip}`)
  if (!limited.ok) {
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(limited.retryAfterSec),
          'X-RateLimit-Limit': String(limited.limit),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  const { id: rawId } = await params
  const id = parseAuditReportId(rawId)
  if (!id) {
    return NextResponse.json({ message: 'Invalid id' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })
    const doc = await payload.findByID({
      collection: 'contact-submissions',
      id,
      depth: 0,
      overrideAccess: true,
    })

    if (!doc || doc.source !== 'audit') {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const statusRaw = (doc.auditStatus || 'new') as string
    const status: AuditReportStatus = ALLOWED_STATUS.has(statusRaw as AuditReportStatus)
      ? (statusRaw as AuditReportStatus)
      : 'new'

    let html: string | null =
      typeof doc.htmlResult === 'string' && doc.htmlResult.length > 0
        ? doc.htmlResult.slice(0, AUDIT_REPORT_HTML_PREVIEW_MAX)
        : null

    // Fallback: pull HTML from R2 when CMS htmlResult could not be persisted
    if (!html && status === 'report_sent') {
      const key = storageKeyFromSummary(doc.auditSummary)
      if (key) {
        const fromR2 = await getR2ObjectText(key)
        if (fromR2) html = fromR2.slice(0, AUDIT_REPORT_HTML_PREVIEW_MAX)
      }
    }

    const body: AuditReportPublicPayload = {
      id,
      status,
      auditScore: typeof doc.auditScore === 'number' ? doc.auditScore : null,
      reportUrl:
        typeof doc.reportUrl === 'string' && isPublicReportUrl(doc.reportUrl)
          ? doc.reportUrl
          : null,
      htmlPreview: status === 'report_sent' ? html : null,
      website: typeof doc.website === 'string' ? doc.website : null,
      updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : null,
    }

    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'no-store',
        'X-RateLimit-Limit': String(limited.limit),
        'X-RateLimit-Remaining': String(limited.remaining),
      },
    })
  } catch (err) {
    console.error('[api/audit/report] failed:', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
