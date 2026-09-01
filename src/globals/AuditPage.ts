import type { GlobalConfig } from 'payload'
import { revalidateGlobal } from '../lib/revalidate'
import { auditPageFields } from '../fields/auditPageFields'

export const AuditPage: GlobalConfig = {
  slug: 'audit-page',
  label: 'Audit Page',
  admin: { group: 'Pages' },
  hooks: { afterChange: [revalidateGlobal] },
  fields: auditPageFields,
}
