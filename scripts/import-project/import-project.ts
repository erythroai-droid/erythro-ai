/**
 * Upsert a portfolio project from a local import folder into Payload.
 *
 * Workflow:
 *   1. Create the project in /admin and set Slug (required fields can be stubs),
 *      or pass --create with category in the brief.
 *   2. Fill content/imports/<slug>/brief.yaml (+ optional body.ts, images).
 *   3. Pull prod env and run this script — it composes the pro-interior body
 *      scheme (overview → results) as rich Lexical and updates the document.
 *
 * Usage:
 *   pnpm import:project -- content/imports/<slug>
 *   pnpm import:project -- content/imports/<slug> --dry-run
 *   pnpm import:project -- content/imports/<slug> --create
 *   pnpm import:project -- content/imports/<slug> --skip-media
 */
import './lib/load-env'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  composeProject,
  composedBodyToLocales,
  findBodyModule,
  loadBrief,
  LOCALES,
  MIME_BY_EXT,
  resolveImportDir,
  type BriefHighlight,
  type ComposedProject,
  type Locale,
} from './lib/import-project-brief'
import {
  assertSameShape,
  richBlocksToDoc,
  type RichBodySpec,
  type RichSection,
} from './lib/rich-lexical'
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

async function loadOptionalBodyModule(dir: string): Promise<RichBodySpec | null> {
  const file = findBodyModule(dir)
  if (!file) return null
  const mod = await import(pathToFileURL(file).href)
  const spec: RichBodySpec = mod.default?.default ?? mod.default
  if (!spec?.locales?.en?.length) {
    throw new Error(`body module ${file} must default-export RichBodySpec with locales.en`)
  }
  assertSameShape(spec.locales)
  console.log(`Using rich body module: ${path.basename(file)}`)
  return spec
}

function highlightsForLocale(highlights: BriefHighlight[], loc: Locale) {
  return highlights.map((row) => ({
    label: row.label[loc] || row.label.en || '',
    detail: row.detail[loc] || row.detail.en || '',
    ...(row.metricsNote?.[loc] || row.metricsNote?.en
      ? { metricsNote: row.metricsNote[loc] || row.metricsNote.en }
      : {}),
    ...(row.metrics?.length
      ? {
          metrics: row.metrics.map((m) => ({
            value: m.value,
            label: m.label[loc] || m.label.en || '',
          })),
        }
      : {}),
  }))
}

function buildBodyData(
  sections: RichSection[],
  sectionImages: number[][],
  existingDoc: any,
  loc: Locale,
) {
  return sections.map((section, i) => ({
    ...(loc === 'en' ? {} : { id: existingDoc?.body?.[i]?.id }),
    heading: section.heading,
    paragraphs: section.rows.map((row, r) => ({
      ...(loc === 'en' ? {} : { id: existingDoc?.body?.[i]?.paragraphs?.[r]?.id }),
      text: richBlocksToDoc(row),
    })),
    images: (sectionImages[i] ?? []).map((image) => ({ image })),
  }))
}

