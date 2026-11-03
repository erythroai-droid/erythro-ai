import { uploadReportObject } from './r2Upload.js'
import {
  getContactSubmission,
  scheduleProOfferEmail,
  updateContactSubmission,
} from './payload.js'
import { sendClientAuditEmail, sendTeamBlockedAlert } from './mail.js'
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

const LEAK_CALC_HOSTS = {
  en: 'leak-en.erythro.ai',
  ru: 'leak-ru.erythro.ai',
  he: 'leak-he.erythro.ai',
}

/**
 * Client link in the report-ready email.
 * Leak calculator → step 4 on leak-{locale}.erythro.ai (not /audit/report A44).
 */
function buildClientStatusPageUrl({
  submissionId,
  reportAccessToken,
  locale,
  leadChannel,
  calcRevenue,
  calcClients,
}) {
  const token = encodeURIComponent(reportAccessToken)
  if (leadChannel === 'leak_calc') {
    const lang = locale === 'ru' || locale === 'he' || locale === 'en' ? locale : 'en'
    const host = LEAK_CALC_HOSTS[lang] || LEAK_CALC_HOSTS.en
    const u = new URL(`https://${host}/`)
    u.searchParams.set('report', String(submissionId))
    u.searchParams.set('k', reportAccessToken)
    if (typeof calcRevenue === 'number' && Number.isFinite(calcRevenue) && calcRevenue > 0) {
      u.searchParams.set('rev', String(Math.round(calcRevenue)))
    }
    if (typeof calcClients === 'number' && Number.isFinite(calcClients) && calcClients > 0) {
      u.searchParams.set('clients', String(Math.round(calcClients)))
    }
    return u.toString()
  }
  return `${siteBase()}/audit/report/${submissionId}?k=${token}`
}

function calcMetricsFromSummary(summary) {
  if (!summary || typeof summary !== 'object') return { calcRevenue: null, calcClients: null }
  const rev = Number(summary.calcRevenue)
  const clients = Number(summary.calcClients)
  return {
    calcRevenue: Number.isFinite(rev) && rev > 0 ? rev : null,
    calcClients: Number.isFinite(clients) && clients > 0 ? clients : null,
  }
}

export const WAIT_ACCESS_MAX_MS = 72 * 60 * 60 * 1000

/**
 * Paid order, site closed to the lab. First time: instruction email to the client and an alert
 * to the team. Every check: keep the order `in_progress` with `auditSummary.waitingAccess`, which
 * the site cron re-queues every 30 min. After 72 h: `failed` and a second team alert (PIT-150).
 */
