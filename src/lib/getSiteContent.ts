import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import config from '@payload-config'
import { defaultSiteContent, type SiteContent, type Localized } from './defaultContent'
import { SITE_CONTENT_TAG } from './revalidate'
import { SERVICE_ID_TO_SLUG } from './servicePages'
import { isLexicalDoc, lexicalFromText, lexicalToPlain } from './lexical'
import { mediaDocUrl } from './publicMediaUrl'

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

/** Flatten Lexical (or plain) localized values into plain Localized strings. */
function LPlainFromLexical(v: any, fallback: Localized): Localized {
  const out: Localized = { ...fallback }
  if (isLexicalDoc(v)) {
    const plain = lexicalToPlain(v)
    if (plain) {
      out.en = plain
      return out
    }
  }
  if (typeof v === 'string' && v.trim()) {
    out.en = v.trim()
    return out
  }
  if (v && typeof v === 'object') {
    for (const l of LOCALES) {
      const raw = v[l]
      const plain = lexicalToPlain(raw) || (typeof raw === 'string' ? raw.trim() : '')
      if (plain) out[l] = plain
    }
  }
  return out
}

/** Keep Lexical docs per locale (with plain-string fallbacks converted). */
function LRich(v: any, fallbackPlain: Localized): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const l of LOCALES) {
    const raw = v && typeof v === 'object' && !isLexicalDoc(v) ? v[l] : l === 'en' ? v : undefined
    if (isLexicalDoc(raw)) out[l] = raw
    else if (typeof raw === 'string' && raw.trim()) out[l] = lexicalFromText(raw)
    else if (fallbackPlain[l]) out[l] = lexicalFromText(fallbackPlain[l])
  }
  return out
}

function mediaRelationId(v: any): number | string | null {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.length > 0) return v
  return null
}

function isPopulatedMedia(v: any): boolean {
  return !!(v && typeof v === 'object' && (typeof v.url === 'string' || typeof v.mimeType === 'string'))
}

/** Prefer public Blob URL; rewrite `/api/media/file/...` when possible. */
function mediaUrl(v: any): string | undefined {
  return mediaDocUrl(v)
}

