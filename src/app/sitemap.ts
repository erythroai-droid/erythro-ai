import type { MetadataRoute } from 'next'
import {
  getAllOrderSlugsCms,
  getAllPortfolioSlugsCms,
  getAllServiceSlugsCms,
} from '@/lib/cmsPages'
import { getAllOrderSlugs } from '@/lib/orderPlans'
import { getAllPortfolioSlugs } from '@/lib/portfolioProjects'
import { getAllServiceSlugs } from '@/lib/servicePages'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

/**
 * Dynamic sitemap — rebuilt from CMS slugs whenever `payload-content` is
 * revalidated (afterChange/afterDelete hooks). Falls back to static catalogs
 * if Payload is unreachable.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  let serviceSlugs: string[] = []
  let portfolioSlugs: string[] = []
  let orderSlugs: string[] = []

  try {
    ;[serviceSlugs, portfolioSlugs, orderSlugs] = await Promise.all([
      getAllServiceSlugsCms(),
      getAllPortfolioSlugsCms(),
      getAllOrderSlugsCms(),
    ])
  } catch {
    serviceSlugs = getAllServiceSlugs()
    portfolioSlugs = getAllPortfolioSlugs()
    orderSlugs = getAllOrderSlugs()
  }

  if (!serviceSlugs.length) serviceSlugs = getAllServiceSlugs()
  if (!portfolioSlugs.length) portfolioSlugs = getAllPortfolioSlugs()
  if (!orderSlugs.length) orderSlugs = getAllOrderSlugs()

  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/portfolio`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...serviceSlugs.map((slug) => ({
      url: `${SITE_URL}/services/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...portfolioSlugs.map((slug) => ({
      url: `${SITE_URL}/portfolio/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...orderSlugs.map((slug) => ({
      url: `${SITE_URL}/order/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]

  return entries
}
