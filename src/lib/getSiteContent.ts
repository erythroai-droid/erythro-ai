import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import config from '@payload-config'
import { defaultSiteContent, type SiteContent, type Localized } from './defaultContent'
import { SITE_CONTENT_TAG } from './revalidate'
import { SERVICE_ID_TO_SLUG } from './servicePages'

const LOCALES = ['en', 'ru', 'he'] as const

/* eslint-disable @typescript-eslint/no-explicit-any */

/** True if a Payload localized value has any non-empty locale string. */
function hasContent(v: any): boolean {
  if (!v || typeof v !== 'object') return typeof v === 'string' && v.trim().length > 0
  return LOCALES.some((l) => typeof v[l] === 'string' && v[l].trim().length > 0)
}

/** Merge a Payload localized object over a fallback, keeping all locales filled. */
function L(v: any, fallback: Localized): Localized {
  const out: Localized = { ...fallback }
  if (typeof v === 'string' && v.trim().length > 0) {
    out.en = v.trim()
    return out
  }
  if (v && typeof v === 'object') {
    for (const l of LOCALES) {
      if (typeof v[l] === 'string' && v[l].trim().length > 0) out[l] = v[l]
    }
  }
  return out
}

function mediaUrl(v: any): string | undefined {
  return v && typeof v === 'object' && typeof v.url === 'string' ? v.url : undefined
}

function isPopulatedMedia(v: any): boolean {
  return !!(v && typeof v === 'object' && (typeof v.url === 'string' || typeof v.mimeType === 'string'))
}

function mediaRelationId(v: any): number | string | null {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.length > 0) return v
  return null
}

function isVideoMedia(media: any, url?: string): boolean {
  if (typeof media?.mimeType === 'string' && media.mimeType.startsWith('video/')) return true
  const candidates = [url, media?.url, media?.filename].filter((s) => typeof s === 'string') as string[]
  return candidates.some((s) => /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(s))
}

async function resolveServiceMediaMap(payload: any, docs: any[]): Promise<Map<number | string, any>> {
  const mediaById = new Map<number | string, any>()
  const unresolvedIds: (number | string)[] = []

  for (const d of docs) {
    const raw = d.image
    if (!isPopulatedMedia(raw)) {
      const id = mediaRelationId(raw)
      if (id != null) unresolvedIds.push(id)
    }
  }

  if (!unresolvedIds.length) return mediaById

  const uniqueIds = [...new Set(unresolvedIds)]
  const mediaRes = (await payload.find({
    collection: 'media',
    where: { id: { in: uniqueIds } },
    limit: uniqueIds.length,
    depth: 0,
  })) as { docs?: any[] }

  for (const m of mediaRes.docs ?? []) {
    mediaById.set(m.id, m)
  }

  return mediaById
}

function resolveServiceMedia(raw: any, mediaById: Map<number | string, any>): any | null {
  if (isPopulatedMedia(raw)) return raw
  const id = mediaRelationId(raw)
  if (id == null) return null
  return mediaById.get(id) ?? mediaById.get(Number(id)) ?? null
}

/**
 * Loads all editable site content from Payload (globals + collections),
 * merged over the static defaults so the site never renders empty.
 * Falls back entirely to defaults if Payload/DB is unavailable.
 */
