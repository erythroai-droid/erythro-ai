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
      type: 'select',
      required: true,
      options: [
        { label: 'AI Agents', value: 'ai' },
        { label: 'CRM Systems', value: 'crm' },
        { label: 'Websites', value: 'websites' },
        { label: 'Landing Pages', value: 'landing' },
        { label: 'Apps', value: 'apps' },
        { label: 'Other', value: 'other' },
      ],
    },
    locText('categoryLabel', { required: true }),
    locTextarea('description', {
      required: true,
      admin: { description: 'Short card description on /portfolio' },
    }),
    locTextarea('summary', {
      required: true,
      admin: { description: 'Hero summary on the project page' },
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
          'Hero image or video for mobile (<1024px). Falls back to desktop hero if empty.',
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
