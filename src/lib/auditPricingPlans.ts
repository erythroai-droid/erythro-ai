/**
 * Single source for /audit Pricing cards: solution-plans kind=audit
 * (static fallback = AUDIT_ORDER_PLANS).
 */
import type { Localized } from '@/lib/auditPage'
import {
  AUDIT_ORDER_PLANS,
  type AuditCheckoutMode,
  type LocaleMap,
  type OrderPlan,
  tLocale,
} from '@/lib/orderPlans'
import { normalizeCtaHref } from '@/lib/ctaNav'

export type { AuditCheckoutMode }

export type AuditPricingCard = {
  id: string
  badge: string | null
  name: Localized
  price: Localized
  priceCompare?: Localized
  priceNote?: Localized
  description?: Localized
  features: Localized[]
  cta: Localized
  ctaHref: string
  featured?: boolean
  checkoutMode?: AuditCheckoutMode
  slug?: string
}

const DEFAULT_CTA_ORDER: Localized = {
  en: 'Get started',
  ru: 'Начать сейчас',
  he: 'להתחיל עכשיו',
}

const DEFAULT_CTA_CONTACT: Localized = {
  en: 'Message engineer',
  ru: 'Написать инженеру',
  he: 'לכתוב למהנדס',
}

function asLocalized(map: LocaleMap | undefined, fallback: Localized): Localized {
  return {
    en: (map?.en || fallback.en).trim() || fallback.en,
    ru: (map?.ru || map?.en || fallback.ru).trim() || fallback.ru,
    he: (map?.he || map?.en || fallback.he).trim() || fallback.he,
  }
}

function planCardId(plan: OrderPlan): string {
  if (plan.planId?.trim()) return plan.planId.trim()
  const slug = plan.slug || ''
  if (slug.startsWith('audit-')) return slug.slice('audit-'.length)
  return slug || plan.card.id
}

/** Map an OrderPlan (CMS or static) to an /audit Pricing card. */
export function orderPlanToAuditPricingCard(plan: OrderPlan): AuditPricingCard {
  const id = planCardId(plan)
  const checkoutMode: AuditCheckoutMode =
    plan.checkoutMode === 'contact' || id === 'manual' ? 'contact' : 'order'
  const defaultCta = checkoutMode === 'contact' ? DEFAULT_CTA_CONTACT : DEFAULT_CTA_ORDER
  const cta = asLocalized(plan.ctaLabel, defaultCta)

  let ctaHref = normalizeCtaHref(plan.ctaHref || '')
  if (!ctaHref) {
    ctaHref = checkoutMode === 'contact' ? '#contact-modal' : `/order/${plan.slug}`
  }

  const name = asLocalized(plan.card.title, {
    en: id,
    ru: id,
    he: id,
  })
  // Short display names on cards (Free / Diagnostic / …)
  const shortName: Localized = {
    en: id === 'free' ? 'Free' : id === 'diagnostic' ? 'Diagnostic' : id === 'pro' ? 'Pro' : id === 'manual' ? 'Manual' : name.en,
    ru:
      id === 'free'
        ? 'Бесплатно'
        : id === 'diagnostic'
          ? 'Диагностика'
          : id === 'pro'
            ? 'Pro'
            : id === 'manual'
              ? 'Ручной'
              : name.ru,
    he:
      id === 'free'
        ? 'חינם'
        : id === 'diagnostic'
          ? 'אבחון'
          : id === 'pro'
            ? 'Pro'
            : id === 'manual'
              ? 'ידני'
              : name.he,
  }

  const priceVal = String(plan.card.price || '0')
  const price: Localized = { en: priceVal, ru: priceVal, he: priceVal }

  const features: Localized[] = (plan.card.features || [])
    .map((f) => {
      const v = f.value
      if (!v) return null
      const line: Localized = {
        en: (v.en || '').trim(),
        ru: (v.ru || v.en || '').trim(),
        he: (v.he || v.en || '').trim(),
      }
      if (!line.en && !line.ru && !line.he) return null
      return line
    })
    .filter((x): x is Localized => Boolean(x))

  const card: AuditPricingCard = {
    id,
    badge: null,
    name: shortName,
    price,
    features,
    cta,
    ctaHref,
    featured: Boolean(plan.card.featured) || id === 'diagnostic',
    checkoutMode,
    slug: plan.slug,
  }

  if (plan.card.originalPrice) {
    const cmp = String(plan.card.originalPrice)
    card.priceCompare = { en: cmp, ru: cmp, he: cmp }
  }

  if (plan.cardPriceNote) {
    const note = asLocalized(plan.cardPriceNote, { en: '', ru: '', he: '' })
    if (note.en || note.ru || note.he) card.priceNote = note
  }

  return card
}

export function staticAuditPricingPlans(): AuditPricingCard[] {
  return AUDIT_ORDER_PLANS.filter((p) => p.kind === 'audit').map(orderPlanToAuditPricingCard)
}

/** Prefer CMS audit plans; fall back to static when empty. */
export function mergeAuditPricingPlans(cmsPlans: OrderPlan[]): AuditPricingCard[] {
  const audit = cmsPlans.filter(
    (p) => p.kind === 'audit' || (p.slug || '').startsWith('audit-'),
  )
  if (!audit.length) return staticAuditPricingPlans()

  const cards = audit.map(orderPlanToAuditPricingCard)
  const seen = new Set(cards.map((c) => c.id))
  for (const fb of staticAuditPricingPlans()) {
    if (!seen.has(fb.id)) {
      cards.push(fb)
      seen.add(fb.id)
    }
  }

  const order = ['free', 'diagnostic', 'pro', 'manual']
  cards.sort((a, b) => {
    const ai = order.indexOf(a.id)
    const bi = order.indexOf(b.id)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
  return cards
}

export function auditPlanCheckoutMode(plan: OrderPlan | undefined): AuditCheckoutMode {
  if (!plan) return 'order'
  if (plan.checkoutMode === 'contact' || plan.planId === 'manual' || plan.slug === 'audit-manual') {
    return 'contact'
  }
  return 'order'
}

/** Dev helper — ensure short labels resolve. */
export function auditPricingCtaLabel(card: AuditPricingCard, locale: string): string {
  return tLocale(card.cta, locale)
}
