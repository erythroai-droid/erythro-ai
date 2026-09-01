import type { CollectionConfig } from 'payload'

const auditOnly = (_: unknown, siblingData: { source?: string | null }) =>
  siblingData?.source === 'audit'

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  labels: { singular: 'Contact Submission', plural: 'Contact Submissions' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'name',
      'email',
      'source',
      'website',
      'planSlug',
      'auditStatus',
      'auditScore',
      'retryCount',
      'auditActions',
      'createdAt',
    ],
    listSearchableFields: ['name', 'email', 'website', 'planSlug'],
    group: 'Content',
    description:
      'Contact / order leads and AI Audit pipeline (source=audit). Use sidebar “AI Audits” for the filtered list.',
  },
  // Submissions are created server-side via the local API in /api/contact
  // (which overrides access), so public REST create is disabled to prevent spam.
  // Staff / worker may update audit pipeline fields after the lab run.
  access: {
    create: () => false,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'auditActions',
      type: 'ui',
      admin: {
        condition: auditOnly,
        components: {
          Field: '/components/admin/AuditActions#AuditActions',
          Cell: '/components/admin/AuditActions#AuditActionsCell',
        },
      },
    },
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
        condition: auditOnly,
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
        condition: auditOnly,
      },
    },
    {
      name: 'planSlug',
      type: 'text',
      admin: {
        description: 'Ordered plan slug (audit-free / audit-diagnostic / audit-pro)',
        condition: auditOnly,
      },
    },
    {
      name: 'planTotal',
      type: 'text',
      admin: {
        description: 'Displayed order total at checkout (optional)',
        condition: auditOnly,
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
        { label: 'Failed', value: 'failed' },
      ],
      admin: {
        description:
          'Pipeline: new → in_progress → report_sent; failed after max retries (manual review)',
        condition: auditOnly,
        components: {
          Cell: '/components/admin/AuditStatusCell#AuditStatusCell',
        },
      },
    },
    {
      name: 'auditScore',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description: 'Final audit score (0–100)',
        condition: auditOnly,
      },
    },
    {
      name: 'auditSummary',
      type: 'json',
      admin: {
        description: 'Structured LLM findings (JSON)',
        condition: auditOnly,
      },
    },
    {
      name: 'reportUrl',
      type: 'text',
      admin: {
        description: 'PDF / HTML object URL in Cloudflare R2',
        condition: auditOnly,
      },
    },
    {
      name: 'htmlResult',
      type: 'textarea',
      admin: {
        description: 'Inline HTML report for typical sizes (≤ ~2MB); larger reports stay in R2 only',
        condition: auditOnly,
      },
    },
    {
      name: 'retryCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Auto-restart attempts (n8n reconciliation)',
        condition: auditOnly,
        position: 'sidebar',
      },
    },
    {
      name: 'errorLast',
      type: 'textarea',
      admin: {
        description: 'Last worker error (no Telegram in MVP — inspect in admin)',
        condition: auditOnly,
      },
    },
  ],
}
