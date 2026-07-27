/**
 * Non-interactive schema fix for page-hero uploads on site_settings.
 *
 * `payload migrate` can hang when payload_migrations has a batch=-1 row
 * (left by Drizzle push in dev). This applies the columns and records the
 * migration without prompting.
 *
 * Usage:
 *   npx tsx scripts/fix-site-settings-page-heroes.ts
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

const MIGRATION_NAME = '20260727_103500_add_site_settings_page_heroes'

const COLUMNS = [
  'contacts_hero_media_id',
  'portfolio_hero_media_id',
  'legal_hero_media_id',
  'order_hero_media_id',
] as const

async function main() {
  const connectionString = process.env.DATABASE_URL?.trim()
  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
  await client.connect()

  try {
    await client.query('BEGIN')

    for (const col of COLUMNS) {
      await client.query(`
        ALTER TABLE "site_settings"
        ADD COLUMN IF NOT EXISTS "${col}" integer
      `)

      await client.query(`
        DO $$ BEGIN
          ALTER TABLE "site_settings"
          ADD CONSTRAINT "site_settings_${col}_media_id_fk"
          FOREIGN KEY ("${col}")
          REFERENCES "public"."media"("id")
          ON DELETE set null
          ON UPDATE no action;
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `)

      const indexName = `site_settings_${col.replace(/_id$/, '')}_idx`
      await client.query(`
        CREATE INDEX IF NOT EXISTS "${indexName}"
        ON "site_settings" USING btree ("${col}")
      `)
    }

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
