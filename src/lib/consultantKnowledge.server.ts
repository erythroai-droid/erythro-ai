/**
 * Erythro knowledge assembler for the AI consultant.
 *
 * Canon is the live CMS — the very same collections the public site renders,
 * so a price change in the admin reaches the next chat through
 * `revalidateTag(SITE_CONTENT_TAG)`. `docs/consultant/erythro-knowledge-base.md`
 * is the fallback snapshot used only when Postgres is unreachable; the model is
 * told to hedge on numbers in that case (`live: false`).
 *
 * Nothing from `src/translations` or `servicePages.ts` is used: those statics
 * are stale relative to production.
 */
import 'server-only'

import { unstable_cache } from 'next/cache'

import { lexicalToPlain } from './lexical'
import { SITE_CONTENT_TAG } from './revalidate'
import type { BriefSlot, ConsultantKnowledge, ConsultantRules, ConsultLocale } from './consultant'

const CURRENCY_SYMBOL: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€' }

function money(price?: string | null, currency?: string | null, prefix?: string | null): string {
  const value = (price ?? '').toString().trim()
  if (!value) return '—'
  const symbol = CURRENCY_SYMBOL[(currency || 'ILS').toUpperCase()] || ''
  const head = prefix?.trim() ? `${prefix.trim()} ` : ''
  return `${head}${symbol}${value}`.trim()
}

function line(label: string, value: string | null | undefined): string | null {
  const clean = (value ?? '').toString().trim()
  return clean ? `- ${label}: ${clean}` : null
}

type PayloadLike = {
  find: (args: Record<string, unknown>) => Promise<{ docs: Record<string, unknown>[] }>
  findGlobal: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
}

