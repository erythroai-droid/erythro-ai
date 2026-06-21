'use client'

import React, { useEffect, useRef } from 'react'
import { services as translations } from '../translations'
import Button from './Button'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface ServicesSectionProps {
  locale: string
}

export default function ServicesSection({ locale }: ServicesSectionProps) {
  // Translate helper
  const t = (field: Record<string, string>) => field[locale] || field['en']

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const headingRef = useRef<HTMLDivElement | null>(null)
  const cardsRowRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      // Desktop animation: Pinning, horizontal side-scrolling cards with scrubbing
      mm.add('(min-width: 1024px)', () => {
        gsap.set(headingRef.current, {
          opacity: 0,
          y: 40,
        })
        gsap.set(cardsRowRef.current, {
          opacity: 0,
          y: 40,
        })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=250%', // Pin for 2.5 viewports height scroll
            pin: true,
            pinSpacing: true,
            scrub: 1, // Smooth scrub
            invalidateOnRefresh: true,
          },
        })
        ScrollTrigger.sort()

        tl.to(headingRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
        })

        tl.to(
          cardsRowRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: 'power2.out',
          },
          '-=0.2',
        )

        tl.to(cardsRowRef.current, {
          x: () => {
            if (!cardsRowRef.current) return 0
            const maxScroll = cardsRowRef.current.scrollWidth - window.innerWidth
            return (locale === 'he' ? 1 : -1) * maxScroll
          },
          ease: 'none',
          duration: 2.0,
        })
      })

      // Mobile/tablet animation: Simple scroll trigger (no pinning/snapping)
      mm.add('(max-width: 1023px)', () => {
        gsap.set(headingRef.current, {
          opacity: 0,
          y: 30,
        })
        const cards = cardsRowRef.current ? cardsRowRef.current.children : []
        gsap.set(cards, {
          opacity: 0,
          y: 30,
        })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        })

        tl.to(headingRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        })

        if (cards.length > 0) {
          tl.to(
            cards,
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.2,
              ease: 'power2.out',
            },
            '-=0.3',
          )
        }
      })
    }, wrapperRef)

    return () => ctx.revert()
  }, [locale])

  // Utility to render heading with a stylized red first letter
  const renderStylizedTitle = (text: string) => {
    if (!text) return null
    const firstChar = text.charAt(0)
    const rest = text.slice(1)
    return (
      <>
        <span className="text-[var(--erythro-500,#E52421)]">{firstChar}</span>
        <span className="text-[#FFF]">{rest}</span>
      </>
    )
  }

  return (
    <div ref={wrapperRef} className="relative z-20 w-full">
      {/* Spacer to push Services Section down by 100vh on desktop so Case Studies is fully visible before Services slides over */}
      <div className="hidden lg:block h-screen w-full pointer-events-none" />

      <section
        id="services"
        ref={sectionRef}
        className="py-20 lg:py-0 lg:h-screen lg:flex lg:flex-col lg:justify-center w-full transition-colors duration-500 border-t border-b border-coal-400/5 dark:border-white/5 bg-noise relative z-10 overflow-hidden select-none"
        style={{
          background:
            'radial-gradient(288.44% 49.43% at 50% 50%, var(--Background-Services-Gradient-start, #1E1E1E) 0%, var(--Background-Services-Gradient-finish, #0D0D0D) 100%)',
        }}
      >
        <div className="w-full flex flex-col justify-center py-6 lg:py-12">
          {/* Headings */}
          <div
            ref={headingRef}
            className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3 px-[30px] mb-8 lg:mb-12"
          >
            <h2 className="font-sans text-[32px] lg:text-[48px] font-extralight leading-tight lg:leading-[60px] tracking-[9.6px] uppercase">
              {renderStylizedTitle(t(translations.sectionTitle))}
            </h2>
            <p className="font-sans text-sm lg:text-base font-light leading-relaxed lg:leading-[32px] tracking-[3.2px] text-center text-[var(--gold-800,#8C806D)]">
              {t(translations.sectionSubtitle)}
            </p>
          </div>

          {/* Service Cards Horizontal Scroll Track */}
          <div className="w-full overflow-hidden">
            <div
              ref={cardsRowRef}
              className="flex flex-col lg:flex-row gap-6 lg:gap-10 w-full lg:w-max px-[30px] lg:px-0"
              style={{
                paddingLeft: 'max(30px, calc((100vw - 1170px) / 2 + 30px))',
                paddingRight: 'max(30px, calc((100vw - 1170px) / 2 + 30px))',
              }}
            >
              {translations.items.map((item) => {
                const itemTitle = t(item.title)
                const itemFeatures = item.features[locale] || item.features['en']
                const isRtl = locale === 'he'

                return (
                  <div
                    key={item.id}
                    className="relative w-full lg:w-[1170px] lg:h-[480px] shrink-0 rounded-[20px] bg-coal-900 border border-white/5 shadow-card-services-dark overflow-hidden group transition-all duration-500 hover:border-erythro-500/30 flex flex-col lg:flex-row gap-6 lg:gap-0 items-stretch"
                  >
                    {/* Background noise & hover spot */}
                    <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-br from-erythro-500/0 via-erythro-500/0 to-erythro-500/0 group-hover:to-erythro-500/5 transition-all duration-500 pointer-events-none" />

                    {/* Card Image */}
                    <div
                      className={`w-full lg:w-1/2 overflow-hidden relative shrink-0 aspect-[16/10] lg:aspect-auto lg:h-full border-white/5 border-b lg:border-b-0 ${
                        isRtl
                          ? 'lg:border-l lg:rounded-r-[20px] lg:rounded-l-none'
                          : 'lg:border-r lg:rounded-l-[20px] lg:rounded-r-none'
                      } rounded-t-[20px] rounded-b-none`}
                    >
                      <img
                        src={item.image}
                        alt={itemTitle}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>

                    {/* Card Content */}
                    <div className="w-full lg:w-1/2 flex flex-col justify-between h-full gap-6 text-start z-10 p-6 pt-0 lg:p-12 relative">
                      {/* Background Letter "e" */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none -z-10">
                        <img
                          src="/images/e.svg"
                          alt=""
                          className="w-full h-auto object-contain opacity-100"
                        />
                      </div>
                      <div className="flex flex-col gap-6">
                        <h3 className="font-sans text-xl lg:text-[40px] font-extralight tracking-[2px] lg:tracking-[8px] text-[var(--Service-cards-Header,#8C806D)] leading-tight lg:leading-[60px]">
                          {itemTitle}
                        </h3>
                        <ul className="flex flex-col gap-3">
                          {itemFeatures.map((feature, fIdx) => (
                            <li
                              key={fIdx}
                              className="flex items-center gap-3 font-sans text-xs lg:text-[14px] font-normal tracking-[1.2px] lg:tracking-[3.2px] text-[var(--Service-cards-list,#FFF)] leading-normal lg:leading-[24px]"
                            >
                              <span className="w-1 h-1 bg-erythro-500 shrink-0 rotate-45" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4">
                        <Button
                          variant="dark-outline"
                          showArrow
                        >
                          {isRtl ? 'עוד' : locale === 'ru' ? 'подробнее' : 'more'}
                        </Button>
                      </div>
                    </div>

                    {/* Number Tag */}
                    <div
                      className={`absolute bottom-0 ${
                        isRtl ? 'left-0' : 'right-0'
                      } w-14 h-14 bg-erythro-500 flex items-center justify-center font-sans font-bold text-lg text-white select-none`}
                    >
                      {item.number}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
