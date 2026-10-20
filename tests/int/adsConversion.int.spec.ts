import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  trackAdsPurchase,
  trackContactLead,
  trackFreeAuditLead,
  trackOrderLead,
} from '@/lib/adsConversion'

describe('adsConversion (Google Ads + GA4 Key Events + Meta Pixel)', () => {
  const gtagCalls: unknown[][] = []
  const fbqCalls: unknown[][] = []

  beforeEach(() => {
    gtagCalls.length = 0
    fbqCalls.length = 0
    window.localStorage.clear()
    window.__ERYTHRO_GA_CONFIGURED__ = false
    window.gtag = vi.fn((...args: unknown[]) => {
      gtagCalls.push(args)
    })
    window.fbq = vi.fn((...args: unknown[]) => {
      fbqCalls.push(args)
    })
  })

  it('fires consent update, GA4 config, Ads conversion, GA4 qualify_lead, and Meta Lead on free audit', () => {
    trackFreeAuditLead('42')

    expect(gtagCalls).toContainEqual([
      'consent',
      'update',
      expect.objectContaining({
        ad_storage: 'granted',
        analytics_storage: 'granted',
      }),
    ])
    expect(gtagCalls).toContainEqual([
      'config',
      'G-F3BTVWGDRS',
      expect.objectContaining({ send_page_view: true }),
    ])
    expect(gtagCalls).toContainEqual([
      'event',
      'conversion',
      expect.objectContaining({
        send_to: 'AW-18453652197/L4VgCMWPhZ4dEOXFsd9E',
        transaction_id: '42',
      }),
    ])
    expect(gtagCalls).toContainEqual([
      'event',
      'qualify_lead',
      expect.objectContaining({
        send_to: 'G-F3BTVWGDRS',
        transaction_id: '42',
        lead_source: 'audit',
        plan_slug: 'audit-free',
      }),
    ])
    expect(fbqCalls).toContainEqual([
      'track',
      'Lead',
      { content_name: 'free_audit' },
      { eventID: '42' },
    ])

    // Duplicate call with same id must not re-fire conversion events
    const countAfterFirst = gtagCalls.filter((c) => c[0] === 'event').length
    trackFreeAuditLead('42')
    const countAfterSecond = gtagCalls.filter((c) => c[0] === 'event').length
    expect(countAfterSecond).toBe(countAfterFirst)
  })

  it('fires qualify_lead and close_convert_lead for non-audit order packages', () => {
    trackOrderLead('101', 'free-start')

    expect(gtagCalls).toContainEqual([
      'event',
      'qualify_lead',
      expect.objectContaining({
        send_to: 'G-F3BTVWGDRS',
        transaction_id: '101',
        lead_source: 'order',
        plan_slug: 'free-start',
      }),
    ])
    expect(gtagCalls).toContainEqual([
      'event',
      'close_convert_lead',
      expect.objectContaining({
        send_to: 'G-F3BTVWGDRS',
        transaction_id: '101',
        lead_source: 'order',
        plan_slug: 'free-start',
      }),
    ])
  })

  it('fires qualify_lead for contact form / modal leads', () => {
    trackContactLead('CNT-77', 'contact')

    expect(gtagCalls).toContainEqual([
      'event',
      'qualify_lead',
      expect.objectContaining({
        send_to: 'G-F3BTVWGDRS',
        transaction_id: 'CNT-77',
        lead_source: 'contact',
      }),
    ])
  })

  it('fires Ads purchase + GA4 purchase and close_convert_lead on paid return', () => {
    trackAdsPurchase('555', 390)

    expect(gtagCalls).toContainEqual([
      'event',
      'conversion',
      expect.objectContaining({
        send_to: 'AW-18453652197/-mcPCMys6Z0dEOXFsd9E',
        transaction_id: '555',
        value: 390,
        currency: 'ILS',
      }),
    ])
    expect(gtagCalls).toContainEqual([
      'event',
      'purchase',
      expect.objectContaining({
        send_to: 'G-F3BTVWGDRS',
        transaction_id: '555',
        value: 390,
        currency: 'ILS',
      }),
    ])
    expect(gtagCalls).toContainEqual([
      'event',
      'close_convert_lead',
      expect.objectContaining({
        send_to: 'G-F3BTVWGDRS',
        transaction_id: '555',
        value: 390,
        currency: 'ILS',
      }),
    ])
  })
})
