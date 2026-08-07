'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useBackdropContrast } from '@/hooks/useBackdropContrast'

interface ScrollTopButtonProps {
  theme?: 'light' | 'dark'
  locale?: string
  /** Show after scrolling past this many pixels. */
  threshold?: number
}

/**
 * Refined “Top” control — short vertical beacon line + label, bottom-center on desktop.
 * Red fill matches Scroll; line color follows backdrop contrast.
 *
 * Temporarily returns null (hidden). Flip `ENABLED` to true to show again.
 */
const ENABLED = false

const TOP_LABEL = {
  en: 'Top',
  ru: 'Наверх',
  he: 'למעלה',
} as const

const TOP_ARIA = {
  en: 'Back to top',
  ru: 'Наверх',
  he: 'חזרה לראש העמוד',
} as const

export default function ScrollTopButton({
  theme = 'dark',
  locale = 'en',
  threshold = 400,
}: ScrollTopButtonProps) {
  const [visible, setVisible] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const overDark = useBackdropContrast(btnRef, theme, {
    enabled: ENABLED && visible,
  })

  useEffect(() => {
    if (!ENABLED) return
    const update = () => setVisible(window.scrollY > threshold)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [threshold])

  if (!ENABLED || !visible) return null

  const muted = overDark ? 'text-gold-800' : 'text-coal-500'
  const track = overDark ? 'bg-white/20' : 'bg-coal-500/20'
  const label =
    locale === 'ru' || locale === 'he' ? TOP_LABEL[locale] : TOP_LABEL.en
  const aria =
    locale === 'ru' || locale === 'he' ? TOP_ARIA[locale] : TOP_ARIA.en

  return (
    <button
      ref={btnRef}
      type="button"
      data-contrast-ignore
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={aria}
      className="portfolio-scroll-hint pointer-events-auto fixed bottom-8 start-1/2 z-40 hidden -translate-x-1/2 cursor-pointer flex-col items-center gap-2.5 transition-colors duration-300 lg:flex"
    >
      {/* Half of Scroll’s h-16 track; rotate so the red beacon runs upward */}
      <span
        className={`portfolio-scroll-track relative h-8 w-px overflow-hidden rotate-180 ${track}`}
        aria-hidden
      >
        <span className="portfolio-scroll-beacon absolute inset-x-0 top-0 h-full w-full bg-erythro-500" />
      </span>
      <span className={`font-sans text-[9px] uppercase tracking-[0.18em] ${muted}`}>{label}</span>
    </button>
  )
}
