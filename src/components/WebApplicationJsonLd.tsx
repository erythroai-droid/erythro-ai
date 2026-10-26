import { buildWebApplicationSchema } from '@/lib/brandSchema'

type WebApplicationJsonLdProps = {
  name: string
  description: string
  locale: string
  url: string
  id?: string
}

/** One WebApplication script for the free audit tool on this page. */
export default function WebApplicationJsonLd({
  name,
  description,
  locale,
  url,
  id,
}: WebApplicationJsonLdProps) {
  const schema = buildWebApplicationSchema({ name, description, locale, url, id })
  if (!schema) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', ...schema }),
      }}
    />
  )
}
