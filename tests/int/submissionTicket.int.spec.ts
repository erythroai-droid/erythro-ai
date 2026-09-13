import { describe, expect, it } from 'vitest'
import { formatSubmissionTicketId } from '@/lib/submissionTicket'

describe('formatSubmissionTicketId', () => {
  it('prefixes by intake source', () => {
    expect(formatSubmissionTicketId('audit', 153)).toBe('AUD-153')
    expect(formatSubmissionTicketId('order', '88')).toBe('ORD-88')
    expect(formatSubmissionTicketId('contact', 42)).toBe('REQ-42')
    expect(formatSubmissionTicketId(undefined, 7)).toBe('REQ-7')
  })

  it('does not double-prefix an existing ticket', () => {
    expect(formatSubmissionTicketId('audit', 'AUD-153')).toBe('AUD-153')
    expect(formatSubmissionTicketId('contact', 'req-9')).toBe('REQ-9')
  })

  it('returns null for empty ids', () => {
    expect(formatSubmissionTicketId('audit', '')).toBeNull()
    expect(formatSubmissionTicketId('audit', null)).toBeNull()
  })
})
