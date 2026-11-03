/**
 * Open Graph / Twitter share images.
 *
 * Child `generateMetadata` replaces parent `openGraph` instead of merging
 * `images`, so every route that sets its own OG block must include an image
 * or LinkedIn/WhatsApp render an empty placeholder (PIT-079).
 */

export const DEFAULT_OG_IMAGE =
  'https://pub-bca1ac764c56451890e973c90029a977.r2.dev/Og.jpg'

export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

/**
 * Audit OG card on the main site origin (not pub-*.r2.dev).
 * Messengers already fetch homepage assets from erythro.ai reliably;
 * r2.dev is rate-limited and often yields a title/description preview with a blank image.
 */
const AUDIT_OG_IMAGE = 'https://erythro.ai/images/og/ai-audit.jpg'

/** Per-plan 1200×630 share cards. */
const PLAN_OG_IMAGES: Record<string, string> = {
  'business-automation':
    'https://pub-bca1ac764c56451890e973c90029a977.r2.dev/og/Business-Automation-4.jpg',
  'audit-free': AUDIT_OG_IMAGE,
  'audit-diagnostic': AUDIT_OG_IMAGE,
  'audit-pro': AUDIT_OG_IMAGE,
  'audit-pro-ads': AUDIT_OG_IMAGE,
}

export function ogImageForPlan(slug: string, siteOgImage?: string): string {
  return PLAN_OG_IMAGES[slug] || siteOgImage || DEFAULT_OG_IMAGE
}

export function ogImageFields(url: string, alt: string) {
  return {
    url,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt,
  }
}
