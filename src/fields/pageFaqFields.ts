import type { Field } from 'payload'
import { locText, locTextarea } from './localized'

/** Localized FAQ accordion stored on a service or the audit page. */
export const pageFaqGroup = (description: string): Field => ({
  name: 'faq',
  type: 'group',
  label: 'FAQ',
  admin: { description },
  fields: [
    locText('title', {
      label: 'Section title',
      admin: { description: 'Heading above the accordion, e.g. "Questions and answers"' },
    }),
    {
      name: 'items',
      type: 'array',
      label: 'Questions & Answers',
      labels: { singular: 'FAQ item', plural: 'FAQ items' },
      admin: {
        description:
          'Accordion on the public page. Drag to reorder. Switch locale in the admin bar to edit translations.',
        initCollapsed: false,
      },
      fields: [
        locText('question', { required: true, label: 'Question' }),
        locTextarea('answer', {
          required: true,
          label: 'Answer',
          admin: { description: 'Direct answer, 1–2 sentences.', rows: 4 },
        }),
        locTextarea('details', {
          label: 'Details',
          admin: { description: 'Optional bullets, one per line.', rows: 4 },
        }),
      ],
    },
  ],
})
