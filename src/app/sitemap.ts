import type { MetadataRoute } from 'next'
import { getAllOrderSlugs } from '@/lib/orderPlans'
import { getAllPortfolioSlugs } from '@/lib/portfolioProjects'
import { getAllServiceSlugs } from '@/lib/servicePages'
import {
  getAuditPageLastModified,
  getLegalSitemapEntries,
  getOrderSitemapEntries,
  getPortfolioSitemapEntries,
  getServiceSitemapEntries,
  getSiteSettingsLastModified,
  maxLastModified,
} from '@/lib/sitemapEntries'
import { canonicalSiteOrigin } from '@/lib/vercelHost'

export const revalidate = 3600

const SITE_URL = canonicalSiteOrigin()

const CORE_PATHS = [
  { path: '/', changeFrequency: 'weekly' as const, priority: 1 },
  { path: '/portfolio', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/contacts', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/audit', changeFrequency: 'monthly' as const, priority: 0.75 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
] as const

function loc(path: string): string {
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`
}

/** Always-200 fallback when CMS/DB throws (PIT-085). */
export function staticSitemapFallback(): MetadataRoute.Sitemap {
  return [
    ...CORE_PATHS.map((row) => ({
      url: loc(row.path),
      changeFrequency: row.changeFrequency,
      priority: row.priority,
    })),
    ...getAllServiceSlugs().map((slug) => ({
      url: loc(`/services/${slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...getAllPortfolioSlugs().map((slug) => ({
      url: loc(`/portfolio/${slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...getAllOrderSlugs().map((slug) => ({
      url: loc(`/order/${slug}`),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...['/privacy', '/terms', '/accessibility'].map((path) => ({
      url: loc(path),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ]
}

async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, portfolio, orders, legal, auditLastMod, siteSettingsLastMod] =
    await Promise.all([
      getServiceSitemapEntries(),
      getPortfolioSitemapEntries(),
      getOrderSitemapEntries(),
      getLegalSitemapEntries(),
      getAuditPageLastModified(),
      getSiteSettingsLastModified(),
    ])

  const contentStamp = maxLastModified([
    auditLastMod,
    siteSettingsLastMod,
    ...services.map((r) => r.lastModified),
    ...portfolio.map((r) => r.lastModified),
    ...orders.map((r) => r.lastModified),
    ...legal.map((r) => r.lastModified),
  ])

  return [
    {
      url: loc('/'),
      lastModified: contentStamp,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: loc('/portfolio'),
      lastModified: maxLastModified(portfolio.map((r) => r.lastModified)) || contentStamp,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: loc('/contacts'),
      lastModified: siteSettingsLastMod || contentStamp,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: loc('/audit'),
      lastModified: auditLastMod || contentStamp,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: loc('/about'),
      lastModified: siteSettingsLastMod || contentStamp,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...services.map((row) => ({
      url: loc(`/services/${row.slug}`),
      lastModified: row.lastModified || contentStamp,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...portfolio.map((row) => ({
      url: loc(`/portfolio/${row.slug}`),
      lastModified: row.lastModified || contentStamp,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...orders.map((row) => ({
      url: loc(`/order/${row.slug}`),
      lastModified: row.lastModified || contentStamp,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...legal.map((row) => ({
      url: loc(row.path),
      lastModified: row.lastModified || contentStamp,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ]
}

/**
 * Dynamic sitemap with CMS `updatedAt` as lastmod.
 * ISR hourly; rebuilt immediately when `payload-content` is revalidated.
 * Never throws 5xx — falls back to static slugs.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    return await buildSitemap()
  } catch (err) {
    console.error('[sitemap] generation failed, using static fallback:', err)
    return staticSitemapFallback()
  }
}
