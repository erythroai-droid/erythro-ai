import { CONTACT_HONEYPOT_FIELD } from '@/lib/contactHoneypot'

type ContactHoneypotFieldProps = {
  /** Prefix for stable `id` / `htmlFor` (e.g. `contact-modal`, `contacts-page`). */
  idPrefix: string
}

/**
 * Off-screen honeypot. Name/label must not match company/website/email:
 * mobile Safari and Chrome autofill those and the API silently drops the lead.
 */
export function ContactHoneypotField({ idPrefix }: ContactHoneypotFieldProps) {
  const inputId = `${idPrefix}-hp-trap`

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
    >
      <label htmlFor={inputId}>Fax</label>
      <input
        id={inputId}
        name={CONTACT_HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        readOnly
        defaultValue=""
        data-1p-ignore="true"
        data-lpignore="true"
        data-form-type="other"
      />
    </div>
  )
}
