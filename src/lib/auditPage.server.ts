/**
 * Server-only fetch layer for the audit-page global.
 * Merges CMS data (Payload `locale: 'all'`) over the static auditPage fallback.
 * Falls back to the static object on any error.
 */
import 'server-only'
import { unstable_cache } from 'next/cache'
import { SITE_CONTENT_TAG } from './revalidate'
import { auditPage, type Localized, type AuditPageContent } from './auditPage'

export type { AuditPageContent }

const LOCALES = ['en', 'ru', 'he'] as const

// ── Low-level helpers ────────────────────────────────────────────────────────

/**
 * Extract a `Localized` object from a CMS `locale: 'all'` response field.
 * Falls back to `fallback` for any locale that is missing or blank.
 */
function pickAll(
  obj: Record<string, unknown> | null | undefined,
  fallback: Localized,
): Localized {
  if (!obj || typeof obj !== 'object') return fallback
  const out: Localized = { ...fallback }
  for (const l of LOCALES) {
    const v = obj[l]
    if (typeof v === 'string' && v.trim()) out[l] = v.trim()
  }
  return out
}

/** pickAll with a blank-string fallback — for optional fields. */
function pickAllOpt(
  obj: Record<string, unknown> | null | undefined,
  fallback: Localized = { en: '', ru: '', he: '' },
): Localized {
  return pickAll(obj, fallback)
}

// ── Section-level mapping helpers ────────────────────────────────────────────

type RawLocalized = Record<string, unknown> | null | undefined

function mapStats(
  raw: unknown[] | undefined,
  fallback: readonly Localized[],
): Localized[] {
  if (!Array.isArray(raw) || raw.length === 0) return [...fallback]
  return raw.map((item: unknown, i) => {
    const r = item as Record<string, unknown>
    const fb = fallback[i] ?? { en: '', ru: '', he: '' }
    return pickAll(r?.label as RawLocalized, fb)
  })
}

function mapSteps(
  raw: unknown[] | undefined,
  fallback: Array<{ label: Localized; title: Localized; body: Localized }>,
) {
  if (!Array.isArray(raw) || raw.length === 0) return [...fallback]
  return raw.map((item: unknown, i) => {
    const r = item as Record<string, unknown>
    const fb = fallback[i] ?? { label: { en: '', ru: '', he: '' }, title: { en: '', ru: '', he: '' }, body: { en: '', ru: '', he: '' } }
    return {
      label: pickAll(r?.label as RawLocalized, fb.label),
      title: pickAll(r?.title as RawLocalized, fb.title),
      body: pickAll(r?.body as RawLocalized, fb.body),
    }
  })
}

function mapPillars(
  raw: unknown[] | undefined,
  fallback: Array<{ weight: string; title: Localized; body: Localized }>,
) {
  if (!Array.isArray(raw) || raw.length === 0) return [...fallback]
  return raw.map((item: unknown, i) => {
    const r = item as Record<string, unknown>
    const fb = fallback[i] ?? { weight: '', title: { en: '', ru: '', he: '' }, body: { en: '', ru: '', he: '' } }
    return {
      weight: (typeof r?.weight === 'string' && r.weight.trim()) ? r.weight.trim() : fb.weight,
      title: pickAll(r?.title as RawLocalized, fb.title),
      body: pickAll(r?.body as RawLocalized, fb.body),
    }
  })
}

function mapTitleBody(
  raw: unknown[] | undefined,
  fallback: Array<{ title: Localized; body: Localized }>,
) {
  if (!Array.isArray(raw) || raw.length === 0) return [...fallback]
  return raw.map((item: unknown, i) => {
    const r = item as Record<string, unknown>
    const fb = fallback[i] ?? { title: { en: '', ru: '', he: '' }, body: { en: '', ru: '', he: '' } }
    return {
      title: pickAll(r?.title as RawLocalized, fb.title),
      body: pickAll(r?.body as RawLocalized, fb.body),
    }
  })
}

