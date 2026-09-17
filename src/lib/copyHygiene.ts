import type { SiteContent, Localized } from './defaultContent'
import type { SolutionFeature } from '@/translations'

export const SMART_CARD_SLUGS = new Set(['ai-smart-card', 'ai-business-card'])

export const SMART_CARD_TITLE: Localized = {
  en: 'AI Smart Card',
  ru: 'AI-визитка',
  he: 'כרטיס חכם AI',
}

const CMS_LABEL_ALIASES = new Set(['Content:', 'Контент:', 'תוכן:', 'CMS:'])

function trim(value: string | undefined): string {
  return (value || '').trim()
}

export function orderPageTitleSuffix(locale: string): string {
  if (locale === 'ru') return 'Оформление заказа'
  if (locale === 'he') return 'הזמנה'
  return 'Order'
}

export function slugFromOrderHref(href: string | undefined): string {
  if (!href) return ''
  const match = href.trim().match(/\/order\/([^/?#]+)/i)
  return match ? match[1] : ''
}

export function sanitizeCtaLabel(label: Localized): Localized {
  if (trim(label.en) === 'Get a start') return { ...label, en: 'Get started' }
  return label
}

export function sanitizePlanTitle(slug: string | undefined, title: Localized): Localized {
  const out: Localized = { ...title }
  if (slug && SMART_CARD_SLUGS.has(slug)) {
    const en = trim(out.en)
    const ru = trim(out.ru)
    const he = trim(out.he)
    if (!en || /^(AI[-\s])?Business Card$/i.test(en) || en === 'AI-визитка') {
      out.en = SMART_CARD_TITLE.en
    }
    if (!ru || ru === 'AI Smart Card' || /^(AI[-\s])?Business Card$/i.test(ru)) {
      out.ru = SMART_CARD_TITLE.ru
    }
    if (!he || he === 'כרטיס ביקור AI') {
      out.he = SMART_CARD_TITLE.he
    }
    return out
  }

  if (trim(out.en) === 'business automation') out.en = 'Business Automation'
  if (trim(out.ru) === 'бизнес-автоматизация') out.ru = 'Бизнес-автоматизация'
  return out
}

function sanitizeLocaleValue(value: string): string {
  let next = value
  if (next === 'Git-based CMS') next = 'Git-based'
  if (next === 'Git-based CMS (Decap/Tina) / Jamstack') {
    next = 'Git-based (Decap/Tina) / Jamstack'
  }
  next = next.replace('without vector DB', 'without a vector database')
  next = next.replace('FAQ чат-бот', 'FAQ-чат-бот')
  next = next.replace('без векторной БД', 'без векторной базы данных')
  next = next.replace('בוט שאלות ותשובות', 'צ׳אטבוט FAQ')
  next = next.replace(/ו*וידג['׳']ט/g, 'ווידג׳ט')
  if (next.includes('ללא מסד וקטורי') && !next.includes('מסד נתונים וקטורי')) {
    next = next.replace('ללא מסד וקטורי', 'ללא מסד נתונים וקטורי')
  }
  return next
}

export function sanitizeFeature(feature: SolutionFeature): SolutionFeature {
  const label = feature.label ? { ...feature.label } : undefined
  const value = feature.value ? { ...feature.value } : undefined

  if (label) {
    for (const loc of Object.keys(label)) {
      if (CMS_LABEL_ALIASES.has(trim(label[loc]))) label[loc] = 'CMS:'
    }
  }
  if (value) {
    for (const loc of Object.keys(value)) {
      if (value[loc]) value[loc] = sanitizeLocaleValue(value[loc])
    }
  }
  return { ...feature, ...(label ? { label } : {}), ...(value ? { value } : {}) }
}

export function sanitizeSeoTitle(
  slug: string | undefined,
  seoTitle: Localized | undefined,
  fallbackTitle?: Localized,
): Localized | undefined {
  const suffix = {
    en: 'Order',
    ru: 'Оформление заказа',
    he: 'הזמנה',
  }
  const name = slug && SMART_CARD_SLUGS.has(slug) ? SMART_CARD_TITLE : fallbackTitle
  const out: Localized = { ...(seoTitle || {}) }

  for (const loc of ['en', 'ru', 'he'] as const) {
    let current = trim(out[loc])
    const product = name?.[loc] || name?.en || ''
    const canonical = product ? `${product} | ${suffix[loc]} | Erythro.ai` : ''

    if (slug && SMART_CARD_SLUGS.has(slug)) {
      if (loc === 'ru') {
        if (
          !current ||
          /AI Smart Card\s*\|\s*Order/i.test(current) ||
          /^Order AI Smart Card/i.test(current)
        ) {
          out.ru = canonical
          continue
        }
        current = current
          .replace(/Заказ AI Smart Card/g, 'Заказ AI-визитки')
          .replace(/\bAI Smart Card\b/g, SMART_CARD_TITLE.ru)
      }
      if (loc !== 'en') {
        current = current.replace(/(^|\|\s*)Order(\s*\|)/g, `$1${suffix[loc]}$2`)
      }
      out[loc] = current || canonical
      continue
    }

    if (!current && canonical) out[loc] = canonical
    else if (current && loc !== 'en') {
      out[loc] = current.replace(/(^|\|\s*)Order(\s*\|)/g, `$1${suffix[loc]}$2`)
    }
  }
  return out.en || out.ru || out.he ? out : seoTitle
}

export function applySiteContentCopyHygiene(content: SiteContent): SiteContent {
  content.solutions.ctaLabel = sanitizeCtaLabel(content.solutions.ctaLabel)
  content.solutions.cards = content.solutions.cards.map((card) => ({
    ...card,
    title: sanitizePlanTitle(card.id, card.title),
    features: (card.features || []).map(sanitizeFeature),
  }))
  content.navbar.navItems = content.navbar.navItems.map((item) => ({
    ...item,
    children: (item.children || []).map((child) => ({
      ...child,
      label: sanitizePlanTitle(slugFromOrderHref(child.href) || child.href, child.label),
    })),
  }))
  return content
}
