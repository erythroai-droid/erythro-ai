'use client'

import React from 'react'

export function FieldOkCheck({
  show,
  checking,
  isLight,
}: {
  show: boolean
  checking?: boolean
  isLight?: boolean
}) {
  const tone = isLight ? 'text-emerald-600' : 'text-emerald-400'
  if (checking) {
    return (
      <span
        className={`pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 ${tone}`}
        aria-hidden
      >
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
          <path d="M17 10a7 7 0 0 0-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    )
  }
  if (!show) return null
  return (
    <span
      className={`pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 ${tone}`}
      aria-hidden
    >
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
        <path
          d="M4.5 10.5 8 14l7.5-8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
