import type { SiteLocale } from '@/lib/sitePrefs'
import { isSiteLocale } from '@/lib/sitePrefs'
import { normalizeHost } from '@/lib/vercelHost'

export const AUDIT_LP_LOCALES = ['en', 'ru', 'he'] as const
export type AuditLpLocale = (typeof AUDIT_LP_LOCALES)[number]

export const AUDIT_LP_PRODUCTS = ['free', 'pro', 'diagnostic'] as const
export type AuditLpProduct = (typeof AUDIT_LP_PRODUCTS)[number]

export type AuditLpTarget = {
  product: AuditLpProduct
  locale: AuditLpLocale
}

/**
 * Temporary: ads LP forms skip Turnstile (honeypot + rate limits remain).
 * Flip to `true` when spam warrants captcha again. Main `/audit` is unchanged.
 */
export const AUDIT_LP_TURNSTILE_ENABLED = false

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai').replace(/\/+$/, '')

/**
 * Production hosts for ads Final URLs (one locale each).
 * Public RU free host is `audit-ru` (live DNS). `audit-rus` stays a middleware
 * alias only — that label was never published in CF DNS (NXDOMAIN).
 */
export const AUDIT_LP_HOSTS_BY_PRODUCT: Record<
  AuditLpProduct,
  Record<AuditLpLocale, string>
> = {
  free: {
    en: 'audit-en.erythro.ai',
    ru: 'audit-ru.erythro.ai',
    he: 'audit-he.erythro.ai',
  },
  pro: {
    en: 'audit-pro-en.erythro.ai',
    ru: 'audit-pro-ru.erythro.ai',
    he: 'audit-pro-he.erythro.ai',
  },
  diagnostic: {
    en: 'audit-diag-en.erythro.ai',
    ru: 'audit-diag-ru.erythro.ai',
    he: 'audit-diag-he.erythro.ai',
  },
}

/** Free LP hosts — kept for callers that only mean the express/free ads LP. */
export const AUDIT_LP_HOST_BY_LOCALE: Record<AuditLpLocale, string> =
  AUDIT_LP_HOSTS_BY_PRODUCT.free

/** Every ads LP hostname (Turnstile allowlist, splash, etc.). */
export const AUDIT_LP_ALL_HOSTS: readonly string[] = [
  ...Object.values(AUDIT_LP_HOSTS_BY_PRODUCT.free),
  ...Object.values(AUDIT_LP_HOSTS_BY_PRODUCT.pro),
  ...Object.values(AUDIT_LP_HOSTS_BY_PRODUCT.diagnostic),
  'audit-rus.erythro.ai', // unused free RU alias
]

const TARGET_BY_HOST: Record<string, AuditLpTarget> = (() => {
  const map: Record<string, AuditLpTarget> = {}
  for (const product of AUDIT_LP_PRODUCTS) {
    for (const locale of AUDIT_LP_LOCALES) {
      map[AUDIT_LP_HOSTS_BY_PRODUCT[product][locale]] = { product, locale }
    }
  }
  map['audit-rus.erythro.ai'] = { product: 'free', locale: 'ru' }
  return map
})()

export function isAuditLpLocale(value: string | null | undefined): value is AuditLpLocale {
  return !!value && (AUDIT_LP_LOCALES as readonly string[]).includes(value)
}

export function isAuditLpProduct(value: string | null | undefined): value is AuditLpProduct {
  return !!value && (AUDIT_LP_PRODUCTS as readonly string[]).includes(value)
}

/** Product + locale locked by ads subdomain, or null on the main site. */
export function auditLpTargetFromHost(host: string | null | undefined): AuditLpTarget | null {
  const h = normalizeHost(host)
  return TARGET_BY_HOST[h] ?? null
}

/** Locale locked by ads subdomain, or null on the main site. */
export function auditLpLocaleFromHost(host: string | null | undefined): AuditLpLocale | null {
  return auditLpTargetFromHost(host)?.locale ?? null
}

