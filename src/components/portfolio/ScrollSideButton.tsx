'use client'

import React from 'react'

interface ScrollSideButtonProps {
  label?: string
  targetId?: string
}

export default function ScrollSideButton({
  label = 'Scroll',
  targetId = 'portfolio-grid',
}: ScrollSideButtonProps) {
  const handleClick = () => {
    const target = document.getElementById(targetId)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="portfolio-scroll-hint pointer-events-auto fixed end-[44px] top-[110px] z-40 hidden flex-col items-center gap-2.5 lg:flex"
      aria-label={label}
    >
      <span className="portfolio-scroll-track relative h-16 w-px overflow-hidden bg-white/20" aria-hidden>
        <span className="portfolio-scroll-beacon absolute inset-x-0 top-0 h-full w-full bg-erythro-500" />
      </span>
      <span className="font-sans text-[9px] uppercase tracking-[0.18em] text-gold-800 [writing-mode:vertical-lr]">
        {label}
      </span>
    </button>
  )
}
