import type { Payload } from 'payload'
import { isLexicalDoc, lexicalFromText, lexicalToPlain } from '@/lib/lexical'
import { mapBlogPostDoc } from '@/lib/blogCms'
import type { BlogPost } from '@/lib/blogPosts'

const LOCALES = ['en', 'ru', 'he'] as const
export type BlogLocale = (typeof LOCALES)[number]

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function normalizeBlogSlug(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const slug = raw.trim().toLowerCase()
  if (!slug || !SLUG_RE.test(slug)) return null
  if (slug === 'page') return null
  return slug
}

function asTrimmedString(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const t = raw.trim()
  return t || undefined
}

function localeMapFrom(raw: unknown): Partial<Record<BlogLocale, string>> {
  const out: Partial<Record<BlogLocale, string>> = {}
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (t) out.en = t
    return out
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  const o = raw as Record<string, unknown>
  for (const loc of LOCALES) {
    const v = asTrimmedString(o[loc])
    if (v) out[loc] = v
  }
  return out
}

function bodyForLocale(raw: unknown): ReturnType<typeof lexicalFromText> | undefined {
  if (isLexicalDoc(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) return lexicalFromText(raw.trim())
  return undefined
}

function bodyMapFrom(raw: unknown): Partial<Record<BlogLocale, ReturnType<typeof lexicalFromText>>> {
  const out: Partial<Record<BlogLocale, ReturnType<typeof lexicalFromText>>> = {}
  if (isLexicalDoc(raw) || typeof raw === 'string') {
    const doc = bodyForLocale(raw)
    if (doc) out.en = doc
    return out
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  const o = raw as Record<string, unknown>
  for (const loc of LOCALES) {
    const doc = bodyForLocale(o[loc])
    if (doc) out[loc] = doc
  }
  return out
}

type LocaleContent = {
  title?: string
  excerpt?: string
  body?: ReturnType<typeof lexicalFromText>
  seoTitle?: string
  seoDescription?: string
}

function pickLocaleBlock(raw: unknown): LocaleContent {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const o = raw as Record<string, unknown>
  const seo =
    o.seo && typeof o.seo === 'object' && !Array.isArray(o.seo)
      ? (o.seo as Record<string, unknown>)
      : null
  return {
    title: asTrimmedString(o.title),
    excerpt: asTrimmedString(o.excerpt),
    body: bodyForLocale(o.body),
    seoTitle: asTrimmedString(seo?.title ?? o.seoTitle),
    seoDescription: asTrimmedString(seo?.description ?? o.seoDescription),
  }
}

export type BlogWriteInput = {
  slug: string
  status?: 'draft' | 'published'
  publishedAt?: string | null
  cover?: number | string | null
  tags?: string[]
  relatedLinks?: Array<{ href: string; label: string | Partial<Record<BlogLocale, string>> }>
  faq?: {
    title?: string | Partial<Record<BlogLocale, string>>
    items?: Array<{
      question: string | Partial<Record<BlogLocale, string>>
      answer: string | Partial<Record<BlogLocale, string>>
      details?: string | Partial<Record<BlogLocale, string>>
    }>
  }
  locales: Record<BlogLocale, LocaleContent>
}

export type BlogWriteParseError = { error: string; details?: string }

/** Parse POST/PATCH JSON into per-locale Payload writes. */
export function parseBlogWriteBody(
  raw: unknown,
  opts?: { requireSlug?: boolean; fallbackSlug?: string },
): BlogWriteInput | BlogWriteParseError {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { error: 'Body must be a JSON object' }
  }
  const body = raw as Record<string, unknown>

  const slug =
    normalizeBlogSlug(body.slug) ||
    (opts?.fallbackSlug ? normalizeBlogSlug(opts.fallbackSlug) : null)
  if (!slug) {
    if (opts?.requireSlug === false && opts.fallbackSlug) {
      return { error: 'Invalid slug' }
    }
    return {
      error: 'Invalid or missing slug',
      details: 'Use lowercase letters, numbers, hyphens; reserved: page',
    }
  }

  let status: 'draft' | 'published' | undefined
  if (body.status !== undefined) {
    if (body.status !== 'draft' && body.status !== 'published') {
      return { error: 'status must be draft or published' }
    }
    status = body.status
  }

  let publishedAt: string | null | undefined
  if (body.publishedAt === null) publishedAt = null
  else if (typeof body.publishedAt === 'string') {
    const d = new Date(body.publishedAt)
    if (Number.isNaN(d.getTime())) return { error: 'publishedAt must be an ISO date string' }
    publishedAt = d.toISOString()
  }

  let cover: number | string | null | undefined
  if (body.cover === null) cover = null
  else if (typeof body.cover === 'number' || typeof body.cover === 'string') cover = body.cover

  const tags: string[] = []
  if (Array.isArray(body.tags)) {
    for (const t of body.tags) {
      if (typeof t === 'string' && t.trim()) tags.push(t.trim())
      else if (t && typeof t === 'object' && typeof (t as { tag?: unknown }).tag === 'string') {
        const v = String((t as { tag: string }).tag).trim()
        if (v) tags.push(v)
      }
    }
  }

  type RelatedLabel = string | Partial<Record<BlogLocale, string>>
  const relatedLinks: Array<{ href: string; label: RelatedLabel }> = []
  if (Array.isArray(body.relatedLinks)) {
    for (const row of body.relatedLinks) {
      if (!row || typeof row !== 'object') continue
      const r = row as { href?: unknown; label?: unknown }
      const href = asTrimmedString(r.href)
      if (!href) continue
      const label: RelatedLabel =
        typeof r.label === 'string' || (r.label && typeof r.label === 'object')
          ? (r.label as RelatedLabel)
          : href
      relatedLinks.push({ href, label })
    }
  }

  const locales: Record<BlogLocale, LocaleContent> = { en: {}, ru: {}, he: {} }

  const titleMap = localeMapFrom(body.title)
  const excerptMap = localeMapFrom(body.excerpt)
  const bodyMap = bodyMapFrom(body.body)
  const seoTitleMap = localeMapFrom(
    body.seo && typeof body.seo === 'object'
      ? (body.seo as { title?: unknown }).title
      : body.seoTitle,
  )
  const seoDescMap = localeMapFrom(
    body.seo && typeof body.seo === 'object'
      ? (body.seo as { description?: unknown }).description
      : body.seoDescription,
  )

  for (const loc of LOCALES) {
    if (titleMap[loc]) locales[loc].title = titleMap[loc]
    if (excerptMap[loc]) locales[loc].excerpt = excerptMap[loc]
    if (bodyMap[loc]) locales[loc].body = bodyMap[loc]
    if (seoTitleMap[loc]) locales[loc].seoTitle = seoTitleMap[loc]
    if (seoDescMap[loc]) locales[loc].seoDescription = seoDescMap[loc]
  }

  for (const loc of LOCALES) {
    if (body[loc] && typeof body[loc] === 'object') {
      const block = pickLocaleBlock(body[loc])
      locales[loc] = { ...locales[loc], ...block }
    }
  }

  let faq: BlogWriteInput['faq']
  if (body.faq && typeof body.faq === 'object' && !Array.isArray(body.faq)) {
    const f = body.faq as Record<string, unknown>
    const items: NonNullable<BlogWriteInput['faq']>['items'] = []
    if (Array.isArray(f.items)) {
      for (const item of f.items) {
        if (!item || typeof item !== 'object') continue
        const it = item as Record<string, unknown>
        if (!it.question || !it.answer) continue
        items.push({
          question: it.question as string | Partial<Record<BlogLocale, string>>,
          answer: it.answer as string | Partial<Record<BlogLocale, string>>,
          details: it.details as string | Partial<Record<BlogLocale, string>> | undefined,
        })
      }
    }
    faq = {
      title: f.title as string | Partial<Record<BlogLocale, string>> | undefined,
      items,
    }
  }

  return {
    slug,
    status,
    publishedAt,
    cover,
    tags: body.tags !== undefined ? tags : undefined,
    relatedLinks: body.relatedLinks !== undefined ? relatedLinks : undefined,
    faq,
    locales,
  }
}

function labelForLocale(
  label: string | Partial<Record<BlogLocale, string>>,
  loc: BlogLocale,
): string {
  if (typeof label === 'string') return label
  return label[loc] || label.en || Object.values(label).find(Boolean) || ''
}

function faqFieldForLocale(
  value: string | Partial<Record<BlogLocale, string>> | undefined,
  loc: BlogLocale,
): string | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'string') return value
  return value[loc] || (loc === 'en' ? value.en : undefined)
}

