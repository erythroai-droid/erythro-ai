/**
 * Non-interactive schema fix for production / CI DATABASE_URL.
 *
 * Converts portfolio project summary/subtitle/body paragraph text columns
 * from varchar → jsonb Lexical docs. Prefer this when `payload migrate` hangs.
 *
 * Usage:
 *   npx vercel env pull .env.production.local --environment=production
 *   pnpm db:fix-portfolio-richtext
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

const MIGRATION_NAME = '20260811_010000_portfolio_project_richtext'

const WRAP_LEXICAL = (col: string) => `
  CASE
    WHEN ${col} IS NULL OR BTRIM(${col}::text) = '' THEN NULL
    WHEN left(BTRIM(${col}::text), 1) = '{' THEN ${col}::jsonb
    ELSE jsonb_build_object(
      'root', jsonb_build_object(
        'type', 'root',
        'format', '',
        'indent', 0,
        'version', 1,
        'direction', NULL,
        'children', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'format', '',
            'indent', 0,
            'version', 1,
            'direction', NULL,
            'textFormat', 0,
            'children', jsonb_build_array(
              jsonb_build_object(
                'type', 'text',
                'text', ${col}::text,
                'format', 0,
                'mode', 'normal',
                'style', '',
                'detail', 0,
                'version', 1
              )
            )
          )
        )
      )
    )
  END
`

async function columnType(
  client: import('pg').Client,
  table: string,
  column: string,
): Promise<string | null> {
  const { rows } = await client.query(
    `SELECT data_type
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column],
  )
  return rows[0]?.data_type ?? null
}

async function ensureJsonbColumn(
  client: import('pg').Client,
  table: string,
  column: string,
  dropNotNull = false,
) {
  const type = await columnType(client, table, column)
  if (!type) return
  if (type === 'jsonb') return

  if (dropNotNull) {
    await client.query(
      `ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP NOT NULL`,
    )
  }

  await client.query(
    `ALTER TABLE "${table}"
     ALTER COLUMN "${column}" TYPE jsonb
     USING (${WRAP_LEXICAL(`"${column}"`)})`,
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

    await ensureJsonbColumn(client, 'portfolio_projects_locales', 'summary', true)
    await ensureJsonbColumn(client, 'portfolio_projects_locales', 'subtitle')
    await ensureJsonbColumn(
      client,
      'portfolio_projects_body_paragraphs_locales',
      'text',
      true,
    )

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
