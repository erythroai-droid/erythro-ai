import { describe, expect, it } from 'vitest'
import { detectAiReferrer } from '@/lib/aiReferral'
import {
  buildFaqPageSchema,
  buildOrganizationSchema,
  buildWebSiteSchema,
} from '@/lib/brandSchema'
import { defaultSiteContent } from '@/lib/defaultContent'

describe('brandSchema', () => {
  it('builds Organization schema with contact and sameAs', () => {
    const schema = buildOrganizationSchema(
      defaultSiteContent,
      'Digital agency in Eilat, Israel.',
    ) as Record<string, unknown>

    expect(schema['@type']).toBe('Organization')
    expect(schema.name).toBe('Erythro.ai')
    expect(schema.sameAs).toEqual([
      'https://facebook.com/erythro.ai',
      'https://tiktok.com/@erythro.ai',
    ])
    expect(Array.isArray(schema.contactPoint)).toBe(true)
  })

  it('builds FAQPage schema from default FAQ items', () => {
    const schema = buildFaqPageSchema(defaultSiteContent.faq.items) as Record<string, unknown>
    expect(schema?.['@type']).toBe('FAQPage')
    expect(Array.isArray(schema?.mainEntity)).toBe(true)
    expect((schema.mainEntity as unknown[]).length).toBeGreaterThan(0)
  })

  it('builds WebSite schema', () => {
    const schema = buildWebSiteSchema('Test description') as Record<string, unknown>
    expect(schema['@type']).toBe('WebSite')
    expect(schema.description).toBe('Test description')
  })
})

describe('aiReferral', () => {
  it('detects known AI assistant referrers', () => {
    expect(detectAiReferrer('https://chatgpt.com/c/abc')).toBe('chatgpt.com')
    expect(detectAiReferrer('https://www.perplexity.ai/search?q=test')).toBe('perplexity.ai')
    expect(detectAiReferrer('https://erythro.ai/')).toBeNull()
  })
})
