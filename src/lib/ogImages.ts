/**
 * Open Graph / Twitter share images.
 *
 * Child `generateMetadata` replaces parent `openGraph` instead of merging
 * `images`, so every route that sets its own OG block must include an image
 * or LinkedIn/WhatsApp render an empty placeholder (PIT-079).
 *
 * Main site pages → {@link DEFAULT_OG_IMAGE} (logo on red).
 * Subpages (portfolio projects, LPs, consultants, offer cards) may override
 * with a dedicated 1200×630 asset when one exists.
 */

/** Logo on red — default share card for all main pages. */
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

/** Per-locale 1200×630 share cards for the leak calculator LP (leak-{en,ru,he}). */
const LEAK_CALC_OG_IMAGES: Record<'en' | 'ru' | 'he', string> = {
  en: 'https://erythro.ai/images/og/leak-calc-en.jpg',
  ru: 'https://erythro.ai/images/og/leak-calc-ru.jpg',
  he: 'https://erythro.ai/images/og/leak-calc-he.jpg',
}

/**
 * Dedicated 1200×630 OG cards for portfolio project pages.
 * Hosted on the site origin (same rationale as audit OG — avoid r2.dev rate limits).
 * Source files: `public/images/og/{slug}.jpg` (upscaled from chat 1024×537 if needed).
 */
const PORTFOLIO_OG_IMAGES: Record<string, string> = {
  'rosso-garage': 'https://erythro.ai/images/og/rosso-garage.jpg',
  'mustang-6663rt': 'https://erythro.ai/images/og/mustang-6663rt.jpg',
  'la-scala': 'https://erythro.ai/images/og/la-scala.jpg',
  ember: 'https://erythro.ai/images/og/ember.jpg',
}

export function ogImageForLeakCalc(locale: 'en' | 'ru' | 'he'): string {
  return LEAK_CALC_OG_IMAGES[locale]
}

export function ogImageForPlan(slug: string, siteOgImage?: string): string {
  return PLAN_OG_IMAGES[slug] || siteOgImage || DEFAULT_OG_IMAGE
}

/** Dedicated project OG, else hero/fallback. */
export function ogImageForPortfolioProject(slug: string, fallback?: string): string {
  return PORTFOLIO_OG_IMAGES[slug] || fallback || DEFAULT_OG_IMAGE
}

export function ogImageFields(url: string, alt: string) {
  return {
    url,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt,
  }
}

/** OG + Twitter image blocks for main pages (logo on red). */
export function defaultShareImages(alt: string) {
  const image = ogImageFields(DEFAULT_OG_IMAGE, alt)
  return {
    openGraphImages: [image],
    twitterImages: [DEFAULT_OG_IMAGE],
  }
}
