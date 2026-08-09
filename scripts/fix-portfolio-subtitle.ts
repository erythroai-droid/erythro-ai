/**
 * Non-interactive schema fix for production / CI DATABASE_URL.
 *
 * Adds optional portfolio project `subtitle` on locales. Prefer this when
 * `payload migrate` hangs on a batch=-1 push marker.
 *
 * Usage:
 *   npx vercel env pull .env.production.local --environment=production
 *   pnpm db:fix-portfolio-subtitle
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

const MIGRATION_NAME = '20260810_010000_portfolio_project_subtitle'

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
      ALTER TABLE "portfolio_projects_locales"
      ADD COLUMN IF NOT EXISTS "subtitle" varchar
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
