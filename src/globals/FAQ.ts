import type { GlobalConfig } from 'payload'
import { locText, locTextarea, locRichText } from '../fields/localized'
import { revalidateGlobal } from '../lib/revalidate'

export const FAQ: GlobalConfig = {
  slug: 'faq-section',
  label: 'FAQ Section',
  admin: {
    group: 'Sections',
    description: 'Home page FAQ: section headings and accordion Q&A (localized en / ru / he).',
  },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    locText('sectionTitle', {
      label: 'Section Title',
      admin: { description: 'Main FAQ heading, e.g. "FAQ"' },
    }),
    locTextarea('sectionSubtitle', {
      label: 'Section Subtitle',
      admin: {
        description: 'Short line under the title',
        rows: 2,
      },
    }),
    {
      name: 'items',
      type: 'array',
      label: 'Questions & Answers',
      labels: { singular: 'FAQ Item', plural: 'FAQ Items' },
      admin: {
        description:
          'Accordion items on the home page. Drag to reorder. Switch locale in the admin bar to edit translations.',
        initCollapsed: false,
      },
      fields: [
        locText('question', {
          required: true,
          label: 'Question',
        }),
        locRichText('answer', {
          required: true,
          label: 'Answer',
          admin: {
            description: 'Answer shown when the accordion item is open (bold, lists, links, etc.)',
          },
        }),
      ],
    },
  ],
}
