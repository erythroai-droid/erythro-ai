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

export const AUDIT_CHECK_CATEGORIES = [
  {
    title: {
      en: 'Mobile layout & RTL',
      ru: 'Мобильная вёрстка и RTL',
      he: 'פריסת מובייל ו-RTL',
    } satisfies LocaleMap,
    description: {
      en: 'Horizontal overflow, dir=rtl, viewport scaling, touch targets, basic accessibility',
      ru: 'Горизонтальный скролл, dir=rtl, адаптивный viewport, тач-таргеты, базовая доступность',
      he: 'גלילה אופקית, dir=rtl, תצוגה מותאמת, נגישות בסיסית',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'Forms & lead capture',
      ru: 'Формы и захват лидов',
      he: 'טפסים ולידים',
    } satisfies LocaleMap,
    description: {
      en: 'Field validation, submit handlers, honeypot/anti-spam, chat widgets & WhatsApp links',
      ru: 'Валидация полей, отправка, honeypot/антиспам, чат-виджеты и ссылки на WhatsApp',
      he: 'אימות שדות, שליחה, הגנה מספאם, ווידג׳טים וקישורי WhatsApp',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'SEO basics & previews',
      ru: 'SEO-база и превью',
      he: 'בסיס SEO ותצוגות מקדימות',
    } satisfies LocaleMap,
    description: {
      en: 'robots.txt, sitemap.xml, canonical URLs, Open Graph tags for messengers, favicon & manifest',
      ru: 'robots.txt, sitemap.xml, canonical URL, Open Graph для мессенджеров, favicon и манифест',
      he: 'robots.txt, sitemap.xml, כתובות canonical, תגי Open Graph למסרים, favicon ומניפסט',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'Speed & performance',
      ru: 'Скорость и производительность',
      he: 'מהירות וביצועים',
    } satisfies LocaleMap,
    description: {
      en: 'Google PageSpeed (mobile & desktop), TTFB, core web vitals, heavy asset detection',
      ru: 'Google PageSpeed (mobile и desktop), TTFB, Core Web Vitals, обнаружение тяжёлых ресурсов',
      he: 'Google PageSpeed (מובייל ודסקטופ), TTFB, מדדי ביצועים מרכזיים ומשאבים כבדים',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'Security & stability',
      ru: 'Безопасность и стабильность',
      he: 'אבטחה ויציבות',
    } satisfies LocaleMap,
    description: {
      en: 'HTTPS, security headers (HSTS, CSP, X-Frame-Options), server response codes, runtime JS errors',
      ru: 'HTTPS, security-заголовки (HSTS, CSP, XFO), HTTP-коды сервера, runtime-ошибки JS и сети',
      he: 'HTTPS, כותרות אבטחה (HSTS, CSP, XFO), תגובות שרת ושגיאות JS בזמן ריצה',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'AI readiness',
      ru: 'Готовность к AI',
      he: 'מוכנות ל-AI',
    } satisfies LocaleMap,
    description: {
      en: 'llms.txt, schema.org/Organization, AI crawler bot permissions in robots, structured brand data',
      ru: 'llms.txt, Schema.org / Organization, доступ AI-ботов в robots, структурированные данные о бренде',
      he: 'llms.txt, Schema.org/Organization, הרשאות בוטי AI ב-robots ונתוני מותג מובנים',
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
            en: 'Homepage + key funnel pages (up to 5)',
            ru: 'Главная и ключевые страницы воронки (до 5)',
            he: 'דף הבית ועמודי משפך מרכזיים (עד 5)',
          },
        },
        {
          value: {
            en: 'Score 0–100 across 5 business scales',
            ru: 'Оценка 0–100 по 5 бизнес-шкалам',
            he: 'ציון 0–100 ב-5 סקאלות עסקיות',
          },
        },
        {
          value: {
            en: 'Top 3 conversion / visibility risks',
            ru: 'Топ-3 риска для заявок и видимости',
            he: '3 סיכונים עיקריים ללידים ולנראות',
          },
        },
        {
          value: {
            en: 'Preview report (essentials unlocked)',
            ru: 'Превью-отчёт (основные блоки открыты)',
            he: 'דוח תצוגה מקדימה (הבלוקים העיקריים פתוחים)',
          },
        },
      ],
    },
    subtitle: {
      en: 'Preview of your site’s health, speed, and AI readiness.',
      ru: 'Превью состояния сайта, скорости и готовности к AI.',
      he: 'תצוגה מקדימה של מצב האתר, מהירות ומוכנות ל-AI.',
    },
    periods: [],
    defaultPeriodId: '',
    addons: [],
    includes: {
      en: 'Includes preview analysis of speed, lead capture forms, essential SEO headers, security status, and AI readiness signals.',
      ru: 'Включает экспресс-анализ скорости, форм заявок, базовых SEO-тегов, статуса безопасности и сигналов готовности к AI.',
      he: 'כולל ניתוח תצוגה מקדימה של מהירות, טפסי לידים, תגי SEO בסיסיים, מצב אבטחה ואותות מוכנות ל-AI.',
    },
    seoTitle: {
      en: 'Free AI Website Audit | Erythro.ai',
      ru: 'Бесплатный AI Аудит сайта | Erythro.ai',
      he: 'ביקורת אתר AI בחינם | Erythro.ai',
    },
    seoDescription: {
      en: 'Order a free commercial website audit: speed, forms, SEO, security, and AI readiness.',
      ru: 'Закажите бесплатный коммерческий аудит сайта: скорость, формы, SEO, безопасность и готовность к AI.',
      he: 'הזמינו ביקורת אתר מסחרית חינמית: מהירות, טפסים, SEO, אבטחה ומוכנות ל-AI.',
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
            en: 'Full checklist of ~60 checks unlocked',
            ru: 'Полный чеклист из ~60 проверок',
            he: 'צ׳ק-ליסט מלא של ~60 בדיקות',
          },
        },
        {
          value: {
            en: 'Mobile + desktop PageSpeed details',
            ru: 'PageSpeed mobile и desktop подробно',
            he: 'פרטי PageSpeed למובייל ולדסקטופ',
          },
        },
        {
          value: {
            en: 'Priority fix plan with clear next steps',
            ru: 'Приоритетный план правок с понятными шагами',
            he: 'תוכנית תיקון לפי עדיפות עם צעדים ברורים',
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
      en: 'Full PDF report, one-time.',
      ru: 'Полный PDF-отчёт, разово.',
      he: 'דוח PDF מלא, חד-פעמי.',
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
      en: 'Full one-time commercial audit across ~60 technical parameters: mobile layout & RTL verification, contact forms & lead funnel testing, SEO indexing & Open Graph tags, detailed Google PageSpeed metrics, security headers & SSL inspection, and AI crawler readiness audit.',
      ru: 'Полный разовый коммерческий аудит по всем ~60 техническим параметрам: проверка мобильной вёрстки и RTL, тест форм заявок и спам-защиты, SEO-индексация и Open Graph теги, детальная аналитика Google PageSpeed, проверка заголовков безопасности и отчёт готовности к AI-ассистентам.',
      he: 'ביקורת מסחרית מלאה וחד-פעמית בכ-60 פרמטרים טכניים: פריסת מובייל ו-RTL, בדיקת טפסי לידים ומשפכים, אינדוקס SEO ותגי Open Graph, מדדי Google PageSpeed, כותרות אבטחה ומוכנות לזחלני AI.',
    },
    seoTitle: {
      en: 'Diagnostic AI Audit | Full PDF Report | Erythro.ai',
      ru: 'AI Аудит Диагностика | Полный PDF-отчёт | Erythro.ai',
      he: 'ביקורת AI אבחון | דוח PDF מלא | Erythro.ai',
    },
    seoDescription: {
      en: 'Order a full diagnostic website audit: ~60 checks, priority fix roadmap, and detailed PDF report.',
      ru: 'Закажите полный диагностический аудит сайта: ~60 проверок, приоритетный план правок и детальный PDF-отчёт.',
      he: 'הזמינו ביקורת אתר מקיפה: כ-60 בדיקות, מפת תיקונים בעדיפות ודוח PDF מלא.',
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
      en: 'Continuous monthly website QA & health monitoring: regular automated and expert re-audits, score progression comparison, on-demand recheck after developer fixes, and priority technical guidance via messenger/email.',
      ru: 'Непрерывный ежемесячный мониторинг качества и здоровья сайта: регулярные повторные аудиты, отслеживание динамики оценок, внеочередная перепроверка после правок разработчиков и приоритетные консультации.',
      he: 'ניטור איכות ובריאות אתר חודשי מתמשך: ביקורות חוזרות קבועות, מעקב אחר מגמת הציון, בדיקה חוזרת נוספת לאחר תיקוני מפתחים ותמיכה בעדיפות.',
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
