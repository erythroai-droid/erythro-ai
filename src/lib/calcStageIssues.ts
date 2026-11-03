/**
 * Dynamic «where it breaks» copy for step-4 funnel stages.
 * Prefer a few lab numbers (Lighthouse) over a full checklist.
 */
import { auditCalcCopy as copy, fillCalc, tCalc, type CalcArea } from '@/lib/auditCalcCopy'
import type { PagespeedSnapshot } from '@/lib/pagespeedSnapshot'

export type StageIssueInput = {
  area: CalcArea
  locale: string
  score: number
  loss: number
  /** SEO / AI scores for the visibility stage. */
  seoScore?: number
  aiScore?: number
  pagespeed?: PagespeedSnapshot | null
}

function dash(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—'
  return String(value)
}

export function stageIssueText(input: StageIssueInput): string {
  const { area, locale, score, loss, pagespeed } = input
  const roundedScore = Math.round(score)
  const roundedLoss = Math.max(0, Math.round(loss))
  const mobile = pagespeed?.mobile ?? null
  const desktop = pagespeed?.desktop ?? null

  if (area === 'speed') {
    if (mobile?.lcp || mobile?.cls || mobile?.performance != null) {
      return fillCalc(tCalc(copy.step4Stage2IssueMetrics, locale), {
        perf: dash(mobile?.performance),
        lcp: dash(mobile?.lcp),
        cls: dash(mobile?.cls),
      })
    }
    return fillCalc(tCalc(copy.step4Stage2IssueScore, locale), {
      score: roundedScore,
      loss: roundedLoss,
    })
  }

  if (area === 'security') {
    return fillCalc(tCalc(copy.step4Stage3IssueScore, locale), {
      score: roundedScore,
      loss: roundedLoss,
    })
  }

  if (area === 'forms') {
    return fillCalc(tCalc(copy.step4Stage4IssueScore, locale), {
      score: roundedScore,
      loss: roundedLoss,
    })
  }

  // visibility
  const seo = Math.round(input.seoScore ?? score)
  const ai = Math.round(input.aiScore ?? score)
  if (mobile?.seo != null || desktop?.seo != null) {
    return fillCalc(tCalc(copy.step4Stage1IssueMetrics, locale), {
      seoM: dash(mobile?.seo),
      seoD: dash(desktop?.seo),
      ai,
      loss: roundedLoss,
    })
  }
  return fillCalc(tCalc(copy.step4Stage1IssueScore, locale), {
    seo,
    ai,
    loss: roundedLoss,
  })
}
