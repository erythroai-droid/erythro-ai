import { solutions, type SolutionCardItem, type SolutionFeature } from '@/translations'

export type LocaleMap = Record<string, string>

export interface OrderPeriod {
  id: string
  label: LocaleMap
  /** Multiply base price; e.g. 1 = full, or months for subscription display */
  months: number
  /** Discount percent off list (one-time) when picking longer commitment */
  discountPercent: number
}

export interface OrderAddon {
  id: string
  name: LocaleMap
  description: LocaleMap
  /** Display price per locale like Feature Value, e.g. "350₪/мес" */
  price: LocaleMap
  /** Discount % for 1 / 6 / 12 month terms */
  discountMonths1?: number
  discountMonths6?: number
  discountMonths12?: number
  recommended?: boolean
  mandatory?: boolean
  note?: LocaleMap
  /** Plain fallback for expandable “Subscription: price/mo” details */
  full?: LocaleMap
  /** Lexical rich text for expandable details on the order add-on card */
  fullRich?: Record<string, unknown>
}

export const SUBSCRIPTION_ADDON_ID = 'subscription'

export const SUBSCRIPTION_ADDON_NAME: LocaleMap = {
  en: 'Monthly subscription',
  ru: 'Ежемесячная подписка',
  he: 'מנוי חודשי',
}

export function isSubscriptionFeatureLabel(label: LocaleMap | undefined): boolean {
  const blob = Object.values(label || {})
    .join(' ')
    .toLowerCase()
  return /subscription|подписка|מנוי/.test(blob)
}

/** Build a Monthly subscription add-on from a homepage “Подписка” feature row. */
export function subscriptionAddonFromFeature(feature: SolutionFeature): OrderAddon {
  return {
    id: SUBSCRIPTION_ADDON_ID,
    name: { ...SUBSCRIPTION_ADDON_NAME },
    description: { en: '', ru: '', he: '' },
    price: {
      en: (feature.value?.en || '').trim(),
      ru: (feature.value?.ru || '').trim(),
      he: (feature.value?.he || '').trim(),
    },
    recommended: true,
  }
}

export const ADDON_TERM_MONTHS = [1, 6, 12] as const
export type AddonTermMonths = (typeof ADDON_TERM_MONTHS)[number]

export function addonTermDiscount(addon: OrderAddon, months: number): number {
  if (months === 6) return Math.max(0, addon.discountMonths6 || 0)
  if (months === 12) return Math.max(0, addon.discountMonths12 || 0)
  return Math.max(0, addon.discountMonths1 || 0)
}

/** Parsed monthly amount from display price ("350₪/мес" → 350) */
export function addonMonthlyAmount(addon: OrderAddon, locale?: string): number {
  if (locale) {
    const fromLocale = parsePrice(tLocale(addon.price, locale))
    if (fromLocale) return fromLocale
  }
  return (
    parsePrice(addon.price?.en || '') ||
    parsePrice(addon.price?.ru || '') ||
    parsePrice(addon.price?.he || '') ||
    0
  )
}

/** list = monthly × months; final applies term discount % */
export function calcAddonAmount(
  monthlyPrice: number,
  months: number,
  discountPercent = 0,
): { list: number; final: number; savings: number } {
  const list = Math.round(monthlyPrice * months)
  const final = Math.round(list * (1 - Math.max(0, discountPercent) / 100))
  return { list, final, savings: Math.max(0, list - final) }
}

export interface OrderPlan {
  slug: string
  kind?: 'solution' | 'audit'
  card: SolutionCardItem
  subtitle: LocaleMap
  periods: OrderPeriod[]
  defaultPeriodId: string
  addons: OrderAddon[]
  promo?: LocaleMap
  /** Note under payment options select on the order page */
  paymentNote?: LocaleMap
  /** Plain fallback for the “what’s included” block */
  includes?: LocaleMap
  /** Lexical rich text for the “what’s included” block (order page) */
  includesRich?: Record<string, unknown>
  /** Tax subtitle / rate, e.g. "17%" — used to compute tax added to total */
  taxNote?: LocaleMap
  /** Optional right-side tax label when no numeric rate (legacy display) */
  taxValue?: LocaleMap
  seoTitle?: LocaleMap
  seoDescription?: LocaleMap
}