export async function getSiteContent(): Promise<SiteContent> {
  const content: SiteContent = structuredClone(defaultSiteContent)

  try {
    const payload = await getPayload({ config })

    const [header, hero, servicesIntro, caseStudiesG, solutionsIntro, faqG, footer, settings] =
      await Promise.all([
        payload.findGlobal({ slug: 'header', locale: 'all', depth: 0 }) as Promise<any>,
        payload.findGlobal({ slug: 'hero', locale: 'all', depth: 1 }) as Promise<any>,
        payload.findGlobal({ slug: 'services-section', locale: 'all', depth: 0 }) as Promise<any>,
        payload.findGlobal({ slug: 'case-studies', locale: 'all', depth: 1 }) as Promise<any>,
        payload.findGlobal({ slug: 'solutions-section', locale: 'all', depth: 0 }) as Promise<any>,
        payload.findGlobal({ slug: 'faq-section', locale: 'all', depth: 0 }) as Promise<any>,
        payload.findGlobal({ slug: 'footer', locale: 'all', depth: 0 }) as Promise<any>,
        payload.findGlobal({ slug: 'site-settings', locale: 'all', depth: 1 }) as Promise<any>,
      ])

    const [servicesRes, plansRes] = await Promise.all([
      payload.find({ collection: 'services', locale: 'all', depth: 1, limit: 100, sort: 'order' }) as Promise<any>,
      payload.find({ collection: 'solution-plans', locale: 'all', depth: 0, limit: 100, sort: 'order' }) as Promise<any>,
    ])

    // --- Navbar (Header global) ---
    if (Array.isArray(header?.navItems) && header.navItems.length) {
      content.navbar.navItems = header.navItems.map((n: any, i: number) => ({
        label: L(n.label, defaultSiteContent.navbar.navItems[i]?.label ?? {}),
        description:
          defaultSiteContent.navbar.navItems[i]?.description ??
          ({ en: '', ru: '', he: '' } as Record<string, string>),
        href: n.href ?? defaultSiteContent.navbar.navItems[i]?.href ?? '#',
      }))
    }
    if (hasContent(header?.ctaLabel)) content.navbar.ctaLabel = L(header.ctaLabel, content.navbar.ctaLabel)

    // --- Hero global ---
    content.hero.preHeading = L(hero?.preHeading, content.hero.preHeading)
    content.hero.mainHeading = L(hero?.mainHeading, content.hero.mainHeading)
    content.hero.subtext = L(hero?.subtext, content.hero.subtext)
    content.hero.ctaFind = L(hero?.ctaFind, content.hero.ctaFind)
    const heroBg = mediaUrl(hero?.backgroundImage)
    if (heroBg) {
      content.hero.backgroundImage = heroBg
    }

    // --- Services section intro + items ---
    content.services.sectionTitle = L(servicesIntro?.sectionTitle, content.services.sectionTitle)
    content.services.sectionSubtitle = L(servicesIntro?.sectionSubtitle, content.services.sectionSubtitle)
    content.services.startCTA = L(servicesIntro?.startCTA, content.services.startCTA)
    content.services.priceLabel = L(servicesIntro?.priceLabel, content.services.priceLabel)

    if (Array.isArray(servicesRes?.docs) && servicesRes.docs.length) {
      const serviceMediaById = await resolveServiceMediaMap(payload, servicesRes.docs)

      content.services.items = servicesRes.docs.map((d: any, i: number) => {
        const fb = defaultSiteContent.services.items[i]
        const features: Record<string, string[]> = { en: [], ru: [], he: [] }
        for (const f of d.features ?? []) {
          for (const l of LOCALES) features[l].push(f.feature?.[l] || f.feature?.en || '')
        }
        // The `image` upload field accepts any media; if a video was uploaded,
        // expose it as `video` so the card plays it instead of rendering an image.
        const media = resolveServiceMedia(d.image, serviceMediaById)
        const url = mediaUrl(media)
        const isVideo = isVideoMedia(media, url)
        return {
          id: fb?.id ?? String(d.id),
          slug:
            (typeof d.slug === 'string' && d.slug.trim()) ||
            (fb?.id ? SERVICE_ID_TO_SLUG[fb.id] : undefined) ||
            undefined,
          number: d.number || fb?.number || String(i + 1).padStart(2, '0'),
          title: L(d.title, fb?.title ?? { en: '', ru: '', he: '' }),
          features,
          // For videos keep the static poster/image as fallback under the player.
          image: isVideo ? fb?.image || '' : url || fb?.image || '',
          ...(isVideo && url
            ? { video: url, videoPoster: fb?.videoPoster || fb?.image || '' }
            : {}),
        }
      })
    }

    // --- Case studies global ---
    content.caseStudies.preTitle = L(caseStudiesG?.preTitle, content.caseStudies.preTitle)
    content.caseStudies.subtitle = L(caseStudiesG?.subtitle, content.caseStudies.subtitle)
    content.caseStudies.cardTitle = L(caseStudiesG?.cardTitle, content.caseStudies.cardTitle)
    content.caseStudies.cardCategory = L(caseStudiesG?.cardCategory, content.caseStudies.cardCategory)
    content.caseStudies.cardDescription = L(caseStudiesG?.cardDescription, content.caseStudies.cardDescription)
    content.caseStudies.cardCTA = L(caseStudiesG?.cardCTA, content.caseStudies.cardCTA)
    const caseStudyVideo = mediaUrl(caseStudiesG?.bannerVideo)
    if (caseStudyVideo) content.caseStudies.video = caseStudyVideo
    const caseStudyVideoMobile = mediaUrl(caseStudiesG?.bannerVideoMobile)
    if (caseStudyVideoMobile) content.caseStudies.videoMobile = caseStudyVideoMobile

    // --- Solutions section intro + cards ---
    content.solutions.sectionTitle = L(solutionsIntro?.sectionTitle, content.solutions.sectionTitle)
    content.solutions.sectionSubtitle = L(solutionsIntro?.sectionSubtitle, content.solutions.sectionSubtitle)
    content.solutions.ctaLabel = L(solutionsIntro?.ctaLabel, content.solutions.ctaLabel)

    if (Array.isArray(plansRes?.docs) && plansRes.docs.length) {
      content.solutions.cards = plansRes.docs.map((d: any, i: number) => {
        const fb = defaultSiteContent.solutions.cards[i]
        const features = (d.features ?? []).map((f: any, fi: number) => {
          const fbF = fb?.features?.[fi]
          if (hasContent(f.full)) return { full: L(f.full, fbF?.full ?? { en: '', ru: '', he: '' }) }
          return {
            label: L(f.label, fbF?.label ?? { en: '', ru: '', he: '' }),
            value: L(f.value, fbF?.value ?? { en: '', ru: '', he: '' }),
          }
        })
        return {
          id: (typeof d.slug === 'string' && d.slug.trim()) || fb?.id || String(d.id),
          price: d.price ?? fb?.price ?? '',
          currency:
            d.currency === 'USD' || d.currency === 'EUR' || d.currency === 'ILS'
              ? d.currency
              : fb?.currency || 'ILS',
          ...(hasContent(d.pricePrefix) || fb?.pricePrefix
            ? { pricePrefix: L(d.pricePrefix, fb?.pricePrefix ?? { en: '', ru: '', he: '' }) }
            : {}),
          ...(d.priceNote ?? fb?.priceNote ? { priceNote: !!(d.priceNote ?? fb?.priceNote) } : {}),
          ...(d.originalPrice || fb?.originalPrice
            ? { originalPrice: d.originalPrice ?? fb?.originalPrice }
            : {}),
          ...(d.featured ?? fb?.featured ? { featured: !!(d.featured ?? fb?.featured) } : {}),
          title: L(d.title, fb?.title ?? { en: '', ru: '', he: '' }),
          features: features.length ? features : (fb?.features ?? []),
          ...(hasContent(d.disclaimer) || fb?.disclaimer
            ? { disclaimer: L(d.disclaimer, fb?.disclaimer ?? { en: '', ru: '', he: '' }) }
            : {}),
        }
      })
    }

    // --- FAQ section ---
    content.faq.sectionTitle = L(faqG?.sectionTitle, content.faq.sectionTitle)
    content.faq.sectionSubtitle = L(faqG?.sectionSubtitle, content.faq.sectionSubtitle)
    if (Array.isArray(faqG?.items) && faqG.items.length) {
      content.faq.items = faqG.items.map((item: any, i: number) => {
        const fb = defaultSiteContent.faq.items[i]
        return {
          question: L(item.question, fb?.question ?? { en: '', ru: '', he: '' }),
          answer: L(item.answer, fb?.answer ?? { en: '', ru: '', he: '' }),
        }
      })
    }

    // --- Footer global ---
    content.footer.ctaHeadingLine1 = L(footer?.ctaHeadingLine1, content.footer.ctaHeadingLine1)
    content.footer.ctaHeadingLine2 = L(footer?.ctaHeadingLine2, content.footer.ctaHeadingLine2)
    content.footer.ctaButton = L(footer?.ctaButton, content.footer.ctaButton)
    content.footer.companyTitle = L(footer?.companyTitle, content.footer.companyTitle)
    content.footer.contactTitle = L(footer?.contactTitle, content.footer.contactTitle)
    content.footer.emailLabel = L(footer?.emailLabel, content.footer.emailLabel)
    content.footer.phoneLabel = L(footer?.phoneLabel, content.footer.phoneLabel)
    content.footer.locationLabel = L(footer?.locationLabel, content.footer.locationLabel)
    content.footer.locationValue = L(footer?.locationValue, content.footer.locationValue)
    content.footer.copyright = L(footer?.copyright, content.footer.copyright)
    if (Array.isArray(footer?.companyLinks) && footer.companyLinks.length) {
      content.footer.companyLinks = footer.companyLinks.map((n: any, i: number) => ({
        href: n.href ?? defaultSiteContent.footer.companyLinks[i]?.href ?? '#',
        label: L(n.label, defaultSiteContent.footer.companyLinks[i]?.label ?? {}),
      }))
    }
    if (Array.isArray(footer?.legalLinks) && footer.legalLinks.length) {
      content.footer.legalLinks = footer.legalLinks.map((n: any, i: number) => ({
        id: n.key || defaultSiteContent.footer.legalLinks[i]?.id || `legal-${i}`,
        href: n.href ?? '#',
        label: L(n.label, defaultSiteContent.footer.legalLinks[i]?.label ?? {}),
      }))
    }

    // --- Site settings (contacts + cookie) ---
    if (settings?.email) content.siteSettings.email = settings.email
    if (settings?.phone) content.siteSettings.phone = settings.phone
    if (settings?.phoneDisplay) content.siteSettings.phoneDisplay = settings.phoneDisplay
    if (settings?.facebook) content.siteSettings.facebook = settings.facebook
    if (settings?.tiktok) content.siteSettings.tiktok = settings.tiktok
    content.cookieConsent.message = L(settings?.cookieMessage, content.cookieConsent.message)
    content.cookieConsent.accept = L(settings?.cookieAccept, content.cookieConsent.accept)
    content.cookieConsent.decline = L(settings?.cookieDecline, content.cookieConsent.decline)
  } catch (err) {
    console.error('[getSiteContent] Falling back to default content:', err)
    return structuredClone(defaultSiteContent)
  }

  return content
}

