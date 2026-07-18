'use client'

import React from 'react'
import { useTheme } from '@payloadcms/ui'

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
    <path
      d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
)

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5 7 7 0 1 0 20.5 14.3Z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * Quick light/dark toggle for the Payload Admin header.
 * Preference is persisted via Payload's theme cookie (same as Account settings).
 */
export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      className="btn btn--icon-style-without-border btn--size-small btn--style-secondary"
      aria-label={next === 'dark' ? 'Switch to dark theme' : 'Switch to light theme'}
      title={next === 'dark' ? 'Dark theme' : 'Light theme'}
      onClick={() => setTheme(next)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 'auto',
        paddingInline: 10,
      }}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      <span style={{ fontSize: 13 }}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  )
}
