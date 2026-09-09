/**
 * Apply 2026-09-09 Translater localization audit fixes to live CMS copy.
 * Does not re-seed collections — only patches known bad strings.
 *
 * Usage: PAYLOAD_DISABLE_PUSH=1 pnpm exec tsx scripts/fix-localization-audit.ts
 */
import 'dotenv/config'

process.env.PAYLOAD_DISABLE_PUSH = '1'

import { getPayload } from 'payload'
import config from '../src/payload.config'
import { hero, caseStudies } from '../src/translations'
import { pingSiteRevalidate } from './import-project/lib/ping-revalidate'

/* eslint-disable @typescript-eslint/no-explicit-any */

const HE_PREMIUM = 'פרימיום'
const HE_FUTURE_ENG = 'הנדסת העתיד'
const HE_PIPELINES =
  'פייפליינים של רשתות נוירונים ומערכות AI'
const HE_CARD_DESCRIPTION = caseStudies.cardDescription.he
const HE_SUBTEXT_FIX = 'אוטומציה של תהליכים עסקיים באמצעות מערכות AI מתקדמות'
const HE_ENTERPRISE_TITLE = 'הנדסת מערכות ארגוניות'
const HE_ZERO_TRUST = 'גישת Zero Trust'
const HE_PORTFOLIO = 'תיק עבודות'

function fixCyrillicHomoglyphsInHebrew(s: string): string {
  if (!s) return s
  let out = s
    .replace(/פרי[мמ][иי]+יום/g, HE_PREMIUM)
    .replace(/יוק[рר]תיות/g, 'יוקרתיות')
    .replace(/הע[сס]קיים/g, 'העסקיים')

  const map: Record<string, string> = {
    р: 'ר',
    с: 'ס',
    м: 'מ',
    и: 'י',
    о: 'ו',
    е: 'ה',
    а: 'א',
  }
  out = out.replace(/[\u0400-\u04FF]/g, (ch, offset) => {
    const prev = out[offset - 1] || ''
    const next = out[offset + ch.length] || ''
    const he = /[\u0590-\u05FF]/
    if (he.test(prev) || he.test(next)) return map[ch] || ch
    return ch
  })
  return out
}

function patchHeCopy(s: string): { next: string; changed: boolean } {
  if (typeof s !== 'string' || !s) return { next: s, changed: false }
  let next = fixCyrillicHomoglyphsInHebrew(s)
  next = next
    .replace(/עתיד הנדסה/g, HE_FUTURE_ENG)
    .replace(/צינורות נתונים עצביים/g, HE_PIPELINES)
    .replace(/מאוטמטים תהליכים עסקיים באמצעות מערכות AI מתקדמות/g, HE_SUBTEXT_FIX)
    .replace(/הנדסת ארגונים/g, HE_ENTERPRISE_TITLE)
    .replace(/גישה ללא אמון/g, HE_ZERO_TRUST)
  if (next.trim() === 'תיק') next = HE_PORTFOLIO
  return { next, changed: next !== s }
}

function patchEnCopy(s: string): { next: string; changed: boolean } {
  if (typeof s !== 'string' || !s) return { next: s, changed: false }
  let next = s.replace(/Enterprise\s+Система(\s*\/\s*SaaS\s*\/\s*Web Apps?)?/gi, 'Enterprise Systems / SaaS / Web Apps')
  if (next.trim() === 'business automation') next = 'Business Automation'
  return { next, changed: next !== s }
}

function patchRuCopy(s: string): { next: string; changed: boolean } {
  if (typeof s !== 'string' || !s) return { next: s, changed: false }
  let next = s
    .replace(/цифровую идентичность/g, 'цифровую айдентику')
    .replace(/React, Spring Boot, Cloudflare/g, 'React, Java Spring Boot, Cloudflare')
    .replace(/Cloudflare WAF,\s+DDoS защита/g, 'Cloudflare WAF, DDoS-защита')
    .replace(/Zero Trust access/g, 'Zero Trust доступ')
    .replace(/работа с big data\./g, 'работа с big data')
    .replace(/  +/g, ' ')
    .replace(/ИИ-агенты\.$/g, 'ИИ-агенты')
  return { next, changed: next !== s }
}