function buildLocaleData(
  input: BlogWriteInput,
  loc: BlogLocale,
  opts: { includeShared: boolean; isCreate: boolean },
): Record<string, unknown> {
  const c = input.locales[loc]
  const data: Record<string, unknown> = {}

  if (opts.includeShared) {
    if (input.status) data.status = input.status
    if (input.publishedAt !== undefined) data.publishedAt = input.publishedAt
    if (
      input.status === 'published' &&
      (input.publishedAt === undefined || input.publishedAt === null) &&
      opts.isCreate
    ) {
      data.publishedAt = new Date().toISOString()
    }
    if (input.cover !== undefined) data.cover = input.cover
    if (input.tags !== undefined) data.tags = input.tags.map((tag) => ({ tag }))
    if (input.relatedLinks !== undefined) {
      data.relatedLinks = input.relatedLinks.map((l) => ({
        href: l.href,
        label: labelForLocale(l.label, loc),
      }))
    }
  } else if (input.relatedLinks !== undefined) {
    data.relatedLinks = input.relatedLinks.map((l) => ({
      href: l.href,
      label: labelForLocale(l.label, loc),
    }))
  }

  if (c.title) data.title = c.title
  if (c.excerpt) data.excerpt = c.excerpt
  if (c.body) data.body = c.body

  if (c.seoTitle || c.seoDescription) {
    data.seo = {
      ...(c.seoTitle ? { title: c.seoTitle } : {}),
      ...(c.seoDescription ? { description: c.seoDescription } : {}),
    }
  } else if (opts.isCreate && loc === 'en' && c.title && c.excerpt) {
    data.seo = {
      title: `${c.title} | Erythro.ai`,
      description: c.excerpt.slice(0, 160),
    }
  }

  if (input.faq) {
    const faqData: Record<string, unknown> = {}
    const title = faqFieldForLocale(input.faq.title, loc)
    if (title) faqData.title = title
    if (input.faq.items) {
      faqData.items = input.faq.items.map((item) => {
        const row: Record<string, unknown> = {
          question: faqFieldForLocale(item.question, loc) || '',
          answer: faqFieldForLocale(item.answer, loc) || '',
        }
        const details = faqFieldForLocale(item.details, loc)
        if (details) row.details = details
        return row
      })
    }
    data.faq = faqData
  }

  return data
}