function buildOrderPlan(card: SolutionCardItem): OrderPlan {
  const homeSubscription = card.features.find((f) => isSubscriptionFeatureLabel(f.label))
  const addons = homeSubscription ? [subscriptionAddonFromFeature(homeSubscription)] : []

  return {
    slug: card.id,
    kind: 'solution',
    card: {
      ...card,
      // Subscription rows stay on Solutions cards only — order uses the Add-on card
      features: card.features.filter((f) => !isSubscriptionFeatureLabel(f.label)),
    },
    subtitle: { en: '', ru: '', he: '' },
    /** Periods / promo / tax come from CMS only — subscription add-on may be derived above */
    periods: [],
    defaultPeriodId: '',
    addons,
  }
}

/** Lab protocol groups — mirror QA_Auditor `ReportScopeOfWork` itemsCore (PIT-029). */
export const AUDIT_CHECK_CATEGORIES = [
  {
    title: {
      en: 'Network & security',
      ru: 'Сеть и безопасность',
      he: 'רשת ואבטחה',
    } satisfies LocaleMap,
    description: {
      en: '13 parameters: HTTPS, HTTP status, TTFB, Server, six headers, 4xx/5xx, runtime JS',
      ru: '13 параметров: HTTPS, HTTP-статус, TTFB, Server, шесть заголовков, 4xx/5xx, runtime JS',
      he: '13 פרמטרים: HTTPS, סטטוס HTTP, TTFB, Server, שש כותרות, 4xx/5xx, JS בזמן ריצה',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'Indexing & AI crawlers',
      ru: 'Индексация и AI-боты',
      he: 'אינדוקס ובוטי AI',
    } satisfies LocaleMap,
    description: {
      en: 'robots.txt, sitemap, Sitemap: directive; rules for 8 AI bots and severe_block',
      ru: 'robots.txt, sitemap, директива Sitemap:; правила для 8 AI-ботов и severe_block',
      he: 'robots.txt, sitemap, הנחיית Sitemap:; כללים ל-8 בוטי AI ו-severe_block',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'PageSpeed Insights',
      ru: 'PageSpeed Insights',
      he: 'PageSpeed Insights',
    } satisfies LocaleMap,
    description: {
      en: '10 Lighthouse metrics × mobile and desktop, plus TTFB on origin',
      ru: '10 метрик Lighthouse × mobile и desktop, плюс TTFB на origin',
      he: '10 מדדי Lighthouse × מובייל ודסקטופ, וגם TTFB ב-origin',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'Per locale — UX, forms, SEO',
      ru: 'На каждой локали — UX, формы, SEO',
      he: 'לכל שפה — UX, טפסים, SEO',
    } satisfies LocaleMap,
    description: {
      en: '~28 signals × EN/RU/HE: meta, OG, overflow at 375px, forms, axe-core; RTL + LanguageTool EN/RU',
      ru: '~28 сигналов × EN/RU/HE: meta, OG, overflow на 375px, формы, axe-core; RTL + LanguageTool EN/RU',
      he: '~28 אותות × EN/RU/HE: meta, OG, overflow ב-375px, טפסים, axe-core; RTL + LanguageTool EN/RU',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'AI Visibility',
      ru: 'AI Visibility',
      he: 'נראות AI',
    } satisfies LocaleMap,
    description: {
      en: 'llms.txt, MCP, /about, Organization schema, AI-bot rules, GA4 dataLayer + consent stub',
      ru: 'llms.txt, MCP, /about, Organization schema, правила AI-ботов, GA4 dataLayer + consent stub',
      he: 'llms.txt, MCP, /about, סכמת Organization, כללי בוטי AI, GA4 dataLayer + consent stub',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'Agent Readiness Level 1',
      ru: 'Agent Readiness Level 1',
      he: 'Agent Readiness Level 1',
    } satisfies LocaleMap,
    description: {
      en: '5 checks: robots, agent sitemap, crawler rules, Content-Signal, markdown negotiation (not in score)',
      ru: '5 проверок: robots, sitemap для агентов, правила ботов, Content-Signal, markdown (не в оценке)',
      he: '5 בדיקות: robots, sitemap לסוכנים, כללי בוטים, Content-Signal, markdown (לא בציון)',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'Funnel crawl',
      ru: 'Обход воронки',
      he: 'סריקת משפך',
    } satisfies LocaleMap,
    description: {
      en: 'Lab up to 10 URLs; Free discloses 1, Diagnostic 5, Pro 10 — HTTP, title, h1, forms, CTA, soft-404',
      ru: 'Лаборатория до 10 URL; Free раскрывает 1, Diagnostic 5, Pro 10 — HTTP, title, h1, формы, CTA, soft-404',
      he: 'מעבדה עד 10 URL; Free חושף 1, Diagnostic 5, Pro 10 — HTTP, title, h1, טפסים, CTA, soft-404',
    } satisfies LocaleMap,
  },
]

