import type { GlobalConfig } from 'payload'

import { locText, locTextarea } from '../fields/localized'
import { revalidateGlobal } from '../lib/revalidate'

/**
 * Editor-owned behaviour of the AI consultant widget: guardrails that go into
 * the system prompt, the anti-abuse ceilings, the OTP copy and the brief
 * checklist. Prices and services are *not* here — those come from the same
 * collections the site renders.
 */
export const ConsultantSettings: GlobalConfig = {
  slug: 'consultant-settings',
  label: 'Consultant Settings',
  admin: {
    group: 'Consultant',
    description:
      'AI consultant: prompt guardrails, message limits, email-verification copy and the technical-brief checklist (localized en / ru / he).',
  },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Behaviour',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: true,
              label: 'Consultant enabled',
              admin: {
                description:
                  'Off hides the widget entry point. The API also returns 503 when GEMINI_API_KEY is missing.',
              },
            },
            locTextarea('botRules', {
              label: 'Extra prompt rules',
              admin: {
                rows: 10,
                description:
                  'Appended to the built-in guardrails. Use it for tone and offer wording — never for prices (those come from the CMS).',
              },
            }),
            locTextarea('greeting', {
              label: 'Opening message',
              admin: {
                rows: 4,
                description:
                  'First bubble in the widget. Must state that this is an AI assistant.',
              },
            }),
          ],
        },
        {
          label: 'Limits',
          fields: [
            {
              name: 'anonMessageLimit',
              type: 'number',
              defaultValue: 5,
              min: 1,
              max: 50,
              admin: {
                description:
                  'Visitor messages allowed before email verification is required.',
              },
            },
            {
              name: 'verifiedMessageLimit',
              type: 'number',
              defaultValue: 30,
              min: 1,
              max: 500,
              admin: {
                description:
                  'Visitor messages per day per verified email. Above this the widget points to order@ / WhatsApp.',
              },
            },
            {
              name: 'techConsultantEmail',
              type: 'email',
              admin: {
                description:
                  'Inbox for technical-consultation tickets. Empty falls back to order@erythro.ai.',
              },
            },
          ],
        },
        {
          label: 'Verification copy',
          fields: [
            locText('otpPrompt', {
              label: 'Ask for email',
              admin: { description: 'Shown above the email field when the quota runs out.' },
            }),
            locText('otpCodePrompt', {
              label: 'Ask for code',
              admin: { description: 'Shown above the 6-digit code field.' },
            }),
            locText('otpEmailSubject', {
              label: 'Email subject',
              admin: { description: 'Subject of the verification email.' },
            }),
            locTextarea('otpEmailBody', {
              label: 'Email body',
              admin: {
                rows: 4,
                description: 'Use {code} for the six digits and {minutes} for the lifetime.',
              },
            }),
            locTextarea('savePolicyNotice', {
              label: 'Storage notice',
              admin: {
                rows: 4,
                description:
                  'Said before contacts are requested: the conversation will be stored, files go to the CRM card and not into the chat.',
              },
            }),
            locTextarea('quotaExhaustedNotice', {
              label: 'Daily limit reached',
              admin: { rows: 3 },
            }),
          ],
        },
        {
          label: 'Brief checklist',
          fields: [
            {
              name: 'briefSlots',
              type: 'array',
              label: 'Brief slots',
              labels: { singular: 'Slot', plural: 'Slots' },
              admin: {
                description:
                  'Interview order. The consultant asks one or two at a time; "I do not know" is an acceptable answer and becomes an open question in the brief.',
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'slotId',
                  type: 'text',
                  required: true,
                  admin: { description: 'Stable key, e.g. goal, stack, languages, integrations.' },
                },
                locText('question', { required: true, label: 'Question' }),
                locText('hint', {
                  label: 'Hint for the visitor',
                  admin: {
                    description:
                      'Example answer shown under the question, e.g. "6-section landing, RU+HE, leads to WhatsApp".',
                  },
                }),
              ],
            },
          ],
        },
      ],
    },
  ],
}
