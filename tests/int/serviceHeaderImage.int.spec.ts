import { describe, expect, it } from 'vitest'
import {
  resolveServiceHeaderSrc,
  shouldOptimizeServiceHeaderSrc,
} from '@/lib/serviceHeaderImage'

describe('serviceHeaderImage', () => {
  it('maps known CMS header JPGs to compressed public WebP', () => {
    expect(
      resolveServiceHeaderSrc(
        'https://pub-bca1ac764c56451890e973c90029a977.r2.dev/header_14.jpg',
        'ai-automation',
      ),
    ).toBe('/images/service-headers/ai-automation.webp')
    expect(resolveServiceHeaderSrc('/images/service_management.webp', 'management')).toBe(
      '/images/service-headers/management.webp',
    )
  })

  it('leaves unknown remote WebP alone (PIT-058)', () => {
    const src = 'https://cdn.example/custom-header.webp'
    expect(resolveServiceHeaderSrc(src, 'ai-automation')).toBe(src)
    expect(shouldOptimizeServiceHeaderSrc(src)).toBe(false)
  })

  it('optimizes unknown remote JPEG via next/image', () => {
    const src = 'https://cdn.example/new-upload.jpg'
    expect(resolveServiceHeaderSrc(src)).toBe(src)
    expect(shouldOptimizeServiceHeaderSrc(src)).toBe(true)
    expect(shouldOptimizeServiceHeaderSrc('/images/service-headers/development.webp')).toBe(
      false,
    )
  })
})
