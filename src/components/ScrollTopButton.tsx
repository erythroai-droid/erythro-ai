'use client'

import React, { useEffect, useState } from 'react'

interface ScrollTopButtonProps {
  theme?: 'light' | 'dark'
  /** Show after scrolling past this many pixels. */
  threshold?: number
}

/**
 * Refined “Top” control in the same visual language as ScrollSideButton —
 * thin beacon line + vertical label, fixed bottom-center on desktop.
 */
export default function ScrollTopButton({
  theme = 'dark',
  threshold = 400,
}: ScrollTopButtonProps) {
  const [visible, setVisible] = useState(false)
  const isLight = theme === 'light'

  useEffect(() => {
    const update = () => setVisible(window.scrollY > threshold)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [threshold])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="portfolio-scroll-hint pointer-events-auto fixed bottom-8 start-1/2 z-40 hidden -translate-x-1/2 cursor-pointer flex-col items-center gap-2.5 lg:flex"
    >
      <span
        className={`portfolio-scroll-track relative h-10 w-px overflow-hidden rotate-180 ${
          isLight ? 'bg-coal-500/20' : 'bg-white/20'
        }`}
        aria-hidden
      >
        <span className="portfolio-scroll-beacon absolute inset-x-0 top-0 h-full w-full bg-erythro-500" />
      </span>
      <span
        className={`font-sans text-[9px] uppercase tracking-[0.18em] ${
          isLight ? 'text-coal-500' : 'text-gold-800'
        }`}
      >
        Top
      </span>
    </button>
  )
}
