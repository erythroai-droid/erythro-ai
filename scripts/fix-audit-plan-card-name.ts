/**
 * Non-interactive schema fix for CI / production DATABASE_URL.
 *
 * Adds solution_plans_locales.card_name (and sibling audit checkout columns
 * from 20261012_010000 if missing). CI does not run `payload migrate` before
 * api.int.spec — without this, find(solution-plans) fails with
 * "column …card_name does not exist".
 *
 * Usage: pnpm db:fix-audit-plan-card-name
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

const MIGRATION_CHECKOUT = '20261012_010000_audit_plan_checkout_fields'
const MIGRATION_CARD_NAME = '20261012_020000_audit_plan_card_name'

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
      ALTER TABLE "solution_plans"
      ADD COLUMN IF NOT EXISTS "plan_id" varchar
    `)
    await client.query(`
      ALTER TABLE "solution_plans"
      ADD COLUMN IF NOT EXISTS "checkout_mode" varchar DEFAULT 'order'
    `)
    await client.query(`
      ALTER TABLE "solution_plans_locales"
      ADD COLUMN IF NOT EXISTS "card_price_note" varchar
    `)
    await client.query(`
      ALTER TABLE "solution_plans_locales"
      ADD COLUMN IF NOT EXISTS "cta_label" varchar
    `)
    await client.query(`
      ALTER TABLE "solution_plans_locales"
      ADD COLUMN IF NOT EXISTS "card_name" varchar
    `)

    await client.query(`DELETE FROM "payload_migrations" WHERE "batch" = -1`)

    await ensureMigrationRow(client, MIGRATION_CHECKOUT)
    await ensureMigrationRow(client, MIGRATION_CARD_NAME)

    await client.query('COMMIT')
    console.log(`Applied ${MIGRATION_CHECKOUT} + ${MIGRATION_CARD_NAME} column fixes`)
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
