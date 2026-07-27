'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useSiteContent } from '@/components/SiteContentProvider'
import type { PageHeroKey } from '@/lib/defaultContent'

const FALLBACK_SRC = '/images/small_chip.jpg'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface HeaderChipStripProps {
  /** Which Site Settings → Page Heroes upload to use. */
  page: PageHeroKey
}

export default function HeaderChipStrip({ page }: HeaderChipStripProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const { siteSettings } = useSiteContent()
  const hero = siteSettings.pageHeroes?.[page]
  const src = hero?.src || FALLBACK_SRC
  const type = hero?.type || 'image'

  useEffect(() => {
    if (!sectionRef.current) return

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

    return () => ctx.revert()
  }, [page])

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
