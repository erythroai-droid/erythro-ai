import type { CollectionConfig } from 'payload'

/**
 * Technical briefs produced by the consultant interview — a separate entity
 * from `contact-submissions`: own number (`TZ-{id}`), own email, own admin
 * section.
 *
 * `briefMarkdown` is stored link-free: URLs are stripped before persistence
 * and the notification email carries no attachments. References are uploaded
 * to the CRM project card instead.
 */
export const ProjectBriefs: CollectionConfig = {
  slug: 'project-briefs',
  labels: { singular: 'Project Brief', plural: 'Project Briefs' },
  admin: {
    group: 'Consultant',
    useAsTitle: 'projectNumber',
    defaultColumns: ['projectNumber', 'email', 'locale', 'status', 'crmStatus', 'createdAt'],
    listSearchableFields: ['projectNumber', 'email', 'name', 'company'],
    description:
      'Briefs collected by the AI consultant. The team is notified at order@erythro.ai; client files live in the CRM card.',
  },
  access: {
    create: () => false,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'projectNumber',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'TZ-{id}, assigned right after the row is created',
      },
    },
    {
      name: 'session',
      type: 'relationship',
      relationTo: 'consult-sessions',
      admin: { description: 'Transcript this brief came from', readOnly: true },
    },
    { name: 'name', type: 'text', admin: { readOnly: true } },
    { name: 'company', type: 'text', admin: { readOnly: true } },
    { name: 'email', type: 'email', required: true, admin: { readOnly: true } },
    { name: 'phone', type: 'text', admin: { readOnly: true } },
    { name: 'locale', type: 'text', admin: { readOnly: true } },
    {
      name: 'briefMarkdown',
      type: 'textarea',
      required: true,
      admin: {
        readOnly: true,
        rows: 24,
        description: 'Interview result. No links and no attachments by design.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Stays "draft" if SMTP failed — the brief itself is never lost',
      },
    },
    {
      name: 'crmStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Created', value: 'created' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Monday.com card. "Pending" means create it manually or retry.',
      },
    },
    {
      name: 'crmItemId',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'CRM item id. Kept for staff only — never sent to the client.',
      },
    },
    {
      name: 'translaterStatus',
      type: 'select',
      defaultValue: 'skipped',
      options: [
        { label: 'Translated', value: 'translated' },
        { label: 'Skipped', value: 'skipped' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'EN / HE briefs go through the Translater pipeline. "Skipped" means the VPS was unreachable — review the wording.',
      },
    },
    { name: 'subject', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'emailedAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
  ],
}
