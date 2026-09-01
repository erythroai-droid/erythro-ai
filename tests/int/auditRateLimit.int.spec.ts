import { describe, expect, it } from 'vitest'
import {
  extractAuditDomain,
  checkFreeAuditCooldown,
  FREE_AUDIT_COOLDOWN_MS,
  AUDIT_RATE_LIMIT_MESSAGES,
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

describe('checkFreeAuditCooldown', () => {
  const now = new Date('2026-09-01T12:00:00.000Z').getTime()

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

  it('blocks submission if the same domain was audited within 5 days', async () => {
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
      expect(result.message).toBe(AUDIT_RATE_LIMIT_MESSAGES.domainRecent.ru)
      expect(result.retryAfterSec).toBeGreaterThan(0)
    }
  })

  it('blocks submission if the same IP requested a free audit within 5 days', async () => {
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
      expect(result.message).toBe(AUDIT_RATE_LIMIT_MESSAGES.userRecent.en)
    }
  })

  it('blocks submission if the same email requested a free audit within 5 days', async () => {
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
      expect(result.message).toBe(AUDIT_RATE_LIMIT_MESSAGES.userRecent.he)
    }
  })

  it('allows submission if previous audit for same domain is older than 5 days', async () => {
    const sixDaysAgo = new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString()
    const payload = createMockPayload([
      {
        id: 4,
        website: 'https://old-domain.com',
        email: 'old@example.com',
        ip: '192.168.1.1',
        createdAt: sixDaysAgo,
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
})
