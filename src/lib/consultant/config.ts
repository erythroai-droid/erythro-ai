import type { ConsultLocale } from './types'

/**
 * Model is pinned to match the QA_Auditor Funnel review (`AuditCollector.java`).
 * `GEMINI_CONSULT_MODEL` exists only as an emergency override and is never
 * surfaced in the UI.
 */
export const CONSULT_MODEL = 'gemini-3.6-flash'

export function consultModel(): string {
  return process.env.GEMINI_CONSULT_MODEL?.trim() || CONSULT_MODEL
}

/**
 * Server-only. A `NEXT_PUBLIC_` copy of this key would leak it to the browser.
 *
 * Deliberately a different variable from the QA_Auditor's `GEMINI_API_KEY`
 * (read by `AuditCollector.java`): chat traffic is public and unbounded, so it
 * must not be able to exhaust the funnel-review quota or muddle the billing.
 * The shared name stays as a fallback so a local `.env` with one key works.
 */
export function geminiApiKey(): string {
  return process.env.GEMINI_API_KEY_AI_CHAT?.trim() || process.env.GEMINI_API_KEY?.trim() || ''
}

export function isConsultantConfigured(): boolean {
  return Boolean(geminiApiKey())
}

export function isOtpEnabled(): boolean {
  const raw = process.env.CONSULT_EMAIL_OTP?.trim()
  // Default on: the OTP gate is the only spam barrier until real accounts land.
  if (!raw) return true
  return raw !== '0' && raw.toLowerCase() !== 'false'
}

/** Signs OTP challenges and the verified-email cookie. */
export function otpPepper(): string {
  return process.env.CONSULT_OTP_PEPPER?.trim() || ''
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function readPositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

export function consultLocale(raw: unknown): ConsultLocale {
  return raw === 'ru' || raw === 'he' ? raw : 'en'
}
