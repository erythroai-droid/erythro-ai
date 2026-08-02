import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import config from '@payload-config'
import { SITE_CONTENT_TAG } from './revalidate'
import {
  PORTFOLIO_FILTERS,
  PORTFOLIO_PROJECTS,
  type PortfolioCategory,
  type PortfolioFilter,
  type PortfolioProject,
  type PortfolioBodySection,
} from './portfolioProjects'
import {
  SERVICE_PAGES,
  SERVICE_ID_TO_SLUG,
  type ServicePage,
  type ServiceOffering,
  type LocaleMap,
  type LocaleListMap,
} from './servicePages'
import { lexicalFromParagraphs, lexicalFromText, isLexicalDoc, lexicalToPlain } from './lexical'
import { mediaDocUrl } from './publicMediaUrl'
import {
  ORDER_PLANS,
  getOrderPlan as getStaticOrderPlan,
  type OrderPlan,
  type OrderAddon,
  type OrderPeriod,
} from './orderPlans'
import { solutions, type SolutionCardItem } from '@/translations'

const LOCALES = ['en', 'ru', 'he'] as const

/* eslint-disable @typescript-eslint/no-explicit-any */

function mediaUrl(v: any): string | undefined {
  // Prefer public Blob URL — `/api/media/file/...` breaks <video> Range on Vercel CDN.
  return mediaDocUrl(v)
}

function hasLocalizedSeo(v: any): boolean {
  if (typeof v === 'string') return v.trim().length > 0
  if (!v || typeof v !== 'object') return false
  return LOCALES.some((l) => typeof v[l] === 'string' && v[l].trim().length > 0)
}

/** CMS-only locale map — empty admin fields stay empty (no static stubs). */
function locMapCms(v: any): LocaleMap {
  return locMap(v, { en: '', ru: '', he: '' })
}

function locMap(v: any, fallback: LocaleMap = { en: '' }): LocaleMap {
  const out: LocaleMap = { ...fallback }
  if (typeof v === 'string' && v.trim()) {
    out.en = v.trim()
    return out
  }
  if (v && typeof v === 'object') {
    for (const l of LOCALES) {
      if (typeof v[l] === 'string' && v[l].trim()) out[l] = v[l]
    }
  }
  return out
}

function locList(rows: any[] | undefined, key: string, fallback: LocaleListMap): LocaleListMap {
  if (!Array.isArray(rows) || rows.length === 0) return fallback
  const out: LocaleListMap = { en: [], ru: [], he: [] }
  for (const row of rows) {
    const field = row?.[key]
    for (const l of LOCALES) {
      const text =
        typeof field === 'string'
          ? field
          : typeof field?.[l] === 'string'
            ? field[l]
            : typeof field?.en === 'string'
              ? field.en
              : ''
      if (text) out[l].push(text)
    }
  }
  // Keep locale arrays aligned in length for empty slots
  const max = Math.max(out.en.length, out.ru.length, out.he.length, 0)
  for (const l of LOCALES) {
    while (out[l].length < max) out[l].push(out.en[out[l].length] || '')
  }
  return out.en.length ? out : fallback
}

function pickStr(v: any, locale: string, fallback = ''): string {
  if (typeof v === 'string') return v || fallback
  if (v && typeof v === 'object') return v[locale] || v.en || fallback
  return fallback
}

