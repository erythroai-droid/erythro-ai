'use client'

import React, { useEffect, useRef } from 'react'
import { useSiteContent } from './SiteContentProvider'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface CaseStudiesSectionProps {
  locale: string
}

const CASE_STUDY_VIDEO =
  'https://wgw9moyqjdjcaq9l.public.blob.vercel-storage.com/Main_Render_1.mp4'

/** Plays only while the case-study video is in the viewport. */
function CaseStudyVideo({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.play().catch(() => {})
          } else {
            el.pause()
          }
        }
      },
      { threshold: 0.25 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <video
      ref={ref}
      src={src}
      className="block h-full w-full object-contain lg:max-h-full lg:max-w-full lg:h-auto lg:w-auto"
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
    />
  )
}

// Brand logos path mappings
const brandLogos = [
  { name: 'Adobe', src: '/images/brands/Adobe_Corporate_logo 1.svg' },
  { name: 'n8n', src: '/images/brands/N8n-logo-new 1.svg' },
  { name: 'Next.js', src: '/images/brands/Nextjs-logo 1.svg' },
  { name: 'Spring', src: '/images/brands/Spring_Framework_Logo_2018 1.svg' },
  { name: 'WordPress', src: '/images/brands/WordPress_logo 1.svg' },
  { name: 'Figma', src: '/images/brands/figma 1.svg' },
  { name: 'GSAP', src: '/images/brands/gsap 1.svg' },
  { name: 'Hostinger', src: '/images/brands/hostinger 1.svg' },
  { name: 'Payload', src: '/images/brands/payload-logo-dark 1.svg' },
  { name: 'PostgreSQL', src: '/images/brands/postgresql-icon 1.svg' },
  { name: 'React', src: '/images/brands/react 1.svg' },
  { name: 'Vercel', src: '/images/brands/vercel 1.svg' },
]

export default function CaseStudiesSection({ locale }: CaseStudiesSectionProps) {
  const translations = useSiteContent().caseStudies
  const t = (field: Record<string, string>) => field[locale] || field['en']
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const headingRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const marqueeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      // Desktop animation: Pinning, scrubbing & snapping
      mm.add('(min-width: 1024px)', () => {
        gsap.set([headingRef.current, cardRef.current, marqueeRef.current], {
          opacity: 0,
          y: 60,
        })

        gsap.to([headingRef.current, cardRef.current, marqueeRef.current], {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.25,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        })

        ScrollTrigger.create({
          id: 'cases-pin',
          trigger: wrapperRef.current,
          start: 'top top',
          end: '+=200%', // Pin for 2 viewport heights to allow Services to slide over
          pin: true,
          pinSpacing: false, // Services will slide over Case Studies
          snap: {
            snapTo: [0, 0.5, 1], // Snap to start, middle, or end
            duration: { min: 0.3, max: 0.6 },
            delay: 0.05,
            ease: 'power2.out',
          },
          invalidateOnRefresh: true,
        })
      })

      // Mobile/tablet animation: Simple scroll trigger (no pinning/snapping)
      mm.add('(max-width: 1023px)', () => {
        gsap.set([headingRef.current, cardRef.current, marqueeRef.current], {
          opacity: 0,
          y: 40,
        })

        gsap.to([headingRef.current, cardRef.current, marqueeRef.current], {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.25,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: 'top 92%',
            toggleActions: 'play none none reverse',
          },
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
        <span className="text-[#0D0D0D]">{rest}</span>
      </>
    )
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <section 
        id="cases" 
        ref={sectionRef}
        className="pt-20 pb-20 lg:py-0 lg:pt-16 lg:pb-0 lg:h-screen lg:flex lg:flex-col lg:overflow-hidden w-full transition-colors duration-500 bg-white border-t border-b border-coal-400/5 dark:border-white/5 relative z-10 select-none"
      >
      <div className="max-w-[1170px] mx-auto px-[30px] w-full lg:flex lg:flex-1 lg:min-h-0 lg:flex-col">
        {/* Headings */}
        <div ref={headingRef} className="mb-[50px] shrink-0 text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
          <h2 className="font-sans text-[32px] lg:text-[40px] font-extralight leading-tight lg:leading-[50px] tracking-[9.6px] uppercase text-[#0D0D0D]">
            {renderStylizedTitle(t(translations.preTitle))}
          </h2>
          <p className="font-sans text-sm lg:text-base font-light leading-relaxed lg:leading-[28px] tracking-[3.2px] text-center text-[var(--gold-800,#8C806D)]">
            {t(translations.subtitle)}
          </p>
        </div>

        {/* Case study video — scaled proportionally (no crop); capped height so marquee fits on one screen */}
        <div
          ref={cardRef}
          className="relative mb-[50px] flex w-full flex-1 min-h-0 items-center justify-center bg-white aspect-video lg:aspect-auto"
        >
          <CaseStudyVideo src={CASE_STUDY_VIDEO} label={t(translations.cardTitle)} />
        </div>
      </div> {/* Close the max-width container here to make the marquee span the full screen width */}

      {/* Partners Marquee Running Belt */}
      <div ref={marqueeRef} className="relative w-full shrink-0 overflow-hidden py-4 border-t border-b border-coal-400/10 dark:border-white/5 select-none marquee-wrapper">
        {/* Faded edges overlay for premium depth */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Marquee scroll container */}
        <div className="relative w-full overflow-hidden flex flex-nowrap">
          {/* Row 1 */}
          <div className="flex gap-16 shrink-0 animate-marquee items-center min-w-full">
            {brandLogos.map((brand, i) => (
              <div
                key={`marquee-1-${i}`}
                className="flex items-center justify-center w-[160px] h-[70px] shrink-0"
              >
                <img
                  src={brand.src}
                  alt={brand.name}
                  className="max-w-[85%] max-h-[38px] object-contain transition-all duration-500 ease-out grayscale opacity-45 hover:grayscale-0 hover:opacity-100 hover:scale-110"
                />
              </div>
            ))}
          </div>

          {/* Cloned Row 2 for seamless infinite loop */}
          <div className="flex gap-16 shrink-0 animate-marquee items-center min-w-full" aria-hidden="true">
            {brandLogos.map((brand, i) => (
              <div
                key={`marquee-2-${i}`}
                className="flex items-center justify-center w-[160px] h-[70px] shrink-0"
              >
                <img
                  src={brand.src}
                  alt={brand.name}
                  className="max-w-[85%] max-h-[38px] object-contain transition-all duration-500 ease-out grayscale opacity-45 hover:grayscale-0 hover:opacity-100 hover:scale-110"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* Infinite scrolling keyframe animation */
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          animation: marquee 28s linear infinite;
        }
        .marquee-wrapper:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>
      </section>
    </div>
  )
}
