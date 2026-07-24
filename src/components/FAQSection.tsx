'use client'

import React, { useEffect, useRef, useState } from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSiteContent } from './SiteContentProvider'
import { resolveLexical } from '@/lib/lexical'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface FAQSectionProps {
  locale: string
  theme?: 'light' | 'dark'
}

export default function FAQSection({ locale, theme = 'light' }: FAQSectionProps) {
  const translations = useSiteContent().faq
  const t = (field?: Record<string, string>) => (field && (field[locale] || field.en)) || ''
  const [openIndex, setOpenIndex] = useState<number>(0)
  const items = translations?.items ?? []
  const sectionRef = useRef<HTMLElement | null>(null)
  const headingRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const isLight = theme === 'light'

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add('(min-width: 1024px)', () => {
        gsap.set([headingRef.current, panelRef.current], {
          opacity: 0,
          y: 60,
        })

        gsap.to([headingRef.current, panelRef.current], {
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

        // Keep FAQ pinned: ~100vh hold, then Footer slides up over it
        ScrollTrigger.create({
          id: 'faq-pin',
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=200%',
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
        })
      })

      mm.add('(max-width: 1023px)', () => {
        gsap.set([headingRef.current, panelRef.current], { opacity: 0, y: 30 })

        gsap.to([headingRef.current, panelRef.current], {
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

  if (!translations) return null

  const renderStylizedTitle = (text: string) => {
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
    <div className="relative z-[35] w-full pointer-events-none">
      {/* Short hold while Solutions stays fully visible before FAQ rides up */}
      <div className="hidden lg:block h-[100vh] w-full pointer-events-none" aria-hidden />

      <section
        id="faq"
        ref={sectionRef}
        className={`relative z-10 w-full border-t border-b border-coal-400/5 select-none pointer-events-auto pt-20 pb-24 shadow-[0_-12px_30px_rgba(0,0,0,0.28)] max-lg:rounded-t-[28px] lg:flex lg:h-screen lg:flex-col lg:justify-start lg:overflow-hidden lg:border-t lg:py-0 lg:pt-20 lg:pb-16 ${
          isLight ? 'bg-gold-100' : 'bg-[#1a1816]'
        }`}
      >
        {!isLight && (
          <>
            <div
              className="absolute inset-0 z-0 pointer-events-none faq-radial-bg max-lg:rounded-t-[28px]"
              aria-hidden
            />
            <div
              className="solution-section-noise absolute inset-0 z-[1] pointer-events-none max-lg:rounded-t-[28px]"
              aria-hidden
            />
          </>
        )}

        {/* Heading — same top position as Services / Solutions */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1170px] shrink-0 flex-col items-center px-[30px] mb-8 lg:mb-10">
          <div
            ref={headingRef}
            className="flex flex-col items-center gap-[5px] text-center"
          >
            <h2 className="font-sans text-[32px] font-extralight uppercase leading-tight tracking-[9.6px] lg:text-[48px] lg:leading-[60px]">
              {renderStylizedTitle(t(translations.sectionTitle))}
            </h2>
            <p
              className={`font-sans text-base font-light leading-8 tracking-[3.2px] ${
                isLight ? 'text-gold-800' : 'text-gold-500'
              }`}
            >
              {t(translations.sectionSubtitle)}
            </p>
          </div>
        </div>

        {/* Accordion — scrolls inside so the heading stays put when items open.
            Bottom padding keeps the card drop-shadow inside overflow-hidden parents. */}
        <div className="relative z-10 mx-auto flex w-full min-h-0 max-w-[1170px] flex-1 flex-col px-[30px] pb-12 lg:overflow-hidden lg:pb-14">
          <div
            ref={panelRef}
            className={`faq-accordion-scroll mx-auto flex w-full max-w-[970px] min-h-0 flex-col overflow-y-auto overflow-x-hidden rounded-[10px] border ${
              isLight
                ? 'is-light border-coal-900/10 bg-white shadow-[0_14px_44px_rgba(13,13,13,0.10)]'
                : 'border-white/10 bg-coal-500 shadow-[0_14px_44px_rgba(13,13,13,0.45)]'
            }`}
          >
            {items.map((item, index) => {
              const isOpen = openIndex === index
              const question = t(item.question)
              const answerDoc = resolveLexical(item.answerRich, locale, t(item.answer))

              return (
                <div
                  key={`${index}-${question}`}
                  className={`${
                    index > 0
                      ? isLight
                        ? 'border-t border-coal-900/10'
                        : 'border-t border-white/10'
                      : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className={`group flex w-full cursor-pointer items-center justify-between gap-6 px-6 py-5 text-start transition-colors duration-300 md:px-8 ${
                      isLight ? 'hover:bg-erythro-500/5' : 'hover:bg-gold-500/10'
                    }`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span
                      className={`font-sans text-[15px] font-bold uppercase leading-6 tracking-[0.06em] transition-colors duration-300 md:text-base ${
                        isLight
                          ? 'text-coal-900 group-hover:text-erythro-500'
                          : 'text-white group-hover:text-gold-500'
                      }`}
                    >
                      {question}
                    </span>
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                        isOpen
                          ? isLight
                            ? 'border-erythro-500 bg-erythro-500 text-white'
                            : 'border-gold-500 bg-gold-500 text-coal-900'
                          : isLight
                            ? 'border-coal-900/10 bg-gold-100 text-coal-900 group-hover:border-erythro-500 group-hover:bg-erythro-500 group-hover:text-white'
                            : 'border-white/15 bg-white/5 text-white group-hover:border-gold-500 group-hover:bg-gold-500 group-hover:text-coal-900'
                      }`}
                      aria-hidden
                    >
                      <svg
                        className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 5V19M5 12H19"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </button>

                  <div
                    id={`faq-answer-${index}`}
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-6 pb-6 md:px-8">
                        {answerDoc ? (
                          <div
                            className={`max-w-[820px] font-sans text-base font-light leading-7 md:text-lg md:leading-8 [&_:is(h1,h2,h3,h4,h5,h6,p)]:m-0 [&_p+_p]:mt-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:my-1 [&_a]:underline [&_strong]:font-semibold [&_em]:italic ${
                              isLight ? 'text-coal-900/80' : 'text-white/75'
                            }`}
                          >
                            <RichText data={answerDoc as never} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
