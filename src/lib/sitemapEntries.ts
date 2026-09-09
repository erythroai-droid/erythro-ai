import { getAllOrderSlugs } from '@/lib/orderPlans'
import { getAllPortfolioSlugs } from '@/lib/portfolioProjects'
import { getAllServiceSlugs } from '@/lib/servicePages'
import { getCachedLegalPage } from '@/lib/legalPages.server'
import type { LegalPageId } from '@/lib/legalPages'

export type SitemapSlugEntry = {
  slug: string
  lastModified?: Date
}

function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim())
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
  if (!hasDatabase()) return []
  const { getPayload } = await import('payload')
  const config = (await import('@payload-config')).default
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
  const staticSlugs = getAllServiceSlugs()
  try {
    const rows = await fetchCollectionSitemap('services')
    if (rows.length) {
      const existing = new Set(rows.map((r) => r.slug))
      const missing = staticSlugs
        .filter((slug) => !existing.has(slug))
        .map((slug) => ({ slug }))
      return [...rows, ...missing]
    }
  } catch (err) {
    console.error('[sitemap] services CMS failed:', err)
  }
  return staticSlugs.map((slug) => ({ slug }))
}

export async function getPortfolioSitemapEntries(): Promise<SitemapSlugEntry[]> {
  const staticSlugs = getAllPortfolioSlugs()
  try {
    const rows = await fetchCollectionSitemap('portfolio-projects')
    if (rows.length) {
      const existing = new Set(rows.map((r) => r.slug))
      const missing = staticSlugs
        .filter((slug) => !existing.has(slug))
        .map((slug) => ({ slug }))
      return [...rows, ...missing]
    }
  } catch (err) {
    console.error('[sitemap] portfolio CMS failed:', err)
  }
  return staticSlugs.map((slug) => ({ slug }))
}

export async function getOrderSitemapEntries(): Promise<SitemapSlugEntry[]> {
  const staticSlugs = getAllOrderSlugs()
  try {
    const rows = await fetchCollectionSitemap('solution-plans')
    if (rows.length) {
      const existing = new Set(rows.map((r) => r.slug))
      const missing = staticSlugs
        .filter((slug) => !existing.has(slug))
        .map((slug) => ({ slug }))
      return [...rows, ...missing]
    }
  } catch (err) {
    console.error('[sitemap] order plans CMS failed:', err)
  }
  return staticSlugs.map((slug) => ({ slug }))
}

async function fetchGlobalLastModified(slug: string): Promise<Date | undefined> {
  if (!hasDatabase()) return undefined
  try {
    const { getPayload } = await import('payload')
    const config = (await import('@payload-config')).default
    const payload = await getPayload({ config })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (payload as any).findGlobal({
      slug,
      depth: 0,
      overrideAccess: true,
    })
    return toDate(res?.updatedAt)
  } catch (err) {
    console.error(`[sitemap] global ${slug} CMS failed:`, err)
    return undefined
  }
}

export async function getAuditPageLastModified(): Promise<Date | undefined> {
  return fetchGlobalLastModified('audit-page')
}

export async function getSiteSettingsLastModified(): Promise<Date | undefined> {
  return fetchGlobalLastModified('site-settings')
}

export async function getLegalSitemapEntries(): Promise<
  Array<{ path: string; lastModified?: Date }>
> {
  const ids: Array<{ id: LegalPageId; path: string }> = [
    { id: 'privacy', path: '/privacy' },
    { id: 'terms', path: '/terms' },
    { id: 'accessibility', path: '/accessibility' },
  ]
  if (!hasDatabase()) {
    return ids.map(({ path }) => ({ path }))
  }
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

