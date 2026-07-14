import type { CollectionConfig } from 'payload'
import { locText, locTextarea } from '../fields/localized'
import { revalidateOnChange, revalidateOnDelete } from '../lib/revalidate'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'number', 'order'],
    group: 'Content',
  },
  hooks: { afterChange: [revalidateOnChange], afterDelete: [revalidateOnDelete] },
  fields: [
    locText('title', { required: true }),
    {
      name: 'slug',
      type: 'text',
      unique: true,
      admin: {
        description:
          'URL for the service page, e.g. "design-branding" → /services/design-branding. Also used by the home card “more” link.',
      },
    },
    {
      name: 'number',
      type: 'text',
      admin: { description: 'Display number, e.g. "01"' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Image OR video shown on the card. If you upload a video (mp4/webm), it autoplays muted in a loop instead of an image.',
      },
    },
    {
      name: 'heroMedia',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional hero for /services/[slug]. Falls back to the card image.',
      },
    },
    {
      name: 'features',
      type: 'array',
      labels: { singular: 'Feature', plural: 'Features' },
      fields: [locText('feature', { required: true })],
    },
    locTextarea('summary', {
      admin: { description: 'Short intro on the service detail page' },
    }),
    {
      name: 'description',
      type: 'array',
      labels: { singular: 'Paragraph', plural: 'Description' },
      fields: [locTextarea('text', { required: true })],
      admin: { description: 'Detailed paragraphs on the service page' },
    },
    {
      name: 'offerings',
      type: 'array',
      labels: { singular: 'Offering', plural: 'Packages & pricing' },
      fields: [
        locText('name', { required: true }),
        locTextarea('description'),
        {
          name: 'price',
          type: 'text',
          required: true,
          admin: { description: 'e.g. "2 500"' },
        },
        locText('pricePrefix', { admin: { description: 'e.g. "from" / "от"' } }),
      ],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Sort order (ascending)' },
    },
  ],
}
