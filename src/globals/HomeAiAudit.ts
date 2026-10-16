import type { GlobalConfig } from 'payload'
import { locText, locTextarea } from '../fields/localized'
import { ctaHrefField } from '../fields/ctaHref'
import { revalidateGlobal } from '../lib/revalidate'

export const HomeAiAudit: GlobalConfig = {
  slug: 'home-ai-audit',
  label: 'Home AI Audit',
  admin: {
    group: 'Sections',
    description:
      'Homepage lead-magnet under Hero: headline, body, CTA, Lab protocol carousel slides, pricing strip labels.',
  },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'row',
      fields: [
        locText('sectionTitle', {
          label: 'Section title',
          admin: { width: '50%', description: 'e.g. AI AUDIT' },
        }),
        locText('sectionSubtitle', {
          label: 'Section subtitle',
          admin: { width: '50%', description: 'e.g. commercial QA audit' },
        }),
      ],
    },
    {
      type: 'row',
      fields: [
        locText('headlineMuted', {
          label: 'Headline (muted)',
          admin: { width: '50%', description: 'e.g. Your site looks great.' },
        }),
        locText('headlineEmph', {
          label: 'Headline (emphasis)',
          admin: { width: '50%', description: 'e.g. AI вас видит?' },
        }),
      ],
    },
    locTextarea('body', {
      label: 'Body',
      admin: { rows: 4 },
    }),
    locText('bodyAccent', {
      label: 'Body accent phrase',
      admin: {
        description: 'Substring of Body highlighted in gold (must match exactly).',
      },
    }),
    {
      type: 'row',
      fields: [
        locText('ctaLabel', {
          label: 'CTA label',
          admin: { width: '50%' },
        }),
        ctaHrefField('ctaHref', {
          defaultValue: '/audit',
          admin: {
            width: '50%',
            description: 'Primary CTA target. Default /audit.',
          },
        }),
      ],
    },
    locText('ctaMicro', {
      label: 'CTA microcopy',
      admin: { description: 'Line under the button, e.g. Free · no card · 1 domain / 7 days' },
    }),
    locText('proofLabel', {
      label: 'Lab protocol label',
      admin: { description: 'Card eyebrow, e.g. Lab protocol' },
    }),
    {
      name: 'proofSlides',
      type: 'array',
      label: 'Lab protocol slides',
      labels: { singular: 'Slide', plural: 'Slides' },
      admin: {
        description: 'Carousel lead-magnet slides. Drag to reorder. Digits animate on change.',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'value',
          type: 'number',
          required: true,
          label: 'Number',
          admin: { description: 'Animated count-up target (e.g. 50, 0, 5).' },
        },
        locText('suffix', {
          label: 'Suffix',
          admin: { description: 'Optional, e.g. %. Leave empty for bare digits.' },
        }),
        locText('support', {
          label: 'Support line',
          admin: { description: 'Grey line under the number.' },
        }),
        locText('impact', {
          label: 'Impact line',
          admin: { description: 'Bold white punchline.' },
        }),
        locText('ask', {
          label: 'Ask line',
          admin: { description: 'Question with red bullet, e.g. Do you know why?' },
        }),
      ],
    },
    {
      type: 'row',
      fields: [
        locText('pricingKicker', {
          label: 'Pricing kicker',
          admin: { width: '50%' },
        }),
        locText('pricingAll', {
          label: 'Compare-all link label',
          admin: { width: '50%' },
        }),
      ],
    },
  ],
}
