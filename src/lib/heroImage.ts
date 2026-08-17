/** Match next/image default `deviceSizes` so preload srcset = LCP srcset. */
export const HERO_IMAGE_DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840] as const

export const HERO_IMAGE_QUALITY = 70

export const MOBILE_HERO_SIZES = '(max-width: 1023px) 100vw, 1px'
export const DESKTOP_HERO_SIZES = '100vw'

function optimizerSrc(src: string, width: number, quality: number): string {
  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality),
  })
  return `/_next/image?${params.toString()}`
}

/** `imageSrcSet` for `<link rel="preload" as="image">` — same candidates as next/image. */
export function heroImageSrcSet(src: string, quality = HERO_IMAGE_QUALITY): string {
  return HERO_IMAGE_DEVICE_SIZES.map((w) => `${optimizerSrc(src, w, quality)} ${w}w`).join(', ')
}