/**
 * Cached variant of {@link getSiteContent}. The result is locale-independent
 * (it always contains all locales), so a single cache entry serves every
 * visitor regardless of their `NEXT_LOCALE` cookie. The page still reads the
 * cookie outside this cache to pick the initial locale, so language memory is
 * unaffected. Invalidated via the `SITE_CONTENT_TAG` tag whenever content is
 * edited in the Payload admin (see src/lib/revalidate.ts).
 */
export const getCachedSiteContent = unstable_cache(getSiteContent, ['site-content-v3'], {
  tags: [SITE_CONTENT_TAG],
})

export interface SeoSettings {
  title?: string
  description?: Partial<Record<(typeof LOCALES)[number], string>>
  ogImage?: string
}

/**
 * Fetches only the SEO-related fields from the Site Settings global.
 * Returns an empty object on any failure so the layout can fall back
 * to its static defaults.
 */
export async function getSeoSettings(): Promise<SeoSettings> {
  try {
    const payload = await getPayload({ config })
    const settings = (await payload.findGlobal({
      slug: 'site-settings',
      locale: 'all',
      depth: 1,
    })) as any

    const out: SeoSettings = {}
    if (typeof settings?.seoTitle === 'string' && settings.seoTitle.trim()) {
      out.title = settings.seoTitle.trim()
    }
    if (hasContent(settings?.seoDescription)) {
      out.description = {}
      for (const l of LOCALES) {
        if (typeof settings.seoDescription?.[l] === 'string' && settings.seoDescription[l].trim()) {
          out.description[l] = settings.seoDescription[l]
        }
      }
    }
    const og = mediaUrl(settings?.ogImage)
    if (og) out.ogImage = og
    return out
  } catch (err) {
    console.error('[getSeoSettings] Falling back to static SEO:', err)
    return {}
  }
}

/** Cached variant of {@link getSeoSettings}; shares the site-content tag. */
export const getCachedSeoSettings = unstable_cache(getSeoSettings, ['seo-settings'], {
  tags: [SITE_CONTENT_TAG],
})
