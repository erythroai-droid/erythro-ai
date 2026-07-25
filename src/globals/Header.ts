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
      fields: [
        locText('label', { required: true }),
        { name: 'href', type: 'text', required: true, admin: { description: 'e.g. #services' } },
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
