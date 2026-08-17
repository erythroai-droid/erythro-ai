import React from 'react'
import HomeClient from './HomeClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getRequestPrefs } from '@/lib/requestPrefs'

/** Match next/image optimizer URL so preload hits the same bytes as LCP. */
function optimizedImageHref(src: string, width: number, quality = 70): string {
  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality),
  })
  return `/_next/image?${params.toString()}`
}

export default async function HomePage() {
  const { initialLocale, initialTheme } = await getRequestPrefs()
  const content = await getCachedSiteContent()
  const mobileHero = content.hero.backgroundImageMobile

  return (
    <>
      {/* LCP stills: presize for mobile (~828) and desktop poster (~1920), not full blob. */}
      {mobileHero ? (
        <>
          <link
            rel="preload"
            as="image"
            href={optimizedImageHref(mobileHero, 828)}
            fetchPriority="high"
            media="(max-width: 1023px)"
          />
          <link
            rel="preload"
            as="image"
            href={optimizedImageHref(mobileHero, 1920)}
            fetchPriority="high"
            media="(min-width: 1024px)"
          />
        </>
      ) : null}
      <HomeClient initialLocale={initialLocale} initialTheme={initialTheme} content={content} />
    </>
  )
}
