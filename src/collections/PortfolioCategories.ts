import type { CollectionConfig } from 'payload'
import { locText } from '../fields/localized'
import { revalidateOnChange, revalidateOnDelete } from '../lib/revalidate'

export const PortfolioCategories: CollectionConfig = {
  slug: 'portfolio-categories',
  labels: { singular: 'Portfolio Category', plural: 'Portfolio Categories' },
  admin: {
    // Non-localized title — localized `label` breaks admin list/nav titles
    useAsTitle: 'value',
    defaultColumns: ['value', 'order', 'showInFilters', 'updatedAt'],
    group: 'Pages',
    description:
      'Categories for portfolio projects and the filter chips on /portfolio. Edit labels, add/remove items, and reorder here.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: { afterChange: [revalidateOnChange], afterDelete: [revalidateOnDelete] },
  fields: [
    locText('label', {
      required: true,
      admin: { description: 'Shown on filters and project cards (localized)' },
    }),
    {
      name: 'value',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description:
          'Stable id used for filtering (e.g. "ai", "crm"). Prefer lowercase, no spaces. Changing this breaks existing project links until you re-save them.',
      },
      validate: (val: unknown) => {
        if (typeof val !== 'string' || !val.trim()) return 'Value is required'
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val)) {
          return 'Use lowercase letters, numbers, and hyphens only (e.g. ai-agents)'
        }
        return true
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Sort order for filter chips (ascending)' },
    },
    {
      name: 'showInFilters',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Show this category in the /portfolio filter row' },
    },
  ],
}
