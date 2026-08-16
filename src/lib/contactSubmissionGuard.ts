import type { ContactFormSource } from '@/lib/contactNotification'
import {
  sanitizeEmail,
  sanitizeLocale,
  sanitizeMessage,
  sanitizePhone,
  sanitizePlainText,
} from '@/lib/contactSanitize'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const CONTACT_LIMITS = {
  name: 120,
  email: 254,
  phone: 40,
  message: 5000,
} as const

export type ContactSubmissionInput = {
  name: string
  email: string
  phone: string
  message: string
  locale?: string
  source: ContactFormSource
  privacyConsent: true
}

export type ContactGuardFailure = {
  ok: false
  status: 400 | 413
  message: string
}

export type ContactGuardSuccess = {
  ok: true
  data: ContactSubmissionInput
}

export type ContactGuardResult = ContactGuardFailure | ContactGuardSuccess

function parseSource(value: unknown): ContactFormSource {
  return value === 'order' ? 'order' : 'contact'
}

/**
 * Isolated filter layer for `/api/contact`:
 * sanitize → validate → typed payload (before Payload CMS / SMTP).
 */
export function guardContactSubmission(body: unknown): ContactGuardResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, status: 400, message: 'Invalid JSON' }
  }

  const raw = body as Record<string, unknown>
  const name = sanitizePlainText(raw.name, CONTACT_LIMITS.name)
  const email = sanitizeEmail(raw.email)
  const phone = sanitizePhone(raw.phone)
  const message = sanitizeMessage(raw.message, CONTACT_LIMITS.message)
  const locale = sanitizeLocale(raw.locale)
  const source = parseSource(raw.source)
  const privacyConsent = raw.privacyConsent === true

  if (!privacyConsent) {
    return { ok: false, status: 400, message: 'Privacy consent is required' }
  }
  if (!name || !email || !message) {
    return { ok: false, status: 400, message: 'Missing required fields' }
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, status: 400, message: 'Invalid email' }
  }
  if (typeof raw.message === 'string' && raw.message.length > CONTACT_LIMITS.message * 2) {
    // Reject obviously oversized payloads before they hit CMS/mail.
    return { ok: false, status: 413, message: 'Message too long' }
  }
  if (message.length > CONTACT_LIMITS.message) {
    return { ok: false, status: 413, message: 'Message too long' }
  }

  return {
    ok: true,
    data: {
      name,
      email,
      phone,
      message,
      locale,
      source,
      privacyConsent: true,
    },
  }
}
