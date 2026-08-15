import type { Field } from 'payload'

/** Admin dropdown of addresses from the Contacts → Emails array. */
export function siteEmailSelectField(overrides: Partial<Field> & { name: string; label: string }): Field {
  const { name, label, admin, ...rest } = overrides
  return {
    name,
    type: 'text',
    label,
    ...rest,
    admin: {
      ...admin,
      components: {
        Field: '/components/admin/SiteEmailSelect#SiteEmailSelect',
      },
    },
  } as Field
}
