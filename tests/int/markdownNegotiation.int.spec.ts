import { describe, it, expect } from 'vitest'
import {
  shouldServeMarkdown,
  estimateMarkdownTokens,
  generateMarkdownForRoute,
  resolveLocale,
} from '@/lib/markdownNegotiation'
import { getCachedPortfolioProjects } from '@/lib/cmsPages'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

describe('shouldServeMarkdown', () => {
  it('returns true when Accept header is text/markdown', () => {
    expect(shouldServeMarkdown('text/markdown')).toBe(true)
    expect(shouldServeMarkdown('text/x-markdown')).toBe(true)
    expect(shouldServeMarkdown('text/vnd.markdown')).toBe(true)
  })

  it('returns true when text/markdown has higher or equal quality than text/html', () => {
    expect(shouldServeMarkdown('text/markdown, text/html;q=0.9')).toBe(true)
    expect(shouldServeMarkdown('text/html;q=0.8, text/markdown;q=0.9')).toBe(true)
    expect(shouldServeMarkdown('text/markdown;q=1, text/html;q=1')).toBe(true)
  })

  it('returns false for standard browser Accept headers', () => {
    const browserAccept =
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
    expect(shouldServeMarkdown(browserAccept)).toBe(false)
  })

  it('returns false when text/html is strictly preferred over text/markdown', () => {
    expect(shouldServeMarkdown('text/html, text/markdown;q=0.5')).toBe(false)
    expect(shouldServeMarkdown('text/html;q=0.9, text/markdown;q=0.5')).toBe(false)
  })

  it('returns false for generic wildcards, empty strings, null, or unrelated mimes', () => {
    expect(shouldServeMarkdown('*/*')).toBe(false)
    expect(shouldServeMarkdown('')).toBe(false)
    expect(shouldServeMarkdown(null)).toBe(false)
    expect(shouldServeMarkdown('application/json')).toBe(false)
    expect(shouldServeMarkdown('image/png, image/jpeg')).toBe(false)
  })
})

describe('estimateMarkdownTokens', () => {
  it('returns 0 for empty string', () => {
    expect(estimateMarkdownTokens('')).toBe(0)
  })

  it('returns reasonable token counts based on length', () => {
    const text = 'Hello world! This is a test markdown string for token counting.'
    const tokens = estimateMarkdownTokens(text)
    expect(tokens).toBe(Math.ceil(text.length / 4))
    expect(tokens).toBeGreaterThan(5)
  })
})

describe('resolveLocale', () => {
  it('resolves supported locales correctly', () => {
    expect(resolveLocale('en')).toBe('en')
    expect(resolveLocale('RU')).toBe('ru')
    expect(resolveLocale('he')).toBe('he')
    expect(resolveLocale('fr')).toBe('en')
    expect(resolveLocale(null)).toBe('en')
  })
})