async function getPayloadClient(): Promise<PayloadLike> {
  const { getPayload } = await import('payload')
  const config = (await import('@payload-config')).default
  return (await getPayload({ config })) as unknown as PayloadLike
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function arr(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : []
}

/** Static snapshot. Read from `docs/` so the markdown stays the single source
 * of truth; `outputFileTracingIncludes` in `next.config.ts` ships the file. */
async function readFallbackSnapshot(): Promise<string> {
  try {
    const { readFile } = await import('node:fs/promises')
    const path = await import('node:path')
    return await readFile(
      path.join(process.cwd(), 'docs', 'consultant', 'erythro-knowledge-base.md'),
      'utf8',
    )
  } catch {
    return [
      '# Erythro.ai — minimal fallback',
      '',
      'The knowledge base is temporarily unavailable. Do not quote prices.',
      'Offer the contact form, WhatsApp or the AI audit page instead.',
    ].join('\n')
  }
}

function renderPlans(docs: Record<string, unknown>[], kind: 'solution' | 'audit'): string {
  const rows = docs
    .filter((doc) => str(doc.kind) === kind)
    .map((doc) => {
      const features = arr(doc.features)
        .map((f) => {
          const label = str(f.label)
          const value = str(f.value)
          if (!label && !value) return ''
          return label && value ? `  - ${label}: ${value}` : `  - ${label || value}`
        })
        .filter(Boolean)
      const head = `### ${str(doc.title) || str(doc.slug)} — ${money(
        str(doc.price),
        str(doc.currency),
        str(doc.pricePrefix),
      )}`
      const meta = [
        line('slug', str(doc.slug)),
        line('subtitle', str(doc.subtitle)),
        line('promo', str(doc.promo)),
        str(doc.originalPrice) ? line('was', money(str(doc.originalPrice), str(doc.currency))) : null,
        line("what's included", lexicalToPlain(doc.includes).slice(0, 900)),
      ].filter(Boolean)
      return [head, ...meta, ...features].join('\n')
    })

  return rows.join('\n\n')
}

function renderServices(docs: Record<string, unknown>[]): string {
  return docs
    .map((doc) => {
      const offerings = arr(doc.offerings).map(
        (o) =>
          `  - ${str(o.name)}: ${money(str(o.price), str(doc.currency), str(o.pricePrefix))}${
            str(o.description) ? ` — ${str(o.description)}` : ''
          }`,
      )
      const features = arr(doc.features)
        .map((f) => str(f.feature))
        .filter(Boolean)
      return [
        `### ${str(doc.title)} (slug: ${str(doc.slug)})`,
        line('summary', lexicalToPlain(doc.summary).slice(0, 600)),
        features.length ? `- covers: ${features.join('; ')}` : null,
        offerings.length ? '- packages:' : null,
        ...offerings,
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n')
}

/**
 * Builds the markdown handed to Gemini. URLs are intentionally absent — the
 * consultant navigates through widget chips, never by pasting links.
 */
export async function assembleConsultantKnowledge(
  locale: ConsultLocale,
): Promise<ConsultantKnowledge> {
  try {
    const payload = await getPayloadClient()
    const [plans, services, faq, site, auditPage, portfolio] = await Promise.all([
      payload.find({ collection: 'solution-plans', locale, limit: 50, sort: 'order', depth: 0 }),
      payload.find({ collection: 'services', locale, limit: 20, sort: 'order', depth: 0 }),
      payload.findGlobal({ slug: 'faq-section', locale, depth: 0 }),
      payload.findGlobal({ slug: 'site-settings', locale, depth: 0 }),
      payload.findGlobal({ slug: 'audit-page', locale, depth: 0 }),
      payload.find({ collection: 'portfolio-projects', locale, limit: 12, depth: 0 }),
    ])

    const contacts = [
      line('email', str(site.email)),
      line('phone', str(site.phone)),
      line('location', str(site.address) || str(site.location)),
      line('languages', 'English, Russian, Hebrew'),
    ].filter(Boolean)

    const faqItems = arr(faq.items)
      .map((item) => {
        const question = str(item.question)
        const answer = lexicalToPlain(item.answer)
        return question && answer ? `**${question}**\n${answer}` : ''
      })
      .filter(Boolean)

    const cases = arr(portfolio.docs)
      .map((doc) => {
        const title = str(doc.title)
        const subtitle = str(doc.subtitle) || lexicalToPlain(doc.description).slice(0, 200)
        return title ? `- ${title}${subtitle ? ` — ${subtitle}` : ''}` : ''
      })
      .filter(Boolean)

    const auditIntro = [
      line('audit headline', str(auditPage.heroTitle) || str(auditPage.title)),
      line('audit summary', lexicalToPlain(auditPage.heroSubtitle || auditPage.intro).slice(0, 600)),
    ].filter(Boolean)

    const markdown = [
      '# Erythro.ai — consultant knowledge base (live CMS)',
      'Prices below are the current CMS values. Present them as a guideline, not an offer.',
      contacts.length ? `## Company\n${contacts.join('\n')}` : '',
      `## Solution packages\n${renderPlans(arr(plans.docs), 'solution')}`,
      `## AI & Website Audit\n${[...auditIntro, renderPlans(arr(plans.docs), 'audit')]
        .filter(Boolean)
        .join('\n')}`,
      `## Service lines\n${renderServices(arr(services.docs))}`,
      cases.length ? `## Selected work\n${cases.join('\n')}` : '',
      faqItems.length ? `## FAQ\n${faqItems.join('\n\n')}` : '',
    ]
      .filter((block) => block.trim().length > 0)
      .join('\n\n')

    // A CMS that answers but has no packages is worse than the snapshot.
    if (markdown.length < 400) throw new Error('assembled knowledge suspiciously small')

    return { markdown, live: true }
  } catch (err) {
    console.error(
      '[consultantKnowledge] CMS unavailable, using snapshot:',
      err instanceof Error ? err.message : String(err),
    )
    return { markdown: await readFallbackSnapshot(), live: false }
  }
}

/** Shares the site-content cache tag: admin saves invalidate it automatically. */
export function getCachedConsultantKnowledge(
  locale: ConsultLocale,
): Promise<ConsultantKnowledge> {
  return unstable_cache(
    () => assembleConsultantKnowledge(locale),
    ['consultant-knowledge-v1', locale],
    { tags: [SITE_CONTENT_TAG] },
  )()
}

const DEFAULT_SLOTS: Record<ConsultLocale, BriefSlot[]> = {
  ru: [
    { id: 'goal', question: 'Какая цель продукта и для кого он?', hint: 'Например: заявки на услуги для B2B в Израиле' },
    { id: 'current', question: 'Что есть сейчас — сайт, CMS, стек?', hint: '«Не знаю» — нормальный ответ' },
    { id: 'languages', question: 'Какие языки нужны и нужен ли RTL?', hint: 'Например: RU + HE, с иврита справа налево' },
    { id: 'scope', question: 'Объём и ключевые экраны?', hint: 'Лендинг на 6 секций / портал / SaaS' },
    { id: 'content', question: 'Кто будет редактировать контент?' },
    { id: 'integrations', question: 'Какие интеграции нужны — CRM, мессенджеры, платежи?' },
    { id: 'ai', question: 'Нужны ли ИИ или автоматизация и зачем?' },
    { id: 'constraints', question: 'Ограничения: желаемый срок, бюджет-ориентир, требования по данным?' },
  ],
  en: [
    { id: 'goal', question: 'What is the product for, and who is the audience?', hint: 'e.g. inbound leads for a B2B service in Israel' },
    { id: 'current', question: 'What exists today — site, CMS, stack?', hint: '"I do not know" is fine' },
    { id: 'languages', question: 'Which languages, and do you need RTL?', hint: 'e.g. EN + HE with right-to-left Hebrew' },
    { id: 'scope', question: 'Scope and key screens?', hint: '6-section landing / portal / SaaS' },
    { id: 'content', question: 'Who will edit the content?' },
    { id: 'integrations', question: 'Which integrations — CRM, messengers, payments?' },
    { id: 'ai', question: 'Do you need AI or automation, and what for?' },
    { id: 'constraints', question: 'Constraints: target date, budget range, data requirements?' },
  ],
  he: [
    { id: 'goal', question: 'מה מטרת המוצר ולמי הוא מיועד?', hint: 'לדוגמה: לידים לשירות B2B בישראל' },
    { id: 'current', question: 'מה קיים היום — אתר, CMS, סטאק?', hint: '«לא יודע» זו תשובה לגיטימית' },
    { id: 'languages', question: 'אילו שפות נדרשות והאם נדרש RTL?', hint: 'לדוגמה: עברית + אנגלית' },
    { id: 'scope', question: 'היקף ומסכים מרכזיים?', hint: 'דף נחיתה / פורטל / SaaS' },
    { id: 'content', question: 'מי יערוך את התכנים?' },
    { id: 'integrations', question: 'אילו אינטגרציות — CRM, מסנג׳רים, תשלומים?' },
    { id: 'ai', question: 'האם נדרשים AI או אוטומציה ולמה?' },
    { id: 'constraints', question: 'אילוצים: תאריך מבוקש, טווח תקציב, דרישות נתונים?' },
  ],
}

const DEFAULT_SAVE_NOTICE: Record<ConsultLocale, string> = {
  ru: 'Дальше я запишу переписку, чтобы команда увидела контекст: она хранится 12 месяцев. Файлы и референсы не присылайте в чат — их загрузим в карточку проекта в CRM после опроса.',
  en: 'From here I will store this conversation so the team sees the context; it is kept for 12 months. Please do not send files or references in the chat — they go into the CRM project card after the interview.',
  he: 'מכאן אשמור את השיחה כדי שהצוות יראה את ההקשר; היא נשמרת 12 חודשים. אין לשלוח קבצים או אסמכתאות בצ׳אט — הם יועלו לכרטיס הפרויקט ב-CRM לאחר האפיון.',
}

export async function fetchConsultantRules(locale: ConsultLocale): Promise<ConsultantRules> {
  const fallback: ConsultantRules = {
    botRules: '',
    briefSlots: DEFAULT_SLOTS[locale],
    savePolicyNotice: DEFAULT_SAVE_NOTICE[locale],
    anonMessageLimit: 5,
    verifiedMessageLimit: 30,
  }

  try {
    const payload = await getPayloadClient()
    const global = await payload.findGlobal({ slug: 'consultant-settings', locale, depth: 0 })
    const slots = arr(global.briefSlots)
      .map((slot) => ({
        id: str(slot.slotId),
        question: str(slot.question),
        ...(str(slot.hint) ? { hint: str(slot.hint) } : {}),
      }))
      .filter((slot) => slot.id && slot.question)

    return {
      botRules: str(global.botRules),
      briefSlots: slots.length ? slots : fallback.briefSlots,
      savePolicyNotice: str(global.savePolicyNotice) || fallback.savePolicyNotice,
      anonMessageLimit:
        typeof global.anonMessageLimit === 'number' && global.anonMessageLimit > 0
          ? global.anonMessageLimit
          : fallback.anonMessageLimit,
      verifiedMessageLimit:
        typeof global.verifiedMessageLimit === 'number' && global.verifiedMessageLimit > 0
          ? global.verifiedMessageLimit
          : fallback.verifiedMessageLimit,
    }
  } catch (err) {
    console.error(
      '[consultantKnowledge] settings unavailable, using defaults:',
      err instanceof Error ? err.message : String(err),
    )
    return fallback
  }
}

export function getCachedConsultantRules(locale: ConsultLocale): Promise<ConsultantRules> {
  return unstable_cache(
    () => fetchConsultantRules(locale),
    ['consultant-rules-v1', locale],
    { tags: [SITE_CONTENT_TAG] },
  )()
}

/** Widget copy (greeting, OTP labels, launcher kill switch). Not cached:
 *  `enabled` must follow the admin checkbox on the next request (PIT-089). */
export async function fetchConsultantCopy(locale: ConsultLocale): Promise<{
  enabled: boolean
  greeting: string
  otpPrompt: string
  otpCodePrompt: string
  savePolicyNotice: string
  quotaExhaustedNotice: string
}> {
  try {
    const payload = await getPayloadClient()
    const global = await payload.findGlobal({ slug: 'consultant-settings', locale, depth: 0 })
    return {
      enabled: global.enabled !== false,
      greeting: str(global.greeting),
      otpPrompt: str(global.otpPrompt),
      otpCodePrompt: str(global.otpCodePrompt),
      savePolicyNotice: str(global.savePolicyNotice) || DEFAULT_SAVE_NOTICE[locale],
      quotaExhaustedNotice: str(global.quotaExhaustedNotice),
    }
  } catch {
    return {
      enabled: true,
      greeting: '',
      otpPrompt: '',
      otpCodePrompt: '',
      savePolicyNotice: DEFAULT_SAVE_NOTICE[locale],
      quotaExhaustedNotice: '',
    }
  }
}

export function getCachedConsultantCopy(locale: ConsultLocale) {
  return fetchConsultantCopy(locale)
}
