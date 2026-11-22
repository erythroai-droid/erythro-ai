import './lib/load-env'
import { getPayload } from 'payload'
import config from '../../src/payload.config'

const slug = process.argv[2]
const planSlug = process.argv[3] || 'ai-smart-card'
if (!slug) {
  console.error('Usage: pnpm tsx scripts/import-project/set-solution-plan.ts <project-slug> [plan-slug]')
  process.exit(1)
}

const payload = await getPayload({ config })
const plans = await payload.find({
  collection: 'solution-plans',
  where: { slug: { equals: planSlug } },
  limit: 1,
  depth: 0,
  overrideAccess: true,
})
const plan = plans.docs[0]
if (!plan) throw new Error(`plan ${planSlug} missing`)

const projects = await payload.find({
  collection: 'portfolio-projects',
  where: { slug: { equals: slug } },
  limit: 1,
  depth: 0,
  overrideAccess: true,
})
const doc = projects.docs[0]
if (!doc) throw new Error(`project ${slug} missing`)

await payload.update({
  collection: 'portfolio-projects',
  id: doc.id,
  data: { solutionPlan: plan.id },
  depth: 0,
  overrideAccess: true,
})
console.log(`${slug} #${doc.id} → solutionPlan ${plan.id} (${planSlug})`)
process.exit(0)
