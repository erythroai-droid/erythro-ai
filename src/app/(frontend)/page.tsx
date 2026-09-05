import React from 'react'
import HomeClient from './HomeClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import {
  HERO_IMAGE_QUALITY,
  DESKTOP_HERO_SIZES,
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
        LCP preload with fetchpriority=high + imageSrcSet.
        Split by media: mobile still vs desktop poster (same asset today, different sizes).
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
      <HomeClient initialLocale="en" content={content} clientHydratePrefs />
    </>
  )
}
