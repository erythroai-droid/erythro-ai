/**
 * Revenue-leak estimate for the calculator LP (leak-*).
 *
 * Input: the five scorecard scales (0–100) from a finished Free audit.
 * Output: how many percent of potential conversions the site loses and what that is in ₪.
 *
 * The caps are product assumptions from the strategy session (28.10.2026), not measured
 * data: every number shown to the user is an estimate and the page says so.
 */

export type AuditPillars = {
  /** speed_mobile_ux */
  speed: number
  /** lead_gen_forms */
  leads: number
  /** seo_visibility */
  seo: number
  /** security_stability */
  security: number
  /** ai_visibility */
  ai: number
}

export type LeakBreakdown = {
  speed: number
  forms: number
  visibility: number
  security: number
  /** Sum of the four, capped at LEAK_TOTAL_MAX. Percentage points, 0–42. */
  total: number
}

/** Max loss (percentage points) each area can add. */
export const LEAK_CAPS = {
  speed: 20,
  forms: 15,
  visibility: 10,
  security: 5,
} as const

/** The four areas together never exceed this share of potential conversions. */
export const LEAK_TOTAL_MAX = 42

/** Below this total the site is in good shape and the page says so instead of a loss. */
export const LEAK_NEGLIGIBLE_BELOW = 3

/** Fixed price of the fix sprint, ₪. */
export const SPRINT_PRICE_ILS = 2200

export type LightLevel = 'red' | 'yellow' | 'green'

/**
 * Chip / impact copy key. Green scores with any loss use «Good», not «Excellent»
 * (product rule 1B: Отлично cannot coexist with losses).
 */
export type ScoreLabelKey = LightLevel | 'excellent'

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

/** Share of the cap lost for a given scale score: 100 → 0, 0 → full cap. */
function gap(score: number): number {
  return (100 - clampScore(score)) / 100
}

export function leakBreakdown(pillars: AuditPillars): LeakBreakdown {
  const speed = LEAK_CAPS.speed * gap(pillars.speed)
  const forms = LEAK_CAPS.forms * gap(pillars.leads)
  const visibility = LEAK_CAPS.visibility * gap((clampScore(pillars.seo) + clampScore(pillars.ai)) / 2)
  const security = LEAK_CAPS.security * gap(pillars.security)
  const total = Math.min(LEAK_TOTAL_MAX, speed + forms + visibility + security)
  return { speed, forms, visibility, security, total }
}

export function lightFor(score: number): LightLevel {
  const s = clampScore(score)
  if (s < 60) return 'red'
  if (s < 80) return 'yellow'
  return 'green'
}

/**
 * Label for a scale given its score and attributed loss (percentage points).
 * loss ≤ 0 and green → excellent; green with loss → good (still LightLevel green).
 */
export function scoreLabelKey(score: number, loss: number): ScoreLabelKey {
  const level = lightFor(score)
  if (level === 'green' && !(loss > 0)) return 'excellent'
  return level
}

/**
 * Reads five scorecard scales from `auditSummary.pillars` (short keys) or from an
 * executive_scorecard-shaped object (Java long keys). Null unless all five are finite.
 */
export function parsePillars(value: unknown): AuditPillars | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const pairs: Array<[keyof AuditPillars, unknown]> = [
    ['speed', raw.speed ?? raw.speed_mobile_ux],
    ['leads', raw.leads ?? raw.lead_gen_forms],
    ['seo', raw.seo ?? raw.seo_visibility],
    ['security', raw.security ?? raw.security_stability],
    ['ai', raw.ai ?? raw.ai_visibility],
  ]
  const out: Partial<AuditPillars> = {}
  for (const [key, value] of pairs) {
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n)) return null
    out[key] = clampScore(n)
  }
  return out as AuditPillars
}

/** Prefer short `pillars`, else executive_scorecard keys on the same summary object. */
export function pillarsFromAuditSummary(summary: unknown): AuditPillars | null {
  if (!summary || typeof summary !== 'object') return null
  const s = summary as { pillars?: unknown; executive_scorecard?: unknown }
  return parsePillars(s.pillars) ?? parsePillars(s.executive_scorecard)
}

/** Old audits have no per-scale data: fall back to the overall score for every scale. */
export function pillarsFromOverall(overall: number): AuditPillars {
  const s = clampScore(overall)
  return { speed: s, leads: s, seo: s, security: s, ai: s }
}

