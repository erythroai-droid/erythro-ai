'use client'

import React, { useEffect, useRef } from 'react'
import { useRouter } from 'nextjs-toploader/app'
import { useSiteContent } from './SiteContentProvider'
import Button from './Button'
import { currencySymbol } from '@/lib/orderPlans'
import { useCursorGlow } from '@/hooks/useCursorGlow'
import { useContactModal } from './ContactModal'
import { isContactModalHref, navigateCtaHref } from '@/lib/ctaNav'
import StylizedSectionTitle from './StylizedSectionTitle'
import BidiText from './BidiText'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface SolutionSectionProps {
  locale: string
  theme?: 'light' | 'dark'
}

interface SolutionFeature {
  label?: Record<string, string>
  value?: Record<string, string>
}

interface SolutionCardData {
  id: string
  price: string
  currency?: string
  pricePrefix?: Record<string, string>
  priceNote?: boolean
  originalPrice?: string
  title: Record<string, string>
  features: SolutionFeature[]
  disclaimer?: Record<string, string>
  featured?: boolean
  ctaHref?: string
}

function capitalizeFeatureLabel(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function SolutionCard({
  card,
  locale,
  ctaLabel,
  sectionCtaHref,
  theme = 'dark',
}: {
  card: SolutionCardData
  locale: string
  ctaLabel: string
  sectionCtaHref?: string
  theme?: 'light' | 'dark'
}) {
  const t = (field: Record<string, string>) => field[locale] || field['en']
  const router = useRouter()
  const { open: openContact } = useContactModal()

  const isFeatured = card.featured
  const isLight = theme === 'light'

  const solutionButtonClassName = isFeatured
    ? 'border-white text-white hover:bg-white hover:text-coal-900 hover:border-white active:bg-white active:text-coal-900 active:border-white aria-busy:bg-white aria-busy:text-coal-900 aria-busy:border-white'
    : isLight
      ? 'border-coal-900 text-coal-900 hover:!bg-erythro-500 hover:!text-white hover:!border-erythro-500 active:!bg-erythro-500 active:!text-white active:!border-erythro-500 aria-busy:!bg-erythro-500 aria-busy:!text-white aria-busy:!border-erythro-500'
      : 'border-[var(--Button-Tertiary-link,#FFE9C7)] text-[var(--Button-Tertiary-link,#FFE9C7)] hover:bg-[var(--Button-Tertiary-link,#FFE9C7)] hover:text-coal-900 hover:border-[var(--Button-Tertiary-link,#FFE9C7)] active:bg-[var(--Button-Tertiary-link,#FFE9C7)] active:text-coal-900 active:border-[var(--Button-Tertiary-link,#FFE9C7)] aria-busy:bg-[var(--Button-Tertiary-link,#FFE9C7)] aria-busy:text-coal-900 aria-busy:border-[var(--Button-Tertiary-link,#FFE9C7)]'

  const handleCta = () => {
    const href = (card.ctaHref || sectionCtaHref || '').trim()
    if (!href) {
      router.push(`/order/${card.id}`)
      return
    }
    if (isContactModalHref(href)) {
      openContact('order')
      return
    }
    if (href.startsWith('/') && !href.startsWith('//')) {
      router.push(href)
      return
    }
    navigateCtaHref(href, { openContact: () => openContact('order') })
  }

  const cardWidthClass = isFeatured ? 'w-[300px] flex-none' : 'w-[270px] flex-none'

  return (
    <article
      className={`relative flex ${cardWidthClass} flex-col items-center gap-2 rounded-[10px] px-4 py-[30px] transition-shadow duration-300 ease-out lg:snap-center ${
        isFeatured
          ? 'max-lg:mb-4 min-h-[560px] h-auto bg-erythro-600 shadow-[0_5px_50px_0_rgba(13,13,13,0.3)] hover:shadow-[0_10px_44px_0_rgba(13,13,13,0.38)] lg:min-h-[540px] xl:min-h-[570px]'
          : isLight
            ? 'min-h-[530px] h-auto border border-white bg-white shadow-card-services hover:shadow-[0_8px_26px_0_rgba(13,13,13,0.22)] lg:min-h-[510px] xl:min-h-[530px]'
            : 'min-h-[530px] h-auto border border-gold-500 bg-[#1E1E1E] hover:shadow-[0_8px_26px_0_rgba(0,0,0,0.45)] lg:min-h-[510px] xl:min-h-[530px]'
      }`}
    >
      {card.pricePrefix && (
        <span
          className={`absolute top-[13px] font-bold text-sm uppercase ${
            isFeatured ? 'text-white' : isLight ? 'text-coal-900' : 'text-gold-500'
          } ${locale === 'he' ? 'start-4' : 'end-4'}`}
        >
          {t(card.pricePrefix)}
        </span>
      )}

      {card.originalPrice && (
        <p
          dir="ltr"
          className={`absolute top-[17px] font-bold text-sm uppercase text-white ${
            locale === 'he' ? 'start-4' : 'end-4'
          }`}
        >
          <span>{currencySymbol(card.currency)}</span>{' '}
          <span className="line-through">{card.originalPrice}</span>
        </p>
      )}

      <div className="relative flex min-h-[70px] w-full items-center justify-center py-2 text-center">
        <p
          dir="ltr"
          className={`font-bold uppercase leading-tight ${
            isFeatured ? 'text-white' : isLight ? 'text-coal-900' : 'text-gold-500'
          }`}
        >
          <span className="text-[1.6125rem] leading-tight">{currencySymbol(card.currency)}</span>{' '}
          <span className="text-[2.5rem] leading-tight">{card.price}</span>
          {card.priceNote && (
            <span className="relative -top-5 inline-block text-sm leading-none">*</span>
          )}
        </p>
      </div>

      <div
        className={`flex min-h-[30px] w-full items-center justify-center rounded-[2px] px-2 py-1.5 ${
          isFeatured ? 'bg-white' : isLight ? 'bg-coal-900' : 'bg-gold-500'
        }`}
      >
        <span
          className={`text-center font-bold text-base uppercase leading-snug break-words hyphens-auto ${
            isFeatured ? 'text-erythro-500' : isLight ? 'text-white' : 'text-coal-900'
          }`}
        >
          {t(card.title)}
        </span>
      </div>

      <ul className="flex w-full flex-1 flex-col gap-4 py-4 ps-4">
        {card.features.map((feature, index) => {
          const labelText = feature.label ? t(feature.label).trim() : ''
          const valueText = feature.value ? t(feature.value).trim() : ''
          if (!labelText && !valueText) return null

          const dotClass = isFeatured ? 'bg-white' : 'bg-erythro-500'
          const textClass = isFeatured ? 'text-white' : isLight ? 'text-coal-900' : 'text-white'
          const labelClass = isFeatured
            ? 'text-white'
            : isLight
              ? 'text-coal-900'
              : 'text-gold-500'

          return (
            <li key={index} className="relative flex items-start gap-2.5">
              <span
                className={`absolute -start-4 top-2.5 size-1 shrink-0 rounded-[1px] ${dotClass}`}
              />
              <p className={`break-words text-base leading-6 lg:text-sm ${textClass}`}>
                {labelText ? (
                  <span className={`font-bold ${labelClass}`}>
                    {capitalizeFeatureLabel(labelText)}{' '}
                  </span>
                ) : null}
                {valueText ? <BidiText className="font-normal">{valueText}</BidiText> : null}
              </p>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto flex w-full flex-col items-center gap-4">
        <Button
          variant="solution-cta"
          className={solutionButtonClassName}
          onClick={handleCta}
        >
          {ctaLabel}
        </Button>

        {card.disclaimer && (
          <p
            className={`text-center text-[11px] leading-6 ${
              isFeatured ? 'text-white' : isLight ? 'text-coal-900' : 'text-white'
            }`}
          >
            {t(card.disclaimer)}
          </p>
        )}
      </div>
    </article>
  )
}

export default function SolutionSection({ locale, theme = 'dark' }: SolutionSectionProps) {
  const translations = useSiteContent().solutions
  const t = (field: Record<string, string>) => field[locale] || field['en']
  const isLight = theme === 'light'

  const sectionRef = useRef<HTMLElement | null>(null)
  const headingRef = useRef<HTMLDivElement | null>(null)
  const cardsRef = useRef<HTMLDivElement | null>(null)

  useCursorGlow(sectionRef)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add('(min-width: 1024px)', () => {
        gsap.set([headingRef.current, cardsRef.current], {
          opacity: 0,
          y: 60,
        })

        gsap.to([headingRef.current, cardsRef.current], {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.25,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        })

        // Keep Solutions pinned: short hold, then FAQ slides up over it
        ScrollTrigger.create({
          id: 'solutions-pin',
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=200%',
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
        })
      })

      mm.add('(max-width: 1023px)', () => {
        gsap.set([headingRef.current, cardsRef.current], { opacity: 0, y: 30 })

        gsap.to([headingRef.current, cardsRef.current], {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 92%',
            toggleActions: 'play none none reverse',
          },
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <div className="relative z-30 w-full pointer-events-none">
      {/* Lead-in while LetsTalk finishes (incl. CTA). Must be < Services pin end.
          Keep a clear full-screen Let’s Talk beat after settle (~settleAt×pin)
          so Hero/nav jumps don’t land with Solutions already overlapping. */}
      <div className="hidden lg:block h-[785vh] w-full pointer-events-none" />

      <section
        id="solutions"
        ref={sectionRef}
        data-glow-x={isLight ? '50' : '82'}
        data-glow-y={isLight ? '32' : '14'}
        className={`relative z-10 w-full overflow-hidden border-b border-coal-400/5 pt-20 pb-[100px] shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:border-t lg:py-0 lg:pt-20 lg:h-screen lg:flex lg:flex-col lg:justify-start select-none pointer-events-auto ${
          isLight ? 'solution-light-bg' : 'dark-gradient-bg'
        }`}
      >
        <div
          className="solution-section-noise absolute inset-0 z-[1] pointer-events-none"
          aria-hidden
        />

        {/* Headings container (max-w-[1170px]) */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1170px] shrink-0 flex-col items-center px-[30px] mb-4 lg:mb-5">
          <div
            ref={headingRef}
            className="flex flex-col items-center gap-[5px] text-center"
          >
            <h2 className="font-sans text-[32px] font-extralight uppercase leading-tight tracking-[9.6px] lg:text-[48px] lg:leading-[60px]">
              <StylizedSectionTitle
                text={t(translations.sectionTitle)}
                restClassName={isLight ? 'text-coal-900' : 'text-white'}
              />
            </h2>
            <p
              className={`font-sans text-base font-light leading-8 tracking-[3.2px] ${
                isLight ? 'text-gold-900' : 'text-gold-800'
              }`}
            >
              {t(translations.sectionSubtitle)}
            </p>
          </div>
        </div>

        {/* Cards container (full screen width, max-w-none) */}
        <div
          ref={cardsRef}
          className="solution-cards-track relative z-10 flex min-h-0 w-full flex-1 flex-col items-center gap-[30px] px-[30px] pt-2 pb-16 lg:flex-row lg:flex-nowrap lg:items-center lg:justify-start lg:gap-[30px] lg:overflow-x-auto lg:overscroll-x-contain lg:snap-x lg:snap-mandatory lg:scroll-px-[30px] lg:pt-2 lg:pb-10 xl:justify-center xl:overflow-x-clip xl:snap-none"
        >
          {translations.cards.map((card) => (
            <SolutionCard
              key={card.id}
              card={card}
              locale={locale}
              ctaLabel={t(translations.ctaLabel)}
              sectionCtaHref={translations.ctaHref}
              theme={theme}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
