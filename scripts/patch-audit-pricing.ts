/**
 * Fix audit pricing CTAs (leading slash) and stale RU/HE tariff copy
 * on the `audit-page` global + audit `solution-plans`.
 *
 * Usage: PAYLOAD_DISABLE_PUSH=1 pnpm db:fix-audit-pricing
 */
import 'dotenv/config'

process.env.PAYLOAD_DISABLE_PUSH = '1'

import { getPayload } from 'payload'
import config from '../src/payload.config'
import { auditPage } from '../src/lib/auditPage'
import { AUDIT_ORDER_PLANS } from '../src/lib/orderPlans'
import { lexicalFromText } from '../src/lib/lexical'
import { pingSiteRevalidate } from './import-project/lib/ping-revalidate'

/* eslint-disable @typescript-eslint/no-explicit-any */

const LOCALES = ['en', 'ru', 'he'] as const
type Locale = (typeof LOCALES)[number]

const NEXT_STEPS = auditPage.how.principles.find((p) => p.title.en === 'Clear next steps')

function applyIds(target: any, source: any): void {
  if (!target || !source) return
  if (Array.isArray(target) && Array.isArray(source)) {
    for (let i = 0; i < target.length; i++) {
      if (source[i] && target[i] && typeof target[i] === 'object') {
        if (source[i].id != null) target[i].id = source[i].id
        applyIds(target[i], source[i])
      }
    }
  } else if (typeof target === 'object' && typeof source === 'object') {
    for (const k of Object.keys(target)) {
      if (k in source) applyIds(target[k], source[k])
    }
  }
}

async function patchAuditPage(payload: any): Promise<number> {
  if (!NEXT_STEPS) throw new Error('Static auditPage is missing Clear next steps')
  let patched = 0

  for (const loc of LOCALES) {
    const doc = await payload.findGlobal({
      slug: 'audit-page',
      locale: loc,
      depth: 0,
      overrideAccess: true,
    })

    const how = { ...(doc.how ?? {}) }
    const pricing = { ...(doc.pricing ?? {}) }

    const principles = Array.isArray(how.principles) ? [...how.principles] : []
    const nextIdx = principles.findIndex(
      (p: any) =>
        p?.title === NEXT_STEPS.title[loc] ||
        /clear next steps|понятные следующие|צעדים הבאים ברורים/i.test(String(p?.title ?? '')),
    )
    if (nextIdx >= 0 && principles[nextIdx]?.body !== NEXT_STEPS.body[loc]) {
      principles[nextIdx] = { ...principles[nextIdx], body: NEXT_STEPS.body[loc] }
      patched += 1
    }
    how.principles = principles

    pricing.intro = auditPage.pricing.intro[loc]
    pricing.agency = auditPage.pricing.agency[loc]
    pricing.agencyCta = auditPage.pricing.agencyCta[loc]

    const cmsPlans: any[] = Array.isArray(pricing.plans) ? [...pricing.plans] : []
    pricing.plans = cmsPlans.map((cms) => {
      const id = typeof cms?.planId === 'string' ? cms.planId : ''
      const fb = auditPage.pricing.plans.find((p) => p.id === id)
      if (!fb) return cms
      patched += 1
      const cmsFeatures = Array.isArray(cms.features) ? cms.features : []
      return {
        ...cms,
        name: fb.name[loc],
        price: fb.price[loc],
        ...('priceCompare' in fb && fb.priceCompare ? { priceCompare: fb.priceCompare[loc] } : {}),
        ...('priceNote' in fb && fb.priceNote ? { priceNote: fb.priceNote[loc] } : {}),
        ...('description' in fb && fb.description ? { description: fb.description[loc] } : {}),
        cta: fb.cta[loc],
        ctaHref: fb.ctaHref,
        features: fb.features.map((feature, i) => ({
          ...(cmsFeatures[i] ?? {}),
          feature: feature[loc],
        })),
      }
    })

    await payload.updateGlobal({
      slug: 'audit-page',
      locale: loc,
      data: { how, pricing },
      depth: 0,
      overrideAccess: true,
    })
    console.log(`  ✓ audit-page/${loc} pricing + next-steps`)
  }

  return patched
}

async function patchOrderPlans(payload: any): Promise<number> {
  let patched = 0
  for (let i = 0; i < AUDIT_ORDER_PLANS.length; i++) {
    const plan = AUDIT_ORDER_PLANS[i]
    const found = await payload.find({
      collection: 'solution-plans',
      where: { slug: { equals: plan.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const existing = found.docs[0]
    if (!existing) {
      console.log(`  · skip missing plan ${plan.slug}`)
      continue
    }

    for (const loc of LOCALES) {
      const current = await payload.findByID({
        collection: 'solution-plans',
        id: existing.id,
        locale: loc,
        depth: 0,
        overrideAccess: true,
      })
      const data: Record<string, unknown> = {
        features: plan.card.features.map((f) => ({
          ...(f.label ? { label: f.label[loc] || f.label.en } : {}),
          ...(f.value ? { value: f.value[loc] || f.value.en } : {}),
        })),
        ...(plan.includes
          ? { includes: lexicalFromText(plan.includes[loc] || plan.includes.en) }
          : {}),
      }
      applyIds(data, current)
      await payload.update({
        collection: 'solution-plans',
        id: existing.id,
        locale: loc,
        data,
        depth: 0,
        overrideAccess: true,
      })
      patched += 1
      console.log(`  ✓ solution-plans/${plan.slug}/${loc} features`)
    }
  }
  return patched
}

async function run() {
  const payload = await getPayload({ config })
  console.log('Patching audit pricing CTAs and tariff copy…')
  const page = await patchAuditPage(payload)
  const plans = await patchOrderPlans(payload)

  console.log('Busting site cache…')
  await pingSiteRevalidate([
    '/audit',
    '/order/audit-free',
    '/order/audit-diagnostic',
    '/order/audit-pro',
  ])

  console.log(`Done. auditPageTouches=${page} orderPlanLocales=${plans}`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