function patchString(s: string, loc: 'en' | 'ru' | 'he'): { next: string; changed: boolean } {
  if (loc === 'he') return patchHeCopy(s)
  if (loc === 'en') return patchEnCopy(s)
  return patchRuCopy(s)
}

function patchLexical(value: any, loc: 'en' | 'ru' | 'he'): boolean {
  if (!value || typeof value !== 'object') return false
  let changed = false
  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return
    if (typeof node.text === 'string') {
      const r = patchString(node.text, loc)
      if (r.changed) {
        node.text = r.next
        changed = true
      }
    }
    if (Array.isArray(node.children)) node.children.forEach(walk)
  }
  walk(value.root ?? value)
  return changed
}

function walkPatch(value: any, loc: 'en' | 'ru' | 'he'): { value: any; changed: boolean } {
  if (typeof value === 'string') {
    const { next, changed } = patchString(value, loc)
    return { value: next, changed }
  }
  if (value && typeof value === 'object' && value.root && Array.isArray(value.root.children)) {
    const clone = structuredClone(value)
    const changed = patchLexical(clone, loc)
    return { value: clone, changed }
  }
  if (Array.isArray(value)) {
    let changed = false
    const next = value.map((item) => {
      const r = walkPatch(item, loc)
      if (r.changed) changed = true
      return r.value
    })
    return { value: next, changed }
  }
  if (value && typeof value === 'object') {
    let changed = false
    const next: Record<string, any> = Array.isArray(value) ? [] : { ...value }
    for (const [k, v] of Object.entries(value)) {
      if (k === 'id' || k === 'updatedAt' || k === 'createdAt' || k === 'globalType') {
        next[k] = v
        continue
      }
      const r = walkPatch(v, loc)
      next[k] = r.value
      if (r.changed) changed = true
    }
    return { value: next, changed }
  }
  return { value, changed: false }
}

function logField(label: string, value: unknown) {
  const text =
    typeof value === 'string'
      ? value
      : value && typeof value === 'object'
        ? JSON.stringify(value)
        : String(value)
  console.log(`  ${label}: ${text.slice(0, 240)}`)
}

