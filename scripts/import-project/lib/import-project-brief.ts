import fs from 'node:fs'
import path from 'node:path'
import { parseYaml } from './simple-yaml'
import {
  linesToItems,
  type Locale,
  type RichBlock,
  type RichSection,
  RICH_LOCALES,
} from './rich-lexical'

export const LOCALES = RICH_LOCALES
export type { Locale }

export type LocaleMap<T = string> = Partial<Record<Locale, T>>

/**
 * Body sections for the pro-interior / ORA portfolio scheme.
 * Images: put files under `body/<id>/` or list them in `bodyImages.<id>`.
 */
export const BODY_SECTION_IDS = [
  'overview',
  'challenges',
  'engineering',
  'features',
  'metrics',
  'results',
] as const

export type BodySectionId = (typeof BODY_SECTION_IDS)[number]

export type BriefMedia = {
  card?: string
  hero?: string
  heroMobile?: string
}

export type BriefHighlightMetric = {
  value: string
  label: LocaleMap
}

export type BriefHighlight = {
  label: LocaleMap
  detail: LocaleMap
  metrics?: BriefHighlightMetric[]
  metricsNote?: LocaleMap
}

export type BriefMetrics = {
  intro?: LocaleMap
  table?: Partial<Record<Locale, string[][]>>
  notes?: Partial<Record<Locale, string[]>>
}

export type BriefCopySection = {
  id?: string
  heading?: LocaleMap
  /** Plain paragraphs (legacy) or already-split lines. */
  paragraphs?: LocaleMap[]
  images?: string[]
}

export type BriefCopy = {
  title?: LocaleMap
  description?: LocaleMap
  summary?: LocaleMap
  subtitle?: LocaleMap
  seoTitle?: LocaleMap
  seoDescription?: LocaleMap
  body?: BriefCopySection[]
}

export type Brief = {
  slug: string
  category?: string
  date?: string
  client?: string
  link?: string
  order?: number
  stack?: string[]
  tags?: string[]
  media?: BriefMedia
  bodyImages?: Partial<Record<string, string[]>>
  facts?: Partial<Record<Locale, Record<string, string>>>
  copy?: BriefCopy
  highlights?: BriefHighlight[]
  features?: Partial<Record<Locale, string[]>>
  metrics?: BriefMetrics
  dir: string
}

export type ComposedSection = {
  id: string
  heading: LocaleMap
  /** One CMS paragraph row per entry; blocks differ by locale but share shape. */
  rows: Partial<Record<Locale, RichBlock[]>>[]
  images: string[]
}

export type ComposedProject = {
  slug: string
  category?: string
  date?: string
  client?: string
  link?: string
  order?: number
  stack: string[]
  tags: string[]
  media: BriefMedia
  title: LocaleMap
  description: LocaleMap
  summary: LocaleMap
  subtitle: LocaleMap
  seoTitle: LocaleMap
  seoDescription: LocaleMap
  body: ComposedSection[]
  /** Undefined = leave CMS highlights unchanged on update. */
  highlights?: BriefHighlight[]
}

const DEFAULT_HEADINGS: Record<BodySectionId, Record<Locale, string>> = {
  overview: {
    en: 'Project overview',
    ru: 'Обзор проекта',
    he: 'סקירת הפרויקט',
  },
  challenges: {
    en: 'Challenges and goals',
    ru: 'Вызовы и задачи проекта',
    he: 'אתגרים ומטרות',
  },
  engineering: {
    en: 'Engineering solution and architecture',
    ru: 'Инженерное решение и архитектура',
    he: 'פתרון הנדסי וארכיטקטורה',
  },
  features: {
    en: 'Key features',
    ru: 'Ключевые возможности и функционал',
    he: 'יכולות ופונקציונליות',
  },
  metrics: {
    en: 'Audit results and engineering metrics',
    ru: 'Результаты аудита и инженерные метрики',
    he: 'תוצאות בדיקה ומדדים הנדסיים',
  },
  results: {
    en: 'Results and business impact',
    ru: 'Результаты и бизнес-эффект',
    he: 'תוצאות והשפעה עסקית',
  },
}

