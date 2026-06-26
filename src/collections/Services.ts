import type { CollectionConfig } from 'payload'
import { locText } from '../fields/localized'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'number', 'order'],
    group: 'Content',
  },
  fields: [
    locText('title', { required: true }),
    {
      name: 'number',
      type: 'text',
      admin: { description: 'Display number, e.g. "01"' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'features',
      type: 'array',
      labels: { singular: 'Feature', plural: 'Features' },
      fields: [locText('feature', { required: true })],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Sort order (ascending)' },
    },
  ],
}
