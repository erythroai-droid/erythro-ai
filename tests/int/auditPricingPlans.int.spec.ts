import { describe, expect, it } from 'vitest'
import {
  auditPlanCheckoutMode,
  mergeAuditPricingPlans,
  orderPlanToAuditPricingCard,
  staticAuditPricingPlans,
} from '@/lib/auditPricingPlans'
import { AUDIT_ORDER_PLANS, getOrderPlan } from '@/lib/orderPlans'

describe('auditPricingPlans (Plans SoT)', () => {
  it('static fallback has four cards with Manual contact CTA', () => {
    const cards = staticAuditPricingPlans()
    expect(cards.map((c) => c.id)).toEqual(['free', 'diagnostic', 'pro', 'manual'])

    const manual = cards.find((c) => c.id === 'manual')
    expect(manual?.checkoutMode).toBe('contact')
    expect(manual?.ctaHref).toBe('#contact-modal')
    expect(manual?.price.en).toBe('2490')

    const diagnostic = cards.find((c) => c.id === 'diagnostic')
    expect(diagnostic?.featured).toBe(true)
    expect(diagnostic?.ctaHref).toBe('/order/audit-diagnostic')
    expect(diagnostic?.priceCompare?.en).toBe('290')
  })

  it('maps OrderPlan features value lines onto pricing cards', () => {
    const free = AUDIT_ORDER_PLANS.find((p) => p.slug === 'audit-free')!
    const card = orderPlanToAuditPricingCard(free)
    expect(card.features.length).toBeGreaterThanOrEqual(4)
    expect(card.features[0].en).toMatch(/Score 0–100/)
    expect(card.ctaHref).toBe('/order/audit-free')
    expect(card.checkoutMode).toBe('order')
  })

  it('merge keeps CMS order and appends missing static Manual', () => {
    const withoutManual = AUDIT_ORDER_PLANS.filter((p) => p.slug !== 'audit-manual')
    const cards = mergeAuditPricingPlans(withoutManual)
    expect(cards.map((c) => c.id)).toContain('manual')
    expect(cards).toHaveLength(4)
  })

  it('rejects Grow checkout for Manual plan', () => {
    const manual = getOrderPlan('audit-manual')
    expect(auditPlanCheckoutMode(manual)).toBe('contact')
    expect(manual?.checkoutMode).toBe('contact')
  })
})
