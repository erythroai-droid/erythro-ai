import { CONTACT_HONEYPOT_FIELD } from '@/lib/contactHoneypot'

type ContactHoneypotFieldProps = {
  /** Prefix for stable `id` / `htmlFor` (e.g. `contact-modal`, `contacts-page`). */
  idPrefix: string
}

/**
 * Off-screen honeypot input for contact forms.
 * Must stay empty; bots that auto-fill "website" fields get silently dropped server-side.
 */
export function ContactHoneypotField({ idPrefix }: ContactHoneypotFieldProps) {
  const inputId = `${idPrefix}-company-website`

  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor={inputId}>Company website</label>
      <input
        id={inputId}
        name={CONTACT_HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  )
}
