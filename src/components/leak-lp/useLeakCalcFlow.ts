'use client'

import { useEffect, useMemo, useState } from 'react'
import type { AuditLpSubmitted } from '@/components/audit/AuditLpForm'
import type { CalcProgress } from '@/components/audit/CalcReport'
import {
  AUDIT_PROGRESS_EXPECTED_MS,
  AUDIT_REPORT_POLL_MS,
  buildAuditReportApiPath,
  estimateAuditProgressPercent,
  estimateAuditRemainingMinutes,
  nextAuditPollDelayMs,
  type AuditReportPublicPayload,
} from '@/lib/auditReport'
import { pillarsFromOverall, type AuditPillars } from '@/lib/revenueLeak'

export type LeakStage =
  | { name: 'form' }
  | { name: 'opening'; submitted: AuditLpSubmitted }
  | { name: 'waiting'; submitted: AuditLpSubmitted; startedAt: number }
  | { name: 'ready'; submitted: AuditLpSubmitted; report: AuditReportPublicPayload }
  | { name: 'failed'; submitted: AuditLpSubmitted }

function startedAtFromReport(json: AuditReportPublicPayload): number {
  for (const raw of [json.createdAt, json.updatedAt]) {
    if (typeof raw !== 'string' || !raw.trim()) continue
    const ms = Date.parse(raw)
    if (Number.isFinite(ms) && ms > 0) return ms
  }
  return Date.now()
}

/**
 * Funnel state for the premium leak LP. Same contract as `AuditCalcFlow`:
 * deep link `?report=&k=&rev=&clients=`, polling, dev `?preview=step2|waiting|ready|failed`.
 */
export function useLeakCalcFlow() {
  const [stage, setStage] = useState<LeakStage>({ name: 'form' })
  const [now, setNow] = useState(() => Date.now())
  const [formStep, setFormStep] = useState<1 | 2>(1)
  const [skipToPercent, setSkipToPercent] = useState(true)
  const [revenue, setRevenue] = useState<number | null>(null)
  const [clients, setClients] = useState<number | null>(null)
  const [resumeSearch, setResumeSearch] = useState('')

  const waiting = stage.name === 'waiting' ? stage : null
  const opening = stage.name === 'opening' ? stage : null
  const pollTarget = waiting ?? opening

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const r = Number(q.get('rev'))
    const c = Number(q.get('clients'))
    if (r > 0) setRevenue(r)
    if (c > 0) setClients(c)

    const reportIdRaw = q.get('report')
    const accessKey = q.get('k')?.trim() || null
    const reportId = reportIdRaw && /^\d+$/.test(reportIdRaw) ? Number(reportIdRaw) : null
    if (reportId && accessKey) {
      setResumeSearch(window.location.search || '')
      setStage({
        name: 'opening',
        submitted: {
          id: reportId,
          accessKey,
          website: q.get('site') || q.get('website') || '',
          reportHref: null,
        },
      })
      return
    }

    if (process.env.NODE_ENV === 'production') return
    const preview = q.get('preview')
    if (!preview) return
    const submitted: AuditLpSubmitted = {
      id: 0,
      accessKey: null,
      website: q.get('site') || 'https://fast-taxi.co.il',
      reportHref: null,
    }
    if (preview === 'waiting') {
      setStage({ name: 'waiting', submitted: { ...submitted, accessKey: 'preview' }, startedAt: Date.now() - 120_000 })
    } else if (preview === 'failed') {
      setStage({ name: 'failed', submitted })
    } else if (preview === 'step2') {
      setFormStep(2)
    } else if (preview === 'ready') {
      setStage({
        name: 'ready',
        submitted,
        report: {
          id: 0,
          orderId: 'AUD-0',
          status: 'report_sent',
          auditScore: 48,
          pillars: { speed: 35, leads: 72, seo: 62, security: 45, ai: 85 },
          pagespeed: null,
          reportUrl: null,
          htmlPreview: null,
          readyHtmlUrl: null,
          website: submitted.website,
          updatedAt: null,
          createdAt: null,
        } as AuditReportPublicPayload,
      })
    }
  }, [])

  useEffect(() => {
    if (!pollTarget) return
    const { submitted } = pollTarget
    const fromDeepLink = pollTarget.name === 'opening'
    if (submitted.accessKey === 'preview') return
    if (!submitted.accessKey) {
      setStage({ name: 'failed', submitted })
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const tick = async () => {
      let delay = AUDIT_REPORT_POLL_MS
      try {
        const res = await fetch(buildAuditReportApiPath(submitted.id, submitted.accessKey!), {
          cache: 'no-store',
        })
        if (cancelled) return
        if (res.status === 404 || res.status === 400) {
          setStage({ name: 'failed', submitted })
          return
        }
        delay = nextAuditPollDelayMs(res.status, res.headers.get('Retry-After'))
        if (res.ok) {
          const json = (await res.json()) as AuditReportPublicPayload
          if (cancelled) return
          const nextSubmitted = { ...submitted, website: submitted.website || json.website || '' }
          if (json.status === 'report_sent') {
            setStage({ name: 'ready', submitted: nextSubmitted, report: json })
            return
          }
          if (json.status === 'failed') {
            setStage({ name: 'failed', submitted: nextSubmitted })
            return
          }
          if (fromDeepLink) {
            setStage({ name: 'waiting', submitted: nextSubmitted, startedAt: startedAtFromReport(json) })
            return
          }
        }
      } catch {
        // network glitch; retry
      }
      if (!cancelled) timer = setTimeout(tick, delay)
    }

    void tick()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [pollTarget])

  useEffect(() => {
    if (!waiting) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [waiting])

  const report = stage.name === 'ready' ? stage.report : null

  const pillars: AuditPillars | null = useMemo(() => {
    if (!report) return null
    if (report.pillars) return report.pillars
    if (typeof report.auditScore === 'number') return pillarsFromOverall(report.auditScore)
    if (report.status === 'report_sent') return pillarsFromOverall(50)
    return null
  }, [report])

  const progress: CalcProgress = useMemo(() => {
    if (!waiting) return { percent: 0, remaining: 0, overdue: false }
    return {
      percent: estimateAuditProgressPercent({ status: 'in_progress', createdAtMs: waiting.startedAt, nowMs: now }),
      remaining: estimateAuditRemainingMinutes(waiting.startedAt, now),
      overdue: now - waiting.startedAt > AUDIT_PROGRESS_EXPECTED_MS * 2,
    }
  }, [waiting, now])

  return {
    stage,
    setStage,
    setNow,
    formStep,
    setFormStep,
    skipToPercent,
    setSkipToPercent,
    revenue,
    setRevenue,
    clients,
    setClients,
    resumeSearch,
    report,
    pillars,
    progress,
  }
}
