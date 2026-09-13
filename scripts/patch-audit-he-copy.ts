/**
 * Replace stale machine-translated Hebrew on the audit-page CMS global
 * (credit-card→מפה, Romanian/Dutch, להסיר, informal שלח, numeric 01/02/03 labels).
 * Also trims trailing spaces on service offering names.
 *
 * Usage: PAYLOAD_DISABLE_PUSH=1 pnpm db:fix-audit-he-copy
 */
import 'dotenv/config'

process.env.PAYLOAD_DISABLE_PUSH = '1'

import { getPayload } from 'payload'
import config from '../src/payload.config'
import { auditPage, isStaleAuditHebrew } from '../src/lib/auditPage'
import { pingSiteRevalidate } from './import-project/lib/ping-revalidate'

/* eslint-disable @typescript-eslint/no-explicit-any */

async function patchAuditPageHe(payload: any): Promise<number> {
  const doc = await payload.findGlobal({
    slug: 'audit-page',
    locale: 'he',
    depth: 0,
    overrideAccess: true,
  })

  const how = { ...(doc.how ?? {}) }
  const cmsSteps: any[] = Array.isArray(how.steps) ? how.steps : []
  let dirty = 0

  how.steps = auditPage.how.steps.map((step, i) => {
    const cms = cmsSteps[i] ?? {}
    for (const key of ['label', 'title', 'body'] as const) {
      if (typeof cms[key] === 'string' && isStaleAuditHebrew(cms[key])) dirty += 1
    }
    return {
      ...cms,
      label: step.label.he,
      title: step.title.he,
      body: step.body.he,
    }
  })

  await payload.updateGlobal({
    slug: 'audit-page',
    locale: 'he',
    data: { how },
    depth: 0,
    overrideAccess: true,
  })

  console.log(`  ✓ audit-page/he steps synced from code (${dirty} stale HE fields replaced)`)
  return dirty
}

async function trimServiceOfferingNames(payload: any): Promise<number> {
  const found = await payload.find({
    collection: 'services',
    locale: 'all',
    depth: 0,
    limit: 50,
    overrideAccess: true,
  })

  let patched = 0
  for (const doc of found.docs as any[]) {
    for (const loc of ['en', 'ru', 'he'] as const) {
      const row = await payload.findByID({
        collection: 'services',
        id: doc.id,
        locale: loc,
        depth: 0,
        overrideAccess: true,
      })
      const offerings = Array.isArray(row.offerings) ? row.offerings : []
      let changed = false
      const next = offerings.map((offering: any) => {
        if (typeof offering?.name !== 'string') return offering
        const trimmed = offering.name.trim()
        if (trimmed === offering.name) return offering
        changed = true
        return { ...offering, name: trimmed }
      })
      if (!changed) continue
      await payload.update({
        collection: 'services',
        id: doc.id,
        locale: loc,
        data: { offerings: next },
        depth: 0,
        overrideAccess: true,
      })
      patched += 1
      console.log(`  ✓ services/${doc.slug || doc.id}/${loc} offering names trimmed`)
    }
  }
  return patched
}

async function run() {
  const payload = await getPayload({ config })
  console.log('Patching stale Hebrew audit copy + trailing offering spaces…')
  const dirty = await patchAuditPageHe(payload)
  const trimmed = await trimServiceOfferingNames(payload)

  console.log('Busting site cache…')
  await pingSiteRevalidate([
    '/audit',
    '/services',
    '/services/landing',
    '/services/corporate',
    '/services/management',
    '/order/audit-pro',
    '/order/audit-diagnostic',
    '/order/audit-free',
  ])

  console.log(`Done. staleHe=${dirty} offeringTrims=${trimmed}`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
