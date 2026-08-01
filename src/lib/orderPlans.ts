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
  mandatory?: boolean
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
  /** Note under payment options select on the order page */
  paymentNote?: LocaleMap
  /** Tax subtitle / rate, e.g. "17%" — used to compute tax added to total */
  taxNote?: LocaleMap
  /** Optional right-side tax label when no numeric rate (legacy display) */
  taxValue?: LocaleMap
  seoTitle?: LocaleMap
  seoDescription?: LocaleMap
}

function buildOrderPlan(card: SolutionCardItem): OrderPlan {
  return {
    slug: card.id,
    card,
    subtitle: { en: '', ru: '', he: '' },
    /** Periods / add-ons / promo / tax come from CMS only — no hardcoded stubs */
    periods: [],
    defaultPeriodId: '',
    addons: [],
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

const CURRENCY_SYMBOL: Record<string, string> = {
  ILS: '₪',
  USD: '$',
  EUR: '€',
}

export function currencySymbol(currency?: string): string {
  return CURRENCY_SYMBOL[currency || 'ILS'] || CURRENCY_SYMBOL.ILS
}

export function formatPrice(amount: number, locale: string, currency?: string): string {
  const formatted = new Intl.NumberFormat(locale === 'he' ? 'he-IL' : locale === 'ru' ? 'ru-RU' : 'en-US').format(
    amount,
  )
  return `${formatted} ${currencySymbol(currency)}`
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
      const primary = `${label} ${value}`.trim()
      if (primary) return primary
      // Legacy full-only rows (no label/value) still surface as a line
      return feature.full ? tLocale(feature.full, locale).trim() : ''
    })
    .filter(Boolean)
}
