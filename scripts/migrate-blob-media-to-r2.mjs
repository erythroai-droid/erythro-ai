/**
 * Copy Payload media from Vercel Blob → Cloudflare R2 (`erythro-media`) and
 * rewrite `media.url` (and filename-based keys) in Postgres.
 *
 * Prerequisites:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   R2_MEDIA_BUCKET (default erythro-media)
 *   R2_MEDIA_PUBLIC_BASE_URL (public r2.dev / custom domain)
 *   DATABASE_URL
 *   BLOB_READ_WRITE_TOKEN (only needed if some rows still use /api/media/file)
 *
 * Usage:
 *   node scripts/migrate-blob-media-to-r2.mjs           # dry-run
 *   node scripts/migrate-blob-media-to-r2.mjs --apply   # write
 */
import { config as loadEnv } from 'dotenv'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import pg from 'pg'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

const APPLY = process.argv.includes('--apply')
const BUCKET = process.env.R2_MEDIA_BUCKET?.trim() || 'erythro-media'
const ACCOUNT = process.env.R2_ACCOUNT_ID?.trim()
const KEY = process.env.R2_ACCESS_KEY_ID?.trim()
const SECRET = process.env.R2_SECRET_ACCESS_KEY?.trim()
const PUBLIC = process.env.R2_MEDIA_PUBLIC_BASE_URL?.trim()?.replace(/\/+$/, '')
const DB = process.env.DATABASE_URL?.trim()

if (!ACCOUNT || !KEY || !SECRET || !PUBLIC || !DB) {
  console.error(
    'Missing env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_MEDIA_PUBLIC_BASE_URL, DATABASE_URL',
  )
  process.exit(1)
}

const endpoint = `https://${ACCOUNT}.r2.cloudflarestorage.com`
const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: { accessKeyId: KEY, secretAccessKey: SECRET },
})

function blobStoreId() {
  const fromPublic = process.env.NEXT_PUBLIC_BLOB_STORE_ID?.trim()
  if (fromPublic) return fromPublic.toLowerCase()
  return process.env.BLOB_READ_WRITE_TOKEN?.match(/^vercel_blob_rw_([a-z\d]+)_/i)?.[1]?.toLowerCase()
}

function encodeBlobPath(path) {
  return path
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => {
      try {
        return encodeURIComponent(decodeURIComponent(part))
      } catch {
        return encodeURIComponent(part)
      }
    })
    .join('/')
}

function toBlobUrl(url, filename, prefix) {
  const trimmed = (url || '').trim()
  if (trimmed.includes('blob.vercel-storage.com')) return trimmed
  if (trimmed.includes('.r2.dev') || trimmed.startsWith(PUBLIC)) return null

  const match = trimmed.match(/\/(?:api\/)?media\/file\/(.+)$/i)
  const store = blobStoreId()
  if (match?.[1] && store) {
    return `https://${store}.public.blob.vercel-storage.com/${encodeBlobPath(match[1])}`
  }

  if (filename && store) {
    const key = prefix ? `${String(prefix).replace(/\/?$/, '/')}${filename}` : filename
    return `https://${store}.public.blob.vercel-storage.com/${encodeBlobPath(key)}`
  }

  return trimmed.startsWith('http') ? trimmed : null
}

function objectKeyFromSource(sourceUrl, filename, prefix) {
  try {
    const u = new URL(sourceUrl)
    const path = decodeURIComponent(u.pathname.replace(/^\/+/, ''))
    if (path) return path
  } catch {
    /* fall through */
  }
  if (filename) {
    return prefix ? `${String(prefix).replace(/\/?$/, '/')}${filename}` : filename
  }
  return null
}

async function objectExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

async function upload(key, body, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType || undefined,
    }),
  )
}

const client = new pg.Client({
  connectionString: DB,
  ...(process.env.DATABASE_SSL_INSECURE === '1'
    ? { ssl: { rejectUnauthorized: false } }
    : {}),
})

await client.connect()

// Payload media has no `prefix` column in this project (flat Blob keys).
const { rows } = await client.query(
  `select id, url, filename, mime_type
   from media
   order by id asc`,
)

console.log(`Found ${rows.length} media rows. Mode: ${APPLY ? 'APPLY' : 'dry-run'}`)

let copied = 0
let skipped = 0
let failed = 0

for (const row of rows) {
  const source = toBlobUrl(row.url, row.filename, null)
  if (!source) {
    skipped += 1
    console.log(`skip id=${row.id} (already R2 or no source) url=${row.url}`)
    continue
  }

  const key = objectKeyFromSource(source, row.filename, null)
  if (!key) {
    failed += 1
    console.error(`fail id=${row.id}: cannot derive object key from ${source}`)
    continue
  }

  const dest = `${PUBLIC}/${key}`

  try {
    const exists = await objectExists(key)
    if (!exists) {
      if (!APPLY) {
        console.log(`would-copy id=${row.id} → ${key}`)
      } else {
        const res = await fetch(source)
        if (!res.ok) throw new Error(`fetch ${res.status} ${source}`)
        const buf = Buffer.from(await res.arrayBuffer())
        await upload(key, buf, row.mime_type || res.headers.get('content-type') || undefined)
        console.log(`copied id=${row.id} → ${key} (${buf.length} bytes)`)
      }
    } else {
      console.log(`exists id=${row.id} key=${key}`)
    }

    if (APPLY && row.url !== dest) {
      await client.query(`update media set url = $1, updated_at = now() where id = $2`, [
        dest,
        row.id,
      ])
      console.log(`updated id=${row.id} url → ${dest}`)
    }

    copied += 1
  } catch (err) {
    failed += 1
    console.error(`fail id=${row.id}:`, err instanceof Error ? err.message : err)
  }
}

await client.end()
console.log(`Done. processed=${copied} skipped=${skipped} failed=${failed}`)
if (!APPLY) console.log('Re-run with --apply to upload and rewrite URLs.')
else {
  console.log(
    'Next: POST /api/revalidate?secret=$REVALIDATION_TOKEN (SQL updates skip Payload hooks; Data Cache may still serve Blob URLs).',
  )
}
