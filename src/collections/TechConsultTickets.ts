import type { CollectionConfig } from 'payload'

/**
 * Non-standard technical questions the knowledge base cannot answer.
 *
 * The specialist replies **by email** to the verified address; the widget
 * shows no thread. The ticket id doubles as the future entry point for an
 * engineer joining the related `consult-sessions` transcript.
 */
export const TechConsultTickets: CollectionConfig = {
  slug: 'tech-consult-tickets',
  labels: { singular: 'Tech Consultation', plural: 'Tech Consultations' },
  admin: {
    group: 'Consultant',
    useAsTitle: 'ticketNumber',
    defaultColumns: ['ticketNumber', 'email', 'locale', 'status', 'createdAt'],
    listSearchableFields: ['ticketNumber', 'email', 'question'],
    description:
      'Questions escalated from the chat. Answer the client by email — the widget intentionally has no reply thread.',
  },
  access: {
    create: () => false,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'ticketNumber',
      type: 'text',
      admin: { readOnly: true, description: 'TC-{id}, assigned after create' },
    },
    { name: 'email', type: 'email', required: true, admin: { readOnly: true } },
    { name: 'locale', type: 'text', admin: { readOnly: true } },
    {
      name: 'question',
      type: 'textarea',
      required: true,
      admin: { readOnly: true, rows: 10 },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        readOnly: true,
        rows: 12,
        description: 'Last few turns of the conversation, for context',
      },
    },
    {
      name: 'session',
      type: 'relationship',
      relationTo: 'consult-sessions',
      admin: {
        readOnly: true,
        description: 'Set only when the visitor had already been identified',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Answered', value: 'answered' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'emailedAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
  ],
}
