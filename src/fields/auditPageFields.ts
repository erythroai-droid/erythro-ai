import type { Field } from 'payload'
import { locText, locTextarea } from './localized'
import { ctaHrefField } from './ctaHref'

/**
 * Field schema for the audit-page global.
 * Tabs are admin-UI only and do not affect DB table naming.
 * Groups (form / how / pricing / tabs) produce column prefixes in the locales table.
 */
export const auditPageFields: Field[] = [
  {
    type: 'tabs',
    tabs: [
      // ── Meta ──────────────────────────────────────────────────────────────
      {
        label: 'Meta',
        fields: [
          locText('title', { required: true, admin: { description: 'Page <title> and H1' } }),
          locTextarea('metaDescription', { admin: { description: 'SEO meta description (~155 chars)' } }),
          {
            name: 'tabs',
            type: 'group',
            label: 'Tab labels',
            admin: { description: 'Labels shown in the audit page tab navigation' },
            fields: [
              locText('audit', { label: 'Audit tab' }),
              locText('how', { label: 'How it works tab' }),
              locText('pricing', { label: 'Pricing tab' }),
            ],
          },
        ],
      },

      // ── Form ──────────────────────────────────────────────────────────────
      {
        label: 'Form',
        fields: [
          {
            name: 'form',
            type: 'group',
            label: 'Audit request form',
            fields: [
              locText('heading'),
              locTextarea('intro'),
              locText('introNote', { admin: { description: 'Short note under the intro (rate-limit hint)' } }),
              locText('requiredNote', { admin: { description: '"Required field" label' } }),
              locText('website', { label: 'Website field label' }),
              locText('websitePlaceholder'),
              locText('websiteInvalid', { admin: { description: 'Validation error for invalid URL' } }),
              locText('auditLanguage', { label: 'Report language field label' }),
              {
                name: 'auditLanguageOptions',
                type: 'group',
                label: 'Language option labels',
                admin: {
                  description:
                    'Labels for each report-language option in every UI locale. E.g. the EN option reads "English" in EN, "Английский" in RU, "אנגלית" in HE.',
                },
                fields: [
                  locText('en', { label: 'English option label' }),
                  locText('ru', { label: 'Russian option label' }),
                  locText('he', { label: 'Hebrew option label' }),
                ],
              },
              locText('submit', { label: 'Submit button label' }),
              locText('success', { label: 'Success message' }),
            ],
          },
        ],
      },

      // ── How it works ──────────────────────────────────────────────────────
      {
        label: 'How it works',
        fields: [
          {
            name: 'how',
            type: 'group',
            label: 'How it works section',
            fields: [
              locText('kicker'),
              locText('heroTitle'),
              locTextarea('heroIntro'),
              {
                name: 'stats',
                type: 'array',
                label: 'Stat pills',
                admin: { initCollapsed: true },
                fields: [locText('label', { required: true })],
              },
              locText('stepsHeading'),
              {
                name: 'steps',
                type: 'array',
                label: 'Steps',
                admin: { initCollapsed: true },
                fields: [
                  locText('label'),
                  locText('title'),
                  locTextarea('body'),
                ],
              },
              locText('methodologyTitle'),
              locText('weightNote', { admin: { description: 'Suffix after the weight value, e.g. "of the score"' } }),
              locTextarea('methodologyIntro'),
              {
                name: 'pillars',
                type: 'array',
                label: 'Score pillars',
                admin: { initCollapsed: true },
                fields: [
                  {
                    name: 'weight',
                    type: 'text',
                    admin: { description: 'Non-localized weight value, e.g. "27%"' },
                  },
                  locText('title'),
                  locTextarea('body'),
                ],
              },
              locText('categoriesTitle'),
              locTextarea('categoriesIntro'),
              {
                name: 'categories',
                type: 'array',
                label: 'Check categories',
                admin: { initCollapsed: true },
                fields: [
                  locText('title'),
                  locTextarea('body'),
                ],
              },
              locText('principlesTitle'),
              {
                name: 'principles',
                type: 'array',
                label: 'Audit principles',
                admin: { initCollapsed: true },
                fields: [
                  locText('title'),
                  locTextarea('body'),
                ],
              },
            ],
          },
        ],
      },

      // ── Pricing ───────────────────────────────────────────────────────────
      {
        label: 'Pricing',
        fields: [
          {
            name: 'pricing',
            type: 'group',
            label: 'Pricing section',
            fields: [
              locText('kicker'),
              locText('title'),
              locTextarea('intro'),
              locText('footnote'),
              locText('agency', { label: 'Agency callout text' }),
              locText('agencyCta', { label: 'Agency CTA label' }),
              {
                name: 'plans',
                type: 'array',
                label: 'Audit plans',
                admin: { initCollapsed: true },
                fields: [
                  {
                    name: 'planId',
                    type: 'text',
                    required: true,
                    admin: { description: 'Stable plan id, e.g. "free", "diagnostic", "pro", "delegate"' },
                  },
                  {
                    name: 'featured',
                    type: 'checkbox',
                    defaultValue: false,
                  },
                  locText('name'),
                  locText('price'),
                  locText('priceCompare', { admin: { description: 'Struck-through comparison price (optional)' } }),
                  locText('priceNote', { admin: { description: 'Short note under price, e.g. "one-time · promo"' } }),
                  locTextarea('description', { admin: { description: 'Short plan description (optional)' } }),
                  {
                    name: 'features',
                    type: 'array',
                    label: 'Feature lines',
                    admin: { initCollapsed: true },
                    fields: [locText('feature', { required: true })],
                  },
                  locText('cta', { label: 'CTA button label' }),
                  ctaHrefField('ctaHref'),
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]
