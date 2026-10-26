/**
 * Compress service page header strips and put them on R2 (erythro-media).
 * Updates Payload `media` rows so CMS URLs point at the new WebP objects.
 *
 * Prerequisites (from .env / .env.local):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   R2_MEDIA_BUCKET (default erythro-media)
 *   R2_MEDIA_PUBLIC_BASE_URL
 *   DATABASE_URL
 *
 * Usage:
 *   node scripts/compress-service-headers-r2.mjs           # dry-run
 *   node scripts/compress-service-headers-r2.mjs --apply   # upload + DB
 */
import { config as loadEnv } from 'dotenv'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import pg from 'pg'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

const require = createRequire(import.meta.url)
const sharp = require('sharp')

const APPLY = process.argv.includes('--apply')
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

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

/** Source on R2 (or local fallback) → destination WebP key on R2. */
const JOBS = [
  {
    slug: 'ai-automation',
    sourceUrl: `${PUBLIC}/header_14.jpg`,
    destKey: 'header_14.webp',
    matchFilenames: ['header_14.jpg', 'header_14.webp'],
  },
  {
    slug: 'design-branding',
    sourceUrl: `${PUBLIC}/header_9.jpg`,
    destKey: 'header_9.webp',
    matchFilenames: ['header_9.jpg', 'header_9.webp'],
  },
  {
    slug: 'development',
    sourceUrl: `${PUBLIC}/header_10.jpg`,
    destKey: 'header_10.webp',
    matchFilenames: ['header_10.jpg', 'header_10.webp'],
  },
  {
    slug: 'enterprise-engineering',
    sourceUrl: `${PUBLIC}/header_87.jpg`,
    destKey: 'header_87.webp',
    matchFilenames: ['header_87.jpg', 'header_87.webp'],
  },
]

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: KEY, secretAccessKey: SECRET },
})

async function loadSource(job) {
  if (job.sourcePath) {
    return fs.readFile(job.sourcePath)
  }
  const res = await fetch(job.sourceUrl)
  if (!res.ok) throw new Error(`fetch ${job.sourceUrl} → ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function compressStrip(input) {
  const body = await sharp(input)
    .resize(1920, 300, { fit: 'cover', position: 'centre' })
    .webp({ quality: 74, effort: 6 })
    .toBuffer()
  const meta = await sharp(body).metadata()
  return {
    body,
    width: meta.width || 1920,
    height: meta.height || 300,
    filesize: body.length,
  }
}

async function main() {
  console.log(APPLY ? 'APPLY' : 'DRY-RUN', { bucket: BUCKET, public: PUBLIC })

  const client = new pg.Client({ connectionString: DB, ssl: { rejectUnauthorized: false } })
  await client.connect()

  try {
    for (const job of JOBS) {
      const raw = await loadSource(job)
      const { body, width, height, filesize } = await compressStrip(raw)
      const publicUrl = `${PUBLIC}/${job.destKey}`

      console.log('\n—', job.slug)
      console.log('  dest', job.destKey, `${filesize} B`, `${width}x${height}`)

      const found = await client.query(
        `select id, filename, url, mime_type, filesize, width, height, _objectkey
         from media
         where filename = any($1::text[])
            or url like any($2::text[])
         order by id`,
        [
          job.matchFilenames,
          job.matchFilenames.map((f) => `%/${f}`),
        ],
      )
      console.log(
        '  media rows',
        found.rows.map((r) => ({ id: r.id, filename: r.filename, url: r.url })),
      )

      if (!found.rows.length && !job.createIfMissing) {
        console.warn('  skip: no media row and createIfMissing=false')
        continue
      }

      if (APPLY) {
        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: job.destKey,
            Body: body,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000, immutable',
          }),
        )
        console.log('  uploaded', publicUrl)

        if (found.rows.length) {
          for (const row of found.rows) {
            // Keep `_objectkey` NULL for flat R2 keys. Payload afterRead treats
            // `_objectKey` as a folder segment and then appends `filename`, so
            // setting it to `header_14.webp` produced `.../header_14.webp/header_14.webp`.
            await client.query(
              `update media set
                 filename = $2,
                 url = $3,
                 thumbnail_u_r_l = $3,
                 mime_type = 'image/webp',
                 filesize = $4,
                 width = $5,
                 height = $6,
                 _objectkey = null,
                 updated_at = now()
               where id = $1`,
              [row.id, job.destKey, publicUrl, filesize, width, height],
            )
            console.log('  updated media id', row.id)
          }
        } else if (job.createIfMissing) {
          const ins = await client.query(
            `insert into media (alt, filename, url, thumbnail_u_r_l, mime_type, filesize, width, height, _objectkey, created_at, updated_at)
             values ($1, $2, $3, $3, 'image/webp', $4, $5, $6, null, now(), now())
             returning id`,
            [`Service header ${job.slug}`, job.destKey, publicUrl, filesize, width, height],
          )
          const mediaId = ins.rows[0].id
          console.log('  created media id', mediaId)

          const svc = await client.query(
            `select id, slug, hero_media_id from services where slug = $1`,
            [job.slug],
          )
          if (svc.rows[0]) {
            await client.query(`update services set hero_media_id = $2, updated_at = now() where id = $1`, [
              svc.rows[0].id,
              mediaId,
            ])
            console.log('  linked services', job.slug, '→ media', mediaId)
          } else {
            console.warn('  no services row for slug', job.slug)
          }
        }
      }
    }
  } finally {
    await client.end()
  }

  console.log('\nDone.', APPLY ? 'Revalidate site-content / redeploy so ISR picks up new URLs.' : 'Re-run with --apply to write.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
