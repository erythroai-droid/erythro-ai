import { getCachedSeoSettings, getCachedShellSiteContent } from '@/lib/getSiteContent'
import {
  DEFAULT_ORGANIZATION_DESCRIPTION,
  buildOrganizationSchema,
  buildWebSiteSchema,
} from '@/lib/brandSchema'

/**
 * Organization + WebSite only. FAQPage is rendered on the page that shows the
 * questions (home, service, audit) so the language matches that page.
 */
export default async function StructuredData() {
  const [content, seo] = await Promise.all([getCachedShellSiteContent(), getCachedSeoSettings()])
  const description = seo.description?.en || DEFAULT_ORGANIZATION_DESCRIPTION

  const graph = [
    buildOrganizationSchema(content, description),
    buildWebSiteSchema(description),
  ].filter(Boolean)

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) }}
    />
  )
}
