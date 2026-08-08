import {
  navbar,
  cookieConsent,
  hero,
  services,
  caseStudies,
  solutions,
  faq,
  footer,
  letsTalk,
  contactForm,
  accessibility,
  page,
} from '@/translations'

export type Localized = Record<string, string>

/** Desktop header strip media (contacts / portfolio / legal / order). */
export interface PageHeroMedia {
  type: 'image' | 'video'
  src: string
}

export type PageHeroKey = 'contacts' | 'portfolio' | 'legal' | 'order'

export interface SiteSettingsContent {
  email: string
  phone: string
  phoneDisplay: string
  facebook: string
  tiktok: string
  /** Per-page header strip heroes from Site Settings → Page Heroes. */
  pageHeroes: Partial<Record<PageHeroKey, PageHeroMedia>>
}

export interface SiteContent {
  navbar: typeof navbar
  cookieConsent: typeof cookieConsent
  hero: typeof hero & { backgroundImage?: string; backgroundImageMobile?: string }
  services: typeof services
  caseStudies: typeof caseStudies
  solutions: typeof solutions
  faq: typeof faq
  footer: typeof footer
  letsTalk: typeof letsTalk
  contactForm: typeof contactForm
  accessibility: typeof accessibility
  page: typeof page
  siteSettings: SiteSettingsContent
}

/**
 * Static fallback content (mirrors the legacy translations file).
 * Used as the default when Payload has no data yet, and as the base
 * over which Payload-managed content is merged.
 */
export const defaultSiteContent: SiteContent = {
  navbar,
  cookieConsent,
  hero,
  services,
  caseStudies,
  solutions,
  faq,
  footer,
  letsTalk,
  contactForm,
  accessibility,
  page,
  siteSettings: {
    email: 'erythro.ai@gmail.com',
    phone: '+972509312746',
    phoneDisplay: '+972 50 931 27 46',
    facebook: 'https://facebook.com/erythro.ai',
    tiktok: 'https://tiktok.com/@erythro.ai',
    pageHeroes: {},
  },
}