export const AUDIT_ORDER_PLANS: OrderPlan[] = [
  {
    slug: 'audit-free',
    kind: 'audit',
    card: {
      id: 'audit-free',
      currency: 'ILS',
      price: '0',
      title: {
        en: 'Free AI Audit',
        ru: 'Бесплатный AI Аудит',
        he: 'ביקורת AI בחינם',
      },
      features: [
        {
          value: {
            en: 'Score 0–100 across 5 scorecard scales (A+–F)',
            ru: 'Оценка 0–100 по 5 шкалам scorecard (A+–F)',
            he: 'ציון 0–100 ב-5 סקאלות scorecard (A+–F)',
          },
        },
        {
          value: {
            en: 'Top-3 conversion / visibility risks',
            ru: 'Топ-3 уязвимости конверсии и видимости',
            he: '3 סיכוני המרה ונראות עיקריים',
          },
        },
        {
          value: {
            en: 'Lighthouse mobile + desktop preview',
            ru: 'Превью Lighthouse mobile + desktop',
            he: 'תצוגת Lighthouse למובייל ולדסקטופ',
          },
        },
        {
          value: {
            en: 'Homepage disclosed (funnel crawl stays locked)',
            ru: 'Раскрыта главная (обход воронки закрыт)',
            he: 'דף הבית גלוי (סריקת המשפך נעולה)',
          },
        },
      ],
    },
    subtitle: {
      en: 'Preview: scorecard, top-3, and Lighthouse.',
      ru: 'Превью: scorecard, топ-3 и Lighthouse.',
      he: 'תצוגה מקדימה: scorecard, טופ-3 ו-Lighthouse.',
    },
    periods: [],
    defaultPeriodId: '',
    addons: [],
    includes: {
      en: 'Includes the five-scale scorecard, top-3 conversion risks, and Lighthouse mobile + desktop. The lab still crawls the funnel; Free discloses the homepage only.',
      ru: 'Включает scorecard по пяти шкалам, топ-3 уязвимости конверсии и Lighthouse mobile + desktop. Лаборатория обходит воронку; в Free раскрыта только главная.',
      he: 'כולל scorecard בחמש סקאלות, 3 סיכוני המרה ו-Lighthouse למובייל ולדסקטופ. המעבדה סורקת את המשפך; ב-Free נחשף רק דף הבית.',
    },
    seoTitle: {
      en: 'Free AI Website Audit | Erythro.ai',
      ru: 'Бесплатный AI Аудит сайта | Erythro.ai',
      he: 'ביקורת אתר AI בחינם | Erythro.ai',
    },
    seoDescription: {
      en: 'Order a free commercial website audit: five-scale scorecard, top-3 risks, Lighthouse preview.',
      ru: 'Закажите бесплатный коммерческий аудит сайта: scorecard по пяти шкалам, топ-3 риска, превью Lighthouse.',
      he: 'הזמינו ביקורת אתר מסחרית חינמית: scorecard בחמש סקאלות, 3 סיכונים, תצוגת Lighthouse.',
    },
  },
  {
    slug: 'audit-diagnostic',
    kind: 'audit',
    card: {
      id: 'audit-diagnostic',
      currency: 'ILS',
      price: '99',
      originalPrice: '290',
      featured: true,
      priceNote: true,
      title: {
        en: 'AI Audit: Diagnostic',
        ru: 'AI Аудит: Диагностика',
        he: 'ביקורת AI: אבחון',
      },
      features: [
        {
          value: {
            en: 'Everything in Free, plus:',
            ru: 'Всё из Free, плюс:',
            he: 'הכל מ-Free, ובנוסף:',
          },
        },
        {
          value: {
            en: 'Summary checklist cards (excellent → attention → critical)',
            ru: 'Сводные карточки чеклиста (отлично → внимание → критично)',
            he: 'כרטיסי סיכום צ׳ק-ליסט (מצוין → לתשומת לב → קריטי)',
          },
        },
        {
          value: {
            en: 'Funnel crawl disclosed — up to 5 URLs',
            ru: 'Обход воронки раскрыт — до 5 URL',
            he: 'סריקת המשפך גלויה — עד 5 כתובות',
          },
        },
        {
          value: {
            en: 'PageSpeed mobile + desktop details',
            ru: 'PageSpeed mobile и desktop подробно',
            he: 'פרטי PageSpeed למובייל ולדסקטופ',
          },
        },
        {
          value: {
            en: 'PDF report in RU / EN / HE',
            ru: 'PDF-отчёт на RU / EN / HE',
            he: 'דוח PDF ב-RU / EN / HE',
          },
        },
      ],
    },
    subtitle: {
      en: 'Summary cards and funnel URLs, one-time.',
      ru: 'Сводные карточки и URL воронки, разово.',
      he: 'כרטיסי סיכום וכתובות משפך, חד-פעמי.',
    },
    promo: {
      en: 'Special promo price · ₪191 discount',
      ru: 'Специальная промо-цена · скидка 191 ₪',
      he: 'מחיר מבצע מיוחד · הנחה של ₪191',
    },
    periods: [],
    defaultPeriodId: '',
    addons: [],
    includes: {
      en: 'Diagnostic PDF: five-scale scorecard, top-3 risks, summary checklist cards, Lighthouse, and up to 5 disclosed funnel URLs. The row-by-row 60+ checklist and fix plan stay in Pro.',
      ru: 'Diagnostic PDF: scorecard по пяти шкалам, топ-3 риска, сводные карточки чеклиста, Lighthouse и до 5 раскрытых URL воронки. Построчный чеклист 60+ и план правок остаются в Pro.',
      he: 'PDF Diagnostic: scorecard בחמש סקאלות, 3 סיכונים, כרטיסי סיכום, Lighthouse ועד 5 כתובות משפך גלויות. צ׳ק-ליסט 60+ שורה-שורה ותוכנית תיקון נשארים ב-Pro.',
    },
    seoTitle: {
      en: 'Diagnostic AI Audit | Summary PDF | Erythro.ai',
      ru: 'AI Аудит Диагностика | Сводный PDF | Erythro.ai',
      he: 'ביקורת AI אבחון | PDF סיכום | Erythro.ai',
    },
    seoDescription: {
      en: 'Diagnostic website audit: scorecard, top-3 risks, summary checklist cards, and up to 5 funnel URLs in PDF.',
      ru: 'Диагностический аудит сайта: scorecard, топ-3 риска, сводные карточки чеклиста и до 5 URL воронки в PDF.',
      he: 'ביקורת אבחון לאתר: scorecard, 3 סיכונים, כרטיסי סיכום ועד 5 כתובות משפך ב-PDF.',
    },
  },
  {
    slug: 'audit-pro',
    kind: 'audit',
    card: {
      id: 'audit-pro',
      currency: 'ILS',
      price: '490',
      priceNote: true,
      title: {
        en: 'AI Audit: Pro',
        ru: 'AI Аудит: Pro',
        he: 'ביקורת AI: Pro',
      },
      features: [
        {
          value: {
            en: 'Everything in Diagnostic, plus:',
            ru: 'Всё из Diagnostic, плюс:',
            he: 'הכל מ-Diagnostic, ובנוסף:',
          },
        },
        {
          value: {
            en: 'Full 60+ checklist and fix plan unlocked',
            ru: 'Полный чеклист 60+ и план правок открыты',
            he: 'צ׳ק-ליסט 60+ מלא ותוכנית תיקון פתוחים',
          },
        },
        {
          value: {
            en: 'Funnel crawl disclosed — up to 10 URLs',
            ru: 'Обход воронки раскрыт — до 10 URL',
            he: 'סריקת המשפך גלויה — עד 10 כתובות',
          },
        },
        {
          value: {
            en: 'Monthly re-run of the full audit',
            ru: 'Ежемесячный повтор полного аудита',
            he: 'הרצה חוזרת חודשית של הביקורת המלאה',
          },
        },
        {
          value: {
            en: 'Score trend vs previous month',
            ru: 'Динамика оценки к прошлому месяцу',
            he: 'מגמת ציון מול החודש הקודם',
          },
        },
        {
          value: {
            en: 'Extra recheck after your fixes',
            ru: 'Дополнительная перепроверка после ваших правок',
            he: 'בדיקה חוזרת נוספת אחרי התיקונים שלכם',
          },
        },
        {
          value: {
            en: 'Priority support (<24h response)',
            ru: 'Приоритетная поддержка (<24 ч)',
            he: 'תמיכה בעדיפות (<24 שעות)',
          },
        },
      ],
    },
    subtitle: {
      en: 'Monthly re-audit and support.',
      ru: 'Ежемесячный повторный аудит и поддержка.',
      he: 'ביקורת חוזרת חודשית ותמיכה.',
    },
    periods: [],
    defaultPeriodId: '',
    addons: [],
    includes: {
      en: 'Pro unlocks the full 60+ checklist and recommendations, discloses up to 10 funnel URLs, then re-runs the lab monthly: score trend vs last month, extra recheck after your fixes, and priority support.',
      ru: 'Pro открывает полный чеклист 60+ и рекомендации, раскрывает до 10 URL воронки, затем ежемесячно повторяет лабораторию: динамика оценки, внеочередная перепроверка после ваших правок и приоритетная поддержка.',
      he: 'Pro פותח את צ׳ק-ליסט 60+ המלא ואת ההמלצות, חושף עד 10 כתובות משפך, ואז מריץ את המעבדה כל חודש: מגמת ציון, בדיקה חוזרת אחרי התיקונים ותמיכה בעדיפות.',
    },
    seoTitle: {
      en: 'Pro AI Audit | Monthly Website QA & Support | Erythro.ai',
      ru: 'AI Аудит Pro | Ежемесячный мониторинг и поддержка | Erythro.ai',
      he: 'ביקורת AI Pro | ניטור חודשי ותמיכה | Erythro.ai',
    },
    seoDescription: {
      en: 'Monthly website re-audits, score trend tracking, post-fix validation, and priority technical support.',
      ru: 'Ежемесячные повторные аудиты сайта, отслеживание динамики, перепроверка правок и приоритетная поддержка.',
      he: 'ביקורות אתר חודשיות חוזרות, מעקב מגמות, אימות תיקונים ותמיכה טכנית בעדיפות.',
    },
  },
]

