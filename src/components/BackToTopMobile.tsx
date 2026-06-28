'use client'

import { useEffect, useState } from 'react'

interface BackToTopMobileProps {
  locale?: string
}

/**
 * Standalone "back to top" button for mobile/tablet.
 *
 * On desktop this lives in `FloatingWidget`, but on mobile the floating widget is
 * hidden (its controls were moved into the burger menu). This restores just the
 * scroll-to-top affordance on small screens. Appears once the user scrolls past
 * the hero (~300px) and is hidden on lg+.
 */
export default function BackToTopMobile({ locale = 'en' }: BackToTopMobileProps) {
  const [show, setShow] = useState(false)
  const isRTL = locale === 'he'

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 300)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={locale === 'ru' ? 'Наверх' : locale === 'he' ? 'למעלה' : 'Back to top'}
      className={`lg:hidden fixed bottom-[18px] z-50 w-[44px] h-[44px] rounded-full bg-coal-800 text-white border border-white/10 flex items-center justify-center shadow-lg transition-all duration-300 ${
        isRTL ? 'left-[18px]' : 'right-[18px]'
      } ${
        show
          ? 'opacity-100 scale-100 pointer-events-auto'
          : 'opacity-0 scale-0 pointer-events-none'
      }`}
    >
      <svg
        className="w-[16px] h-[16px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
      </svg>
    </button>
  )
}
