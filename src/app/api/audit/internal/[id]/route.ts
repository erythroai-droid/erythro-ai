import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { agentSecretAuthorized } from '@/lib/agentAuth'
import { parseAuditReportId } from '@/lib/auditReport'

export const runtime = 'nodejs'

type RouteParams = { params: Promise<{ id: string }> }

function authorized(request: NextRequest): boolean {
  return agentSecretAuthorized(request.headers.get('x-agent-secret-key'))
}

/** Worker reads submission fields needed for email / retries (includes email). */
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!authorized(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id: rawId } = await params
  const id = parseAuditReportId(rawId)
  if (!id) return NextResponse.json({ message: 'Invalid id' }, { status: 400 })

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

    return NextResponse.json({
      id,
      email: doc.email,
      name: doc.name,
      website: doc.website,
      auditLanguage: doc.auditLanguage,
      locale: doc.locale,
      planSlug: doc.planSlug,
      auditStatus: doc.auditStatus,
      auditScore: doc.auditScore ?? null,
      reportUrl: doc.reportUrl,
      retryCount: doc.retryCount ?? 0,
      storageKey:
        doc.auditSummary &&
        typeof doc.auditSummary === 'object' &&
        typeof (doc.auditSummary as { storageKey?: unknown }).storageKey === 'string'
          ? (doc.auditSummary as { storageKey: string }).storageKey
          : null,
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
    })
  } catch (err) {
    console.error('[api/audit/internal] GET failed:', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

/**
 * Worker updates pipeline fields after R2 / failure.
 * All writes go through SQL: Payload textarea validation rejects large A44 HTML
 * and also re-validates existing html_result on later partial updates.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!authorized(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id: rawId } = await params
  const id = parseAuditReportId(rawId)
  if (!id) return NextResponse.json({ message: 'Invalid id' }, { status: 400 })

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const allowed = [
    'auditStatus',
    'auditScore',
    'auditSummary',
    'reportUrl',
    'htmlResult',
    'retryCount',
    'errorLast',
  ] as const

  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }
  if (!Object.keys(data).length) {
    return NextResponse.json({ message: 'No updatable fields' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })
    const existing = await payload.findByID({
      collection: 'contact-submissions',
      id,
      depth: 0,
      overrideAccess: true,
    })
    if (!existing || existing.source !== 'audit') {
      return NextResponse.json({ message: 'Not found' }, { status: 404 })
    }

    const sets: ReturnType<typeof sql>[] = []
    if (typeof data.auditStatus === 'string') {
      sets.push(sql`audit_status = ${data.auditStatus}`)
    }
    if (typeof data.auditScore === 'number') {
      sets.push(sql`audit_score = ${data.auditScore}`)
    } else if (data.auditScore === null) {
      sets.push(sql`audit_score = null`)
    }
    if (data.auditSummary !== undefined) {
      sets.push(sql`audit_summary = ${JSON.stringify(data.auditSummary)}::jsonb`)
    }
    if (typeof data.reportUrl === 'string' || data.reportUrl === null) {
      sets.push(sql`report_url = ${data.reportUrl}`)
    }
    if (typeof data.htmlResult === 'string') {
      sets.push(sql`html_result = ${data.htmlResult.replace(/\u0000/g, '')}`)
    } else if (data.htmlResult === null) {
      sets.push(sql`html_result = null`)
    }
    if (typeof data.retryCount === 'number') {
      sets.push(sql`retry_count = ${data.retryCount}`)
    }
    if (typeof data.errorLast === 'string' || data.errorLast === null) {
      sets.push(sql`error_last = ${data.errorLast}`)
    }
    sets.push(sql`updated_at = now()`)

    // drizzle sql.join for SET clauses
    let setSql = sets[0]!
    for (let i = 1; i < sets.length; i++) {
      setSql = sql`${setSql}, ${sets[i]!}`
    }

    await payload.db.drizzle.execute(
      sql`update contact_submissions set ${setSql} where id = ${id}`,
    )

    const refreshed = await payload.findByID({
      collection: 'contact-submissions',
      id,
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json({
      ok: true,
      id,
      auditStatus: refreshed?.auditStatus ?? data.auditStatus ?? existing.auditStatus,
      htmlSaved: typeof data.htmlResult === 'string',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/audit/internal] PATCH failed:', message)
    return NextResponse.json(
      { message: 'Server error', detail: message.slice(0, 500) },
      { status: 500 },
    )
  }
}
