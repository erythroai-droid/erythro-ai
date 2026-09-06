import React from 'react'
import HomeClient from './HomeClient'
import { getCachedSiteContent } from '@/lib/getSiteContent'
import { heroStillSrc } from '@/lib/heroImage'

/**
 * Full Route Cache / CDN: static HTML with ISR. Must not call cookies()/headers()
 * anywhere in this tree (layout, not-found, or CMS loaders). Locale hydrates client-side.
 */
export const dynamic = 'force-static'
export const revalidate = 60

export default async function HomePage() {
  const content = await getCachedSiteContent()
  const mobileHero = content.hero.backgroundImageMobile
  const heroPreload = mobileHero ? heroStillSrc(mobileHero) : null

  return (
    <>
      {/*
        LCP preload: same absolute CDN URL as <img src> (PIT-058).
        One asset serves mobile still + desktop video poster.
      */}
      {heroPreload ? (
        <link rel="preload" as="image" href={heroPreload} fetchPriority="high" />
      ) : null}
      <HomeClient initialLocale="en" content={content} clientHydratePrefs />
    </>
  )
}
