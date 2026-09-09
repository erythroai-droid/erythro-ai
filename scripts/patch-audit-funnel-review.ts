/**
 * Patch live CMS copy for Pro Funnel review (audit landing + order plans).
 * Also upserts Funnel crawl method copy and the “Lead path, not only an inline form” principle.
 *
 * Usage: PAYLOAD_DISABLE_PUSH=1 pnpm exec tsx scripts/patch-audit-funnel-review.ts
 */
import 'dotenv/config'

process.env.PAYLOAD_DISABLE_PUSH = '1'

import { getPayload } from 'payload'
import config from '../src/payload.config'
import { auditPage } from '../src/lib/auditPage'
import { pingSiteRevalidate } from './import-project/lib/ping-revalidate'

/* eslint-disable @typescript-eslint/no-explicit-any */

const LOCALES = ['en', 'ru', 'he'] as const
type Locale = (typeof LOCALES)[number]

const FUNNEL_REVIEW_CATEGORY = auditPage.how.categories.find((c) => c.title.en === 'Funnel review')
const FUNNEL_CRAWL_CATEGORY = auditPage.how.categories.find((c) => c.title.en === 'Funnel crawl')
const FUNNEL_REVIEW_FEATURE = auditPage.pricing.plans
  .find((p) => p.id === 'pro')
  ?.features.find((f) => f.en.startsWith('Funnel review:'))
const LEAD_PATH_PRINCIPLE = auditPage.how.principles.find(
  (p) => p.title.en === 'Lead path, not only an inline form',
)
const PRO_PLAN = auditPage.pricing.plans.find((p) => p.id === 'pro')
const STEP3 = auditPage.how.steps.find((s) => s.label.en === 'Step 3')
const NEXT_STEPS = auditPage.how.principles.find((p) => p.title.en === 'Clear next steps')

function isFunnelReviewTitle(value: unknown): boolean {
  return typeof value === 'string' && /funnel review/i.test(value)
}

function isFunnelCrawlTitle(value: unknown): boolean {
  return typeof value === 'string' && /funnel crawl|обход воронки|סריקת משפך/i.test(value)
}

function isFunnelCrawlFeature(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return /funnel crawl|обход воронки|סריקת המשפך/i.test(value)
}

function isLeadPathPrinciple(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    /lead path, not only|путь к заявке, не только|דרך לליד, לא רק/i.test(value)
  )
}

async function patchAuditPage(payload: any): Promise<void> {
  if (
    !FUNNEL_REVIEW_CATEGORY ||
    !FUNNEL_CRAWL_CATEGORY ||
    !FUNNEL_REVIEW_FEATURE ||
    !LEAD_PATH_PRINCIPLE ||
    !PRO_PLAN ||
    !STEP3 ||
    !NEXT_STEPS
  ) {
    throw new Error('Static auditPage is missing Funnel review copy')
  }

  for (const loc of LOCALES) {
    const doc = await payload.findGlobal({
      slug: 'audit-page',
      locale: loc,
      depth: 0,
      overrideAccess: true,
    })

    const how = { ...(doc.how ?? {}) }
    const pricing = { ...(doc.pricing ?? {}) }

    const steps = Array.isArray(how.steps) ? [...how.steps] : []
    const step3Idx = steps.findIndex(
      (s: any) =>
        s?.label === STEP3.label[loc] ||
        s?.title === STEP3.title[loc] ||
        /step 3|шаг 3|שלב 3/i.test(String(s?.label ?? '')),
    )
    if (step3Idx >= 0) {
      steps[step3Idx] = { ...steps[step3Idx], body: STEP3.body[loc] }
    } else if (steps[2]) {
      steps[2] = { ...steps[2], body: STEP3.body[loc] }
    }
    how.steps = steps

    const principles = Array.isArray(how.principles) ? [...how.principles] : []
    const nextIdx = principles.findIndex(
      (p: any) =>
        p?.title === NEXT_STEPS.title[loc] ||
        /clear next steps|понятные следующие|צעדים הבאים ברורים/i.test(String(p?.title ?? '')),
    )
    if (nextIdx >= 0) {
      principles[nextIdx] = { ...principles[nextIdx], body: NEXT_STEPS.body[loc] }
    }
    const leadIdx = principles.findIndex((p: any) => isLeadPathPrinciple(p?.title))
    const leadRow = {
      title: LEAD_PATH_PRINCIPLE.title[loc],
      body: LEAD_PATH_PRINCIPLE.body[loc],
    }
    if (leadIdx >= 0) {
      principles[leadIdx] = { ...principles[leadIdx], ...leadRow }
    } else {
      const insertAt = nextIdx >= 0 ? nextIdx : principles.length
      principles.splice(insertAt, 0, leadRow)
    }
    how.principles = principles

    const categories = Array.isArray(how.categories) ? [...how.categories] : []
    const crawlCatIdx = categories.findIndex((c: any) => isFunnelCrawlTitle(c?.title))
    const crawlRow = {
      title: FUNNEL_CRAWL_CATEGORY.title[loc],
      body: FUNNEL_CRAWL_CATEGORY.body[loc],
    }
    if (crawlCatIdx >= 0) {
      categories[crawlCatIdx] = { ...categories[crawlCatIdx], ...crawlRow }
    }
    const catIdx = categories.findIndex((c: any) => isFunnelReviewTitle(c?.title))
    const categoryRow = {
      title: FUNNEL_REVIEW_CATEGORY.title[loc],
      body: FUNNEL_REVIEW_CATEGORY.body[loc],
    }
    if (catIdx >= 0) {
      categories[catIdx] = { ...categories[catIdx], ...categoryRow }
    } else {
      categories.push(categoryRow)
    }
    how.categories = categories

    pricing.intro = auditPage.pricing.intro[loc]

    const plans = Array.isArray(pricing.plans) ? [...pricing.plans] : []
    const proIdx = plans.findIndex((p: any) => p?.planId === 'pro')
    if (proIdx >= 0) {
      const pro = { ...plans[proIdx] }
      if (PRO_PLAN.description) pro.description = PRO_PLAN.description[loc]
      const features = Array.isArray(pro.features) ? [...pro.features] : []
      const existingIdx = features.findIndex((f: any) => isFunnelReviewTitle(f?.feature))
      const featureRow = { feature: FUNNEL_REVIEW_FEATURE[loc] }
      if (existingIdx >= 0) {
        features[existingIdx] = { ...features[existingIdx], ...featureRow }
      } else {
        const crawlIdx = features.findIndex((f: any) => isFunnelCrawlFeature(f?.feature))
        const insertAt = crawlIdx >= 0 ? crawlIdx + 1 : features.length
        features.splice(insertAt, 0, featureRow)
      }
      pro.features = features
      plans[proIdx] = pro
    }
    pricing.plans = plans

    await payload.updateGlobal({
      slug: 'audit-page',
      locale: loc,
      data: { how, pricing },
      depth: 0,
      overrideAccess: true,
    })
    console.log(`  ✓ audit-page/${loc}`)
  }
}

async function run() {
  if (!FUNNEL_REVIEW_CATEGORY || !FUNNEL_REVIEW_FEATURE) {
    throw new Error('Static auditPage is missing Funnel review copy')
  }

  const payload = await getPayload({ config })
  console.log('Patching Funnel review copy in CMS…')
  await patchAuditPage(payload)

  console.log('Busting site cache…')
  await pingSiteRevalidate(['/audit', '/order/audit-pro', '/order/audit-diagnostic', '/order/audit-free'])

  console.log('Done.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
