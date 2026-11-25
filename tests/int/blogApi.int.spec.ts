import { describe, expect, it } from 'vitest'
import { BlogPosts } from '@/collections/BlogPosts'
import {
  parseBlogWriteBody,
  planRelatedLinkWrites,
  upsertBlogPost,
  type BlogLocale,
  type BlogWriteInput,
  type BlogWriteParseError,
} from '@/lib/blogApi'

type Locale = BlogLocale

type MemRow = {
  id: string
  href: string
  labels: Partial<Record<Locale, string>>
}

type MemDoc = {
  id: number
  slug: string
  status: 'draft' | 'published'
  publishedAt?: string | null
  title: Partial<Record<Locale, string>>
  excerpt: Partial<Record<Locale, string>>
  body: Partial<Record<Locale, unknown>>
  rows: MemRow[]
}

type WriteCall = {
  op: 'create' | 'update'
  locale?: string
  data: Record<string, unknown>
}

function relatedLabelRequired(): boolean {
  const array = BlogPosts.fields.find(
    (field) => field.type === 'array' && 'name' in field && field.name === 'relatedLinks',
  )
  if (!array || array.type !== 'array') return false
  const label = array.fields.find((field) => 'name' in field && field.name === 'label')
  return Boolean(label && 'required' in label && label.required)
}

function assertWrite(value: BlogWriteInput | BlogWriteParseError): BlogWriteInput {
  if ('error' in value) throw new Error(value.error)
  return value
}

/**
 * Models Payload on Postgres for this bug: `relatedLinks` rows are shared,
 * `label` is per locale. A row sent without `id` is a new row and keeps only
 * the locale being written. An update that omits the array leaves rows as they
 * are, and — when the label field is required — fails if this locale has no label.
 */
function memoryPayload(seed?: MemDoc) {
  let doc: MemDoc | null = seed ? structuredClone(seed) : null
  let seq = 10
  const calls: WriteCall[] = []

  const view = (locale: 'all' | Locale) => {
    if (!doc) return null
    return {
      id: doc.id,
      slug: doc.slug,
      status: doc.status,
      publishedAt: doc.publishedAt ?? null,
      title: { ...doc.title },
      excerpt: { ...doc.excerpt },
      body: { ...doc.body },
      relatedLinks: doc.rows.map((row) => ({
        id: row.id,
        href: row.href,
        label: locale === 'all' ? { ...row.labels } : (row.labels[locale] ?? null),
      })),
    }
  }

  const applyScalars = (locale: Locale, data: Record<string, unknown>) => {
    if (!doc) return
    if (typeof data.status === 'string') doc.status = data.status as MemDoc['status']
    if (typeof data.publishedAt === 'string') doc.publishedAt = data.publishedAt
    if (typeof data.title === 'string') doc.title[locale] = data.title
    if (typeof data.excerpt === 'string') doc.excerpt[locale] = data.excerpt
    if (data.body) doc.body[locale] = data.body
  }

  const applyLinks = (locale: Locale, incoming: unknown) => {
    if (!Array.isArray(incoming) || !doc) return
    const next: MemRow[] = []
    for (const item of incoming) {
      if (!item || typeof item !== 'object') continue
      const rec = item as { id?: unknown; href?: unknown; label?: unknown }
      const href = typeof rec.href === 'string' ? rec.href : ''
      const id = rec.id != null && rec.id !== '' ? String(rec.id) : undefined
      if (!id) {
        const labels: MemRow['labels'] = {}
        if (typeof rec.label === 'string') labels[locale] = rec.label
        next.push({ id: `row-${++seq}`, href, labels })
        continue
      }
      const prev = doc.rows.find((row) => row.id === id)
      const labels: MemRow['labels'] = prev ? { ...prev.labels } : {}
      if (typeof rec.label === 'string') labels[locale] = rec.label
      next.push({ id, href, labels })
    }
    doc.rows = next
  }

  const write = async (op: 'create' | 'update', locale: Locale, data: Record<string, unknown>) => {
    calls.push({ op, locale, data: { ...data } })
    if (op === 'create') {
      doc = {
        id: 20,
        slug: String(data.slug),
        status: (data.status as MemDoc['status']) || 'draft',
        publishedAt: typeof data.publishedAt === 'string' ? data.publishedAt : null,
        title: {},
        excerpt: {},
        body: {},
        rows: [],
      }
    }
    if (!doc) throw new Error('missing doc')
    if (!Object.prototype.hasOwnProperty.call(data, 'relatedLinks') && relatedLabelRequired()) {
      for (const row of doc.rows) {
        if (!row.labels[locale]) {
          throw Object.assign(new Error('The following field is invalid: Related Links > Label'), {
            status: 400,
          })
        }
      }
    }
    applyScalars(locale, data)
    if (Object.prototype.hasOwnProperty.call(data, 'relatedLinks')) {
      applyLinks(locale, data.relatedLinks)
    }
    return view(locale)
  }

  const payload = {
    find: async () => ({ docs: doc ? [view('all')] : [] }),
    create: async ({ data, locale }: { data: Record<string, unknown>; locale?: Locale }) =>
      write('create', locale || 'en', data),
    update: async ({ data, locale }: { data: Record<string, unknown>; locale?: Locale }) =>
      write('update', locale || 'en', data),
  }

  return { payload, calls, read: () => (doc ? structuredClone(doc) : null) }
}

