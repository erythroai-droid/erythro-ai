import type { CollectionConfig } from 'payload'

/**
 * Chat transcripts for *identified* conversations only.
 *
 * A row appears after all three of: verified email (OTP), phone number, and
 * the storage notice shown in the widget. Anonymous FAQ traffic is never
 * written here. Retention is 12 months (see `/privacy`); earlier deletion on
 * request is manual.
 */
export const ConsultSessions: CollectionConfig = {
  slug: 'consult-sessions',
  labels: { singular: 'Consult Session', plural: 'Consult Sessions' },
  admin: {
    group: 'Consultant',
    useAsTitle: 'email',
    defaultColumns: ['email', 'phone', 'locale', 'handoff', 'identifiedAt'],
    listSearchableFields: ['email', 'phone'],
    description:
      'Stored chat transcripts. Only conversations that reached a custom project brief (verified email + phone) are here.',
  },
  // Written server-side through the local API in /api/consult.
  access: {
    create: () => false,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      admin: { readOnly: true, description: 'Confirmed by one-time code before the chat was stored' },
    },
    { name: 'phone', type: 'text', admin: { readOnly: true } },
    { name: 'name', type: 'text', admin: { readOnly: true } },
    { name: 'company', type: 'text', admin: { readOnly: true } },
    {
      name: 'locale',
      type: 'text',
      admin: { readOnly: true, description: 'Site language the visitor used' },
    },
    {
      name: 'messages',
      type: 'json',
      admin: {
        readOnly: true,
        description:
          'Transcript as an array of { role, parts }. Parts — not plain strings — so voice and attachments can be added later without a migration.',
      },
    },
    {
      name: 'handoff',
      type: 'select',
      defaultValue: 'bot',
      options: [
        { label: 'Bot', value: 'bot' },
        { label: 'Queued for engineer', value: 'queued' },
        { label: 'Engineer', value: 'human' },
      ],
      admin: {
        description:
          'Only "bot" in v1. Reserved so an engineer can join this same transcript later.',
      },
    },
    {
      name: 'emailVerifiedAt',
      type: 'date',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'identifiedAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'When the phone number was given and storage began',
      },
    },
    {
      name: 'ip',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar', description: 'Client IP at identification' },
    },
  ],
}