function mapPortfolioDoc(d: any, locale: string): PortfolioProject {
  // Prefer slug match so CMS docs never inherit unrelated seed project fields by index.
  const fb: PortfolioProject =
    PORTFOLIO_PROJECTS.find((p) => p.slug === d.slug) ||
    {
      id: String(d.id ?? ''),
      slug: d.slug || 'project',
      title: 'Project',
      category: 'other',
      categoryLabel: 'Other',
      description: '',
      tags: [],
      image: '/images/portfolio/case-1.png',
      date: '',
      stack: [],
      client: '',
      hero: { type: 'image', src: '/images/portfolio/case-1.png' },
      summary: '',
      body: [],
    }

  const cardUrl = mediaUrl(d.cardImage) || fb.image
  const heroUrl = mediaUrl(d.heroMedia) || mediaUrl(d.cardImage) || fb.hero.src
  const heroMobileUrl =
    mediaUrl(d.heroMediaMobile) || fb.hero.srcMobile || undefined
  const mime = d.heroMedia?.mimeType || ''
  const heroType: 'image' | 'video' = String(mime).startsWith('video/') ? 'video' : 'image'

  const body: PortfolioBodySection[] =
    Array.isArray(d.body) && d.body.length
      ? d.body.map((section: any) => {
          const paragraphs =
            Array.isArray(section.paragraphs) && section.paragraphs.length
              ? section.paragraphs.map((p: any) => pickStr(p.text, locale)).filter(Boolean)
              : []
          const images =
            Array.isArray(section.images) && section.images.length
              ? section.images.map((img: any) => mediaUrl(img.image)).filter(Boolean)
              : []
          return {
            ...(pickStr(section.heading, locale)
              ? { heading: pickStr(section.heading, locale) }
              : {}),
            paragraphs,
            images: images as string[],
          }
        })
      : fb.body

  const stack =
    Array.isArray(d.stack) && d.stack.length
      ? d.stack.map((s: any) => s.item).filter(Boolean)
      : fb.stack
  const tags =
    Array.isArray(d.tags) && d.tags.length
      ? d.tags.map((t: any) => t.tag).filter(Boolean)
      : fb.tags

  const catDoc =
    d.category && typeof d.category === 'object' && !Array.isArray(d.category)
      ? d.category
      : null
  const categoryValue =
    (typeof catDoc?.value === 'string' && catDoc.value) ||
    (typeof d.category === 'string' && d.category) ||
    fb.category
  const categoryLabel =
    pickStr(d.categoryLabel, locale) ||
    pickStr(catDoc?.label, locale) ||
    fb.categoryLabel

  return {
    id: String(d.id ?? fb.id),
    slug: d.slug || fb.slug,
    title: pickStr(d.title, locale, fb.title),
    category: categoryValue as Exclude<PortfolioCategory, 'all'>,
    categoryLabel,
    description: pickStr(d.description, locale, fb.description),
    tags,
    image: cardUrl,
    date: d.date || fb.date,
    stack,
    client: d.client || fb.client,
    ...(d.link || fb.link ? { link: d.link || fb.link } : {}),
    hero: {
      type: heroType,
      src: heroUrl,
      ...(heroMobileUrl && heroMobileUrl !== heroUrl ? { srcMobile: heroMobileUrl } : {}),
    },
    summary: pickStr(d.summary, locale, fb.summary),
    body,
    ...(pickStr(d.seo?.title, locale)
      ? { seoTitle: pickStr(d.seo.title, locale) }
      : {}),
    ...(pickStr(d.seo?.description, locale)
      ? { seoDescription: pickStr(d.seo.description, locale) }
      : {}),
  }
}

async function fetchPortfolioProjects(locale: string): Promise<PortfolioProject[]> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'portfolio-projects',
      locale: 'all',
      depth: 1,
      limit: 100,
      sort: 'order',
    })
    if (!res.docs?.length) return PORTFOLIO_PROJECTS
    return res.docs.map((d: any) => mapPortfolioDoc(d, locale))
  } catch (err) {
    console.error('[cmsPages] portfolio fallback:', err)
    return PORTFOLIO_PROJECTS
  }
}

async function fetchPortfolioCategories(locale: string): Promise<PortfolioFilter[]> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'portfolio-categories',
      locale: 'all',
      depth: 0,
      limit: 100,
      sort: 'order',
      where: { showInFilters: { equals: true } },
    })
    if (!res.docs?.length) {
      return PORTFOLIO_FILTERS.filter((f) => f.id !== 'all')
    }
    return res.docs
      .map((d: any) => {
        const id = typeof d.value === 'string' ? d.value.trim() : ''
        const label = pickStr(d.label, locale, id)
        if (!id || !label) return null
        return { id, label } satisfies PortfolioFilter
      })
      .filter(Boolean) as PortfolioFilter[]
  } catch (err) {
    console.error('[cmsPages] portfolio categories fallback:', err)
    return PORTFOLIO_FILTERS.filter((f) => f.id !== 'all')
  }
}

