import type { MetadataRoute } from 'next'
import {
  getAuditPageLastModified,
  getLegalSitemapEntries,
  getOrderSitemapEntries,
  getPortfolioSitemapEntries,
  getServiceSitemapEntries,
  getSiteSettingsLastModified,
  maxLastModified,
} from '@/lib/sitemapEntries'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

/**
 * Dynamic sitemap with CMS `updatedAt` as lastmod.
 * Rebuilt when `payload-content` is revalidated (see revalidate hooks).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: contentStamp,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/portfolio`,
      lastModified: maxLastModified(portfolio.map((r) => r.lastModified)) || contentStamp,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contacts`,
      lastModified: siteSettingsLastMod || contentStamp,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/audit`,
      lastModified: auditLastMod || contentStamp,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: siteSettingsLastMod || contentStamp,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...services.map((row) => ({
      url: `${SITE_URL}/services/${row.slug}`,
      lastModified: row.lastModified || contentStamp,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...portfolio.map((row) => ({
      url: `${SITE_URL}/portfolio/${row.slug}`,
      lastModified: row.lastModified || contentStamp,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...orders.map((row) => ({
      url: `${SITE_URL}/order/${row.slug}`,
      lastModified: row.lastModified || contentStamp,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...legal.map((row) => ({
      url: `${SITE_URL}${row.path}`,
      lastModified: row.lastModified || contentStamp,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ]

  return entries
}
