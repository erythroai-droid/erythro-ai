import type { GlobalConfig } from 'payload'
import { locText } from '../fields/localized'
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
    locText('ctaLabel', { admin: { description: 'Primary call-to-action label' } }),
  ],
}
