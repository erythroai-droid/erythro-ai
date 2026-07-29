import type { Field } from 'payload'

/**
 * Shared field schema for the three legal-page globals
 * (legal-privacy, legal-terms, legal-accessibility).
 *
 * All text fields use Payload's built-in localization so the admin panel
 * shows en / ru / he tabs automatically.
 *
 * Paragraphs and bullets are stored as newline-separated text
 * (one paragraph / bullet per line) to avoid deeply-nested array tables.
 * The frontend splits on "\n" and filters empty lines when rendering.
 */
export const legalPageFields: Field[] = [
  {
    name: 'title',
    type: 'text',
    localized: true,
    required: true,
    admin: { description: 'Page heading shown to visitors' },
  },
  {
    name: 'metaDescription',
    type: 'textarea',
    localized: true,
    admin: { description: 'SEO meta description (~155 chars)' },
  },
  {
    name: 'updatedAt',
    type: 'text',
    admin: {
      description:
        'ISO date displayed as "Last updated" (e.g. 2026-07-29). One date shared across all locales.',
    },
  },
  {
    name: 'intro',
    type: 'textarea',
    localized: true,
    admin: { description: 'Introductory paragraph shown before the first section' },
  },
  {
    name: 'sections',
    type: 'array',
    admin: {
      description:
        'Page sections. Each section has a heading, body text (one paragraph per line), and optional bullets (one item per line).',
      initCollapsed: true,
    },
    fields: [
      {
        name: 'heading',
        type: 'text',
        localized: true,
        required: true,
        admin: { description: 'Section heading, e.g. "1. Data controller"' },
      },
      {
        name: 'paragraphs',
        type: 'textarea',
        localized: true,
        admin: {
          description: 'Body paragraphs — one paragraph per line. Empty lines are ignored.',
          rows: 4,
        },
      },
      {
        name: 'bullets',
        type: 'textarea',
        localized: true,
        admin: {
          description: 'Bullet list items — one item per line. Leave empty if no bullets.',
          rows: 4,
        },
      },
    ],
  },
  {
    name: 'closing',
    type: 'text',
    localized: true,
    admin: { description: 'Optional closing line at the bottom (e.g. contact info)' },
  },
]