function mapServiceDoc(d: any, i: number): ServicePage {
  const fb =
    SERVICE_PAGES.find((p) => p.slug === d.slug) ||
    SERVICE_PAGES[i] ||
    SERVICE_PAGES[0]
  const heroUrl = mediaUrl(d.heroMedia) || mediaUrl(d.image) || fb.hero.src
  const mime = d.heroMedia?.mimeType || d.image?.mimeType || ''
  const heroType: 'image' | 'video' = String(mime).startsWith('video/') ? 'video' : 'image'

  const features = locList(d.features, 'feature', fb.features)

  // Summary / description may be Lexical (new), plain string, or legacy paragraph array.
  const summaryRich: Record<string, unknown> = {}
  const descriptionRich: Record<string, unknown> = {}
  const summaryPlain: LocaleMap = { en: '', ru: '', he: '' }
  const description: LocaleListMap = { en: [], ru: [], he: [] }

  for (const loc of LOCALES) {
    const sumVal =
      d.summary && typeof d.summary === 'object' && !Array.isArray(d.summary)
        ? (d.summary as Record<string, unknown>)[loc] ?? (d.summary as Record<string, unknown>).en
        : d.summary
    if (isLexicalDoc(sumVal)) {
      summaryRich[loc] = sumVal
      summaryPlain[loc] = lexicalToPlain(sumVal)
    } else if (typeof sumVal === 'string' && sumVal.trim()) {
      summaryRich[loc] = lexicalFromText(sumVal)
      summaryPlain[loc] = sumVal
    } else {
      summaryRich[loc] = lexicalFromText(fb.summary[loc] || fb.summary.en || '')
      summaryPlain[loc] = fb.summary[loc] || fb.summary.en || ''
    }

    const descVal =
      d.description && typeof d.description === 'object' && !Array.isArray(d.description)
        ? (d.description as Record<string, unknown>)[loc] ??
          (d.description as Record<string, unknown>).en
        : d.description
    if (isLexicalDoc(descVal)) {
      descriptionRich[loc] = descVal
      const plain = lexicalToPlain(descVal)
      description[loc] = plain ? [plain] : fb.description[loc] || fb.description.en || []
    } else if (Array.isArray(descVal)) {
      const paras = descVal
        .map((row: any) => (typeof row === 'string' ? row : row?.text || ''))
        .filter(Boolean)
      description[loc] = paras.length ? paras : fb.description[loc] || fb.description.en || []
      descriptionRich[loc] = lexicalFromParagraphs(description[loc])
    } else if (typeof descVal === 'string' && descVal.trim()) {
      descriptionRich[loc] = lexicalFromText(descVal)
      description[loc] = [descVal]
    } else {
      description[loc] = fb.description[loc] || fb.description.en || []
      descriptionRich[loc] = lexicalFromParagraphs(description[loc])
    }
  }

  let offerings: ServiceOffering[] = fb.offerings
  if (Array.isArray(d.offerings) && d.offerings.length) {
    offerings = d.offerings.map((o: any, oi: number) => {
      const fo = fb.offerings[oi]
      return {
        name: locMap(o.name, fo?.name || { en: '' }),
        ...(o.description || fo?.description
          ? { description: locMap(o.description, fo?.description || { en: '' }) }
          : {}),
        price: o.price || fo?.price || '',
        ...(o.pricePrefix || fo?.pricePrefix
          ? { pricePrefix: locMap(o.pricePrefix, fo?.pricePrefix || { en: 'from' }) }
          : {}),
      }
    })
  }

  return {
    id: fb.id,
    slug: d.slug || fb.slug || SERVICE_ID_TO_SLUG[fb.id] || fb.slug,
    title: locMap(d.title, fb.title),
    hero: { type: heroType, src: heroUrl },
    summary: summaryPlain,
    summaryRich,
    description,
    descriptionRich,
    features,
    offerings,
    currency:
      d.currency === 'ILS' || d.currency === 'EUR' || d.currency === 'USD'
        ? d.currency
        : fb.currency || 'USD',
    ...(hasLocalizedSeo(d.seo?.title) ? { seoTitle: locMap(d.seo.title, { en: '' }) } : {}),
    ...(hasLocalizedSeo(d.seo?.description)
      ? { seoDescription: locMap(d.seo.description, { en: '' }) }
      : {}),
  }
}

async function fetchServicePages(): Promise<ServicePage[]> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'services',
      locale: 'all',
      depth: 1,
      limit: 100,
      sort: 'order',
    })
    if (!res.docs?.length) return SERVICE_PAGES
    // Prefer docs that have detail fields / slug; still return all mapped
    return res.docs.map((d: any, i: number) => mapServiceDoc(d, i))
  } catch (err) {
    console.error('[cmsPages] services fallback:', err)
    return SERVICE_PAGES
  }
}

