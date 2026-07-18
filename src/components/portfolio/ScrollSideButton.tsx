'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useBackdropContrast } from '@/hooks/useBackdropContrast'

interface ScrollSideButtonProps {
  label?: string
  theme?: 'light' | 'dark'
  /** Section element ids in page order — used for 01|04 counter and scroll targets. */
  sectionIds?: string[]
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export default function ScrollSideButton({
  label = 'Scroll',
  theme = 'dark',
  sectionIds = ['portfolio', 'contacts', 'footer'],
}: ScrollSideButtonProps) {
  const total = sectionIds.length
  const [current, setCurrent] = useState(1)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const overDark = useBackdropContrast(btnRef, theme)

  useEffect(() => {
    const update = () => {
      const mid = window.innerHeight * 0.45
      let active = 1

      sectionIds.forEach((id, index) => {
        const el = document.getElementById(id)
        if (!el) return
        const rect = el.getBoundingClientRect()
        if (rect.top <= mid && rect.bottom > mid * 0.35) {
          active = index + 1
        }
      })

      setCurrent(active)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [sectionIds])

  const handleClick = () => {
    const nextIndex = Math.min(current, total - 1)
    const nextId = sectionIds[nextIndex]
    const target = nextId ? document.getElementById(nextId) : null
    if (target && current < total) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' })
  }

  const primary = overDark ? 'text-white/90' : 'text-coal-500'
  const muted = overDark ? 'text-gold-800' : 'text-coal-500'
  const mutedSoft = overDark ? 'text-gold-800' : 'text-coal-500/50'
  const track = overDark ? 'bg-white/20' : 'bg-coal-500/20'

  return (
    <button
      ref={btnRef}
      type="button"
      data-contrast-ignore
      onClick={handleClick}
      className="portfolio-scroll-hint pointer-events-auto fixed end-[44px] top-1/2 z-40 hidden -translate-y-1/2 cursor-pointer flex-col items-center gap-2.5 transition-colors duration-300 lg:flex"
      aria-label={`${label}, section ${pad2(current)} of ${pad2(total)}`}
    >
      <span className="flex items-start gap-2">
        <span
          className={`pt-0.5 font-sans text-[9px] uppercase tracking-[0.18em] tabular-nums ${primary}`}
          aria-hidden
        >
          {pad2(current)}
        </span>

        <span className="flex flex-col items-center gap-2.5">
          <span
            className={`portfolio-scroll-track relative h-16 w-px overflow-hidden ${track}`}
            aria-hidden
          >
            <span className="portfolio-scroll-beacon absolute inset-x-0 top-0 h-full w-full bg-erythro-500" />
          </span>
          <span
            className={`font-sans text-[9px] uppercase tracking-[0.18em] [writing-mode:vertical-lr] ${muted}`}
          >
            {label}
          </span>
        </span>

        <span
          className={`pt-0.5 font-sans text-[9px] uppercase tracking-[0.18em] tabular-nums ${mutedSoft}`}
          aria-hidden
        >
          {pad2(total)}
        </span>
      </span>
    </button>
  )
}
