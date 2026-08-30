/**
 * Non-interactive schema fix for production / CI DATABASE_URL.
 *
 * Restores solution-plan feature columns that a local Drizzle push against
 * prod can drop while leaving the migration row in payload_migrations
 * (so `payload migrate` thinks they already exist).
 *
 * - solution_plans_features.home_only
 * - solution_plans_features_locales.full (Lexical jsonb)
 *
 * Usage:
 *   pnpm db:fix-solution-feature-columns
 */
import { createRequire } from 'node:module'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.production.local' })
loadEnv()

const require = createRequire(import.meta.url)
const { Client } = require(
  require.resolve('pg', {
    paths: [require.resolve('@payloadcms/db-postgres')],
  }),
) as typeof import('pg')

const MIGRATION_HOME_ONLY = '20260804_120000_feature_home_only'
const MIGRATION_FULL_RICHTEXT = '20260802_120000_solution_feature_full_richtext'

async function ensureMigrationRow(client: import('pg').Client, name: string) {
  await client.query(
    `
      INSERT INTO "payload_migrations" ("name", "batch", "updated_at", "created_at")
      SELECT $1::varchar, 1, NOW(), NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM "payload_migrations" WHERE "name" = $1::varchar
      )
    `,
    [name],
  )
}

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim()
  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
  await client.connect()

  try {
    await client.query('BEGIN')

    await client.query(`
      ALTER TABLE "solution_plans_features"
      ADD COLUMN IF NOT EXISTS "home_only" boolean DEFAULT false
    `)

    await client.query(`
      ALTER TABLE "solution_plans_features_locales"
      ADD COLUMN IF NOT EXISTS "full" jsonb
    `)

    await client.query(`DELETE FROM "payload_migrations" WHERE "batch" = -1`)

    await ensureMigrationRow(client, MIGRATION_HOME_ONLY)
    await ensureMigrationRow(client, MIGRATION_FULL_RICHTEXT)

    await client.query('COMMIT')
    console.log(`Applied ${MIGRATION_HOME_ONLY} + ${MIGRATION_FULL_RICHTEXT} column fixes`)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
