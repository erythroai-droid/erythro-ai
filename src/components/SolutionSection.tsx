'use client'

import React, { useEffect, useRef } from 'react'
import { solutions as translations } from '../translations'
import Button from './Button'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface SolutionSectionProps {
  locale: string
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
}: {
  card: SolutionCardData
  locale: string
  ctaLabel: string
}) {
  const t = (field: Record<string, string>) => field[locale] || field['en']

  const isFeatured = card.featured

  return (
    <article
      className={`relative flex shrink-0 flex-col items-center gap-2 overflow-hidden rounded-[10px] px-4 py-[30px] ${
        isFeatured
          ? 'min-h-[570px] w-[300px] bg-erythro-600 shadow-[0_5px_50px_0_rgba(13,13,13,0.3)]'
          : 'min-h-[530px] w-[270px] border border-gold-500 bg-[#1E1E1E]'
      }`}
    >
      {card.pricePrefix && (
        <span
          className={`absolute top-[13px] font-bold text-sm uppercase ${
            isFeatured ? 'text-white' : 'text-gold-500'
          } ${locale === 'he' ? 'start-4' : 'end-4'}`}
        >
          {t(card.pricePrefix)}
        </span>
      )}

      {card.originalPrice && (
        <p
          className={`absolute top-[17px] font-bold text-sm uppercase text-white ${
            locale === 'he' ? 'start-4' : 'end-4'
          }`}
        >
          <span>₪</span>{' '}
          <span className="line-through">{card.originalPrice}</span>
        </p>
      )}

      <div className="relative flex h-[70px] w-full items-start justify-center text-center">
        {card.priceNote && (
          <span
            className={`absolute -top-2 font-bold text-sm uppercase ${
              isFeatured ? 'text-white' : 'text-gold-500'
            } ${locale === 'he' ? 'start-1/2 ms-16' : 'start-1/2 ms-16'}`}
          >
            *
          </span>
        )}
        <p
          className={`font-bold uppercase leading-[80px] ${
            isFeatured ? 'text-white' : 'text-gold-500'
          }`}
        >
          <span className="text-[25.8px] leading-[80px]">₪</span>{' '}
          <span className="text-[40px] leading-[80px]">{card.price}</span>
        </p>
      </div>

      <div
        className={`flex h-[30px] w-full items-center justify-center rounded-[2px] ${
          isFeatured ? 'bg-white' : 'bg-gold-500'
        }`}
      >
        <span
          className={`px-2 text-center font-bold text-base uppercase leading-6 ${
            isFeatured ? 'text-erythro-500' : 'text-coal-900'
          }`}
        >
          {t(card.title)}
        </span>
      </div>

      <ul className="flex w-full flex-col gap-4 py-4 ps-4">
        {card.features.map((feature, index) => {
          const dotClass = isFeatured ? 'bg-white' : 'bg-erythro-500'
          const textClass = isFeatured ? 'text-white' : 'text-white'
          const labelClass = isFeatured ? 'text-white' : 'text-gold-500'

          if (feature.full) {
            return (
              <li key={index} className="relative flex items-start gap-2.5">
                <span
                  className={`absolute -start-4 top-2.5 size-1 shrink-0 rounded-[1px] ${dotClass}`}
                />
                <p className={`text-sm leading-6 ${textClass}`}>{t(feature.full)}</p>
              </li>
            )
          }

          return (
            <li key={index} className="relative flex items-start gap-2.5">
              <span
                className={`absolute -start-4 top-2.5 size-1 shrink-0 rounded-[1px] ${dotClass}`}
              />
              <p className={`text-sm leading-6 uppercase ${textClass}`}>
                {feature.label && (
                  <span className={`font-bold ${labelClass}`}>{t(feature.label)} </span>
                )}
                {feature.value && (
                  <span className="font-normal normal-case">{t(feature.value)}</span>
                )}
              </p>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto flex w-full flex-col items-center gap-4">
        <Button
          variant={isFeatured ? 'white-outline' : 'dark-outline'}
          className="uppercase"
        >
          {ctaLabel}
        </Button>

        {card.disclaimer && (
          <p
            className={`text-center text-[11px] leading-6 ${
              isFeatured ? 'text-white' : 'text-white'
            }`}
          >
            {t(card.disclaimer)}
          </p>
        )}
      </div>
    </article>
  )
}

export default function SolutionSection({ locale }: SolutionSectionProps) {
  const t = (field: Record<string, string>) => field[locale] || field['en']

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

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=150%',
            pin: true,
            pinSpacing: false,
            toggleActions: 'play none none reverse',
            invalidateOnRefresh: true,
          },
        })
        ScrollTrigger.sort()

        tl.to([headingRef.current, cardsRef.current], {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.25,
          ease: 'power2.out',
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
            start: 'top 85%',
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
        <span className="text-white">{rest}</span>
      </>
    )
  }

  return (
    <div className="relative z-30 w-full pointer-events-none">
      {/* Spacer to allow the pinned Services/LetsTalk overlay to stay fixed while Solutions slides up over it */}
      <div className="hidden lg:block h-[450vh] w-full pointer-events-none" />

      <section
        id="solutions"
        ref={sectionRef}
        className="relative w-full overflow-hidden border-t border-b border-coal-400/5 py-[60px] pb-[100px] lg:py-0 lg:min-h-screen lg:flex lg:flex-col lg:justify-center select-none pointer-events-auto"
        style={{
          background:
            'radial-gradient(288.44% 49.43% at 50% 50%, var(--Background-Solution-Gradient-start, #1E1E1E) 0%, var(--Background-Solution-Gradient-finish, #0D0D0D) 100%)',
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
            <p className="font-sans text-sm font-light leading-8 tracking-[3.2px] text-gold-800 lg:text-base">
              {t(translations.sectionSubtitle)}
            </p>
          </div>
        </div>

        {/* Cards container (full screen width, max-w-none) */}
        <div
          ref={cardsRef}
          className="relative z-10 w-full flex flex-col items-center gap-[30px] lg:flex-row lg:items-center lg:justify-center lg:overflow-x-auto lg:pb-2 no-scrollbar px-[30px]"
        >
          {translations.cards.map((card) => (
            <SolutionCard
              key={card.id}
              card={card}
              locale={locale}
              ctaLabel={t(translations.ctaLabel)}
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
