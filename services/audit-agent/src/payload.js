/**
 * Authenticated helpers for worker → Next.js (AGENT_SECRET_TOKEN).
 * Prefer this over Payload REST API keys for MVP.
 */

function siteBase() {
  return (
    process.env.PAYLOAD_API_URL?.trim()?.replace(/\/+$/, '') ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/+$/, '') ||
    'https://erythro.ai'
  )
}

function agentSecret() {
  return process.env.AGENT_SECRET_TOKEN?.trim() || ''
}

/**
 * @param {number|string} id
 * @param {Record<string, unknown>} data
 */
export async function updateContactSubmission(id, data) {
  const secret = agentSecret()
  if (!secret) {
    console.warn('[payload] skip update — AGENT_SECRET_TOKEN not set')
    return null
  }

  const res = await fetch(`${siteBase()}/api/audit/internal/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Agent-Secret-Key': secret,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Internal PATCH ${id} failed: ${res.status} ${text.slice(0, 400)}`)
  }

  return res.json()
}

/**
 * @param {number|string} id
 */
export async function getContactSubmission(id) {
  const secret = agentSecret()
  if (!secret) return null

  const res = await fetch(`${siteBase()}/api/audit/internal/${id}`, {
    method: 'GET',
    headers: { 'X-Agent-Secret-Key': secret },
  })
  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Internal GET ${id} failed: ${res.status} ${text.slice(0, 400)}`)
  }
  return res.json()
}

/** Free express audit — delayed PRO upsell email from the site. */
export function isFreeAuditPlanSlug(planSlug) {
  const s = String(planSlug || '')
    .trim()
    .toLowerCase()
  return !s || s === 'audit-free' || s === 'free'
}

const PRO_OFFER_DELAY_MS = 15 * 60 * 1000

/**
 * All free audits (ads LP + organic): schedule PRO ₪390 commercial email (+15m).
 * Site also checks DB for Pro/Diagnostic orders before sending.
 * Reconcile cron is the safety net if this process restarts.
 *
 * @param {number|string} submissionId
 * @param {string} [planSlug]
 * @param {{ leadChannel?: string|null }} [meta] unused (kept for call-site compat)
 */
export function scheduleProOfferEmail(submissionId, planSlug, _meta = {}) {
  if (!isFreeAuditPlanSlug(planSlug)) return

  // Off until letterhead approved (mirror site `isAuditProOfferEnabled`).
  const offerOn = String(process.env.AUDIT_PRO_OFFER_ENABLED || '')
    .trim()
    .toLowerCase()
  if (offerOn !== '1' && offerOn !== 'true' && offerOn !== 'on') {
    console.log(
      `[payload] pro-offer schedule paused id=${submissionId} (AUDIT_PRO_OFFER_ENABLED off)`,
    )
    return
  }

  const secret = agentSecret()
  if (!secret) {
    console.warn('[payload] skip pro-offer schedule — AGENT_SECRET_TOKEN not set')
    return
  }

  const run = async () => {
    const dueAt = new Date(Date.now() + PRO_OFFER_DELAY_MS).toISOString()
    try {
      await updateContactSubmission(submissionId, {
        proOfferStatus: 'scheduled',
        proOfferDueAt: dueAt,
      })
    } catch (err) {
      console.warn(
        `[payload] pro-offer schedule PATCH failed id=${submissionId}:`,
        err instanceof Error ? err.message : err,
      )
      return
    }

    console.log(
      `[payload] pro-offer scheduled id=${submissionId} due=${dueAt} (delay ${Math.round(PRO_OFFER_DELAY_MS / 60000)}m)`,
    )

    setTimeout(() => {
      fetch(`${siteBase()}/api/audit/internal/${submissionId}/pro-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Secret-Key': secret,
        },
        body: JSON.stringify({ kind: 'offer' }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const text = await res.text().catch(() => '')
            console.warn(
              `[payload] pro-offer POST id=${submissionId} status=${res.status} ${text.slice(0, 200)}`,
            )
            return
          }
          console.log(`[payload] pro-offer triggered id=${submissionId}`)
        })
        .catch((err) => {
          console.warn(
            `[payload] pro-offer POST failed id=${submissionId}:`,
            err instanceof Error ? err.message : err,
          )
        })
    }, PRO_OFFER_DELAY_MS)
  }

  run().catch((err) => {
    console.warn(
      `[payload] pro-offer schedule error id=${submissionId}:`,
      err instanceof Error ? err.message : err,
    )
  })
}