async function waitForLabAccess(input) {
  const { submissionId, targetUrl, planSlug, challenge } = input
  const now = new Date()
  const prev = input.previous && typeof input.previous === 'object' ? input.previous : {}
  const since = typeof prev.since === 'string' ? prev.since : now.toISOString()
  const checks = (Number(prev.checks) || 0) + 1
  const statusPageUrl = buildClientStatusPageUrl({
    submissionId,
    reportAccessToken: input.reportAccessToken,
    locale: input.locale,
    leadChannel: input.leadChannel,
    calcRevenue: input.calcRevenue,
    calcClients: input.calcClients,
  })
  const alert = {
    orderId: submissionId,
    targetUrl,
    planSlug,
    clientEmail: input.clientEmail,
    protection: challenge.protection,
    status: challenge.status,
    statusPageUrl,
  }
  const waitingAccess = {
    since,
    lastCheck: now.toISOString(),
    checks,
    protection: challenge.protection,
    status: challenge.status,
    clientNotified: Boolean(prev.clientNotified),
  }

  if (now.getTime() - Date.parse(since) >= WAIT_ACCESS_MAX_MS) {
    console.warn(`[audit] submission=${submissionId} paid audit: no lab access for 72 h — failed`)
    await updateContactSubmission(submissionId, {
      auditStatus: 'failed',
      auditSummary: { planSlug, locale: input.locale, waitingAccess: { ...waitingAccess, expired: true } },
      errorLast: `Bot protection (${challenge.protection} ${challenge.status}): no lab access for 72 h`,
    })
    await sendTeamBlockedAlert({ ...alert, expired: true }).catch((err) =>
      console.error(`[audit] submission=${submissionId} team alert failed:`, err?.message || err),
    )
    return { ok: false, error: 'bot_protection_timeout' }
  }

  if (!prev.clientNotified && input.notifyClient) {
    if (input.clientEmail) {
      const mailed = await sendClientAuditEmail({
        to: input.clientEmail,
        clientName: input.clientName,
        targetUrl,
        statusPageUrl,
        orderId: submissionId,
        locale: input.locale,
        planSlug,
        waitingAccess: true,
      })
      waitingAccess.clientNotified = mailed.sent
      if (!mailed.sent) console.warn(`[audit] submission=${submissionId} waiting email skipped: ${mailed.reason}`)
    }
    await sendTeamBlockedAlert(alert).catch((err) =>
      console.error(`[audit] submission=${submissionId} team alert failed:`, err?.message || err),
    )
  }

  await updateContactSubmission(submissionId, {
    auditStatus: 'in_progress',
    auditSummary: { planSlug, locale: input.locale, waitingAccess },
    errorLast: `Waiting for lab access: ${challenge.protection} ${challenge.status} (check ${checks})`,
  })
  console.log(
    `[audit] submission=${submissionId} paid audit waits for lab access: ${challenge.protection} ${challenge.status}, check ${checks} since ${since}`,
  )
  return { ok: true, waitingAccess: true, orderId: formatAuditOrderId(submissionId) }
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
  /** @type {number|null} */
  let calcRevenue = null
  /** @type {number|null} */
  let calcClients = null
  /** @type {Record<string, unknown>|null} */
  let priorSummary = null

  try {
    const doc = await getContactSubmission(submissionId)
    if (doc) {
      if (!clientEmail && doc.email) clientEmail = String(doc.email).trim()
      if (!clientName && doc.name) clientName = String(doc.name).trim()
      if (typeof doc.reportAccessToken === 'string') {
        reportAccessToken = doc.reportAccessToken.trim()
      }
      if (typeof doc.leadChannel === 'string') leadChannel = doc.leadChannel
      if (doc.auditSummary && typeof doc.auditSummary === 'object') {
        priorSummary = doc.auditSummary
        const metrics = calcMetricsFromSummary(doc.auditSummary)
        calcRevenue = metrics.calcRevenue
        calcClients = metrics.calcClients
      }
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
    // Diagnostic / Pro are paid: the client must never get "audit not completed" as the result.
    // The order waits for access; the site cron re-queues it every 30 min for 72 h (PIT-150).
    if (challenge.blocked && planAttachesPdf(planSlug)) {
      return await waitForLabAccess({
        submissionId,
        targetUrl,
        locale,
        planSlug,
        clientEmail,
        clientName,
        notifyClient,
        reportAccessToken,
        leadChannel,
        calcRevenue,
        calcClients,
        challenge,
        previous: priorSummary?.waitingAccess,
      })
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
      const statusPageUrl = buildClientStatusPageUrl({
        submissionId,
        reportAccessToken,
        locale,
        leadChannel,
        calcRevenue,
        calcClients,
      })
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
          ...(calcRevenue != null ? { calcRevenue } : {}),
          ...(calcClients != null ? { calcClients } : {}),
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
          leakCalc: leadChannel === 'leak_calc',
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

    const statusPageUrl = buildClientStatusPageUrl({
      submissionId,
      reportAccessToken,
      locale,
      leadChannel,
      calcRevenue,
      calcClients,
    })
    // Leak LP: client opens step 4 on leak-*; keep A44 R2 URL only when public (non-r2.dev).
    const publicReportUrl =
      leadChannel === 'leak_calc'
        ? statusPageUrl
        : uploaded.url.includes('.r2.cloudflarestorage.com/')
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
        pillars: result.summary?.pillars ?? null,
        ...(calcRevenue != null ? { calcRevenue } : {}),
        ...(calcClients != null ? { calcClients } : {}),
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
        leakCalc: leadChannel === 'leak_calc',
      })
      if (!mailed.sent) {
        console.warn(`[audit] submission=${submissionId} email skipped: ${mailed.reason}`)
      } else {
        console.log(
          `[audit] submission=${submissionId} email sent to client orderId=${mailed.orderId || formatAuditOrderId(submissionId)}`,
        )
        // Free → Pro promo; Pro/Diagnostic → development offer (+15m, site sends).
        // Leak calculator: WhatsApp follow-up only — never schedule Pro upsell.
        if (leadChannel !== 'leak_calc') {
          scheduleProOfferEmail(submissionId, planSlug, { leadChannel })
        }
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