export type RevenueInput =
  | { mode: 'revenue'; monthlyRevenue: number }
  | { mode: 'leads'; leadsPerMonth: number; avgDeal: number }

export function monthlyRevenueOf(input: RevenueInput): number {
  const raw =
    input.mode === 'revenue' ? input.monthlyRevenue : input.leadsPerMonth * input.avgDeal
  return Number.isFinite(raw) && raw > 0 ? raw : 0
}

export type LeakResult = {
  /** Current monthly revenue the user entered, ₪. */
  revenue: number
  /** Loss in ₪ per month, rounded to avoid false precision. */
  monthly: number
  yearly: number
  /** Percent of potential conversions lost (one decimal precision upstream). */
  percent: number
  sprintPrice: number
  /** Days until the sprint pays back; null when there is no loss to recover. */
  paybackDays: number | null
}

/** Round to the nearest 100 ₪ above 1,000 ₪, to the nearest 10 below. */
function roundMoney(value: number): number {
  if (value >= 1000) return Math.round(value / 100) * 100
  return Math.round(value / 10) * 10
}

/**
 * Current revenue already reflects the loss: revenue = potential × (1 − p),
 * so the loss is revenue × p / (1 − p).
 */
export function computeLeak(breakdown: LeakBreakdown, input: RevenueInput): LeakResult {
  const revenue = monthlyRevenueOf(input)
  const p = breakdown.total / 100
  const monthly = revenue > 0 && p > 0 ? roundMoney((revenue * p) / (1 - p)) : 0
  const paybackDays = monthly > 0 ? Math.max(1, Math.ceil(SPRINT_PRICE_ILS / (monthly / 30))) : null
  return {
    revenue,
    monthly,
    yearly: monthly * 12,
    percent: Math.round(breakdown.total * 10) / 10,
    sprintPrice: SPRINT_PRICE_ILS,
    paybackDays,
  }
}

/** Parse a free-text money field ("12 000", "12,000", "12000.5"); 0 when not a positive number. */
export function parseMoneyInput(raw: string): number {
  const cleaned = raw.replace(/[\s ,'_]/g, '').replace(/[^\d.]/g, '')
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * Profile of a typical small-business site. Before the audit runs the calculator shows
 * the estimate for this profile, clearly labelled as a benchmark, and swaps in the real scales afterwards.
 */
export const TYPICAL_PILLARS: AuditPillars = { speed: 45, leads: 55, seo: 60, security: 65, ai: 40 }

/** Monthly revenue slider, ₪. Log scale so ₪1k and ₪1M are both easy to hit. */
export const REVENUE_SLIDER = { min: 1_000, max: 1_000_000, step: 1, default: 150_000 } as const

/** Visitors-per-month toggle presets. */
export const VISITOR_PRESETS = [1_000, 5_000, 10_000, 25_000, 50_000, 100_000] as const

function niceRound(value: number): number {
  const step =
    value >= 100_000
      ? 10_000
      : value >= 20_000
        ? 5_000
        : value >= 5_000
          ? 1_000
          : 500
  return Math.max(REVENUE_SLIDER.min, Math.round(value / step) * step)
}

/** Slider position 0–1000 → monthly revenue on a log scale, rounded to a readable number. */
export function sliderToRevenue(position: number): number {
  const t = Math.min(1000, Math.max(0, position)) / 1000
  const { min, max } = REVENUE_SLIDER
  return Math.min(max, Math.max(min, niceRound(min * Math.pow(max / min, t))))
}

/** Inverse of `sliderToRevenue`, clamped to the slider range. */
export function revenueToSlider(revenue: number): number {
  const { min, max } = REVENUE_SLIDER
  const v = Math.min(max, Math.max(min, revenue))
  return Math.round((Math.log(v / min) / Math.log(max / min)) * 1000)
}

/** Customers-per-month toggle presets. */
export const CLIENT_PRESETS = [10, 25, 50, 100, 250, 500] as const

/** Customers lost per month: current customers already reflect the loss (same logic as `computeLeak`). */
export function lostClientsPerMonth(breakdown: LeakBreakdown, clients: number): number {
  const p = breakdown.total / 100
  if (!(clients > 0) || p <= 0) return 0
  return Math.max(1, Math.round((clients * p) / (1 - p)))
}
