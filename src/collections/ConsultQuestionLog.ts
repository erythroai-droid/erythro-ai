import type { CollectionConfig } from 'payload'

/**
 * Anonymous questions only. A row is the latest visitor message on
 * `POST /api/consult` before email verification. Full transcripts still live
 * in `consult-sessions` after OTP and a phone number.
 */
export const ConsultQuestionLog: CollectionConfig = {
  slug: 'consult-question-log',
  labels: { singular: 'Chat question', plural: 'Chat questions' },
  admin: {
    group: 'Consultant',
    useAsTitle: 'question',
    defaultColumns: ['question', 'locale', 'visitor', 'createdAt'],
    listSearchableFields: ['question', 'visitor'],
    description:
      'Questions asked before email verification. The visitor code groups one connection; it is not a name or an account. Full transcripts stay in Consult Sessions.',
  },
  access: {
    create: () => false,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'question',
      type: 'textarea',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'locale',
      type: 'text',
      admin: { readOnly: true, description: 'Language of the reply, from the visitor message' },
    },
    {
      name: 'visitor',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Same code means the same connection. Shared networks share a code.',
      },
    },
  ],
}
