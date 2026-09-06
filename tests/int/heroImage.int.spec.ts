import { describe, expect, it } from 'vitest'
import {
  HERO_IMAGE_DEVICE_SIZES,
  heroImageSrcSet,
  heroStillSrc,
  isAbsoluteHeroUrl,
} from '@/lib/heroImage'

describe('heroStillSrc', () => {
  it('keeps absolute CDN URLs (skip /_next/image)', () => {
    const src = 'https://pub-example.r2.dev/Hero_Mobile.webp'
    expect(isAbsoluteHeroUrl(src)).toBe(true)
    expect(heroStillSrc(src)).toBe(src)
  })

  it('routes relative paths through the image optimizer', () => {
    const src = '/images/Hero_Mobile.webp'
    expect(heroStillSrc(src, 750, 70)).toContain('/_next/image?')
    expect(heroStillSrc(src, 750, 70)).toContain('w=750')
    expect(heroStillSrc(src, 750, 70)).toContain('q=70')
  })
})

describe('heroImageSrcSet', () => {
  it('emits a candidate for each next/image device size', () => {
    const src = 'https://example.public.blob.vercel-storage.com/Hero_Mobile.webp'
    const set = heroImageSrcSet(src, 70)
    for (const w of HERO_IMAGE_DEVICE_SIZES) {
      expect(set).toContain(`w=${w}`)
      expect(set).toContain(`${w}w`)
    }
    expect(set).toContain(encodeURIComponent(src))
    expect(set).toContain('q=70')
  })
})
