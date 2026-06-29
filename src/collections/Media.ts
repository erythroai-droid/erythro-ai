import type { CollectionConfig } from 'payload'
import { revalidateOnChange, revalidateOnDelete } from '../lib/revalidate'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  hooks: { afterChange: [revalidateOnChange], afterDelete: [revalidateOnDelete] },
  fields: [
    {
      name: 'preview',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/MediaPreview#MediaPreview',
          Cell: '/components/admin/MediaPreview#MediaPreviewCell',
        },
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // Show image thumbnails in the list view; videos fall back to a file icon
    // there, but the edit view renders a full player via the MediaPreview field.
    adminThumbnail: ({ doc }) =>
      typeof doc?.mimeType === 'string' && doc.mimeType.startsWith('image/')
        ? (doc.url as string)
        : null,
  },
}
