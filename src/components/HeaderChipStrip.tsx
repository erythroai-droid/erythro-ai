'use client'

import Image from 'next/image'
import { useSiteContent } from '@/components/SiteContentProvider'
import type { PageHeroKey } from '@/lib/defaultContent'

const FALLBACK_SRC = '/images/small_chip.jpg'

interface HeaderChipStripProps {
  /** Which Site Settings → Page Heroes upload to use. */
  page: PageHeroKey
}

/**
 * Header band behind the navbar (all breakpoints).
 * Media comes from Site Settings → Page Heroes; falls back to small_chip.jpg.
 */
export default function HeaderChipStrip({ page }: HeaderChipStripProps) {
  const { siteSettings } = useSiteContent()
  const hero = siteSettings.pageHeroes?.[page]
  const src = hero?.src || FALLBACK_SRC
  const type = hero?.type || 'image'

  return (
    <div
      aria-hidden
      data-header-chip-strip
      data-menu-contrast="dark"
      className="header-chip-strip-bg pointer-events-none absolute inset-x-0 top-0 z-0 h-[150px] overflow-hidden"
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
    </div>
  )
}