function localeMetaData(
  project: ComposedProject,
  loc: Locale,
  extra: Record<string, unknown>,
  toLexical: (text: string) => unknown,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    slug: project.slug.trim(),
    title: project.title[loc],
    description: project.description[loc],
    summary: toLexical(project.summary[loc] || ''),
    stack: project.stack.map((item) => ({ item })),
    tags: project.tags.map((tag) => ({ tag })),
    ...extra,
  }
  if (project.highlights) {
    data.highlights = highlightsForLocale(project.highlights, loc)
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

function printPreview(
  project: ComposedProject,
  bodyLocales: Record<Locale, RichSection[]>,
  briefDir: string,
  bodyModule: string | null,
): void {
  console.log(`\nSlug:        ${project.slug}`)
  console.log(`Category:    ${project.category || '(keep existing)'}`)
  console.log(`Client:      ${project.client || '—'}`)
  console.log(`Date:        ${project.date || '—'}`)
  console.log(`Link:        ${project.link || '—'}`)
  console.log(`Stack:       ${project.stack.join(' · ') || '—'}`)
  console.log(`Tags:        ${project.tags.join(', ') || '—'}`)
  console.log(
    `Highlights:  ${project.highlights ? `${project.highlights.length} (will write)` : '(keep existing)'}`,
  )
  console.log(`Body source: ${bodyModule ? path.basename(bodyModule) : 'brief facts → rich Lexical'}`)
  console.log(`Card:        ${project.media.card || '—'}`)
  console.log(`Hero:        ${project.media.hero || '—'}`)
  console.log(`Hero mobile: ${project.media.heroMobile || '—'}`)
  for (const loc of LOCALES) {
    console.log(`\n--- ${loc.toUpperCase()} ---`)
    console.log(`title:       ${project.title[loc]}`)
    console.log(
      `description: ${project.description[loc]}`,
    )
    console.log(
      `summary:     ${(project.summary[loc] || '').slice(0, 180)}${(project.summary[loc] || '').length > 180 ? '…' : ''}`,
    )
    if (project.subtitle[loc]) console.log(`subtitle:    ${project.subtitle[loc]}`)
    if (project.seoTitle[loc]) console.log(`seo.title:   ${project.seoTitle[loc]}`)
    if (project.seoDescription[loc]) console.log(`seo.desc:    ${project.seoDescription[loc]}`)
  }
  console.log('\n--- body (EN) ---')
  for (const section of bodyLocales.en) {
    console.log(`\n# ${section.id || 'section'} — ${section.heading} (${section.rows.length} row(s))`)
    for (const row of section.rows) {
      const preview = row
        .map((b) =>
          typeof b === 'string'
            ? b
            : 'bold' in b
              ? `*${b.bold}*`
              : 'ul' in b
                ? `ul[${b.ul.length}]`
                : `table[${b.table.length}×${b.table[0]?.length ?? 0}]`,
        )
        .join(' / ')
        .replace(/\n/g, ' ')
        .slice(0, 220)
      console.log(`  • ${preview}${preview.length >= 220 ? '…' : ''}`)
    }
  }
  if (project.highlights?.length) {
    console.log('\n--- highlights (EN) ---')
    for (const row of project.highlights) {
      console.log(
        `  • ${row.label.en}: ${(row.detail.en || '').slice(0, 100)}${(row.detail.en || '').length > 100 ? '…' : ''}${row.metrics?.length ? ` (+${row.metrics.length} metrics)` : ''}`,
      )
    }
  }
  console.log(`\nSource: ${briefDir}`)
}

async function run(): Promise<void> {
  const { dir: inputDir, flags } = parseArgs(process.argv.slice(2))

  const dir = resolveImportDir(inputDir)
  const brief = loadBrief(dir)
  const project = composeProject(brief)
  const bodyModulePath = findBodyModule(dir)
  const richSpec = await loadOptionalBodyModule(dir)

  const bodyLocales = richSpec
    ? richSpec.locales
    : composedBodyToLocales(project.body)
  if (!richSpec) assertSameShape(bodyLocales)

  printPreview(project, bodyLocales, dir, bodyModulePath ?? null)

  if (flags.dryRun) {
    console.log('\nDry run — CMS was not updated.')
    return
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is required. Pull prod env: npx vercel env pull .env.production.local --environment=production',
    )
  }

  const blobOn = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  console.log(`\nDatabase host: ${dbHost(process.env.DATABASE_URL)}`)
  console.log(
    `Vercel Blob:   ${blobOn ? 'enabled' : 'DISABLED (uploads stay local — set BLOB_READ_WRITE_TOKEN for prod)'}`,
  )
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
  const sectionImageIds: number[][] = bodyLocales.en.map(() => [])

  if (!flags.skipMedia) {
    const uploads: [string, string | undefined, string][] = [
      ['card', resolveMediaPath(dir, project.media.card), `${project.slug} card`],
      ['hero', resolveMediaPath(dir, project.media.hero), `${project.slug} hero`],
      [
        'heroMobile',
        resolveMediaPath(dir, project.media.heroMobile),
        `${project.slug} hero mobile`,
      ],
    ]
    for (const [key, filePath, alt] of uploads) {
      if (filePath) mediaIds[key] = await uploadFile(payload, filePath, alt)
    }

    for (let i = 0; i < bodyLocales.en.length; i++) {
      const sectionId = bodyLocales.en[i]?.id || project.body[i]?.id
      const fromBrief = sectionId
        ? project.body.find((s) => s.id === sectionId)?.images ?? project.body[i]?.images ?? []
        : project.body[i]?.images ?? []
      const fromSpec = richSpec?.sectionImages?.[sectionId || ''] ?? []
      const rels = [...fromBrief, ...fromSpec]
      const ids: number[] = []
      for (const rel of rels) {
        const filePath = resolveMediaPath(dir, rel)
        if (filePath) ids.push(await uploadFile(payload, filePath, `${project.slug} ${sectionId || i}`))
      }
      // Remap images from a previous CMS section index (body.ts `images` map).
      if (!ids.length && richSpec?.images && richSpec.images[i] != null && doc?.body) {
        const from = richSpec.images[i]!
        const keep = doc.body[from]?.images
        if (Array.isArray(keep)) {
          for (const row of keep) {
            const id = row?.image?.id ?? row?.image
            if (typeof id === 'number') ids.push(id)
          }
        }
      }
      sectionImageIds[i] = ids
    }
  } else if (doc?.body && richSpec?.images) {
    for (let i = 0; i < bodyLocales.en.length; i++) {
      const from = richSpec.images[i]
      if (from == null) continue
      const keep = doc.body[from]?.images
      if (!Array.isArray(keep)) continue
      sectionImageIds[i] = keep
        .map((row: any) => row?.image?.id ?? row?.image)
        .filter((id: unknown): id is number => typeof id === 'number')
    }
  } else if (doc?.body) {
    // Keep images on matching section index when skipping media uploads.
    for (let i = 0; i < bodyLocales.en.length; i++) {
      const keep = doc.body[i]?.images
      if (!Array.isArray(keep)) continue
      sectionImageIds[i] = keep
        .map((row: any) => row?.image?.id ?? row?.image)
        .filter((id: unknown): id is number => typeof id === 'number')
    }
  }

  const extra: Record<string, unknown> = {}
  if (categoryId) extra.category = categoryId
  if (mediaIds.card) extra.cardImage = mediaIds.card
  if (mediaIds.hero) extra.heroMedia = mediaIds.hero
  if (mediaIds.heroMobile) extra.heroMediaMobile = mediaIds.heroMobile

  for (const loc of LOCALES) {
    const data = localeMetaData(project, loc, extra, lexicalFromText)
    data.body = buildBodyData(bodyLocales[loc], sectionImageIds, doc, loc)
    if (doc) applyIds(data, doc)

    if (!doc) {
      doc = await payload.create({
        collection: 'portfolio-projects',
        locale: loc,
        data,
        depth: 0,
        overrideAccess: true,
      })
      console.log(`  ✓ created portfolio-projects #${doc.id} (${loc})`)
    } else {
      doc = await payload.update({
        collection: 'portfolio-projects',
        id: doc.id,
        locale: loc,
        data,
        depth: 0,
        overrideAccess: true,
      })
      console.log(`  ✓ updated ${loc.toUpperCase()} portfolio-projects #${doc.id}`)
    }
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
