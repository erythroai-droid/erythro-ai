import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import config from '@payload-config'
import { SITE_CONTENT_TAG } from './revalidate'
import {
  PORTFOLIO_PROJECTS,
  type PortfolioCategory,
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
  return v && typeof v === 'object' && typeof v.url === 'string' ? v.url : undefined
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

function mapPortfolioDoc(d: any, i: number, locale: string): PortfolioProject {
  const fb = PORTFOLIO_PROJECTS[i] || PORTFOLIO_PROJECTS[0]
  const cardUrl = mediaUrl(d.cardImage) || fb.image
  const heroUrl = mediaUrl(d.heroMedia) || mediaUrl(d.cardImage) || fb.hero.src
  const mime = d.heroMedia?.mimeType || ''
  const heroType: 'image' | 'video' = String(mime).startsWith('video/') ? 'video' : 'image'

  const body: PortfolioBodySection[] =
    Array.isArray(d.body) && d.body.length
      ? d.body.map((section: any, si: number) => {
          const fbSection = fb.body[si]
          const paragraphs =
            Array.isArray(section.paragraphs) && section.paragraphs.length
              ? section.paragraphs.map((p: any) => pickStr(p.text, locale)).filter(Boolean)
              : fbSection?.paragraphs || []
          const images =
            Array.isArray(section.images) && section.images.length
              ? section.images.map((img: any) => mediaUrl(img.image)).filter(Boolean)
              : fbSection?.images || []
          return {
            ...(pickStr(section.heading, locale)
              ? { heading: pickStr(section.heading, locale) }
              : fbSection?.heading
                ? { heading: fbSection.heading }
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

  return {
    id: String(d.id ?? fb.id),
    slug: d.slug || fb.slug,
    title: pickStr(d.title, locale, fb.title),
    category: (d.category || fb.category) as Exclude<PortfolioCategory, 'all'>,
    categoryLabel: pickStr(d.categoryLabel, locale, fb.categoryLabel),
    description: pickStr(d.description, locale, fb.description),
    tags,
    image: cardUrl,
    date: d.date || fb.date,
    stack,
    client: d.client || fb.client,
    ...(d.link || fb.link ? { link: d.link || fb.link } : {}),
    hero: { type: heroType, src: heroUrl },
    summary: pickStr(d.summary, locale, fb.summary),
    body,
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
    return res.docs.map((d: any, i: number) => mapPortfolioDoc(d, i, locale))
  } catch (err) {
    console.error('[cmsPages] portfolio fallback:', err)
    return PORTFOLIO_PROJECTS
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
  const description = locList(d.description, 'text', fb.description)

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
    summary: locMap(d.summary, fb.summary),
    description,
    features,
    offerings,
    currency:
      d.currency === 'ILS' || d.currency === 'EUR' || d.currency === 'USD'
        ? d.currency
        : fb.currency || 'USD',
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
    features: fb.card.features,
    ...(d.pricePrefix || fb.card.pricePrefix
      ? { pricePrefix: locMap(d.pricePrefix, fb.card.pricePrefix || { en: '' }) as SolutionCardItem['pricePrefix'] }
      : {}),
    ...(d.originalPrice || fb.card.originalPrice
      ? { originalPrice: d.originalPrice ?? fb.card.originalPrice }
      : {}),
    ...(d.priceNote ?? fb.card.priceNote ? { priceNote: !!(d.priceNote ?? fb.card.priceNote) } : {}),
    ...(d.featured ?? fb.card.featured ? { featured: !!(d.featured ?? fb.card.featured) } : {}),
    ...(d.disclaimer || fb.card.disclaimer
      ? { disclaimer: locMap(d.disclaimer, fb.card.disclaimer || { en: '' }) as SolutionCardItem['disclaimer'] }
      : {}),
  }

  if (Array.isArray(d.features) && d.features.length) {
    card.features = d.features.map((f: any, fi: number) => {
      const ff = fb.card.features[fi]
      if (f.full && (typeof f.full === 'string' || f.full?.en || f.full?.ru || f.full?.he)) {
        return { full: locMap(f.full, ff?.full || { en: '' }) as SolutionCardItem['features'][0]['full'] }
      }
      return {
        label: locMap(f.label, ff?.label || { en: '' }) as any,
        value: locMap(f.value, ff?.value || { en: '' }) as any,
      }
    })
  }

  let periods: OrderPeriod[] = fb.periods
  if (Array.isArray(d.periods) && d.periods.length) {
    periods = d.periods.map((p: any) => ({
      id: p.periodId || 'full',
      label: locMap(p.label, { en: 'Pay in full', ru: 'Одним платежом', he: 'תשלום מלא' }),
      months: typeof p.months === 'number' ? p.months : 1,
      discountPercent: typeof p.discountPercent === 'number' ? p.discountPercent : 0,
    }))
  }

  let addons: OrderAddon[] = fb.addons
  if (Array.isArray(d.addons) && d.addons.length) {
    addons = d.addons.map((a: any) => ({
      id: a.addonId || String(a.id),
      name: locMap(a.name, { en: '' }),
      description: locMap(a.description, { en: '' }),
      price: typeof a.price === 'number' ? a.price : Number(a.price) || 0,
      ...(a.recommended ? { recommended: true } : {}),
      ...(a.mandatory ? { mandatory: true } : {}),
      ...(a.note ? { note: locMap(a.note, { en: '' }) } : {}),
    }))
  }

  return {
    slug: d.slug || fb.slug,
    card,
    subtitle: locMap(d.subtitle, fb.subtitle),
    periods,
    defaultPeriodId: periods[0]?.id || fb.defaultPeriodId,
    addons,
    ...(d.promo || fb.promo ? { promo: locMap(d.promo, fb.promo || { en: '' }) } : {}),
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
  unstable_cache(() => fetchPortfolioProjects(locale), [`portfolio-projects-${locale}`], {
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
