/**
 * Compact PageSpeed / Lighthouse snapshot for the leak calculator LP.
 * Stored on `auditSummary.pagespeed` by the audit-agent (from audit_data.json).
 */

export type PsiDeviceSnapshot = {
  performance: number | null
  accessibility: number | null
  bestPractices: number | null
  seo: number | null
  fcp: string | null
  lcp: string | null
  cls: string | null
  tbt: string | null
  speedIndex: string | null
  tti: string | null
}

export type PagespeedSnapshot = {
  mobile: PsiDeviceSnapshot | null
  desktop: PsiDeviceSnapshot | null
}

const EMPTY_DEVICE: PsiDeviceSnapshot = {
  performance: null,
  accessibility: null,
  bestPractices: null,
  seo: null,
  fcp: null,
  lcp: null,
  cls: null,
  tbt: null,
  speedIndex: null,
  tti: null,
}

function asScore(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  return Math.round(Math.min(100, Math.max(0, n)))
}

function asDisplay(metrics: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!metrics || typeof metrics !== 'object') return null
  const raw = metrics[key]
  if (raw == null) return null
  if (typeof raw === 'string') {
    const t = raw.trim()
    return t || null
  }
  if (typeof raw === 'object') {
    const info = raw as { displayValue?: unknown; value?: unknown }
    const display = info.displayValue != null ? String(info.displayValue).trim() : ''
    if (display) return display.replace(/\s+/g, ' ')
    if (info.value != null) {
      const v = String(info.value).trim()
      return v || null
    }
  }
  return null
}

function parseDevice(raw: unknown): PsiDeviceSnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  const st = raw as { status?: unknown; scores?: unknown; metrics?: unknown }
  if (st.status != null && String(st.status) !== 'SUCCESS') return null
  const scores =
    st.scores && typeof st.scores === 'object' ? (st.scores as Record<string, unknown>) : {}
  const metrics =
    st.metrics && typeof st.metrics === 'object' ? (st.metrics as Record<string, unknown>) : {}
  const out: PsiDeviceSnapshot = {
    performance: asScore(scores.performance),
    accessibility: asScore(scores.accessibility),
    bestPractices: asScore(scores.best_practices ?? scores.bestPractices),
    seo: asScore(scores.seo),
    fcp: asDisplay(metrics, 'FCP'),
    lcp: asDisplay(metrics, 'LCP'),
    cls: asDisplay(metrics, 'CLS'),
    tbt: asDisplay(metrics, 'TBT'),
    speedIndex: asDisplay(metrics, 'Speed Index') ?? asDisplay(metrics, 'SpeedIndex'),
    tti: asDisplay(metrics, 'TTI'),
  }
  const hasAny = Object.values(out).some((v) => v != null && v !== '')
  return hasAny ? out : null
}

/** From full `audit_data.json` (`pagespeed_insights`). */
export function parsePagespeedFromAuditData(raw: unknown): PagespeedSnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  const psi = (raw as { pagespeed_insights?: unknown }).pagespeed_insights
  if (!psi || typeof psi !== 'object') return null
  const block = psi as { mobile?: unknown; desktop?: unknown }
  const mobile = parseDevice(block.mobile)
  const desktop = parseDevice(block.desktop)
  if (!mobile && !desktop) return null
  return { mobile, desktop }
}

/** Already-compact `auditSummary.pagespeed` shape (or nested pagespeed_insights). */
export function pagespeedFromAuditSummary(summary: unknown): PagespeedSnapshot | null {
  if (!summary || typeof summary !== 'object') return null
  const s = summary as { pagespeed?: unknown; pagespeed_insights?: unknown }
  if (s.pagespeed && typeof s.pagespeed === 'object') {
    const p = s.pagespeed as { mobile?: unknown; desktop?: unknown }
    // Compact device objects already flattened by the worker
    const mobile = normalizeCompactDevice(p.mobile) ?? parseDevice(p.mobile)
    const desktop = normalizeCompactDevice(p.desktop) ?? parseDevice(p.desktop)
    if (!mobile && !desktop) return null
    return { mobile, desktop }
  }
  return parsePagespeedFromAuditData({ pagespeed_insights: s.pagespeed_insights })
}

function normalizeCompactDevice(raw: unknown): PsiDeviceSnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  const d = raw as Partial<PsiDeviceSnapshot>
  const keys: (keyof PsiDeviceSnapshot)[] = [
    'performance',
    'accessibility',
    'bestPractices',
    'seo',
    'fcp',
    'lcp',
    'cls',
    'tbt',
    'speedIndex',
    'tti',
  ]
  if (!keys.some((k) => d[k] != null && d[k] !== '')) return null
  return {
    performance: asScore(d.performance),
    accessibility: asScore(d.accessibility),
    bestPractices: asScore(d.bestPractices),
    seo: asScore(d.seo),
    fcp: typeof d.fcp === 'string' ? d.fcp : null,
    lcp: typeof d.lcp === 'string' ? d.lcp : null,
    cls: typeof d.cls === 'string' ? d.cls : null,
    tbt: typeof d.tbt === 'string' ? d.tbt : null,
    speedIndex: typeof d.speedIndex === 'string' ? d.speedIndex : null,
    tti: typeof d.tti === 'string' ? d.tti : null,
  }
}

export function emptyPsiDevice(): PsiDeviceSnapshot {
  return { ...EMPTY_DEVICE }
}

/** True when at least one device has a usable metric. */
export function hasPagespeedData(snapshot: PagespeedSnapshot | null | undefined): boolean {
  return Boolean(snapshot?.mobile || snapshot?.desktop)
}
