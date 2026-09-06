/**
 * Home hero still (mobile LCP + desktop video poster).
 *
 * Prefer the public CDN URL (R2) over `/_next/image`: the source is already a
 * compact WebP (~50 KiB / 1080×1920), and the optimizer adds a cold-cache hop
 * without shrinking bytes (PIT-058).
 */

export const HERO_IMAGE_QUALITY = 70

/** @deprecated Kept for tests / callers that still build optimizer srcsets. */
export const HERO_IMAGE_DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840] as const

export const MOBILE_HERO_SIZES = '(max-width: 1023px) 100vw, 1px'
export const DESKTOP_HERO_SIZES = '100vw'

export function isAbsoluteHeroUrl(src: string): boolean {
  return /^https?:\/\//i.test(src)
}

function optimizerSrc(src: string, width: number, quality: number): string {
  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality),
  })
  return `/_next/image?${params.toString()}`
}

/** Legacy optimizer srcset — prefer `heroStillSrc` + direct preload instead. */
export function heroImageSrcSet(src: string, quality = HERO_IMAGE_QUALITY): string {
  return HERO_IMAGE_DEVICE_SIZES.map((w) => `${optimizerSrc(src, w, quality)} ${w}w`).join(', ')
}

/**
 * URL to paint and preload for the hero still.
 * Absolute media URLs stay on the CDN; relative/local paths keep `/_next/image`.
 */
export function heroStillSrc(src: string, width = 1080, quality = HERO_IMAGE_QUALITY): string {
  if (isAbsoluteHeroUrl(src)) return src
  return optimizerSrc(src, width, quality)
}
