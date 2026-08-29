import { getCachedSeoSettings, getCachedSiteContent } from '@/lib/getSiteContent'
import {
  DEFAULT_ORGANIZATION_DESCRIPTION,
  buildFaqPageSchema,
  buildOrganizationSchema,
  buildWebSiteSchema,
} from '@/lib/brandSchema'

export default async function StructuredData() {
  const [content, seo] = await Promise.all([getCachedSiteContent(), getCachedSeoSettings()])
  const description = seo.description?.en || DEFAULT_ORGANIZATION_DESCRIPTION

  const graph = [
    buildOrganizationSchema(content, description),
    buildWebSiteSchema(description),
    buildFaqPageSchema(content.faq.items),
  ].filter(Boolean)

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) }}
    />
  )
}

