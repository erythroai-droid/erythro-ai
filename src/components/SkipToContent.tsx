'use client'

import React from 'react'

const LABELS: Record<string, string> = {
  en: 'Skip to main content',
  ru: 'Перейти к основному содержимому',
  he: 'דלג לתוכן הראשי',
}

/**
 * First focusable control for keyboard users (WCAG 2.4.1).
 * Visually hidden until focused.
 */
export default function SkipToContent({ locale = 'en' }: { locale?: string }) {
  const label = LABELS[locale] || LABELS.en

  return (
    <a href="#main-content" className="skip-to-content">
      {label}
    </a>
  )
}
