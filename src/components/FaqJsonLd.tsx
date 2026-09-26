import { buildFaqPageSchema, type FaqSchemaItem } from '@/lib/brandSchema'

type FaqJsonLdProps = {
  items: FaqSchemaItem[]
  locale: string
  id: string
}

/** One FAQPage script for the questions visible on this page, in the active language. */
export default function FaqJsonLd({ items, locale, id }: FaqJsonLdProps) {
  const schema = buildFaqPageSchema(items, locale, id)
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
