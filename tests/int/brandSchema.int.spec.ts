import { describe, expect, it } from 'vitest'
import { detectAiReferrer } from '@/lib/aiReferral'
import {
  FACEBOOK_CANONICAL,
  buildFaqPageSchema,
  buildOrganizationSchema,
  buildWebSiteSchema,
  normalizeSameAsUrl,
} from '@/lib/brandSchema'
import { defaultSiteContent } from '@/lib/defaultContent'

describe('brandSchema', () => {
  it('builds Organization schema with contact, founder, and sameAs', () => {
    const schema = buildOrganizationSchema(
      defaultSiteContent,
      'Digital agency in Eilat, Israel.',
    ) as Record<string, unknown>

    expect(schema['@type']).toBe('Organization')
    expect(schema.name).toBe('Erythro.ai')
    expect(schema.sameAs).toEqual([
      'https://github.com/erythroai-droid',
      'https://www.linkedin.com/in/erythro-ai',
      'https://www.instagram.com/erythro.ai/',
      'https://www.youtube.com/@ErythroAi',
      FACEBOOK_CANONICAL,
      'https://t.me/erythroai',
    ])
    expect(schema.founder).toEqual({
      '@type': 'Person',
      '@id': 'https://erythro.ai/#founder',
      name: 'Vadym Kovalenko',
      jobTitle: 'Founder & Lead Architect',
      url: 'https://www.linkedin.com/in/erythro-ai',
      sameAs: [
        'https://www.linkedin.com/in/erythro-ai',
        'https://github.com/erythroai-droid',
      ],
    })
    expect(schema.knowsAbout).toEqual([
      'Generative Engine Optimization (GEO)',
      'AI Website Audit',
      'Next.js Web Development',
      'AI Agents & Business Automation',
      'Conversion Rate Optimization (CRO)',
    ])
    expect(schema.areaServed).toEqual(
      expect.arrayContaining([
        { '@type': 'Country', name: 'Israel' },
        { '@type': 'City', name: 'Tel Aviv' },
        { '@type': 'City', name: 'Jerusalem' },
        { '@type': 'City', name: 'Haifa' },
        { '@type': 'City', name: 'Eilat' },
        { '@type': 'AdministrativeArea', name: 'Global' },
      ]),
    )
    expect(Array.isArray(schema.contactPoint)).toBe(true)
  })

  it('normalizes Facebook share / profile links to the vanity Page URL', () => {
    expect(normalizeSameAsUrl('https://www.facebook.com/share/1DKaM3k5ox/')).toBe(
      FACEBOOK_CANONICAL,
    )
    expect(
      normalizeSameAsUrl('https://www.facebook.com/profile.php?id=61592990561120'),
    ).toBe(FACEBOOK_CANONICAL)
    expect(normalizeSameAsUrl('https://facebook.com/erythro.ai')).toBe(FACEBOOK_CANONICAL)

    const withShare = {
      ...defaultSiteContent,
      siteSettings: {
        ...defaultSiteContent.siteSettings,
        facebook: 'https://www.facebook.com/share/1DKaM3k5ox/',
      },
    }
    const schema = buildOrganizationSchema(withShare) as { sameAs: string[] }
    expect(schema.sameAs).toContain(FACEBOOK_CANONICAL)
    expect(schema.sameAs.some((u) => u.includes('/share/'))).toBe(false)
    expect(schema.sameAs.filter((u) => u === FACEBOOK_CANONICAL)).toHaveLength(1)
  })

  it('builds FAQPage schema from default FAQ items', () => {
    const schema = buildFaqPageSchema(defaultSiteContent.faq.items) as Record<string, unknown>
    expect(schema?.['@type']).toBe('FAQPage')
    expect(schema.inLanguage).toBe('en')
    expect(Array.isArray(schema?.mainEntity)).toBe(true)
    const entities = schema.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>
    expect(entities.length).toBeGreaterThan(0)
    expect(entities[0]?.name).toBe(defaultSiteContent.faq.items[0]?.question.en)
  })

  it('builds FAQPage schema in the requested locale', () => {
    const schema = buildFaqPageSchema(
      defaultSiteContent.faq.items,
      'ru',
      'https://erythro.ai/#faq',
    ) as {
      inLanguage: string
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>
    }
    expect(schema.inLanguage).toBe('ru')
    expect(schema.mainEntity[0]?.name).toBe(defaultSiteContent.faq.items[0]?.question.ru)
    expect(schema.mainEntity[0]?.acceptedAnswer.text).toBe(
      defaultSiteContent.faq.items[0]?.answer.ru,
    )
    expect(schema.mainEntity[0]?.name).not.toBe(defaultSiteContent.faq.items[0]?.question.en)
  })

  it('builds WebSite schema', () => {
    const schema = buildWebSiteSchema('Test description') as Record<string, unknown>
    expect(schema['@type']).toBe('WebSite')
    expect(schema.description).toBe('Test description')
    expect(schema.url).toBe('https://erythro.ai')
  })

  it('uses the slash-free canonical as Organization url', () => {
    const schema = buildOrganizationSchema(defaultSiteContent) as Record<string, unknown>
    expect(schema.url).toBe('https://erythro.ai')
  })
})

describe('aiReferral', () => {
  it('detects known AI assistant referrers', () => {
    expect(detectAiReferrer('https://chatgpt.com/c/abc')).toBe('chatgpt.com')
    expect(detectAiReferrer('https://www.perplexity.ai/search?q=test')).toBe('perplexity.ai')
    expect(detectAiReferrer('https://erythro.ai/')).toBeNull()
  })
})
