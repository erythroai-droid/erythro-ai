import type { CollectionConfig } from 'payload'
import { locText } from '../fields/localized'
import { revalidateOnChange, revalidateOnDelete } from '../lib/revalidate'

export const SolutionPlans: CollectionConfig = {
  slug: 'solution-plans',
  labels: { singular: 'Solution Plan', plural: 'Solution Plans' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'price', 'featured', 'order'],
    group: 'Content',
  },
  hooks: { afterChange: [revalidateOnChange], afterDelete: [revalidateOnDelete] },
  fields: [
    locText('title', { required: true }),
    {
      name: 'price',
      type: 'text',
      required: true,
      admin: { description: 'Main price value, e.g. "14 999" or "0"' },
    },
    locText('pricePrefix', { admin: { description: 'Optional prefix, e.g. "from" / "от"' } }),
    {
      name: 'originalPrice',
      type: 'text',
      admin: { description: 'Optional old/struck-through price' },
    },
    {
      name: 'priceNote',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Show installment note marker (*)' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Highlight this plan as recommended' },
    },
    {
      name: 'features',
      type: 'array',
      labels: { singular: 'Feature', plural: 'Features' },
      admin: {
        description:
          'Fill "label" + "value" for a two-column row, OR "full" for a single full-width row.',
      },
      fields: [
        locText('label'),
        locText('value'),
        locText('full'),
      ],
    },
    locText('disclaimer'),
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Sort order (ascending)' },
    },
  ],
}
