import type { CollectionConfig } from 'payload'
import { locText, locTextarea, locRichText } from '../fields/localized'
import { pageFaqGroup } from '../fields/pageFaqFields'
import { seoFields } from '../fields/seo'
import { revalidateBlogOnChange, revalidateBlogOnDelete } from '../lib/revalidate'

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  labels: { singular: 'Blog Post', plural: 'Blog Posts' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'publishedAt'],
    group: 'Content',
    description:
      'SEO/GEO articles. Only status=published appear on /blog and in sitemap. Drafts stay private.',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: { afterChange: [revalidateBlogOnChange], afterDelete: [revalidateBlogOnDelete] },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'URL segment → /blog/your-slug' },
      hooks: {
        beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim() : value)],
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
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        description: 'Published posts are indexed (sitemap, llms, markdown). Drafts are not.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Public date for Article schema and sorting. Set when publishing.',
      },
    },
    locText('title', { required: true }),
    locTextarea('excerpt', {
      required: true,
      admin: {
        description:
          '1–2 sentence thesis for cards, meta fallback, and AI snippets. Lead with the answer.',
        rows: 3,
      },
    }),
    locRichText('body', {
      required: true,
      admin: {
        description:
          'Full article. Use H2 for direct answers (GEO). Link to /audit, /services/*, /about where relevant.',
      },
    }),
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Card + Open Graph image. Prefer 1200×630.',
      },
    },
    {
      name: 'tags',
      type: 'array',
      labels: { singular: 'Tag', plural: 'Tags' },
      admin: {
        description:
          'Topic keywords for Article.keywords and internal filters (e.g. GEO, CRO, Next.js).',
        initCollapsed: true,
      },
      fields: [{ name: 'tag', type: 'text', required: true }],
    },
    {
      name: 'relatedLinks',
      type: 'array',
      labels: { singular: 'Related link', plural: 'Related links' },
      admin: {
        description:
          'Internal links for entity graph / crawl paths (e.g. /audit, /services/ai-automation). Shown under the post.',
        initCollapsed: true,
      },
      fields: [
        // Not required. Payload validates every existing row when any field of
        // that locale is updated. An empty translation must not reject a PATCH
        // that does not mention links (PIT-171). The site falls back to English,
        // then the URL.
        locText('label', {
          admin: {
            description:
              'Link text for this locale. Empty is allowed; the public page uses English, then the URL.',
          },
        }),
        {
          name: 'href',
          type: 'text',
          required: true,
          admin: { description: 'Path or absolute URL, e.g. /audit' },
        },
      ],
    },
    pageFaqGroup(
      'Optional FAQ under the post. Each answer should stand alone for FAQPage JSON-LD and AI citation.',
    ),
    ...seoFields(),
  ],
}
