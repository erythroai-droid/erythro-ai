/**
 * Text for the consultant widget.
 *
 * English defaults ship with the module; a host overrides any subset through
 * the `labels` prop (Erythro feeds it from `consultant-settings`), exactly like
 * `AccessibilityLabels`.
 */
export interface ConsultantLabels {
  title: string
  /** Small line under the input — must disclose that this is an AI. */
  disclaimer: string
  openLabel: string
  closeLabel: string
  inputPlaceholder: string
  footerWhatsApp: string
  footerContacts: string
  footerTelegram: string
  send: string
  thinking: string
  retry: string

  /** Shown as the first assistant bubble. */
  greeting: string

  // Email verification
  /** Shown before the OTP form — the chat will be stored. */
  savePolicy: string
  otpIntro: string
  otpEmailPlaceholder: string
  otpEmailSubmit: string
  otpCodeIntro: string
  otpCodePlaceholder: string
  otpCodeSubmit: string
  otpResend: string
  otpInvalidEmail: string
  otpInvalidCode: string
  otpTooMany: string
  otpMailFailed: string
  otpVerified: string

  // Gates
  dailyLimitReached: string
  unavailable: string
  streamFailed: string

  // Brief
  briefDraftTitle: string
  briefDraftHint: string
  briefSentTitle: string
  /** `{number}` is replaced with the TZ-… id. */
  briefSentBody: string
  briefCrmPending: string
  ticketCreated: string

  // Chips
  chipFaq: string
  chipBrief: string
  chipAudit: string
  chipWhatsApp: string
  chipForm: string
  chipOrder: string
}

export const defaultConsultantLabels: ConsultantLabels = {
  title: 'Erythro assistant',
  disclaimer: 'AI assistant. Answers come from the erythro.ai knowledge base.',
  openLabel: 'Open the AI assistant',
  closeLabel: 'Close',
  inputPlaceholder: 'Ask about packages, prices or your project',
  footerWhatsApp: 'WhatsApp',
  footerContacts: 'Contacts',
  footerTelegram: 'Telegram',
  send: 'Send',
  thinking: 'Typing…',
  retry: 'Try again',

  greeting:
    'Hi, I am the Erythro AI assistant. I can explain our packages, prices and the AI audit, or help you put together a project brief.',

  savePolicy:
    'If we prepare a project brief or escalate a technical question, this chat is stored for up to 12 months so the team can see the context.',
  otpIntro: 'To continue, confirm your email — we will send a six-digit code.',
  otpEmailPlaceholder: 'you@company.com',
  otpEmailSubmit: 'Send code',
  otpCodeIntro: 'Enter the six digits from the email.',
  otpCodePlaceholder: '123456',
  otpCodeSubmit: 'Confirm',
  otpResend: 'Send a new code',
  otpInvalidEmail: 'That address does not look valid.',
  otpInvalidCode: 'Wrong or expired code.',
  otpTooMany: 'Too many attempts. Try again later.',
  otpMailFailed: 'We could not send the code. Please use the contact form.',
  otpVerified: 'Email confirmed.',

  dailyLimitReached:
    'You have reached today’s message limit. Write to order@erythro.ai or reach us on WhatsApp.',
  unavailable: 'The assistant is unavailable right now. The contact form still works.',
  streamFailed: 'The answer was interrupted.',

  briefDraftTitle: 'Draft brief',
  briefDraftHint: 'Reply in the chat to correct anything, then confirm sending.',
  briefSentTitle: 'Brief sent',
  briefSentBody:
    'Project {number} is created. Upload references into the project card in the CRM — not into this chat.',
  briefCrmPending: 'The CRM card will be created manually; the team already has the brief.',
  ticketCreated:
    'Your question went to a specialist. The answer will arrive by email — there is no thread here.',

  chipFaq: 'Packages and prices',
  chipBrief: 'Build a brief',
  chipAudit: 'Take an audit',
  chipWhatsApp: 'WhatsApp',
  chipForm: 'Contact form',
  chipOrder: 'Order a site',
}
