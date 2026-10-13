import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  extractAuditDomain,
  checkFreeAuditCooldown,
  formatFreeAuditRemaining,
  FREE_AUDIT_COOLDOWN_DAYS,
  FREE_AUDIT_COOLDOWN_MS,
} from '@/lib/auditRateLimit'
import type { Payload } from 'payload'

describe('extractAuditDomain', () => {
  it('extracts canonical domain from full URLs', () => {
    expect(extractAuditDomain('https://example.com')).toBe('example.com')
    expect(extractAuditDomain('http://www.example.com/')).toBe('example.com')
    expect(extractAuditDomain('https://WWW.sub.domain.co.il:8080/path?query=1#frag')).toBe(
      'sub.domain.co.il',
    )
  })

  it('extracts canonical domain from raw domain strings', () => {
    expect(extractAuditDomain('example.com')).toBe('example.com')
    expect(extractAuditDomain('www.example.org')).toBe('example.org')
    expect(extractAuditDomain('  sub.my-site.net/page  ')).toBe('sub.my-site.net')
  })

  it('handles empty / invalid inputs safely', () => {
    expect(extractAuditDomain('')).toBe('')
    expect(extractAuditDomain('   ')).toBe('')
    expect(extractAuditDomain(null as unknown as string)).toBe('')
  })
})

describe('formatFreeAuditRemaining', () => {
  it('formats days, hours, and minutes in RU/EN/HE', () => {
    const ms = (2 * 24 + 3) * 60 * 60 * 1000 + 15 * 60 * 1000
    expect(formatFreeAuditRemaining(ms, 'ru')).toBe('2 дня 3 часа 15 минут')
    expect(formatFreeAuditRemaining(ms, 'en')).toBe('2 days 3 hours 15 minutes')
    expect(formatFreeAuditRemaining(ms, 'he')).toBe('2 ימים 3 שעות 15 דקות')
  })

  it('omits zero units and ceils sub-minute leftovers', () => {
    expect(formatFreeAuditRemaining(45_000, 'ru')).toBe('1 минута')
    expect(formatFreeAuditRemaining(3 * 60 * 60 * 1000, 'en')).toBe('3 hours')
    expect(FREE_AUDIT_COOLDOWN_DAYS).toBe(7)
  })
})

describe('checkFreeAuditCooldown', () => {
  const now = new Date('2026-09-01T12:00:00.000Z').getTime()
  const prevSkip = process.env.AUDIT_SKIP_COOLDOWN

  beforeAll(() => {
    process.env.AUDIT_SKIP_COOLDOWN = '0'
  })

  afterAll(() => {
    if (prevSkip === undefined) delete process.env.AUDIT_SKIP_COOLDOWN
    else process.env.AUDIT_SKIP_COOLDOWN = prevSkip
  })

  function createMockPayload(docs: Array<Record<string, unknown>>): Payload {
    return {
      find: async () => ({
        docs,
        totalDocs: docs.length,
        limit: 100,
        totalPages: 1,
        page: 1,
        pagingCounter: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      }),
    } as unknown as Payload
  }

  it('allows submission when no recent submissions exist', async () => {
    const payload = createMockPayload([])
    const result = await checkFreeAuditCooldown(payload, {
      website: 'https://newdomain.com',
      email: 'user@example.com',
      ip: '192.168.1.50',
      now,
    })

    expect(result.allowed).toBe(true)
  })

  it('blocks submission if the same domain was audited within 7 days', async () => {
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()
    const payload = createMockPayload([
      {
        id: 1,
        website: 'https://www.target-domain.com/landing',
        email: 'other@example.com',
        ip: '10.0.0.1',
        createdAt: twoDaysAgo,
        auditStatus: 'report_sent',
        planSlug: 'audit-free',
      },
    ])

    const result = await checkFreeAuditCooldown(payload, {
      website: 'http://target-domain.com',
      email: 'newuser@example.com',
      ip: '192.168.1.99',
      locale: 'ru',
      now,
    })

    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.reason).toBe('domain_recent')
      expect(result.retryAfterLabel).toBe('5 дней')
      expect(result.message).toContain('5 дней')
      expect(result.retryAfterSec).toBeGreaterThan(0)
    }
  })

  it('blocks submission if the same IP requested a free audit within 7 days', async () => {
    const oneDayAgo = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString()
    const payload = createMockPayload([
      {
        id: 2,
        website: 'https://first-site.com',
        email: 'alice@example.com',
        ip: '203.0.113.42',
        createdAt: oneDayAgo,
        auditStatus: 'in_progress',
        planSlug: 'audit-free',
      },
    ])

    const result = await checkFreeAuditCooldown(payload, {
      website: 'https://second-site.com',
      email: 'bob@example.com',
      ip: '203.0.113.42',
      locale: 'en',
      now,
    })

    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.reason).toBe('user_recent')
      expect(result.retryAfterLabel).toBe('6 days')
      expect(result.message).toContain('6 days')
    }
  })

  it('blocks submission if the same email requested a free audit within 7 days', async () => {
    const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()
    const payload = createMockPayload([
      {
        id: 3,
        website: 'https://site-a.com',
        email: 'founder@startup.io',
        ip: '198.51.100.1',
        createdAt: threeDaysAgo,
        auditStatus: 'new',
        planSlug: 'audit-free',
      },
    ])

    const result = await checkFreeAuditCooldown(payload, {
      website: 'https://site-b.com',
      email: 'Founder@Startup.io ',
      ip: '198.51.100.2',
      locale: 'he',
      now,
    })

    expect(result.allowed).toBe(false)
    if (!result.allowed) {
      expect(result.reason).toBe('user_recent')
      expect(result.retryAfterLabel).toBe('4 ימים')
      expect(result.message).toContain('4 ימים')
    }
  })

  it('allows submission if previous audit for same domain is older than 7 days', async () => {
    const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString()
    const payload = createMockPayload([
      {
        id: 4,
        website: 'https://old-domain.com',
        email: 'old@example.com',
        ip: '192.168.1.1',
        createdAt: eightDaysAgo,
        auditStatus: 'report_sent',
        planSlug: 'audit-free',
      },
    ])

    const result = await checkFreeAuditCooldown(payload, {
      website: 'https://old-domain.com',
      email: 'new@example.com',
      ip: '192.168.1.2',
      now,
    })

    expect(result.allowed).toBe(true)
  })

  it('allows a recent domain when AUDIT_SKIP_COOLDOWN=1', async () => {
    process.env.AUDIT_SKIP_COOLDOWN = '1'
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()
    const payload = createMockPayload([
      {
        id: 9,
        website: 'https://target-domain.com',
        email: 'same@example.com',
        ip: '10.0.0.1',
        createdAt: twoDaysAgo,
        auditStatus: 'report_sent',
        planSlug: 'audit-free',
      },
    ])
    const result = await checkFreeAuditCooldown(payload, {
      website: 'https://target-domain.com',
      email: 'same@example.com',
      ip: '10.0.0.1',
      now,
    })
    expect(result.allowed).toBe(true)
    process.env.AUDIT_SKIP_COOLDOWN = '0'
  })

  it('exposes FREE_AUDIT_COOLDOWN_MS for 7 days', () => {
    expect(FREE_AUDIT_COOLDOWN_MS).toBe(7 * 24 * 60 * 60 * 1000)
  })
})
