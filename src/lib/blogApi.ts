import type { Payload } from 'payload'
import { lexicalToPlain } from '@/lib/lexical'
import { mapBlogPostDoc } from '@/lib/blogCms'
import type { BlogPost } from '@/lib/blogPosts'
import { resolveCoverInput } from '@/lib/blogMediaApi'
import { blogBodyToLexical, normalizeBlogHref } from '@/lib/blogLexical'

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

function bodyMapFrom(
  raw: unknown,
): Partial<Record<BlogLocale, NonNullable<ReturnType<typeof blogBodyToLexical>>>> {
  const out: Partial<Record<BlogLocale, NonNullable<ReturnType<typeof blogBodyToLexical>>>> = {}
  if (
    typeof raw === 'string' ||
    (raw && typeof raw === 'object' && !Array.isArray(raw) && 'root' in (raw as object))
  ) {
    const doc = blogBodyToLexical(raw)
    if (doc) out.en = doc
    return out
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  const o = raw as Record<string, unknown>
  for (const loc of LOCALES) {
    const doc = blogBodyToLexical(o[loc])
    if (doc) out[loc] = doc
  }
  return out
}

type LocaleContent = {
  title?: string
  excerpt?: string
  body?: NonNullable<ReturnType<typeof blogBodyToLexical>>
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
    body: blogBodyToLexical(o.body),
    seoTitle: asTrimmedString(seo?.title ?? o.seoTitle),
    seoDescription: asTrimmedString(seo?.description ?? o.seoDescription),
  }
}