describe('generateMarkdownForRoute', () => {
  it('generates markdown for home route (/)', async () => {
    const { markdown, status } = await generateMarkdownForRoute('/', 'en')
    expect(status).toBe(200)
    expect(markdown).toContain('# Erythro.ai')
    expect(markdown.toLowerCase()).toContain('services')
    expect(markdown.toLowerCase()).toContain('solutions')
    expect(markdown.toLowerCase()).toContain('faq')
    expect(markdown).toContain('Contact & Office')
  }, 30_000)

  it('generates localized markdown for home route in Russian and Hebrew', async () => {
    const ruResult = await generateMarkdownForRoute('/', 'ru')
    expect(ruResult.status).toBe(200)
    expect(ruResult.markdown).toContain('# Erythro.ai')

    const heResult = await generateMarkdownForRoute('/', 'he')
    expect(heResult.status).toBe(200)
    expect(heResult.markdown).toContain('# Erythro.ai')
  }, 30_000)

  it('generates markdown for /about', async () => {
    const { markdown, status } = await generateMarkdownForRoute('/about', 'en')
    expect(status).toBe(200)
    expect(markdown).toContain('# About Erythro.ai')
    expect(markdown).toContain('## Brand facts')
    expect(markdown).toContain('## Services')
    expect(markdown).toContain('Eilat, Israel')
  }, 30_000)

  it('generates markdown for /contacts', async () => {
    const { markdown, status } = await generateMarkdownForRoute('/contacts', 'en')
    expect(status).toBe(200)
    expect(markdown).toContain('# Contacts — Erythro.ai')
    expect(markdown).toContain('Direct Contact Methods')
    expect(markdown).toContain('Phone:')
  }, 30_000)

  it('generates markdown for /portfolio index and individual project', async () => {
    const indexResult = await generateMarkdownForRoute('/portfolio', 'en')
    expect(indexResult.status).toBe(200)
    expect(indexResult.markdown).toContain('# Portfolio & Case Studies — Erythro.ai')
    expect(indexResult.markdown).toContain('## Categories')
    expect(indexResult.markdown).toContain('## Selected Projects')

    const projects = await getCachedPortfolioProjects()
    const targetSlug = projects[0]?.slug || 'ai-lead-qualifier'
    const projectResult = await generateMarkdownForRoute(`/portfolio/${targetSlug}`, 'en')
    expect(projectResult.status).toBe(200)
    expect(projectResult.markdown).toContain('Case Study')
  }, 30_000)

  it('generates markdown for /services index and individual service', async () => {
    const indexResult = await generateMarkdownForRoute('/services', 'en')
    expect(indexResult.status).toBe(200)
    expect(indexResult.markdown).toContain('# Services — Erythro.ai')
    expect(indexResult.markdown).toContain('## Available Services')

    const serviceResult = await generateMarkdownForRoute('/services/ai-automation', 'en')
    expect(serviceResult.status).toBe(200)
    expect(serviceResult.markdown).toContain('Automation')
    expect(serviceResult.markdown).toContain('## What we do')
  }, 30_000)

  it('generates markdown for legal pages (/privacy, /terms, /accessibility)', async () => {
    const privacy = await generateMarkdownForRoute('/privacy', 'en')
    expect(privacy.status).toBe(200)
    expect(privacy.markdown).toContain('Privacy Policy')

    const terms = await generateMarkdownForRoute('/terms', 'en')
    expect(terms.status).toBe(200)
    expect(terms.markdown).toContain('Terms')

    const accessibility = await generateMarkdownForRoute('/accessibility', 'en')
    expect(accessibility.status).toBe(200)
    expect(accessibility.markdown).toContain('Accessibility')
  }, 30_000)

  it('generates markdown for /audit', async () => {
    const { markdown, status } = await generateMarkdownForRoute('/audit', 'en')
    expect(status).toBe(200)
    expect(markdown).toContain('# AI Audit — Erythro.ai')
    expect(markdown).toContain('## How the audit works')
    expect(markdown).toContain('## The 5 Audit Pillars')
    expect(markdown).toContain('## Audit Plans & Pricing')
  }, 30_000)

  it('generates markdown for /order/:slug', async () => {
    const { markdown, status } = await generateMarkdownForRoute('/order/audit-diagnostic', 'en')
    expect(status).toBe(200)
    expect(markdown).toContain('# Order Plan:')
    expect(markdown).toContain('Base Price')
  }, 30_000)

  it('returns status 404 with friendly markdown for unknown route', async () => {
    const { markdown, status } = await generateMarkdownForRoute('/unknown-page-12345', 'en')
    expect(status).toBe(404)
    expect(markdown).toContain('# 404 - Not Found')
    expect(markdown).toContain('Canonical Resources')
  }, 30_000)
})

describe('middleware markdown content negotiation', () => {
  it('rewrites requests with Accept: text/markdown to /api/markdown-negotiate', () => {
    const req = new NextRequest('https://erythro.ai/about', {
      headers: {
        accept: 'text/markdown',
      },
    })
    const res = middleware(req)
    expect(res.headers.get('x-middleware-rewrite')).toContain('/api/markdown-negotiate?path=%2Fabout')
  })

  it('does not rewrite standard browser requests with Accept: text/html', () => {
    const req = new NextRequest('https://erythro.ai/about', {
      headers: {
        accept: 'text/html,application/xhtml+xml',
      },
    })
    const res = middleware(req)
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
  })

  it('does not rewrite /api or /admin routes even if Accept: text/markdown is present', () => {
    const reqApi = new NextRequest('https://erythro.ai/api/contact', {
      headers: {
        accept: 'text/markdown',
      },
    })
    const resApi = middleware(reqApi)
    expect(resApi.headers.get('x-middleware-rewrite')).toBeNull()

    const reqAdmin = new NextRequest('https://erythro.ai/admin', {
      headers: {
        accept: 'text/markdown',
      },
    })
    const resAdmin = middleware(reqAdmin)
    expect(resAdmin.headers.get('x-middleware-rewrite')).toBeNull()
  })
})