function mapOrderFromPlanDoc(d: any, i: number): OrderPlan {
  const fb =
    ORDER_PLANS.find((p) => p.slug === d.slug) ||
    ORDER_PLANS[i] ||
    ORDER_PLANS[0]

  const card: SolutionCardItem = {
    id: d.slug || fb.slug,
    price: d.price ?? fb.card.price,
    currency:
      d.currency === 'USD' || d.currency === 'EUR' || d.currency === 'ILS'
        ? d.currency
        : fb.card.currency || 'ILS',
    title: locMap(d.title, fb.card.title) as SolutionCardItem['title'],
    features: [],
    ...(hasLocalizedSeo(d.pricePrefix)
      ? { pricePrefix: locMapCms(d.pricePrefix) as SolutionCardItem['pricePrefix'] }
      : {}),
    ...(d.originalPrice ? { originalPrice: d.originalPrice } : {}),
    ...(d.priceNote ? { priceNote: true } : {}),
    ...(d.featured ? { featured: true } : {}),
    ...(hasLocalizedSeo(d.disclaimer)
      ? { disclaimer: locMapCms(d.disclaimer) as SolutionCardItem['disclaimer'] }
      : {}),
  }

  if (Array.isArray(d.features) && d.features.length) {
    card.features = d.features.map((f: any) => {
      const row: SolutionCardItem['features'][number] = {
        label: locMapCms(f.label) as any,
        value: locMapCms(f.value) as any,
      }

      const fullPlain: LocaleMap = { en: '', ru: '', he: '' }
      const fullRich: Record<string, unknown> = {}
      let hasFull = false
      for (const loc of LOCALES) {
        const raw =
          f.full && typeof f.full === 'object' && !Array.isArray(f.full) && !isLexicalDoc(f.full)
            ? (f.full as Record<string, unknown>)[loc] ?? (f.full as Record<string, unknown>).en
            : f.full
        if (isLexicalDoc(raw)) {
          fullRich[loc] = raw
          fullPlain[loc] = lexicalToPlain(raw)
          if (fullPlain[loc]) hasFull = true
        } else if (typeof raw === 'string' && raw.trim()) {
          fullRich[loc] = lexicalFromText(raw)
          fullPlain[loc] = raw.trim()
          hasFull = true
        }
      }
      if (hasFull) {
        row.full = fullPlain
        row.fullRich = fullRich
      }
      return row
    })
  }

  let periods: OrderPeriod[] = []
  if (Array.isArray(d.periods) && d.periods.length) {
    periods = d.periods.map((p: any) => ({
      id: p.periodId || 'full',
      label: locMapCms(p.label),
      months: typeof p.months === 'number' ? p.months : 1,
      discountPercent: typeof p.discountPercent === 'number' ? p.discountPercent : 0,
    }))
  }

  let addons: OrderAddon[] = []
  if (Array.isArray(d.addons) && d.addons.length) {
    addons = d.addons.map((a: any) => ({
      id: a.addonId || String(a.id),
      name: locMapCms(a.name),
      description: locMapCms(a.description),
      price: typeof a.price === 'number' ? a.price : Number(a.price) || 0,
      discountMonths1:
        typeof a.discountMonths1 === 'number' ? a.discountMonths1 : Number(a.discountMonths1) || 0,
      discountMonths6:
        typeof a.discountMonths6 === 'number' ? a.discountMonths6 : Number(a.discountMonths6) || 0,
      discountMonths12:
        typeof a.discountMonths12 === 'number'
          ? a.discountMonths12
          : Number(a.discountMonths12) || 0,
      ...(a.recommended ? { recommended: true } : {}),
      ...(a.mandatory ? { mandatory: true } : {}),
      ...(hasLocalizedSeo(a.note) ? { note: locMapCms(a.note) } : {}),
    }))
  }

  return {
    slug: d.slug || fb.slug,
    card,
    subtitle: locMapCms(d.subtitle),
    periods,
    defaultPeriodId: periods[0]?.id || '',
    addons,
    ...(hasLocalizedSeo(d.promo) ? { promo: locMapCms(d.promo) } : {}),
    ...(hasLocalizedSeo(d.paymentNote) ? { paymentNote: locMapCms(d.paymentNote) } : {}),
    ...(() => {
      const includesPlain: LocaleMap = { en: '', ru: '', he: '' }
      const includesRich: Record<string, unknown> = {}
      let hasIncludes = false
      for (const loc of LOCALES) {
        const raw =
          d.includes &&
          typeof d.includes === 'object' &&
          !Array.isArray(d.includes) &&
          !isLexicalDoc(d.includes)
            ? (d.includes as Record<string, unknown>)[loc] ??
              (d.includes as Record<string, unknown>).en
            : d.includes
        if (isLexicalDoc(raw)) {
          includesRich[loc] = raw
          includesPlain[loc] = lexicalToPlain(raw)
          if (includesPlain[loc]) hasIncludes = true
        } else if (typeof raw === 'string' && raw.trim()) {
          includesRich[loc] = lexicalFromText(raw)
          includesPlain[loc] = raw.trim()
          hasIncludes = true
        }
      }
      return hasIncludes ? { includes: includesPlain, includesRich } : {}
    })(),
    ...(hasLocalizedSeo(d.taxNote) ? { taxNote: locMapCms(d.taxNote) } : {}),
    ...(hasLocalizedSeo(d.taxValue) ? { taxValue: locMapCms(d.taxValue) } : {}),
    ...(hasLocalizedSeo(d.seo?.title) ? { seoTitle: locMapCms(d.seo.title) } : {}),
    ...(hasLocalizedSeo(d.seo?.description) ? { seoDescription: locMapCms(d.seo.description) } : {}),
  }
}

