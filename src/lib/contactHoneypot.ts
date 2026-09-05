/** Trap field — must not look like company/website/email (iOS/Chrome autofill those). */
export const CONTACT_HONEYPOT_FIELD = 'hp_erythro_trap' as const

/** Old HTML name. Still treated as a trap so scraped bots keep failing. */
const LEGACY_HONEYPOT_FIELDS = ['company_website'] as const

function trapFilled(value: unknown): boolean {
  if (value == null || value === '') return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

/**
 * Returns true when a honeypot was filled (bot submission).
 * Legitimate users leave this field empty. A real `website` URL on audit/order
 * payloads is not a trap.
 */
export function isContactHoneypotTriggered(body: unknown): boolean {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false

  const record = body as Record<string, unknown>
  if (trapFilled(record[CONTACT_HONEYPOT_FIELD])) return true
  for (const key of LEGACY_HONEYPOT_FIELDS) {
    if (trapFilled(record[key])) return true
  }
  return false
}
