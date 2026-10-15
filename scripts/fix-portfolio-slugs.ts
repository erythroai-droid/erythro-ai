/**
 * Trim whitespace on portfolio-projects.slug (import bug left trailing spaces → 404).
 *   pnpm exec tsx scripts/fix-portfolio-slugs.ts
 */
import { config } from 'dotenv'
config({ path: '.env', override: true })
process.env.PAYLOAD_DISABLE_PUSH = '1'

async function main() {
  const { getPayloadLocal } = await import('../src/lib/payloadStatic')
  const payload = await getPayloadLocal()
  const res = await payload.find({
    collection: 'portfolio-projects',
    limit: 200,
    depth: 0,
    overrideAccess: true,
    locale: 'en',
  })

  let fixed = 0
  for (const doc of res.docs as { id: number; slug?: string }[]) {
    const raw = String(doc.slug ?? '')
    const trimmed = raw.trim()
    if (!trimmed || trimmed === raw) {
      console.log('ok', JSON.stringify(raw), 'id=', doc.id)
      continue
    }
    console.log('fix', JSON.stringify(raw), '→', JSON.stringify(trimmed), 'id=', doc.id)
    await payload.update({
      collection: 'portfolio-projects',
      id: doc.id,
      data: { slug: trimmed },
      depth: 0,
      overrideAccess: true,
      locale: 'en',
    })
    fixed += 1
  }
  console.log('fixed', fixed, 'of', res.docs.length)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
