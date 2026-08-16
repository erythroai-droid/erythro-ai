import { getPayload } from 'payload'
import config from '@payload-config'
import { getAllOrderSlugs } from '@/lib/orderPlans'
import { getAllPortfolioSlugs } from '@/lib/portfolioProjects'
import { getAllServiceSlugs } from '@/lib/servicePages'
import { getCachedLegalPage } from '@/lib/legalPages.server'
import type { LegalPageId } from '@/lib/legalPages'

export type SitemapSlugEntry = {
  slug: string
  lastModified?: Date
}

function toDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d
  }
  return undefined
}

export function maxLastModified(dates: Array<Date | undefined>): Date | undefined {
  let max = 0
  for (const d of dates) {
    if (!d) continue
    const t = d.getTime()
    if (t > max) max = t
  }
  return max > 0 ? new Date(max) : undefined
}

async function fetchCollectionSitemap(
  collection: 'services' | 'portfolio-projects' | 'solution-plans',
): Promise<SitemapSlugEntry[]> {
  const payload = await getPayload({ config })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await (payload as any).find({
    collection,
    limit: 500,
    depth: 0,
    overrideAccess: true,
    select: { slug: true, updatedAt: true },
  })

  const out: SitemapSlugEntry[] = []
  for (const doc of res.docs || []) {
    const slug = typeof doc?.slug === 'string' ? doc.slug.trim() : ''
    if (!slug) continue
    out.push({
      slug,
      lastModified: toDate(doc.updatedAt),
    })
  }
  return out
}

export async function getServiceSitemapEntries(): Promise<SitemapSlugEntry[]> {
  try {
    const rows = await fetchCollectionSitemap('services')
    if (rows.length) return rows
  } catch (err) {
    console.error('[sitemap] services CMS failed:', err)
  }
  return getAllServiceSlugs().map((slug) => ({ slug }))
}

export async function getPortfolioSitemapEntries(): Promise<SitemapSlugEntry[]> {
  try {
    const rows = await fetchCollectionSitemap('portfolio-projects')
    if (rows.length) return rows
  } catch (err) {
    console.error('[sitemap] portfolio CMS failed:', err)
  }
  return getAllPortfolioSlugs().map((slug) => ({ slug }))
}

export async function getOrderSitemapEntries(): Promise<SitemapSlugEntry[]> {
  try {
    const rows = await fetchCollectionSitemap('solution-plans')
    if (rows.length) return rows
  } catch (err) {
    console.error('[sitemap] order plans CMS failed:', err)
  }
  return getAllOrderSlugs().map((slug) => ({ slug }))
}

export async function getLegalSitemapEntries(): Promise<
  Array<{ path: string; lastModified?: Date }>
> {
  const ids: Array<{ id: LegalPageId; path: string }> = [
    { id: 'privacy', path: '/privacy' },
    { id: 'terms', path: '/terms' },
    { id: 'accessibility', path: '/accessibility' },
  ]
  const rows = await Promise.all(
    ids.map(async ({ id, path }) => {
      try {
        const page = await getCachedLegalPage(id)
        return { path, lastModified: toDate(page.updatedAt) }
      } catch {
        return { path }
      }
    }),
  )
  return rows
}
