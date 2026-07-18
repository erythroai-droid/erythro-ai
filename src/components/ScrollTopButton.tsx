'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useBackdropContrast } from '@/hooks/useBackdropContrast'

interface ScrollTopButtonProps {
  theme?: 'light' | 'dark'
  /** Show after scrolling past this many pixels. */
  threshold?: number
}

function TopArrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  )
}

/**
 * Refined “Top” control — half-height upward arrow + label, bottom-center on desktop.
 * Red fill animates through the arrow like Scroll’s beacon; color otherwise follows contrast.
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
  const stroke = overDark ? 'text-white/20' : 'text-coal-500/20'

  return (
    <button
      ref={btnRef}
      type="button"
      data-contrast-ignore
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className="portfolio-scroll-hint pointer-events-auto fixed bottom-8 start-1/2 z-40 hidden -translate-x-1/2 cursor-pointer flex-col items-center gap-2 transition-colors duration-300 lg:flex"
    >
      {/* Muted arrow + red beacon sweeping upward (same motion as Scroll, reversed) */}
      <span className="relative block h-5 w-3 overflow-hidden" aria-hidden>
        <TopArrow className={`absolute inset-0 h-5 w-3 ${stroke}`} />
        <span className="absolute inset-0 overflow-hidden rotate-180">
          <span className="portfolio-scroll-beacon absolute inset-x-0 top-0 h-full w-full">
            <TopArrow className="absolute inset-0 h-5 w-3 rotate-180 text-erythro-500" />
          </span>
        </span>
      </span>
      <span className={`font-sans text-[9px] uppercase tracking-[0.18em] ${muted}`}>Top</span>
    </button>
  )
}
