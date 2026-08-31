/**
 * Optional Payload CMS updates via REST + API key.
 * Skips silently when PAYLOAD_API_URL / PAYLOAD_API_KEY unset.
 */

function payloadBase() {
  return process.env.PAYLOAD_API_URL?.trim()?.replace(/\/+$/, '') || null
}

function payloadKey() {
  return process.env.PAYLOAD_API_KEY?.trim() || null
}

/**
 * @param {number|string} id
 * @param {Record<string, unknown>} data
 */
export async function updateContactSubmission(id, data) {
  const base = payloadBase()
  const key = payloadKey()
  if (!base || !key) {
    console.warn('[payload] skip update — PAYLOAD_API_URL / PAYLOAD_API_KEY not set')
    return null
  }

  const res = await fetch(`${base}/api/contact-submissions/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `users API-Key ${key}`,
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Payload PATCH ${id} failed: ${res.status} ${text.slice(0, 400)}`)
  }

  return res.json()
}
