import fs from 'node:fs'
import path from 'node:path'
import { parseYaml } from './simple-yaml'

export const LOCALES = ['en', 'ru', 'he'] as const
export type Locale = (typeof LOCALES)[number]

export type LocaleMap<T = string> = Partial<Record<Locale, T>>

export const BODY_SECTION_IDS = [
  'challenges',
  'frontend',
  'backend',
  'automation',
  'results',
] as const

export type BodySectionId = (typeof BODY_SECTION_IDS)[number]

export type BriefMedia = {
  card?: string
  hero?: string
  heroMobile?: string
}

export type BriefCopySection = {
  id?: string
  heading?: LocaleMap
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
  dir: string
}

export type ComposedSection = {
  id: string
  heading: LocaleMap
  paragraphs: LocaleMap[]
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
}

const DEFAULT_HEADINGS: Record<BodySectionId, Record<Locale, string>> = {
  challenges: { en: 'Challenges & goals', ru: 'Вызовы и задачи', he: 'אתגרים ומטרות' },
  frontend: { en: 'Frontend & UX', ru: 'Фронтенд и UX', he: 'פרונטאנד ו־UX' },
  backend: {
    en: 'Backend, data & integrations',
    ru: 'Бэкенд, данные и интеграции',
    he: 'בקאנד, נתונים ואינטגרציות',
  },
  automation: {
    en: 'Automation & security',
    ru: 'Автоматизация и безопасность',
    he: 'אוטומציה ואבטחה',
  },
  results: { en: 'Results', ru: 'Результаты', he: 'תוצאות' },
}

const GOAL_LABELS: Record<Locale, { architecture: string; design: string; business: string; automation: string }> = {
  en: { architecture: 'Architecture', design: 'UI/UX', business: 'Conversion', automation: 'Security' },
  ru: { architecture: 'Архитектура', design: 'UI/UX', business: 'Конверсия', automation: 'Безопасность' },
  he: { architecture: 'ארכיטקטורה', design: 'UI/UX', business: 'המרה', automation: 'אבטחה' },
}

const FRONTEND_LABELS: Record<Locale, { stack: string; components: string; motion: string; i18n: string }> = {
  en: { stack: 'UI stack', components: 'Components', motion: 'Motion', i18n: 'i18n & RTL' },
  ru: { stack: 'Стек UI', components: 'Компоненты', motion: 'Анимации', i18n: 'Мультиязычность и RTL' },
  he: { stack: 'ערימת UI', components: 'קומפוננטות', motion: 'תנועה', i18n: 'רב־לשוניות ו־RTL' },
}

const BACKEND_LABELS: Record<Locale, { infra: string; data: string; integrations: string }> = {
  en: { infra: 'Infrastructure', data: 'Data / CMS', integrations: 'Integrations' },
  ru: { infra: 'Инфраструктура', data: 'Данные / CMS', integrations: 'Интеграции' },
  he: { infra: 'תשתית', data: 'נתונים / CMS', integrations: 'אינטגרציות' },
}

const AUTO_LABELS: Record<Locale, { cicd: string; security: string }> = {
  en: { cicd: 'Quality / CI', security: 'Security & AI-ops' },
  ru: { cicd: 'Контроль качества / CI', security: 'Безопасность и AI-ops' },
  he: { cicd: 'איכות / CI', security: 'אבטחה ו־AI-ops' },
}

const RESULT_LABELS: Record<Locale, { speed: string; reliability: string; conversion: string; seo: string }> = {
  en: { speed: 'Speed', reliability: 'Reliability', conversion: 'Business effect', seo: 'SEO' },
  ru: { speed: 'Скорость', reliability: 'Отказоустойчивость', conversion: 'Бизнес-эффект', seo: 'SEO' },
  he: { speed: 'מהירות', reliability: 'אמינות', conversion: 'אפקט עסקי', seo: 'SEO' },
}

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.mp4', '.webm', '.mov'])

export function loadBrief(dir: string): Brief {
  const abs = path.resolve(dir)
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    throw new Error(`Import folder not found: ${abs}`)
  }

  const file =
    pickExisting(abs, ['brief.yaml', 'brief.yml', 'brief.md', 'brief.json']) ??
    null
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
    brief.stack.length > 0
      ? brief.stack
      : splitList(clean(enFacts.TECH_STACK_LIST))
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
  }
}

