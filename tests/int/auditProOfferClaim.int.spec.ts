import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * PIT-123: worker timer + Vercel cron + n8n walker could all send the same
 * Pro offer. In-memory row emulates the atomic claim UPDATE and the final patch.
 */

type Row = { status: string; lock: number | null }
const row: Row = { status: 'scheduled', lock: null }
const sendMail = vi.fn()

type SqlLike = { text: string; values: unknown[] }

vi.mock('@payloadcms/db-postgres', () => {
  const sql = (strings: TemplateStringsArray, ...values: unknown[]): SqlLike => ({
    text: strings.join('\u0000'),
    values,
  })
  sql.raw = (s: string): SqlLike => ({ text: s, values: [] })
  return { sql }
})

function flatten(q: unknown): { text: string; values: unknown[] } {
  if (q && typeof q === 'object' && 'text' in q && 'values' in q) {
    const { text, values } = q as SqlLike
    const parts = text.split('\u0000')
    let out = parts[0]!
    const vals: unknown[] = []
    values.forEach((v, i) => {
      if (v && typeof v === 'object' && 'text' in v) {
        const f = flatten(v)
        out += f.text
        vals.push(...f.values)
      } else {
        out += '?'
        vals.push(v)
      }
      out += parts[i + 1]!
    })
    return { text: out, values: vals }
  }
  return { text: String(q), values: [] }
}

const execute = vi.fn(async (q: unknown) => {
  const { text, values } = flatten(q)
  if (/returning id/i.test(text)) {
    const claimable = ['scheduled', 'none'].includes(row.status) && row.lock === null
    if (!claimable) return { rows: [] }
    row.lock = Date.now()
    return { rows: [{ id: 202 }] }
  }
  if (/update contact_submissions set/i.test(text)) {
    const status = values.find(
      (v) => typeof v === 'string' && ['sent', 'skipped', 'reminder_sent', 'nudge_sent'].includes(v),
    )
    if (typeof status === 'string') row.status = status
    if (/pro_offer_lock_at = null/.test(text)) row.lock = null
  }
  return { rows: [] }
})

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({
  getPayload: async () => ({
    db: { drizzle: { execute } },
    find: async () => ({ docs: [] }),
    findByID: async () => {
      const snapshot = row.status
      // Let concurrent callers all take their stale read before anyone claims.
      await new Promise((r) => setTimeout(r, 5))
      return {
        id: 202,
        source: 'audit',
        planSlug: 'audit-free',
        auditStatus: 'report_sent',
        proOfferStatus: snapshot,
        proOfferDueAt: new Date(Date.now() - 60_000).toISOString(),
        email: 'client@example.com',
        locale: 'en',
        reportAccessToken: 'tok',
      }
    },
  }),
}))
vi.mock('nodemailer', () => {
  const createTransport = () => ({ sendMail })
  return { createTransport, default: { createTransport } }
})
vi.mock('@/lib/teamMailSentAppend', () => ({ appendTeamMailToSent: async () => {} }))
vi.mock('@/lib/mailUnsubscribe', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/mailUnsubscribe')>()),
  isMailUnsubscribed: async () => false,
}))

import { trySendAuditProOffer } from '@/lib/auditProOffer'

describe('trySendAuditProOffer atomic claim', () => {
  beforeEach(() => {
    row.status = 'scheduled'
    row.lock = null
    sendMail.mockReset()
    execute.mockClear()
    vi.stubEnv('AUDIT_PRO_OFFER_ENABLED', '1')
    vi.stubEnv('TEAM_SMTP_PASS', 'test-pass')
    vi.stubEnv('PAYLOAD_SECRET', 'test-secret')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('sends exactly one email for concurrent callers (worker + cron + walker)', async () => {
    sendMail.mockImplementation(() => new Promise((r) => setTimeout(r, 30)))

    const results = await Promise.all([
      trySendAuditProOffer(202),
      trySendAuditProOffer(202),
      trySendAuditProOffer(202),
    ])

    expect(sendMail).toHaveBeenCalledTimes(1)
    expect(results.filter((r) => r.ok && r.status === 'sent')).toHaveLength(1)
    expect(results.filter((r) => r.ok && r.status === 'already_sent')).toHaveLength(2)
    expect(row.status).toBe('sent')
    expect(row.lock).toBeNull()
  })

  it('does not send again once the offer is sent', async () => {
    sendMail.mockResolvedValue(undefined)
    await trySendAuditProOffer(202)
    const again = await trySendAuditProOffer(202)
    expect(sendMail).toHaveBeenCalledTimes(1)
    expect(again).toMatchObject({ ok: true, status: 'already_sent' })
  })

  it('releases the lock on SMTP failure so a later run can retry', async () => {
    sendMail.mockRejectedValueOnce(Object.assign(new Error('refused'), { command: 'CONN' }))
    sendMail.mockRejectedValueOnce(Object.assign(new Error('refused'), { command: 'CONN' }))
    const failed = await trySendAuditProOffer(202)
    expect(failed.ok).toBe(false)
    expect(row.lock).toBeNull()
    expect(row.status).toBe('scheduled')

    sendMail.mockResolvedValue(undefined)
    const retried = await trySendAuditProOffer(202)
    expect(retried).toMatchObject({ ok: true, status: 'sent' })
  })

  it('does not retry on 587 after a timeout following DATA (message may be delivered)', async () => {
    sendMail.mockRejectedValueOnce(
      Object.assign(new Error('Socket timeout'), { code: 'ETIMEDOUT', command: 'DATA' }),
    )
    const res = await trySendAuditProOffer(202)
    expect(sendMail).toHaveBeenCalledTimes(1)
    expect(res).toMatchObject({ ok: true, status: 'sent' })
  })

  it('falls back to 587 when the first connection fails before DATA', async () => {
    sendMail.mockRejectedValueOnce(Object.assign(new Error('connect'), { command: 'CONN' }))
    sendMail.mockResolvedValueOnce(undefined)
    const res = await trySendAuditProOffer(202)
    expect(sendMail).toHaveBeenCalledTimes(2)
    expect(res).toMatchObject({ ok: true, status: 'sent' })
  })
})