const OVERVIEW_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    client: 'Client',
    industry: 'Industry',
    service: 'Service',
    developer: 'Developer',
    stack: 'Tech stack',
    live: 'Live site',
  },
  ru: {
    client: 'Клиент',
    industry: 'Отрасль',
    service: 'Услуга',
    developer: 'Разработчик',
    stack: 'Технологический стек',
    live: 'Живая версия',
  },
  he: {
    client: 'לקוח',
    industry: 'תחום',
    service: 'שירות',
    developer: 'פיתוח',
    stack: 'סטאק טכנולוגי',
    live: 'אתר חי',
  },
}

const GOAL_TITLE: Record<Locale, string> = {
  en: 'Key goals:',
  ru: 'Ключевые цели разработки:',
  he: 'מטרות מרכזיות:',
}

const GOAL_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    architecture: 'Architecture and performance',
    design: 'UI/UX & brand',
    business: 'Business conversion',
    automation: 'Security and automation',
  },
  ru: {
    architecture: 'Архитектура и производительность',
    design: 'UI/UX и бренд',
    business: 'Бизнес-конверсия',
    automation: 'Безопасность и автоматизация',
  },
  he: {
    architecture: 'ארכיטקטורה וביצועים',
    design: 'UI/UX ומותג',
    business: 'המרה עסקית',
    automation: 'אבטחה ואוטומציה',
  },
}

const ENG_TITLES: Record<
  Locale,
  { frontend: string; backend: string; delivery: string }
> = {
  en: {
    frontend: '1. Frontend & UX',
    backend: '2. Backend, data & integrations',
    delivery: '3. Delivery, CI/CD & security',
  },
  ru: {
    frontend: '1. Фронтенд и UX',
    backend: '2. Бэкенд, данные и интеграции',
    delivery: '3. Поставка, CI/CD и безопасность',
  },
  he: {
    frontend: '1. פרונטאנד ו־UX',
    backend: '2. בקאנד, נתונים ואינטגרציות',
    delivery: '3. אספקה, CI/CD ואבטחה',
  },
}

const ENG_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    stack: 'UI stack',
    components: 'Components',
    motion: 'Motion',
    i18n: 'i18n & RTL',
    infra: 'Infrastructure',
    data: 'Data / CMS',
    integrations: 'Integrations',
    cicd: 'Quality / CI',
    security: 'Security & AI-ops',
  },
  ru: {
    stack: 'Стек UI',
    components: 'Компоненты',
    motion: 'Анимации',
    i18n: 'Мультиязычность и RTL',
    infra: 'Инфраструктура',
    data: 'Данные / CMS',
    integrations: 'Интеграции',
    cicd: 'Контроль качества / CI',
    security: 'Безопасность и AI-ops',
  },
  he: {
    stack: 'ערימת UI',
    components: 'קומפוננטות',
    motion: 'תנועה',
    i18n: 'רב־לשוניות ו־RTL',
    infra: 'תשתית',
    data: 'נתונים / CMS',
    integrations: 'אינטגרציות',
    cicd: 'איכות / CI',
    security: 'אבטחה ו־AI-ops',
  },
}

const METRICS_NOTES_TITLE: Record<Locale, string> = {
  en: 'Engineering notes',
  ru: 'Инженерные особенности реализации',
  he: 'הערות הנדסיות',
}

const RESULT_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    speed: 'Speed / Core Web Vitals',
    reliability: 'Reliability',
    conversion: 'Business effect',
    seo: 'SEO',
  },
  ru: {
    speed: 'Скорость / Core Web Vitals',
    reliability: 'Отказоустойчивость',
    conversion: 'Бизнес-эффект',
    seo: 'SEO',
  },
  he: {
    speed: 'מהירות / Core Web Vitals',
    reliability: 'אמינות',
    conversion: 'אפקט עסקי',
    seo: 'SEO',
  },
}

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.mp4', '.webm', '.mov'])

