import { unstable_cache } from 'next/cache'
import { SITE_CONTENT_TAG } from './revalidate'
import {
  legalPages,
  type LegalLocale,
  type LegalPage,
  type LegalPageId,
  type LegalSection,
  type LocalizedParagraphs,
  type LocalizedString,
} from './legalPages'

const GLOBAL_SLUGS: Record<LegalPageId, string> = {
  privacy: 'legal-privacy',
  terms: 'legal-terms',
  accessibility: 'legal-accessibility',
}

const LOCALES: LegalLocale[] = ['en', 'ru', 'he']

/** Split newline-separated text into a non-empty string array. */
function splitLines(v: unknown): string[] {
  if (typeof v !== 'string' || !v.trim()) return []
  return v
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function pickAll(obj: Record<string, unknown> | null | undefined, fallback: LocalizedString): LocalizedString {
  if (!obj) return fallback
  const out: LocalizedString = { ...fallback }
  for (const l of LOCALES) {
    const v = obj[l]
    if (typeof v === 'string' && v.trim()) out[l] = v.trim()
  }
  return out
}

function pickAllLines(
  obj: Record<string, unknown> | null | undefined,
  fallback: LocalizedParagraphs,
): LocalizedParagraphs {
  if (!obj) return fallback
  const out: LocalizedParagraphs = { ...fallback }
  for (const l of LOCALES) {
    const lines = splitLines(obj[l])
    if (lines.length) out[l] = lines
  }
  return out
}

/**
 * Fetch a legal page from Payload CMS and merge over the static default.
 * Returns the static default on any error.
 * Server-only — do not import from client components.
 */
export async function fetchLegalPage(id: LegalPageId): Promise<LegalPage> {
  const fallback = legalPages[id]
  try {
    const { getPayload } = await import('payload')
    const config = (await import('@payload-config')).default
    const payload = await getPayload({ config })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (await (payload as any).findGlobal({
      slug: GLOBAL_SLUGS[id],
      locale: 'all',
      depth: 0,
    })) as any

    if (!raw) return fallback

    const page: LegalPage = {
      ...fallback,
    }

    // Prefer explicit statementDate; fall back to legacy updatedAt text if present.
    const statementDate =
      (typeof raw.statementDate === 'string' && raw.statementDate.trim()) ||
      (typeof raw.updatedAt === 'string' &&
      /^\d{4}-\d{2}-\d{2}/.test(raw.updatedAt.trim()) &&
      raw.updatedAt.trim()) ||
      null
    if (statementDate) {
      page.updatedAt = statementDate
    }

    page.title = pickAll(raw.title, fallback.title)
    page.metaDescription = pickAll(raw.metaDescription, fallback.metaDescription)
    page.intro = pickAll(raw.intro, fallback.intro)
    if (raw.closing) page.closing = pickAll(raw.closing, fallback.closing ?? { en: '', ru: '', he: '' })

    if (Array.isArray(raw.sections) && raw.sections.length) {
      page.sections = raw.sections.map((s: any, i: number) => {
        const fb = fallback.sections[i]
        const section: LegalSection = {
          heading: pickAll(s.heading, fb?.heading ?? { en: '', ru: '', he: '' }),
          paragraphs: pickAllLines(s.paragraphs, fb?.paragraphs ?? { en: [], ru: [], he: [] }),
        }
        // Prefer CMS bullets when present; otherwise keep static defaults (e.g. processor lists).
        if (s.bullets || fb?.bullets) {
          const bullets = pickAllLines(s.bullets, fb?.bullets ?? { en: [], ru: [], he: [] })
          const hasBullets = LOCALES.some((l) => bullets[l].length > 0)
          if (hasBullets) section.bullets = bullets
        }
        return section
      })
    }

    return page
  } catch (err) {
    console.error(`[fetchLegalPage:${id}] falling back to static:`, err)
    return fallback
  }
}

/**
 * Cached variant of {@link fetchLegalPage}.
 * Shares the site-content cache tag so edits in Payload admin
 * automatically invalidate this cache along with all other site content.
 */
export function getCachedLegalPage(id: LegalPageId): Promise<LegalPage> {
  return unstable_cache(() => fetchLegalPage(id), [`legal-page-${id}`], {
    tags: [SITE_CONTENT_TAG],
  })()
}
