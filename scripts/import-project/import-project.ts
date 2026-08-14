/**
 * Upsert a portfolio project from a local import folder into Payload.
 *
 * Workflow:
 *   1. Create the project in /admin and set Slug (required fields can be stubs).
 *   2. Fill content/imports/<slug>/brief.yaml + drop images next to it.
 *   3. Pull prod env and run this script — it composes copy from the case-study
 *      template keys and updates the existing document.
 *
 * Usage:
 *   npx vercel env pull .env.production.local --environment=production
 *   pnpm import:project -- content/imports/<slug>
 *   pnpm import:project -- content/imports/<slug> --dry-run
 *   pnpm import:project -- content/imports/<slug> --create
 *   pnpm import:project -- content/imports/<slug> --skip-media
 */
import './lib/load-env'
import fs from 'node:fs'
import path from 'node:path'
import {
  composeProject,
  loadBrief,
  LOCALES,
  MIME_BY_EXT,
  resolveImportDir,
  type ComposedProject,
  type Locale,
} from './lib/import-project-brief'
import { pingSiteRevalidate } from './lib/ping-revalidate'

/* eslint-disable @typescript-eslint/no-explicit-any */

type Flags = {
  dryRun: boolean
  create: boolean
  skipMedia: boolean
}

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

function parseArgs(argv: string[]): { dir: string; flags: Flags } {
  const flags: Flags = { dryRun: false, create: false, skipMedia: false }
  const positional: string[] = []
  for (const arg of argv) {
    if (arg === '--dry-run') flags.dryRun = true
    else if (arg === '--create') flags.create = true
    else if (arg === '--skip-media') flags.skipMedia = true
    else if (arg.startsWith('--env-file=')) continue
    else if (arg.startsWith('--')) throw new Error(`Unknown flag: ${arg}`)
    else positional.push(arg)
  }
  if (positional.length !== 1) {
    throw new Error(
      'Usage: pnpm import:project -- content/imports/<slug> [--dry-run] [--create] [--skip-media] [--env-file=.env.production.local]',
    )
  }
  return { dir: positional[0]!, flags }
}

function dbHost(url: string | undefined): string {
  if (!url) return '(missing DATABASE_URL)'
  try {
    return new URL(url).host
  } catch {
    return '(unparseable DATABASE_URL)'
  }
}

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL?.replace(/\/$/, '') ||
    'https://erythro.ai'
  )
}

function resolveMediaPath(dir: string, rel: string | undefined): string | undefined {
  if (!rel) return undefined
  const abs = path.isAbsolute(rel) ? rel : path.join(dir, rel)
  if (!fs.existsSync(abs)) {
    throw new Error(`Media file not found: ${abs}`)
  }
  return abs
}

async function uploadFile(payload: any, filePath: string, alt: string): Promise<number> {
  const buf = fs.readFileSync(filePath)
  const ext = path.extname(filePath).toLowerCase()
  const mime = MIME_BY_EXT[ext]
  if (!mime) throw new Error(`Unsupported media type: ${ext} (${filePath})`)
  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    file: {
      data: buf,
      mimetype: mime,
      name: path.basename(filePath),
      size: buf.length,
    },
    depth: 0,
    overrideAccess: true,
  })
  const id = doc?.id
  if (typeof id !== 'number') throw new Error(`Media upload failed for ${filePath}`)
  console.log(`  ✓ media #${id} ${path.basename(filePath)}`)
  return id
}

