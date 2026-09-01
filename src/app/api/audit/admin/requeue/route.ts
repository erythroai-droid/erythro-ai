import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { triggerAuditAgent } from '@/lib/auditAgentTrigger'
import { parseAuditReportId } from '@/lib/auditReport'

export const runtime = 'nodejs'

/**
 * Staff-only manual re-queue for a single audit submission.
 * Auth: Payload session cookie (not AGENT_SECRET_TOKEN).
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as {
      id?: unknown
      resetRetries?: unknown
    }
    const id = parseAuditReportId(String(body.id ?? ''))
    if (!id) {
      return NextResponse.json({ message: 'Invalid id' }, { status: 400 })
    }

    const resetRetries = body.resetRetries !== false

    const doc = await payload.findByID({
      collection: 'contact-submissions',
      id,
      depth: 0,
      user,
      overrideAccess: false,
    })

    if (!doc || doc.source !== 'audit') {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const website = typeof doc.website === 'string' ? doc.website.trim() : ''
    if (!website) {
      return NextResponse.json({ message: 'Missing website URL' }, { status: 400 })
    }

    await payload.update({
      collection: 'contact-submissions',
      id,
      data: {
        auditStatus: 'new',
        errorLast: '',
        ...(resetRetries ? { retryCount: 0 } : {}),
      },
      user,
      overrideAccess: false,
    })

    const triggered = await triggerAuditAgent({
      submissionId: id,
      targetUrl: website,
      locale:
        (typeof doc.auditLanguage === 'string' && doc.auditLanguage) ||
        (typeof doc.locale === 'string' && doc.locale) ||
        undefined,
      planSlug: typeof doc.planSlug === 'string' ? doc.planSlug : undefined,
      clientEmail: typeof doc.email === 'string' ? doc.email : undefined,
      clientName: typeof doc.name === 'string' ? doc.name : undefined,
    })

    if (!triggered.ok) {
      return NextResponse.json(
        {
          ok: false,
          id,
          queued: false,
          reason: triggered.reason,
          message: `Reset to new, but worker trigger failed: ${triggered.reason}`,
        },
        { status: 502 },
      )
    }

    return NextResponse.json({
      ok: true,
      id,
      queued: true,
      status: triggered.status,
      resetRetries,
    })
  } catch (err) {
    console.error('[api/audit/admin/requeue] failed:', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
