/**
 * Compress portfolio listing assets on R2 (erythro-media) → WebP.
 * Updates Payload `media` rows; keeps `_objectkey` NULL for flat keys (PIT-133).
 *
 * Targets:
 *   - portfolio header strip (site_settings.portfolio_hero_media)
 *   - portfolio card images (listing LCP)
 *   - heavy hero_media_mobile JPEGs (case pages + RSC payload weight)
 *
 * Prerequisites: R2_* + DATABASE_URL (same as compress-service-headers-r2.mjs)
 *
 * Usage:
 *   node scripts/compress-portfolio-media-r2.mjs           # dry-run
 *   node scripts/compress-portfolio-media-r2.mjs --apply   # upload + DB
 */
import { config as loadEnv } from 'dotenv'
import { createRequire } from 'node:module'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import pg from 'pg'

loadEnv({ path: '.env.local' })
loadEnv({ path: '.env' })

const require = createRequire(import.meta.url)
const sharp = require('sharp')

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

/**
 * @typedef {'strip'|'card'|'mobile'} Kind
 * @type {Array<{
 *   label: string
 *   mediaId: number
 *   sourceUrl: string
 *   destKey: string
 *   kind: Kind
 * }>}
 */
const JOBS = [
  // Header chip strip (/portfolio LCP strip)
  {
    label: 'portfolio-strip',
    mediaId: 68,
    sourceUrl: `${PUBLIC}/bg_portfolio.jpg`,
    destKey: 'bg_portfolio.webp',
    kind: 'strip',
  },
  // Card images on listing
  {
    label: 'card-montblanc',
    mediaId: 79,
    sourceUrl: `${PUBLIC}/preview_montblanc_5.jpg`,
    destKey: 'preview_montblanc_5.webp',
    kind: 'card',
  },
  {
    label: 'card-pro-interior',
    mediaId: 81,
    sourceUrl: `${PUBLIC}/preview_interior_7.jpg`,
    destKey: 'preview_interior_7.webp',
    kind: 'card',
  },
  {
    label: 'card-ai-audit',
    mediaId: 120,
    sourceUrl: `${PUBLIC}/c99366f0-2501-4cb7-b0ad-35507d809e9b/case-5.jpg`,
    destKey: 'case-5.webp',
    kind: 'card',
  },
  {
    label: 'card-ai-consultant',
    mediaId: 125,
    sourceUrl: `${PUBLIC}/3204761e-b783-45a5-96aa-0497b3cb885f/Card-Image_ai.jpg`,
    destKey: 'Card-Image_ai.webp',
    kind: 'card',
  },
  {
    label: 'card-rosso',
    mediaId: 137,
    sourceUrl: `${PUBLIC}/dbdaf981-da43-44a2-8a33-e4b8de4d8579/Композиция-3.jpg`,
    destKey: 'rosso-card.webp',
    kind: 'card',
  },
  // Mobile heroes (huge JPEGs referenced from project props / case pages)
  {
    label: 'mobile-ai-audit',
    mediaId: 123,
    sourceUrl: `${PUBLIC}/bb5174a3-b352-4e11-a280-cb34730d9e19/Imac-Mockup-04.jpg`,
    destKey: 'Imac-Mockup-04.webp',
    kind: 'mobile',
  },
  {
    label: 'mobile-ai-consultant',
    mediaId: 126,
    sourceUrl: `${PUBLIC}/5a95c3d0-cf79-4062-bff1-f8a19d2ccbdc/Card-Image_ai_mobile.jpg`,
    destKey: 'Card-Image_ai_mobile.webp',
    kind: 'mobile',
  },
  {
    label: 'mobile-rosso',
    mediaId: 135,
    sourceUrl: `${PUBLIC}/6caf13fd-8168-4c8a-bd4d-d0f2218e6f4d/Композиция-2.jpg`,
    destKey: 'rosso-mobile.webp',
    kind: 'mobile',
  },
]

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: KEY, secretAccessKey: SECRET },
})

async function loadSource(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

/** @param {Buffer} input @param {Kind} kind */
async function compress(input, kind) {
  let pipeline = sharp(input)
  if (kind === 'strip') {
    pipeline = pipeline.resize(1920, 150, { fit: 'cover', position: 'centre' })
  } else if (kind === 'card') {
    // Listing cards: aspect ~370/310, up to ~100vw on mobile
    pipeline = pipeline.resize(800, 670, { fit: 'cover', position: 'centre' })
  } else {
    // Mobile case heroes: portrait, cap long edge
    pipeline = pipeline.resize(1080, 1920, { fit: 'inside', withoutEnlargement: true })
  }
  const body = await pipeline.webp({ quality: 74, effort: 6 }).toBuffer()
  const meta = await sharp(body).metadata()
  return {
    body,
    width: meta.width || 0,
    height: meta.height || 0,
    filesize: body.length,
  }
}

async function main() {
  console.log(APPLY ? 'APPLY' : 'DRY-RUN', { bucket: BUCKET, public: PUBLIC })

  const client = new pg.Client({ connectionString: DB, ssl: { rejectUnauthorized: false } })
  await client.connect()

  try {
    for (const job of JOBS) {
      const raw = await loadSource(job.sourceUrl)
      const { body, width, height, filesize } = await compress(raw, job.kind)
      const publicUrl = `${PUBLIC}/${job.destKey}`
      const before = raw.length

      const row = await client.query(
        `select id, filename, url, mime_type, filesize, width, height, _objectkey
         from media where id = $1`,
        [job.mediaId],
      )
      const media = row.rows[0]
      if (!media) {
        console.warn('\n—', job.label, 'skip: no media id', job.mediaId)
        continue
      }

      console.log('\n—', job.label, `(${job.kind})`)
      console.log(
        '  before',
        before,
        'B → after',
        filesize,
        'B',
        `(${((1 - filesize / before) * 100).toFixed(0)}% smaller)`,
        `${width}x${height}`,
      )
      console.log('  media', media.id, media.filename)
      console.log('  dest', publicUrl)

      if (!APPLY) continue

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: job.destKey,
          Body: body,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      )
      console.log('  uploaded')

      // Flat key: `_objectkey` must stay NULL (PIT-133).
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
        [job.mediaId, job.destKey, publicUrl, filesize, width, height],
      )
      console.log('  updated media id', job.mediaId)
    }
  } finally {
    await client.end()
  }

  console.log(
    '\nDone.',
    APPLY
      ? 'Save Site Settings / any portfolio project in admin (or revalidate site-content) so ISR picks up new URLs.'
      : 'Re-run with --apply to write.',
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
