'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useSiteContent } from '@/components/SiteContentProvider'
import type { PageHeroKey } from '@/lib/defaultContent'

const FALLBACK_SRC = '/images/small_chip.jpg'

interface HeaderChipStripProps {
  /** Which Site Settings → Page Heroes upload to use. */
  page: PageHeroKey
  /** Desktop pin under the fixed navbar. Off for scroll-away chrome (ads LPs). */
  pin?: boolean
}

/**
 * Page-top chip image. GSAP pin is loaded only when `pin` is true so ads LPs
 * (pin=false) do not pull gsap/ScrollTrigger into the critical path.
 */
export default function HeaderChipStrip({ page, pin = true }: HeaderChipStripProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const { siteSettings } = useSiteContent()
  const hero = siteSettings.pageHeroes?.[page]
  const src = hero?.src || FALLBACK_SRC
  const type = hero?.type || 'image'

  useEffect(() => {
    if (!sectionRef.current || !pin) return

    let cancelled = false
    let revert: (() => void) | undefined

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled || !sectionRef.current) return

      gsap.registerPlugin(ScrollTrigger)

      const ctx = gsap.context(() => {
        const mm = gsap.matchMedia()

        mm.add('(min-width: 1024px)', () => {
          ScrollTrigger.create({
            id: `page-hero-pin-${page}`,
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=100%',
            pin: true,
            pinSpacing: false,
            invalidateOnRefresh: true,
          })
        })
      }, sectionRef)

      revert = () => ctx.revert()
    })()

    return () => {
      cancelled = true
      revert?.()
    }
  }, [page, pin])

  return (
    <section
      ref={sectionRef}
      aria-hidden
      id={`${page}-hero`}
      data-header-chip-strip
      data-menu-contrast="dark"
      className="header-chip-strip-bg relative z-10 h-[150px] w-full overflow-hidden"
    >
      {type === 'video' ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <Image
          src={src}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover"
        />
      )}
    </section>
  )
}
