'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { waitForSplashDone } from '@/lib/splash'

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
  /**
   * Still used as LCP / video poster on desktop when background is video.
   * Falls back to mobileImageUrl when omitted.
   */
  posterUrl?: string
  imagesCount?: number
  basePath?: string
  children?: React.ReactNode
  navbar?: React.ReactNode
}

export default function HeroAnimation({
  videoUrl,
  mobileImageUrl,
  posterUrl,
  children,
  navbar,
}: HeroAnimationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [isLg, setIsLg] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const [desktopVideoPlaying, setDesktopVideoPlaying] = useState(false)

  const desktopIsImage = Boolean(videoUrl && isProbablyImageUrl(videoUrl))
  const hasMobileImage = Boolean(mobileImageUrl)
  const desktopPoster = posterUrl || mobileImageUrl
  // Mount video only after splash + lg so mobile never downloads it and LCP can use the poster.
  const showDesktopVideo =
    Boolean(videoUrl) && !desktopIsImage && isLg && splashDone
  const showDesktopImage = Boolean(videoUrl) && desktopIsImage && isLg
  // Poster only until the video is actually playing — otherwise mobile still sits under/over the banner.
  const showDesktopPoster =
    Boolean(desktopPoster) && !desktopIsImage && isLg && !desktopVideoPlaying

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setIsLg(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    let cancelled = false
    void waitForSplashDone().then(() => {
      if (!cancelled) setSplashDone(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!showDesktopVideo) setDesktopVideoPlaying(false)
  }, [showDesktopVideo, videoUrl])

  // GSAP ScrollTrigger for content fade out
  useEffect(() => {
    if (!containerRef.current || !wrapperRef.current) return

    const mm = gsap.matchMedia()

    mm.add('(min-width: 1024px)', () => {
      const el = contentRef.current
      if (!el) return

      gsap.set(el, { clearProps: 'transform', opacity: 1 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top top',
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
    <div
      ref={wrapperRef}
      data-hero-scroll-root
      className="sticky lg:relative top-0 lg:top-auto z-0 lg:z-auto w-full bg-coal-900 h-[calc(100dvh-20px)] lg:h-[160vh]"
    >
      <div
        ref={containerRef}
        className="absolute inset-0 lg:fixed w-full h-[calc(100dvh-20px)] lg:h-screen bg-coal-900 overflow-hidden"
        style={{ zIndex: 0 }}
      >
        {navbar}

        <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0" aria-hidden="true">
          {/* Mobile LCP still — CSS-gated so desktop never paints it. */}
          {hasMobileImage ? (
            <img
              src={mobileImageUrl}
              alt=""
              decoding="async"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover opacity-85 lg:hidden"
            />
          ) : null}

          {/* Desktop video poster / LCP still — removed once video is playing. */}
          {showDesktopPoster ? (
            <img
              src={desktopPoster}
              alt=""
              decoding="async"
              fetchPriority="high"
              className="absolute inset-0 hidden h-full w-full object-cover opacity-85 lg:block"
            />
          ) : null}

          {showDesktopImage ? (
            <img
              src={videoUrl}
              alt=""
              decoding="async"
              fetchPriority="high"
              className="absolute inset-0 hidden h-full w-full object-cover opacity-85 lg:block"
            />
          ) : null}

          {showDesktopVideo ? (
            <video
              key={videoUrl}
              src={videoUrl}
              poster={desktopPoster || undefined}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              onPlaying={() => setDesktopVideoPlaying(true)}
              onLoadedData={(e) => {
                // Fallback if autoplay already advanced past the first frame.
                const v = e.currentTarget
                if (!v.paused && v.readyState >= 2) setDesktopVideoPlaying(true)
              }}
              className="absolute inset-0 hidden h-full w-full object-cover opacity-85 lg:block"
            />
          ) : null}
        </div>

        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{ backgroundColor: 'rgba(13,13,13,0.45)' }}
        />

        <div
          ref={contentRef}
          className="absolute inset-0 z-10 flex flex-col justify-center items-center pointer-events-none"
        >
          <div className="pointer-events-auto w-full h-full flex flex-col justify-center items-center">
            {children}
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,#0D0D0D_90%)] z-0" />
      </div>
    </div>
  )
}
