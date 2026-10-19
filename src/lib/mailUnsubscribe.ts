/**
 * Opt-out of team@ commercial mail (Pro offer / KP follow-ups).
 * Signed link in email footer → confirm page → store email → skip future sends.
 */
import { createHmac } from 'node:crypto'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import config from '@payload-config'
import { timingSafeStringEqual } from '@/lib/agentAuth'

function secret(): string {
  return process.env.PAYLOAD_SECRET?.trim() || ''
}

function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw || raw === '[SENSITIVE]' || raw.startsWith('YOUR_')) {
    return 'https://erythro.ai'
  }
  return raw.replace(/\/+$/, '')
}

export function normalizeMailEmail(raw: string | null | undefined): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
}

export function signMailUnsubscribeToken(email: string): string {
  const key = secret()
  if (!key) throw new Error('[mail-unsub] PAYLOAD_SECRET is required')
  const normalized = normalizeMailEmail(email)
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('[mail-unsub] invalid email')
  }
  const payload = Buffer.from(normalized, 'utf8').toString('base64url')
  const sig = createHmac('sha256', key).update(`mail-unsub:${normalized}`).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyMailUnsubscribeToken(token: string | null | undefined): string | null {
  const raw = token?.trim() || ''
  if (!raw) return null
  const key = secret()
  if (!key) return null
  const dot = raw.indexOf('.')
  if (dot <= 0 || dot === raw.length - 1) return null
  const payload = raw.slice(0, dot)
  const sig = raw.slice(dot + 1)
  let email: string
  try {
    email = Buffer.from(payload, 'base64url').toString('utf8')
  } catch {
    return null
  }
  const normalized = normalizeMailEmail(email)
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null
  const expected = createHmac('sha256', key).update(`mail-unsub:${normalized}`).digest('base64url')
  if (!timingSafeStringEqual(expected, sig)) return null
  return normalized
}

export function buildMailUnsubscribeUrl(
  email: string,
  locale?: string | null,
): string {
  const t = signMailUnsubscribeToken(email)
  const lang =
    locale === 'ru' || locale === 'he' || locale === 'en' ? locale : 'en'
  try {
    const u = new URL(`${resolveSiteUrl()}/unsubscribe`)
    u.searchParams.set('t', t)
    u.searchParams.set('lang', lang)
    return u.toString()
  } catch {
    return `${resolveSiteUrl()}/unsubscribe?lang=${lang}&t=${encodeURIComponent(t)}`
  }
}

export async function isMailUnsubscribed(email: string): Promise<boolean> {
  const normalized = normalizeMailEmail(email)
  if (!normalized) return false
  const payload = await getPayload({ config })
  const result = await payload.db.drizzle.execute(sql`
    SELECT 1 AS ok
    FROM "mail_unsubscribes"
    WHERE "email" = ${normalized}
    LIMIT 1
  `)
  const rows = Array.isArray(result)
    ? result
    : result && typeof result === 'object' && 'rows' in result
      ? ((result as { rows?: unknown[] }).rows ?? [])
      : []
  return rows.length > 0
}

export async function recordMailUnsubscribe(input: {
  email: string
  source?: string
}): Promise<{ ok: true; email: string; already: boolean }> {
  const normalized = normalizeMailEmail(input.email)
  if (!normalized) throw new Error('invalid email')
  const source = (input.source || 'pro_offer').slice(0, 64)
  const payload = await getPayload({ config })
  const existing = await isMailUnsubscribed(normalized)
  if (existing) return { ok: true, email: normalized, already: true }
  await payload.db.drizzle.execute(sql`
    INSERT INTO "mail_unsubscribes" ("email", "source", "created_at")
    VALUES (${normalized}, ${source}, now())
    ON CONFLICT ("email") DO NOTHING
  `)
  return { ok: true, email: normalized, already: false }
}

export { unsubscribeCopy } from '@/lib/mailUnsubscribeCopy'
