import { unstable_cache } from 'next/cache'
import { SITE_CONTENT_TAG } from './revalidate'
import { getPayloadLocal } from './payloadStatic'
import { mediaDocUrl } from './publicMediaUrl'
import { pageFaqFromCms } from './pageFaq'
import { isLexicalDoc, lexicalFromText, lexicalToPlain } from './lexical'
import type { LocaleMap } from './servicePages'
import type { BlogPost, BlogPostStatus, BlogRelatedLink } from './blogPosts'

const LOCALES = ['en', 'ru', 'he'] as const

function asLocaleMap(raw: unknown, fallback: LocaleMap = { en: '' }): LocaleMap {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>
    const out: LocaleMap = { en: '' }
    for (const loc of LOCALES) {
      const v = o[loc]
      if (typeof v === 'string' && v.trim()) out[loc] = v.trim()
    }
    if (!out.en && fallback.en) out.en = fallback.en
    for (const loc of LOCALES) {
      if (!out[loc] && fallback[loc]) out[loc] = fallback[loc]
    }
    return out
  }
  if (typeof raw === 'string' && raw.trim()) {
    return { en: raw.trim(), ru: raw.trim(), he: raw.trim() }
  }
  return { ...fallback }
}

function asLocalizedBody(raw: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && !isLexicalDoc(raw)) {
    const o = raw as Record<string, unknown>
    for (const loc of LOCALES) {
      const v = o[loc]
      if (isLexicalDoc(v)) out[loc] = v
      else if (typeof v === 'string' && v.trim()) out[loc] = lexicalFromText(v)
    }
  } else if (isLexicalDoc(raw)) {
    for (const loc of LOCALES) out[loc] = raw
  } else if (typeof raw === 'string' && raw.trim()) {
    const doc = lexicalFromText(raw)
    for (const loc of LOCALES) out[loc] = doc
  }
  return out
}

function mapCover(raw: unknown): BlogPost['cover'] {
  if (!raw || typeof raw !== 'object') return null
  const doc = raw as {
    alt?: string | null
    url?: string | null
    width?: number | null
    height?: number | null
  }
  const src = mediaDocUrl(doc) || (typeof doc.url === 'string' ? doc.url : '')
  if (!src) return null
  return {
    src,
    alt: typeof doc.alt === 'string' ? doc.alt : undefined,
    width: typeof doc.width === 'number' ? doc.width : undefined,
    height: typeof doc.height === 'number' ? doc.height : undefined,
  }
}

function mapRelatedLinks(raw: unknown): BlogRelatedLink[] {
  if (!Array.isArray(raw)) return []
  const out: BlogRelatedLink[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as { label?: unknown; href?: unknown }
    const href = typeof r.href === 'string' ? r.href.trim() : ''
    if (!href) continue
    out.push({ label: asLocaleMap(r.label, { en: href }), href })
  }
  return out
}

function mapTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const tags: string[] = []
  for (const row of raw) {
    if (typeof row === 'string' && row.trim()) tags.push(row.trim())
    else if (row && typeof row === 'object' && typeof (row as { tag?: unknown }).tag === 'string') {
      const t = String((row as { tag: string }).tag).trim()
      if (t) tags.push(t)
    }
  }
  return tags
}

export function mapBlogPostDoc(d: any): BlogPost | null {
  const slug = typeof d?.slug === 'string' ? d.slug.trim() : ''
  if (!slug) return null
  const status: BlogPostStatus = d?.status === 'published' ? 'published' : 'draft'
  const title = asLocaleMap(d.title, { en: slug })
  const excerpt = asLocaleMap(d.excerpt, { en: '' })
  const body = asLocalizedBody(d.body)
  const seo = d.seo && typeof d.seo === 'object' ? d.seo : {}
  const faq = pageFaqFromCms(d.faq) || null

  return {
    id: d.id,
    slug,
    status,
    publishedAt: typeof d.publishedAt === 'string' ? d.publishedAt : d.publishedAt?.toISOString?.() || null,
    updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : d.updatedAt?.toISOString?.() || null,
    title,
    excerpt,
    body,
    cover: mapCover(d.cover),
    tags: mapTags(d.tags),
    relatedLinks: mapRelatedLinks(d.relatedLinks),
    faq,
    seoTitle: asLocaleMap(seo.title, { en: '' }),
    seoDescription: asLocaleMap(seo.description, { en: '' }),
  }
}

async function fetchPublishedBlogPosts(): Promise<BlogPost[]> {
  try {
    const payload = await getPayloadLocal()
    // Collection registered in payload.config; types regenerate via `payload generate:types`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (payload as any).find({
      collection: 'blog-posts',
      locale: 'all',
      depth: 1,
      limit: 200,
      sort: '-publishedAt',
      overrideAccess: true,
      where: { status: { equals: 'published' } },
    })
    if (!res.docs?.length) return []
    const mapped: BlogPost[] = []
    for (const d of res.docs as any[]) {
      try {
        const post = mapBlogPostDoc(d)
        if (post && post.status === 'published') mapped.push(post)
      } catch (err) {
        console.error(`[blogCms] map failed slug=${d?.slug}:`, err)
      }
    }
    return mapped
  } catch (err) {
    console.error('[blogCms] fetch failed:', err)
    return []
  }
}

export const getCachedPublishedBlogPosts = () =>
  unstable_cache(() => fetchPublishedBlogPosts(), ['blog-posts-v1'], {
    tags: [SITE_CONTENT_TAG],
    revalidate: false,
  })()

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const all = await getCachedPublishedBlogPosts()
  return all.find((p) => p.slug === slug)
}

export async function getAllPublishedBlogSlugs(): Promise<string[]> {
  const all = await getCachedPublishedBlogPosts()
  return all.map((p) => p.slug)
}

/** Plain-text body for markdown / schema abstract fallback. */
export function blogBodyPlain(post: BlogPost, locale: string): string {
  const raw = post.body?.[locale] ?? post.body?.en
  return lexicalToPlain(raw).trim()
}
