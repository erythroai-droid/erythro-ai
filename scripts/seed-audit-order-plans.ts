/**
 * Upsert AI Audit order plans (audit-free / audit-diagnostic / audit-pro)
 * into `solution-plans` without touching Solution plans.
 *
 * Usage: pnpm exec tsx scripts/seed-audit-order-plans.ts
 */
import 'dotenv/config'

process.env.PAYLOAD_DISABLE_PUSH = '1'

import { getPayload } from 'payload'
import config from '../src/payload.config'
import { AUDIT_ORDER_PLANS } from '../src/lib/orderPlans'
import { lexicalFromText } from '../src/lib/lexical'
import { pingSiteRevalidate } from './import-project/lib/ping-revalidate'

/* eslint-disable @typescript-eslint/no-explicit-any */

const LOCALES = ['en', 'ru', 'he'] as const
type Locale = (typeof LOCALES)[number]

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

function rowForLocale(plan: (typeof AUDIT_ORDER_PLANS)[number], loc: Locale, index: number) {
  return {
    title: plan.card.title[loc] || plan.card.title.en,
    kind: 'audit' as const,
    slug: plan.slug,
    price: plan.card.price,
    currency: plan.card.currency || 'ILS',
    order: 100 + index,
    priceNote: !!plan.card.priceNote,
    featured: !!plan.card.featured,
    ...(plan.card.originalPrice ? { originalPrice: plan.card.originalPrice } : {}),
    features: plan.card.features.map((f) => ({
      ...(f.label ? { label: f.label[loc] || f.label.en } : {}),
      ...(f.value ? { value: f.value[loc] || f.value.en } : {}),
    })),
    ...(plan.subtitle ? { subtitle: plan.subtitle[loc] || plan.subtitle.en } : {}),
    promo: plan.promo ? plan.promo[loc] || plan.promo.en : '',
    ...(plan.includes
      ? { includes: lexicalFromText(plan.includes[loc] || plan.includes.en) }
      : {}),
    ...(plan.seoTitle || plan.seoDescription
      ? {
          seo: {
            ...(plan.seoTitle ? { title: plan.seoTitle[loc] || plan.seoTitle.en } : {}),
            ...(plan.seoDescription
              ? { description: plan.seoDescription[loc] || plan.seoDescription.en }
              : {}),
          },
        }
      : {}),
  }
}

async function run() {
  const payload = await getPayload({ config })
  console.log('Upserting AI Audit order plans…')

  for (let i = 0; i < AUDIT_ORDER_PLANS.length; i++) {
    const plan = AUDIT_ORDER_PLANS[i]
    const found = await payload.find({
      collection: 'solution-plans',
      where: { slug: { equals: plan.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const enData = rowForLocale(plan, 'en', i)
    let doc: any

    if (found.docs[0]) {
      doc = await payload.update({
        collection: 'solution-plans',
        id: found.docs[0].id,
        locale: 'en',
        data: enData,
        depth: 0,
        overrideAccess: true,
      })
      console.log(`  ↑ updated en: ${plan.slug} (#${doc.id})`)
    } else {
      doc = await payload.create({
        collection: 'solution-plans',
        locale: 'en',
        data: enData,
        depth: 0,
        overrideAccess: true,
      })
      console.log(`  + created en: ${plan.slug} (#${doc.id})`)
    }

    for (const loc of ['ru', 'he'] as const) {
      const data = rowForLocale(plan, loc, i)
      applyIds(data, doc)
      doc = await payload.update({
        collection: 'solution-plans',
        id: doc.id,
        locale: loc,
        data,
        depth: 0,
        overrideAccess: true,
      })
      console.log(`  ↑ updated ${loc}: ${plan.slug}`)
    }
  }

  console.log('Busting site cache…')
  await pingSiteRevalidate([
    '/order/audit-free',
    '/order/audit-diagnostic',
    '/order/audit-pro',
    '/audit',
  ])

  console.log('Done.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