export const ORDER_PLANS: OrderPlan[] = [
  ...solutions.cards.map(buildOrderPlan),
  ...AUDIT_ORDER_PLANS,
]

const AUDIT_SLUG_ALIASES: Record<string, string> = {
  free: 'audit-free',
  diagnostic: 'audit-diagnostic',
  pro: 'audit-pro',
}

export function getOrderPlan(slug: string): OrderPlan | undefined {
  const direct = ORDER_PLANS.find((plan) => plan.slug === slug)
  if (direct) return direct
  const aliased = AUDIT_SLUG_ALIASES[slug]
  if (aliased) return ORDER_PLANS.find((plan) => plan.slug === aliased)
  return undefined
}

export function getAllOrderSlugs(): string[] {
  return ORDER_PLANS.map((plan) => plan.slug)
}

export function tLocale(field: LocaleMap | undefined, locale: string): string {
  if (!field) return ''
  return field[locale] || field.en || Object.values(field)[0] || ''
}

/** Parse "14 999" / "5000" → number */
export function parsePrice(price: string): number {
  const n = Number(String(price).replace(/[^\d]/g, ''))
  return Number.isFinite(n) ? n : 0
}

const CURRENCY_SYMBOL: Record<string, string> = {
  ILS: '₪',
  USD: '$',
  EUR: '€',
}

