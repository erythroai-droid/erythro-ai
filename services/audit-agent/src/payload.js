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
