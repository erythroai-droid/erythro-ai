import type { LocaleMap, LocaleListMap } from './servicePages'
import type { LocaleLexicalMap } from './lexical'

export type { LocaleMap, LocaleListMap }
export { tLocale, tLocaleList } from './servicePages'

export type PortfolioCategory = string

export interface PortfolioFilter {
  id: PortfolioCategory
  label: LocaleMap
}

export interface PortfolioBodySection {
  heading?: LocaleMap
  /** Plain-text fallback / seed; prefer paragraphsRich when present. */
  paragraphs: LocaleListMap
  /** Lexical docs per locale from CMS (one doc per paragraph row). */
  paragraphsRich?: Record<string, unknown[]>
  images: string[]
}

export interface PortfolioProject {
  id: string
  slug: string
  title: LocaleMap
  category: Exclude<PortfolioCategory, 'all'>
  categoryLabel: LocaleMap
  description: LocaleMap
  tags: string[]
  image: string
  date: string
  stack: string[]
  client: string
  link?: string
  hero: { type: 'image' | 'video'; src: string; srcMobile?: string; typeMobile?: 'image' | 'video' }
  /** Plain-text fallback / seed; prefer summaryRich when present. */
  summary: LocaleMap
  summaryRich?: LocaleLexicalMap | Record<string, unknown>
  /** Optional lead under the body title. */
  subtitle?: LocaleMap
  subtitleRich?: LocaleLexicalMap | Record<string, unknown>
  body: PortfolioBodySection[]
  seoTitle?: LocaleMap
  seoDescription?: LocaleMap
}

/** Seed-only flat shape (English). Converted to LocaleMap at module load. */
interface FlatBodySection {
  heading?: string
  paragraphs: string[]
  images: string[]
}

interface FlatPortfolioProject {
  id: string
  slug: string
  title: string
  category: Exclude<PortfolioCategory, 'all'>
  categoryLabel: string
  description: string
  tags: string[]
  image: string
  date: string
  stack: string[]
  client: string
  link?: string
  hero: { type: 'image' | 'video'; src: string; srcMobile?: string; typeMobile?: 'image' | 'video' }
  summary: string
  subtitle?: string
  body: FlatBodySection[]
  seoTitle?: string
  seoDescription?: string
}

function L(en: string): LocaleMap {
  return { en }
}

function localizeProject(p: FlatPortfolioProject): PortfolioProject {
  return {
    id: p.id,
    slug: p.slug,
    title: L(p.title),
    category: p.category,
    categoryLabel: L(p.categoryLabel),
    description: L(p.description),
    tags: p.tags,
    image: p.image,
    date: p.date,
    stack: p.stack,
    client: p.client,
    ...(p.link ? { link: p.link } : {}),
    hero: p.hero,
    summary: L(p.summary),
    ...(p.subtitle ? { subtitle: L(p.subtitle) } : {}),
    body: p.body.map((section) => ({
      ...(section.heading ? { heading: L(section.heading) } : {}),
      paragraphs: { en: section.paragraphs },
      images: section.images,
    })),
    ...(p.seoTitle ? { seoTitle: L(p.seoTitle) } : {}),
    ...(p.seoDescription ? { seoDescription: L(p.seoDescription) } : {}),
  }
}

/** Fallback filters when CMS categories are empty. */
const FLAT_PORTFOLIO_FILTERS: { id: PortfolioCategory; label: string }[] = [
  { id: 'all', label: 'All Projects' },
  { id: 'ai', label: 'AI Agents' },
  { id: 'crm', label: 'CRM Systems' },
  { id: 'websites', label: 'Websites' },
  { id: 'landing', label: 'Landing Pages' },
  { id: 'apps', label: 'Apps' },
  { id: 'other', label: 'Other' },
]

export const PORTFOLIO_FILTERS: PortfolioFilter[] = FLAT_PORTFOLIO_FILTERS.map((f) => ({
  id: f.id,
  label: L(f.label),
}))

