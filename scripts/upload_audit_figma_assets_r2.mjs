/**
 * One-shot: upload local public/templates/figma-assets → R2 assets/figma-assets/
 * Usage: npx tsx scripts/upload_audit_figma_assets_r2.mjs
 */
import dotenv from 'dotenv'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

dotenv.config({ path: '.env.local' })
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const localDir = path.join(root, 'public', 'templates', 'figma-assets')
const prefix = 'assets/figma-assets'

const TYPES = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
}

const accountId = process.env.R2_ACCOUNT_ID?.trim()
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
const bucket = process.env.R2_BUCKET?.trim() || 'erythro-audit-reports'
if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error('Missing R2 env')
  process.exit(1)
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
})

const files = await fs.readdir(localDir)
let uploaded = 0
for (const name of files) {
  const ext = path.extname(name).toLowerCase()
  const contentType = TYPES[ext]
  if (!contentType) {
    console.warn('skip', name)
    continue
  }
  const body = await fs.readFile(path.join(localDir, name))
  const key = `${prefix}/${name}`
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )
  console.log('ok', key, body.length)
  uploaded += 1
}
console.log(JSON.stringify({ uploaded, prefix, bucket }))
