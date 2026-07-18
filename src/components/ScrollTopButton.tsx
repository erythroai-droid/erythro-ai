'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useBackdropContrast } from '@/hooks/useBackdropContrast'

interface ScrollTopButtonProps {
  theme?: 'light' | 'dark'
  /** Show after scrolling past this many pixels. */
  threshold?: number
}

/**
 * Refined “Top” control — short vertical beacon line + label, bottom-center on desktop.
 * Red fill matches Scroll; line color follows backdrop contrast.
 */
export default function ScrollTopButton({
  theme = 'dark',
  threshold = 400,
}: ScrollTopButtonProps) {
  const [visible, setVisible] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const overDark = useBackdropContrast(btnRef, theme, { enabled: visible })

  useEffect(() => {
    const update = () => setVisible(window.scrollY > threshold)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [threshold])

  if (!visible) return null

  const muted = overDark ? 'text-gold-800' : 'text-coal-500'
  const track = overDark ? 'bg-white/20' : 'bg-coal-500/20'

  return (
    <button
      ref={btnRef}
      type="button"
      data-contrast-ignore
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="portfolio-scroll-hint pointer-events-auto fixed bottom-8 start-1/2 z-40 hidden -translate-x-1/2 cursor-pointer flex-col items-center gap-2.5 transition-colors duration-300 lg:flex"
    >
      {/* Half of Scroll’s h-16 track; rotate so the red beacon runs upward */}
      <span
        className={`portfolio-scroll-track relative h-8 w-px overflow-hidden rotate-180 ${track}`}
        aria-hidden
      >
        <span className="portfolio-scroll-beacon absolute inset-x-0 top-0 h-full w-full bg-erythro-500" />
      </span>
      <span className={`font-sans text-[9px] uppercase tracking-[0.18em] ${muted}`}>Top</span>
    </button>
  )
}