export function currencySymbol(currency?: string): string {
  return CURRENCY_SYMBOL[currency || 'ILS'] || CURRENCY_SYMBOL.ILS
}

export function formatPrice(amount: number, locale: string, currency?: string): string {
  const formatted = new Intl.NumberFormat(
    locale === 'he' ? 'he-IL' : locale === 'ru' ? 'ru-RU' : 'en-US',
  ).format(amount)
  const symbol = currencySymbol(currency)
  if (locale === 'he') {
    return `${symbol}${formatted}`
  }
  return `${formatted} ${symbol}`
}

export function calcPlanAmount(plan: OrderPlan, periodId: string): {
  base: number
  list: number
  perMonth: number | null
  savings: number
} {
  const list = parsePrice(plan.card.originalPrice || plan.card.price)
  const sale = parsePrice(plan.card.price)
  const period = plan.periods.find((p) => p.id === periodId) || plan.periods[0]
  const discounted = Math.round(sale * (1 - (period?.discountPercent || 0) / 100))
  const savings = Math.max(0, list - discounted)
  const perMonth = period && period.months > 1 ? Math.ceil(discounted / period.months) : null
  return { base: discounted, list, perMonth, savings }
}

/** Parse "17%" / "17" → 17; returns 0 when not a rate. */
export function parseTaxPercent(taxNote: string | undefined): number {
  if (!taxNote) return 0
  const m = String(taxNote).match(/(\d+(?:[.,]\d+)?)\s*%?/)
  if (!m) return 0
  const n = Number(m[1].replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Tax amount added on top of subtotal. Prefer % from taxNote; else fixed number in taxValue. */
export function calcTaxAmount(
  subtotal: number,
  taxNote: string | undefined,
  taxValue: string | undefined,
): number {
  const percent = parseTaxPercent(taxNote)
  if (percent > 0) return Math.round((subtotal * percent) / 100)

  if (taxValue) {
    const fixed = Number(String(taxValue).replace(/[^\d.,]/g, '').replace(',', '.'))
    if (Number.isFinite(fixed) && fixed > 0) return Math.round(fixed)
  }
  return 0
}

export function featureLines(features: SolutionFeature[], locale: string): string[] {
  return features
    .map((feature) => {
      const label = feature.label ? tLocale(feature.label, locale) : ''
      const value = feature.value ? tLocale(feature.value, locale) : ''
      return `${label} ${value}`.trim()
    })
    .filter(Boolean)
}
