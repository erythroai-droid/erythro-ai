import React from 'react'
import HomeClient from './HomeClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import {
  HERO_IMAGE_QUALITY,
  MOBILE_HERO_SIZES,
  heroImageSrcSet,
} from '@/lib/heroImage'

/**
 * Full Route Cache / CDN: static HTML with ISR. Must not call cookies()/headers()
 * anywhere in this tree (layout, not-found, or CMS loaders). Locale hydrates client-side.
 */
export const dynamic = 'force-static'
export const revalidate = 60

export default async function HomePage() {
  const content = await getCachedSiteContent()
  const mobileHero = content.hero.backgroundImageMobile

  return (
    <>
      {/*
        LCP preload in the document with fetchpriority=high + imageSrcSet.
        Mobile-only: desktop hero is video + desktop poster, so preloading
        Hero_Mobile.webp on lg+ wastes bandwidth (PSI unused-preload warning).
      */}
      {mobileHero ? (
        <link
          rel="preload"
          as="image"
          imageSrcSet={heroImageSrcSet(mobileHero, HERO_IMAGE_QUALITY)}
          imageSizes={MOBILE_HERO_SIZES}
          fetchPriority="high"
          media="(max-width: 1023px)"
        />
      ) : null}
      <HomeClient initialLocale="en" content={content} clientHydratePrefs />
    </>
  )
}
