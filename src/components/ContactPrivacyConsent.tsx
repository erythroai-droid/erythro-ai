'use client'

import React from 'react'
import Link from 'next/link'
import { contactForm } from '@/translations'

interface ContactPrivacyConsentProps {
  locale: string
  theme?: 'light' | 'dark'
  idPrefix: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  showRequiredError?: boolean
  disabled?: boolean
  /** Paid checkout: the same checkbox also accepts /terms. */
  showTerms?: boolean
  /**
   * Which pieces to render.
   * - `all` (default): consent checkbox, then lock/trust notice
   * - `notice`: lock/trust copy only
   * - `consent`: checkbox only
   */
  parts?: 'all' | 'notice' | 'consent'
  /** Absolute legal URLs on ads LPs (avoid soft-nav on LP host). */
  privacyHref?: string
  termsHref?: string
}

function LegalAnchor({
  href,
  className,
  children,
  openInNewTab,
}: {
  href: string
  className: string
  children: React.ReactNode
  openInNewTab?: boolean
}) {
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link
      href={href}
      className={className}
      {...(openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </Link>
  )
}

function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1.25" fill="currentColor" />
    </svg>
  )
}

/**
 * Privacy block: opt-in consent and/or lock + trust/purpose copy (Art. 11 short form).
 */
export default function ContactPrivacyConsent({
  locale,
  theme = 'dark',
  idPrefix,
  checked = false,
  onCheckedChange,
  showRequiredError = false,
  disabled = false,
  showTerms = false,
  parts = 'all',
  privacyHref = '/privacy',
  termsHref = '/terms',
}: ContactPrivacyConsentProps) {
  const t = (field: Record<string, string>) => field[locale] || field.en
  const form = contactForm
  const isLight = theme === 'light'
  const checkboxId = `${idPrefix}-privacy-consent`
  const noticeId = `${idPrefix}-privacy-notice`
  const errorId = `${idPrefix}-privacy-consent-error`
  const showConsent = parts === 'all' || parts === 'consent'
  const showNotice = parts === 'all' || parts === 'notice'

  const noticeClass = isLight ? 'text-coal-900/50' : 'text-white/45'
  const labelClass = isLight ? 'text-coal-900/70' : 'text-white/65'
  const linkClass = isLight
    ? 'font-normal text-coal-900/80 underline underline-offset-2 decoration-coal-900/25 transition-colors hover:text-erythro-500 hover:decoration-erythro-500'
    : 'font-normal text-gold-500/90 underline underline-offset-2 decoration-gold-500/35 transition-colors hover:text-gold-100 hover:decoration-gold-100'
  const boxClass = isLight
    ? 'border-coal-900/40 bg-white accent-erythro-500'
    : 'border-white/40 bg-white/[0.04] accent-gold-500'
  const lockClass = isLight ? 'text-coal-900/45' : 'text-gold-500/70'

  return (
    <div className="flex flex-col gap-2">
      {showConsent ? (
        <label
          htmlFor={checkboxId}
          className={`flex items-start gap-2 text-[11px] font-light leading-snug ${labelClass} ${
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
            aria-describedby={[noticeId, showRequiredError ? errorId : null]
              .filter(Boolean)
              .join(' ')}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded border ${boxClass} ${
              disabled ? 'cursor-default' : 'cursor-pointer'
            }`}
          />
          <span>
            {t(form.consentPrefix)}{' '}
            <LegalAnchor href={privacyHref} className={linkClass} openInNewTab>
              {t(form.privacyLink)}
            </LegalAnchor>
            {showTerms ? (
              <>
                {t(form.termsJoiner)}
                <LegalAnchor href={termsHref} className={linkClass} openInNewTab>
                  {t(form.termsLink)}
                </LegalAnchor>
              </>
            ) : null}{' '}
            {t(form.consentSuffix)}
          </span>
        </label>
      ) : null}

      {showConsent && showRequiredError ? (
        <p id={errorId} role="alert" className="m-0 text-sm text-erythro-500">
          {t(form.consentRequired)}
        </p>
      ) : null}

      {showNotice ? (
        <div className={`flex items-start gap-2 text-[11px] font-light leading-snug ${noticeClass}`}>
          <LockIcon className={`mt-0.5 shrink-0 ${lockClass}`} />
          <p id={noticeId} className="m-0">
            {t(form.privacyBlock)}
          </p>
        </div>
      ) : null}
    </div>
  )
}
