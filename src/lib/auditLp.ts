import type { SiteLocale } from '@/lib/sitePrefs'
import { isSiteLocale } from '@/lib/sitePrefs'
import { normalizeHost } from '@/lib/vercelHost'

export const AUDIT_LP_LOCALES = ['en', 'ru', 'he'] as const
export type AuditLpLocale = (typeof AUDIT_LP_LOCALES)[number]

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai').replace(/\/+$/, '')

/**
 * Production hosts for ads Final URLs (one locale each).
 * RU uses `audit-rus` — some ISP caches (Hotnet) kept NXDOMAIN for `audit-ru`
 * after the first lookup before the CF record existed.
 */
export const AUDIT_LP_HOST_BY_LOCALE: Record<AuditLpLocale, string> = {
  en: 'audit-en.erythro.ai',
  ru: 'audit-rus.erythro.ai',
  he: 'audit-he.erythro.ai',
}

const LOCALE_BY_HOST: Record<string, AuditLpLocale> = {
  'audit-en.erythro.ai': 'en',
  'audit-rus.erythro.ai': 'ru',
  /** Legacy label — still rewrite if ISP cache clears. */
  'audit-ru.erythro.ai': 'ru',
  'audit-he.erythro.ai': 'he',
}

export function isAuditLpLocale(value: string | null | undefined): value is AuditLpLocale {
  return !!value && (AUDIT_LP_LOCALES as readonly string[]).includes(value)
}

/** Locale locked by ads subdomain, or null on the main site. */
export function auditLpLocaleFromHost(host: string | null | undefined): AuditLpLocale | null {
  const h = normalizeHost(host)
  return LOCALE_BY_HOST[h] ?? null
}

export function isAuditLpHost(host: string | null | undefined): boolean {
  return auditLpLocaleFromHost(host) != null
}

/** Path used after middleware rewrite: `/lp/audit/ru`. */
export function auditLpLocaleFromPathname(pathname: string): AuditLpLocale | null {
  const match = (pathname.split('?')[0] || '/').match(/^\/lp\/audit\/(en|ru|he)(?:\/|$)/)
  return match?.[1] && isAuditLpLocale(match[1]) ? match[1] : null
}

export function auditLpPublicOrigin(locale: AuditLpLocale): string {
  return `https://${AUDIT_LP_HOST_BY_LOCALE[locale]}`
}

export function auditLpCanonicalUrl(locale: AuditLpLocale): string {
  return `${auditLpPublicOrigin(locale)}/`
}

/** Absolute URL on the main brand domain (reports, legal, home). */
export function mainSiteUrl(path = '/'): string {
  if (!path || path === '/') return `${SITE_URL}/`
  return path.startsWith('/') ? `${SITE_URL}${path}` : `${SITE_URL}/${path}`
}

export function toSiteLocale(locale: AuditLpLocale): SiteLocale {
  return isSiteLocale(locale) ? locale : 'en'
}

type Localized = { en: string; ru: string; he: string }

function t(field: Localized, locale: string): string {
  return field[locale as keyof Localized] || field.en
}

