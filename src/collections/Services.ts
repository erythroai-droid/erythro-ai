import type { CollectionConfig } from 'payload'
import { locText } from '../fields/localized'
import { revalidateOnChange, revalidateOnDelete } from '../lib/revalidate'

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'number', 'order'],
    group: 'Content',
  },
  hooks: { afterChange: [revalidateOnChange], afterDelete: [revalidateOnDelete] },
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
      admin: {
        description:
          'Image OR video shown on the card. If you upload a video (mp4/webm), it autoplays muted in a loop instead of an image.',
      },
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