function mapFeatures(
  raw: unknown[] | undefined,
  fallback: readonly Localized[],
): Localized[] {
  if (!Array.isArray(raw) || raw.length === 0) return [...fallback]
  return raw.map((item: unknown, i) => {
    const r = item as Record<string, unknown>
    const fb = fallback[i] ?? { en: '', ru: '', he: '' }
    return pickAll(r?.feature as RawLocalized, fb)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPlans(raw: unknown[] | undefined, fallback: any[]): any[] {
  if (!Array.isArray(raw) || raw.length === 0) return [...fallback]

  return raw.map((item: unknown, i) => {
    const r = item as Record<string, unknown>
    const fb = (fallback[i] ?? {}) as Record<string, unknown>

    const planId =
      (typeof r?.planId === 'string' && r.planId.trim()) ||
      (typeof fb?.id === 'string' && fb.id) ||
      ''

    return {
      id: planId,
      badge: fb?.badge ?? null,
      name: pickAllOpt(r?.name as RawLocalized, fb?.name as Localized | undefined),
      price: pickAllOpt(r?.price as RawLocalized, fb?.price as Localized | undefined),
      ...(r?.priceCompare
        ? { priceCompare: pickAllOpt(r.priceCompare as RawLocalized) }
        : fb?.priceCompare
        ? { priceCompare: fb.priceCompare }
        : {}),
      priceNote: pickAllOpt(r?.priceNote as RawLocalized, fb?.priceNote as Localized | undefined),
      ...(r?.description
        ? { description: pickAllOpt(r.description as RawLocalized) }
        : fb?.description
        ? { description: fb.description }
        : {}),
      features: mapFeatures(
        r?.features as unknown[] | undefined,
        (fb?.features ?? []) as Localized[],
      ),
      cta: pickAllOpt(r?.cta as RawLocalized, fb?.cta as Localized | undefined),
      ctaHref:
        (typeof r?.ctaHref === 'string' && r.ctaHref.trim()) ||
        (typeof fb?.ctaHref === 'string' ? (fb.ctaHref as string) : ''),
      featured: typeof r?.featured === 'boolean' ? r.featured : planId === 'diagnostic',
    }
  })
}

// ── Main fetch ───────────────────────────────────────────────────────────────

/**
 * Fetch the audit-page global from Payload CMS and merge over the static fallback.
 * Returns the static fallback on any error.
 * Server-only — do not import from client components.
 *
 * Return type is structurally identical to `auditPage` but mutable (arrays, not tuples)
 * to avoid fighting TypeScript's `as const` literal narrowing.
 */
export async function fetchAuditPage(): Promise<AuditPageContent> {
  const fallback = auditPage
  try {
    const { getPayload } = await import('payload')
    const config = (await import('@payload-config')).default
    const payload = await getPayload({ config })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (await (payload as any).findGlobal({
      slug: 'audit-page',
      locale: 'all',
      depth: 0,
    })) as Record<string, unknown> | null

    if (!raw) return fallback

    const rawForm = raw.form as Record<string, unknown> | null | undefined
    const rawHow = raw.how as Record<string, unknown> | null | undefined
    const rawPricing = raw.pricing as Record<string, unknown> | null | undefined
    const rawTabs = raw.tabs as Record<string, unknown> | null | undefined
    const rawLangOpts = rawForm?.auditLanguageOptions as Record<string, unknown> | null | undefined

    // Cast to any to work around `as const` literal / tuple narrowing on `auditPage`.
    // The runtime structure is a superset of the static shape.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      ...fallback,

      title: pickAll(raw.title as RawLocalized, fallback.title),
      metaDescription: pickAll(raw.metaDescription as RawLocalized, fallback.metaDescription),

      tabs: {
        audit: pickAll(rawTabs?.audit as RawLocalized, fallback.tabs.audit),
        how: pickAll(rawTabs?.how as RawLocalized, fallback.tabs.how),
        pricing: pickAll(rawTabs?.pricing as RawLocalized, fallback.tabs.pricing),
      },

      form: {
        heading: pickAll(rawForm?.heading as RawLocalized, fallback.form.heading),
        intro: pickAll(rawForm?.intro as RawLocalized, fallback.form.intro),
        introNote: pickAll(rawForm?.introNote as RawLocalized, fallback.form.introNote),
        requiredNote: pickAll(rawForm?.requiredNote as RawLocalized, fallback.form.requiredNote),
        website: pickAll(rawForm?.website as RawLocalized, fallback.form.website),
        websitePlaceholder: pickAll(rawForm?.websitePlaceholder as RawLocalized, fallback.form.websitePlaceholder),
        websiteInvalid: pickAll(rawForm?.websiteInvalid as RawLocalized, fallback.form.websiteInvalid),
        auditLanguage: pickAll(rawForm?.auditLanguage as RawLocalized, fallback.form.auditLanguage),
        auditLanguageOptions: {
          en: pickAll(rawLangOpts?.en as RawLocalized, fallback.form.auditLanguageOptions.en as Localized),
          ru: pickAll(rawLangOpts?.ru as RawLocalized, fallback.form.auditLanguageOptions.ru as Localized),
          he: pickAll(rawLangOpts?.he as RawLocalized, fallback.form.auditLanguageOptions.he as Localized),
        },
        submit: pickAll(rawForm?.submit as RawLocalized, fallback.form.submit),
        success: pickAll(rawForm?.success as RawLocalized, fallback.form.success),
      },

      how: {
        kicker: pickAll(rawHow?.kicker as RawLocalized, fallback.how.kicker),
        heroTitle: pickAll(rawHow?.heroTitle as RawLocalized, fallback.how.heroTitle),
        heroIntro: pickAll(rawHow?.heroIntro as RawLocalized, fallback.how.heroIntro),
        stats: mapStats(rawHow?.stats as unknown[] | undefined, fallback.how.stats as Localized[]),
        stepsHeading: pickAll(rawHow?.stepsHeading as RawLocalized, fallback.how.stepsHeading),
        steps: mapSteps(
          rawHow?.steps as unknown[] | undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fallback.how.steps as any,
        ),
        methodologyTitle: pickAll(rawHow?.methodologyTitle as RawLocalized, fallback.how.methodologyTitle),
        weightNote: pickAll(rawHow?.weightNote as RawLocalized, fallback.how.weightNote),
        methodologyIntro: pickAll(rawHow?.methodologyIntro as RawLocalized, fallback.how.methodologyIntro),
        pillars: mapPillars(
          rawHow?.pillars as unknown[] | undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fallback.how.pillars as any,
        ),
        categoriesTitle: pickAll(rawHow?.categoriesTitle as RawLocalized, fallback.how.categoriesTitle),
        categoriesIntro: pickAll(rawHow?.categoriesIntro as RawLocalized, fallback.how.categoriesIntro),
        categories: mapTitleBody(
          rawHow?.categories as unknown[] | undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fallback.how.categories as any,
        ),
        principlesTitle: pickAll(rawHow?.principlesTitle as RawLocalized, fallback.how.principlesTitle),
        principles: mapTitleBody(
          rawHow?.principles as unknown[] | undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fallback.how.principles as any,
        ),
      },

      pricing: {
        kicker: pickAll(rawPricing?.kicker as RawLocalized, fallback.pricing.kicker),
        title: pickAll(rawPricing?.title as RawLocalized, fallback.pricing.title),
        intro: pickAll(rawPricing?.intro as RawLocalized, fallback.pricing.intro),
        footnote: pickAll(rawPricing?.footnote as RawLocalized, fallback.pricing.footnote),
        agency: pickAll(rawPricing?.agency as RawLocalized, fallback.pricing.agency),
        agencyCta: pickAll(rawPricing?.agencyCta as RawLocalized, fallback.pricing.agencyCta),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plans: mapPlans(rawPricing?.plans as unknown[] | undefined, fallback.pricing.plans as any),
      },
    } as AuditPageContent
  } catch (err) {
    console.error('[fetchAuditPage] falling back to static:', err)
    return fallback
  }
}

/**
 * Cached variant of {@link fetchAuditPage}.
 * Shares the site-content cache tag so Payload admin saves invalidate automatically.
 */
export function getCachedAuditPage(): Promise<AuditPageContent> {
  return unstable_cache(() => fetchAuditPage(), ['audit-page'], {
    tags: [SITE_CONTENT_TAG],
  })()
}
