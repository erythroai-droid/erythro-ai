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
            { name: 'seoTitle', type: 'text' },
            locTextarea('seoDescription'),
            {
              name: 'ogImage',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Social share image (1200x630 recommended)' },
            },
          ],
        },
      ],
    },
  ],
}
