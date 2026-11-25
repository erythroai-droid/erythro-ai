/**
 * Append / prepend LEGAL_OPERATOR_LINE in CMS:
 * - legal-privacy §1 paragraphs
 * - legal-terms §1 paragraphs
 * - footer.purchaseTermsNotice (start of text)
 *
 * Usage:
 *   PAYLOAD_DISABLE_PUSH=1 pnpm exec tsx scripts/patch-legal-operator-line.ts
 *   PAYLOAD_DISABLE_PUSH=1 pnpm exec tsx scripts/patch-legal-operator-line.ts --dry
 */
import './import-project/lib/load-env'

process.env.PAYLOAD_DISABLE_PUSH = '1'

import { getPayload } from 'payload'
import config from '../src/payload.config'
import { LEGAL_OPERATOR_LINE } from '../src/lib/legalPages'

const DRY = process.argv.includes('--dry')
const LOCALES = ['en', 'ru', 'he'] as const

function hasOperatorLine(text: string): boolean {
  return (
    text.includes('Osek Patur') ||
    text.includes('עוסק פטור') ||
    text.includes('קובלנקו ודים') ||
    text.includes('Kovalenko Vadym')
  )
}

function ensureAppend(text: string, line: string): { text: string; changed: boolean } {
  const raw = typeof text === 'string' ? text : ''
  if (hasOperatorLine(raw)) return { text: raw, changed: false }
  const next = raw.trim() ? `${raw.trim()}\n${line}` : line
  return { text: next, changed: true }
}

function ensurePrepend(text: string, line: string): { text: string; changed: boolean } {
  const raw = typeof text === 'string' ? text : ''
  if (hasOperatorLine(raw)) return { text: raw, changed: false }
  const next = raw.trim() ? `${line} ${raw.trim()}` : line
  return { text: next, changed: true }
}

async function patchLegalGlobal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  slug: 'legal-privacy' | 'legal-terms',
) {
  const doc = await payload.findGlobal({
    slug,
    locale: 'all',
    depth: 0,
    overrideAccess: true,
  })
  if (!Array.isArray(doc?.sections) || !doc.sections[0]) {
    console.log(`  ${slug}: no section[0], skip`)
    return
  }

  for (const loc of LOCALES) {
    const paragraphs = doc.sections[0].paragraphs
    const current =
      paragraphs && typeof paragraphs === 'object' && !Array.isArray(paragraphs)
        ? String(paragraphs[loc] || '')
        : typeof paragraphs === 'string'
          ? paragraphs
          : ''
    const { text, changed } = ensureAppend(current, LEGAL_OPERATOR_LINE[loc])
    if (!changed) {
      console.log(`  ${slug} [${loc}]: already has operator line`)
      continue
    }
    console.log(`  ${slug} [${loc}]: append operator line`)
    if (DRY) continue

    const sections = doc.sections.map((s: Record<string, unknown>, i: number) =>
      i === 0 ? { ...s, paragraphs: text } : s,
    )
    await payload.updateGlobal({
      slug,
      locale: loc,
      overrideAccess: true,
      data: {
        statementDate: '2026-11-25',
        sections,
      },
    })
  }
}

async function patchFooter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
) {
  const doc = await payload.findGlobal({
    slug: 'footer',
    locale: 'all',
    depth: 0,
    overrideAccess: true,
  })
  const notice = doc?.purchaseTermsNotice

  for (const loc of LOCALES) {
    const current =
      notice && typeof notice === 'object'
        ? String(notice[loc] || '')
        : typeof notice === 'string'
          ? notice
          : ''
    const { text, changed } = ensurePrepend(current, LEGAL_OPERATOR_LINE[loc])
    if (!changed) {
      console.log(`  footer [${loc}]: already has operator line`)
      continue
    }
    console.log(`  footer [${loc}]: prepend operator line`)
    if (DRY) continue
    await payload.updateGlobal({
      slug: 'footer',
      locale: loc,
      overrideAccess: true,
      data: { purchaseTermsNotice: text },
    })
  }
}

async function main() {
  const payload = await getPayload({ config })
  console.log(DRY ? 'DRY RUN' : 'APPLY')
  await patchLegalGlobal(payload, 'legal-privacy')
  await patchLegalGlobal(payload, 'legal-terms')
  await patchFooter(payload)
  console.log('done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