export type BlogWriteInput = {
  slug: string
  status?: 'draft' | 'published'
  publishedAt?: string | null
  /** Media id, null to clear, or `{ url, alt }` / `{ id }` (resolved on upsert). */
  cover?: unknown
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

  const cover = body.cover !== undefined ? body.cover : undefined

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
  const linksRaw =
    body.relatedLinks !== undefined
      ? body.relatedLinks
      : body.links !== undefined
        ? body.links
        : undefined
  if (Array.isArray(linksRaw)) {
    for (const row of linksRaw) {
      if (!row || typeof row !== 'object') continue
      const r = row as {
        href?: unknown
        url?: unknown
        label?: unknown
        title?: unknown
        text?: unknown
      }
      const href = normalizeBlogHref(asTrimmedString(r.href) || asTrimmedString(r.url) || '')
      if (!href) continue
      const labelRaw = r.label ?? r.title ?? r.text
      const label: RelatedLabel =
        typeof labelRaw === 'string' || (labelRaw && typeof labelRaw === 'object')
          ? (labelRaw as RelatedLabel)
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
    relatedLinks: linksRaw !== undefined ? relatedLinks : undefined,
    faq,
    locales,
  }
}

/**
 * Label text this request explicitly sets for `loc`.
 * A plain string applies to every locale (existing contract).
 * An object writes only its own keys — no cross-locale fallback — so a
 * partial update cannot replace another locale's label.
 */
export function explicitLinkLabel(
  label: string | Partial<Record<BlogLocale, string>> | undefined,
  loc: BlogLocale,
): string | undefined {
  if (typeof label === 'string') {
    const trimmed = label.trim()
    return trimmed || undefined
  }
  if (!label || typeof label !== 'object' || Array.isArray(label)) return undefined
  const value = label[loc]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function storedLinkLabel(row: StoredRelatedLink | undefined, loc: BlogLocale): string | undefined {
  if (!row) return undefined
  const label = row.label
  if (typeof label === 'string') {
    const trimmed = label.trim()
    return loc === 'en' && trimmed ? trimmed : undefined
  }
  if (!label || typeof label !== 'object' || Array.isArray(label)) return undefined
  const value = (label as Record<string, unknown>)[loc]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function relatedRowId(row: { id?: unknown } | undefined): string | undefined {
  if (!row || row.id == null || row.id === '') return undefined
  return String(row.id)
}

export type StoredRelatedLink = {
  id?: unknown
  href?: unknown
  label?: unknown
}

export type PlannedRelatedLinkRow = {
  id?: string
  href: string
  /** Locales this request sets. A string label fills en, ru, and he. */
  explicit: Partial<Record<BlogLocale, string>>
  /** Stored labels to send again when this locale's write includes the row. */
  preserved: Partial<Record<BlogLocale, string>>
}

export type RelatedLinkWritePlan = {
  /**
   * Locales whose update must include `relatedLinks`.
   * `en` is always included when the field was sent, so adds, removals, and
   * href edits happen once on the shared rows. `ru` / `he` are included only
   * when the request sets that locale's label.
   */
  locales: BlogLocale[]
  rows: PlannedRelatedLinkRow[]
}

export function readExistingRelatedLinks(doc: Record<string, unknown> | null): StoredRelatedLink[] {
  if (!doc || !Array.isArray(doc.relatedLinks)) return []
  return doc.relatedLinks.filter(
    (row): row is StoredRelatedLink =>
      Boolean(row) && typeof row === 'object' && !Array.isArray(row),
  )
}

/**
 * Pair incoming links with existing array rows.
 * `relatedLinks` is not a localized array: one row id holds every locale's
 * label. Matching by href (then by index when the list length is unchanged)
 * lets later locale writes update that row instead of inserting a new one.
 */
function matchRelatedLinkRows(
  incoming: Array<{ href: string }>,
  existing: StoredRelatedLink[],
): Array<StoredRelatedLink | undefined> {
  const used = new Set<number>()
  const byHref = new Map<string, number[]>()
  existing.forEach((row, index) => {
    const href = typeof row.href === 'string' ? row.href : ''
    if (!href) return
    const bucket = byHref.get(href) ?? []
    bucket.push(index)
    byHref.set(href, bucket)
  })

  return incoming.map((link, index) => {
    const hrefIndex = byHref.get(link.href)?.find((i) => !used.has(i))
    if (hrefIndex !== undefined) {
      used.add(hrefIndex)
      return existing[hrefIndex]
    }
    if (incoming.length === existing.length && existing[index] && !used.has(index)) {
      used.add(index)
      return existing[index]
    }
    return undefined
  })
}

/** `undefined` incoming → caller leaves links untouched. `[]` clears them. */
export function planRelatedLinkWrites(
  incoming:
    | Array<{ href: string; label: string | Partial<Record<BlogLocale, string>> }>
    | undefined,
  existing: StoredRelatedLink[],
): RelatedLinkWritePlan | null {
  if (incoming === undefined) return null
  if (incoming.length === 0) return { locales: ['en'], rows: [] }

  const matched = matchRelatedLinkRows(incoming, existing)
  const rows: PlannedRelatedLinkRow[] = incoming.map((link, index) => {
    const prev = matched[index]
    const explicit: Partial<Record<BlogLocale, string>> = {}
    const preserved: Partial<Record<BlogLocale, string>> = {}
    for (const loc of LOCALES) {
      const next = explicitLinkLabel(link.label, loc)
      if (next) explicit[loc] = next
      else {
        const stored = storedLinkLabel(prev, loc)
        if (stored) preserved[loc] = stored
      }
    }
    return {
      id: relatedRowId(prev),
      href: link.href,
      explicit,
      preserved,
    }
  })

  const locales = LOCALES.filter(
    (loc) => loc === 'en' || rows.some((row) => Boolean(row.explicit[loc])),
  )
  return { locales: [...locales], rows }
}

/** Payload array for one locale write. `undefined` means omit the field. */
export function relatedLinksPayloadForLocale(
  plan: RelatedLinkWritePlan,
  loc: BlogLocale,
  ids: Array<string | undefined>,
): Array<{ id?: string; href: string; label?: string }> | undefined {
  if (!plan.locales.includes(loc)) return undefined
  if (plan.rows.length === 0) return []
  return plan.rows.map((row, index) => {
    const out: { id?: string; href: string; label?: string } = { href: row.href }
    const id = ids[index] || row.id
    if (id) out.id = id
    const label = row.explicit[loc] || row.preserved[loc]
    if (label) out.label = label
    return out
  })
}

function adoptRelatedLinkIds(
  sent: Array<{ id?: string; href: string }>,
  returned: unknown,
): Array<string | undefined> | null {
  if (!Array.isArray(returned) || returned.length !== sent.length) return null
  const rows = returned as Array<{ id?: unknown; href?: unknown }>
  const sameOrder = rows.every((row, index) => row?.href === sent[index]?.href)
  if (sameOrder) {
    return rows.map((row, index) => relatedRowId(row) || sent[index]?.id)
  }
  const used = new Set<number>()
  return sent.map((row) => {
    const found = rows.findIndex(
      (candidate, index) =>
        !used.has(index) && candidate?.href === row.href && relatedRowId(candidate),
    )
    if (found >= 0) {
      used.add(found)
      return relatedRowId(rows[found])
    }
    return row.id
  })
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

  const resolvedCover =
    input.cover !== undefined ? await resolveCoverInput(payload, input.cover) : undefined
  const writeInput: BlogWriteInput =
    resolvedCover !== undefined ? { ...input, cover: resolvedCover } : input

  let id = existing?.id as string | number | undefined
  let created = false

  // Shared array rows. Ids are filled after the first write so ru/he update
  // the same rows instead of replacing them (PIT-014 / PIT-171).
  const linkPlan = planRelatedLinkWrites(
    writeInput.relatedLinks,
    readExistingRelatedLinks(existing),
  )
  let linkIds: Array<string | undefined> = linkPlan ? linkPlan.rows.map((row) => row.id) : []

  const attachLinks = (data: Record<string, unknown>, loc: BlogLocale) => {
    if (!linkPlan) return
    const rows = relatedLinksPayloadForLocale(linkPlan, loc, linkIds)
    if (rows !== undefined) data.relatedLinks = rows
  }

  const rememberLinkIds = async (doc: unknown) => {
    if (!linkPlan || linkPlan.rows.length === 0) return
    const sent = linkPlan.rows.map((row, index) => ({
      id: linkIds[index] || row.id,
      href: row.href,
    }))
    const returned =
      doc && typeof doc === 'object' ? (doc as { relatedLinks?: unknown }).relatedLinks : undefined
    const adopted = adoptRelatedLinkIds(sent, returned)
    if (adopted?.every(Boolean)) {
      linkIds = adopted
      return
    }
    const fresh = await findBlogPostBySlug(payload, writeInput.slug)
    const refetched = adoptRelatedLinkIds(sent, readExistingRelatedLinks(fresh))
    if (refetched) linkIds = refetched
  }

  if (!id) {
    const enData = {
      slug: writeInput.slug,
      ...buildLocaleData(writeInput, 'en', { includeShared: true, isCreate: true }),
    }
    attachLinks(enData, 'en')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = await (payload as any).create({
      collection: 'blog-posts',
      locale: 'en',
      overrideAccess: true,
      data: enData,
    })
    id = doc.id
    created = true
    if (enData.relatedLinks) await rememberLinkIds(doc)
  } else {
    const enData = buildLocaleData(writeInput, 'en', { includeShared: true, isCreate: false })
    attachLinks(enData, 'en')
    if (Object.keys(enData).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = await (payload as any).update({
        collection: 'blog-posts',
        id,
        locale: 'en',
        overrideAccess: true,
        data: enData,
      })
      if (enData.relatedLinks) await rememberLinkIds(doc)
    }
  }

  for (const loc of ['ru', 'he'] as const) {
    const locData = buildLocaleData(writeInput, loc, { includeShared: false, isCreate: false })
    attachLinks(locData, loc)
    if (Object.keys(locData).length === 0) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = await (payload as any).update({
      collection: 'blog-posts',
      id,
      locale: loc,
      overrideAccess: true,
      data: locData,
    })
    if (locData.relatedLinks) await rememberLinkIds(doc)
  }

  // Auto-fill publishedAt on publish when updating without a date
  if (!created && writeInput.status === 'published' && writeInput.publishedAt === undefined) {
    const fresh = await findBlogPostBySlug(payload, writeInput.slug)
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

  const finalDoc = await findBlogPostBySlug(payload, writeInput.slug)
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