export function isAuditLpHost(host: string | null | undefined): boolean {
  return auditLpTargetFromHost(host) != null
}

/** Internal App Router path after middleware rewrite. */
export function auditLpInternalPath(product: AuditLpProduct, locale: AuditLpLocale): string {
  if (product === 'free') return `/lp/audit/${locale}`
  return `/lp/audit/${product}/${locale}`
}

/**
 * Path after rewrite: `/lp/audit/ru` or `/lp/audit/pro/ru`.
 * Product segment must be parsed before treating the next token as locale.
 */
export function auditLpTargetFromPathname(pathname: string): AuditLpTarget | null {
  const clean = pathname.split('?')[0] || '/'
  const match = clean.match(/^\/lp\/audit\/(?:(pro|diagnostic)\/)?(en|ru|he)(?:\/|$)/)
  if (!match?.[2] || !isAuditLpLocale(match[2])) return null
  const product = match[1] && isAuditLpProduct(match[1]) ? match[1] : 'free'
  return { product, locale: match[2] }
}

export function auditLpLocaleFromPathname(pathname: string): AuditLpLocale | null {
  return auditLpTargetFromPathname(pathname)?.locale ?? null
}

export function auditLpPublicOrigin(
  locale: AuditLpLocale,
  product: AuditLpProduct = 'free',
): string {
  return `https://${AUDIT_LP_HOSTS_BY_PRODUCT[product][locale]}`
}

export function auditLpCanonicalUrl(
  locale: AuditLpLocale,
  product: AuditLpProduct = 'free',
): string {
  return `${auditLpPublicOrigin(locale, product)}/`
}

function usePathLpHref(currentHost?: string | null): boolean {
  const h = normalizeHost(currentHost)
  return (
    process.env.NODE_ENV === 'development' ||
    h === 'localhost' ||
    h === '127.0.0.1' ||
    (h != null && h.endsWith('.vercel.app')) ||
    (h != null && h.endsWith('.local'))
  )
}

/**
 * Href for switching LP locale within the same product.
 * Dev / preview → `/lp/audit/...`. Production → product subdomain.
 */
export function auditLpHrefForLocale(
  target: AuditLpLocale,
  product: AuditLpProduct = 'free',
  currentHost?: string | null,
): string {
  if (usePathLpHref(currentHost)) return auditLpInternalPath(product, target)
  return auditLpCanonicalUrl(target, product)
}

/** CMS / order plan slug for paid LPs. */
export function auditLpPlanSlug(product: Exclude<AuditLpProduct, 'free'>): string {
  return product === 'pro' ? 'audit-pro' : 'audit-diagnostic'
}

/** Absolute URL on the main brand domain (reports, legal, home). */
export function mainSiteUrl(path = '/'): string {
  if (!path || path === '/') return `${SITE_URL}/`
  return path.startsWith('/') ? `${SITE_URL}${path}` : `${SITE_URL}/${path}`
}

/** Absolute main-site URL with `?lang=` for cross-subdomain locale (ads LP → apex). */
export function mainSiteUrlWithLang(path: string, locale: string): string {
  const base = mainSiteUrl(path)
  if (!isSiteLocale(locale)) return base
  try {
    const u = new URL(base)
    u.searchParams.set('lang', locale)
    return u.toString()
  } catch {
    return base
  }
}

export function toSiteLocale(locale: AuditLpLocale): SiteLocale {
  return isSiteLocale(locale) ? locale : 'en'
}

type Localized = { en: string; ru: string; he: string }

function t(field: Localized, locale: string): string {
  return field[locale as keyof Localized] || field.en
}

type BenefitStep = {
  title: Localized
  body: Localized
}

