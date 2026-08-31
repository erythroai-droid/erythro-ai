import { getR2Config, getR2Endpoint } from './r2.js'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

/** @returns {S3Client | null} */
export function createR2Client() {
  const config = getR2Config()
  if (!config) return null
  return new S3Client({
    region: 'auto',
    endpoint: getR2Endpoint(config.accountId),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

/**
 * Upload HTML report stub to R2.
 * @param {{ key: string, body: string | Buffer, contentType?: string }} input
 * @returns {Promise<{ key: string, url: string }>}
 */
export async function uploadReportObject(input) {
  const config = getR2Config()
  const client = createR2Client()
  if (!config || !client) {
    throw new Error('R2 is not configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)')
  }

  const key = input.key.replace(/^\/+/, '')
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: typeof input.body === 'string' ? Buffer.from(input.body, 'utf8') : input.body,
      ContentType: input.contentType || 'text/html; charset=utf-8',
    }),
  )

  const base = config.publicBaseUrl?.replace(/\/+$/, '')
  const url = base
    ? `${base}/${key}`
    : `${getR2Endpoint(config.accountId)}/${config.bucket}/${key}`

  return { key, url }
}