async function resolveMediaDoc(payload: any, raw: any): Promise<any | null> {
  if (isPopulatedMedia(raw)) return raw
  const id = mediaRelationId(raw)
  if (id == null) return null
  try {
    return await payload.findByID({ collection: 'media', id, depth: 0 })
  } catch {
    return null
  }
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
      content.navbar.navItems = header.navItems.map((n: any, i: number) => {
        const fallbackHref = defaultSiteContent.navbar.navItems[i]?.href ?? '#'
        const rawHref = n.href ?? fallbackHref
        const children = Array.isArray(n.children)
          ? n.children
              .map((c: any) => {
                const childHref = typeof c?.href === 'string' ? c.href.trim() : ''
                if (!childHref) return null
                return {
                  label: L(c.label, { en: '', ru: '', he: '' }),
                  href: childHref === '#contacts' ? '/contacts' : childHref,
                }
              })
              .filter(Boolean)
          : []
        return {
          label: L(n.label, defaultSiteContent.navbar.navItems[i]?.label ?? {}),
          description: L(
            n.description,
            defaultSiteContent.navbar.navItems[i]?.description ?? {
              en: '',
              ru: '',
              he: '',
            },
          ),
          // Legacy hash target → dedicated contacts page
          href: rawHref === '#contacts' ? '/contacts' : rawHref,
          children,
        }
      })
    }
    if (hasContent(header?.ctaLabel)) content.navbar.ctaLabel = L(header.ctaLabel, content.navbar.ctaLabel)
    if (typeof header?.ctaHref === 'string' && header.ctaHref.trim()) {
      content.navbar.ctaHref = header.ctaHref.trim()
    }

    // --- Hero global ---
    content.hero.preHeading = L(hero?.preHeading, content.hero.preHeading)
    content.hero.mainHeading = L(hero?.mainHeading, content.hero.mainHeading)
    content.hero.subtext = L(hero?.subtext, content.hero.subtext)
    content.hero.ctaFind = L(hero?.ctaFind, content.hero.ctaFind)
    if (typeof hero?.ctaHref === 'string' && hero.ctaHref.trim()) {
      content.hero.ctaHref = hero.ctaHref.trim()
    }
    if (Array.isArray(hero?.words) && hero.words.length >= 2) {
      content.hero.motionHeadings = hero.words.map((item: any, i: number) => {
        const fb = content.hero.motionHeadings[i]
        const fbText =
          fb && typeof fb === 'object' && 'text' in fb
            ? fb.text
            : ((fb as Record<string, string> | undefined) ?? { en: '', ru: '', he: '' })
        const fbOutline =
          fb && typeof fb === 'object' && 'outline' in fb
            ? fb.outline
            : fbText
        const text = L(item.word, fbText)
        const outlineRaw = item.outline
        const hasOutline =
          outlineRaw &&
          typeof outlineRaw === 'object' &&
          Object.values(outlineRaw).some((v) => typeof v === 'string' && v.trim())
        return {
          text,
          outline: hasOutline ? L(outlineRaw, fbOutline) : text,
        }
      })
    }
    const heroMedia = await resolveMediaDoc(payload, hero?.backgroundImage)
    const heroBg = mediaUrl(heroMedia)
    if (heroBg) {
      content.hero.backgroundImage = heroBg
    }

    // --- Services section intro + items ---
    content.services.sectionTitle = L(servicesIntro?.sectionTitle, content.services.sectionTitle)
    content.services.sectionSubtitle = L(servicesIntro?.sectionSubtitle, content.services.sectionSubtitle)
    content.services.startCTA = L(servicesIntro?.startCTA, content.services.startCTA)
    if (typeof servicesIntro?.startCtaHref === 'string' && servicesIntro.startCtaHref.trim()) {
      content.services.startCtaHref = servicesIntro.startCtaHref.trim()
    }
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
    if (typeof caseStudiesG?.cardCtaHref === 'string' && caseStudiesG.cardCtaHref.trim()) {
      content.caseStudies.cardCtaHref = caseStudiesG.cardCtaHref.trim()
    }
    content.caseStudies.viewAllProjects = L(
      caseStudiesG?.viewAllProjects,
      content.caseStudies.viewAllProjects,
    )
    if (typeof caseStudiesG?.viewAllHref === 'string' && caseStudiesG.viewAllHref.trim()) {
      content.caseStudies.viewAllHref = caseStudiesG.viewAllHref.trim()
    }
    const caseStudyVideoDoc = await resolveMediaDoc(payload, caseStudiesG?.bannerVideo)
    const caseStudyVideo = mediaUrl(caseStudyVideoDoc)
    if (caseStudyVideo) content.caseStudies.video = caseStudyVideo
    const caseStudyVideoMobileDoc = await resolveMediaDoc(payload, caseStudiesG?.bannerVideoMobile)
    const caseStudyVideoMobile = mediaUrl(caseStudyVideoMobileDoc)
    if (caseStudyVideoMobile) content.caseStudies.videoMobile = caseStudyVideoMobile
    // If only desktop banner is set, don't keep a broken local mobile fallback.
    else if (caseStudyVideo) content.caseStudies.videoMobile = caseStudyVideo

    // --- Solutions section intro + cards ---
    content.solutions.sectionTitle = L(solutionsIntro?.sectionTitle, content.solutions.sectionTitle)
    content.solutions.sectionSubtitle = L(solutionsIntro?.sectionSubtitle, content.solutions.sectionSubtitle)
    content.solutions.ctaLabel = L(solutionsIntro?.ctaLabel, content.solutions.ctaLabel)
    if (typeof solutionsIntro?.ctaHref === 'string') {
      content.solutions.ctaHref = solutionsIntro.ctaHref.trim()
    }

    if (Array.isArray(plansRes?.docs) && plansRes.docs.length) {
      content.solutions.cards = plansRes.docs.map((d: any, i: number) => {
        const fb = defaultSiteContent.solutions.cards[i]
        const features = (d.features ?? []).map((f: any, fi: number) => {
          const fbF = fb?.features?.[fi]
          const row: {
            label?: Record<string, string>
            value?: Record<string, string>
          } = {
            label: L(f.label, fbF?.label ?? { en: '', ru: '', he: '' }),
            value: L(f.value, fbF?.value ?? { en: '', ru: '', he: '' }),
          }

          const hasLabel = LOCALES.some((l) => Boolean(row.label?.[l]?.trim()))
          const hasValue = LOCALES.some((l) => Boolean(row.value?.[l]?.trim()))
          if (
            !hasLabel &&
            !hasValue &&
            (hasContent(f.full) ||
              isLexicalDoc(f.full) ||
              LOCALES.some((l) => isLexicalDoc(f.full?.[l])))
          ) {
            const legacy: Record<string, string> = { en: '', ru: '', he: '' }
            for (const loc of LOCALES) {
              const raw =
                f.full && typeof f.full === 'object' && !Array.isArray(f.full) && !isLexicalDoc(f.full)
                  ? (f.full as Record<string, unknown>)[loc] ?? (f.full as Record<string, unknown>).en
                  : f.full
              if (isLexicalDoc(raw)) legacy[loc] = lexicalToPlain(raw)
              else if (typeof raw === 'string' && raw.trim()) legacy[loc] = raw.trim()
            }
            if (LOCALES.some((loc) => Boolean(legacy[loc]))) {
              row.value = legacy
            }
          }
          return row
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
          ...(typeof d.ctaHref === 'string' && d.ctaHref.trim()
            ? { ctaHref: d.ctaHref.trim() }
            : fb?.ctaHref
              ? { ctaHref: fb.ctaHref }
              : {}),
        }
      })
    }

    // Fill empty nav submenus from Services / Solutions collections so existing
    // Header rows keep working until editors add Submenu Items in admin.
    content.navbar.navItems = content.navbar.navItems.map((item) => {
      if (Array.isArray(item.children) && item.children.length > 0) return item

      if (item.href === '#services') {
        const children = content.services.items
          .map((service) => {
            const slug = service.slug || (service.id ? SERVICE_ID_TO_SLUG[service.id] : undefined)
            if (!slug) return null
            return {
              label: service.title,
              href: `/services/${slug}`,
            }
          })
          .filter(Boolean) as Array<{ label: Localized; href: string }>
        return { ...item, children }
      }

      if (item.href === '#solutions') {
        const children = content.solutions.cards.map((card) => ({
          label: card.title,
          href: `/order/${card.id}`,
        }))
        return { ...item, children }
      }

      return { ...item, children: item.children ?? [] }
    })

    // --- FAQ section ---
    content.faq.sectionTitle = L(faqG?.sectionTitle, content.faq.sectionTitle)
    // Older CMS seeds stored English "FAQ" for every locale — swap stubs for localized titles.
    for (const loc of ['ru', 'he'] as const) {
      if (content.faq.sectionTitle[loc] === 'FAQ') {
        content.faq.sectionTitle[loc] = defaultSiteContent.faq.sectionTitle[loc]
      }
    }
    content.faq.sectionSubtitle = L(faqG?.sectionSubtitle, content.faq.sectionSubtitle)
    if (Array.isArray(faqG?.items) && faqG.items.length) {
      content.faq.items = faqG.items.map((item: any, i: number) => {
        const fb = defaultSiteContent.faq.items[i]
        const answerFallback = fb?.answer ?? { en: '', ru: '', he: '' }
        return {
          question: L(item.question, fb?.question ?? { en: '', ru: '', he: '' }),
          answer: LPlainFromLexical(item.answer, answerFallback),
          answerRich: LRich(item.answer, answerFallback),
        }
      })
    }

    // CMS still has the EN FAQ stub without the comma before "so".
    const faqCommaStub =
      'Yes. We build editor-friendly structure and admin tooling so your team can update copy, imagery, case studies, services, and SEO fields without a developer.'
    const faqCommaFixed =
      'Yes. We build editor-friendly structure and admin tooling, so your team can update copy, imagery, case studies, services, and SEO fields without a developer.'
    for (const item of content.faq.items) {
      if (item.answer?.en === faqCommaStub) {
        item.answer = { ...item.answer, en: faqCommaFixed }
        item.answerRich = {
          ...(item.answerRich ?? {}),
          en: lexicalFromText(faqCommaFixed),
        }
      }
    }

    // --- Footer global ---
    content.footer.ctaHeadingLine1 = L(footer?.ctaHeadingLine1, content.footer.ctaHeadingLine1)
    content.footer.ctaHeadingLine2 = L(footer?.ctaHeadingLine2, content.footer.ctaHeadingLine2)
    content.footer.ctaButton = L(footer?.ctaButton, content.footer.ctaButton)
    if (typeof footer?.ctaHref === 'string' && footer.ctaHref.trim()) {
      content.footer.ctaHref = footer.ctaHref.trim()
    }
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
      content.footer.legalLinks = footer.legalLinks.map((n: any, i: number) => {
        const fallback = defaultSiteContent.footer.legalLinks.find(
          (d) => d.id === (n.key || defaultSiteContent.footer.legalLinks[i]?.id),
        ) || defaultSiteContent.footer.legalLinks[i]
        const rawHref = typeof n.href === 'string' ? n.href.trim() : ''
        return {
          id: n.key || fallback?.id || `legal-${i}`,
          // CMS often still has "#" from seed — prefer real default routes.
          href: rawHref && rawHref !== '#' ? rawHref : fallback?.href || '#',
          label: L(n.label, fallback?.label ?? {}),
        }
      })
    }

    // --- Site settings (contacts + cookie + page heroes) ---
    if (settings?.email) content.siteSettings.email = settings.email
    if (settings?.phone) content.siteSettings.phone = settings.phone
    if (settings?.phoneDisplay) content.siteSettings.phoneDisplay = settings.phoneDisplay
    if (settings?.facebook) content.siteSettings.facebook = settings.facebook
    if (settings?.tiktok) content.siteSettings.tiktok = settings.tiktok

    content.siteSettings.pageHeroes = content.siteSettings.pageHeroes ?? {}
    const pageHeroFields: Array<{ key: 'contacts' | 'portfolio' | 'legal' | 'order'; field: string }> = [
      { key: 'contacts', field: 'contactsHeroMedia' },
      { key: 'portfolio', field: 'portfolioHeroMedia' },
      { key: 'legal', field: 'legalHeroMedia' },
      { key: 'order', field: 'orderHeroMedia' },
    ]
    for (const { key, field } of pageHeroFields) {
      const media = await resolveMediaDoc(payload, settings?.[field])
      const url = mediaUrl(media)
      if (url) {
        content.siteSettings.pageHeroes[key] = {
          type: isVideoMedia(media, url) ? 'video' : 'image',
          src: url,
        }
      }
    }

    content.cookieConsent.message = L(settings?.cookieMessage, content.cookieConsent.message)
    content.cookieConsent.accept = L(settings?.cookieAccept, content.cookieConsent.accept)
    content.cookieConsent.decline = L(settings?.cookieDecline, content.cookieConsent.decline)
  } catch (err) {
    console.error('[getSiteContent] Falling back to default content:', err)
    return structuredClone(defaultSiteContent)
  }

  // Keep newly added static keys (e.g. statementLink, privacyLink) even if a
  // cached/partial merge somehow omitted them.
  content.accessibility = {
    ...defaultSiteContent.accessibility,
    ...content.accessibility,
  }
  content.cookieConsent = {
    ...defaultSiteContent.cookieConsent,
    ...content.cookieConsent,
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
export const getCachedSiteContent = unstable_cache(getSiteContent, ['site-content-v8'], {
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
