'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSiteContent } from './SiteContentProvider'
import StylizedSectionTitle from './StylizedSectionTitle'
import { loadGsapAfterLcp } from '@/lib/gsapAfterLcp'

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

type BannerSlide = { video: string; videoMobile?: string }

/**
 * Dual-buffer player: keep the current frame visible while the next slide buffers,
 * then crossfade. Only the active (and optionally next) file is attached — not all.
 */
function CaseStudyBannerPlayer({
  src,
  label,
  sectionRef,
  containerRef,
  loop = true,
  onEnded,
}: {
  src: string
  label: string
  sectionRef: React.RefObject<HTMLElement | null>
  containerRef: React.RefObject<HTMLElement | null>
  loop?: boolean
  onEnded?: () => void
}) {
  const layerARef = useRef<HTMLVideoElement | null>(null)
  const layerBRef = useRef<HTMLVideoElement | null>(null)
  const [frontIsA, setFrontIsA] = useState(true)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [sectionNear, setSectionNear] = useState(false)
  const [inView, setInView] = useState(false)
  const attachedRef = useRef<{ a: string | null; b: string | null }>({ a: null, b: null })
  const frontSrcRef = useRef<string | null>(null)
  const loadingSrcRef = useRef<string | null>(null)
  const inViewRef = useRef(false)
  const onEndedRef = useRef(onEnded)
  onEndedRef.current = onEnded

  const frontRef = frontIsA ? layerARef : layerBRef
  const backRef = frontIsA ? layerBRef : layerARef

  useEffect(() => {
    const section = sectionRef.current
    const container = containerRef.current
    if (!section && !container) return

    const nearObserver = section
      ? new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) setSectionNear(true)
          },
          { rootMargin: '0px 0px 50% 0px', threshold: 0 },
        )
      : null

    const playTarget = container ?? section
    const playObserver = playTarget
      ? new IntersectionObserver(
          ([entry]) => {
            inViewRef.current = entry.isIntersecting
            setInView(entry.isIntersecting)
          },
          { rootMargin: '120px 0px', threshold: 0.05 },
        )
      : null

    if (nearObserver && section) nearObserver.observe(section)
    if (playObserver && playTarget) playObserver.observe(playTarget)

    return () => {
      nearObserver?.disconnect()
      playObserver?.disconnect()
    }
  }, [sectionRef, containerRef])

  // Pause / resume the visible layer with viewport.
  useEffect(() => {
    const front = frontRef.current
    if (!front || !frontSrcRef.current) return
    if (inView) {
      void front.play().catch(() => {})
    } else {
      front.pause()
    }
  }, [inView, frontIsA, src])

  // Load / swap when src changes. Keep the front frame until the back layer is ready.
  useEffect(() => {
    if (!src || (!sectionNear && !inView)) return
    if (frontSrcRef.current === src) return
    if (loadingSrcRef.current === src) return

    const back = backRef.current
    const front = frontRef.current
    if (!back) return

    loadingSrcRef.current = src
    const backKey: 'a' | 'b' = frontIsA ? 'b' : 'a'
    const frontKey: 'a' | 'b' = frontIsA ? 'a' : 'b'

    const clearBack = () => {
      back.pause()
      back.removeAttribute('src')
      back.load()
      attachedRef.current[backKey] = null
    }

    const onReady = () => {
      if (loadingSrcRef.current !== src) return
      back.removeEventListener('canplay', onReady)
      back.removeEventListener('loadeddata', onReady)
      back.removeEventListener('error', onError)

      // Swap: show buffered layer, unload the previous file.
      setFrontIsA((v) => !v)
      frontSrcRef.current = src
      loadingSrcRef.current = null
      setHasPlayed(true)

      if (front) {
        front.pause()
        front.removeAttribute('src')
        front.load()
        attachedRef.current[frontKey] = null
      }

      if (inViewRef.current) void back.play().catch(() => {})
    }

    const onError = () => {
      if (loadingSrcRef.current !== src) return
      back.removeEventListener('canplay', onReady)
      back.removeEventListener('loadeddata', onReady)
      back.removeEventListener('error', onError)
      clearBack()
      loadingSrcRef.current = null
      // Advance past a broken slide; keep the last good frame if we already had one.
      if (!loop || !frontSrcRef.current) onEndedRef.current?.()
    }

    back.muted = true
    back.playsInline = true
    back.loop = loop
    back.preload = 'auto'
    if (attachedRef.current[backKey] !== src) {
      attachedRef.current[backKey] = src
      back.src = src
    }
    back.addEventListener('canplay', onReady)
    back.addEventListener('loadeddata', onReady)
    back.addEventListener('error', onError)
    back.load()
    if (back.readyState >= 3) onReady()

    return () => {
      back.removeEventListener('canplay', onReady)
      back.removeEventListener('loadeddata', onReady)
      back.removeEventListener('error', onError)
    }
    // frontIsA / backRef identity is derived; intentional deps are src + view gates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, sectionNear, inView, loop, frontIsA])

  // Wire ended on whichever layer is currently front.
  useEffect(() => {
    const front = frontRef.current
    if (!front) return

    const handleEnded = () => {
      if (loop) {
        front.currentTime = 0
        void front.play().catch(() => {})
        return
      }
      onEndedRef.current?.()
    }

    front.loop = loop
    front.addEventListener('ended', handleEnded)
    return () => front.removeEventListener('ended', handleEnded)
  }, [frontIsA, loop, src])

  const layerClass = (isFront: boolean) =>
    `absolute inset-0 z-[1] h-full w-full object-cover transition-opacity duration-300 ${
      isFront && hasPlayed ? 'opacity-100' : 'opacity-0'
    }`

  return (
    <>
      {/* Static poster only until the first real frame is ready — never during slide swaps. */}
      <img
        src={CASE_STUDY_POSTER}
        alt=""
        className={`absolute inset-0 z-0 h-full w-full object-cover transition-opacity duration-300 ${
          hasPlayed ? 'opacity-0' : 'opacity-100'
        }`}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        aria-hidden={hasPlayed}
      />
      <video
        ref={layerARef}
        className={layerClass(frontIsA)}
        muted
        playsInline
        preload="none"
        aria-label={frontIsA ? label : undefined}
        aria-hidden={!frontIsA}
      />
      <video
        ref={layerBRef}
        className={layerClass(!frontIsA)}
        muted
        playsInline
        preload="none"
        aria-label={!frontIsA ? label : undefined}
        aria-hidden={frontIsA}
      />
    </>
  )
}

const TRAILING_VIEW_ALL_CHEVRONS = /(?:[\s\u00A0\u202F])*(?:<<|>>|‹‹|››|«|»|＞＞|≫)+$/u
const STRAY_RIGHT_ARROWS = /[>›»＞≫]+/g

function stripViewAllChevrons(label: string) {
  return label.replace(TRAILING_VIEW_ALL_CHEVRONS, '').trim()
}

function viewAllLabelText(raw: string, isRtl: boolean) {
  let text = stripViewAllChevrons(raw)
  if (isRtl) {
    // CMS may store ">>" glued to the Hebrew label — drop right arrows from the label run.
    text = text.replace(STRAY_RIGHT_ARROWS, '').trim()
  }
  return text
}

function ViewAllChevrons({ isRtl }: { isRtl: boolean }) {
  const chevrons = isRtl ? (['<', '<'] as const) : (['>', '>'] as const)
  const hoverNudge = isRtl ? 'group-hover:-translate-x-[3px]' : 'group-hover:translate-x-[3px]'

  return (
    <span className="inline-flex" dir="ltr" aria-hidden="true">
      {chevrons.map((char, i) => (
        <span
          key={`${char}-${i}`}
          className={`view-all-chevron inline-block transition-transform duration-300 ease-out ${
            i === 1 ? `delay-75 ${hoverNudge}` : hoverNudge
          }`}
        >
          {char}
        </span>
      ))}
    </span>
  )
}

const SLIDER_COPY = {
  prev: { en: 'Previous banner', ru: 'Предыдущий баннер', he: 'באנר קודם' },
  next: { en: 'Next banner', ru: 'Следующий баннер', he: 'באנר הבא' },
  slide: { en: 'Banner', ru: 'Баннер', he: 'באנר' },
} as const

// Brand logos path mappings
const brandLogos = [
  { name: 'Adobe', src: '/images/brands/Adobe_Corporate_logo 1.svg' },
  { name: 'n8n', src: '/images/brands/N8n-logo-new 1.svg' },
  { name: 'Next.js', src: '/images/brands/Nextjs-logo 1.svg' },
  { name: 'Spring', src: '/images/brands/Spring_Framework_Logo_2018 1.svg' },
  { name: 'Figma', src: '/images/brands/figma 1.svg' },
  { name: 'GSAP', src: '/images/brands/gsap 1.svg' },
  { name: 'Hostinger', src: '/images/brands/hostinger 1.svg' },
  { name: 'Payload', src: '/images/brands/payload-logo-dark 1.svg' },
  { name: 'PostgreSQL', src: '/images/brands/postgresql-icon 1.svg' },
  { name: 'React', src: '/images/brands/react 1.svg' },
  { name: 'Vercel', src: '/images/brands/vercel 1.svg' },
]

function resolveSlides(translations: {
  banners?: BannerSlide[]
  video?: string
  videoMobile?: string
}): BannerSlide[] {
  const fromCms = Array.isArray(translations.banners)
    ? translations.banners.filter((b) => typeof b?.video === 'string' && b.video.trim())
    : []
  if (fromCms.length) return fromCms
  if (translations.video) {
    return [
      {
        video: translations.video,
        videoMobile: translations.videoMobile || translations.video,
      },
    ]
  }
  return []
}

function slideSrc(slide: BannerSlide, isDesktop: boolean | null): string | null {
  if (isDesktop === null) return null
  return isDesktop ? slide.video : slide.videoMobile || slide.video
}

export default function CaseStudiesSection({ locale }: CaseStudiesSectionProps) {
  const translations = useSiteContent().caseStudies
  const t = (field: Record<string, string>) => field[locale] || field['en']
  const isRtl = locale === 'he'
  const isDesktop = useIsDesktop()
  const portfolioHref = translations.viewAllHref || '/portfolio'
  const slides = resolveSlides(translations)
  const count = slides.length
  const [index, setIndex] = useState(0)
  const safeIndex = count ? index % count : 0
  const current = count ? slides[safeIndex] : null
  const videoSrc = current ? slideSrc(current, isDesktop) : null
  const multi = count > 1
  const lang = (locale === 'ru' || locale === 'he' ? locale : 'en') as 'en' | 'ru' | 'he'

  const go = (step: number) => {
    if (!count) return
    setIndex((i) => (i + step + count) % count)
  }

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const headingRef = useRef<HTMLDivElement | null>(null)
  const cardRef = useRef<HTMLAnchorElement | null>(null)
  const mediaBlockRef = useRef<HTMLDivElement | null>(null)
  const linkRef = useRef<HTMLDivElement | null>(null)
  const marqueeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (count && index >= count) setIndex(0)
  }, [count, index])

  // Prefetch the next slide file lightly while the current one plays (still only 1–2 at a time).
  useEffect(() => {
    if (!multi || isDesktop === null || typeof window === 'undefined') return
    const next = slides[(safeIndex + 1) % count]
    const nextUrl = slideSrc(next, isDesktop)
    if (!nextUrl) return
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'video'
    link.href = nextUrl
    document.head.appendChild(link)
    return () => {
      link.remove()
    }
  }, [multi, safeIndex, count, slides, isDesktop])

  useEffect(() => {
    let cancelled = false
    let ctx: { revert: () => void } | null = null

    void loadGsapAfterLcp().then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return
      ctx = gsap.context(() => {
        const mm = gsap.matchMedia()

        // Desktop animation: Pinning, scrubbing & snapping
        mm.add('(min-width: 1024px)', () => {
          // Keep the case card (poster) visible so the media slot never reads as empty
          // while the video buffers. Only chrome around it fades/slides in.
          gsap.set([headingRef.current, linkRef.current, marqueeRef.current], {
            opacity: 0,
            y: 60,
          })
          gsap.set(mediaBlockRef.current, {
            opacity: 1,
            y: 40,
          })

          gsap.to([headingRef.current, mediaBlockRef.current, linkRef.current, marqueeRef.current], {
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
          gsap.set([headingRef.current, linkRef.current], {
            opacity: 0,
            y: 40,
          })
          // Keep the marquee at y:0 — a downward tween would push logos under the
          // overlapping Services panel (HomeClient -mt-8 stacking).
          gsap.set(marqueeRef.current, { opacity: 0, y: 0 })
          gsap.set(mediaBlockRef.current, {
            opacity: 1,
            y: 24,
          })

          gsap.to([headingRef.current, mediaBlockRef.current, linkRef.current, marqueeRef.current], {
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
    })

    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [])

  return (
    <div className="relative z-[15] w-full lg:pointer-events-none">
      {/* Lead-in while AI Audit finishes clip-open + settle (pinSpacing: false). */}
      <div className="hidden lg:block h-[160vh] w-full pointer-events-none" aria-hidden />

      <div
        ref={wrapperRef}
        className="relative w-full bg-white max-lg:rounded-t-[28px] max-lg:pb-16 pointer-events-auto lg:flex lg:h-screen lg:flex-col lg:overflow-hidden"
      >
      <section
        id="cases"
        ref={sectionRef}
        data-menu-contrast="light"
        className="pt-20 pb-0 lg:py-0 lg:pt-16 lg:pb-0 lg:flex lg:flex-1 lg:min-h-0 lg:flex-col w-full transition-colors duration-500 bg-white border-t border-b border-coal-400/5 dark:border-white/5 relative z-10 select-none max-lg:rounded-t-[28px]"
      >
      <div className="max-w-[1170px] mx-auto px-[30px] w-full lg:flex lg:flex-1 lg:min-h-0 lg:flex-col lg:justify-center">
        {/* Headings */}
        <div ref={headingRef} className="mb-8 lg:mb-10 shrink-0 text-center max-w-2xl mx-auto flex flex-col items-center gap-3">
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

        {/* 1920×1080 (16:9) — natural height only (no flex-1 overflow over the CTA). */}
        <div ref={mediaBlockRef} className="relative mx-auto w-full max-w-full shrink-0">
          <Link
            ref={cardRef}
            href={portfolioHref}
            aria-label={viewAllLabelText(t(translations.viewAllProjects), isRtl)}
            className="relative block w-full aspect-video overflow-hidden bg-[#0D0D0D] transition-opacity duration-300 hover:opacity-95"
          >
            {videoSrc ? (
              <CaseStudyBannerPlayer
                src={videoSrc}
                label={`${t(translations.cardTitle)}${multi ? ` — ${safeIndex + 1}/${count}` : ''}`}
                sectionRef={sectionRef}
                containerRef={cardRef}
                loop={!multi}
                onEnded={multi ? () => go(1) : undefined}
              />
            ) : (
              <img
                src={CASE_STUDY_POSTER}
                alt=""
                className="absolute inset-0 z-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
              />
            )}
          </Link>

          {multi ? (
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center pb-3 sm:pb-4"
              dir="ltr"
            >
              <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-black/35 px-3 py-2 backdrop-blur-[2px]">
                <button
                  type="button"
                  aria-label={SLIDER_COPY.prev[lang]}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/15 hover:text-white"
                  onClick={(e) => {
                    e.preventDefault()
                    go(-1)
                  }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <div className="flex items-center gap-1.5" role="tablist" aria-label={t(translations.preTitle)}>
                  {slides.map((slide, i) => (
                    <button
                      key={`${slide.video}-${i}`}
                      type="button"
                      role="tab"
                      aria-selected={i === safeIndex}
                      aria-label={`${SLIDER_COPY.slide[lang]} ${i + 1} / ${count}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === safeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/70'
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        setIndex(i)
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  aria-label={SLIDER_COPY.next[lang]}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/15 hover:text-white"
                  onClick={(e) => {
                    e.preventDefault()
                    go(1)
                  }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div
          ref={linkRef}
          className="relative z-20 mt-6 mb-8 shrink-0 flex flex-col items-center gap-4 pointer-events-auto sm:mt-8 lg:mb-10"
        >
          <a
            href={portfolioHref}
            aria-label={viewAllLabelText(t(translations.viewAllProjects), isRtl)}
            className="group inline-flex items-center gap-1.5 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-gold-900 transition-colors duration-300 hover:text-erythro-500"
          >
            <span aria-hidden="true">
              {viewAllLabelText(t(translations.viewAllProjects), isRtl)
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
            <ViewAllChevrons isRtl={isRtl} />
          </a>
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

      {/* Partners Marquee — outside section so mobile stacking wrappers don't clip horizontal scroll */}
      <div
        ref={marqueeRef}
        dir="ltr"
        className="relative w-full shrink-0 overflow-hidden py-4 border-t border-b border-coal-400/10 dark:border-white/5 select-none marquee-wrapper bg-white"
      >
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
                  loading="lazy"
                  decoding="async"
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
                  loading="lazy"
                  decoding="async"
                  className="h-[38px] w-auto max-w-[160px] object-contain transition-all duration-500 ease-out grayscale opacity-45 hover:grayscale-0 hover:opacity-100 hover:scale-110"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
