import { describe, expect, it } from 'vitest'
import { HERO_IMAGE_DEVICE_SIZES, heroImageSrcSet } from '@/lib/heroImage'

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