function assertCreateReady(input: BlogWriteInput): BlogWriteParseError | null {
  const en = input.locales.en
  if (!en.title) return { error: 'title.en (or title string) is required' }
  if (!en.excerpt) return { error: 'excerpt.en (or excerpt string) is required' }
  if (!en.body) return { error: 'body.en (or body string / Lexical) is required' }
  return null
}

export async function findBlogPostBySlug(payload: Payload, slug: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await (payload as any).find({
    collection: 'blog-posts',
    where: { slug: { equals: slug } },
    locale: 'all',
    depth: 1,
    limit: 1,
    overrideAccess: true,
  })
  return (res.docs?.[0] as Record<string, unknown> | undefined) || null
}

export async function upsertBlogPost(
  payload: Payload,
  input: BlogWriteInput,
): Promise<{ post: BlogPost; created: boolean }> {
  const existing = await findBlogPostBySlug(payload, input.slug)
  const createErr = existing ? null : assertCreateReady(input)
  if (createErr) throw Object.assign(new Error(createErr.error), { status: 400 })

  let id = existing?.id as string | number | undefined
  let created = false

  if (!id) {
    const enData = {
      slug: input.slug,
      ...buildLocaleData(input, 'en', { includeShared: true, isCreate: true }),
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = await (payload as any).create({
      collection: 'blog-posts',
      locale: 'en',
      overrideAccess: true,
      data: enData,
    })
    id = doc.id
    created = true
  } else {
    const enData = buildLocaleData(input, 'en', { includeShared: true, isCreate: false })
    if (Object.keys(enData).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).update({
        collection: 'blog-posts',
        id,
        locale: 'en',
        overrideAccess: true,
        data: enData,
      })
    }
  }

  for (const loc of ['ru', 'he'] as const) {
    const locData = buildLocaleData(input, loc, { includeShared: false, isCreate: false })
    if (Object.keys(locData).length === 0) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).update({
      collection: 'blog-posts',
      id,
      locale: loc,
      overrideAccess: true,
      data: locData,
    })
  }

  // Auto-fill publishedAt on publish when updating without a date
  if (!created && input.status === 'published' && input.publishedAt === undefined) {
    const fresh = await findBlogPostBySlug(payload, input.slug)
    if (fresh && !fresh.publishedAt) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).update({
        collection: 'blog-posts',
        id,
        overrideAccess: true,
        data: { publishedAt: new Date().toISOString() },
      })
    }
  }

  const finalDoc = await findBlogPostBySlug(payload, input.slug)
  const post = finalDoc ? mapBlogPostDoc(finalDoc) : null
  if (!post) throw Object.assign(new Error('Failed to load saved post'), { status: 500 })
  return { post, created }
}

export function serializeBlogPost(post: BlogPost) {
  const bodyPlain: Partial<Record<BlogLocale, string>> = {}
  for (const loc of LOCALES) {
    const plain = lexicalToPlain(post.body?.[loc] ?? post.body?.en).trim()
    if (plain) bodyPlain[loc] = plain
  }
  return {
    id: post.id,
    slug: post.slug,
    status: post.status,
    publishedAt: post.publishedAt ?? null,
    updatedAt: post.updatedAt ?? null,
    title: post.title,
    excerpt: post.excerpt,
    body: bodyPlain,
    cover: post.cover ?? null,
    tags: post.tags,
    relatedLinks: post.relatedLinks,
    faq: post.faq ?? null,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    url: `/blog/${post.slug}`,
  }
}
