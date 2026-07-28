'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useBackdropContrast } from '@/hooks/useBackdropContrast'
import { getSectionElement } from '@/lib/domSection'

interface ScrollSideButtonProps {
  label?: string
  theme?: 'light' | 'dark'
  /** Section element ids in page order — used for 01|04 counter and scroll targets. */
  sectionIds?: string[]
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * Side scroll control:
 * Top → animated line → Scroll, with section counter on either side of the line.
 * Hover Top: pause fill, turn Top + line red. Click Top → page top; Click Scroll → next section.
 */
export default function ScrollSideButton({
  label = 'Scroll',
  theme = 'dark',
  sectionIds = ['portfolio', 'contacts', 'footer'],
}: ScrollSideButtonProps) {
  const total = sectionIds.length
  const [current, setCurrent] = useState(1)
  const [topHover, setTopHover] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const overDark = useBackdropContrast(rootRef, theme)

  useEffect(() => {
    const update = () => {
      const mid = window.innerHeight * 0.45
      let active = 1

      sectionIds.forEach((id, index) => {
        const el = getSectionElement(id)
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToNext = () => {
    const nextIndex = Math.min(current, total - 1)
    const nextId = sectionIds[nextIndex]
    const target = nextId ? getSectionElement(nextId) : null
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
    <div
      ref={rootRef}
      data-contrast-ignore
      className="portfolio-scroll-hint pointer-events-auto fixed end-[44px] top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2.5 transition-colors duration-300 lg:flex"
      aria-label={`Section ${pad2(current)} of ${pad2(total)}`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        onMouseEnter={() => setTopHover(true)}
        onMouseLeave={() => setTopHover(false)}
        onFocus={() => setTopHover(true)}
        onBlur={() => setTopHover(false)}
        aria-label="Back to top"
        className={`cursor-pointer font-sans text-[9px] uppercase tracking-[0.18em] [writing-mode:vertical-lr] rotate-180 transition-colors duration-300 ${
          topHover ? 'text-erythro-500' : muted
        }`}
      >
        Top
      </button>

      <div className="flex items-center gap-2">
        <span
          className={`font-sans text-[9px] uppercase tracking-[0.18em] tabular-nums ${primary}`}
          aria-hidden
        >
          {pad2(current)}
        </span>

        <span
          className={`portfolio-scroll-track relative h-16 w-px overflow-hidden transition-colors duration-300 ${
            topHover ? 'bg-erythro-500' : track
          }`}
          aria-hidden
        >
          {!topHover ? (
            <span className="portfolio-scroll-beacon absolute inset-x-0 top-0 h-full w-full bg-erythro-500" />
          ) : null}
        </span>

        <span
          className={`font-sans text-[9px] uppercase tracking-[0.18em] tabular-nums ${mutedSoft}`}
          aria-hidden
        >
          {pad2(total)}
        </span>
      </div>

      <button
        type="button"
        onClick={scrollToNext}
        aria-label={`${label}, next section`}
        className={`cursor-pointer font-sans text-[9px] uppercase tracking-[0.18em] [writing-mode:vertical-lr] rotate-180 transition-colors duration-300 ${muted}`}
      >
        {label}
      </button>
    </div>
  )
}
