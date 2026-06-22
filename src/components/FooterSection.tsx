'use client'

import React, { useEffect, useRef } from 'react'
import { footer as translations } from '../translations'
import Button from './Button'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface FooterSectionProps {
  locale: string
}

function FooterLinkItem({
  href,
  children,
  external,
}: {
  href?: string
  children: React.ReactNode
  external?: boolean
}) {
  const content = (
    <>
      <span className="size-1 shrink-0 rounded-[1px] bg-erythro-500" aria-hidden="true" />
      <span className="text-base font-medium capitalize leading-6 text-white transition-colors duration-300 hover:text-gold-500">
        {children}
      </span>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        className="flex items-center gap-2 px-2"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {content}
      </a>
    )
  }

  return <div className="flex items-center gap-2 px-2">{content}</div>
}

export default function FooterSection({ locale }: FooterSectionProps) {
  const t = (field: Record<string, string>) => field[locale] || field['en']

  const footerRef = useRef<HTMLElement | null>(null)
  const columnsRef = useRef<HTMLDivElement | null>(null)
  const logoRef = useRef<HTMLDivElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add('(min-width: 1024px)', () => {
        gsap.set([columnsRef.current, logoRef.current, barRef.current], {
          opacity: 0,
          y: 60,
        })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top top',
            end: '+=100%', // Pin scroll distance
            pin: true,
            pinSpacing: true,
            toggleActions: 'play none none reverse',
            invalidateOnRefresh: true,
          },
        })
        ScrollTrigger.sort()

        tl.to([columnsRef.current, logoRef.current, barRef.current], {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.25,
          ease: 'power2.out',
        })
      })

      mm.add('(max-width: 1023px)', () => {
        gsap.set([columnsRef.current, logoRef.current, barRef.current], {
          opacity: 0,
          y: 30,
        })

        gsap.to([columnsRef.current, logoRef.current, barRef.current], {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        })
      })
    }, footerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div className="relative z-40 w-full pointer-events-none">
      {/* Spacer to allow the pinned SolutionSection to stay fixed while Footer slides up over it */}
      <div className="hidden lg:block h-[150vh] w-full pointer-events-none" />

      <footer
        ref={footerRef}
        className="relative w-full bg-coal-900 py-[60px] lg:py-0 lg:h-screen lg:flex lg:flex-col lg:justify-center select-none pointer-events-auto"
      >
        <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none" />

        <div className="relative z-10 mx-auto flex w-full max-w-[1170px] flex-col items-center gap-[30px] px-[30px]">
          {/* Columns Grid */}
          <div
            ref={columnsRef}
            className="grid w-full grid-cols-1 gap-[30px] md:grid-cols-2 lg:grid-cols-3"
          >
            {/* CTA column */}
            <div className="flex flex-col items-start gap-[30px]">
              <p className="px-2 text-2xl font-bold leading-9 text-white">
                {t(translations.ctaHeadingLine1)}
                <br />
                {t(translations.ctaHeadingLine2)}
              </p>
              <a href="mailto:erythro.ai@gmail.com" className="inline-block">
                <Button variant="dark-outline" className="uppercase">
                  {t(translations.ctaButton)}
                </Button>
              </a>
            </div>

            {/* Company column */}
            <div className="flex flex-col items-start gap-4">
              <p className="px-2 text-2xl font-bold leading-9 text-white">
                {t(translations.companyTitle)}
              </p>
              {translations.companyLinks.map((link) => (
                <FooterLinkItem key={link.href} href={link.href}>
                  {t(link.label)}
                </FooterLinkItem>
              ))}
            </div>

            {/* Contact column */}
            <div className="flex flex-col items-start gap-4 md:col-span-2 lg:col-span-1">
              <p className="px-2 text-2xl font-bold leading-9 text-white">
                {t(translations.contactTitle)}
              </p>
              <FooterLinkItem href="mailto:erythro.ai@gmail.com">
                <span className="font-bold uppercase">{t(translations.emailLabel)} </span>
                erythro.ai@gmail.com
              </FooterLinkItem>
              <FooterLinkItem href="tel:+972509312746">
                <span className="font-bold uppercase">{t(translations.phoneLabel)}</span>
                +972 50 931 27 46
              </FooterLinkItem>
              <FooterLinkItem>
                <span className="font-bold uppercase">{t(translations.locationLabel)}</span>
                {t(translations.locationValue)}
              </FooterLinkItem>
            </div>
          </div>

          {/* Large brand logo */}
          <div ref={logoRef} className="flex w-full justify-center py-4">
            <img
              src="/images/logo/Default.svg"
              alt="Erythro.ai"
              className="h-auto w-full max-w-[746px]"
              loading="lazy"
            />
          </div>

          {/* Bottom legal bar */}
          <div
            ref={barRef}
            className="flex w-full flex-col items-start justify-between gap-4 border-t border-white/5 pt-6 lg:flex-row lg:items-center"
          >
            <p className="text-xs uppercase tracking-[2.4px] text-white">
              {t(translations.copyright)}
            </p>

            <div className="flex flex-wrap items-center gap-[30px]">
              {translations.legalLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  className="text-xs uppercase tracking-[2.4px] text-white transition-colors duration-300 hover:text-gold-500"
                >
                  {t(link.label)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