const FULL_LINKS = [
  {
    id: 'row-1',
    href: '/audit',
    labels: { en: 'Free AI audit', ru: 'Бесплатный AI-аудит', he: 'ביקורת AI חינם' },
  },
  {
    id: 'row-2',
    href: 'https://erythro.ai/portfolio',
    labels: { en: 'Portfolio', ru: 'Портфолио', he: 'תיק עבודות' },
  },
] satisfies MemRow[]

function seededPost(rows: MemRow[]): MemDoc {
  return {
    id: 20,
    slug: 'psb-consulting-demo-site-from-first-screen-to-request',
    status: 'published',
    publishedAt: '2026-11-01T00:00:00.000Z',
    title: { en: 'PSB', ru: 'ПСБ', he: 'PSB HE' },
    excerpt: { en: 'Excerpt', ru: 'Анонс', he: 'תקציר' },
    body: {},
    rows,
  }
}

describe('blog API related links', () => {
  it('keeps relatedLinks optional so a locale update can omit them', () => {
    expect(relatedLabelRequired()).toBe(false)
  })

  it('parses links aliases and leaves the field out when it is absent', () => {
    const parsed = assertWrite(
      parseBlogWriteBody({
        slug: 'geo-checklist',
        links: [{ url: '/audit', title: { en: 'Audit', ru: 'Аудит' } }],
      }),
    )
    expect(parsed.relatedLinks).toEqual([{ href: '/audit', label: { en: 'Audit', ru: 'Аудит' } }])

    const preferred = assertWrite(
      parseBlogWriteBody({
        slug: 'geo-checklist',
        relatedLinks: [{ href: '/about', label: 'About' }],
        links: [{ href: '/audit', label: 'Audit' }],
      }),
    )
    expect(preferred.relatedLinks).toEqual([{ href: '/about', label: 'About' }])

    const omitted = assertWrite(
      parseBlogWriteBody({ slug: 'geo-checklist', title: { ru: 'Заголовок' } }),
    )
    expect(omitted.relatedLinks).toBeUndefined()
    expect(
      planRelatedLinkWrites(omitted.relatedLinks, [
        { id: 'row-1', href: '/audit', label: { en: 'A' } },
      ]),
    ).toBeNull()
  })

  it('stores every locale label from one create, reusing the row ids', async () => {
    const mem = memoryPayload()
    const parsed = assertWrite(
      parseBlogWriteBody({
        slug: 'geo-checklist',
        status: 'published',
        title: 'GEO checklist',
        excerpt: 'Five checks.',
        body: 'Paragraph.',
        links: [
          {
            href: '/audit',
            label: { en: 'Free AI audit', ru: 'Бесплатный AI-аудит', he: 'ביקורת AI חינם' },
          },
          { url: 'https://erythro.ai/portfolio', title: 'Portfolio' },
        ],
      }),
    )

    const { post } = await upsertBlogPost(mem.payload as never, parsed)
    expect(post.relatedLinks.map((link) => link.label)).toEqual([
      { en: 'Free AI audit', ru: 'Бесплатный AI-аудит', he: 'ביקורת AI חינם' },
      { en: 'Portfolio', ru: 'Portfolio', he: 'Portfolio' },
    ])

    const localeWrites = mem.calls.filter((call) => Array.isArray(call.data.relatedLinks))
    expect(localeWrites.map((call) => call.locale)).toEqual(['en', 'ru', 'he'])
    for (const call of localeWrites.filter((item) => item.locale !== 'en')) {
      const rows = call.data.relatedLinks as Array<{ id?: string }>
      expect(rows.every((row) => typeof row.id === 'string' && row.id.length > 0)).toBe(true)
    }
    expect(new Set(mem.read()?.rows.map((row) => row.id)).size).toBe(2)
  })

  it('updates one locale label without clearing the others', async () => {
    const mem = memoryPayload(seededPost(FULL_LINKS))
    const parsed = assertWrite(
      parseBlogWriteBody({
        slug: seededPost(FULL_LINKS).slug,
        links: [
          { href: '/audit', label: { ru: 'Новый аудит' } },
          { href: 'https://erythro.ai/portfolio', label: { en: 'Work' } },
        ],
      }),
    )

    await upsertBlogPost(mem.payload as never, parsed)
    expect(mem.read()?.rows).toEqual([
      {
        id: 'row-1',
        href: '/audit',
        labels: { en: 'Free AI audit', ru: 'Новый аудит', he: 'ביקורת AI חינם' },
      },
      {
        id: 'row-2',
        href: 'https://erythro.ai/portfolio',
        labels: { en: 'Work', ru: 'Портфолио', he: 'תיק עבודות' },
      },
    ])
  })

  it('keeps other locale labels when the href changes and the list length stays the same', async () => {
    const mem = memoryPayload(seededPost(FULL_LINKS.slice(0, 1)))
    const parsed = assertWrite(
      parseBlogWriteBody({
        slug: seededPost([]).slug,
        links: [{ href: '/services/ai-automation', label: { en: 'Automation' } }],
      }),
    )

    await upsertBlogPost(mem.payload as never, parsed)
    expect(mem.read()?.rows).toEqual([
      {
        id: 'row-1',
        href: '/services/ai-automation',
        labels: { en: 'Automation', ru: 'Бесплатный AI-аудит', he: 'ביקורת AI חינם' },
      },
    ])
  })

  it('leaves existing links untouched when the PATCH omits them, even if a locale label is empty', async () => {
    const corrupt: MemRow[] = [{ id: 'row-1', href: '/audit', labels: { he: 'ביקורת AI חינם' } }]
    const mem = memoryPayload(seededPost(corrupt))
    const parsed = assertWrite(
      parseBlogWriteBody({
        slug: seededPost([]).slug,
        title: { en: 'New English title', ru: 'Новый заголовок' },
      }),
    )

    const { post } = await upsertBlogPost(mem.payload as never, parsed)
    expect(post.title.en).toBe('New English title')
    expect(post.title.ru).toBe('Новый заголовок')
    expect(mem.read()?.rows).toEqual(corrupt)
    expect(
      mem.calls.every((call) => !Object.prototype.hasOwnProperty.call(call.data, 'relatedLinks')),
    ).toBe(true)
  })

  it('clears links when the request sends an empty list', async () => {
    const mem = memoryPayload(seededPost(FULL_LINKS))
    const parsed = assertWrite(
      parseBlogWriteBody({
        slug: seededPost([]).slug,
        relatedLinks: [],
      }),
    )

    await upsertBlogPost(mem.payload as never, parsed)
    expect(mem.read()?.rows).toEqual([])
    const writes = mem.calls.filter((call) =>
      Object.prototype.hasOwnProperty.call(call.data, 'relatedLinks'),
    )
    expect(writes).toHaveLength(1)
    expect(writes[0]).toMatchObject({ locale: 'en', data: { relatedLinks: [] } })
  })
})
