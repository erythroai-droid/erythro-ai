/**
 * Site pages the consultant may mention. The model never writes the URL:
 * `hand_off` resolves a slug that already appears in the knowledge base, and
 * the widget prints that path as a link. The chat stays open.
 */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type ConsultPageTarget = 'audit' | 'order' | 'service'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** True when this exact slug is a plan (`- slug:`) or an order URL in the KB. */
function knowledgeHasOrderSlug(markdown: string, slug: string): boolean {
  const escaped = escapeRegExp(slug)
  return new RegExp(`(?:/order/${escaped}|- slug:\\s*${escaped})(?![a-z0-9-])`, 'i').test(markdown)
}

/** True when this exact slug is a service line (`(slug:)`) or a service URL in the KB. */
function knowledgeHasServiceSlug(markdown: string, slug: string): boolean {
  const escaped = escapeRegExp(slug)
  return new RegExp(`(?:/services/${escaped}|\\(slug:\\s*${escaped}\\))(?![a-z0-9-])`, 'i').test(
    markdown,
  )
}

/**
 * Relative path for a hand-off, or null when the slug is not in the knowledge
 * base. An audit SKU is an order page; `audit` with no slug is the landing.
 */
export function resolveConsultPageHref(
  target: ConsultPageTarget,
  slug: string,
  knowledgeMarkdown: string,
): string | null {
  const clean = slug.trim().toLowerCase()
  if (target === 'audit' && !clean) return '/audit'
  if (!SLUG_RE.test(clean)) return target === 'audit' ? '/audit' : null
  if (target === 'service') {
    return knowledgeHasServiceSlug(knowledgeMarkdown, clean) ? `/services/${clean}` : null
  }
  if (!knowledgeHasOrderSlug(knowledgeMarkdown, clean)) {
    return target === 'audit' ? '/audit' : null
  }
  return `/order/${clean}`
}

const PAGE_HREF_RE =
  /^\/(?:audit|order\/[a-z0-9]+(?:-[a-z0-9]+)*|services\/[a-z0-9]+(?:-[a-z0-9]+)*)$/

/** Client gate: only the paths `resolveConsultPageHref` can produce. */
export function safeConsultPageHref(href: string): string | null {
  const clean = href.trim()
  return PAGE_HREF_RE.test(clean) ? clean : null
}

/** Link text. A path or URL from the model is dropped in favour of `fallback`. */
export function consultLinkLabel(raw: string | undefined, fallback: string): string {
  const clean = (raw ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 80)
  if (clean.length < 2 || clean.startsWith('/') || /^https?:/i.test(clean)) return fallback
  return clean
}
