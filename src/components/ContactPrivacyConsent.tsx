'use client'

import React from 'react'
import Link from 'next/link'
import { useSiteContent } from '@/components/SiteContentProvider'
import { contactForm } from '@/translations'

interface ContactPrivacyConsentProps {
  locale: string
  theme?: 'light' | 'dark'
  idPrefix: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  showRequiredError?: boolean
  disabled?: boolean
}

/**
 * Art. 11 notice + unchecked opt-in consent for contact forms (PPL 5741-1981).
 */
export default function ContactPrivacyConsent({
  locale,
  theme = 'dark',
  idPrefix,
  checked,
  onCheckedChange,
  showRequiredError = false,
  disabled = false,
}: ContactPrivacyConsentProps) {
  const content = useSiteContent()
  const legalEmail = content.siteSettings.emailLegal || content.siteSettings.email
  const t = (field: Record<string, string>) => field[locale] || field.en
  const form = contactForm
  const isLight = theme === 'light'
  const checkboxId = `${idPrefix}-privacy-consent`
  const noticeId = `${idPrefix}-privacy-notice`
  const errorId = `${idPrefix}-privacy-consent-error`
  const notice = t(form.notice).replaceAll('{{email}}', legalEmail)

  const noticeClass = isLight ? 'text-coal-900/45' : 'text-white/40'
  const labelClass = isLight ? 'text-coal-900/70' : 'text-white/65'
  const linkClass = isLight
    ? 'font-normal text-coal-900/80 underline underline-offset-2 decoration-coal-900/25 transition-colors hover:text-erythro-500 hover:decoration-erythro-500'
    : 'font-normal text-gold-500/90 underline underline-offset-2 decoration-gold-500/35 transition-colors hover:text-gold-100 hover:decoration-gold-100'
  const boxClass = isLight
    ? 'border-coal-900/40 bg-white accent-erythro-500'
    : 'border-white/40 bg-white/[0.04] accent-gold-500'

  return (
    <div className="flex flex-col gap-2.5">
      <p
        id={noticeId}
        className={`m-0 text-[10px] font-extralight leading-[1.45] tracking-[0.01em] ${noticeClass}`}
      >
        {notice}
      </p>

      <label
        htmlFor={checkboxId}
        className={`flex items-start gap-2.5 text-[11px] font-light leading-snug ${labelClass} ${
          disabled ? 'cursor-default opacity-70' : 'cursor-pointer'
        }`}
      >
        <input
          id={checkboxId}
          name="privacyConsent"
          type="checkbox"
          checked={checked}
          required
          disabled={disabled}
          aria-required="true"
          aria-invalid={showRequiredError || undefined}
          aria-describedby={`${noticeId}${showRequiredError ? ` ${errorId}` : ''}`}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${boxClass} ${
            disabled ? 'cursor-default' : 'cursor-pointer'
          }`}
        />
        <span>
          {t(form.consentPrefix)}{' '}
          <Link href="/privacy" className={linkClass} target="_blank" rel="noopener noreferrer">
            {t(form.privacyLink)}
          </Link>{' '}
          {t(form.consentSuffix)}
        </span>
      </label>

      {showRequiredError ? (
        <p id={errorId} role="alert" className="m-0 text-sm text-erythro-500">
          {t(form.consentRequired)}
        </p>
      ) : null}
    </div>
  )
}
