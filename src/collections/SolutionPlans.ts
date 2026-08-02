import type { CollectionConfig } from 'payload'
import { locText, locTextarea, locRichText } from '../fields/localized'
import { ctaHrefField } from '../fields/ctaHref'
import { seoFields } from '../fields/seo'
import { revalidateOnChange, revalidateOnDelete } from '../lib/revalidate'

export const SolutionPlans: CollectionConfig = {
  slug: 'solution-plans',
  labels: { singular: 'Solution Plan', plural: 'Solution Plans' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'price', 'featured', 'order'],
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
          'Stable id / order URL, e.g. "business-automation" → /order/business-automation',
      },
    },
    {
      name: 'price',
      type: 'text',
      required: true,
      admin: { description: 'Main price value, e.g. "14 999" or "0"' },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'ILS',
      options: [
        { label: '₪ ILS', value: 'ILS' },
        { label: '$ USD', value: 'USD' },
        { label: '€ EUR', value: 'EUR' },
      ],
      admin: { description: 'Currency shown next to the price on the site and order page' },
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
          'Label + Value show on public cards and the order page. Full is an optional description under Value on the order page only.',
      },
      fields: [
        locText('label'),
        locText('value'),
        locRichText('full', {
          label: 'Full (description)',
          admin: {
            description: 'Shown under Value on the order page only. Leave empty to hide.',
          },
        }),
      ],
    },
    locText('disclaimer'),
    ctaHrefField('ctaHref', {
      admin: {
        description:
          'Plan button link. Leave empty for /order/{slug}. Or set #contact-modal / any URL.',
      },
    }),
    locText('subtitle', {
      admin: { description: 'Subtitle on the order page under the plan title' },
    }),
    locText('promo', {
      admin: { description: 'Green promo callout on the order page' },
    }),
    locRichText('includes', {
      label: "What's included",
      admin: {
        description:
          'Detailed “what’s included in development” block on the order page (rich text). Shown last in the plan card.',
      },
    }),
    locTextarea('paymentNote', {
      admin: {
        description: 'Text under the payment method selector on the order page',
      },
    }),
    locText('taxNote', {
      admin: {
        description:
          'Tax rate under Taxes, e.g. "17%". Parsed as percent and added to the order total.',
      },
    }),
    locText('taxValue', {
      admin: {
        description:
          'Optional. Fixed tax amount (number) if taxNote has no %, or a label when tax is not calculated.',
      },
    }),
    {
      name: 'periods',
      type: 'array',
      labels: { singular: 'Period', plural: 'Payment periods' },
      admin: {
        description:
          'Optional. If empty, defaults (pay in full / 12 payments when priceNote) are used.',
      },
      fields: [
        {
          name: 'periodId',
          type: 'text',
          required: true,
          admin: { description: 'e.g. "full" or "12"' },
        },
        locText('label', { required: true }),
        {
          name: 'months',
          type: 'number',
          defaultValue: 1,
          admin: { description: '1 = one-time; 12 = split into months for display' },
        },
        {
          name: 'discountPercent',
          type: 'number',
          defaultValue: 0,
        },
      ],
    },
    {
      name: 'addons',
      type: 'array',
      labels: { singular: 'Add-on', plural: 'Order add-ons' },
      fields: [
        {
          name: 'addonId',
          type: 'text',
          required: true,
          admin: { description: 'Stable id, e.g. "priority-support"' },
        },
        locText('name', { required: true }),
        locText('description'),
        {
          name: 'price',
          type: 'number',
          required: true,
          admin: { description: 'Monthly price in the plan currency' },
        },
        {
          name: 'discountMonths1',
          type: 'number',
          defaultValue: 0,
          admin: { description: 'Discount % for 1-month term (0 = no discount)' },
        },
        {
          name: 'discountMonths6',
          type: 'number',
          defaultValue: 0,
          admin: { description: 'Discount % for 6-month term (0 = no discount)' },
        },
        {
          name: 'discountMonths12',
          type: 'number',
          defaultValue: 0,
          admin: { description: 'Discount % for 12-month term (0 = no discount)' },
        },
        {
          name: 'recommended',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'mandatory',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Always include this add-on in the order. Customers cannot deselect it.',
          },
        },
        locText('note'),
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
