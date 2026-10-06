/**
 * Non-interactive schema fix for CI / production DATABASE_URL.
 *
 * Payload 3.90 adds users.reset_password_requested_at because forgot-password
 * requests are throttled by default. CI does not run payload migrate.
 *
 * Usage: pnpm db:fix-users-reset-password-requested-at
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

const MIGRATION_NAME = '20261007_021500_users_reset_password_requested_at'

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
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone
    `)

    await client.query(`DELETE FROM "payload_migrations" WHERE "batch" = -1`)

    await client.query(
      `
      INSERT INTO "payload_migrations" ("name", "batch", "updated_at", "created_at")
      SELECT $1::varchar, 1, NOW(), NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM "payload_migrations" WHERE "name" = $1::varchar
      )
    `,
      [MIGRATION_NAME],
    )

    await client.query('COMMIT')
    console.log(`Applied ${MIGRATION_NAME}`)
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
