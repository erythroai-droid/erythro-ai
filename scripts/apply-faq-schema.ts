import 'dotenv/config'
import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { join } from 'path'

const require = createRequire(join(process.cwd(), 'package.json'))
const { Client } = require('pg') as typeof import('pg')

const sql = readFileSync(join(process.cwd(), 'scripts/sql/faq-section.sql'), 'utf8')

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
await client.query(sql)

const check = await client.query(`
  SELECT
    (SELECT COUNT(*)::int FROM faq_section) AS globals,
    (SELECT COUNT(*)::int FROM faq_section_locales) AS locales,
    (SELECT COUNT(*)::int FROM faq_section_items) AS items,
    (SELECT COUNT(*)::int FROM faq_section_items_locales) AS item_locales
`)
console.log('FAQ schema applied:', check.rows[0])
await client.end()
