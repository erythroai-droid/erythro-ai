import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '../lib/revalidate'
import { legalPageFields } from '../fields/legalPageFields'

export const LegalPrivacy: GlobalConfig = {
  slug: 'legal-privacy',
  label: 'Legal — Privacy Policy',
  admin: { group: 'Legal Pages' },
  hooks: { afterChange: [revalidateGlobal] },
  fields: legalPageFields,
}
