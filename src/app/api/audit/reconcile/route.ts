import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { triggerAuditAgent } from '@/lib/auditAgentTrigger'

export const runtime = 'nodejs'

const DEFAULT_STALE_MINUTES = 10
const MAX_RETRIES = 3

function authorized(request: NextRequest): boolean {
  const secret = process.env.AGENT_SECRET_TOKEN?.trim()
  if (!secret) return false
  return request.headers.get('x-agent-secret-key') === secret
}

/**
 * Cron / n8n entry: find stuck audit submissions and re-queue the worker.
 * Secured by the same AGENT_SECRET_TOKEN as the VPS agent.
 */
export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  let staleMinutes = DEFAULT_STALE_MINUTES
  try {
    const body = (await request.json().catch(() => ({}))) as { staleMinutes?: number }
    if (typeof body.staleMinutes === 'number' && body.staleMinutes > 0) {
      staleMinutes = Math.min(Math.floor(body.staleMinutes), 120)
    }
  } catch {
    /* empty body ok */
  }

  const cutoff = new Date(Date.now() - staleMinutes * 60_000).toISOString()

  try {
    const payload = await getPayload({ config })
    const found = await payload.find({
      collection: 'contact-submissions',
      depth: 0,
      limit: 25,
      overrideAccess: true,
      where: {
        and: [
          { source: { equals: 'audit' } },
          {
            or: [
              { auditStatus: { equals: 'new' } },
              { auditStatus: { equals: 'in_progress' } },
            ],
          },
          { updatedAt: { less_than: cutoff } },
        ],
      },
      sort: 'updatedAt',
    })

    const results: Array<Record<string, unknown>> = []

    for (const doc of found.docs) {
      const website = typeof doc.website === 'string' ? doc.website.trim() : ''
      if (!website) {
        results.push({ id: doc.id, action: 'skip', reason: 'no_website' })
        continue
      }

      const retries = typeof doc.retryCount === 'number' ? doc.retryCount : 0
      if (retries >= MAX_RETRIES) {
        await payload.update({
          collection: 'contact-submissions',
          id: doc.id,
          data: {
            auditStatus: 'failed',
            errorLast: `Auto-failed after ${MAX_RETRIES} reconcile retries`,
          },
          overrideAccess: true,
        })
        results.push({ id: doc.id, action: 'failed', retryCount: retries })
        continue
      }

      const nextRetry = retries + 1
      await payload.update({
        collection: 'contact-submissions',
        id: doc.id,
        data: { retryCount: nextRetry },
        overrideAccess: true,
      })

      const triggered = await triggerAuditAgent({
        submissionId: doc.id,
        targetUrl: website,
        locale:
          (typeof doc.auditLanguage === 'string' && doc.auditLanguage) ||
          (typeof doc.locale === 'string' && doc.locale) ||
          undefined,
        planSlug: typeof doc.planSlug === 'string' ? doc.planSlug : undefined,
        clientEmail: typeof doc.email === 'string' ? doc.email : undefined,
        clientName: typeof doc.name === 'string' ? doc.name : undefined,
      })

      results.push({
        id: doc.id,
        action: 'requeue',
        retryCount: nextRetry,
        queued: triggered.ok,
        reason: triggered.ok ? undefined : triggered.reason,
      })
    }

    return NextResponse.json({
      ok: true,
      staleMinutes,
      scanned: found.docs.length,
      results,
    })
  } catch (err) {
    console.error('[api/audit/reconcile] failed:', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
