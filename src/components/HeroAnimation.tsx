'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/** Prefer <video> for Blob/media URLs unless the path clearly looks like an image. */
function isProbablyImageUrl(url: string): boolean {
  if (/\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(url)) return true
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url)) return false
  // Vercel Blob video uploads often keep the original name; if not, still prefer video
  // for hero backgrounds so a missing extension never renders as a broken <img>.
  if (url.includes('blob.vercel-storage.com')) return false
  if (url.includes('/api/media/file/')) return false
  return true
}

interface HeroAnimationProps {
  videoUrl?: string
  /** Still image for viewports <1024px — avoids downloading the desktop hero video. */
  mobileImageUrl?: string
  imagesCount?: number
  basePath?: string
  children?: React.ReactNode
  navbar?: React.ReactNode
}

export default function HeroAnimation({
  videoUrl,
  mobileImageUrl,
  children,
  navbar,
}: HeroAnimationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  // null = unknown (SSR / first paint). When a mobile still is set, assume mobile until proven lg+.
  const [isLg, setIsLg] = useState<boolean | null>(null)

  const desktopIsImage = Boolean(videoUrl && isProbablyImageUrl(videoUrl))
  const hasMobileImage = Boolean(mobileImageUrl)
  const showMobileImage = hasMobileImage && isLg !== true
  const showDesktopMedia = Boolean(videoUrl) && (isLg === true || !hasMobileImage)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setIsLg(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // GSAP ScrollTrigger for content fade out
  useEffect(() => {
    if (!containerRef.current || !wrapperRef.current) return

    // Desktop-only animation setup using gsap.matchMedia
    const mm = gsap.matchMedia()

    mm.add('(min-width: 1024px)', () => {
      const el = contentRef.current
      if (!el) return

      // Opacity-only scrub — y/scale on the way back makes copy visibly settle
      // downward after Top / scroll-to-top (even with scrub:true).
      gsap.set(el, { clearProps: 'transform', opacity: 1 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top top',
          // Finish the fade when the next section begins to cover the fixed hero.
          // Wrapper is 160vh → 'bottom bottom' = 60vh of scrub distance.
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
      ScrollTrigger.sort()

      tl.fromTo(
        el,
        { opacity: 1 },
        {
          opacity: 0,
          ease: 'power1.inOut',
          duration: 1.2,
        },
        0,
      )
    })

    return () => {
      mm.revert()
    }
  }, [])

  return (
    /*
     * Wrapper height drives the scroll behaviour:
     * - Desktop (lg+): 160vh (100vh visible + 60vh of scrub distance for the content
     *   fade animation), with the inner container pinned via `fixed`.
     * - Mobile: a plain 100vh section that scrolls normally — no fixed container, no
     *   dead scroll distance.
     */
    <div
      ref={wrapperRef}
      data-hero-scroll-root
      className="sticky lg:relative top-0 lg:top-auto z-0 lg:z-auto w-full bg-coal-900 h-[calc(100dvh-20px)] lg:h-[160vh]"
    >
      {/* Container: normal-flow on mobile (scrolls away), pinned (fixed) on desktop */}
      <div ref={containerRef} className="absolute inset-0 lg:fixed w-full h-[calc(100dvh-20px)] lg:h-screen bg-coal-900 overflow-hidden" style={{ zIndex: 0 }}>
        
        {/* Pinned Navbar */}
        {navbar}

        {/* Background Media — mount desktop video only on lg+ so mobile never downloads it. */}
        <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0" aria-hidden="true">
          {showMobileImage ? (
            <img
              src={mobileImageUrl}
              alt=""
              decoding="async"
              fetchPriority="high"
              className="h-full w-full object-cover opacity-85"
            />
          ) : null}

          {showDesktopMedia ? (
            desktopIsImage ? (
              <img
                src={videoUrl}
                alt=""
                decoding="async"
                className="h-full w-full object-cover opacity-85"
              />
            ) : (
              <video
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover opacity-85"
              />
            )
          ) : null}
        </div>

        {/* Dark overlay to dim the background media */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{ backgroundColor: 'rgba(13,13,13,0.45)' }}
        />

        {/* Overlay content layered on top of the video */}
        <div
          ref={contentRef}
          className="absolute inset-0 z-10 flex flex-col justify-center items-center pointer-events-none"
        >
          <div className="pointer-events-auto w-full h-full flex flex-col justify-center items-center">
            {children}
          </div>
        </div>

        {/* Ambient background gradients to tie layout to the overall site theme */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,#0D0D0D_90%)] z-0" />
      </div>
    </div>
  )
}
