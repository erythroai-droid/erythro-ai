import { uploadReportObject } from './r2Upload.js'
import { getContactSubmission, updateContactSubmission } from './payload.js'
import { sendClientAuditEmail } from './mail.js'
import { runQaAuditor } from './runQaAuditor.js'

function siteBase() {
  return (
    process.env.PAYLOAD_API_URL?.trim()?.replace(/\/+$/, '') ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/+$/, '') ||
    'https://erythro.ai'
  )
}

function formatOrderId(id) {
  const n = typeof id === 'number' ? id : Number(id)
  if (!Number.isSafeInteger(n) || n <= 0) return `AUD-${String(id).trim()}`
  return `AUD-${n}`
}

/**
 * Full audit job: QA_Auditor (Java/Playwright) → R2 → CMS → client email.
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

    const result = await runQaAuditor({
      targetUrl,
      reportLang: locale,
      planSlug,
    })

    const key = `audits/${submissionId}/${Date.now()}-${result.tierFolder}.html`
    const uploaded = await uploadReportObject({
      key,
      body: result.html,
      contentType: 'text/html; charset=utf-8',
    })

    const statusPageUrl = `${siteBase()}/audit/report/${submissionId}`
    const publicReportUrl = uploaded.url.includes('.r2.cloudflarestorage.com/')
      ? statusPageUrl
      : uploaded.url

    const patchBase = {
      auditStatus: 'report_sent',
      reportUrl: publicReportUrl,
      auditScore: result.score,
      auditSummary: {
        stub: false,
        planSlug,
        locale,
        generatedAt: startedAt,
        tier: result.summary?.tier,
        reportLang: result.summary?.reportLang,
        pageCap: result.summary?.pageCap,
        grade: result.grade,
        overallScore: result.score,
        storageKey: uploaded.key,
      },
      errorLast: null,
    }

    const htmlPreview = result.html.slice(0, 500_000).replace(/\u0000/g, '')
    try {
      await updateContactSubmission(submissionId, {
        ...patchBase,
        htmlResult: htmlPreview,
      })
    } catch (patchErr) {
      console.warn(
        `[audit] submission=${submissionId} PATCH with html failed, retry without htmlResult:`,
        patchErr instanceof Error ? patchErr.message : patchErr,
      )
      await updateContactSubmission(submissionId, patchBase)
    }

    if (clientEmail) {
      const mailed = await sendClientAuditEmail({
        to: clientEmail,
        clientName,
        targetUrl,
        statusPageUrl,
        orderId: submissionId,
        locale,
      })
      if (!mailed.sent) {
        console.warn(`[audit] submission=${submissionId} email skipped: ${mailed.reason}`)
      } else {
        console.log(
          `[audit] submission=${submissionId} email sent to client orderId=${mailed.orderId || formatOrderId(submissionId)}`,
        )
      }
    } else {
      console.warn(`[audit] submission=${submissionId} no clientEmail — skip mail`)
    }

    console.log(
      `[audit] submission=${submissionId} ok score=${result.score} orderId=${formatOrderId(submissionId)} reportUrl=${publicReportUrl}`,
    )
    return {
      ok: true,
      reportUrl: publicReportUrl,
      score: result.score,
      orderId: formatOrderId(submissionId),
    }
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
