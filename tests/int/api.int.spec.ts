import { getPayload, type Payload } from 'payload'
import { describe, it, beforeAll, expect } from 'vitest'

// Ensure Payload skips interactive drizzle push before config evaluates.
process.env.NODE_ENV = 'test'

const { default: config } = await import('@/payload.config')

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim())

/** Collections that must remain queryable in admin / frontend CMS reads. */
const CRITICAL_COLLECTIONS = [
  'users',
  'solution-plans',
  'services',
  'pages',
  'portfolio-projects',
  'portfolio-categories',
  'media',
  'partners',
] as const

/** Globals that power the marketing site shell. */
const CRITICAL_GLOBALS = ['site-settings', 'header', 'footer', 'hero'] as const

/**
 * Columns Payload/Drizzle expect — mismatches (e.g. discount_months_1 vs discount_months1)
 * break admin list/edit for that collection while migrate still "succeeds".
 */
const REQUIRED_COLUMNS: Record<string, string[]> = {
  solution_plans_addons: [
    'addon_id',
    'discount_months1',
    'discount_months6',
    'discount_months12',
    'recommended',
    'mandatory',
  ],
  // Localized addon display price (renamed from price to avoid colliding with plan.price)
  solution_plans_addons_locales: ['name', 'price_display', 'full'],
  solution_plans: ['slug', 'price', 'currency', 'featured'],
  solution_plans_features: ['home_only'],
  solution_plans_locales: ['title', 'includes'],
}

describe.skipIf(!hasDatabase)('API', () => {
  let payload: Payload

  beforeAll(async () => {
    try {
      // Avoid Payload prod-migration path during tests (can hang on remote pooler).
      if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
        process.env.NODE_ENV = 'test'
      }

      const payloadConfig = await config
      payload = await getPayload({ config: payloadConfig })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(
        `Failed to init Payload against DATABASE_URL. ` +
          `Check GitHub secret DATABASE_URL (password / Session pooler host). ` +
          `Original error: ${message}`,
        { cause: err },
      )
    }
  }, 60_000)

  it('fetches critical collections', async () => {
    for (const collection of CRITICAL_COLLECTIONS) {
      const result = await payload.find({
        collection,
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      expect(result, `collection "${collection}"`).toBeDefined()
      expect(Array.isArray(result.docs), `collection "${collection}" docs`).toBe(true)
    }
  }, 60_000)

  it('fetches critical globals', async () => {
    for (const slug of CRITICAL_GLOBALS) {
      const doc = await payload.findGlobal({
        slug,
        depth: 0,
        overrideAccess: true,
      })
      expect(doc, `global "${slug}"`).toBeDefined()
    }
  }, 60_000)

  it('has required Postgres columns for critical tables', async () => {
    const pool = (payload.db as { pool?: { query: (text: string, values?: unknown[]) => Promise<{ rows: Array<{ column_name: string }> }> } })
      .pool
    expect(pool, 'payload.db.pool').toBeDefined()
    if (!pool) return

    for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
      const { rows } = await pool.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1`,
        [table],
      )
      const present = new Set(rows.map((r) => r.column_name))
      for (const column of columns) {
        expect(present.has(column), `missing column "${table}.${column}"`).toBe(true)
      }
      // Catch the previous migrate typo that left wrong names behind
      if (table === 'solution_plans_addons') {
        for (const wrong of ['discount_months_1', 'discount_months_6', 'discount_months_12', 'price']) {
          expect(present.has(wrong), `leftover misnamed column "${table}.${wrong}"`).toBe(false)
        }
      }
    }
  }, 30_000)
})