function composeFromFacts(brief: Brief): Omit<ComposedProject, 'slug' | 'category' | 'date' | 'client' | 'link' | 'order' | 'stack' | 'tags' | 'media'> {
  const title: LocaleMap = {}
  const description: LocaleMap = {}
  const summary: LocaleMap = {}
  const subtitle: LocaleMap = {}
  const seoTitle: LocaleMap = {}
  const seoDescription: LocaleMap = {}
  const sections: Record<BodySectionId, LocaleMap[]> = {
    challenges: [{}, {}],
    frontend: [{}],
    backend: [{}],
    automation: [{}],
    results: [{}],
  }

  for (const loc of LOCALES) {
    const facts = brief.facts?.[loc]
    if (!facts) continue
    title[loc] = clean(facts.PROJECT_NAME)
    description[loc] = clean(facts.SHORT_TAGLINE)
    summary[loc] = clean(facts.HIGH_LEVEL_SUMMARY)
    subtitle[loc] = clean(facts.SUBTITLE)
    seoTitle[loc] =
      clean(facts.SEO_TITLE) ||
      clean(facts[`SEO_TITLE_${loc.toUpperCase()}`]) ||
      undefined
    seoDescription[loc] =
      clean(facts.SEO_DESC) ||
      clean(facts[`SEO_DESC_${loc.toUpperCase()}`]) ||
      undefined

    sections.challenges[0][loc] = clean(facts.PROJECT_CONTEXT_AND_PAIN_POINTS)
    sections.challenges[1][loc] = labeled(loc, GOAL_LABELS[loc], [
      ['architecture', facts.ARCHITECTURE_GOAL],
      ['design', facts.DESIGN_GOAL],
      ['business', facts.BUSINESS_GOAL],
      ['automation', facts.AUTOMATION_GOAL],
    ])
    sections.frontend[0][loc] = labeled(loc, FRONTEND_LABELS[loc], [
      ['stack', facts.FRONTEND_STACK],
      ['components', facts.FRONTEND_DETAILS],
      ['motion', facts.ANIMATION_DETAILS],
      ['i18n', facts.I18N_DETAILS],
    ])
    sections.backend[0][loc] = labeled(loc, BACKEND_LABELS[loc], [
      ['infra', facts.BACKEND_DETAILS],
      ['data', facts.CMS_DETAILS],
      ['integrations', facts.INTEGRATIONS_LIST],
    ])
    sections.automation[0][loc] = labeled(loc, AUTO_LABELS[loc], [
      ['cicd', facts.CICD_DETAILS],
      ['security', facts.AI_SECURITY_DETAILS],
    ])
    sections.results[0][loc] = labeled(loc, RESULT_LABELS[loc], [
      ['speed', facts.SPEED_METRIC_RESULT],
      ['reliability', facts.RELIABILITY_RESULT],
      ['conversion', facts.CONVERSION_RESULT],
      ['seo', facts.SEO_RESULT],
    ])
  }

  const body: ComposedSection[] = BODY_SECTION_IDS.map((id) => ({
    id,
    heading: { ...DEFAULT_HEADINGS[id] },
    paragraphs: sections[id].filter((para) => LOCALES.some((loc) => para[loc])),
    images: resolveSectionImages(brief, id),
  })).filter((section) => section.paragraphs.length > 0 || section.images.length > 0)

  return { title, description, summary, subtitle, seoTitle, seoDescription, body }
}

function composeFromCopyBody(brief: Brief, rows: BriefCopySection[]): ComposedSection[] {
  return rows.map((row, index) => {
    const id = row.id || BODY_SECTION_IDS[index] || `section-${index + 1}`
    const heading = { ...(row.heading ?? {}) }
    fillFallback(heading)
    const paragraphs = (row.paragraphs ?? []).map((para) => {
      const next = { ...para }
      fillFallback(next)
      return next
    })
    const images = (row.images?.length ? row.images : resolveSectionImages(brief, id)).filter(Boolean)
    return { id, heading, paragraphs, images }
  })
}

export function resolveMedia(brief: Brief): BriefMedia {
  return {
    card: brief.media?.card || findByStem(brief.dir, 'card'),
    hero: brief.media?.hero || findByStem(brief.dir, 'hero', ['hero-mobile', 'heroMobile']),
    heroMobile:
      brief.media?.heroMobile || findByStem(brief.dir, 'hero-mobile') || findByStem(brief.dir, 'heroMobile'),
  }
}

function resolveSectionImages(brief: Brief, sectionId: string): string[] {
  const listed = brief.bodyImages?.[sectionId] ?? []
  const folder = path.join(brief.dir, 'body', sectionId)
  const fromFolder = listImages(folder).map((file) => path.relative(brief.dir, file).replaceAll('\\', '/'))
  const prefixed = listImages(brief.dir)
    .filter((file) => {
      const base = path.basename(file).toLowerCase()
      return base.startsWith(`section-${sectionId}-`) || base.startsWith(`${sectionId}-`)
    })
    .map((file) => path.basename(file))
  return unique([...listed, ...fromFolder, ...prefixed])
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

function labeled(
  _loc: Locale,
  labels: Record<string, string>,
  rows: [string, string | undefined][],
): string | undefined {
  const lines = rows
    .map(([key, value]) => {
      const v = clean(value)
      if (!v) return null
      return `${labels[key]}: ${v}`
    })
    .filter((line): line is string => Boolean(line))
  return lines.length ? lines.join('\n') : undefined
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
