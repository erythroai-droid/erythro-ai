import type { GlobalConfig } from 'payload'
import { locText, locTextarea } from '../fields/localized'
import { ctaHrefField } from '../fields/ctaHref'
import { revalidateGlobal } from '../lib/revalidate'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: { group: 'Sections' },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    locText('ctaHeadingLine1'),
    locText('ctaHeadingLine2'),
    locText('ctaButton'),
    ctaHrefField('ctaHref', {
      defaultValue: '#contact-modal',
      admin: {
        description: 'Footer CTA button link. Default #contact-modal opens the contact form.',
      },
    }),
    locText('companyTitle'),
    {
      name: 'companyLinks',
      type: 'array',
      labels: { singular: 'Company Link', plural: 'Company Links' },
      fields: [
        locText('label', { required: true }),
        { name: 'href', type: 'text', required: true },
      ],
    },
    locText('contactTitle'),
    locText('emailLabel'),
    locText('phoneLabel'),
    locText('locationLabel'),
    locText('locationValue'),
    locText('copyright'),
    locTextarea('purchaseTermsNotice', {
      admin: {
        description:
          'Purchase terms on the homepage footer and the order form: delivery, liability, age 18+, cancellation, privacy. Grow checks this text.',
        rows: 6,
      },
    }),
    {
      name: 'legalLinks',
      type: 'array',
      labels: { singular: 'Legal Link', plural: 'Legal Links' },
      fields: [
        { name: 'key', type: 'text', admin: { description: 'Stable id, e.g. privacy' } },
        locText('label', { required: true }),
        { name: 'href', type: 'text', required: true },
      ],
    },
  ],
}
