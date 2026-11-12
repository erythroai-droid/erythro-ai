/**
 * Replace a portfolio project's body with a rich Lexical body.ts module.
 * Prefer `pnpm import:project` (loads body.ts automatically). Keep this CLI
 * for body-only updates without re-uploading media or rewriting highlights.
 *
 * Usage:
 *   pnpm tsx scripts/import-project/apply-rich-body.ts content/imports/<slug>/body.ts [--dry-run]
 *
 * Inline markup in strings: **bold**, `code`.
 */
import './lib/load-env'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { pingSiteRevalidate } from './lib/ping-revalidate'
import {
  assertSameShape,
  richBlocksToDoc,
  type RichBodySpec,
  RICH_LOCALES,
} from './lib/rich-lexical'

export type {
  RichBlock,
  RichBodySpec,
  RichSection,
} from './lib/rich-lexical'

/* eslint-disable @typescript-eslint/no-explicit-any */

async function run(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--env-file='))
  const dryRun = args.includes('--dry-run')
  const file = args.find((a) => !a.startsWith('--'))
  if (!file) {
    throw new Error('Usage: apply-rich-body.ts content/imports/<slug>/body.ts [--dry-run]')
  }

  const mod = await import(pathToFileURL(path.resolve(file)).href)
  const spec: RichBodySpec = mod.default?.default ?? mod.default
  assertSameShape(spec.locales)

  for (const s of spec.locales.en) {
    console.log(`# ${s.heading} — ${s.rows.length} row(s)`)
  }
  if (dryRun) {
    console.log('\nDry run — CMS was not updated.')
    return
  }

  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config })

  const found = await payload.find({
    collection: 'portfolio-projects',
    where: { slug: { equals: spec.slug } },
    limit: 1,
    depth: 0,
    locale: 'en',
    overrideAccess: true,
  })
  let current = found.docs[0] as any
  if (!current) throw new Error(`No portfolio project with slug "${spec.slug}"`)

  const prevBody: any[] = current.body ?? []
  const imagesFor = (i: number) => {
    const from = spec.images?.[i]
    const rows = from == null ? [] : prevBody[from]?.images ?? []
    return rows.map((row: any) => ({ image: row?.image?.id ?? row?.image }))
  }

  for (const loc of RICH_LOCALES) {
    const sections = spec.locales[loc]
    const body = sections.map((s, i) => ({
      ...(loc === 'en' ? {} : { id: current.body?.[i]?.id }),
      heading: s.heading,
      paragraphs: s.rows.map((row, r) => ({
        ...(loc === 'en' ? {} : { id: current.body?.[i]?.paragraphs?.[r]?.id }),
        text: richBlocksToDoc(row),
      })),
      images: imagesFor(i),
    }))
    current = await payload.update({
      collection: 'portfolio-projects',
      id: current.id,
      locale: loc,
      data: { body },
      depth: 0,
      overrideAccess: true,
    })
    console.log(`  ✓ ${loc.toUpperCase()} body — ${body.length} sections`)
  }

  await pingSiteRevalidate(['/portfolio', `/portfolio/${spec.slug}`])
  console.log('Done.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
