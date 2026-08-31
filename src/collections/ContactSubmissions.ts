import type { CollectionConfig } from 'payload'

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  labels: { singular: 'Contact Submission', plural: 'Contact Submissions' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'source', 'website', 'planSlug', 'auditStatus', 'createdAt'],
    group: 'Content',
  },
  // Submissions are created server-side via the local API in /api/contact
  // (which overrides access), so public REST create is disabled to prevent spam.
  // Staff may update auditStatus / notes after the lab run to track report delivery.
  access: {
    create: () => false,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'message', type: 'textarea', required: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'contact',
      options: [
        { label: 'Contact / feedback', value: 'contact' },
        { label: 'Solutions / Order', value: 'order' },
        { label: 'AI Audit', value: 'audit' },
      ],
      admin: { description: 'Which site form created this submission', readOnly: true },
    },
    {
      name: 'locale',
      type: 'text',
      admin: { description: 'Site language the visitor used', readOnly: true },
    },
    {
      name: 'website',
      type: 'text',
      admin: {
        description: 'Audited site URL (AI Audit / order checkout)',
        condition: (_, siblingData) => siblingData?.source === 'audit',
      },
    },
    {
      name: 'auditLanguage',
      type: 'select',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Russian', value: 'ru' },
        { label: 'Hebrew', value: 'he' },
      ],
      admin: {
        description: 'Preferred report language',
        condition: (_, siblingData) => siblingData?.source === 'audit',
      },
    },
    {
      name: 'planSlug',
      type: 'text',
      admin: {
        description: 'Ordered plan slug (audit-free / audit-diagnostic / audit-pro)',
        condition: (_, siblingData) => siblingData?.source === 'audit',
      },
    },
    {
      name: 'planTotal',
      type: 'text',
      admin: {
        description: 'Displayed order total at checkout (optional)',
        condition: (_, siblingData) => siblingData?.source === 'audit',
      },
    },
    {
      name: 'auditStatus',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'In progress', value: 'in_progress' },
        { label: 'Report sent', value: 'report_sent' },
      ],
      admin: {
        description: 'Lab workflow: mark report_sent after the PDF is emailed to the client',
        condition: (_, siblingData) => siblingData?.source === 'audit',
      },
    },
  ],
}
