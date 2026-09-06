'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Button from './Button'
import HeroAnimation from './HeroAnimation'
import { useSiteContent } from './SiteContentProvider'
import { useContactModal } from './ContactModal'
import { isContactModalHref, navigateCtaHref } from '@/lib/ctaNav'
import { scrollToLetsTalk } from '@/lib/letsTalkScroll'
import { waitForPostLcpMotion } from '@/lib/lcpGate'

interface HeroSectionProps {
  locale: string
  theme?: 'light' | 'dark'
  navbar?: React.ReactNode
}

type MotionTextComponent = React.ComponentType<{
  phrases: { text: string; outline: string }[]
  layoutReserveText?: string
  className?: string
}>

/** Mirrors HeroMotionText first-paint DOM so swap after LCP does not CLS. */
function HeroHeadlineStatic({
  text,
  layoutReserveText,
}: {
  text: string
  layoutReserveText?: string
}) {
  const slot =
    (layoutReserveText && layoutReserveText.trim()) || text.trim() || '—'

  return (
    <div className="relative inline-flex min-w-0 w-full max-w-full items-center justify-center overflow-visible lg:w-auto">
      <span
        aria-hidden
        className="invisible block w-full max-w-full whitespace-normal py-[0.12em] text-center lg:w-auto lg:max-w-[min(100%,calc(100%-2rem))] lg:whitespace-nowrap"
      >
        {slot}
      </span>
      <span className="absolute inset-0 flex w-full flex-wrap content-center items-center justify-center whitespace-normal py-[0.12em] text-center lg:w-auto lg:flex-nowrap lg:whitespace-nowrap">
        {text}
      </span>
    </div>
  )
}

export default function HeroSection({ locale, theme = 'dark', navbar }: HeroSectionProps) {
  const translations = useSiteContent().hero
  const { open: openContact } = useContactModal()
  const t = (field: Record<string, string>) => field[locale] || field['en']
  const isLight = theme === 'light'
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [chromeIn, setChromeIn] = useState(false)
  const [MotionText, setMotionText] = useState<MotionTextComponent | null>(null)

  const motionPhrases = useMemo(() => {
    const pick = (dict: Record<string, string> | undefined, fallback = '') =>
      (dict?.[locale] || dict?.en || fallback).trim()

    const fromCms = (translations.motionHeadings ?? [])
      .map((phrase) => {
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

    const fallback = t(translations.mainHeading)
    return fallback ? [{ text: fallback, outline: fallback }] : []
  }, [locale, translations.mainHeading, translations.motionHeadings])

  /** Longest phrase across locales — keeps heading box stable when ISR hydrates locale. */
  const layoutReserveText = useMemo(() => {
    const locales = ['en', 'ru', 'he'] as const
    let longest = ''
    for (const phrase of translations.motionHeadings ?? []) {
      for (const loc of locales) {
        let text = ''
        if (phrase && typeof phrase === 'object' && 'text' in phrase) {
          const dict = phrase.text as Record<string, string>
          text = (dict?.[loc] || dict?.en || '').trim()
        } else if (phrase && typeof phrase === 'object') {
          const dict = phrase as Record<string, string>
          text = (dict?.[loc] || dict?.en || '').trim()
        }
        if (text.length > longest.length) longest = text
      }
    }
    const main = translations.mainHeading
    for (const loc of locales) {
      const text = (main?.[loc] || main?.en || '').trim()
      if (text.length > longest.length) longest = text
    }
    return longest
  }, [translations.mainHeading, translations.motionHeadings])

  const firstPhrase = motionPhrases[0]?.text || t(translations.mainHeading)

  const handleFindOutMoreClick = () => {
    const href = (translations.ctaHref || '#contacts').trim()

    if (isContactModalHref(href)) {
      openContact()
      return
    }

    if (href === '#contacts' || href === '') {
      scrollToLetsTalk({ behavior: 'smooth' })
      return
    }

    navigateCtaHref(href, { openContact })
  }

  // After LCP: load HeroMotionText chunk + reveal chrome (no GSAP on critical path).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready
      } catch {
        /* ignore */
      }
      await waitForPostLcpMotion()
      if (cancelled) return
      setChromeIn(true)
      const mod = await import('./HeroMotionText')
      if (cancelled) return
      setMotionText(() => mod.default)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const chromeClass = chromeIn
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-5'

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
        <span
          className={`hero-pre-heading font-sans text-xs md:text-sm font-bold tracking-[0.25em] text-gold-500 uppercase select-none px-[30px] mb-[18px] lg:relative lg:-top-6 lg:mb-2 transition-[opacity,transform] duration-700 ease-out ${chromeClass} ${chromeIn ? '' : 'animate-pulse'}`}
        >
          {t(translations.preHeading)}
        </span>

        <h1 className="hero-heading font-display-5xl !font-bold uppercase mt-0 mb-0 flex min-w-0 w-full max-w-full items-center justify-center select-text tracking-tight px-5 text-center whitespace-normal lg:mt-2 lg:mb-2 lg:px-4 lg:whitespace-nowrap !text-[clamp(28px,9.5vw,48px)] !leading-[1.12] lg:!text-[clamp(36px,4.8vw,72px)] lg:!leading-[1.15] text-gold-500 min-h-[calc(1.12em+0.24em)] lg:min-h-[calc(1.15em+0.24em)]">
          {MotionText ? (
            <MotionText phrases={motionPhrases} layoutReserveText={layoutReserveText} />
          ) : (
            <HeroHeadlineStatic text={firstPhrase} layoutReserveText={layoutReserveText} />
          )}
        </h1>

        <p
          className={`hero-subtext font-body-lead text-gold-100 mt-4 w-full max-w-full select-text px-[30px] text-center whitespace-normal lg:mt-7 transition-[opacity,transform] duration-700 ease-out delay-100 ${chromeClass}`}
        >
          {t(translations.subtext)}
        </p>

        <div
          className={`hero-buttons flex items-center justify-center gap-4 mt-6 w-full px-[30px] lg:mt-10 transition-[opacity,transform] duration-700 ease-out delay-150 ${chromeClass}`}
        >
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
