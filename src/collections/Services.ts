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
          'Card image/video. Recommended: 1600×1000 px (16:10), minimum 1200 px wide. Images are stored in original quality without upload compression. MP4/WebM videos autoplay muted.',
      },
    },
    {
      name: 'heroMedia',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Wide header image/video for /services/[slug]. Recommended: 1920×600 px (16:5), minimum 1600×500 px. Images are stored in original quality without upload compression. Falls back to the card media.',
      },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'USD',
      options: [
        { label: '$ USD', value: 'USD' },
        { label: '₪ ILS', value: 'ILS' },
        { label: '€ EUR', value: 'EUR' },
      ],
      admin: { description: 'Currency used for all packages and prices on this service page' },
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
