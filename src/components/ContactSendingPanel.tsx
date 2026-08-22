'use client'

import React from 'react'

/** Compact spinner for contact form submit / sending state. */
export function ContactSendSpinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ContactSendingPanel({
  label,
  tone = 'dark',
}: {
  label: string
  tone?: 'dark' | 'light'
}) {
  const textClass = tone === 'light' ? 'text-coal-900/80' : 'text-white/85'
  const spinnerClass = tone === 'light' ? 'text-erythro-500' : 'text-gold-500'

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 text-center" role="status" aria-live="polite" aria-busy="true">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full ${
          tone === 'light' ? 'bg-erythro-500/10' : 'bg-white/10'
        } ${spinnerClass}`}
      >
        <ContactSendSpinner />
      </div>
      <p className={`m-0 font-sans text-base font-light ${textClass}`}>{label}</p>
    </div>
  )
}
