import type { GlobalConfig } from 'payload'
import { locText } from '../fields/localized'
import { ctaHrefField } from '../fields/ctaHref'
import { revalidateGlobal } from '../lib/revalidate'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Header / Navbar',
  admin: { group: 'Sections' },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      labels: { singular: 'Nav Item', plural: 'Nav Items' },
      admin: {
        description:
          'Top-level menu entries. Add Submenu Items under any row (Services, Solutions, etc.) to show a dropdown in the burger menu.',
      },
      fields: [
        locText('label', { required: true }),
        {
          name: 'href',
          type: 'text',
          required: true,
          admin: {
            description:
              'Parent link target, e.g. #services, #solutions, /contacts. Clicking the parent still scrolls/navigates here when there is no submenu handler.',
          },
        },
        {
          name: 'children',
          type: 'array',
          labels: { singular: 'Submenu Item', plural: 'Submenu Items' },
          admin: {
            description:
              'Optional nested links shown under this item in the burger menu. Leave empty to hide the accordion (except Services/Solutions fallbacks from CMS collections).',
            initCollapsed: true,
          },
          fields: [
            locText('label', { required: true }),
            {
              name: 'href',
              type: 'text',
              required: true,
              admin: {
                description: 'e.g. /services/design, /order/business-automation, #cases',
              },
            },
          ],
        },
      ],
    },
    locText('ctaLabel', { admin: { description: 'Primary call-to-action label (Let’s Talk, etc.)' } }),
    ctaHrefField('ctaHref', {
      defaultValue: '#contact-modal',
      admin: {
        description:
          'Link for the Let’s Talk / primary CTA buttons. Default #contact-modal opens the contact form.',
      },
    }),
  ],
}
