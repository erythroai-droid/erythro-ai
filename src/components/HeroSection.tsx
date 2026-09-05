'use client'

import React, { useEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import Button from './Button'
import HeroAnimation from './HeroAnimation'
import HeroMotionText from './HeroMotionText'
import { useSiteContent } from './SiteContentProvider'
import { useContactModal } from './ContactModal'
import { isContactModalHref, navigateCtaHref } from '@/lib/ctaNav'
import { scrollToLetsTalk } from '@/lib/letsTalkScroll'
import { waitForSplashDone } from '@/lib/splash'

interface HeroSectionProps {
  locale: string
  theme?: 'light' | 'dark'
  navbar?: React.ReactNode
}

export default function HeroSection({ locale, theme = 'dark', navbar }: HeroSectionProps) {
  const translations = useSiteContent().hero
  const { open: openContact } = useContactModal()
  const t = (field: Record<string, string>) => field[locale] || field['en']
  const isLight = theme === 'light'
  const containerRef = useRef<HTMLDivElement | null>(null)
  const motionPhrases = useMemo(() => {
    const pick = (dict: Record<string, string> | undefined, fallback = '') =>
      (dict?.[locale] || dict?.en || fallback).trim()

    const fromCms = (translations.motionHeadings ?? [])
      .map((phrase) => {
        // New shape: { text, outline }; legacy flat: { en, ru, he }
        if (phrase && typeof phrase === 'object' && 'text' in phrase) {
          const text = pick(phrase.text as Record<string, string>)
          const outline = pick(phrase.outline as Record<string, string> | undefined, text)
          return text ? { text, outline: outline || text } : null
        }
        const text = pick(phrase as Record<string, string>)
        return text ? { text, outline: text } : null
      })
      .filter((p): p is { text: string; outline: string } => Boolean(p))

    if (fromCms.length >= 2) return fromCms

    // Fallback if CMS Motion Headings are empty
    const fallback = t(translations.mainHeading)
    return fallback ? [{ text: fallback, outline: fallback }] : []
  }, [locale, translations.mainHeading, translations.motionHeadings])

  const handleFindOutMoreClick = () => {
    const href = (translations.ctaHref || '#contacts').trim()

    if (isContactModalHref(href)) {
      openContact()
      return
    }

    // Preserve legacy dual scroll when pointing at contacts / Let’s Talk
    if (href === '#contacts' || href === '') {
      scrollToLetsTalk({ behavior: 'smooth' })
      return
    }

    navigateCtaHref(href, { openContact })
  }

  useEffect(() => {
    if (!containerRef.current) return

    const preHeading = containerRef.current.querySelector('.hero-pre-heading')
    const heading = containerRef.current.querySelector('.hero-heading')
    const subtext = containerRef.current.querySelector('.hero-subtext')
    const buttons = containerRef.current.querySelector('.hero-buttons')

    // LCP: keep the headline readable in first paint. Animate only siblings from
    // opacity 0; heading starts visible so GSAP/splash wait is not render-delay.
    gsap.set([preHeading, subtext, buttons], { y: 20, opacity: 0 })
    gsap.set(heading, { y: 12, opacity: 1 })

    let cancelled = false
    const tl = gsap.timeline({ paused: true })
    tl.to(preHeading, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out',
      clearProps: 'transform',
    })
      .to(
        heading,
        { y: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform' },
        '-=0.4',
      )
      .to(
        subtext,
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform' },
        '-=0.5',
      )
      .to(
        buttons,
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform' },
        '-=0.5',
      )

    // Wait for fonts so HeroMotionText can lock mobile type size before the
    // intro fades in — otherwise the first lock after splash jerks subtitles.
    // Wait for splash so pre/heading stay opacity-0 under the brand overlay.
    ;(async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready
      } catch {
        /* ignore */
      }
      if (cancelled) return
      await waitForSplashDone()
      if (cancelled) return
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      if (cancelled) return
      tl.delay(0.15)
      tl.play()
    })()
    return () => {
      cancelled = true
      tl.kill()
    }
  }, [])

  return (
    <HeroAnimation
      videoUrl={translations.backgroundImage}
      mobileImageUrl={translations.backgroundImageMobile}
      posterUrl={translations.backgroundImageMobile}
      navbar={navbar}
    >
      <div
        ref={containerRef}
        className="relative mx-auto mt-12 flex w-full max-lg:-translate-y-10 flex-col items-center gap-3 text-center select-none md:mt-16 lg:gap-6"
      >
        {/* Pre-Heading tag */}
        <span className="hero-pre-heading opacity-0 font-sans text-xs md:text-sm font-bold tracking-[0.25em] text-gold-500 uppercase select-none animate-pulse px-[30px] mb-[18px] lg:relative lg:-top-6 lg:mb-2">
          {t(translations.preHeading)}
        </span>

        {/* Full-bleed rotating headline — no wrap on large screens */}
        <h1
          className="hero-heading font-display-5xl !font-bold uppercase mt-0 mb-0 flex min-w-0 w-full max-w-full items-center justify-center select-text tracking-tight px-5 text-center whitespace-normal lg:mt-2 lg:mb-2 lg:px-4 lg:whitespace-nowrap !text-[clamp(28px,9.5vw,48px)] !leading-[1.12] lg:!text-[clamp(36px,4.8vw,72px)] lg:!leading-[1.15] text-gold-500 lg:min-h-[1.15em]"
        >
          <HeroMotionText phrases={motionPhrases} />
        </h1>

        {/* Description subtext matching Figma geometry spacing & leading */}
        <p className="hero-subtext opacity-0 font-body-lead text-gold-100 mt-4 w-full max-w-full select-text px-[30px] text-center whitespace-normal lg:mt-7">
          {t(translations.subtext)}
        </p>

        {/* Action Button Group */}
        <div className="hero-buttons opacity-0 flex items-center justify-center gap-4 mt-6 w-full px-[30px] lg:mt-10">
          <Button
            onClick={handleFindOutMoreClick}
            variant="gold-outline"
            className={`w-auto min-w-[183px] ${
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
