import { describe, expect, it } from 'vitest'
import sitemap from '@/app/sitemap'
import { getAllServiceSlugs } from '@/lib/servicePages'
import { getAllOrderSlugs } from '@/lib/orderPlans'
import { getAllPortfolioSlugs } from '@/lib/portfolioProjects'
import { getPortfolioSitemapEntries } from '@/lib/sitemapEntries'

describe('sitemap()', () => {
  it(
    'generates a complete sitemap including core pages, services, portfolio, orders, and legal',
    async () => {
      const entries = await sitemap()

      expect(Array.isArray(entries)).toBe(true)
      expect(entries.length).toBeGreaterThan(0)

      const urls = new Set(entries.map((e) => e.url))

      // Core static pages
      expect(urls.has('https://erythro.ai')).toBe(true)
      expect(urls.has('https://erythro.ai/about')).toBe(true)
      expect(urls.has('https://erythro.ai/contacts')).toBe(true)
      expect(urls.has('https://erythro.ai/audit')).toBe(true)
      expect(urls.has('https://erythro.ai/portfolio')).toBe(true)
      expect(urls.has('https://erythro.ai/privacy')).toBe(true)
      expect(urls.has('https://erythro.ai/terms')).toBe(true)
      expect(urls.has('https://erythro.ai/accessibility')).toBe(true)

      // All static service fallbacks must be included
      for (const slug of getAllServiceSlugs()) {
        expect(urls.has(`https://erythro.ai/services/${slug}`)).toBe(true)
      }

      // All order slugs (solutions + audit plans) must be included
      for (const slug of getAllOrderSlugs()) {
        expect(urls.has(`https://erythro.ai/order/${slug}`)).toBe(true)
      }

      // Portfolio: CMS-published cases when the collection has docs; static
      // seed slugs only as fallback. Do not require demo URLs that 404 (PIT-070).
      const portfolio = await getPortfolioSitemapEntries()
      expect(portfolio.length).toBeGreaterThan(0)
      for (const { slug } of portfolio) {
        expect(urls.has(`https://erythro.ai/portfolio/${slug}`)).toBe(true)
      }

      const staticSlugs = getAllPortfolioSlugs()
      const listed = new Set(portfolio.map((row) => row.slug))
      const usedStaticFallback =
        listed.size === staticSlugs.length && staticSlugs.every((slug) => listed.has(slug))
      if (!usedStaticFallback) {
        for (const slug of staticSlugs) {
          if (!listed.has(slug)) {
            expect(urls.has(`https://erythro.ai/portfolio/${slug}`)).toBe(false)
          }
        }
      }

      // Check entry properties
      for (const entry of entries) {
        expect(entry.url).toMatch(/^https:\/\/erythro\.ai/)
        expect(entry.changeFrequency).toBeDefined()
        expect(typeof entry.priority).toBe('number')
        expect(entry.priority).toBeGreaterThanOrEqual(0)
        expect(entry.priority).toBeLessThanOrEqual(1)
      }
    },
    30_000,
  )
})
