import { NextRequest, NextResponse } from 'next/server'
import { reconcileRequestAuthorized } from '@/lib/agentAuth'
import { sendOpsAlert } from '@/lib/contactNotification'
import { canonicalSiteOrigin } from '@/lib/vercelHost'

export const runtime = 'nodejs'
export const maxDuration = 30
export const dynamic = 'force-dynamic'

const SITE_URL = canonicalSiteOrigin()

/**
 * Hourly probe of production sitemap.xml. Auth: Vercel Cron Bearer CRON_SECRET
 * or the same headers as `/api/audit/reconcile`.
 */
export async function GET(request: NextRequest) {
  if (!reconcileRequestAuthorized(request.headers)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const sitemapUrl = `${SITE_URL}/sitemap.xml`
  let status = 0
  let ok = false
  let error: string | undefined

  try {
    const res = await fetch(sitemapUrl, {
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
      headers: { Accept: 'application/xml,text/xml,*/*' },
    })
    status = res.status
    const body = await res.text()
    ok =
      res.ok &&
      /<urlset[\s>]/i.test(body) &&
      body.includes(SITE_URL)
    if (!ok) {
      error = `status=${status} bytes=${body.length} hasUrlset=${/<urlset[\s>]/i.test(body)}`
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
  }

  if (ok) {
    return NextResponse.json(
      { ok: true, status, url: sitemapUrl },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const subject = `[erythro.ai] sitemap.xml ${status >= 500 ? status : 'failed'}`
  const text = [
    `Sitemap health check failed.`,
    `URL: ${sitemapUrl}`,
    `HTTP status: ${status || 'n/a'}`,
    `Error: ${error || 'unknown'}`,
    `Time: ${new Date().toISOString()}`,
  ].join('\n')
  console.error('[cron/sitemap-health]', text)

  const alert = await sendOpsAlert(subject, text)
  return NextResponse.json(
    {
      ok: false,
      status: status || 0,
      url: sitemapUrl,
      error,
      alertSent: alert.sent,
      alertReason: alert.reason,
    },
    { status: 500, headers: { 'Cache-Control': 'no-store' } },
  )
}
