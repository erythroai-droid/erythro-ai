import { getCachedSeoSettings, getCachedSiteContent } from '@/lib/getSiteContent'
import {
  buildFaqPageSchema,
  buildOrganizationSchema,
  buildWebSiteSchema,
} from '@/lib/brandSchema'

const DEFAULT_DESCRIPTION =
  'Erythro.ai is a digital agency building high-performance websites, brand identity, and AI automation — from strategy to launch.'

export default async function StructuredData() {
  const [content, seo] = await Promise.all([getCachedSiteContent(), getCachedSeoSettings()])
  const description = seo.description?.en || DEFAULT_DESCRIPTION

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
