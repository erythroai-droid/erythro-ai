import { describe, expect, it } from 'vitest'
import { parseAuditReportId } from '@/lib/auditReport'

describe('parseAuditReportId', () => {
  it('accepts positive integer strings', () => {
    expect(parseAuditReportId('1')).toBe(1)
    expect(parseAuditReportId('42')).toBe(42)
  })

  it('rejects invalid ids', () => {
    expect(parseAuditReportId('')).toBeNull()
    expect(parseAuditReportId('0')).toBeNull()
    expect(parseAuditReportId('-1')).toBeNull()
    expect(parseAuditReportId('12.3')).toBeNull()
    expect(parseAuditReportId('abc')).toBeNull()
  })
})
