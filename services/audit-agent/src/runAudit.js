import { uploadReportObject } from './r2Upload.js'
import {
  getContactSubmission,
  scheduleProOfferEmail,
  updateContactSubmission,
} from './payload.js'
import { sendClientAuditEmail } from './mail.js'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { detectBotChallenge } from './botChallenge.js'
import { buildAuditPdfFilename, formatAuditOrderId } from './pdfFilename.js'
import { planAttachesPdf, planToTier, runQaAuditor } from './runQaAuditor.js'

/**
 * The page explaining that the site is behind bot protection, built from the approved report
 * template of this tier and language (QA_Auditor/scripts/render-blocked-report.mjs, PIT-149).
 */
async function renderBlockedHtml({ targetUrl, locale, planSlug, challenge }) {
  const qaDir = process.env.QA_AUDITOR_DIR?.trim() || '/app/QA_Auditor'
  const mod = await import(pathToFileURL(path.join(qaDir, 'scripts', 'render-blocked-report.mjs')).href)
  let site = targetUrl
  try {
    site = new URL(targetUrl).hostname.replace(/^www\./, '')
  } catch {
    /* keep the raw value */
  }
  return mod.renderBlockedReport({
    site,
    lang: String(locale || 'en').slice(0, 2).toLowerCase(),
    tier: planToTier(planSlug).folder,
    protection: challenge.protection,
    status: challenge.status,
  })
}

function siteBase() {
  return (
    process.env.PAYLOAD_API_URL?.trim()?.replace(/\/+$/, '') ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/+$/, '') ||
    'https://erythro.ai'
  )
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
 *   notifyClient?: boolean,
 * }} job
 */
export async function runAuditJob(job) {
  const startedAt = new Date().toISOString()
  const submissionId = job.submissionId
  const targetUrl = job.targetUrl
  const locale = job.locale || 'en'
  const planSlug = job.planSlug || 'audit-free'
  const notifyClient = job.notifyClient !== false
  let clientEmail = job.clientEmail?.trim() || ''
  let clientName = job.clientName?.trim() || ''

  /** @type {string} */
  let reportAccessToken = ''
  /** @type {string|null} */
  let leadChannel = null

  try {
    const doc = await getContactSubmission(submissionId)
    if (doc) {
      if (!clientEmail && doc.email) clientEmail = String(doc.email).trim()
      if (!clientName && doc.name) clientName = String(doc.name).trim()
      if (typeof doc.reportAccessToken === 'string') {
        reportAccessToken = doc.reportAccessToken.trim()
      }
      if (typeof doc.leadChannel === 'string') leadChannel = doc.leadChannel
    }
    if (!reportAccessToken) {
      throw new Error('Missing reportAccessToken on submission — refuse unscoped report URL')
    }

    await updateContactSubmission(submissionId, {
      auditStatus: 'in_progress',
    })

    // A site behind a bot challenge would be audited as its empty challenge page (report 244):
    // send the "could not check" page instead, no score, no PDF, no Pro offer (PIT-149)
    const challenge = await detectBotChallenge(targetUrl)
    if (challenge.error) {
      console.warn(`[audit] submission=${submissionId} bot-challenge probe: ${challenge.error}`)
    }
    if (challenge.blocked) {
      console.log(
        `[audit] submission=${submissionId} blocked by bot protection: ${challenge.protection} ${challenge.status} — sending the blocked page`,
      )
      const html = await renderBlockedHtml({ targetUrl, locale, planSlug, challenge })
      const uploaded = await uploadReportObject({
        key: `audits/${submissionId}/${Date.now()}-blocked.html`,
        body: html,
        contentType: 'text/html; charset=utf-8',
      })
      const statusPageUrl = `${siteBase()}/audit/report/${submissionId}?k=${encodeURIComponent(reportAccessToken)}`
      await updateContactSubmission(submissionId, {
        auditStatus: 'report_sent',
        reportUrl: statusPageUrl,
        auditSummary: {
          stub: false,
          planSlug,
          locale,
          generatedAt: startedAt,
          tier: planToTier(planSlug).folder,
          reportLang: locale,
          blocked: true,
          protection: challenge.protection,
          challengeStatus: challenge.status,
          storageKey: uploaded.key,
          pdfStorageKey: null,
        },
        htmlResult: html,
        errorLast: null,
      })
      if (clientEmail && notifyClient) {
        const mailed = await sendClientAuditEmail({
          to: clientEmail,
          clientName,
          targetUrl,
          statusPageUrl,
          orderId: submissionId,
          locale,
          planSlug,
          blocked: true,
        })
        console.log(
          mailed.sent
            ? `[audit] submission=${submissionId} blocked email sent to client`
            : `[audit] submission=${submissionId} blocked email skipped: ${mailed.reason}`,
        )
      }
      return {
        ok: true,
        blocked: true,
        reportUrl: statusPageUrl,
        orderId: formatAuditOrderId(submissionId),
      }
    }

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

    let pdfUpload = null
    const wantsPdf = planAttachesPdf(planSlug)
    const pdfFilename = buildAuditPdfFilename({
      orderId: submissionId,
      targetUrl,
      locale,
      when: startedAt,
    })
    if (wantsPdf && result.pdf?.length) {
      const pdfKey = `audits/${submissionId}/${Date.now()}-${result.tierFolder}.pdf`
      pdfUpload = await uploadReportObject({
        key: pdfKey,
        body: result.pdf,
        contentType: 'application/pdf',
        contentDisposition: `attachment; filename="${pdfFilename}"`,
      })
    } else if (wantsPdf) {
      console.warn(`[audit] submission=${submissionId} Diagnostic/Pro PDF missing — email HTML link only`)
    }

    const statusPageUrl = `${siteBase()}/audit/report/${submissionId}?k=${encodeURIComponent(reportAccessToken)}`
    const publicReportUrl = uploaded.url.includes('.r2.cloudflarestorage.com/')
      ? statusPageUrl
      : uploaded.url

    const detectedTechnologies = Array.isArray(result.summary?.detectedTechnologies)
      ? result.summary.detectedTechnologies
      : []

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
        pdfStorageKey: pdfUpload?.key || null,
        detectedTechnologies,
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

    if (clientEmail && notifyClient) {
      const mailed = await sendClientAuditEmail({
        to: clientEmail,
        clientName,
        targetUrl,
        statusPageUrl,
        orderId: submissionId,
        locale,
        planSlug,
        pdfBuffer: wantsPdf ? result.pdf : null,
        pdfFilename,
      })
      if (!mailed.sent) {
        console.warn(`[audit] submission=${submissionId} email skipped: ${mailed.reason}`)
      } else {
        console.log(
          `[audit] submission=${submissionId} email sent to client orderId=${mailed.orderId || formatAuditOrderId(submissionId)}`,
        )
        // Free → Pro promo; Pro/Diagnostic → development offer (+15m, site sends).
        scheduleProOfferEmail(submissionId, planSlug, { leadChannel })
      }
    } else if (clientEmail && !notifyClient) {
      console.log(
        `[audit] submission=${submissionId} report ready — client email skipped (notifyClient=false)`,
      )
    } else {
      console.warn(`[audit] submission=${submissionId} no clientEmail — skip mail`)
    }

    console.log(
      `[audit] submission=${submissionId} ok score=${result.score} orderId=${formatAuditOrderId(submissionId)} reportUrl=${publicReportUrl}`,
    )
    return {
      ok: true,
      reportUrl: publicReportUrl,
      score: result.score,
      orderId: formatAuditOrderId(submissionId),
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
