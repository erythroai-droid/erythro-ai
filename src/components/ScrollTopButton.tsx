'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useBackdropContrast } from '@/hooks/useBackdropContrast'

interface ScrollTopButtonProps {
  theme?: 'light' | 'dark'
  /** Show after scrolling past this many pixels. */
  threshold?: number
}

/**
 * Refined “Top” control — half-height upward arrow + label, bottom-center on desktop.
 * Color follows backdrop contrast (same idea as Menu).
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
  const stroke = overDark ? 'text-white/50' : 'text-coal-500/50'

  return (
    <button
      ref={btnRef}
      type="button"
      data-contrast-ignore
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="pointer-events-auto fixed bottom-8 start-1/2 z-40 hidden -translate-x-1/2 cursor-pointer flex-col items-center gap-2 transition-colors duration-300 lg:flex"
    >
      {/* Half the old 40px line → 20px tall upward arrow */}
      <svg
        className={`h-5 w-3 ${stroke}`}
        viewBox="0 0 12 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M6 18V5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M2 8.5L6 4L10 8.5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`font-sans text-[9px] uppercase tracking-[0.18em] ${muted}`}>Top</span>
    </button>
  )
}
