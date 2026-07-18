'use client'

import React, { useEffect, useRef } from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Button from '@/components/Button'
import { useContactModal } from '@/components/ContactModal'
import { tLocale, type ServicePage } from '@/lib/servicePages'
import { currencySymbol } from '@/lib/orderPlans'
import { isLexicalDoc, lexicalFromParagraphs, lexicalFromText, type LexicalDoc } from '@/lib/lexical'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface ServiceBodyProps {
  service: ServicePage
  locale: string
  theme?: 'light' | 'dark'
}

function pickLexical(
  rich: ServicePage['summaryRich'] | ServicePage['descriptionRich'],
  locale: string,
  fallback: LexicalDoc,
): LexicalDoc {
  if (rich && typeof rich === 'object') {
    const map = rich as Record<string, unknown>
    const candidate = map[locale] ?? map.en
    if (isLexicalDoc(candidate)) return candidate
  }
  return fallback
}

export default function ServiceBody({ service, locale, theme = 'dark' }: ServiceBodyProps) {
  const isLight = theme === 'light'
  const sectionRef = useRef<HTMLElement | null>(null)
  const { open: openContact } = useContactModal()

  const summaryDoc = pickLexical(
    service.summaryRich,
    locale,
    lexicalFromText(tLocale(service.summary, locale)),
  )
  const descriptionDoc = pickLexical(
    service.descriptionRich,
    locale,
    lexicalFromParagraphs(service.description?.[locale] || service.description?.en || []),
  )

  const ctaLabel =
    locale === 'he' ? 'בואו נדבר...' : locale === 'ru' ? 'ОБСУДИТЬ...' : "LET'S TALK..."
  const pricingHeading =
    locale === 'ru' ? 'Пакеты и цены' : locale === 'he' ? 'חבילות ומחירים' : 'Packages & pricing'

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add('(min-width: 1024px)', () => {
        ScrollTrigger.create({
          id: 'service-body-pin',
          trigger: sectionRef.current,
          start: 'bottom bottom',
          end: '+=100%',
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="service-body"
      className={`relative z-20 w-full shadow-[0_-12px_30px_rgba(0,0,0,0.28)] ${
        isLight ? 'bg-gold-100 text-coal-900' : 'dark-gradient-bg text-white'
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1170px] flex-col gap-12 px-[30px] py-12 md:gap-16 md:py-16 lg:gap-20 lg:py-20">
        <div className="service-summary font-sans text-lg font-light leading-8 text-gold-500 md:text-xl [&_:is(h1,h2,h3,h4,h5,h6,p)]:m-0 [&_:is(h1,h2,h3,h4,h5,h6)+p]:mt-4 [&_p+_p]:mt-4 [&_a]:underline [&_strong]:font-semibold [&_em]:italic">
          <RichText data={summaryDoc as never} />
        </div>
        <div
          className={`service-description font-sans text-base font-light leading-7 md:text-lg md:leading-8 [&_:is(h1,h2,h3,h4,h5,h6,p)]:m-0 [&_p+_p]:mt-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:my-1 [&_a]:underline [&_strong]:font-semibold [&_em]:italic ${
            isLight ? 'text-coal-900/85' : 'text-white/80'
          }`}
        >
          <RichText data={descriptionDoc as never} />
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="m-0 font-sans text-[22px] font-extralight uppercase tracking-[0.08em] md:text-[28px]">
            <span className="text-erythro-500">{pricingHeading.charAt(0)}</span>
            <span>{pricingHeading.slice(1)}</span>
          </h2>
          <ul className="flex w-full flex-col border-t border-current/15">
            {service.offerings.map((offering) => {
              const name = tLocale(offering.name, locale)
              const desc = offering.description
                ? tLocale(offering.description, locale)
                : null
              const prefix = offering.pricePrefix
                ? tLocale(offering.pricePrefix, locale)
                : null

              return (
                <li
                  key={name}
                  className={`flex flex-col gap-2 border-b border-current/15 py-6 md:flex-row md:items-end md:justify-between md:gap-10 ${
                    isLight ? 'border-coal-900/15' : 'border-white/15'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <h3 className="font-sans text-base font-bold uppercase tracking-[0.06em] md:text-lg">
                      {name}
                    </h3>
                    {desc ? (
                      <p
                        className={`font-sans text-sm font-light leading-6 ${
                          isLight ? 'text-gold-900' : 'text-gold-800'
                        }`}
                      >
                        {desc}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 font-sans text-base tracking-[0.04em] md:text-lg">
                    {prefix ? <span className="opacity-60">{prefix} </span> : null}
                    <span className="font-medium">{offering.price}</span>
                    <span className="opacity-60"> {currencySymbol(service.currency || 'USD')}</span>
                  </p>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <Button
            variant={isLight ? 'light-accent' : 'nav-talk'}
            onClick={openContact}
          >
            {ctaLabel}
          </Button>
        </div>
      </div>

      <div className="h-[80px] w-full shrink-0 lg:h-[120px]" aria-hidden />
    </section>
  )
}