type AuditLpCopyBundle = {
  sectionTitle: Localized
  eyebrow: Localized
  headline: Localized
  subhead: Localized
  aboutKicker: Localized
  aboutHeading: Localized
  aboutBody: Localized
  aboutFooter: Localized
  about: Localized
  scalesHeading: Localized
  scales: readonly Localized[]
  deliverablesHeading: Localized
  scalesFooter: Localized
  deliverablesFooter: Localized
  deliverables: readonly Localized[]
  /** Price / plan badge under the headline. */
  freeBadge: Localized
  benefitsKicker: Localized
  benefitsHeading: Localized
  benefits: readonly BenefitStep[]
  formKicker: Localized
  /** Submit CTA for paid forms (free form uses CMS submit). */
  formSubmit?: Localized
  allOffersLink: Localized
  legalNote: Localized
  homeLink: Localized
  themeToLight: Localized
  themeToDark: Localized
  privacy: Localized
  terms: Localized
}

const SHARED_CHROME = {
  allOffersLink: {
    en: 'See all packages',
    ru: 'Ознакомиться со всеми пакетами',
    he: 'לכל החבילות',
  } satisfies Localized,
  legalNote: {
    en: 'By clicking the button you agree to the',
    ru: 'Нажимая кнопку, вы соглашаетесь с',
    he: 'בלחיצה על הכפתור הינך מסכים/ה ל',
  } satisfies Localized,
  homeLink: {
    en: 'erythro.ai',
    ru: 'erythro.ai',
    he: 'erythro.ai',
  } satisfies Localized,
  themeToLight: {
    en: 'Switch to light theme',
    ru: 'Включить светлую тему',
    he: 'מעבר לערכת נושא בהירה',
  } satisfies Localized,
  themeToDark: {
    en: 'Switch to dark theme',
    ru: 'Включить тёмную тему',
    he: 'מעבר לערכת נושא כהה',
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

const SHARED_SCALES = [
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
] as const

/** Ads LP copy — shorter than `/audit`, fixed per locale page. */
export const auditLpCopy = {
  sectionTitle: {
    en: 'AI Audit Free',
    ru: 'AI Аудит Free',
    he: 'ביקורת AI Free',
  } satisfies Localized,
  eyebrow: {
    en: 'Free AI audit',
    ru: 'Бесплатный AI-аудит',
    he: 'ביקורת AI בחינם',
  } satisfies Localized,
  headline: {
    en: 'Express Audit in 5 minutes',
    ru: 'Экспресс-аудит за 5 минут',
    he: 'אודיט אקספרס תוך 5 דקות',
  } satisfies Localized,
  subhead: {
    en: 'See what your site is losing. Score 0–100, top-3 risks, and a PDF preview — no card required.',
    ru: 'Увидьте, где сайт теряет деньги. Оценка 0–100, топ-3 риска и PDF-превью — карта не нужна.',
    he: 'גלו איפה האתר מפסיד כסף. ציון 0–100, 3 סיכונים עיקריים ו-PDF — בלי כרטיס אשראי.',
  } satisfies Localized,
  aboutKicker: {
    en: 'What you get',
    ru: 'Что вы получаете',
    he: 'מה אתם מקבלים',
  } satisfies Localized,
  aboutHeading: {
    en: 'Commercial QA on five scales',
    ru: 'Коммерческий QA по пяти шкалам',
    he: 'ביקורת QA מסחרית בחמש סקאלות',
  } satisfies Localized,
  aboutBody: {
    en: 'Homepage crawl. PageSpeed mobile + desktop. Forms, SEO, security. AI Visibility signals.',
    ru: 'Съём главной. PageSpeed mobile + desktop. Формы, SEO, security. Сигналы AI Visibility.',
    he: 'סריקת דף הבית. PageSpeed מובייל + דסקטופ. טפסים, SEO, אבטחה. אותות נראות AI.',
  } satisfies Localized,
  aboutFooter: {
    en: '✓ Free · no card · open HTML report',
    ru: '✓ Free · без карты · HTML-отчёт сразу',
    he: '✓ Free · בלי כרטיס · דוח HTML מיד',
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
  scales: SHARED_SCALES,
  deliverablesHeading: {
    en: 'In the free report',
    ru: 'В бесплатном отчёте',
    he: 'בדוח החינמי',
  } satisfies Localized,
  scalesFooter: {
    en: '✓ Full scorecard weight in the lab',
    ru: '✓ Полный вес scorecard в лаборатории',
    he: '✓ משקל מלא של ה-scorecard במעבדה',
  } satisfies Localized,
  deliverablesFooter: {
    en: '✓ Included on the free plan',
    ru: '✓ Входит в бесплатный тариф',
    he: '✓ כלול בחבילה החינמית',
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
    en: 'Free website audit',
    ru: 'Бесплатный аудит сайта',
    he: 'ביקורת אתר בחינם',
  } satisfies Localized,
  ...SHARED_CHROME,
} as const satisfies AuditLpCopyBundle

export const auditLpDiagCopy = {
  sectionTitle: {
    en: 'AI Audit Diagnostic',
    ru: 'AI Аудит Diagnostic',
    he: 'ביקורת AI Diagnostic',
  } satisfies Localized,
  eyebrow: {
    en: 'Diagnostic AI audit',
    ru: 'AI-аудит: Диагностика',
    he: 'ביקורת AI: אבחון',
  } satisfies Localized,
  headline: {
    en: 'Diagnostic · up to 5 funnel URLs',
    ru: 'Диагностика · до 5 URL воронки',
    he: 'אבחון · עד 5 כתובות משפך',
  } satisfies Localized,
  subhead: {
    en: 'Score, top-3, summary cards, three lab languages — one-time ₪99.',
    ru: 'Оценка, топ-3, сводные карточки, три языка лаборатории — разово ₪99.',
    he: 'ציון, טופ-3, כרטיסי סיכום, שלוש שפות מעבדה — חד-פעמי ₪99.',
  } satisfies Localized,
  aboutKicker: {
    en: 'What you get',
    ru: 'Что вы получаете',
    he: 'מה אתם מקבלים',
  } satisfies Localized,
  aboutHeading: {
    en: 'Everything in Free, plus depth',
    ru: 'Всё из Free, плюс глубина',
    he: 'הכל מ-Free, ובנוסף עומק',
  } satisfies Localized,
  aboutBody: {
    en: 'Funnel crawl up to 5 URLs. Lab in EN / RU / HE. Summary checklist cards. PageSpeed details.',
    ru: 'Обход воронки до 5 URL. Лаборатория EN / RU / HE. Сводные карточки чеклиста. PageSpeed подробно.',
    he: 'סריקת משפך עד 5 כתובות. מעבדה EN / RU / HE. כרטיסי סיכום צ׳ק-ליסט. פרטי PageSpeed.',
  } satisfies Localized,
  aboutFooter: {
    en: '✓ Diagnostic · ₪99 · one-time',
    ru: '✓ Диагностика · ₪99 · разово',
    he: '✓ אבחון · ₪99 · חד-פעמי',
  } satisfies Localized,
  about: {
    en: 'Diagnostic unlocks summary checklist cards and a crawl of up to 5 funnel pages in EN, RU and HE — on top of the free scorecard.',
    ru: 'Диагностика открывает сводные карточки чеклиста и обход до 5 страниц воронки на EN, RU и HE — поверх бесплатного scorecard.',
    he: 'אבחון פותח כרטיסי סיכום צ׳ק-ליסט וסריקה של עד 5 עמודי משפך ב-EN, RU ו-HE — מעל ה-scorecard החינמי.',
  } satisfies Localized,
  scalesHeading: {
    en: 'Five scorecard scales',
    ru: 'Пять шкал scorecard',
    he: 'חמש סקאלות scorecard',
  } satisfies Localized,
  scales: SHARED_SCALES,
  deliverablesHeading: {
    en: 'In the Diagnostic report',
    ru: 'В отчёте Диагностики',
    he: 'בדוח האבחון',
  } satisfies Localized,
  scalesFooter: {
    en: '✓ Full scorecard weight in the lab',
    ru: '✓ Полный вес scorecard в лаборатории',
    he: '✓ משקל מלא של ה-scorecard במעבדה',
  } satisfies Localized,
  deliverablesFooter: {
    en: '✓ Included in Diagnostic · ₪99',
    ru: '✓ Входит в Диагностику · ₪99',
    he: '✓ כלול באבחון · ₪99',
  } satisfies Localized,
  deliverables: [
    {
      en: 'Everything in Free, plus summary checklist cards',
      ru: 'Всё из Free, плюс сводные карточки чеклиста',
      he: 'הכל מ-Free, ובנוסף כרטיסי סיכום צ׳ק-ליסט',
    },
    {
      en: 'Funnel crawl — up to 5 URLs',
      ru: 'Обход воронки — до 5 URL',
      he: 'סריקת המשפך — עד 5 כתובות',
    },
    {
      en: 'Lab crawl in EN / RU / HE',
      ru: 'Обход лаборатории на EN / RU / HE',
      he: 'סריקת מעבדה ב-EN / RU / HE',
    },
    {
      en: 'PDF report in EN / RU / HE',
      ru: 'PDF-отчёт на EN / RU / HE',
      he: 'דוח PDF ב-EN / RU / HE',
    },
  ] as const,
  freeBadge: {
    en: 'Diagnostic · ₪99 · one-time · promo',
    ru: 'Диагностика · ₪99 · разово · промо',
    he: 'אבחון · ₪99 · חד-פעמי · מבצע',
  } satisfies Localized,
  benefitsKicker: {
    en: 'How it works',
    ru: 'Как это работает',
    he: 'איך זה עובד',
  } satisfies Localized,
  benefitsHeading: {
    en: 'Three steps to Diagnostic',
    ru: 'Три шага к Диагностике',
    he: 'שלושה שלבים לאבחון',
  } satisfies Localized,
  benefits: [
    {
      title: {
        en: 'Fill in site + contacts',
        ru: 'Сайт и контакты',
        he: 'אתר ופרטי קשר',
      } satisfies Localized,
      body: {
        en: 'Name, email, Israeli mobile, URL. Report language matches this page. Secure Grow checkout.',
        ru: 'Имя, email, израильский мобильный, URL. Язык отчёта — как на этой странице. Оплата через Grow.',
        he: 'שם, אימייל, נייד ישראלי וכתובת. שפת הדוח כמו בעמוד. תשלום מאובטח ב-Grow.',
      } satisfies Localized,
    },
    {
      title: {
        en: 'Pay ₪99 once',
        ru: 'Оплатите ₪99 разово',
        he: 'שלמו ₪99 חד-פעמי',
      } satisfies Localized,
      body: {
        en: 'Hosted Grow payment. Lab starts after successful payment — not before.',
        ru: 'Оплата на странице Grow. Лаборатория стартует после успешной оплаты — не раньше.',
        he: 'תשלום בעמוד Grow. המעבדה מתחילה רק אחרי תשלום מוצלח.',
      } satisfies Localized,
    },
    {
      title: {
        en: 'Summary cards + funnel crawl',
        ru: 'Сводные карточки + воронка',
        he: 'כרטיסי סיכום + משפך',
      } satisfies Localized,
      body: {
        en: 'Up to 5 funnel URLs, three lab languages, PageSpeed details, PDF in your language.',
        ru: 'До 5 URL воронки, три языка лаборатории, PageSpeed подробно, PDF на вашем языке.',
        he: 'עד 5 כתובות משפך, שלוש שפות מעבדה, פרטי PageSpeed ו-PDF בשפה שלכם.',
      } satisfies Localized,
    },
  ] as const,
  formKicker: {
    en: 'Order Diagnostic · ₪99',
    ru: 'Заказать Диагностику · ₪99',
    he: 'הזמנת אבחון · ₪99',
  } satisfies Localized,
  formSubmit: {
    en: 'Pay ₪99',
    ru: 'Оплатить ₪99',
    he: 'לתשלום ₪99',
  } satisfies Localized,
  ...SHARED_CHROME,
} as const satisfies AuditLpCopyBundle

export const auditLpProCopy = {
  sectionTitle: {
    en: 'AI Audit Pro',
    ru: 'AI Аудит Pro',
    he: 'ביקורת AI Pro',
  } satisfies Localized,
  eyebrow: {
    en: 'Pro AI audit',
    ru: 'AI-аудит: Pro',
    he: 'ביקורת AI: Pro',
  } satisfies Localized,
  headline: {
    en: 'Pro · full checklist & Funnel review',
    ru: 'Pro · полный чеклист и Funnel review',
    he: 'Pro · צ׳ק-ליסט מלא ו-Funnel review',
  } satisfies Localized,
  subhead: {
    en: '60+ rows with fixes, up to 10 funnel URLs, AI Visibility — one-time ₪490.',
    ru: '60+ строк с правками, до 10 URL воронки, AI Visibility — разово ₪490.',
    he: '60+ שורות עם תיקונים, עד 10 כתובות משפך, נראות AI — חד-פעמי ₪490.',
  } satisfies Localized,
  aboutKicker: {
    en: 'What you get',
    ru: 'Что вы получаете',
    he: 'מה אתם מקבלים',
  } satisfies Localized,
  aboutHeading: {
    en: 'Everything in Diagnostic, plus Pro',
    ru: 'Всё из Диагностики, плюс Pro',
    he: 'הכל מהאבחון, ובנוסף Pro',
  } satisfies Localized,
  aboutBody: {
    en: 'Full 60+ checklist. Funnel crawl up to 10 URLs. Funnel review. AI Visibility + Agent Readiness L1.',
    ru: 'Полный чеклист 60+. Обход воронки до 10 URL. Funnel review. AI Visibility + Agent Readiness L1.',
    he: 'צ׳ק-ליסט 60+ מלא. סריקת משפך עד 10 כתובות. Funnel review. נראות AI + Agent Readiness L1.',
  } satisfies Localized,
  aboutFooter: {
    en: '✓ Pro · ₪490 · one-time',
    ru: '✓ Pro · ₪490 · разово',
    he: '✓ Pro · ₪490 · חד-פעמי',
  } satisfies Localized,
  about: {
    en: 'Pro unlocks the full 60+ checklist with a fix on every row, Funnel review, and up to 10 funnel pages — including AI Visibility and Agent Readiness L1.',
    ru: 'Pro открывает полный чеклист 60+ с правкой по каждой строке, Funnel review и до 10 страниц воронки — включая AI Visibility и Agent Readiness L1.',
    he: 'Pro פותח צ׳ק-ליסט 60+ מלא עם תיקון לכל שורה, Funnel review ועד 10 עמודי משפך — כולל נראות AI ו-Agent Readiness L1.',
  } satisfies Localized,
  scalesHeading: {
    en: 'Five scorecard scales',
    ru: 'Пять шкал scorecard',
    he: 'חמש סקאלות scorecard',
  } satisfies Localized,
  scales: SHARED_SCALES,
  deliverablesHeading: {
    en: 'In the Pro report',
    ru: 'В отчёте Pro',
    he: 'בדוח Pro',
  } satisfies Localized,
  scalesFooter: {
    en: '✓ Full scorecard weight in the lab',
    ru: '✓ Полный вес scorecard в лаборатории',
    he: '✓ משקל מלא של ה-scorecard במעבדה',
  } satisfies Localized,
  deliverablesFooter: {
    en: '✓ Included in Pro · ₪490',
    ru: '✓ Входит в Pro · ₪490',
    he: '✓ כלול ב-Pro · ₪490',
  } satisfies Localized,
  deliverables: [
    {
      en: 'Full 60+ checklist and fix plan',
      ru: 'Полный чеклист 60+ и план правок',
      he: 'צ׳ק-ליסט 60+ מלא ותוכנית תיקון',
    },
    {
      en: 'Funnel crawl — up to 10 URLs',
      ru: 'Обход воронки — до 10 URL',
      he: 'סריקת המשפך — עד 10 כתובות',
    },
    {
      en: 'Funnel review + main funnel recommendation',
      ru: 'Funnel review + главная рекомендация по воронке',
      he: 'Funnel review + המלצה מרכזית למשפך',
    },
    {
      en: 'Full HTML + PDF report',
      ru: 'Полный HTML + PDF отчёт',
      he: 'דוח HTML + PDF מלא',
    },
  ] as const,
  freeBadge: {
    en: 'Pro · ₪490 · one-time',
    ru: 'Pro · ₪490 · разово',
    he: 'Pro · ₪490 · חד-פעמי',
  } satisfies Localized,
  benefitsKicker: {
    en: 'How it works',
    ru: 'Как это работает',
    he: 'איך זה עובד',
  } satisfies Localized,
  benefitsHeading: {
    en: 'Three steps to Pro',
    ru: 'Три шага к Pro',
    he: 'שלושה שלבים ל-Pro',
  } satisfies Localized,
  benefits: [
    {
      title: {
        en: 'Fill in site + contacts',
        ru: 'Сайт и контакты',
        he: 'אתר ופרטי קשר',
      } satisfies Localized,
      body: {
        en: 'Name, email, Israeli mobile, URL. Report language matches this page. Secure Grow checkout.',
        ru: 'Имя, email, израильский мобильный, URL. Язык отчёта — как на этой странице. Оплата через Grow.',
        he: 'שם, אימייל, נייד ישראלי וכתובת. שפת הדוח כמו בעמוד. תשלום מאובטח ב-Grow.',
      } satisfies Localized,
    },
    {
      title: {
        en: 'Pay ₪490 once',
        ru: 'Оплатите ₪490 разово',
        he: 'שלמו ₪490 חד-פעמי',
      } satisfies Localized,
      body: {
        en: 'Hosted Grow payment. Lab starts after successful payment — not before.',
        ru: 'Оплата на странице Grow. Лаборатория стартует после успешной оплаты — не раньше.',
        he: 'תשלום בעמוד Grow. המעבדה מתחילה רק אחרי תשלום מוצלח.',
      } satisfies Localized,
    },
    {
      title: {
        en: 'Full checklist + Funnel review',
        ru: 'Полный чеклист + Funnel review',
        he: 'צ׳ק-ליסט מלא + Funnel review',
      } satisfies Localized,
      body: {
        en: 'Up to 10 funnel URLs, row-by-row fixes, AI Visibility and Agent Readiness L1.',
        ru: 'До 10 URL воронки, правки построчно, AI Visibility и Agent Readiness L1.',
        he: 'עד 10 כתובות משפך, תיקונים שורה-שורה, נראות AI ו-Agent Readiness L1.',
      } satisfies Localized,
    },
  ] as const,
  formKicker: {
    en: 'Order Pro · ₪490',
    ru: 'Заказать Pro · ₪490',
    he: 'הזמנת Pro · ₪490',
  } satisfies Localized,
  formSubmit: {
    en: 'Pay ₪490',
    ru: 'Оплатить ₪490',
    he: 'לתשלום ₪490',
  } satisfies Localized,
  ...SHARED_CHROME,
} as const satisfies AuditLpCopyBundle

export function auditLpCopyFor(product: AuditLpProduct): AuditLpCopyBundle {
  if (product === 'pro') return auditLpProCopy
  if (product === 'diagnostic') return auditLpDiagCopy
  return auditLpCopy
}

export function tAuditLp(field: Localized, locale: string): string {
  return t(field, locale)
}
