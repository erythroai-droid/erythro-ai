import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as robotsGET } from '@/app/robots.txt/route'
import sitemap, { staticSitemapFallback } from '@/app/sitemap'
import { middleware } from '@/middleware'
import {
  canonicalUrlForPath,
  isVercelAppHost,
  shouldRedirectVercelAppToCanonical,
  shouldSkipVercelAppRedirect,
} from '@/lib/vercelHost'

describe('vercelHost', () => {
  it('detects *.vercel.app hosts', () => {
    expect(isVercelAppHost('erythro-ai.vercel.app')).toBe(true)
    expect(isVercelAppHost('erythro-ai-git-feat-erythro-ai.vercel.app')).toBe(true)
    expect(isVercelAppHost('erythro-ai.vercel.app:443')).toBe(true)
    expect(isVercelAppHost('erythro.ai')).toBe(false)
    expect(isVercelAppHost('www.erythro.ai')).toBe(false)
  })

  it('redirects only production vercel.app hosts, skipping robots and API', () => {
    expect(shouldRedirectVercelAppToCanonical('erythro-ai.vercel.app', 'production')).toBe(true)
    expect(shouldRedirectVercelAppToCanonical('erythro-ai.vercel.app', 'preview')).toBe(false)
    expect(shouldRedirectVercelAppToCanonical('erythro.ai', 'production')).toBe(false)
    expect(shouldSkipVercelAppRedirect('/robots.txt')).toBe(true)
    expect(shouldSkipVercelAppRedirect('/api/cron/sitemap-health')).toBe(true)
    expect(shouldSkipVercelAppRedirect('/')).toBe(false)
  })

  it('canonical homepage has no trailing slash', () => {
    expect(canonicalUrlForPath('/')).toBe('https://erythro.ai')
    expect(canonicalUrlForPath('/about')).toBe('https://erythro.ai/about')
  })
})

describe('robots.txt', () => {
  it('allows indexing on erythro.ai and lists the sitemap', async () => {
    const res = robotsGET(
      new Request('https://erythro.ai/robots.txt', { headers: { host: 'erythro.ai' } }),
    )
    expect(res.status).toBe(200)
    const body = await res.text()
    expect(body).toContain('User-Agent: *')
    expect(body).toContain('Allow: /')
    expect(body).toContain('Sitemap: https://erythro.ai/sitemap.xml')
    expect(body).not.toMatch(/^Disallow: \/$/m)
    expect(res.headers.get('X-Robots-Tag')).toBeNull()
  })

  it('disallows all crawlers on *.vercel.app', async () => {
    const res = robotsGET(
      new Request('https://erythro-ai.vercel.app/robots.txt', {
        headers: { host: 'erythro-ai.vercel.app' },
      }),
    )
    const body = await res.text()
    expect(body).toContain('User-Agent: *')
    expect(body).toContain('Disallow: /')
    expect(body).not.toContain('Sitemap:')
    expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
  })
})

describe('middleware vercel.app', () => {
  it('sets X-Robots-Tag noindex on preview vercel.app without redirecting', () => {
    const req = new NextRequest('https://erythro-ai-git-feat-erythro-ai.vercel.app/about', {
      headers: { accept: 'text/html' },
    })
    const res = middleware(req)
    expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect(res.headers.get('location')).toBeNull()
  })

  it('308s production vercel.app HTML to the canonical host', () => {
    const prev = process.env.VERCEL_ENV
    process.env.VERCEL_ENV = 'production'
    try {
      const req = new NextRequest('https://erythro-ai.vercel.app/about', {
        headers: { accept: 'text/html' },
      })
      const res = middleware(req)
      expect(res.status).toBe(308)
      expect(res.headers.get('location')).toBe('https://erythro.ai/about')
      expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    } finally {
      if (prev === undefined) delete process.env.VERCEL_ENV
      else process.env.VERCEL_ENV = prev
    }
  })

  it('does not redirect production vercel.app /robots.txt', () => {
    const prev = process.env.VERCEL_ENV
    process.env.VERCEL_ENV = 'production'
    try {
      const req = new NextRequest('https://erythro-ai.vercel.app/robots.txt')
      const res = middleware(req)
      expect(res.status).not.toBe(308)
      expect(res.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    } finally {
      if (prev === undefined) delete process.env.VERCEL_ENV
      else process.env.VERCEL_ENV = prev
    }
  })
})

describe('sitemap fallback', () => {
  it('static fallback includes canonical homepage without a trailing slash', () => {
    const urls = new Set(staticSitemapFallback().map((e) => e.url))
    expect(urls.has('https://erythro.ai')).toBe(true)
    expect(urls.has('https://erythro.ai/')).toBe(false)
    expect(urls.has('https://erythro.ai/services/ai-automation')).toBe(true)
    expect(urls.has('https://erythro.ai/services/development')).toBe(true)
  })

  it('sitemap() still lists core pages', async () => {
    const entries = await sitemap()
    const urls = new Set(entries.map((e) => e.url))
    expect(urls.has('https://erythro.ai')).toBe(true)
    expect(urls.has('https://erythro.ai/audit')).toBe(true)
  }, 30_000)
})
