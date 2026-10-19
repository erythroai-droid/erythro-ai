import { NextRequest, NextResponse } from 'next/server'
import {
  consumeContactRateLimit,
  getRequestIp,
  auditReportRateLimitConfig,
} from '@/lib/contactRateLimit'
import {
  buildAuditReportHtmlPath,
  isPublicReportUrl,
  formatAuditOrderId,
  parseAuditReportId,
  type AuditReportPublicPayload,
} from '@/lib/auditReport'
import {
  parseReportAccessToken,
  reportAccessTokenMatches,
} from '@/lib/auditReportAccess'
import { isUnpaidAuditCheckout } from '@/lib/auditPaymentGate'
import {
  findAuditSubmission,
  normalizeAuditStatus,
} from '@/lib/auditReportLoad'

export const runtime = 'nodejs'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * Status endpoint for /audit/report/[id]?k=… polling.
 * Requires matching reportAccessToken. Ready reports open via …/html?k=…
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const ip = getRequestIp(request)
  const limited = consumeContactRateLimit(
    `audit-report:${ip}`,
    Date.now(),
    undefined,
    auditReportRateLimitConfig(),
  )
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

  const accessKey = parseReportAccessToken(request.nextUrl.searchParams.get('k'))
  if (!accessKey) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }

  try {
    const doc = await findAuditSubmission(id)
    if (!doc || !reportAccessTokenMatches(doc.reportAccessToken, accessKey)) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }
    if (
      isUnpaidAuditCheckout({
        paymentStatus: doc.paymentStatus,
        paymentAmount: doc.paymentAmount,
      })
    ) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const status = normalizeAuditStatus(doc.auditStatus)

    const body: AuditReportPublicPayload = {
      id,
      orderId: formatAuditOrderId(id),
      status,
      auditScore: typeof doc.auditScore === 'number' ? doc.auditScore : null,
      reportUrl:
        typeof doc.reportUrl === 'string' && isPublicReportUrl(doc.reportUrl)
          ? doc.reportUrl
          : null,
      htmlPreview: null,
      readyHtmlUrl: status === 'report_sent' ? buildAuditReportHtmlPath(id, accessKey) : null,
      website: typeof doc.website === 'string' ? doc.website : null,
      updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : null,
      createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : null,
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
