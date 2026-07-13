'use client'

import React, { useEffect, useState } from 'react'

interface ScrollSideButtonProps {
  label?: string
  /** Section element ids in page order — used for 01|04 counter and scroll targets. */
  sectionIds?: string[]
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export default function ScrollSideButton({
  label = 'Scroll',
  sectionIds = ['portfolio', 'contacts', 'footer'],
}: ScrollSideButtonProps) {
  const total = sectionIds.length
  const [current, setCurrent] = useState(1)

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

  return (
    <button
      type="button"
      onClick={handleClick}
      className="portfolio-scroll-hint pointer-events-auto fixed end-[44px] top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2.5 lg:flex"
      aria-label={`${label}, section ${pad2(current)} of ${pad2(total)}`}
    >
      <span className="flex items-start gap-2">
        <span
          className="pt-0.5 font-sans text-[9px] uppercase tracking-[0.18em] text-white/90 tabular-nums"
          aria-hidden
        >
          {pad2(current)}
        </span>

        <span className="flex flex-col items-center gap-2.5">
          <span className="portfolio-scroll-track relative h-16 w-px overflow-hidden bg-white/20" aria-hidden>
            <span className="portfolio-scroll-beacon absolute inset-x-0 top-0 h-full w-full bg-erythro-500" />
          </span>
          <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-gold-800 [writing-mode:vertical-lr]">
            {label}
          </span>
        </span>

        <span
          className="pt-0.5 font-sans text-[9px] uppercase tracking-[0.18em] text-gold-800 tabular-nums"
          aria-hidden
        >
          {pad2(total)}
        </span>
      </span>
    </button>
  )
}
