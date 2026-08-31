/**
 * Non-interactive schema fix for production / CI DATABASE_URL.
 *
 * Adds AI Audit structured columns on contact_submissions when migrate
 * rows lag behind a Drizzle push (PIT-028 pattern).
 *
 * Usage:
 *   pnpm db:fix-contact-submissions-audit-fields
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

const MIGRATION_NAME = '20260831_010000_contact_submissions_audit_fields'

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
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "website" varchar
    `)
    await client.query(`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "audit_language" varchar
    `)
    await client.query(`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "plan_slug" varchar
    `)
    await client.query(`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "plan_total" varchar
    `)
    await client.query(`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "audit_status" varchar DEFAULT 'new'
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "contact_submissions_website_idx"
      ON "contact_submissions" USING btree ("website")
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "contact_submissions_plan_slug_idx"
      ON "contact_submissions" USING btree ("plan_slug")
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS "contact_submissions_audit_status_idx"
      ON "contact_submissions" USING btree ("audit_status")
    `)

    await client.query(`DELETE FROM "payload_migrations" WHERE "batch" = -1`)
    await ensureMigrationRow(client, MIGRATION_NAME)

    await client.query('COMMIT')
    console.log(`Applied ${MIGRATION_NAME} column fixes`)
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
