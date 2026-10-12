/**
 * One-shot: upsert AI Audit Plans from AUDIT_ORDER_PLANS (incl. audit-manual),
 * set planId / checkoutMode / cardName / cardPriceNote / ctaLabel / originalPrice / featured.
 * Does not write Pricing cards into the audit-page global.
 *
 * Usage: PAYLOAD_DISABLE_PUSH=1 pnpm db:migrate-audit-plans-unify
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

function basePlanData(plan: (typeof AUDIT_ORDER_PLANS)[number]) {
  return {
    kind: 'audit' as const,
    slug: plan.slug,
    planId: plan.planId || plan.slug.replace(/^audit-/, ''),
    checkoutMode: plan.checkoutMode || (plan.planId === 'manual' ? 'contact' : 'order'),
    price: plan.card.price,
    currency: plan.card.currency || 'ILS',
    ...(plan.card.originalPrice ? { originalPrice: plan.card.originalPrice } : { originalPrice: null }),
    priceNote: Boolean(plan.card.priceNote),
    featured: Boolean(plan.card.featured) || plan.planId === 'diagnostic',
    ...(plan.ctaHref ? { ctaHref: plan.ctaHref } : {}),
    order:
      plan.planId === 'free'
        ? 10
        : plan.planId === 'diagnostic'
          ? 20
          : plan.planId === 'pro'
            ? 30
            : plan.planId === 'manual'
              ? 40
              : 50,
  }
}

function localePlanData(plan: (typeof AUDIT_ORDER_PLANS)[number], loc: Locale) {
  return {
    title: plan.card.title[loc] || plan.card.title.en,
    subtitle: plan.subtitle?.[loc] || plan.subtitle?.en || '',
    ...(plan.cardName
      ? { cardName: plan.cardName[loc] || plan.cardName.en }
      : { cardName: null }),
    ...(plan.cardPriceNote
      ? { cardPriceNote: plan.cardPriceNote[loc] || plan.cardPriceNote.en }
      : { cardPriceNote: null }),
    ...(plan.ctaLabel
      ? { ctaLabel: plan.ctaLabel[loc] || plan.ctaLabel.en }
      : { ctaLabel: null }),
    ...(plan.promo ? { promo: plan.promo[loc] || plan.promo.en } : {}),
    features: plan.card.features.map((f) => ({
      ...(f.label ? { label: f.label[loc] || f.label.en } : {}),
      ...(f.value ? { value: f.value[loc] || f.value.en } : {}),
    })),
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

async function upsertAuditPlans(payload: any): Promise<number> {
  let touches = 0
  for (const plan of AUDIT_ORDER_PLANS) {
    const found = await payload.find({
      collection: 'solution-plans',
      where: { slug: { equals: plan.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    let id = found.docs[0]?.id as string | number | undefined

    if (!id) {
      const created = await payload.create({
        collection: 'solution-plans',
        locale: 'en',
        data: {
          ...basePlanData(plan),
          ...localePlanData(plan, 'en'),
        },
        depth: 0,
        overrideAccess: true,
      })
      id = created.id
      touches += 1
      console.log(`  + created ${plan.slug}`)
    } else {
      // Preserve array row ids (features) so Payload does not churn child rows.
      const currentEn = await payload.findByID({
        collection: 'solution-plans',
        id,
        locale: 'en',
        depth: 0,
        overrideAccess: true,
      })
      const enData = {
        ...basePlanData(plan),
        ...localePlanData(plan, 'en'),
      }
      applyIds(enData, currentEn)
      await payload.update({
        collection: 'solution-plans',
        id,
        locale: 'en',
        data: enData,
        depth: 0,
        overrideAccess: true,
      })
      touches += 1
      console.log(`  ✓ base ${plan.slug}`)
    }

    for (const loc of LOCALES) {
      if (loc === 'en') continue
      const current = await payload.findByID({
        collection: 'solution-plans',
        id,
        locale: loc,
        depth: 0,
        overrideAccess: true,
      })
      const data = localePlanData(plan, loc)
      applyIds(data, current)
      await payload.update({
        collection: 'solution-plans',
        id,
        locale: loc,
        data,
        depth: 0,
        overrideAccess: true,
      })
      touches += 1
      console.log(`  ✓ ${plan.slug}/${loc}`)
    }
  }
  return touches
}

async function run() {
  const payload = await getPayload({ config })
  console.log('Migrating AI Audit plans → solution-plans (single source)…')
  const touches = await upsertAuditPlans(payload)

  console.log('Busting site cache…')
  await pingSiteRevalidate([
    '/audit',
    '/order/audit-free',
    '/order/audit-diagnostic',
    '/order/audit-pro',
  ])

  console.log(`Done. touches=${touches}`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
