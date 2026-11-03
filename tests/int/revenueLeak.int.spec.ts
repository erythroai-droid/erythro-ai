import { describe, expect, it } from 'vitest'
import {
  LEAK_TOTAL_MAX,
  SPRINT_PRICE_ILS,
  computeLeak,
  leakBreakdown,
  lightFor,
  monthlyRevenueOf,
  parseMoneyInput,
  parsePillars,
  pillarsFromAuditSummary,
  pillarsFromOverall,
} from '@/lib/revenueLeak'

describe('leakBreakdown', () => {
  it('is zero for a perfect site', () => {
    const b = leakBreakdown({ speed: 100, leads: 100, seo: 100, security: 100, ai: 100 })
    expect(b.total).toBe(0)
  })

  it('never exceeds the 42% ceiling', () => {
    const b = leakBreakdown({ speed: 0, leads: 0, seo: 0, security: 0, ai: 0 })
    expect(b.speed + b.forms + b.visibility + b.security).toBe(50)
    expect(b.total).toBe(LEAK_TOTAL_MAX)
  })

  it('scales each area by its cap', () => {
    const b = leakBreakdown({ speed: 50, leads: 50, seo: 50, security: 50, ai: 50 })
    expect(b.speed).toBe(10)
    expect(b.forms).toBe(7.5)
    expect(b.visibility).toBe(5)
    expect(b.security).toBe(2.5)
    expect(b.total).toBe(25)
  })

  it('averages SEO and AI for the visibility area', () => {
    const b = leakBreakdown({ speed: 100, leads: 100, seo: 100, security: 100, ai: 0 })
    expect(b.visibility).toBe(5)
  })

  it('clamps out-of-range scores', () => {
    const b = leakBreakdown({ speed: 140, leads: -20, seo: 100, security: 100, ai: 100 })
    expect(b.speed).toBe(0)
    expect(b.forms).toBe(15)
  })
})

describe('lightFor', () => {
  it('maps score bands to traffic lights', () => {
    expect(lightFor(0)).toBe('red')
    expect(lightFor(59)).toBe('red')
    expect(lightFor(60)).toBe('yellow')
    expect(lightFor(79)).toBe('yellow')
    expect(lightFor(80)).toBe('green')
    expect(lightFor(100)).toBe('green')
  })
})

describe('parsePillars', () => {
  it('accepts a complete object and clamps', () => {
    expect(parsePillars({ speed: 40, leads: 55, seo: 70, security: 120, ai: 30 })).toEqual({
      speed: 40,
      leads: 55,
      seo: 70,
      security: 100,
      ai: 30,
    })
  })

  it('accepts numeric strings and executive_scorecard long keys', () => {
    expect(parsePillars({ speed: '40', leads: 55, seo: 70, security: 90, ai: 30 })).toEqual({
      speed: 40,
      leads: 55,
      seo: 70,
      security: 90,
      ai: 30,
    })
    expect(
      parsePillars({
        speed_mobile_ux: 41,
        lead_gen_forms: 56,
        seo_visibility: 71,
        security_stability: 91,
        ai_visibility: 31,
      }),
    ).toEqual({ speed: 41, leads: 56, seo: 71, security: 91, ai: 31 })
  })

  it('rejects partial or malformed data', () => {
    expect(parsePillars(null)).toBeNull()
    expect(parsePillars('x')).toBeNull()
    expect(parsePillars({ speed: 40, leads: 55, seo: 70, security: 90 })).toBeNull()
    expect(parsePillars({ speed: 'nope', leads: 55, seo: 70, security: 90, ai: 30 })).toBeNull()
  })
})

describe('pillarsFromAuditSummary', () => {
  it('prefers short pillars, else executive_scorecard', () => {
    expect(
      pillarsFromAuditSummary({
        pillars: { speed: 10, leads: 20, seo: 30, security: 40, ai: 50 },
        executive_scorecard: {
          speed_mobile_ux: 1,
          lead_gen_forms: 2,
          seo_visibility: 3,
          security_stability: 4,
          ai_visibility: 5,
        },
      }),
    ).toEqual({ speed: 10, leads: 20, seo: 30, security: 40, ai: 50 })
    expect(
      pillarsFromAuditSummary({
        executive_scorecard: {
          speed_mobile_ux: 11,
          lead_gen_forms: 22,
          seo_visibility: 33,
          security_stability: 44,
          ai_visibility: 55,
        },
      }),
    ).toEqual({ speed: 11, leads: 22, seo: 33, security: 44, ai: 55 })
  })
})

describe('pillarsFromOverall', () => {
  it('uses the overall score for every scale', () => {
    expect(pillarsFromOverall(48)).toEqual({ speed: 48, leads: 48, seo: 48, security: 48, ai: 48 })
  })
})

describe('monthlyRevenueOf', () => {
  it('uses revenue directly', () => {
    expect(monthlyRevenueOf({ mode: 'revenue', monthlyRevenue: 30000 })).toBe(30000)
  })

  it('multiplies leads by the average deal', () => {
    expect(monthlyRevenueOf({ mode: 'leads', leadsPerMonth: 20, avgDeal: 1500 })).toBe(30000)
  })

  it('treats bad numbers as zero', () => {
    expect(monthlyRevenueOf({ mode: 'revenue', monthlyRevenue: -5 })).toBe(0)
    expect(monthlyRevenueOf({ mode: 'revenue', monthlyRevenue: Number.NaN })).toBe(0)
  })
})

describe('computeLeak', () => {
  it('applies revenue × p / (1 − p)', () => {
    // 20% lost → loss is a quarter of today's revenue
    const result = computeLeak(
      { speed: 0, forms: 0, visibility: 0, security: 0, total: 20 },
      { mode: 'revenue', monthlyRevenue: 28000 },
    )
    expect(result.monthly).toBe(7000)
    expect(result.yearly).toBe(84000)
    expect(result.percent).toBe(20)
    expect(result.sprintPrice).toBe(SPRINT_PRICE_ILS)
    // 2200 / (7000 / 30) = 9.43 → 10 days
    expect(result.paybackDays).toBe(10)
  })

  it('returns no loss and no payback when revenue is empty', () => {
    const result = computeLeak(
      { speed: 0, forms: 0, visibility: 0, security: 0, total: 20 },
      { mode: 'revenue', monthlyRevenue: 0 },
    )
    expect(result.monthly).toBe(0)
    expect(result.paybackDays).toBeNull()
  })

  it('returns no loss for a perfect site', () => {
    const result = computeLeak(
      { speed: 0, forms: 0, visibility: 0, security: 0, total: 0 },
      { mode: 'revenue', monthlyRevenue: 50000 },
    )
    expect(result.monthly).toBe(0)
    expect(result.paybackDays).toBeNull()
  })

  it('rounds small losses to the nearest 10', () => {
    const result = computeLeak(
      { speed: 0, forms: 0, visibility: 0, security: 0, total: 10 },
      { mode: 'revenue', monthlyRevenue: 3000 },
    )
    // 3000 × 0.1 / 0.9 = 333.3 → 330
    expect(result.monthly).toBe(330)
  })
})

describe('parseMoneyInput', () => {
  it('reads grouped numbers', () => {
    expect(parseMoneyInput('12 000')).toBe(12000)
    expect(parseMoneyInput('12,000')).toBe(12000)
    expect(parseMoneyInput('₪ 45000')).toBe(45000)
  })

  it('rejects empty and non-positive input', () => {
    expect(parseMoneyInput('')).toBe(0)
    expect(parseMoneyInput('abc')).toBe(0)
  })
})