/** Ads LP copy — shorter than `/audit`, fixed per locale page. */
export const auditLpCopy = {
  /** Centered section title (short — wide tracking like home sections). */
  sectionTitle: {
    en: 'AI Audit',
    ru: 'AI Аудит',
    he: 'ביקורת AI',
  } satisfies Localized,
  eyebrow: {
    en: 'Free AI audit',
    ru: 'Бесплатный AI-аудит',
    he: 'ביקורת AI בחינם',
  } satisfies Localized,
  headline: {
    en: 'See what your site is losing',
    ru: 'Увидьте, где сайт теряет деньги',
    he: 'גלו איפה האתר מפסיד כסף',
  } satisfies Localized,
  subhead: {
    en: 'Score 0–100, top-3 risks, and a PDF preview — no card required.',
    ru: 'Оценка 0–100, топ-3 риска и PDF-превью — карта не нужна.',
    he: 'ציון 0–100, 3 סיכונים עיקריים ו-PDF — בלי כרטיס אשראי.',
  } satisfies Localized,
  about: {
    en: 'The lab runs a commercial QA audit on five scorecard scales. On the free plan we crawl the homepage in the language of this page — PageSpeed (mobile + desktop), forms, SEO, security headers, and AI Visibility signals. You get a 0–100 score with a letter grade (A+–F) and an HTML report you can open right away.',
    ru: 'Лаборатория проводит коммерческий QA-аудит по пяти шкалам. На бесплатном тарифе снимаем главную на языке этой страницы — PageSpeed (mobile + desktop), формы, SEO, security headers и сигналы AI Visibility. Вы получаете оценку 0–100 с грейдом (A+–F) и HTML-отчёт, который можно открыть сразу.',
    he: 'המעבדה מבצעת ביקורת QA מסחרית בחמש סקאלות. בחבילה החינמית סורקים את דף הבית בשפת העמוד — PageSpeed (מובייל + דסקטופ), טפסים, SEO, כותרות אבטחה ואותות נראות AI. אתם מקבלים ציון 0–100 עם דרגה (A+–F) ודוח HTML שאפשר לפתוח מיד.',
  } satisfies Localized,
  scalesHeading: {
    en: 'Five scorecard scales',
    ru: 'Пять шкал scorecard',
    he: 'חמש סקאלות scorecard',
  } satisfies Localized,
  scales: [
    {
      en: 'Speed & Mobile UX',
      ru: 'Скорость и мобильный UX',
      he: 'מהירות ו-UX למובייל',
    },
    {
      en: 'Lead gen & Forms',
      ru: 'Лиды и формы',
      he: 'לידים וטפסים',
    },
    {
      en: 'SEO & Visibility',
      ru: 'SEO и видимость',
      he: 'SEO ונראות',
    },
    {
      en: 'Security & Stability',
      ru: 'Безопасность и стабильность',
      he: 'אבטחה ויציבות',
    },
    {
      en: 'AI Visibility & Brand Discovery',
      ru: 'AI Visibility & Brand Discovery',
      he: 'נראות AI וגילוי מותג',
    },
  ] as const,
  deliverablesHeading: {
    en: 'In the free report',
    ru: 'В бесплатном отчёте',
    he: 'בדוח החינמי',
  } satisfies Localized,
  deliverables: [
    {
      en: 'Score 0–100 with letter grade (A+–F)',
      ru: 'Оценка 0–100 с грейдом (A+–F)',
      he: 'ציון 0–100 עם דרגה (A+–F)',
    },
    {
      en: 'Top-3 conversion risks with business impact',
      ru: 'Топ-3 риска конверсии с влиянием на бизнес',
      he: '3 סיכוני המרה עיקריים עם השפעה עסקית',
    },
    {
      en: 'Lighthouse summary (mobile + desktop)',
      ru: 'Сводка Lighthouse (mobile + desktop)',
      he: 'סיכום Lighthouse (מובייל + דסקטופ)',
    },
    {
      en: 'HTML report in the language of this page',
      ru: 'HTML-отчёт на языке этой страницы',
      he: 'דוח HTML בשפת העמוד הזה',
    },
  ] as const,
  freeBadge: {
    en: 'Free · no card · 1 domain / 7 days',
    ru: 'Free · без карты · 1 домен / 7 дней',
    he: 'Free · בלי כרטיס · דומיין אחד / 7 ימים',
  } satisfies Localized,
  benefitsKicker: {
    en: 'How it works',
    ru: 'Как это работает',
    he: 'איך זה עובד',
  } satisfies Localized,
  benefitsHeading: {
    en: 'Three steps to a clear picture',
    ru: 'Три шага к понятной картине',
    he: 'שלושה שלבים לתמונה ברורה',
  } satisfies Localized,
  /** Step cards — same rhythm as `/audit` “How it works”. */
  benefits: [
    {
      title: {
        en: 'Send your site URL',
        ru: 'Отправьте URL сайта',
        he: 'שלחו את כתובת האתר',
      } satisfies Localized,
      body: {
        en: 'Email + domain. Report language matches this page. No credit card for the free preview.',
        ru: 'Email и домен. Язык отчёта — как на этой странице. Для превью карта не нужна.',
        he: 'אימייל ודומיין. שפת הדוח כמו בעמוד. לתצוגה מקדימה לא נדרש כרטיס.',
      } satisfies Localized,
    },
    {
      title: {
        en: 'Lab scores five scales',
        ru: 'Лаборатория считает пять шкал',
        he: 'המעבדה מחשבת חמש סקאלות',
      } satisfies Localized,
      body: {
        en: '60+ signals: PageSpeed mobile + desktop, forms, SEO, security, AI Visibility. Free plan crawls the homepage.',
        ru: '60+ сигналов: PageSpeed mobile + desktop, формы, SEO, безопасность, AI Visibility. Free снимает главную.',
        he: '60+ אותות: PageSpeed מובייל + דסקטופ, טפסים, SEO, אבטחה, נראות AI. Free סורק את דף הבית.',
      } satisfies Localized,
    },
    {
      title: {
        en: 'Score, top-3, HTML report',
        ru: 'Оценка, топ-3, HTML-отчёт',
        he: 'ציון, טופ-3, דוח HTML',
      } satisfies Localized,
      body: {
        en: '0–100 with letter grade (A+–F), top conversion risks, Lighthouse — in the language of this page.',
        ru: '0–100 с грейдом (A+–F), топ рисков конверсии, Lighthouse — на языке этой страницы.',
        he: '0–100 עם דרגה (A+–F), סיכוני המרה עיקריים ו-Lighthouse — בשפת העמוד.',
      } satisfies Localized,
    },
  ] as const,
  formKicker: {
    en: 'Start free audit',
    ru: 'Запустить бесплатный аудит',
    he: 'להתחיל ביקורת בחינם',
  } satisfies Localized,
  legalNote: {
    en: 'By continuing you agree to our privacy policy.',
    ru: 'Продолжая, вы соглашаетесь с политикой конфиденциальности.',
    he: 'בהמשך אתם מסכימים למדיניות הפרטיות.',
  } satisfies Localized,
  homeLink: {
    en: 'erythro.ai',
    ru: 'erythro.ai',
    he: 'erythro.ai',
  } satisfies Localized,
  privacy: {
    en: 'Privacy',
    ru: 'Конфиденциальность',
    he: 'פרטיות',
  } satisfies Localized,
  terms: {
    en: 'Terms',
    ru: 'Условия',
    he: 'תנאים',
  } satisfies Localized,
} as const

export function tAuditLp(field: Localized, locale: string): string {
  return t(field, locale)
}
