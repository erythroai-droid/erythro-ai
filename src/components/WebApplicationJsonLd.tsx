import { buildWebApplicationSchema } from '@/lib/brandSchema'

type WebApplicationJsonLdProps = {
  name: string
  description: string
  locale: string
  url: string
  id?: string
  featureList?: string[]
}

/** One WebApplication script for a free interactive audit / calculator tool. */
export default function WebApplicationJsonLd({
  name,
  description,
  locale,
  url,
  id,
  featureList,
}: WebApplicationJsonLdProps) {
  const schema = buildWebApplicationSchema({
    name,
    description,
    locale,
    url,
    id,
    featureList,
  })
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
