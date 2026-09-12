import { describe, expect, it } from 'vitest'
import {
  AUDIT_PROGRESS_EXPECTED_MS,
  AUDIT_REPORT_POLL_MS,
  auditReportCopy,
  auditWaitingPlaceholderHtml,
  estimateAuditProgressPercent,
  estimateAuditRemainingMinutes,
  formatAuditOrderId,
  nextAuditPollDelayMs,
  parseAuditReportId,
  parseAuditTimestampMs,
  tReportFill,
} from '@/lib/auditReport'

describe('parseAuditReportId', () => {
  it('accepts positive integer strings', () => {
    expect(parseAuditReportId('1')).toBe(1)
    expect(parseAuditReportId('42')).toBe(42)
  })

  it('accepts AUD- prefixed ids', () => {
    expect(parseAuditReportId('AUD-88')).toBe(88)
    expect(parseAuditReportId('aud-7')).toBe(7)
  })

  it('rejects invalid ids', () => {
    expect(parseAuditReportId('')).toBeNull()
    expect(parseAuditReportId('0')).toBeNull()
    expect(parseAuditReportId('-1')).toBeNull()
    expect(parseAuditReportId('12.3')).toBeNull()
    expect(parseAuditReportId('abc')).toBeNull()
  })
})

describe('formatAuditOrderId', () => {
  it('normalizes numeric and AUD- prefixed ids', () => {
    expect(formatAuditOrderId(88)).toBe('AUD-88')
    expect(formatAuditOrderId('88')).toBe('AUD-88')
    expect(formatAuditOrderId('AUD-88')).toBe('AUD-88')
  })
})

describe('estimateAuditProgressPercent', () => {
  const now = 1_700_000_000_000

  it('is 100 when the report is ready', () => {
    expect(
      estimateAuditProgressPercent({ status: 'report_sent', createdAtMs: now - 1000, nowMs: now }),
    ).toBe(100)
  })

  it('is 0 when the report failed', () => {
    expect(
      estimateAuditProgressPercent({ status: 'failed', createdAtMs: now - 1000, nowMs: now }),
    ).toBe(0)
  })

  it('starts low while queued and stays under the in-progress floor', () => {
    const queued = estimateAuditProgressPercent({
      status: 'new',
      createdAtMs: now,
      nowMs: now,
    })
    expect(queued).toBeGreaterThanOrEqual(4)
    expect(queued).toBeLessThan(22)
  })

  it('jumps to the running floor when the lab starts', () => {
    const running = estimateAuditProgressPercent({
      status: 'in_progress',
      createdAtMs: now,
      nowMs: now,
    })
    expect(running).toBeGreaterThanOrEqual(22)
    expect(running).toBeLessThan(30)
  })

  it('caps below 100% until the report is sent', () => {
    const late = estimateAuditProgressPercent({
      status: 'in_progress',
      createdAtMs: now - AUDIT_PROGRESS_EXPECTED_MS * 2,
      nowMs: now,
    })
    expect(late).toBe(92)
  })
})

describe('estimateAuditRemainingMinutes', () => {
  const now = 1_700_000_000_000

  it('returns the typical window at the start', () => {
    expect(estimateAuditRemainingMinutes(now, now)).toBe(8)
  })

  it('returns 0 after the typical window', () => {
    expect(estimateAuditRemainingMinutes(now - AUDIT_PROGRESS_EXPECTED_MS - 1, now)).toBe(0)
  })
})

describe('parseAuditTimestampMs', () => {
  it('parses ISO timestamps and rejects junk', () => {
    expect(parseAuditTimestampMs('2026-09-09T08:00:00.000Z')).toBe(
      Date.parse('2026-09-09T08:00:00.000Z'),
    )
    expect(parseAuditTimestampMs('')).toBeNull()
    expect(parseAuditTimestampMs('not-a-date')).toBeNull()
  })
})

describe('tReportFill', () => {
  it('replaces placeholders', () => {
    expect(
      tReportFill({ en: 'About {n} min left', ru: '', he: '' }, 'en', { n: 5 }),
    ).toBe('About 5 min left')
  })
})

describe('auditWaitingPlaceholderHtml', () => {
  it('paints waiting copy instead of a blank document', () => {
    const html = auditWaitingPlaceholderHtml('en')
    expect(html).toContain(auditReportCopy.waiting.en)
    expect(html).toContain(auditReportCopy.queued.en)
    expect(html).toContain('background:#0d0d0d')
    expect(html).toContain('lang="en"')
    expect(html).toContain('dir="ltr"')
  })

  it('uses RTL for Hebrew', () => {
    const html = auditWaitingPlaceholderHtml('he')
    expect(html).toContain('dir="rtl"')
    expect(html).toContain(auditReportCopy.waiting.he)
  })
})

describe('nextAuditPollDelayMs', () => {
  it('uses the default cadence on success', () => {
    expect(nextAuditPollDelayMs(200, null)).toBe(AUDIT_REPORT_POLL_MS)
  })

  it('honors Retry-After seconds on 429', () => {
    expect(nextAuditPollDelayMs(429, '12')).toBe(12_000)
  })

  it('falls back when Retry-After is missing', () => {
    expect(nextAuditPollDelayMs(429, null)).toBe(Math.min(AUDIT_REPORT_POLL_MS * 2, 30_000))
  })
})
