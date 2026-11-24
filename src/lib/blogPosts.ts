import type { LocaleMap } from '@/lib/servicePages'
import type { PageFaqBlock } from '@/lib/pageFaq'

export type BlogPostStatus = 'draft' | 'published'

export type BlogRelatedLink = {
  label: LocaleMap
  href: string
}

export type BlogPost = {
  id: number | string
  slug: string
  status: BlogPostStatus
  publishedAt?: string | null
  updatedAt?: string | null
  title: LocaleMap
  excerpt: LocaleMap
  /** Lexical JSON per locale (or plain string fallback). */
  body: Record<string, unknown>
  cover?: { src: string; alt?: string; width?: number; height?: number } | null
  tags: string[]
  relatedLinks: BlogRelatedLink[]
  faq?: PageFaqBlock | null
  seoTitle?: LocaleMap
  seoDescription?: LocaleMap
}

/** Posts per index page (large service-style cards). */
export const BLOG_PAGE_SIZE = 6

export function blogIndexHref(page: number): string {
  if (page <= 1) return '/blog'
  return `/blog/page/${page}`
}

export function blogPageCount(totalPosts: number, pageSize = BLOG_PAGE_SIZE): number {
  if (totalPosts <= 0) return 1
  return Math.max(1, Math.ceil(totalPosts / pageSize))
}

export function sliceBlogPage<T>(
  posts: T[],
  page: number,
  pageSize = BLOG_PAGE_SIZE,
): { items: T[]; page: number; totalPages: number; total: number } {
  const total = posts.length
  const totalPages = blogPageCount(total, pageSize)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    items: posts.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
  }
}

/** UI + meta strings for the blog section (not CMS-managed yet). */
export const blogUi = {
  indexTitle: {
    en: 'Blog',
    ru: 'Блог',
    he: 'בלוג',
  } satisfies LocaleMap,
  indexKicker: {
    en: 'Insights',
    ru: 'Материалы',
    he: 'תובנות',
  } satisfies LocaleMap,
  indexDescription: {
    en: 'Practical notes on AI search visibility (GEO), website performance, CRO, and engineering — written for people and for AI assistants that cite sources.',
    ru: 'Практические материалы про видимость в AI-поиске (GEO), скорость сайта, CRO и инженерию — для людей и для ассистентов, которые цитируют источники.',
    he: 'הערות מעשיות על נראות בחיפוש AI (GEO), ביצועי אתר, CRO והנדסה — לאנשים ולעוזרים שמציינים מקורות.',
  } satisfies LocaleMap,
  emptyTitle: {
    en: 'Posts are on the way',
    ru: 'Скоро здесь появятся статьи',
    he: 'הפוסטים בדרך',
  } satisfies LocaleMap,
  emptyBody: {
    en: 'We are preparing the first articles on GEO, AI audits, and high-performance web builds. Check back soon, or start with an AI website audit.',
    ru: 'Готовим первые статьи про GEO, AI-аудиты и быстрые сайты. Загляните позже или начните с AI-аудита сайта.',
    he: 'אנחנו מכינים את המאמרים הראשונים על GEO, ביקורות AI ואתרים מהירים. חזרו בקרוב, או התחילו בביקורת AI לאתר.',
  } satisfies LocaleMap,
  emptyCta: {
    en: 'Open AI Audit',
    ru: 'Открыть AI-аудит',
    he: 'לביקורת AI',
  } satisfies LocaleMap,
  backToBlog: {
    en: 'All posts',
    ru: 'Все статьи',
    he: 'כל הפוסטים',
  } satisfies LocaleMap,
  relatedHeading: {
    en: 'Related',
    ru: 'Связанное',
    he: 'קשור',
  } satisfies LocaleMap,
  publishedLabel: {
    en: 'Published',
    ru: 'Опубликовано',
    he: 'פורסם',
  } satisfies LocaleMap,
  updatedLabel: {
    en: 'Updated',
    ru: 'Обновлено',
    he: 'עודכן',
  } satisfies LocaleMap,
  metaTitle: {
    en: 'Blog | Erythro.ai',
    ru: 'Блог | Erythro.ai',
    he: 'בלוג | Erythro.ai',
  } satisfies LocaleMap,
  metaDescription: {
    en: 'GEO, AI visibility, CRO, and engineering articles from Erythro.ai — structured for search engines and AI citation.',
    ru: 'Статьи Erythro.ai про GEO, AI-видимость, CRO и инженерию — структурированы для поиска и цитирования AI.',
    he: 'מאמרים מ-Erythro.ai על GEO, נראות AI, CRO והנדסה — מובנים לחיפוש ולציטוט ב-AI.',
  } satisfies LocaleMap,
  prevPage: {
    en: 'Previous',
    ru: 'Назад',
    he: 'הקודם',
  } satisfies LocaleMap,
  nextPage: {
    en: 'Next',
    ru: 'Вперёд',
    he: 'הבא',
  } satisfies LocaleMap,
  paginationLabel: {
    en: 'Blog pages',
    ru: 'Страницы блога',
    he: 'עמודי הבלוג',
  } satisfies LocaleMap,
  pageMetaSuffix: {
    en: 'Page',
    ru: 'Страница',
    he: 'עמוד',
  } satisfies LocaleMap,
}

export function tBlog(field: LocaleMap | undefined, locale: string): string {
  if (!field) return ''
  return (field[locale] || field.en || '').trim()
}

export function formatBlogDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const tag = locale === 'ru' ? 'ru-RU' : locale === 'he' ? 'he-IL' : 'en-US'
  return new Intl.DateTimeFormat(tag, { year: 'numeric', month: 'long', day: 'numeric' }).format(d)
}
