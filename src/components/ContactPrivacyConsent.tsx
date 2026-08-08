'use client'

import React from 'react'
import Link from 'next/link'
import { contactForm } from '@/translations'

interface ContactPrivacyConsentProps {
  locale: string
  theme?: 'light' | 'dark'
  idPrefix: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  showRequiredError?: boolean
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
}: ContactPrivacyConsentProps) {
  const t = (field: Record<string, string>) => field[locale] || field.en
  const form = contactForm
  const isLight = theme === 'light'
  const checkboxId = `${idPrefix}-privacy-consent`
  const noticeId = `${idPrefix}-privacy-notice`
  const errorId = `${idPrefix}-privacy-consent-error`

  const noticeClass = isLight ? 'text-coal-900/65' : 'text-white/55'
  const labelClass = isLight ? 'text-coal-900/85' : 'text-white/80'
  const linkClass = isLight
    ? 'font-medium text-coal-900 underline underline-offset-2 decoration-coal-900/30 transition-colors hover:text-erythro-500 hover:decoration-erythro-500'
    : 'font-medium text-gold-500 underline underline-offset-2 decoration-gold-500/40 transition-colors hover:text-gold-100 hover:decoration-gold-100'
  const boxClass = isLight
    ? 'border-coal-900/40 bg-white accent-erythro-500'
    : 'border-white/40 bg-white/[0.04] accent-gold-500'

  return (
    <div className="flex flex-col gap-3">
      <p id={noticeId} className={`m-0 text-[11px] leading-relaxed tracking-[0.02em] ${noticeClass}`}>
        {t(form.notice)}
      </p>

      <label
        htmlFor={checkboxId}
        className={`flex cursor-pointer items-start gap-3 text-[12px] leading-snug ${labelClass}`}
      >
        <input
          id={checkboxId}
          name="privacyConsent"
          type="checkbox"
          checked={checked}
          required
          aria-required="true"
          aria-invalid={showRequiredError || undefined}
          aria-describedby={`${noticeId}${showRequiredError ? ` ${errorId}` : ''}`}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className={`mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border ${boxClass}`}
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
