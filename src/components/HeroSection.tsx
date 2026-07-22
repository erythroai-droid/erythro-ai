'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Button from './Button'
import HeroAnimation from './HeroAnimation'
import HeroMotionText from './HeroMotionText'
import { useSiteContent } from './SiteContentProvider'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface HeroSectionProps {
  locale: string
  navbar?: React.ReactNode
}

export default function HeroSection({ locale, navbar }: HeroSectionProps) {
  const translations = useSiteContent().hero
  const t = (field: Record<string, string>) => field[locale] || field['en']
  const containerRef = useRef<HTMLDivElement | null>(null)
  const motionPhrases = useMemo(() => {
    const pick = (phrase: Record<string, string>) =>
      (phrase[locale] || phrase.en || '').trim()

    const fromCms = (translations.motionHeadings ?? []).map(pick).filter(Boolean)
    if (fromCms.length >= 2) return fromCms

    const fallbacks = [
      translations.mainHeading,
      {
        en: 'Intelligent systems that scale',
        ru: 'Интеллектуальные системы',
        he: 'מערכות חכמות שצומחות',
      },
      {
        en: 'Design that drives growth',
        ru: 'Дизайн, который растёт с вами',
        he: 'עיצוב שמניע צמיחה',
      },
      {
        en: 'Automation with precision',
        ru: 'Автоматизация с точностью',
        he: 'אוטומציה מדויקת',
      },
    ].map(pick).filter(Boolean)

    return fallbacks
  }, [locale, translations.mainHeading, translations.motionHeadings])

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
        className="relative max-w-[1170px] mx-auto px-[30px] flex flex-col items-center text-center gap-6 mt-12 md:mt-16 select-none"
      >
        {/* Pre-Heading tag */}
        <span className="hero-pre-heading opacity-0 font-mono text-xs md:text-sm font-bold tracking-[0.25em] text-gold-500 uppercase select-none animate-pulse">
          {t(translations.preHeading)}
        </span>

        {/* Rotating motion headline — Display 5XL */}
        <h1 className="hero-heading opacity-0 font-display-5xl text-gold-500 max-w-4xl mt-2 mb-2 w-full select-text">
          <HeroMotionText phrases={motionPhrases} />
        </h1>

        {/* Description subtext matching Figma geometry spacing & leading */}
        <p className="hero-subtext opacity-0 font-body-lead text-gold-100 max-w-3xl leading-relaxed mt-2 select-text">
          {t(translations.subtext)}
        </p>

        {/* Action Button Group */}
        <div className="hero-buttons opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full sm:w-auto">
          <Button
            onClick={handleFindOutMoreClick}
            variant="gold-outline"
            className="w-full sm:w-auto min-w-[180px]"
          >
            {t(translations.ctaFind)}
          </Button>
        </div>
      </div>
    </HeroAnimation>
  )
}
