/**
 * Clears Payload's interactive migrate blocker (batch = -1).
 *
 * Local `next dev` with Drizzle push writes a batch=-1 row into
 * `payload_migrations`. On Vercel, `prodMigrations` then prompts
 * "Would you like to proceed? (y/N)" and the build hangs forever.
 *
 * Run before production builds. Safe to run repeatedly.
 *
 * Usage:
 *   pnpm db:clear-dev-push
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

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim()
  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
  await client.connect()

  try {
    const result = await client.query(`DELETE FROM "payload_migrations" WHERE "batch" = -1`)
    console.log(`Cleared ${result.rowCount ?? 0} batch=-1 payload_migrations row(s)`)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
