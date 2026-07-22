'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Button from './Button'
import HeroAnimation from './HeroAnimation'
import HeroMotionText from './HeroMotionText'
import { useSiteContent } from './SiteContentProvider'
import { hero as heroCopy } from '@/translations'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface HeroSectionProps {
  locale: string
  theme?: 'light' | 'dark'
  navbar?: React.ReactNode
}

export default function HeroSection({ locale, theme = 'dark', navbar }: HeroSectionProps) {
  const translations = useSiteContent().hero
  const t = (field: Record<string, string>) => field[locale] || field['en']
  const isLight = theme === 'light'
  const containerRef = useRef<HTMLDivElement | null>(null)
  const motionPhrases = useMemo(
    () =>
      heroCopy.motionHeadings
        .map((phrase) => (phrase[locale] || phrase.en || '').trim())
        .filter(Boolean),
    [locale],
  )

  const handleFindOutMoreClick = () => {
    const isMobile = window.innerWidth < 1024
    if (isMobile) {
      const target = document.getElementById('contacts')
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      const st = ScrollTrigger.getById('services-pin')
      if (st) {
        // Let's Talk is fully open at ~80% of the timeline scroll distance
        const scrollPosition = st.start + 0.8 * (st.end - st.start)
        window.scrollTo({ top: scrollPosition, behavior: 'smooth' })
      } else {
        const target = document.querySelector('footer')
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }

  useEffect(() => {
    if (!containerRef.current) return

    const preHeading = containerRef.current.querySelector('.hero-pre-heading')
    const heading = containerRef.current.querySelector('.hero-heading')
    const subtext = containerRef.current.querySelector('.hero-subtext')
    const buttons = containerRef.current.querySelector('.hero-buttons')

    // Prepare initial position
    gsap.set([preHeading, heading, subtext, buttons], { y: 20 })

    // Animate timeline with a slight delay for smooth initial rendering
    const tl = gsap.timeline({ delay: 0.3 })
    tl.to(preHeading, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
      .to(heading, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
      .to(subtext, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
      .to(buttons, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
  }, [])

  return (
    <HeroAnimation videoUrl={translations.backgroundImage} navbar={navbar}>
      <div
        ref={containerRef}
        className="relative mx-auto mt-12 flex w-full flex-col items-center gap-6 text-center select-none md:mt-16"
      >
        {/* Pre-Heading tag */}
        <span className="hero-pre-heading opacity-0 font-mono text-xs md:text-sm font-bold tracking-[0.25em] text-gold-500 uppercase select-none animate-pulse px-[30px]">
          {t(translations.preHeading)}
        </span>

        {/* Full-bleed rotating headline — no wrap on large screens */}
        <h1
          className={`hero-heading opacity-0 font-display-5xl !font-bold uppercase mt-2 mb-2 flex w-screen max-w-none items-center justify-center select-text tracking-tight px-4 lg:whitespace-nowrap lg:text-[clamp(40px,5.5vw,72px)] lg:leading-[1.15] ${
            isLight ? 'text-gold-100' : 'text-gold-500'
          }`}
        >
          <HeroMotionText phrases={motionPhrases} theme={theme} />
        </h1>

        {/* Description subtext matching Figma geometry spacing & leading */}
        <p className="hero-subtext opacity-0 font-body-lead text-gold-100 mt-2 w-full max-w-none select-text px-[30px] text-center lg:whitespace-nowrap">
          {t(translations.subtext)}
        </p>

        {/* Action Button Group */}
        <div className="hero-buttons opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full sm:w-auto px-[30px]">
          <Button
            onClick={handleFindOutMoreClick}
            variant="gold-outline"
            className={`w-full sm:w-auto min-w-[180px] ${
              isLight
                ? 'hover:!border-erythro-500 hover:!bg-erythro-500 hover:!text-white'
                : 'hover:!border-gold-500 hover:!bg-gold-500 hover:!text-coal-900'
            }`}
          >
            {t(translations.ctaFind)}
          </Button>
        </div>
      </div>
    </HeroAnimation>
  )
}
