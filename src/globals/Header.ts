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
        locText('description', {
          admin: {
            description:
              'Subtitle under the burger-menu title (e.g. “What we can build for you”). Leave empty to hide.',
          },
        }),
        locText('href', {
          required: true,
          admin: {
            description:
              'Parent link per locale, e.g. #services, #solutions, /contacts, https://audit-ru.erythro.ai. Switch EN/RU/HE in the admin locale bar — each language stores its own Href.',
          },
        }),
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
            locText('href', {
              required: true,
              admin: {
                description:
                  'Per-locale link, e.g. /audit, https://audit-ru.erythro.ai, https://diag-he.erythro.ai. Switch locale in the admin bar to edit EN/RU/HE separately (Audit technical vs commercial).',
              },
            }),
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
