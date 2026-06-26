'use client'

import React, { useEffect, useRef } from 'react'
import Button from './Button'
import { useSiteContent } from './SiteContentProvider'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface CaseStudiesSectionProps {
  locale: string
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
        className="pt-20 pb-20 lg:py-0 lg:pt-20 lg:h-screen lg:flex lg:flex-col lg:justify-start w-full transition-colors duration-500 bg-[var(--gold-100,#FFF)] border-t border-b border-coal-400/5 dark:border-white/5 bg-noise relative z-10 overflow-hidden select-none"
      >
      <div className="max-w-[1170px] mx-auto px-[30px] w-full">
        {/* Headings */}
        <div ref={headingRef} className="mb-16 lg:mb-10 text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
          <h2 className="font-sans text-[32px] lg:text-[48px] font-extralight leading-tight lg:leading-[60px] tracking-[9.6px] uppercase text-[#0D0D0D]">
            {renderStylizedTitle(t(translations.preTitle))}
          </h2>
          <p className="font-sans text-sm lg:text-base font-light leading-relaxed lg:leading-[32px] tracking-[3.2px] text-center text-[var(--gold-800,#8C806D)]">
            {t(translations.subtitle)}
          </p>
        </div>

        {/* Portfolio Banner Card */}
        <div ref={cardRef} className="relative w-full rounded-[30px] md:rounded-[40px] bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-950 border border-white/10 p-8 md:p-12 lg:py-10 lg:px-14 shadow-2xl mb-16 lg:mb-10 overflow-hidden group">
          {/* Card background glowing grid & ambient spots */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column: Mockup Text & Interface */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-left z-10">
              {/* Site Header Mockup inside Card */}
              <div className="flex items-center justify-between w-full border-b border-white/10 pb-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-erythro-500 flex items-center justify-center text-[10px] font-black text-white">
                    E
                  </div>
                  <span className="font-sans text-[10px] font-bold tracking-widest text-white uppercase">
                    ERYTHRO.AI
                  </span>
                </div>
                {/* Burger Icon */}
                <div className="flex flex-col gap-1 cursor-pointer">
                  <span className="w-4 h-0.5 bg-white/70"></span>
                  <span className="w-4 h-0.5 bg-white/70"></span>
                </div>
              </div>

              {/* Category tag */}
              <div>
                <span className="inline-block px-3 py-1 text-[9px] tracking-widest font-mono text-gold-300 border border-gold-300/20 rounded-radius-sm bg-gold-300/5 uppercase">
                  {t(translations.cardCategory)}
                </span>
              </div>

              {/* Main Heading */}
              <h3 className="font-sans text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {t(translations.cardTitle)}
              </h3>

              {/* Description */}
              <p className="font-sans text-sm md:text-base text-gold-300/70 leading-relaxed max-w-xl">
                {t(translations.cardDescription)}
              </p>

              {/* Action Button */}
              <div className="mt-4">
                <Button variant="light-accent" className="font-semibold px-8 py-3.5 text-xs">
                  {t(translations.cardCTA)}
                </Button>
              </div>
            </div>

            {/* Right Column: Premium CSS/SVG Floating Rocket */}
            <div className="lg:col-span-5 flex justify-center items-center relative h-[280px] md:h-[360px] w-full overflow-hidden rounded-2xl bg-black/20 border border-white/5 backdrop-blur-sm">
              {/* Starfield simulation */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/5 w-1 h-1 bg-white rounded-full animate-ping opacity-60" />
                <div className="absolute top-2/3 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse opacity-80" />
                <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-purple-300 rounded-full animate-pulse opacity-90" />
                <div className="absolute top-3/4 right-1/5 w-1 h-1 bg-white rounded-full animate-ping opacity-75" />
                <div className="absolute bottom-1/5 left-10 w-1.5 h-1.5 bg-indigo-300 rounded-full animate-pulse opacity-50" />
              </div>

              {/* Space Rocket Illustration Container */}
              <div className="rocket-illustration flex flex-col items-center justify-center relative">
                {/* Sleek Gradient Rocket SVG */}
                <svg
                  className="w-24 h-44 drop-shadow-[0_10px_30px_rgba(139,92,246,0.3)]"
                  viewBox="0 0 100 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Fire Flame jet */}
                  <g className="flame-jet">
                    <path
                      d="M50 145 C35 170, 50 195, 50 195 C50 195, 65 170, 50 145 Z"
                      fill="url(#fireGradient)"
                    />
                    <path
                      d="M50 145 C42 160, 50 180, 50 180 C50 180, 58 160, 50 145 Z"
                      fill="#FBBF24"
                    />
                  </g>

                  {/* Left Fin */}
                  <path
                    d="M30 110 L15 140 C15 140, 20 145, 30 140 Z"
                    fill="url(#finGradient)"
                  />
                  {/* Right Fin */}
                  <path
                    d="M70 110 L85 140 C85 140, 80 145, 70 140 Z"
                    fill="url(#finGradient)"
                  />

                  {/* Rocket Body */}
                  <path
                    d="M50 15 C68 50, 70 100, 70 135 L30 135 C30 100, 32 50, 50 15 Z"
                    fill="url(#bodyGradient)"
                  />

                  {/* Red Nose Cone */}
                  <path
                    d="M50 15 C59 32, 63 50, 63 60 L37 60 C37 50, 41 32, 50 15 Z"
                    fill="url(#noseGradient)"
                  />

                  {/* Viewport Window */}
                  <circle cx="50" cy="85" r="12" fill="#1E293B" stroke="url(#windowBorder)" strokeWidth="2" />
                  <circle cx="50" cy="85" r="8" fill="url(#windowGlass)" />
                  <circle cx="47" cy="82" r="3" fill="#ffffff" opacity="0.5" />

                  {/* Gradients Definitions */}
                  <defs>
                    <linearGradient id="bodyGradient" x1="50" y1="15" x2="50" y2="135" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F1F5F9" />
                      <stop offset="0.8" stopColor="#CBD5E1" />
                      <stop offset="1" stopColor="#94A3B8" />
                    </linearGradient>
                    <linearGradient id="noseGradient" x1="50" y1="15" x2="50" y2="60" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#EF4444" />
                      <stop offset="1" stopColor="#B91C1C" />
                    </linearGradient>
                    <linearGradient id="finGradient" x1="50" y1="110" x2="50" y2="145" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#EF4444" />
                      <stop offset="1" stopColor="#991B1B" />
                    </linearGradient>
                    <linearGradient id="fireGradient" x1="50" y1="145" x2="50" y2="195" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F59E0B" />
                      <stop offset="0.5" stopColor="#EF4444" />
                      <stop offset="1" stopColor="#EF4444" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="windowBorder" x1="38" y1="85" x2="62" y2="85" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#94A3B8" />
                      <stop offset="1" stopColor="#475569" />
                    </linearGradient>
                    <linearGradient id="windowGlass" x1="50" y1="77" x2="50" y2="93" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#38BDF8" />
                      <stop offset="1" stopColor="#0284C7" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div> {/* Close the max-width container here to make the marquee span the full screen width */}

      {/* Partners Marquee Running Belt */}
      <div ref={marqueeRef} className="relative w-full overflow-hidden py-4 border-t border-b border-coal-400/10 dark:border-white/5 select-none marquee-wrapper">
        {/* Faded edges overlay for premium depth */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[var(--gold-100,#FFF)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[var(--gold-100,#FFF)] to-transparent z-10 pointer-events-none" />

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

        /* Float animation for space rocket */
        @keyframes floatRocket {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-12px) rotate(1.5deg);
          }
        }
        .rocket-illustration {
          animation: floatRocket 4.5s ease-in-out infinite;
        }

        /* Flame thrust flickering animation */
        @keyframes flameThrust {
          0%, 100% {
            transform: scaleY(1) scaleX(1);
            opacity: 0.9;
          }
          50% {
            transform: scaleY(1.18) scaleX(0.92);
            opacity: 1;
            filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.7));
          }
        }
        .flame-jet {
          transform-origin: 50% 145px;
          animation: flameThrust 0.15s ease-in-out infinite;
        }
      `}</style>
      </section>
    </div>
  )
}
