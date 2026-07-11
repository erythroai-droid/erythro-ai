'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface HeroAnimationProps {
  imagesCount?: number
  basePath?: string
  children?: React.ReactNode
  navbar?: React.ReactNode
}

export default function HeroAnimation({
  children,
  navbar,
}: HeroAnimationProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // GSAP ScrollTrigger for content fade out
  useEffect(() => {
    if (!containerRef.current || !wrapperRef.current) return

    // Desktop-only animation setup using gsap.matchMedia
    const mm = gsap.matchMedia()

    mm.add('(min-width: 1024px)', () => {
      // No pin — the container is already position:fixed.
      // The wrapper height (220vh) provides scroll distance for the animation.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top top',
          // Finish the fade animation exactly when the next section (Case Studies)
          // begins to slide up over the fixed hero. The wrapper is 220vh tall, so
          // 'bottom bottom' resolves to scrollY = 220vh - 100vh = 120vh, which is the
          // precise point where the following section enters the viewport from below.
          end: 'bottom bottom',
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
      ScrollTrigger.sort()

      // Cinematic text fade out and scale
      if (contentRef.current) {
        tl.to(
          contentRef.current,
          {
            opacity: 0,
            scale: 0.92,
            y: -30,
            ease: 'power1.inOut',
            duration: 1.2,
          },
          0,
        )
      }
    })

    return () => {
      mm.revert()
    }
  }, [])

  return (
    /*
     * Wrapper height drives the scroll behaviour:
     * - Desktop (lg+): 220vh (100vh visible + 120vh of scrub distance for the content
     *   fade animation), with the inner container pinned via `fixed`.
     * - Mobile: a plain 100vh section that scrolls normally — no fixed container, no
     *   dead scroll distance.
     */
    <div
      ref={wrapperRef}
      className="sticky lg:relative top-0 lg:top-auto z-0 lg:z-auto w-full bg-coal-900 h-screen lg:h-[220vh]"
    >
      {/* Container: normal-flow on mobile (scrolls away), pinned (fixed) on desktop */}
      <div ref={containerRef} className="absolute inset-0 lg:fixed w-full h-screen bg-coal-900 overflow-hidden" style={{ zIndex: 0 }}>
        
        {/* Pinned Navbar */}
        {navbar}

        {/* Background Video */}
        <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0">
          <video
            src="/videos/Ai.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-85"
          />
        </div>

        {/* Dark overlay to dim the background video */}
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
