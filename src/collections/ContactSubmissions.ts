import type { CollectionConfig } from 'payload'
import { CONTACT_SUBMISSION_SOURCES } from '@/lib/contactSubmissionSources'

const auditOnly = (_: unknown, siblingData: { source?: string | null }) =>
  siblingData?.source === 'audit'

const orderOrAudit = (_: unknown, siblingData: { source?: string | null }) =>
  siblingData?.source === 'audit' || siblingData?.source === 'order'

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  labels: { singular: 'Submission', plural: 'Submissions' },
  admin: {
    useAsTitle: 'name',
    /**
     * Keep routes reachable for filtered sidebar links (Solution / AI Audit / Contact).
     * `hidden: true` 404s those URLs — Payload drops the collection from visibleEntities.
     * `group: false` hides only the unfiltered entry from the default nav / dashboard.
     */
    group: false,
    defaultColumns: [
      'auditActions',
      'name',
      'email',
      'website',
      'ip',
      'auditStatus',
      'auditScore',
      'createdAt',
    ],
    listSearchableFields: ['name', 'email', 'website', 'planSlug', 'ip'],
    description:
      'All site intakes. Open a filtered list from the sidebar: Solution Orders, AI Audit Orders, or Contact Inquiries.',
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
    { name: 'name', type: 'text', required: true, admin: { components: { Cell: '/components/admin/CompactTextCell#CompactTextCell' } } },
    { name: 'email', type: 'email', required: true, admin: { components: { Cell: '/components/admin/CompactTextCell#CompactTextCell' } } },
    { name: 'phone', type: 'text' },
    { name: 'message', type: 'textarea', required: true },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'contact',
      options: CONTACT_SUBMISSION_SOURCES.map((s) => ({
        label: s.navLabel,
        value: s.id,
      })),
      admin: {
        description: 'Intake channel (set by the site form; do not change manually)',
        readOnly: true,
        components: {
          Cell: '/components/admin/SourceBadgeCell#SourceBadgeCell',
        },
      },
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
        description: 'Audited site URL (AI Audit checkout only)',
        condition: auditOnly,
        components: { Cell: '/components/admin/CompactTextCell#CompactTextCell' },
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
        description: 'Preferred report language (AI Audit)',
        condition: auditOnly,
      },
    },
    {
      name: 'planSlug',
      type: 'text',
      admin: {
        description: 'Ordered plan slug from checkout (solutions or audit plans)',
        condition: orderOrAudit,
        components: { Cell: '/components/admin/CompactTextCell#CompactTextCell' },
      },
    },
    {
      name: 'planTotal',
      type: 'text',
      admin: {
        description: 'Displayed order total at checkout',
        condition: orderOrAudit,
        components: { Cell: '/components/admin/CompactTextCell#CompactTextCell' },
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
        components: { Cell: '/components/admin/CompactNumberCell#CompactNumberCell' },
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
    {
      name: 'ip',
      type: 'text',
      admin: {
        description: 'Client IP address at intake time',
        readOnly: true,
        components: { Cell: '/components/admin/CompactTextCell#CompactTextCell' },
      },
    },
  ],
}
