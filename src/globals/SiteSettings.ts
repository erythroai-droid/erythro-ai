import type { GlobalConfig } from 'payload'
import { locText, locTextarea } from '../fields/localized'
import { siteEmailSelectField } from '../fields/siteEmailSelect'
import { revalidateGlobal } from '../lib/revalidate'

function firstEmailAddress(data: Record<string, unknown> | undefined): string {
  const emails = data?.emails
  if (!Array.isArray(emails)) return ''
  for (const row of emails) {
    if (!row || typeof row !== 'object') continue
    const address = (row as { address?: unknown }).address
    if (typeof address === 'string' && address.trim()) return address.trim()
  }
  return ''
}

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: { group: 'Settings' },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data || typeof data !== 'object') return data
        const next = data as Record<string, unknown>
        const fallback = firstEmailAddress(next)
        const pick = (key: string) => {
          const value = next[key]
          return typeof value === 'string' && value.trim() ? value.trim() : ''
        }

        // Keep legacy `email` in sync for older readers / seed scripts.
        const displayFooter = pick('displayEmailFooter') || fallback
        if (displayFooter) next.email = displayFooter

        if (!pick('displayEmailFooter') && displayFooter) next.displayEmailFooter = displayFooter
        if (!pick('displayEmailContacts')) next.displayEmailContacts = displayFooter
        if (!pick('displayEmailLegal')) {
          next.displayEmailLegal = pick('displayEmailLegal') || fallback || displayFooter
        }
        if (!pick('notifyEmailContact')) next.notifyEmailContact = displayFooter
        if (!pick('notifyEmailOrder')) next.notifyEmailOrder = displayFooter
        return next
      },
    ],
    afterChange: [revalidateGlobal],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contacts',
          fields: [
            {
              name: 'emails',
              type: 'array',
              labels: { singular: 'Email', plural: 'Emails' },
              admin: {
                description:
                  'Address book for the site. Use the dropdowns below to choose display and form notification targets. Outgoing mail still sends from Hostinger order@erythro.ai.',
              },
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  admin: { description: 'e.g. Orders, Privacy, General' },
                },
                {
                  name: 'address',
                  type: 'email',
                  required: true,
                },
              ],
            },
            {
              name: 'email',
              type: 'text',
              admin: {
                hidden: true,
                description: 'Legacy single email — synced from Display email (footer).',
              },
            },
            {
              type: 'row',
              fields: [
                siteEmailSelectField({
                  name: 'displayEmailFooter',
                  label: 'Display email — Footer',
                  admin: {
                    width: '50%',
                    description: 'Shown in the site footer.',
                  },
                }),
                siteEmailSelectField({
                  name: 'displayEmailContacts',
                  label: 'Display email — Contacts page',
                  admin: {
                    width: '50%',
                    description: 'Shown on /contacts.',
                  },
                }),
              ],
            },
            siteEmailSelectField({
              name: 'displayEmailLegal',
              label: 'Display email — Legal / privacy notice',
              admin: {
                description:
                  'Used on legal pages and in the contact-form privacy notice (replaces the hardcoded address in copy).',
              },
            }),
            {
              type: 'row',
              fields: [
                siteEmailSelectField({
                  name: 'notifyEmailContact',
                  label: 'Form notifications — Contact / feedback',
                  admin: {
                    width: '50%',
                    description: 'Contacts page form and general “Leave a message” modal.',
                  },
                }),
                siteEmailSelectField({
                  name: 'notifyEmailOrder',
                  label: 'Form notifications — Solutions / Order',
                  admin: {
                    width: '50%',
                    description: 'CTAs from Solutions section and /order/[slug].',
                  },
                }),
              ],
            },
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
                description: '/order/[slug] — Recommended: 1920×150 px.',
              },
            },
          ],
        },
      ],
    },
  ],
}
