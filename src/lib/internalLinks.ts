import type { PortfolioProject } from '@/lib/portfolioProjects'

/**
 * Legacy static slug → live CMS slug. Sitemap must not keep both.
 * Home service cards resolve id `3` through {@link SERVICE_ID_TO_SLUG}.
 */
export const SERVICE_SLUG_ALIASES: Record<string, string> = {
  management: 'enterprise-engineering',
}

/** Related portfolio cases per service (filtered to published slugs at render time). */
export const SERVICE_RELATED_CASE_SLUGS: Record<string, readonly string[]> = {
  'ai-automation': ['ai-consultant', 'ai-audit-agent', 'ember', 'ora-60a'],
  'enterprise-engineering': ['ora-60a', 'mustang-6663rt', 'ember'],
  management: ['ora-60a', 'mustang-6663rt', 'ember'],
  development: ['ora-60a', 'rosso-garage', 'ember', 'la-scala'],
  'design-branding': ['rosso-garage', 'ember', 'la-scala', 'origin-coffee'],
}

/**
 * Fallback related service for a portfolio case when CMS `relatedService` is empty.
 * Prefer editing the relation on Portfolio Projects in admin after migrate seed.
 */
export const PORTFOLIO_RELATED_SERVICE_SLUG: Record<string, string> = {
  'ai-consultant': 'ai-automation',
  'ai-audit-agent': 'ai-automation',
  ember: 'development',
  'ora-60a': 'development',
  'rosso-garage': 'design-branding',
  'la-scala': 'design-branding',
  'mustang-6663rt': 'development',
  'origin-coffee': 'design-branding',
  'psb-consulting': 'enterprise-engineering',
}

export function canonicalServiceSlug(slug: string): string {
  return SERVICE_SLUG_ALIASES[slug] || slug
}

export function relatedCasesForService(
  serviceSlug: string,
  projects: PortfolioProject[],
  limit = 4,
): PortfolioProject[] {
  const wanted = SERVICE_RELATED_CASE_SLUGS[canonicalServiceSlug(serviceSlug)] || []
  const bySlug = new Map(projects.map((p) => [p.slug, p]))
  const out: PortfolioProject[] = []
  for (const slug of wanted) {
    const hit = bySlug.get(slug)
    if (hit) out.push(hit)
    if (out.length >= limit) break
  }
  return out
}

export function relatedServiceSlugForProject(projectSlug: string): string | null {
  return PORTFOLIO_RELATED_SERVICE_SLUG[projectSlug] || null
}
