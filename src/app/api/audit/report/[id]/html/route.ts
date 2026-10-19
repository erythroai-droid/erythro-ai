import { NextRequest, NextResponse } from 'next/server'
import {
  consumeContactRateLimit,
  getRequestIp,
  auditReportRateLimitConfig,
} from '@/lib/contactRateLimit'
import { buildAuditReportPath, parseAuditReportId } from '@/lib/auditReport'
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

export const runtime = 'nodejs'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * Serves the A44 report as a standalone HTML document (full browser page).
 * Requires matching reportAccessToken (`?k=`).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const ip = getRequestIp(request)
  const limited = consumeContactRateLimit(
    `audit-report-html:${ip}`,
    Date.now(),
    undefined,
    auditReportRateLimitConfig(),
  )
  if (!limited.ok) {
    return new NextResponse('Too many requests. Please try again later.', {
      status: 429,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Retry-After': String(limited.retryAfterSec),
      },
    })
  }

  const { id: rawId } = await params
  const id = parseAuditReportId(rawId)
  if (!id) {
    return new NextResponse('Invalid id', { status: 400 })
  }

  const accessKey = parseReportAccessToken(request.nextUrl.searchParams.get('k'))
  if (!accessKey) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const doc = await findAuditSubmission(id)
    if (!doc || !reportAccessTokenMatches(doc.reportAccessToken, accessKey)) {
      return new NextResponse('Not found', { status: 404 })
    }
    if (
      isUnpaidAuditCheckout({
        paymentStatus: doc.paymentStatus,
        paymentAmount: doc.paymentAmount,
      })
    ) {
      return new NextResponse('Not found', { status: 404 })
    }

    const status = normalizeAuditStatus(doc.auditStatus)
    if (status !== 'report_sent') {
      return NextResponse.redirect(
        new URL(buildAuditReportPath(id, accessKey), request.url),
        302,
      )
    }

    const html = await resolveAuditReportHtml(doc, status)
    if (!html) {
      return new NextResponse('Report HTML not available yet', { status: 404 })
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[api/audit/report/html] failed:', err)
    return new NextResponse('Server error', { status: 500 })
  }
}
