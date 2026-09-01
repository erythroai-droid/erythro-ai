/**
 * Ensure contact_submissions.html_result can store full A44 HTML (not varchar(255)).
 * Safe to re-run.
 */
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: '.env.local' })
dotenv.config()

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!url) {
  console.error('Missing DATABASE_URL')
  process.exit(1)
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  const before = await client.query(`
    SELECT character_maximum_length AS maxlen
    FROM information_schema.columns
    WHERE table_name = 'contact_submissions' AND column_name = 'html_result'
  `)
  console.log('html_result maxlen before:', before.rows[0]?.maxlen ?? 'null/unlimited')

  await client.query(`
    ALTER TABLE contact_submissions
    ALTER COLUMN html_result TYPE text
    USING html_result::text
  `)

  const after = await client.query(`
    SELECT data_type, character_maximum_length AS maxlen
    FROM information_schema.columns
    WHERE table_name = 'contact_submissions' AND column_name = 'html_result'
  `)
  console.log('html_result after:', after.rows[0])
} finally {
  await client.end()
}
