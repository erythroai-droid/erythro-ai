import React from 'react'
import HomeClient from './HomeClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { getRequestPrefs } from '@/lib/requestPrefs'
import {
  DESKTOP_HERO_SIZES,
  HERO_IMAGE_QUALITY,
  MOBILE_HERO_SIZES,
  heroImageSrcSet,
} from '@/lib/heroImage'

export default async function HomePage() {
  const { initialLocale, initialTheme } = await getRequestPrefs()
  const content = await getCachedSiteContent()
  const mobileHero = content.hero.backgroundImageMobile

  return (
    <>
      {/*
        LCP preload in the document with fetchpriority=high + imageSrcSet.
        Do not use next/image `priority` (it injects a preload *without*
        fetchpriority and fights this hint).
      */}
      {mobileHero ? (
        <>
          <link
            rel="preload"
            as="image"
            imageSrcSet={heroImageSrcSet(mobileHero, HERO_IMAGE_QUALITY)}
            imageSizes={MOBILE_HERO_SIZES}
            fetchPriority="high"
            media="(max-width: 1023px)"
          />
          <link
            rel="preload"
            as="image"
            imageSrcSet={heroImageSrcSet(mobileHero, HERO_IMAGE_QUALITY)}
            imageSizes={DESKTOP_HERO_SIZES}
            fetchPriority="high"
            media="(min-width: 1024px)"
          />
        </>
      ) : null}
      <HomeClient initialLocale={initialLocale} initialTheme={initialTheme} content={content} />
    </>
  )
}
