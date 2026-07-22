import type { GlobalConfig } from 'payload'
import { locText, locTextarea } from '../fields/localized'
import { revalidateGlobal } from '../lib/revalidate'

export const FAQ: GlobalConfig = {
  slug: 'faq-section',
  label: 'FAQ Section',
  admin: { group: 'Sections' },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    locText('sectionTitle'),
    locTextarea('sectionSubtitle'),
    {
      name: 'items',
      type: 'array',
      labels: { singular: 'Question', plural: 'Questions' },
      admin: {
        description: 'FAQ accordion items. Drag to reorder.',
      },
      fields: [
        locText('question', { required: true }),
        locTextarea('answer', { required: true }),
      ],
    },
  ],
}
