import type { Field } from 'payload'
import { locText, locTextarea } from './localized'

/** Shared SEO fields for internal CMS pages (Services, Portfolio, Solution Plans). */
export const seoFields = (): Field[] => [
  {
    name: 'seo',
    type: 'group',
    label: 'SEO',
    admin: {
      description:
        'Optional. If empty, the page title and intro text are used for search engines and social previews.',
    },
    fields: [
      locText('title', {
        admin: {
          description: 'Meta title. Example: "Design & Branding | Erythro.ai"',
        },
      }),
      locTextarea('description', {
        admin: {
          description: 'Meta description (recommended up to ~160 characters).',
        },
      }),
    ],
  },
]
