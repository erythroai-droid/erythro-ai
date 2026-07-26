/**
 * Non-interactive schema fix for production.
 *
 * `payload migrate` hangs in CI when payload_migrations has a batch=-1 row
 * (left by Drizzle push in dev). This script applies the missing column and
 * records the migration without prompting.
 *
 * Usage:
 *   npx vercel env pull .env.production.local --environment=production
 *   pnpm db:fix-portfolio-hero-mobile
 */
import { createRequire } from 'node:module'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.production.local' })
loadEnv()

const require = createRequire(import.meta.url)
// pnpm nests pg under the Payload postgres adapter
const { Client } = require(
  require.resolve('pg', {
    paths: [require.resolve('@payloadcms/db-postgres')],
  }),
) as typeof import('pg')

const MIGRATION_NAME = '20260726_120000_add_portfolio_hero_media_mobile'

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
      ALTER TABLE "portfolio_projects"
      ADD COLUMN IF NOT EXISTS "hero_media_mobile_id" integer
    `)

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "portfolio_projects"
        ADD CONSTRAINT "portfolio_projects_hero_media_mobile_id_media_id_fk"
        FOREIGN KEY ("hero_media_mobile_id")
        REFERENCES "public"."media"("id")
        ON DELETE set null
        ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS "portfolio_projects_hero_media_mobile_idx"
      ON "portfolio_projects" USING btree ("hero_media_mobile_id")
    `)

    // Clear the push-mode marker so future `payload migrate` won't prompt.
    await client.query(`DELETE FROM "payload_migrations" WHERE "batch" = -1`)

    await client.query(
      `
      INSERT INTO "payload_migrations" ("name", "batch", "updated_at", "created_at")
      SELECT $1, 1, NOW(), NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM "payload_migrations" WHERE "name" = $1
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
