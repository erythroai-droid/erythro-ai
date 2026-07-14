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
  price: number
  recommended?: boolean
  note?: LocaleMap
}

export interface OrderPlan {
  slug: string
  card: SolutionCardItem
  subtitle: LocaleMap
  periods: OrderPeriod[]
  defaultPeriodId: string
  addons: OrderAddon[]
  promo?: LocaleMap
}

const PERIOD_FULL: OrderPeriod = {
  id: 'full',
  label: {
    en: 'Pay in full',
    ru: 'Одним платежом',
    he: 'תשלום מלא',
  },
  months: 1,
  discountPercent: 0,
}

const PERIOD_12: OrderPeriod = {
  id: '12',
  label: {
    en: '12 monthly payments',
    ru: '12 ежемесячных платежей',
    he: '12 תשלומים חודשיים',
  },
  months: 12,
  discountPercent: 0,
}

const SHARED_ADDONS: OrderAddon[] = [
  {
    id: 'priority-support',
    name: {
      en: 'Priority support',
      ru: 'Приоритетная поддержка',
      he: 'תמיכה בעדיפות',
    },
    description: {
      en: 'Dedicated channel and faster response during the first 90 days after launch.',
      ru: 'Отдельный канал связи и ускоренный ответ в первые 90 дней после запуска.',
      he: 'ערוץ ייעודי ותגובה מהירה יותר ב-90 הימים הראשונים אחרי ההשקה.',
    },
    price: 1500,
    recommended: true,
  },
  {
    id: 'extra-workshop',
    name: {
      en: 'Extra team workshop',
      ru: 'Дополнительный воркшоп',
      he: 'סדנה נוספת לצוות',
    },
    description: {
      en: '2–3 hour hands-on session for your team after the main delivery.',
      ru: 'Практическая сессия 2–3 часа для команды после основной поставки.',
      he: 'מפגש מעשי של 2–3 שעות לצוות אחרי האספקה העיקרית.',
    },
    price: 2000,
  },
  {
    id: 'ai-credits',
    name: {
      en: 'AI credits pack',
      ru: 'Пакет AI-кредитов',
      he: 'חבילת קרדיטים ל-AI',
    },
    description: {
      en: 'Extra usage budget for agents and automations in the first month.',
      ru: 'Дополнительный бюджет на агентов и автоматизации в первый месяц.',
      he: 'תקציב שימוש נוסף לסוכנים ואוטומציות בחודש הראשון.',
    },
    price: 800,
    note: {
      en: 'Start included. Pay only when you buy more credits.',
      ru: 'Старт включён. Доплата только при покупке дополнительных кредитов.',
      he: 'ההתחלה כלולה. משלמים רק בקניית קרדיטים נוספים.',
    },
  },
]

const SUBTITLES: Record<string, LocaleMap> = {
  'free-start': {
    en: 'Starter website package',
    ru: 'Стартовый пакет сайта',
    he: 'חבילת אתר להתחלה',
  },
  'ai-business-card': {
    en: 'AI-powered business site',
    ru: 'Бизнес-сайт с AI',
    he: 'אתר עסקי עם AI',
  },
  'business-automation': {
    en: 'Automation & CRM stack',
    ru: 'Автоматизация и CRM',
    he: 'אוטומציה ו-CRM',
  },
  'enterprise-custom': {
    en: 'Custom enterprise build',
    ru: 'Кастомная enterprise-сборка',
    he: 'בנייה בהתאמה אישית לארגונים',
  },
}

const PROMOS: Record<string, LocaleMap> = {
  'free-start': {
    en: 'Hosting for the first month is on us when you start.',
    ru: 'Хостинг первого месяца — за наш счёт при старте.',
    he: 'אחסון לחודש הראשון עלינו כשמתחילים.',
  },
  'business-automation': {
    en: 'Includes team workshop (2–3 hours) in the package.',
    ru: 'В пакет входит воркшоп для команды (2–3 часа).',
    he: 'כולל סדנה לצוות (2–3 שעות) בחבילה.',
  },
}

function buildOrderPlan(card: SolutionCardItem): OrderPlan {
  const periods = card.priceNote ? [PERIOD_FULL, PERIOD_12] : [PERIOD_FULL]
  return {
    slug: card.id,
    card,
    subtitle: SUBTITLES[card.id] || {
      en: 'Solution package',
      ru: 'Пакет решения',
      he: 'חבילת פתרון',
    },
    periods,
    defaultPeriodId: PERIOD_FULL.id,
    addons: card.id === 'free-start' ? SHARED_ADDONS.slice(0, 1) : SHARED_ADDONS,
    promo: PROMOS[card.id],
  }
}

export const ORDER_PLANS: OrderPlan[] = solutions.cards.map(buildOrderPlan)

export function getOrderPlan(slug: string): OrderPlan | undefined {
  return ORDER_PLANS.find((plan) => plan.slug === slug)
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

export function formatPrice(amount: number, locale: string): string {
  const formatted = new Intl.NumberFormat(locale === 'he' ? 'he-IL' : locale === 'ru' ? 'ru-RU' : 'en-US').format(
    amount,
  )
  return `${formatted} ₪`
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

export function featureLines(features: SolutionFeature[], locale: string): string[] {
  return features.map((feature) => {
    if (feature.full) return tLocale(feature.full, locale)
    const label = feature.label ? tLocale(feature.label, locale) : ''
    const value = feature.value ? tLocale(feature.value, locale) : ''
    return `${label} ${value}`.trim()
  })
}
