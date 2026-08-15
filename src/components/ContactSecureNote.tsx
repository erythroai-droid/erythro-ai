'use client'

import React from 'react'
import Link from 'next/link'
import { contactForm } from '@/translations'

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

/** Compact trust line under the submit button (lock + short privacy reassurance). */
export default function ContactSecureNote({
  locale,
  theme = 'dark',
}: {
  locale: string
  theme?: 'light' | 'dark'
}) {
  const t = (field: Record<string, string>) => field[locale] || field.en
  const form = contactForm
  const isLight = theme === 'light'
  const tone = isLight ? 'text-coal-900/50' : 'text-white/45'
  const linkClass = isLight
    ? 'font-normal text-coal-900/75 underline underline-offset-2 decoration-coal-900/25 transition-colors hover:text-erythro-500 hover:decoration-erythro-500'
    : 'font-normal text-gold-500/85 underline underline-offset-2 decoration-gold-500/30 transition-colors hover:text-gold-100 hover:decoration-gold-100'

  return (
    <p
      className={`m-0 flex items-start gap-2 text-[11px] font-light leading-snug ${tone}`}
      role="note"
    >
      <LockIcon className={`mt-0.5 shrink-0 ${isLight ? 'text-coal-900/45' : 'text-gold-500/70'}`} />
      <span>
        {t(form.secureNote)}{' '}
        <Link href="/privacy" className={linkClass} target="_blank" rel="noopener noreferrer">
          {t(form.privacyPolicy)}
        </Link>
        {t(form.secureNoteEnd)}
      </span>
    </p>
  )
}
