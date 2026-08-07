'use client'

import React, { useEffect, useState } from 'react'

const LABELS: Record<string, string> = {
  en: 'Skip to main content',
  ru: 'Перейти к основному содержимому',
  he: 'דלג לתוכן המרכזי',
}

/**
 * First focusable control for keyboard users (WCAG 2.4.1).
 * Visually hidden until focused.
 *
 * Locale comes from the layout cookie on SSR, then tracks `html[lang]` so a
 * client-side language switch (without full reload) does not leave the wrong
 * language on the skip link.
 */
export default function SkipToContent({ locale = 'en' }: { locale?: string }) {
  const [activeLocale, setActiveLocale] = useState(locale)

  useEffect(() => {
    setActiveLocale(locale)
  }, [locale])

  useEffect(() => {
    const root = document.documentElement
    const sync = () => {
      const lang = (root.lang || locale).slice(0, 2)
      if (LABELS[lang]) setActiveLocale(lang)
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['lang'] })
    return () => observer.disconnect()
  }, [locale])

  const label = LABELS[activeLocale] || LABELS.en

  return (
    <a href="#main-content" className="skip-to-content">
      {label}
    </a>
  )
}
