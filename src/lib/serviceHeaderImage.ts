/**
 * Service page header strip is 150px × 100vw. CMS often stores full-quality
 * JPEGs (~230–320 KiB) at 1920×300 — fine dimensions, fat encoding.
 *
 * Prefer the compressed public WebP (~20–85 KiB) when we know the filename.
 * Unknown remote JPEG/PNG still go through next/image (they shrink); already
 * compact WebP stays on the CDN (PIT-058).
 */

const BY_FILENAME: Record<string, string> = {
  'header_14.jpg': '/images/service-headers/ai-automation.webp',
  'header_9.jpg': '/images/service-headers/design-branding.webp',
  'header_10.jpg': '/images/service-headers/development.webp',
  // Legacy square card fallbacks used as strip heroes
  'service_ai_automation.webp': '/images/service-headers/ai-automation.webp',
  'service_design_branding.webp': '/images/service-headers/design-branding.webp',
  'service_development.webp': '/images/service-headers/development.webp',
  'service_management.webp': '/images/service-headers/management.webp',
}

const BY_SLUG: Record<string, string> = {
  'ai-automation': '/images/service-headers/ai-automation.webp',
  'design-branding': '/images/service-headers/design-branding.webp',
  development: '/images/service-headers/development.webp',
  management: '/images/service-headers/management.webp',
}

function fileNameFromSrc(src: string): string {
  try {
    const path = src.includes('://') ? new URL(src).pathname : src
    return decodeURIComponent(path.split('/').pop() || '').split('?')[0] || ''
  } catch {
    return ''
  }
}

/** Map CMS / fallback hero URL to a compressed strip WebP when known. */
export function resolveServiceHeaderSrc(src: string, slug?: string): string {
  const name = fileNameFromSrc(src).toLowerCase()
  if (name && BY_FILENAME[name]) return BY_FILENAME[name]
  if (slug && BY_SLUG[slug]) {
    // Remote JPEG/PNG without a known filename still prefer the slug strip.
    if (/\.(jpe?g|png)(\?|$)/i.test(src) || src.startsWith('/images/service_')) {
      return BY_SLUG[slug]
    }
  }
  return src
}

/**
 * True when next/image should resize/encode (fat raster).
 * False for already-compact strip WebP (local or CDN) — avoid optimizer hop.
 */
export function shouldOptimizeServiceHeaderSrc(src: string): boolean {
  if (src.startsWith('/images/service-headers/')) return false
  if (/\.webp(\?|$)/i.test(src)) return false
  return /\.(jpe?g|png)(\?|$)/i.test(src) || /^https?:\/\//i.test(src)
}
