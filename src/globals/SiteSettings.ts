import type { GlobalConfig } from 'payload'
import { locText, locTextarea } from '../fields/localized'
import { revalidateGlobal } from '../lib/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: { group: 'Settings' },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contacts',
          fields: [
            { name: 'email', type: 'text', admin: { description: 'e.g. erythro.ai@gmail.com' } },
            {
              name: 'phone',
              type: 'text',
              admin: { description: 'Raw phone for tel: link, e.g. +972509312746' },
            },
            { name: 'phoneDisplay', type: 'text', admin: { description: 'Formatted phone shown to users' } },
            { name: 'facebook', type: 'text', admin: { description: 'Facebook URL' } },
            { name: 'tiktok', type: 'text', admin: { description: 'TikTok URL' } },
          ],
        },
        {
          label: 'Cookie Banner',
          fields: [
            locTextarea('cookieMessage'),
            locText('cookieAccept'),
            locText('cookieDecline'),
          ],
        },
        {
          label: 'SEO',
          fields: [
            locText('seoTitle', {
              admin: { description: 'Document / Open Graph title (per locale)' },
            }),
            locTextarea('seoDescription'),
            {
              name: 'ogImage',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Social share image (1200x630 recommended)' },
            },
          ],
        },
        {
          label: 'Page Heroes',
          fields: [
            {
              name: 'contactsHeroMedia',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  '/contacts — Recommended: 1920×150 px. Images keep original quality. Video (MP4/WebM) autoplays muted.',
              },
            },
            {
              name: 'portfolioHeroMedia',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  '/portfolio — Recommended: 1920×150 px. Images keep original quality. Video (MP4/WebM) autoplays muted.',
              },
            },
            {
              name: 'legalHeroMedia',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Legal pages (privacy, terms, accessibility) — Recommended: 1920×150 px.',
              },
            },
            {
              name: 'orderHeroMedia',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  '/order/[slug] — Recommended: 1920×150 px.',
              },
            },
          ],
        },
      ],
    },
  ],
}
