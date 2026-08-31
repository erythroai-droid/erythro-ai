import { NextRequest, NextResponse } from 'next/server'
import {
  consumeContactRateLimit,
  getRequestIp,
} from '@/lib/contactRateLimit'
import {
  isPublicReportUrl,
  parseAuditReportId,
  type AuditReportPublicPayload,
} from '@/lib/auditReport'
import {
  findAuditSubmission,
  normalizeAuditStatus,
} from '@/lib/auditReportLoad'

export const runtime = 'nodejs'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * Public, non-PII status endpoint for /audit/report/[id] polling.
 * Ready reports are opened via GET /api/audit/report/[id]/html (full page).
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
    const doc = await findAuditSubmission(id)
    if (!doc) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const status = normalizeAuditStatus(doc.auditStatus)

    const body: AuditReportPublicPayload = {
      id,
      status,
      auditScore: typeof doc.auditScore === 'number' ? doc.auditScore : null,
      reportUrl:
        typeof doc.reportUrl === 'string' && isPublicReportUrl(doc.reportUrl)
          ? doc.reportUrl
          : null,
      htmlPreview: null,
      readyHtmlUrl: status === 'report_sent' ? `/api/audit/report/${id}/html` : null,
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
