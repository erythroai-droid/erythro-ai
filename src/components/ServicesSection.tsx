'use client'

import React, { useEffect, useRef } from 'react'
import { services as translations } from '../translations'
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

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      // Desktop animation: Pinning, scrubbing & snapping
      mm.add('(min-width: 1024px)', () => {
        gsap.set(headingRef.current, {
          opacity: 0,
          y: 60,
        })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=100%', // Pin for 1 viewport height
            pin: true,
            pinSpacing: true,
            toggleActions: 'play none none reverse',
            snap: {
              snapTo: [0, 1], // Snap to start and end
              duration: { min: 0.3, max: 0.6 },
              delay: 0.05,
              ease: 'power2.out',
            },
            invalidateOnRefresh: true,
          },
        })
        ScrollTrigger.sort()

        tl.to(headingRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
        })
      })

      // Mobile/tablet animation: Simple scroll trigger (no pinning/snapping)
      mm.add('(max-width: 1023px)', () => {
        gsap.set(headingRef.current, {
          opacity: 0,
          y: 40,
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
          duration: 0.8,
          ease: 'power2.out',
        })
      })
    }, wrapperRef)

    return () => ctx.revert()
  }, [])

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
          background: 'radial-gradient(288.44% 49.43% at 50% 50%, var(--Background-Services-Gradient-start, #1E1E1E) 0%, var(--Background-Services-Gradient-finish, #0D0D0D) 100%)'
        }}
      >
        <div className="max-w-[1170px] mx-auto px-[30px] w-full">
          {/* Headings */}
          <div ref={headingRef} className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
            <h2 className="font-sans text-[32px] lg:text-[48px] font-extralight leading-tight lg:leading-[60px] tracking-[9.6px] uppercase">
              {renderStylizedTitle(t(translations.sectionTitle))}
            </h2>
            <p className="font-sans text-sm lg:text-base font-light leading-relaxed lg:leading-[32px] tracking-[3.2px] text-center text-[var(--gold-800,#8C806D)]">
              {t(translations.sectionSubtitle)}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

