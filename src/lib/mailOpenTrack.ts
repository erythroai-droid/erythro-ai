/**
 * Open tracking for team@ commercial mail: signed 1x1 pixel → `mail_opens` row.
 * Counts are a lower/upper bound (image blocking, Apple Mail Privacy Protection).
 */
import { createHmac } from 'node:crypto'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'
import config from '@payload-config'
import { timingSafeStringEqual } from '@/lib/agentAuth'

export type MailOpenKind = 'offer' | 'nudge' | 'reminder' | 'paid_dev'

const KINDS: readonly MailOpenKind[] = ['offer', 'nudge', 'reminder', 'paid_dev']

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

function sign(body: string): string {
  return createHmac('sha256', secret()).update(`mail-open:${body}`).digest('base64url')
}

/** Token format: `<submissionId>.<kind>.<sig>`. */
export function signMailOpenToken(submissionId: number | string, kind: MailOpenKind): string {
  if (!secret()) throw new Error('[mail-open] PAYLOAD_SECRET is required')
  const body = `${submissionId}.${kind}`
  return `${body}.${sign(body)}`
}

export function verifyMailOpenToken(
  token: string | null | undefined,
): { submissionId: number; kind: MailOpenKind } | null {
  const raw = token?.trim() || ''
  if (!raw || !secret()) return null
  const parts = raw.split('.')
  if (parts.length !== 3) return null
  const [id, kind, sig] = parts as [string, string, string]
  if (!/^\d+$/.test(id) || !KINDS.includes(kind as MailOpenKind)) return null
  if (!timingSafeStringEqual(sign(`${id}.${kind}`), sig)) return null
  return { submissionId: Number(id), kind: kind as MailOpenKind }
}

export function buildMailOpenPixelUrl(
  submissionId: number | string,
  kind: MailOpenKind,
): string {
  return `${resolveSiteUrl()}/api/mail/open?t=${encodeURIComponent(signMailOpenToken(submissionId, kind))}`
}

export async function recordMailOpen(input: {
  submissionId: number
  kind: MailOpenKind
  userAgent?: string | null
}): Promise<void> {
  const payload = await getPayload({ config })
  await payload.db.drizzle.execute(sql`
    insert into mail_opens (submission_id, kind, user_agent)
    values (${input.submissionId}, ${input.kind}, ${(input.userAgent || '').slice(0, 200)})
  `)
}
