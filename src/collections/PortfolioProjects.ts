import type { CollectionConfig } from 'payload'
import { locText, locTextarea, locRichText } from '../fields/localized'
import { seoFields } from '../fields/seo'
import { revalidateOnChange, revalidateOnDelete } from '../lib/revalidate'

export const PortfolioProjects: CollectionConfig = {
  slug: 'portfolio-projects',
  labels: { singular: 'Portfolio Project', plural: 'Portfolio Projects' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'category', 'relatedService', 'order'],
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
      hooks: {
        beforeValidate: [
          ({ value }) => (typeof value === 'string' ? value.trim() : value),
        ],
      },
      validate: (val: unknown) => {
        if (typeof val !== 'string' || !val.trim()) return 'Slug is required'
        if (val !== val.trim()) return 'Slug must not have leading/trailing spaces'
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(val)) {
          return 'Use lowercase letters, numbers, and hyphens only'
        }
        return true
      },
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
    {
      name: 'solutionPlan',
      type: 'relationship',
      relationTo: 'solution-plans',
      admin: {
        description:
          'Optional pricing package shown as a badge next to the project title (e.g. AI Smart Card / AI-визитка). Links to /order/[slug].',
      },
      filterOptions: {
        kind: { equals: 'solution' },
      },
    },
    {
      name: 'relatedService',
      type: 'relationship',
      relationTo: 'services',
      label: 'Related Service',
      admin: {
        position: 'sidebar',
        description:
          'Bottom-of-page “Related service” link on /portfolio/[slug]. Uses the service title as the link text.',
      },
    },
    locText('relatedAuditHref', {
      label: 'Related Audit Link',
      defaultValue: '/audit',
      admin: {
        position: 'sidebar',
        description:
          'Second CTA under Related Service. Path or https URL per locale. Empty → /audit.',
      },
    }),
    locText('relatedAuditLabel', {
      label: 'Related Audit Label',
      admin: {
        position: 'sidebar',
        description:
          'Optional label for the audit CTA. Empty → default “Free AI audit” / “Бесплатный AI-аудит” / HE.',
      },
    }),
    locTextarea('description', {
      required: true,
      admin: { description: 'Short card description on /portfolio' },
    }),
    locRichText('summary', {
      required: true,
      admin: {
        description: 'Hero summary on the project page (shown only in the hero). Rich text editor.',
      },
    }),
    locRichText('subtitle', {
      admin: {
        description:
          'Optional text under the project title in the body section. Leave empty to hide. Rich text editor.',
      },
    }),
    {
      name: 'performanceScores',
      type: 'group',
      label: 'Performance scores',
      admin: {
        description:
          'Optional Lighthouse-style gauges under the project title (Performance / Accessibility / Best Practices / SEO + Agent browse).',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Show performance scores',
          defaultValue: false,
          admin: {
            description: 'Turn on to enter scores and show the diagrams on the project page.',
          },
        },
        {
          name: 'performance',
          type: 'number',
          label: 'Performance',
          min: 0,
          max: 100,
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
            description: '0–100 (circular gauge)',
          },
        },
        {
          name: 'accessibility',
          type: 'number',
          label: 'Accessibility',
          min: 0,
          max: 100,
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
            description: '0–100',
          },
        },
        {
          name: 'bestPractices',
          type: 'number',
          label: 'Best Practices',
          min: 0,
          max: 100,
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
            description: '0–100',
          },
        },
        {
          name: 'seo',
          type: 'number',
          label: 'SEO',
          min: 0,
          max: 100,
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
            description: '0–100',
          },
        },
        {
          name: 'agentBrowse',
          type: 'text',
          label: 'Agent browse',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
            description: 'e.g. "2/2" (pill badge, not a 0–100 gauge)',
          },
        },
      ],
    },
    {
      name: 'highlights',
      type: 'array',
      labels: { singular: 'Highlight', plural: 'Highlights' },
      admin: {
        initCollapsed: true,
        description:
          'Rows under the project title: small label on the left, text on the right. Separate items with " · ". Leave empty to hide.',
      },
      fields: [
        locText('label', {
          required: true,
          admin: { description: 'e.g. "Tech stack", "CI"' },
        }),
        locTextarea('detail', {
          required: true,
          admin: { description: 'e.g. "Next.js · React · GSAP · TypeScript"' },
        }),
        {
          name: 'metrics',
          type: 'array',
          labels: { singular: 'Metric', plural: 'Metrics' },
          admin: {
            initCollapsed: true,
            description: 'Optional big numbers with captions (e.g. Lighthouse scores).',
          },
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
              admin: { description: 'e.g. "96", "1.0 s", "10 ms"' },
            },
            locText('label', {
              required: true,
              admin: { description: 'Caption under the number' },
            }),
          ],
        },
        locText('metricsNote', {
          admin: { description: 'Small note under the metrics (source, date)' },
        }),
      ],
    },
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
          fields: [
            locRichText('text', {
              required: true,
              admin: {
                description:
                  'Body paragraph (rich text). Upload images or videos from Media — videos render with a player on the site.',
              },
            }),
          ],
        },
        {
          name: 'images',
          type: 'array',
          labels: { singular: 'Media', plural: 'Media' },
          admin: {
            description:
              'Optional gallery under the section paragraphs. Image or video (MP4/WebM). Videos also work when inserted into the rich-text paragraph above.',
          },
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: { description: 'Image or video from Media' },
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