async function resolveCategoryId(payload: any, value: string | undefined): Promise<number | undefined> {
  if (!value) return undefined
  const found = await payload.find({
    collection: 'portfolio-categories',
    where: { value: { equals: value } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const id = found.docs[0]?.id
  if (typeof id !== 'number') {
    throw new Error(
      `Category "${value}" not found. Create it in Pages → Portfolio Categories (field \`value\`).`,
    )
  }
  return id
}

function localeData(
  project: ComposedProject,
  loc: Locale,
  extra: Record<string, unknown>,
  toLexical: (text: string) => unknown,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    slug: project.slug,
    title: project.title[loc],
    description: project.description[loc],
    summary: toLexical(project.summary[loc] || ''),
    stack: project.stack.map((item) => ({ item })),
    tags: project.tags.map((tag) => ({ tag })),
    body: project.body.map((section) => ({
      heading: section.heading[loc] || section.heading.en,
      paragraphs: section.paragraphs.map((para) => ({
        text: toLexical(para[loc] || para.en || ''),
      })),
    })),
    ...extra,
  }
  if (project.subtitle[loc] || project.subtitle.en) {
    data.subtitle = toLexical(project.subtitle[loc] || project.subtitle.en || '')
  }
  if (project.date) data.date = project.date
  if (project.client) data.client = project.client
  if (project.link) data.link = project.link
  if (typeof project.order === 'number') data.order = project.order
  if (project.seoTitle[loc] || project.seoDescription[loc]) {
    data.seo = {
      ...(project.seoTitle[loc] ? { title: project.seoTitle[loc] } : {}),
      ...(project.seoDescription[loc] ? { description: project.seoDescription[loc] } : {}),
    }
  }
  return data
}

function printPreview(project: ComposedProject, briefDir: string): void {
  console.log(`\nSlug:        ${project.slug}`)
  console.log(`Category:    ${project.category || '(keep existing)'}`)
  console.log(`Client:      ${project.client || '—'}`)
  console.log(`Date:        ${project.date || '—'}`)
  console.log(`Link:        ${project.link || '—'}`)
  console.log(`Stack:       ${project.stack.join(' · ') || '—'}`)
  console.log(`Tags:        ${project.tags.join(', ') || '—'}`)
  console.log(`Card:        ${project.media.card || '—'}`)
  console.log(`Hero:        ${project.media.hero || '—'}`)
  console.log(`Hero mobile: ${project.media.heroMobile || '—'}`)
  for (const loc of LOCALES) {
    console.log(`\n--- ${loc.toUpperCase()} ---`)
    console.log(`title:       ${project.title[loc]}`)
    console.log(`description: ${project.description[loc]}`)
    console.log(`summary:     ${(project.summary[loc] || '').slice(0, 180)}${(project.summary[loc] || '').length > 180 ? '…' : ''}`)
    if (project.subtitle[loc]) console.log(`subtitle:    ${project.subtitle[loc]}`)
    if (project.seoTitle[loc]) console.log(`seo.title:   ${project.seoTitle[loc]}`)
    if (project.seoDescription[loc]) console.log(`seo.desc:    ${project.seoDescription[loc]}`)
  }
  console.log('\n--- body ---')
  for (const section of project.body) {
    console.log(`\n# ${section.id} — ${section.heading.en}`)
    if (section.images.length) {
      console.log(`  images: ${section.images.join(', ')}`)
    }
    for (const para of section.paragraphs) {
      const preview = (para.en || '').replace(/\n/g, ' / ').slice(0, 220)
      console.log(`  • ${preview}${(para.en || '').length > 220 ? '…' : ''}`)
    }
  }
  console.log(`\nSource: ${briefDir}`)
}

async function run(): Promise<void> {
  const { dir: inputDir, flags } = parseArgs(process.argv.slice(2))

  const dir = resolveImportDir(inputDir)
  const brief = loadBrief(dir)
  const project = composeProject(brief)
  printPreview(project, dir)

  if (flags.dryRun) {
    console.log('\nDry run — CMS was not updated.')
    return
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Pull prod env: npx vercel env pull .env.production.local --environment=production')
  }

  const blobOn = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  console.log(`\nDatabase host: ${dbHost(process.env.DATABASE_URL)}`)
  console.log(`Vercel Blob:   ${blobOn ? 'enabled' : 'DISABLED (uploads stay local — set BLOB_READ_WRITE_TOKEN for prod)'}`)
  if (!blobOn && !flags.skipMedia) {
    console.warn('Warning: media will not land on the public Blob store without BLOB_READ_WRITE_TOKEN.')
  }

  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const { lexicalFromText } = await import('../../src/lib/lexical')
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'portfolio-projects',
    where: { slug: { equals: project.slug } },
    limit: 1,
    depth: 0,
    locale: 'en',
    overrideAccess: true,
  })

  let doc = existing.docs[0] as any
  if (!doc && !flags.create) {
    throw new Error(
      `No portfolio project with slug "${project.slug}". Create it in admin first, or pass --create (category required).`,
    )
  }

  const categoryId = await resolveCategoryId(payload, project.category)
  if (!doc && !categoryId) {
    throw new Error('`--create` needs `category` in the brief (portfolio-categories.value).')
  }

  const mediaIds: Record<string, number> = {}
  if (!flags.skipMedia) {
    const uploads: [string, string | undefined, string][] = [
      ['card', resolveMediaPath(dir, project.media.card), `${project.slug} card`],
      ['hero', resolveMediaPath(dir, project.media.hero), `${project.slug} hero`],
      ['heroMobile', resolveMediaPath(dir, project.media.heroMobile), `${project.slug} hero mobile`],
    ]
    for (const [key, filePath, alt] of uploads) {
      if (filePath) mediaIds[key] = await uploadFile(payload, filePath, alt)
    }
    for (const section of project.body) {
      const ids: number[] = []
      for (const rel of section.images) {
        const filePath = resolveMediaPath(dir, rel)
        if (filePath) ids.push(await uploadFile(payload, filePath, `${project.slug} ${section.id}`))
      }
      ;(section as any)._mediaIds = ids
    }
  }

  const extra: Record<string, unknown> = {}
  if (categoryId) extra.category = categoryId
  if (mediaIds.card) extra.cardImage = mediaIds.card
  if (mediaIds.hero) extra.heroMedia = mediaIds.hero
  if (mediaIds.heroMobile) extra.heroMediaMobile = mediaIds.heroMobile

  const attachBodyImages = (data: Record<string, unknown>, existingDoc: any) => {
    const body = data.body as any[]
    const prev = existingDoc?.body ?? []
    for (let i = 0; i < body.length; i++) {
      const uploaded = (project.body[i] as any)._mediaIds as number[] | undefined
      if (uploaded?.length) {
        body[i].images = uploaded.map((image) => ({ image }))
        continue
      }
      const keep = prev[i]?.images
      if (Array.isArray(keep) && keep.length) {
        body[i].images = keep.map((row: any) => ({
          image: row?.image?.id ?? row?.image,
        }))
      }
    }
  }

  const enData = localeData(project, 'en', extra, lexicalFromText)
  attachBodyImages(enData, doc)
  if (doc) applyIds(enData, doc)

  if (!doc) {
    doc = await payload.create({
      collection: 'portfolio-projects',
      locale: 'en',
      data: enData,
      depth: 0,
      overrideAccess: true,
    })
    console.log(`  ✓ created portfolio-projects #${doc.id}`)
  } else {
    doc = await payload.update({
      collection: 'portfolio-projects',
      id: doc.id,
      locale: 'en',
      data: enData,
      depth: 0,
      overrideAccess: true,
    })
    console.log(`  ✓ updated EN portfolio-projects #${doc.id}`)
  }

  for (const loc of ['ru', 'he'] as const) {
    const data = localeData(project, loc, extra, lexicalFromText)
    attachBodyImages(data, doc)
    applyIds(data, doc)
    doc = await payload.update({
      collection: 'portfolio-projects',
      id: doc.id,
      locale: loc,
      data,
      depth: 0,
      overrideAccess: true,
    })
    console.log(`  ✓ updated ${loc.toUpperCase()}`)
  }

  const adminUrl = `${siteOrigin()}/admin/collections/portfolio-projects/${doc.id}`
  const publicUrl = `${siteOrigin()}/portfolio/${project.slug}`
  console.log(`\nReview in admin:\n  ${adminUrl}`)
  console.log(`Public page:\n  ${publicUrl}`)
  await pingSiteRevalidate(['/portfolio', `/portfolio/${project.slug}`])
  console.log('Done. Recheck copy in admin before treating it as final.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
