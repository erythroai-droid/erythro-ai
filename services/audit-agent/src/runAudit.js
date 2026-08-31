import { uploadReportObject } from './r2Upload.js'
import { getContactSubmission, updateContactSubmission } from './payload.js'
import { sendClientAuditEmail } from './mail.js'

function siteBase() {
  return (
    process.env.PAYLOAD_API_URL?.trim()?.replace(/\/+$/, '') ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/+$/, '') ||
    'https://erythro.ai'
  )
}

/**
 * Skeleton audit job: stub HTML → R2 → CMS → client email.
 * Real Playwright / LLM will replace the stub body later.
 *
 * @param {{
 *   submissionId: number|string,
 *   targetUrl: string,
 *   locale?: string,
 *   planSlug?: string,
 *   clientEmail?: string,
 *   clientName?: string,
 * }} job
 */
export async function runAuditJob(job) {
  const startedAt = new Date().toISOString()
  const submissionId = job.submissionId
  const targetUrl = job.targetUrl
  const locale = job.locale || 'en'
  const planSlug = job.planSlug || 'audit-free'
  let clientEmail = job.clientEmail?.trim() || ''
  let clientName = job.clientName?.trim() || ''

  try {
    if (!clientEmail) {
      const doc = await getContactSubmission(submissionId)
      if (doc?.email) clientEmail = String(doc.email).trim()
      if (!clientName && doc?.name) clientName = String(doc.name).trim()
    }

    await updateContactSubmission(submissionId, {
      auditStatus: 'in_progress',
    })

    const html = `<!DOCTYPE html>
<html lang="${escapeHtml(locale)}">
<head>
  <meta charset="utf-8" />
  <title>Erythro.ai Audit stub — ${escapeHtml(targetUrl)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; }
    code { background: #f4f4f5; padding: 0.1em 0.35em; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>AI Audit report (skeleton)</h1>
  <p>Target: <a href="${escapeAttr(targetUrl)}">${escapeHtml(targetUrl)}</a></p>
  <p>Plan: <code>${escapeHtml(planSlug)}</code> · Locale: <code>${escapeHtml(locale)}</code></p>
  <p>Submission: <code>${escapeHtml(String(submissionId))}</code></p>
  <p>Generated at: <code>${escapeHtml(startedAt)}</code></p>
  <p>This is a placeholder. Playwright + LLM analysis will replace this page.</p>
</body>
</html>`

    const key = `audits/${submissionId}/${Date.now()}-stub.html`
    const { url } = await uploadReportObject({
      key,
      body: html,
      contentType: 'text/html; charset=utf-8',
    })

    const statusPageUrl = `${siteBase()}/audit/report/${submissionId}`

    // Atomic delivery order: storage + DB first, then email
    await updateContactSubmission(submissionId, {
      auditStatus: 'report_sent',
      reportUrl: url,
      auditScore: 0,
      auditSummary: {
        stub: true,
        targetUrl,
        planSlug,
        locale,
        generatedAt: startedAt,
      },
      htmlResult: html.slice(0, 100_000),
      errorLast: null,
    })

    if (clientEmail) {
      const mailed = await sendClientAuditEmail({
        to: clientEmail,
        clientName,
        targetUrl,
        reportUrl: url,
        statusPageUrl,
        locale,
      })
      if (!mailed.sent) {
        console.warn(`[audit] submission=${submissionId} email skipped: ${mailed.reason}`)
      } else {
        console.log(`[audit] submission=${submissionId} email sent to client`)
      }
    } else {
      console.warn(`[audit] submission=${submissionId} no clientEmail — skip mail`)
    }

    console.log(`[audit] submission=${submissionId} ok reportUrl=${url}`)
    return { ok: true, reportUrl: url }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[audit] submission=${submissionId} failed:`, message)
    try {
      await updateContactSubmission(submissionId, {
        auditStatus: 'failed',
        errorLast: message.slice(0, 4000),
      })
    } catch (updateErr) {
      console.error('[audit] failed to persist errorLast', updateErr)
    }
    return { ok: false, error: message }
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function escapeAttr(s) {
  return escapeHtml(s).replaceAll("'", '&#39;')
}
