import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '../lib/revalidate'
import { legalPageFields } from '../fields/legalPageFields'

export const LegalAccessibility: GlobalConfig = {
  slug: 'legal-accessibility',
  label: 'Legal — Accessibility Statement',
  admin: { group: 'Legal Pages' },
  hooks: { afterChange: [revalidateGlobal] },
  fields: legalPageFields,
}