export function loadBrief(dir: string): Brief {
  const abs = path.resolve(dir)
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    throw new Error(`Import folder not found: ${abs}`)
  }

  const file =
    pickExisting(abs, ['brief.yaml', 'brief.yml', 'brief.md', 'brief.json']) ?? null
  if (!file) {
    throw new Error(`No brief.yaml / brief.yml / brief.md / brief.json in ${abs}`)
  }

  const raw = fs.readFileSync(file, 'utf8')
  const parsed = file.endsWith('.json') ? JSON.parse(raw) : parseBriefDocument(raw)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Brief in ${file} must be a YAML/JSON object`)
  }

  return normalizeBrief(parsed as Record<string, unknown>, abs)
}

function pickExisting(dir: string, names: string[]): string | undefined {
  return names.map((name) => path.join(dir, name)).find((p) => fs.existsSync(p))
}

function parseBriefDocument(raw: string): unknown {
  const trimmed = raw.trim()
  if (trimmed.startsWith('---')) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
    if (!match) return parseYaml(raw.replace(/^---\s*/, ''))
    return parseYaml(match[1] ?? '')
  }
  return parseYaml(raw)
}

function normalizeBrief(raw: Record<string, unknown>, dir: string): Brief {
  const slug = String(raw.slug ?? path.basename(dir)).trim()
  if (!slug) throw new Error('Brief is missing `slug`')

  const facts = normalizeFacts(raw.facts)
  const copy = normalizeCopy(raw.copy)
  if (!facts?.en && !copy?.title?.en && !copy?.summary?.en) {
    throw new Error('Brief needs `facts.en` (template keys) or `copy` with EN title/summary')
  }

  return {
    slug,
    dir,
    category: str(raw.category),
    date: scalarString(raw.date),
    client: scalarString(raw.client),
    link: scalarString(raw.link),
    order: typeof raw.order === 'number' ? raw.order : undefined,
    stack: stringList(raw.stack),
    tags: stringList(raw.tags),
    media: {
      card: str((raw.media as Record<string, unknown> | undefined)?.card) ?? str(raw.card),
      hero: str((raw.media as Record<string, unknown> | undefined)?.hero) ?? str(raw.hero),
      heroMobile:
        str((raw.media as Record<string, unknown> | undefined)?.heroMobile) ??
        str((raw.media as Record<string, unknown> | undefined)?.hero_mobile) ??
        str(raw.heroMobile),
    },
    bodyImages: normalizeBodyImages(raw.bodyImages),
    facts,
    copy,
    highlights: normalizeHighlights(raw.highlights),
    features: normalizeLocaleStringLists(raw.features),
    metrics: normalizeMetrics(raw.metrics),
  }
}

function normalizeFacts(value: unknown): Brief['facts'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const out: NonNullable<Brief['facts']> = {}
  for (const loc of LOCALES) {
    const block = (value as Record<string, unknown>)[loc]
    if (!block || typeof block !== 'object' || Array.isArray(block)) continue
    const facts: Record<string, string> = {}
    for (const [k, v] of Object.entries(block as Record<string, unknown>)) {
      const s = scalarString(v)
      if (s) facts[k] = s
    }
    if (Object.keys(facts).length) out[loc] = facts
  }
  return Object.keys(out).length ? out : undefined
}

function normalizeCopy(value: unknown): BriefCopy | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const raw = value as Record<string, unknown>
  const body = Array.isArray(raw.body)
    ? raw.body.map((row) => {
        const item = (row ?? {}) as Record<string, unknown>
        return {
          id: str(item.id) ?? undefined,
          heading: localeMap(item.heading),
          paragraphs: Array.isArray(item.paragraphs)
            ? item.paragraphs.map((p) => localeMap(p) ?? {})
            : undefined,
          images: stringList(item.images),
        }
      })
    : undefined
  return {
    title: localeMap(raw.title),
    description: localeMap(raw.description),
    summary: localeMap(raw.summary),
    subtitle: localeMap(raw.subtitle),
    seoTitle: localeMap(raw.seoTitle),
    seoDescription: localeMap(raw.seoDescription),
    body,
  }
}

function normalizeBodyImages(value: unknown): Brief['bodyImages'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const out: NonNullable<Brief['bodyImages']> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const list = stringList(v)
    if (list.length) out[k] = list
  }
  return Object.keys(out).length ? out : undefined
}

function normalizeHighlights(value: unknown): BriefHighlight[] | undefined {
  if (!Array.isArray(value) || !value.length) return undefined
  const out: BriefHighlight[] = []
  for (const row of value) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue
    const item = row as Record<string, unknown>
    const label = localeMap(item.label)
    const detail = localeMap(item.detail)
    if (!label?.en || !detail?.en) continue
    const metrics = Array.isArray(item.metrics)
      ? item.metrics
          .map((m) => {
            if (!m || typeof m !== 'object' || Array.isArray(m)) return null
            const metric = m as Record<string, unknown>
            const valueText = scalarString(metric.value)
            const metricLabel = localeMap(metric.label)
            if (!valueText || !metricLabel?.en) return null
            return { value: valueText, label: metricLabel }
          })
          .filter((m): m is BriefHighlightMetric => Boolean(m))
      : undefined
    out.push({
      label,
      detail,
      ...(metrics?.length ? { metrics } : {}),
      ...(localeMap(item.metricsNote) ? { metricsNote: localeMap(item.metricsNote) } : {}),
    })
  }
  return out.length ? out : undefined
}

function normalizeLocaleStringLists(
  value: unknown,
): Partial<Record<Locale, string[]>> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const out: Partial<Record<Locale, string[]>> = {}
  for (const loc of LOCALES) {
    const list = stringList((value as Record<string, unknown>)[loc])
    if (list.length) out[loc] = list
  }
  return Object.keys(out).length ? out : undefined
}

function normalizeMetrics(value: unknown): BriefMetrics | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const raw = value as Record<string, unknown>
  const intro = localeMap(raw.intro)
  const table: BriefMetrics['table'] = {}
  if (raw.table && typeof raw.table === 'object' && !Array.isArray(raw.table)) {
    for (const loc of LOCALES) {
      const rows = (raw.table as Record<string, unknown>)[loc]
      if (!Array.isArray(rows)) continue
      table[loc] = rows
        .filter((row): row is unknown[] => Array.isArray(row))
        .map((row) => row.map((cell) => String(cell ?? '').trim()))
    }
  }
  const notes = normalizeLocaleStringLists(raw.notes)
  if (!intro && !Object.keys(table).length && !notes) return undefined
  return {
    ...(intro ? { intro } : {}),
    ...(Object.keys(table).length ? { table } : {}),
    ...(notes ? { notes } : {}),
  }
}

export function composeProject(brief: Brief): ComposedProject {
  const composed = composeFromFacts(brief)
  const copy = brief.copy

  const title = overlayLocale(composed.title, copy?.title)
  const description = overlayLocale(composed.description, copy?.description)
  const summary = overlayLocale(composed.summary, copy?.summary)
  const subtitle = overlayLocale(composed.subtitle, copy?.subtitle)
  const seoTitle = overlayLocale(composed.seoTitle, copy?.seoTitle)
  const seoDescription = overlayLocale(composed.seoDescription, copy?.seoDescription)

  fillFallback(title)
  fillFallback(description)
  fillFallback(summary)
  fillFallback(subtitle)
  fillFallback(seoTitle)
  fillFallback(seoDescription)

  if (!title.en) throw new Error('Missing title (facts.PROJECT_NAME or copy.title.en)')
  if (!description.en) throw new Error('Missing description (facts.SHORT_TAGLINE or copy.description.en)')
  if (!summary.en) throw new Error('Missing summary (facts.HIGH_LEVEL_SUMMARY or copy.summary.en)')

  const body = copy?.body?.length ? composeFromCopyBody(brief, copy.body) : composed.body

  const enFacts = brief.facts?.en ?? {}
  const stack =
    brief.stack.length > 0 ? brief.stack : splitList(clean(enFacts.TECH_STACK_LIST))
  const client = brief.client || clean(enFacts.CLIENT_NAME) || undefined
  const link = brief.link || clean(enFacts.DEMO_URL_FULL) || clean(enFacts.DEMO_URL) || undefined

  return {
    slug: brief.slug,
    category: brief.category,
    date: brief.date,
    client,
    link,
    order: brief.order,
    stack,
    tags: brief.tags,
    media: resolveMedia(brief),
    title,
    description,
    summary,
    subtitle,
    seoTitle,
    seoDescription,
    body,
    ...(brief.highlights ? { highlights: brief.highlights } : {}),
  }
}

/** Locale-keyed rich sections for writing Lexical docs. */
export function composedBodyToLocales(body: ComposedSection[]): Record<Locale, RichSection[]> {
  const out: Record<Locale, RichSection[]> = { en: [], ru: [], he: [] }
  for (const section of body) {
    for (const loc of LOCALES) {
      out[loc].push({
        id: section.id,
        heading: section.heading[loc] || section.heading.en || '',
        rows: section.rows.map((row) => {
          const blocks = row[loc] || row.en || []
          return blocks.length ? blocks : ['']
        }),
      })
    }
  }
  return out
}

function composeFromFacts(brief: Brief): Omit<
  ComposedProject,
  'slug' | 'category' | 'date' | 'client' | 'link' | 'order' | 'stack' | 'tags' | 'media' | 'highlights'
> {
  const title: LocaleMap = {}
  const description: LocaleMap = {}
  const summary: LocaleMap = {}
  const subtitle: LocaleMap = {}
  const seoTitle: LocaleMap = {}
  const seoDescription: LocaleMap = {}

  type RowBucket = Partial<Record<Locale, RichBlock[]>>
  const buckets: Record<BodySectionId, RowBucket[]> = {
    overview: [{}, {}],
    challenges: [{}, {}],
    engineering: [{}, {}, {}],
    features: [{}],
    metrics: [{}, {}],
    results: [{}],
  }

  const enFacts = brief.facts?.en ?? {}

  // Fixed slot lists so EN/RU/HE keep the same ul lengths (assertSameShape).
  const overviewKeys = (
    [
      ['client', () => clean(enFacts.CLIENT_NAME) || brief.client],
      ['industry', () => clean(enFacts.INDUSTRY)],
      ['service', () => clean(enFacts.SERVICES_PROVIDED)],
      ['developer', () => clean(enFacts.DEVELOPER_TEAM)],
      [
        'stack',
        () =>
          clean(enFacts.TECH_STACK_LIST) ||
          (brief.stack.length ? brief.stack.join(', ') : undefined),
      ],
      ['live', () => clean(enFacts.DEMO_URL) || clean(enFacts.DEMO_URL_FULL) || brief.link],
    ] as const
  ).filter(([, get]) => Boolean(get()))

  const goalKeys = (
    [
      ['architecture', 'ARCHITECTURE_GOAL'],
      ['design', 'DESIGN_GOAL'],
      ['business', 'BUSINESS_GOAL'],
      ['automation', 'AUTOMATION_GOAL'],
    ] as const
  ).filter(([, key]) => Boolean(clean(enFacts[key])))

  const frontendKeys = (
    [
      ['stack', 'FRONTEND_STACK'],
      ['components', 'FRONTEND_DETAILS'],
      ['motion', 'ANIMATION_DETAILS'],
      ['i18n', 'I18N_DETAILS'],
    ] as const
  ).filter(([, key]) => Boolean(clean(enFacts[key])))

  const backendKeys = (
    [
      ['infra', 'BACKEND_DETAILS'],
      ['data', 'CMS_DETAILS'],
      ['integrations', 'INTEGRATIONS_LIST'],
    ] as const
  ).filter(([, key]) => Boolean(clean(enFacts[key])))

  const deliveryKeys = (
    [
      ['cicd', 'CICD_DETAILS'],
      ['security', 'AI_SECURITY_DETAILS'],
    ] as const
  ).filter(([, key]) => Boolean(clean(enFacts[key])))

  const resultKeys = (
    [
      ['speed', 'SPEED_METRIC_RESULT'],
      ['reliability', 'RELIABILITY_RESULT'],
      ['conversion', 'CONVERSION_RESULT'],
      ['seo', 'SEO_RESULT'],
    ] as const
  ).filter(([, key]) => Boolean(clean(enFacts[key])))

  const enFeatures =
    brief.features?.en ||
    linesToItems(clean(enFacts.KEY_FEATURES) || clean(enFacts.FEATURES_LIST))
  const enNotes =
    brief.metrics?.notes?.en ||
    linesToItems(clean(enFacts.ENGINEERING_NOTES) || clean(enFacts.METRICS_NOTES))
  const enResultsList = linesToItems(clean(enFacts.RESULTS_LIST))
  const enOverviewLead = clean(enFacts.OVERVIEW_LEAD) || clean(enFacts.HIGH_LEVEL_SUMMARY)
  const enContext = clean(enFacts.PROJECT_CONTEXT_AND_PAIN_POINTS)
  const enMetricsIntro = brief.metrics?.intro?.en || clean(enFacts.METRICS_INTRO)
  const enMetricsTable = brief.metrics?.table?.en

  for (const loc of LOCALES) {
    const facts = brief.facts?.[loc] ?? {}
    const fact = (key: string) => clean(facts[key]) || clean(enFacts[key])

    title[loc] = clean(facts.PROJECT_NAME) || clean(enFacts.PROJECT_NAME)
    description[loc] = clean(facts.SHORT_TAGLINE) || clean(enFacts.SHORT_TAGLINE)
    summary[loc] = clean(facts.HIGH_LEVEL_SUMMARY) || clean(enFacts.HIGH_LEVEL_SUMMARY)
    subtitle[loc] = clean(facts.SUBTITLE) || clean(enFacts.SUBTITLE)
    seoTitle[loc] =
      clean(facts.SEO_TITLE) ||
      clean(facts[`SEO_TITLE_${loc.toUpperCase()}`]) ||
      clean(enFacts.SEO_TITLE) ||
      undefined
    seoDescription[loc] =
      clean(facts.SEO_DESC) ||
      clean(facts[`SEO_DESC_${loc.toUpperCase()}`]) ||
      clean(enFacts.SEO_DESC) ||
      undefined

    if (enOverviewLead) {
      buckets.overview[0][loc] = [
        clean(facts.OVERVIEW_LEAD) || clean(facts.HIGH_LEVEL_SUMMARY) || enOverviewLead,
      ]
    }

    if (overviewKeys.length) {
      const overviewItems = overviewKeys.map(([key]) => {
        const label = OVERVIEW_LABELS[loc][key]
        const value =
          key === 'client'
            ? fact('CLIENT_NAME') || brief.client
            : key === 'industry'
              ? fact('INDUSTRY')
              : key === 'service'
                ? fact('SERVICES_PROVIDED')
                : key === 'developer'
                  ? fact('DEVELOPER_TEAM')
                  : key === 'stack'
                    ? fact('TECH_STACK_LIST') ||
                      (brief.stack.length ? brief.stack.join(', ') : undefined)
                    : fact('DEMO_URL') || fact('DEMO_URL_FULL') || brief.link
        return `**${label}:** ${value || '—'}`
      })
      buckets.overview[1][loc] = [{ ul: overviewItems }]
    }

    if (enContext) {
      buckets.challenges[0][loc] = [fact('PROJECT_CONTEXT_AND_PAIN_POINTS') || enContext]
    }
    if (goalKeys.length) {
      const goals = goalKeys.map(
        ([key, factKey]) => `**${GOAL_LABELS[loc][key]}:** ${fact(factKey) || '—'}`,
      )
      buckets.challenges[1][loc] = [{ bold: GOAL_TITLE[loc] }, { ul: goals }]
    }

    if (frontendKeys.length) {
      buckets.engineering[0][loc] = [
        { bold: ENG_TITLES[loc].frontend },
        {
          ul: frontendKeys.map(
            ([key, factKey]) => `**${ENG_LABELS[loc][key]}:** ${fact(factKey) || '—'}`,
          ),
        },
      ]
    }
    if (backendKeys.length) {
      buckets.engineering[1][loc] = [
        { bold: ENG_TITLES[loc].backend },
        {
          ul: backendKeys.map(
            ([key, factKey]) => `**${ENG_LABELS[loc][key]}:** ${fact(factKey) || '—'}`,
          ),
        },
      ]
    }
    if (deliveryKeys.length) {
      buckets.engineering[2][loc] = [
        { bold: ENG_TITLES[loc].delivery },
        {
          ul: deliveryKeys.map(
            ([key, factKey]) => `**${ENG_LABELS[loc][key]}:** ${fact(factKey) || '—'}`,
          ),
        },
      ]
    }

    if (enFeatures.length) {
      const featureItems = brief.features?.[loc] || linesToItems(fact('KEY_FEATURES') || fact('FEATURES_LIST'))
      const padded =
        featureItems.length >= enFeatures.length
          ? featureItems.slice(0, enFeatures.length)
          : [...featureItems, ...enFeatures.slice(featureItems.length)]
      buckets.features[0][loc] = [{ ul: padded }]
    }

    if (enMetricsIntro || enMetricsTable?.length) {
      const metricsRow: RichBlock[] = []
      const intro = brief.metrics?.intro?.[loc] || fact('METRICS_INTRO') || enMetricsIntro
      if (enMetricsIntro && intro) metricsRow.push(intro)
      const table = brief.metrics?.table?.[loc] || enMetricsTable
      if (enMetricsTable?.length && table?.length) metricsRow.push({ table })
      if (metricsRow.length) buckets.metrics[0][loc] = metricsRow
    }

    if (enNotes.length) {
      const notes =
        brief.metrics?.notes?.[loc] ||
        linesToItems(fact('ENGINEERING_NOTES') || fact('METRICS_NOTES'))
      const padded =
        notes.length >= enNotes.length
          ? notes.slice(0, enNotes.length)
          : [...notes, ...enNotes.slice(notes.length)]
      buckets.metrics[1][loc] = [{ bold: METRICS_NOTES_TITLE[loc] }, { ul: padded }]
    }

    if (enResultsList.length) {
      const resultsFromList = linesToItems(fact('RESULTS_LIST'))
      const padded =
        resultsFromList.length >= enResultsList.length
          ? resultsFromList.slice(0, enResultsList.length)
          : [...resultsFromList, ...enResultsList.slice(resultsFromList.length)]
      buckets.results[0][loc] = [{ ul: padded }]
    } else if (resultKeys.length) {
      buckets.results[0][loc] = [
        {
          ul: resultKeys.map(
            ([key, factKey]) => `**${RESULT_LABELS[loc][key]}:** ${fact(factKey) || '—'}`,
          ),
        },
      ]
    }
  }

  // Drop empty row slots; keep section if any locale has content or images.
  const body: ComposedSection[] = BODY_SECTION_IDS.map((id) => {
    const rows = buckets[id].filter((row) => LOCALES.some((loc) => (row[loc]?.length ?? 0) > 0))
    return {
      id,
      heading: { ...DEFAULT_HEADINGS[id] },
      rows,
      images: resolveSectionImages(brief, id),
    }
  }).filter((section) => section.rows.length > 0 || section.images.length > 0)

  return { title, description, summary, subtitle, seoTitle, seoDescription, body }
}

function composeFromCopyBody(brief: Brief, rows: BriefCopySection[]): ComposedSection[] {
  return rows.map((row, index) => {
    const id = row.id || BODY_SECTION_IDS[index] || `section-${index + 1}`
    const heading = { ...(row.heading ?? {}) }
    fillFallback(heading)
    const composedRows = (row.paragraphs ?? []).map((para) => {
      const next: Partial<Record<Locale, RichBlock[]>> = {}
      for (const loc of LOCALES) {
        const text = para[loc] || para.en
        if (text) next[loc] = [text]
      }
      return next
    })
    const images = (row.images?.length ? row.images : resolveSectionImages(brief, id)).filter(
      Boolean,
    )
    return { id, heading, rows: composedRows, images }
  })
}

export function resolveMedia(brief: Brief): BriefMedia {
  return {
    card: brief.media?.card || findByStem(brief.dir, 'card'),
    hero: brief.media?.hero || findByStem(brief.dir, 'hero', ['hero-mobile', 'heroMobile']),
    heroMobile:
      brief.media?.heroMobile ||
      findByStem(brief.dir, 'hero-mobile') ||
      findByStem(brief.dir, 'heroMobile'),
  }
}

function resolveSectionImages(brief: Brief, sectionId: string): string[] {
  const listed = brief.bodyImages?.[sectionId] ?? []
  // Legacy aliases from the old 5-section scheme.
  const aliases: Record<string, string[]> = {
    engineering: ['frontend', 'backend'],
    metrics: ['results'],
    results: ['results'],
  }
  const aliasListed = (aliases[sectionId] ?? []).flatMap((id) => brief.bodyImages?.[id] ?? [])
  const folder = path.join(brief.dir, 'body', sectionId)
  const fromFolder = listImages(folder).map((file) =>
    path.relative(brief.dir, file).replaceAll('\\', '/'),
  )
  const aliasFolders = (aliases[sectionId] ?? []).flatMap((id) => {
    const dir = path.join(brief.dir, 'body', id)
    return listImages(dir).map((file) => path.relative(brief.dir, file).replaceAll('\\', '/'))
  })
  const prefixed = listImages(brief.dir)
    .filter((file) => {
      const base = path.basename(file).toLowerCase()
      return base.startsWith(`section-${sectionId}-`) || base.startsWith(`${sectionId}-`)
    })
    .map((file) => path.basename(file))
  return unique([...listed, ...aliasListed, ...fromFolder, ...aliasFolders, ...prefixed])
}

function findByStem(dir: string, stem: string, exclude: string[] = []): string | undefined {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir) : []
  const hit = files.find((name) => {
    const parsed = path.parse(name)
    if (!IMAGE_EXTS.has(parsed.ext.toLowerCase())) return false
    if (parsed.name.toLowerCase() !== stem.toLowerCase()) return false
    return !exclude.some((ex) => parsed.name.toLowerCase().startsWith(ex.toLowerCase()))
  })
  return hit
}

function listImages(dir: string): string[] {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return []
  return fs
    .readdirSync(dir)
    .filter((name) => IMAGE_EXTS.has(path.extname(name).toLowerCase()))
    .sort()
    .map((name) => path.join(dir, name))
}

function overlayLocale(base: LocaleMap, extra?: LocaleMap): LocaleMap {
  if (!extra) return { ...base }
  return {
    en: extra.en || base.en,
    ru: extra.ru || base.ru,
    he: extra.he || base.he,
  }
}

function fillFallback(map: LocaleMap): void {
  const en = map.en
  if (!en) return
  for (const loc of LOCALES) {
    if (!map[loc]) map[loc] = en
  }
}

export function clean(value: string | undefined | null): string | undefined {
  if (value == null) return undefined
  const trimmed = String(value).trim()
  if (!trimmed) return undefined
  if (/^\{\{\s*[\w]+\s*\}\}$/.test(trimmed)) return undefined
  if (/^(n\/a|na|none|not used|не использовалось|לא בשימוש|—|-)$/i.test(trimmed)) return undefined
  return trimmed
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function scalarString(value: unknown): string | undefined {
  if (typeof value === 'string') return clean(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return undefined
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => scalarString(item)).filter((item): item is string => Boolean(item))
  }
  if (typeof value === 'string') return splitList(clean(value))
  return []
}

function splitList(value: string | undefined): string[] {
  if (!value) return []
  return value
    .split(/[,·•]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function localeMap(value: unknown): LocaleMap | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const raw = value as Record<string, unknown>
  const out: LocaleMap = {}
  for (const loc of LOCALES) {
    const s = scalarString(raw[loc])
    if (s) out[loc] = s
  }
  return Object.keys(out).length ? out : undefined
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))]
}

export function resolveImportDir(input: string): string {
  const abs = path.resolve(input)
  if (fs.existsSync(abs)) return abs
  const underImports = path.resolve(process.cwd(), 'content/imports', input)
  if (fs.existsSync(underImports)) return underImports
  return abs
}

export function findBodyModule(dir: string): string | undefined {
  return pickExisting(dir, ['body.ts', 'body.mts', 'body.js', 'body.mjs'])
}

export const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
}