async function fetchOrderPlans(): Promise<OrderPlan[]> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'solution-plans',
      locale: 'all',
      depth: 0,
      limit: 100,
      sort: 'order',
    })
    if (!res.docs?.length) return ORDER_PLANS
    return res.docs.map((d: any, i: number) => mapOrderFromPlanDoc(d, i))
  } catch (err) {
    console.error('[cmsPages] order plans fallback:', err)
    return ORDER_PLANS
  }
}

export const getCachedPortfolioProjects = (locale: string) =>
  // v3: categories are CMS-managed; bust older category-select cache entries
  unstable_cache(() => fetchPortfolioProjects(locale), [`portfolio-projects-v3-${locale}`], {
    tags: [SITE_CONTENT_TAG],
    revalidate: false,
  })()

export const getCachedPortfolioCategories = (locale: string) =>
  unstable_cache(() => fetchPortfolioCategories(locale), [`portfolio-categories-v1-${locale}`], {
    tags: [SITE_CONTENT_TAG],
    revalidate: false,
  })()

export async function getPortfolioProjectBySlug(
  slug: string,
  locale = 'en',
): Promise<PortfolioProject | undefined> {
  const all = await getCachedPortfolioProjects(locale)
  return all.find((p) => p.slug === slug)
}

export async function getAllPortfolioSlugsCms(): Promise<string[]> {
  const all = await getCachedPortfolioProjects('en')
  return all.map((p) => p.slug)
}

export const getCachedServicePages = () =>
  unstable_cache(() => fetchServicePages(), ['service-pages'], {
    tags: [SITE_CONTENT_TAG],
    revalidate: false,
  })()

export async function getServicePageBySlug(slug: string): Promise<ServicePage | undefined> {
  const all = await getCachedServicePages()
  return all.find((p) => p.slug === slug) || SERVICE_PAGES.find((p) => p.slug === slug)
}

export async function getAllServiceSlugsCms(): Promise<string[]> {
  const all = await getCachedServicePages()
  const slugs = all.map((p) => p.slug).filter(Boolean)
  return slugs.length ? slugs : SERVICE_PAGES.map((p) => p.slug)
}

export const getCachedOrderPlans = () =>
  unstable_cache(() => fetchOrderPlans(), ['order-plans'], {
    tags: [SITE_CONTENT_TAG],
    revalidate: false,
  })()

export async function getOrderPlanBySlug(slug: string): Promise<OrderPlan | undefined> {
  const all = await getCachedOrderPlans()
  return all.find((p) => p.slug === slug) || getStaticOrderPlan(slug)
}

export async function getAllOrderSlugsCms(): Promise<string[]> {
  const all = await getCachedOrderPlans()
  const slugs = all.map((p) => p.slug).filter(Boolean)
  return slugs.length ? slugs : solutions.cards.map((c) => c.id)
}
