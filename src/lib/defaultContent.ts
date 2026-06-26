import {
  navbar,
  cookieConsent,
  hero,
  services,
  caseStudies,
  solutions,
  footer,
  letsTalk,
  accessibility,
  page,
} from '@/translations'

export type Localized = Record<string, string>

export interface SiteSettingsContent {
  email: string
  phone: string
  phoneDisplay: string
  facebook: string
  tiktok: string
}

export interface SiteContent {
  navbar: typeof navbar
  cookieConsent: typeof cookieConsent
  hero: typeof hero
  services: typeof services
  caseStudies: typeof caseStudies
  solutions: typeof solutions
  footer: typeof footer
  letsTalk: typeof letsTalk
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
  footer,
  letsTalk,
  accessibility,
  page,
  siteSettings: {
    email: 'erythro.ai@gmail.com',
    phone: '+972509312746',
    phoneDisplay: '+972 50 931 27 46',
    facebook: 'https://facebook.com/erythro.ai',
    tiktok: 'https://tiktok.com/@erythro.ai',
  },
}
