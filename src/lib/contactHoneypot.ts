/** Trap field name — looks like a real optional field to bots, ignored by humans. */
export const CONTACT_HONEYPOT_FIELD = 'company_website' as const

/**
 * Returns true when the honeypot was filled (bot submission).
 * Legitimate users leave this field empty.
 */
export function isContactHoneypotTriggered(body: unknown): boolean {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false

  const trap = (body as Record<string, unknown>)[CONTACT_HONEYPOT_FIELD]
  if (trap == null || trap === '') return false
  if (typeof trap === 'string') return trap.trim().length > 0
  return true
}
