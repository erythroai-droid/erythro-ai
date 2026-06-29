'use client'

import React, { useEffect, useRef } from 'react'
import { useSiteContent } from './SiteContentProvider'
import { useContactModal } from './ContactModal'
import Button from './Button'
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
  full?: Record<string, string>
}

interface SolutionCardData {
  id: string
  price: string
  pricePrefix?: Record<string, string>
  priceNote?: boolean
  originalPrice?: string
  title: Record<string, string>
  features: SolutionFeature[]
  disclaimer?: Record<string, string>
  featured?: boolean
}

function SolutionCard({
  card,
  locale,
  ctaLabel,
  theme = 'dark',
}: {
  card: SolutionCardData
  locale: string
  ctaLabel: string
  theme?: 'light' | 'dark'
}) {
  const t = (field: Record<string, string>) => field[locale] || field['en']
  const { open: openContact } = useContactModal()

  const isFeatured = card.featured
  const isLight = theme === 'light'

  const solutionButtonClassName = isFeatured
    ? 'border-white text-white hover:bg-white hover:text-coal-900 hover:border-white'
    : isLight
      ? 'border-coal-900 text-coal-900 hover:!bg-erythro-500 hover:!text-white hover:!border-erythro-500'
      : 'border-[var(--Button-Tertiary-link,#FFE9C7)] text-[var(--Button-Tertiary-link,#FFE9C7)] hover:bg-[var(--Button-Tertiary-link,#FFE9C7)] hover:text-coal-900 hover:border-[var(--Button-Tertiary-link,#FFE9C7)]'

  return (
    <article
      className={`relative flex shrink-0 flex-col items-center gap-2 rounded-[10px] px-4 py-[30px] ${
        isFeatured
          ? 'z-10 mb-4 min-h-[570px] h-auto w-[300px] overflow-visible bg-erythro-600 shadow-[0_5px_50px_0_rgba(13,13,13,0.3)]'
          : isLight
            ? 'min-h-[530px] h-auto w-[270px] overflow-visible border border-white bg-white shadow-card-services'
            : 'min-h-[530px] h-auto w-[270px] overflow-visible border border-gold-500 bg-[#1E1E1E]'
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
          <span>₪</span>{' '}
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
          <span className="text-[1.6125rem] leading-tight">₪</span>{' '}
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
          className={`text-center font-bold text-base uppercase leading-snug ${
            isFeatured ? 'text-erythro-500' : isLight ? 'text-white' : 'text-coal-900'
          }`}
        >
          {t(card.title)}
        </span>
      </div>

      <ul className="flex w-full flex-1 flex-col gap-4 py-4 ps-4">
        {card.features.map((feature, index) => {
          const dotClass = isFeatured ? 'bg-white' : 'bg-erythro-500'
          const textClass = isFeatured ? 'text-white' : isLight ? 'text-coal-900' : 'text-white'
          const labelClass = isFeatured
            ? 'text-white'
            : isLight
              ? 'text-coal-900'
              : 'text-gold-500'

          if (feature.full) {
            return (
              <li key={index} className="relative flex items-start gap-2.5">
                <span
                  className={`absolute -start-4 top-2.5 size-1 shrink-0 rounded-[1px] ${dotClass}`}
                />
                <p className={`text-base leading-6 lg:text-sm ${textClass}`}>{t(feature.full)}</p>
              </li>
            )
          }

          return (
            <li key={index} className="relative flex items-start gap-2.5">
              <span
                className={`absolute -start-4 top-2.5 size-1 shrink-0 rounded-[1px] ${dotClass}`}
              />
              <p className={`text-base leading-6 uppercase lg:text-sm ${textClass}`}>
                {feature.label && (
                  <span className={`font-bold ${labelClass}`}>{t(feature.label)} </span>
                )}
                {feature.value &&
                  (() => {
                    const value = t(feature.value)
                    const isPrice = value.includes('₪')
                    return (
                      <span
                        {...(isPrice ? { dir: 'ltr' as const } : {})}
                        className={`font-normal normal-case ${isPrice ? 'inline-block' : ''}`}
                      >
                        {value}
                      </span>
                    )
                  })()}
              </p>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto flex w-full flex-col items-center gap-4">
        <Button variant="solution-cta" className={solutionButtonClassName} onClick={openContact}>
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

        ScrollTrigger.create({
          id: 'solutions-pin',
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=150%',
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

  const renderStylizedTitle = (text: string) => {
    if (!text) return null
    const firstChar = text.charAt(0)
    const rest = text.slice(1)
    return (
      <>
        <span className="text-erythro-500">{firstChar}</span>
        <span className={isLight ? 'text-coal-900' : 'text-white'}>{rest}</span>
      </>
    )
  }

  return (
    <div className="relative z-30 w-full pointer-events-none">
      {/* Spacer to allow the pinned Services/LetsTalk overlay to stay fixed while Solutions slides up over it */}
      <div className="hidden lg:block h-[490vh] w-full pointer-events-none" />

      <section
        id="solutions"
        ref={sectionRef}
        className="relative w-full border-t border-b border-coal-400/5 pt-20 pb-[100px] lg:pt-20 lg:pb-24 lg:min-h-screen lg:flex lg:flex-col lg:justify-start select-none pointer-events-auto overflow-visible"
        style={{
          background: isLight
            ? '#FFE9C7'
            : 'radial-gradient(288.44% 49.43% at 50% 50%, var(--Background-Solution-Gradient-start, #1E1E1E) 0%, var(--Background-Solution-Gradient-finish, #0D0D0D) 100%)',
        }}
      >
        <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none" />

        {/* Headings container (max-w-[1170px]) */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1170px] flex-col items-center px-[30px] mb-[60px]">
          <div
            ref={headingRef}
            className="flex flex-col items-center gap-[5px] text-center"
          >
            <h2 className="font-sans text-[32px] font-extralight uppercase leading-tight tracking-[9.6px] lg:text-[48px] lg:leading-[60px]">
              {renderStylizedTitle(t(translations.sectionTitle))}
            </h2>
            <p className="font-sans text-base font-light leading-8 tracking-[3.2px] text-gold-800">
              {t(translations.sectionSubtitle)}
            </p>
          </div>
        </div>

        {/* Cards container (full screen width, max-w-none) */}
        <div
          ref={cardsRef}
          className="relative z-10 flex w-full flex-col items-center gap-[30px] overflow-visible px-[30px] py-8 pb-16 lg:flex-row lg:items-center lg:justify-center lg:py-10 lg:pb-20 no-scrollbar"
        >
          {translations.cards.map((card) => (
            <SolutionCard
              key={card.id}
              card={card}
              locale={locale}
              ctaLabel={t(translations.ctaLabel)}
              theme={theme}
            />
          ))}
        </div>

        <style jsx>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </section>
    </div>
  )
}
