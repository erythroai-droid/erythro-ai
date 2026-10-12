/**
 * Sync static AUDIT_ORDER_PLANS → CMS solution-plans (kind=audit).
 * Does not mirror Pricing cards into the audit-page global (Plans are SoT).
 * Still refreshes Pricing section intro/agency copy on audit-page when needed.
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

async function patchAuditPageIntro(payload: any): Promise<number> {
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
    // Keep legacy plans array empty/ignored — cards come from solution-plans.
    if (Array.isArray(pricing.plans) && pricing.plans.length) {
      pricing.plans = []
      patched += 1
    }

    await payload.updateGlobal({
      slug: 'audit-page',
      locale: loc,
      data: { how, pricing },
      depth: 0,
      overrideAccess: true,
    })
    console.log(`  ✓ audit-page/${loc} intro (plans cleared)`)
  }

  return patched
}

async function patchOrderPlans(payload: any): Promise<number> {
  let patched = 0
  for (const plan of AUDIT_ORDER_PLANS) {
    const found = await payload.find({
      collection: 'solution-plans',
      where: { slug: { equals: plan.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    let id = found.docs[0]?.id as string | number | undefined

    const base = {
      kind: 'audit' as const,
      planId: plan.planId || plan.slug.replace(/^audit-/, ''),
      checkoutMode: plan.checkoutMode || (plan.planId === 'manual' ? 'contact' : 'order'),
      price: plan.card.price,
      currency: plan.card.currency || 'ILS',
      ...(plan.card.originalPrice
        ? { originalPrice: plan.card.originalPrice }
        : { originalPrice: null }),
      featured: Boolean(plan.card.featured) || plan.planId === 'diagnostic',
      ...(plan.ctaHref ? { ctaHref: plan.ctaHref } : {}),
    }

    if (!id) {
      const created = await payload.create({
        collection: 'solution-plans',
        locale: 'en',
        data: {
          ...base,
          slug: plan.slug,
          title: plan.card.title.en,
          subtitle: plan.subtitle?.en || '',
          cardName: plan.cardName?.en || null,
          cardPriceNote: plan.cardPriceNote?.en || null,
          ctaLabel: plan.ctaLabel?.en || null,
          features: plan.card.features.map((f) => ({
            ...(f.label ? { label: f.label.en } : {}),
            ...(f.value ? { value: f.value.en } : {}),
          })),
          ...(plan.includes ? { includes: lexicalFromText(plan.includes.en) } : {}),
        },
        depth: 0,
        overrideAccess: true,
      })
      id = created.id
      patched += 1
      console.log(`  + created ${plan.slug}`)
    } else {
      await payload.update({
        collection: 'solution-plans',
        id,
        data: base,
        depth: 0,
        overrideAccess: true,
      })
      patched += 1
    }

    for (const loc of LOCALES) {
      const current = await payload.findByID({
        collection: 'solution-plans',
        id,
        locale: loc,
        depth: 0,
        overrideAccess: true,
      })
      const data: Record<string, unknown> = {
        title: plan.card.title[loc] || plan.card.title.en,
        subtitle: plan.subtitle?.[loc] || plan.subtitle?.en || '',
        cardName: plan.cardName?.[loc] || plan.cardName?.en || null,
        cardPriceNote: plan.cardPriceNote?.[loc] || plan.cardPriceNote?.en || null,
        ctaLabel: plan.ctaLabel?.[loc] || plan.ctaLabel?.en || null,
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
        id,
        locale: loc,
        data,
        depth: 0,
        overrideAccess: true,
      })
      patched += 1
      console.log(`  ✓ solution-plans/${plan.slug}/${loc}`)
    }
  }
  return patched
}

async function run() {
  const payload = await getPayload({ config })
  console.log('Syncing AI Audit Plans from static AUDIT_ORDER_PLANS…')
  const plans = await patchOrderPlans(payload)
  const page = await patchAuditPageIntro(payload)

  console.log('Busting site cache…')
  await pingSiteRevalidate([
    '/audit',
    '/order/audit-free',
    '/order/audit-diagnostic',
    '/order/audit-pro',
  ])

  console.log(`Done. orderPlanTouches=${plans} auditPageTouches=${page}`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