const ALL_PROJECTS_LABEL: LocaleMap = {
  en: 'All Projects',
  ru: 'Все проекты',
  he: 'כל הפרויקטים',
}

export function buildPortfolioFilters(
  categories: PortfolioFilter[],
  allLabel: LocaleMap = ALL_PROJECTS_LABEL,
): PortfolioFilter[] {
  const chips = categories.length
    ? categories
    : PORTFOLIO_FILTERS.filter((f) => f.id !== 'all')
  return [{ id: 'all', label: allLabel }, ...chips]
}

const FLAT_PORTFOLIO_PROJECTS: FlatPortfolioProject[] = [
  {
    id: '1',
    slug: 'ai-lead-qualifier',
    title: 'AI Lead Qualifier',
    category: 'ai',
    categoryLabel: 'AI Agents',
    description: 'Autonomous agent that scores inbound leads and books qualified calls.',
    tags: ['n8n', 'OpenAI', 'CRM'],
    image: '/images/portfolio/case-1.png',
    date: '2025',
    stack: ['n8n', 'OpenAI', 'CRM'],
    client: 'Growth Studio',
    link: 'https://erythro.ai',
    hero: { type: 'image', src: '/images/portfolio/case-1.png' },
    summary:
      'An autonomous qualification agent that scores inbound leads and books calls with sales — without manual triage.',
    body: [
      {
        heading: 'Overview',
        paragraphs: [
          'Inbound volume was growing faster than the sales team could triage. High-intent leads waited hours; low-intent noise clogged the pipeline.',
          'We designed an AI agent on n8n that scores every lead, writes a short brief into the CRM, and books a meeting only when the score clears the threshold.',
        ],
        images: ['/images/portfolio/case-1.png'],
      },
      {
        heading: 'Outcome',
        paragraphs: [
          'Qualified leads reach calendar slots within minutes. The sales team spends time on conversations that convert — not inbox sorting.',
        ],
        images: ['/images/portfolio/case-2.png', '/images/portfolio/case-3.png'],
      },
    ],
  },
  {
    id: '2',
    slug: 'ops-command-center',
    title: 'Ops Command Center',
    category: 'crm',
    categoryLabel: 'CRM Systems',
    description: 'Unified dashboard for pipeline, tasks, and client communication.',
    tags: ['Next.js', 'Payload', 'Postgres'],
    image: '/images/portfolio/case-2.png',
    date: '2025',
    stack: ['Next.js', 'Payload', 'Postgres'],
    client: 'Ops Collective',
    hero: { type: 'image', src: '/images/portfolio/case-2.png' },
    summary:
      'A single operations dashboard that unifies pipeline health, tasks, and client threads for a distributed delivery team.',
    body: [
      {
        heading: 'Overview',
        paragraphs: [
          'Delivery lived across spreadsheets, Slack, and three CRMs. Status updates were unreliable; handoffs dropped context.',
          'We built a command center on Next.js and Payload: one pipeline view, shared tasks, and message history per client.',
        ],
        images: ['/images/portfolio/case-2.png'],
      },
      {
        heading: 'Outcome',
        paragraphs: [
          'Ops leads see blockers in one place. Account managers open a project and get full context without hunting for threads.',
        ],
        images: ['/images/portfolio/case-1.png'],
      },
    ],
  },
  {
    id: '3',
    slug: 'studio-portfolio-site',
    title: 'Studio Portfolio Site',
    category: 'websites',
    categoryLabel: 'Websites',
    description: 'High-performance brand site with cinematic motion and CMS editing.',
    tags: ['Next.js', 'GSAP', 'Design'],
    image: '/images/portfolio/case-3.png',
    date: '2024 — 2025',
    stack: ['Next.js', 'GSAP', 'Design'],
    client: 'Independent Studio',
    link: 'https://erythro.ai',
    hero: { type: 'image', src: '/images/portfolio/case-3.png' },
    summary:
      'A performance-first brand site with cinematic scroll motion and CMS-editable content for a creative studio.',
    body: [
      {
        heading: 'Overview',
        paragraphs: [
          'The studio needed a site that felt like their reel — motion-led, sharp, and still editable without developers.',
          'We paired Next.js with GSAP ScrollTrigger for section storytelling, then wired Payload so copy and case media ship from the CMS.',
        ],
        images: ['/images/portfolio/case-3.png', '/images/portfolio/case-1.png'],
      },
    ],
  },
  {
    id: '4',
    slug: 'product-launch-landing',
    title: 'Product Launch Landing',
    category: 'landing',
    categoryLabel: 'Landing Pages',
    description: 'Conversion-focused landing with A/B-ready sections and analytics.',
    tags: ['Webflow', 'Analytics'],
    image: '/images/portfolio/case-1.png',
    date: '2025',
    stack: ['Webflow', 'Analytics'],
    client: 'SaaS Launch',
    hero: { type: 'image', src: '/images/portfolio/case-1.png' },
    summary:
      'A conversion-focused launch landing with modular sections ready for A/B tests and clear analytics instrumentation.',
    body: [
      {
        heading: 'Overview',
        paragraphs: [
          'Launch week needed a page that marketing could iterate daily — headlines, proof, and CTAs — without redeploys.',
          'We built a Webflow landing with named sections, event tracking on every CTA, and a structure that swaps variants safely.',
        ],
        images: ['/images/portfolio/case-1.png'],
      },
      {
        paragraphs: [
          'Post-launch experiments ran against a single source of truth for funnel events, so the team could read signal instead of vibes.',
        ],
        images: ['/images/portfolio/case-2.png'],
      },
    ],
  },
  {
    id: '5',
    slug: 'client-portal-app',
    title: 'Client Portal App',
    category: 'apps',
    categoryLabel: 'Apps',
    description: 'Secure client space for deliveries, approvals, and messaging.',
    tags: ['React', 'Auth', 'API'],
    image: '/images/portfolio/case-2.png',
    date: '2024',
    stack: ['React', 'Auth', 'API'],
    client: 'Agency Ops',
    hero: { type: 'image', src: '/images/portfolio/case-2.png' },
    summary:
      'A secure client portal for deliveries, approvals, and messaging — replacing email chains with a clear shared space.',
    body: [
      {
        heading: 'Overview',
        paragraphs: [
          'Clients chased assets in inbox threads. Approvals stalled when stakeholders missed attachments.',
          'The portal gives each client a signed-in space: deliverables, review states, and a message thread tied to each milestone.',
        ],
        images: ['/images/portfolio/case-2.png', '/images/portfolio/case-3.png'],
      },
    ],
  },
  {
    id: '6',
    slug: 'brand-identity-system',
    title: 'Brand Identity System',
    category: 'other',
    categoryLabel: 'Other',
    description: 'Visual language, guidelines, and asset kit for a digital product brand.',
    tags: ['Branding', 'Figma'],
    image: '/images/portfolio/case-3.png',
    date: '2024',
    stack: ['Branding', 'Figma'],
    client: 'Product Brand',
    hero: { type: 'image', src: '/images/portfolio/case-3.png' },
    summary:
      'A complete visual language — guidelines and an asset kit — so product and marketing stay on the same brand.',
    body: [
      {
        heading: 'Overview',
        paragraphs: [
          'The product shipped fast but looked inconsistent across web, app, and decks.',
          'We defined type, color, and component rules in Figma, then packaged export-ready assets for every channel.',
        ],
        images: ['/images/portfolio/case-3.png'],
      },
    ],
  },
]

export const PORTFOLIO_PROJECTS: PortfolioProject[] =
  FLAT_PORTFOLIO_PROJECTS.map(localizeProject)

export const matchesPortfolioFilter = (
  category: Exclude<PortfolioCategory, 'all'>,
  filter: PortfolioCategory,
) => filter === 'all' || category === filter

export function getPortfolioProject(slug: string): PortfolioProject | undefined {
  return PORTFOLIO_PROJECTS.find((project) => project.slug === slug)
}

export function getAllPortfolioSlugs(): string[] {
  return PORTFOLIO_PROJECTS.map((project) => project.slug)
}
