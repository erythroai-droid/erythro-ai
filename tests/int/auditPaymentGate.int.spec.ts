import { describe, expect, it } from 'vitest'
import { isUnpaidAuditCheckout } from '@/lib/auditPaymentGate'

describe('isUnpaidAuditCheckout', () => {
  it('blocks pending / failed / refunded Grow checkouts', () => {
    expect(isUnpaidAuditCheckout({ paymentStatus: 'pending', paymentAmount: 390 })).toBe(true)
    expect(isUnpaidAuditCheckout({ paymentStatus: 'failed', paymentAmount: 490 })).toBe(true)
    expect(isUnpaidAuditCheckout({ paymentStatus: 'refunded', paymentAmount: 390 })).toBe(true)
  })

  it('allows paid and free (none / no amount)', () => {
    expect(isUnpaidAuditCheckout({ paymentStatus: 'paid', paymentAmount: 390 })).toBe(false)
    expect(isUnpaidAuditCheckout({ paymentStatus: 'none' })).toBe(false)
    expect(isUnpaidAuditCheckout({})).toBe(false)
    expect(isUnpaidAuditCheckout({ paymentStatus: 'none', paymentAmount: 0 })).toBe(false)
  })

  it('blocks positive amount without paid status', () => {
    expect(isUnpaidAuditCheckout({ paymentStatus: 'none', paymentAmount: 99 })).toBe(true)
  })
})