async function run() {
  const payload = await getPayload({ config })
  const changes: string[] = []

  const dumpHero = async (tag: string) => {
    const all = await payload.findGlobal({ slug: 'hero', locale: 'all', depth: 0, overrideAccess: true })
    console.log(`\n[${tag}] hero`)
    logField('mainHeading', all.mainHeading)
    logField('subtext', all.subtext)
    logField(
      'words',
      (all.words ?? []).map((w: any) => ({ word: w.word, outline: w.outline })),
    )
  }

  await dumpHero('before')

  // Hero: sync motion lines to code fallbacks (already aligned EN/RU/HE in repo).
  for (const loc of ['en', 'ru', 'he'] as const) {
    const doc = await payload.findGlobal({ slug: 'hero', locale: loc, depth: 0, overrideAccess: true })
    const words = (doc.words ?? []).map((row: any, i: number) => {
      const phrase = hero.motionHeadings[i]
      return {
        ...(row.id != null ? { id: row.id } : {}),
        word: phrase?.text[loc] ?? row.word,
        outline: phrase?.outline[loc] ?? row.outline,
      }
    })
    const patched = walkPatch(
      {
        mainHeading: loc === 'he' ? HE_FUTURE_ENG : doc.mainHeading,
        subtext: doc.subtext,
        words,
      },
      loc,
    )
    if (loc === 'he' && typeof patched.value.mainHeading === 'string') {
      patched.value.mainHeading = HE_FUTURE_ENG
    }
    await payload.updateGlobal({
      slug: 'hero',
      locale: loc,
      data: patched.value,
      depth: 0,
      overrideAccess: true,
    })
    changes.push(`hero/${loc}`)
  }

  await dumpHero('after')

  // Header nav: תיק → תיק עבודות
  {
    const all = await payload.findGlobal({ slug: 'header', locale: 'all', depth: 0, overrideAccess: true })
    console.log('\n[before] header.navItems', JSON.stringify(all.navItems?.map((n: any) => n.label)))
    const he = await payload.findGlobal({ slug: 'header', locale: 'he', depth: 0, overrideAccess: true })
    const patched = walkPatch({ navItems: he.navItems }, 'he')
    if (patched.changed) {
      await payload.updateGlobal({
        slug: 'header',
        locale: 'he',
        data: { navItems: patched.value.navItems },
        depth: 0,
        overrideAccess: true,
      })
      changes.push('header/he')
    }
  }

  // Case studies card + subtitle
  {
    const all = await payload.findGlobal({
      slug: 'case-studies',
      locale: 'all',
      depth: 0,
      overrideAccess: true,
    })
    console.log('\n[before] case-studies')
    logField('preTitle', all.preTitle)
    logField('subtitle', all.subtitle)
    logField('cardDescription', all.cardDescription)

    await payload.updateGlobal({
      slug: 'case-studies',
      locale: 'he',
      data: {
        cardDescription: HE_CARD_DESCRIPTION,
        ...(typeof all.preTitle?.he === 'string' && all.preTitle.he.trim() === 'תיק'
          ? { preTitle: HE_PORTFOLIO }
          : {}),
      },
      depth: 0,
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: 'case-studies',
      locale: 'ru',
      data: { subtitle: caseStudies.subtitle.ru },
      depth: 0,
      overrideAccess: true,
    })
    changes.push('case-studies/he', 'case-studies/ru')
  }

  // Solution plans
  {
    const found = await payload.find({
      collection: 'solution-plans',
      locale: 'all',
      depth: 0,
      limit: 50,
      overrideAccess: true,
    })
    for (const doc of found.docs as any[]) {
      console.log(`\n[plan] ${doc.slug} title=`, JSON.stringify(doc.title))
      for (const loc of ['en', 'ru', 'he'] as const) {
        const row = await payload.findByID({
          collection: 'solution-plans',
          id: doc.id,
          locale: loc,
          depth: 0,
          overrideAccess: true,
        })
        const patched = walkPatch(
          {
            title: row.title,
            features: row.features,
            subtitle: row.subtitle,
            promo: row.promo,
            seo: row.seo,
          },
          loc,
        )
        if (!patched.changed) continue
        await payload.update({
          collection: 'solution-plans',
          id: doc.id,
          locale: loc,
          data: patched.value,
          depth: 0,
          overrideAccess: true,
        })
        changes.push(`solution-plans/${doc.slug}/${loc}`)
      }
    }
  }

  // Services (home cards + /services/* SEO)
  {
    const found = await payload.find({
      collection: 'services',
      locale: 'all',
      depth: 0,
      limit: 50,
      overrideAccess: true,
    })
    for (const doc of found.docs as any[]) {
      console.log(`\n[service] ${doc.slug} title=`, JSON.stringify(doc.title))
      logField('seo.description', doc.seo?.description)
      for (const loc of ['en', 'ru', 'he'] as const) {
        const row = await payload.findByID({
          collection: 'services',
          id: doc.id,
          locale: loc,
          depth: 0,
          overrideAccess: true,
        })
        const patched = walkPatch(
          {
            title: row.title,
            features: row.features,
            offerings: row.offerings,
            seo: row.seo,
            summary: row.summary,
            description: row.description,
          },
          loc,
        )
        if (!patched.changed) continue
        const data: Record<string, any> = {}
        for (const [k, v] of Object.entries(patched.value)) {
          if (v !== undefined) data[k] = v
        }
        await payload.update({
          collection: 'services',
          id: doc.id,
          locale: loc,
          data,
          depth: 0,
          overrideAccess: true,
        })
        changes.push(`services/${doc.slug}/${loc}`)
      }
    }
  }

  console.log('\nChanged:', changes.length ? changes.join(', ') : '(none)')

  console.log('\nBusting site cache…')
  await pingSiteRevalidate([
    '/',
    '/he',
    '/ru',
    '/en',
    '/portfolio',
    '/services/development',
    '/he/services/development',
    '/order/business-automation',
    '/order/enterprise-custom',
  ])

  console.log('Done.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
