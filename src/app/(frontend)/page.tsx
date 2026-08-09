import React from 'react'
import HomeClient from './HomeClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getRequestPrefs } from '@/lib/requestPrefs'

export default async function HomePage() {
  const { initialLocale, initialTheme } = await getRequestPrefs()
  const content = await getCachedSiteContent()
  const mobileHero = content.hero.backgroundImageMobile

  return (
    <>
      {/* Discover mobile LCP image before client JS; desktop keeps the hero video. */}
      {mobileHero ? (
        <link
          rel="preload"
          as="image"
          href={mobileHero}
          fetchPriority="high"
          media="(max-width: 1023px)"
        />
      ) : null}
      <HomeClient initialLocale={initialLocale} initialTheme={initialTheme} content={content} />
    </>
  )
}
