/**
 * Non-interactive schema fix for production / CI DATABASE_URL.
 *
 * Adds AI Audit pipeline columns on contact_submissions when migrate
 * rows lag behind a Drizzle push (PIT-028 pattern).
 *
 * Usage:
 *   pnpm db:fix-contact-submissions-audit-pipeline
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

const MIGRATION_NAME = '20260831_120000_contact_submissions_audit_pipeline'

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
      ADD COLUMN IF NOT EXISTS "audit_score" numeric
    `)
    await client.query(`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "audit_summary" jsonb
    `)
    await client.query(`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "report_url" varchar
    `)
    await client.query(`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "html_result" varchar
    `)
    await client.query(`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "retry_count" numeric DEFAULT 0
    `)
    await client.query(`
      ALTER TABLE "contact_submissions"
      ADD COLUMN IF NOT EXISTS "error_last" varchar
    `)

    await ensureMigrationRow(client, MIGRATION_NAME)
    await client.query('COMMIT')
    console.log(`OK: ${MIGRATION_NAME} columns ensured`)
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
