import type { CollectionConfig } from 'payload'
import { locText, locTextarea } from '../fields/localized'
import { seoFields } from '../fields/seo'
import { revalidateOnChange, revalidateOnDelete } from '../lib/revalidate'

export const PortfolioProjects: CollectionConfig = {
  slug: 'portfolio-projects',
  labels: { singular: 'Portfolio Project', plural: 'Portfolio Projects' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'category', 'order'],
    group: 'Pages',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: { afterChange: [revalidateOnChange], afterDelete: [revalidateOnDelete] },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'URL segment, e.g. "ai-lead-qualifier" → /portfolio/ai-lead-qualifier' },
    },
    locText('title', { required: true }),
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'portfolio-categories',
      required: true,
      admin: {
        description:
          'Pick from Portfolio Categories (Pages → Portfolio Categories). Edit that list to add/remove options.',
      },
    },
    locText('categoryLabel', {
      admin: {
        description:
          'Optional override for the label on cards/hero. Leave empty to use the category’s localized label.',
      },
    }),
    locTextarea('description', {
      required: true,
      admin: { description: 'Short card description on /portfolio' },
    }),
    locTextarea('summary', {
      required: true,
      admin: { description: 'Hero summary on the project page (shown only in the hero)' },
    }),
    locTextarea('subtitle', {
      admin: {
        description:
          'Optional text under the project title in the body section. Leave empty to hide.',
      },
    }),
    {
      name: 'date',
      type: 'text',
      admin: { description: 'e.g. "2025" or "2024 — 2025"' },
    },
    {
      name: 'client',
      type: 'text',
    },
    {
      name: 'link',
      type: 'text',
      admin: { description: 'Optional external project URL' },
    },
    {
      name: 'stack',
      type: 'array',
      labels: { singular: 'Stack item', plural: 'Stack' },
      fields: [{ name: 'item', type: 'text', required: true }],
    },
    {
      name: 'tags',
      type: 'array',
      labels: { singular: 'Tag', plural: 'Tags' },
      fields: [{ name: 'tag', type: 'text', required: true }],
    },
    {
      name: 'cardImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Thumbnail on the portfolio grid' },
    },
    {
      name: 'heroMedia',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Full-bleed hero image or video (desktop)' },
    },
    {
      name: 'heroMediaMobile',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Hero image or video for mobile (<1024px). Prefer 1080×1920 (9:16). Falls back to desktop hero if empty.',
      },
    },
    {
      name: 'body',
      type: 'array',
      labels: { singular: 'Section', plural: 'Body sections' },
      fields: [
        locText('heading'),
        {
          name: 'paragraphs',
          type: 'array',
          fields: [locTextarea('text', { required: true })],
        },
        {
          name: 'images',
          type: 'array',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
          ],
        },
      ],
    },
    ...seoFields(),
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Sort order (ascending)' },
    },
  ],
}
