import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { parseAuditReportId } from '@/lib/auditReport'

export const runtime = 'nodejs'

type RouteParams = { params: Promise<{ id: string }> }

function authorized(request: NextRequest): boolean {
  const secret = process.env.AGENT_SECRET_TOKEN?.trim()
  if (!secret) return false
  return request.headers.get('x-agent-secret-key') === secret
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

/** Worker updates pipeline fields after R2 / failure. */
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

    // Payload maps textarea→varchar and rejects large A44 HTML ("Html Result" invalid).
    // Persist full HTML via SQL text column, then update the rest through Payload.
    const htmlResult =
      typeof data.htmlResult === 'string' ? data.htmlResult.replace(/\u0000/g, '') : null
    if (htmlResult !== null) {
      delete data.htmlResult
      const { sql } = await import('@payloadcms/db-postgres')
      await payload.db.drizzle.execute(
        sql`update contact_submissions set html_result = ${htmlResult}, updated_at = now() where id = ${id}`,
      )
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ ok: true, id, auditStatus: existing.auditStatus, htmlSaved: true })
    }

    const updated = await payload.update({
      collection: 'contact-submissions',
      id,
      data,
      overrideAccess: true,
    })

    return NextResponse.json({
      ok: true,
      id: updated.id,
      auditStatus: updated.auditStatus,
      htmlSaved: htmlResult !== null,
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
