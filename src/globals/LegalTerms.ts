import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '../lib/revalidate'
import { legalPageFields } from '../fields/legalPageFields'

export const LegalTerms: GlobalConfig = {
  slug: 'legal-terms',
  label: 'Legal — Terms of Use',
  admin: { group: 'Legal Pages' },
  hooks: { afterChange: [revalidateGlobal] },
  fields: legalPageFields,
}
