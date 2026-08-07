'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSiteContent } from './SiteContentProvider'
import StylizedSectionTitle from './StylizedSectionTitle'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface CaseStudiesSectionProps {
  locale: string
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isDesktop
}

const CASE_STUDY_POSTER = '/images/Dynamic-Urban-Slideshow.jpg'

/** Prefetches near the section; plays and fades in only while the block is in view. */
function CaseStudyVideo({
  src,
  label,
  sectionRef,
  containerRef,
  portrait = false,
}: {
  src: string
  label: string
  sectionRef: React.RefObject<HTMLElement | null>
  containerRef: React.RefObject<HTMLElement | null>
  portrait?: boolean
}) {
  const ref = useRef<HTMLVideoElement | null>(null)
  const [inView, setInView] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const prefetchedRef = useRef(false)

  useEffect(() => {
    setReady(false)
    setFailed(false)
    prefetchedRef.current = false
  }, [src])

  useEffect(() => {
    const el = ref.current
    const section = sectionRef.current
    const container = containerRef.current
    if (!el || failed) return

    const prefetch = () => {
      if (prefetchedRef.current) return
      prefetchedRef.current = true
      // metadata only — full `auto` fights Hero for bandwidth on mobile/CDN.
      el.preload = 'metadata'
      el.load()
    }

    const onEnded = () => {
      el.currentTime = 0
      el.play().catch(() => {})
    }
    const onCanPlay = () => setReady(true)
    const onError = () => {
      setFailed(true)
      setReady(false)
    }

    el.loop = true
    el.addEventListener('ended', onEnded)
    el.addEventListener('canplay', onCanPlay)
    el.addEventListener('error', onError)
    if (el.readyState >= 3) setReady(true)

    // Start buffering ~1 viewport before the user reaches Case Studies.
    const prefetchObserver = section
      ? new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) prefetch()
          },
          { rootMargin: '0px 0px 100% 0px', threshold: 0 },
        )
      : null

    // Observe the sized container (not the absolute video) so mobile IO works.
    const playTarget = container ?? el
    const playObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          prefetch()
          setInView(true)
          if (el.readyState < 2) el.preload = 'auto'
          void el.play().catch(() => {})
        } else {
          setInView(false)
          el.pause()
        }
      },
      { threshold: 0.05 },
    )

    if (prefetchObserver && section) prefetchObserver.observe(section)
    playObserver.observe(playTarget)

    return () => {
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('canplay', onCanPlay)
      el.removeEventListener('error', onError)
      prefetchObserver?.disconnect()
      playObserver.disconnect()
    }
  }, [src, sectionRef, containerRef, failed])

  if (failed) return null

  const showVideo = inView && ready

  return (
    <video
      key={src}
      ref={ref}
      src={src}
      poster={CASE_STUDY_POSTER}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
        portrait ? '' : 'scale-[1.14]'
      } ${showVideo ? 'opacity-100' : 'opacity-0'}`}
      muted
      loop
      playsInline
      preload="none"
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
  const isDesktop = useIsDesktop()
  const portfolioHref = translations.viewAllHref || '/portfolio'
  const videoSrc =
    isDesktop === null
      ? null
      : isDesktop
        ? translations.video
        : translations.videoMobile || translations.video
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const headingRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLAnchorElement | null>(null)
  const linkRef = useRef<HTMLDivElement | null>(null)
  const marqueeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      // Desktop animation: Pinning, scrubbing & snapping
      mm.add('(min-width: 1024px)', () => {
        gsap.set(
          [headingRef.current, cardRef.current, linkRef.current, marqueeRef.current],
          {
            opacity: 0,
            y: 60,
          },
        )

        gsap.to(
          [headingRef.current, cardRef.current, linkRef.current, marqueeRef.current],
          {
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
          },
        )

        ScrollTrigger.create({
          id: 'cases-pin',
          trigger: wrapperRef.current,
          start: 'top top',
          end: '+=260%', // Cover the Services lead-in spacer + overlap
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
        gsap.set(
          [headingRef.current, cardRef.current, linkRef.current, marqueeRef.current],
          {
            opacity: 0,
            y: 40,
          },
        )

        gsap.to(
          [headingRef.current, cardRef.current, linkRef.current, marqueeRef.current],
          {
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
          },
        )
      })
    }, wrapperRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={wrapperRef} className="relative w-full">
      <section
        id="cases"
        ref={sectionRef}
        data-menu-contrast="light"
        className="pt-20 pb-20 lg:py-0 lg:pt-16 lg:pb-0 lg:h-screen lg:flex lg:flex-col lg:overflow-hidden w-full transition-colors duration-500 bg-white border-t border-b border-coal-400/5 dark:border-white/5 relative z-10 select-none"
      >
      <div className="max-w-[1170px] mx-auto px-[30px] w-full lg:flex lg:flex-1 lg:min-h-0 lg:flex-col">
        {/* Headings */}
        <div ref={headingRef} className="mb-[50px] shrink-0 text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
          <h2 className="font-sans text-[32px] lg:text-[40px] font-extralight leading-tight lg:leading-[50px] tracking-[9.6px] uppercase text-[#0D0D0D]">
            <StylizedSectionTitle
              text={t(translations.preTitle)}
              restClassName="text-[#0D0D0D]"
            />
          </h2>
          <p className="font-sans text-sm lg:text-base font-light leading-relaxed lg:leading-[28px] tracking-[3.2px] text-center text-[var(--gold-800,#8C806D)]">
            {t(translations.subtitle)}
          </p>
        </div>

        {/* Mobile: 9:16 portrait player; desktop: flex slot for 16:9 video */}
        <Link
          ref={cardRef}
          href={portfolioHref}
          aria-label={t(translations.viewAllProjects).replace(/\s*>>\s*$/, '')}
          className="relative mx-auto block w-full max-w-[420px] aspect-[9/16] overflow-hidden bg-[#0D0D0D] transition-opacity duration-300 hover:opacity-95 lg:max-w-none lg:aspect-auto lg:flex-1 lg:min-h-0"
        >
          <img
            src={CASE_STUDY_POSTER}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${
              isDesktop === false ? '' : 'lg:scale-[1.14]'
            }`}
            aria-hidden
          />
          {videoSrc ? (
            <CaseStudyVideo
              key={videoSrc}
              src={videoSrc}
              label={t(translations.cardTitle)}
              sectionRef={sectionRef}
              containerRef={cardRef}
              portrait={isDesktop === false}
            />
          ) : null}
        </Link>

        <div
          ref={linkRef}
          className="relative z-20 mt-[34px] mb-[50px] shrink-0 flex justify-center pointer-events-auto"
        >
          <a
            href={portfolioHref}
            aria-label={t(translations.viewAllProjects).replace(/\s*>>\s*$/, '')}
            className="group inline-flex items-center gap-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-gold-900 transition-colors duration-300 hover:text-erythro-500"
          >
            <span aria-hidden="true">
              {t(translations.viewAllProjects)
                .replace(/\s*>>\s*$/, '')
                .split('')
                .map((char, i) => (
                  <span
                    key={`${char}-${i}`}
                    className="view-all-letter inline-block"
                    style={{ animationDelay: `${i * 35}ms` }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
            </span>
            <span
              className="inline-flex rtl:-scale-x-100"
              aria-hidden="true"
            >
              <span className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-[3px]">
                &gt;
              </span>
              <span className="inline-block transition-transform duration-300 ease-out delay-75 group-hover:translate-x-[3px]">
                &gt;
              </span>
            </span>
          </a>
        </div>
      </div> {/* Close the max-width container here to make the marquee span the full screen width */}

      {/* Partners Marquee Running Belt */}
      <div ref={marqueeRef} className="relative w-full shrink-0 overflow-hidden py-4 border-t border-b border-coal-400/10 dark:border-white/5 select-none marquee-wrapper">
        {/* Faded edges overlay for premium depth */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Marquee scroll container */}
        <div className="relative w-full overflow-hidden flex flex-nowrap">
          {/* Row 1 — pe-16 matches gap so the loop seam stays even */}
          <div className="flex shrink-0 animate-marquee items-center gap-16 pe-16">
            {brandLogos.map((brand, i) => (
              <div
                key={`marquee-1-${i}`}
                className="flex h-[70px] shrink-0 items-center justify-center"
              >
                <img
                  src={brand.src}
                  alt={brand.name}
                  className="h-[38px] w-auto max-w-[160px] object-contain transition-all duration-500 ease-out grayscale opacity-45 hover:grayscale-0 hover:opacity-100 hover:scale-110"
                />
              </div>
            ))}
          </div>

          {/* Cloned Row 2 for seamless infinite loop */}
          <div
            className="flex shrink-0 animate-marquee items-center gap-16 pe-16"
            aria-hidden="true"
          >
            {brandLogos.map((brand, i) => (
              <div
                key={`marquee-2-${i}`}
                className="flex h-[70px] shrink-0 items-center justify-center"
              >
                <img
                  src={brand.src}
                  alt={brand.name}
                  className="h-[38px] w-auto max-w-[160px] object-contain transition-all duration-500 ease-out grayscale opacity-45 hover:grayscale-0 hover:opacity-100 hover:scale-110"
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

        @keyframes view-all-letter-bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          35% {
            transform: translateY(-3px);
          }
          55% {
            transform: translateY(-0.5px);
          }
          70% {
            transform: translateY(-1.5px);
          }
        }
        .group:hover .view-all-letter {
          animation: view-all-letter-bounce 0.5s ease-out both;
        }
      `}</style>
      </section>
    </div>
  )
}
