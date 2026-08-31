/**
 * Cloudflare R2 env helpers for AI Audit reports.
 * Bucket (created 2026-08-31): erythro-audit-reports (WEUR).
 *
 * API tokens are created in Cloudflare Dashboard → R2 → Manage R2 API Tokens
 * (Object Read & Write on this bucket). Never commit secrets.
 */

export const R2_AUDIT_BUCKET_DEFAULT = 'erythro-audit-reports'

export type R2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  /** Optional public base, e.g. https://reports.erythro.ai or r2.dev URL */
  publicBaseUrl?: string
}

export function getR2Endpoint(accountId: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com`
}

/** Returns null if required secrets are missing (upload paths should no-op / fail soft). */
export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  const bucket = process.env.R2_BUCKET?.trim() || R2_AUDIT_BUCKET_DEFAULT
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim() || undefined

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl }
}

export function buildR2ObjectUrl(key: string, config: R2Config): string {
  const normalized = key.replace(/^\/+/, '')
  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl.replace(/\/+$/, '')}/${normalized}`
  }
  return `${getR2Endpoint(config.accountId)}/${config.bucket}/${normalized}`
}

/** Read object body as UTF-8 text (for serving audit HTML when CMS htmlResult is empty). */
export async function getR2ObjectText(key: string): Promise<string | null> {
  const config = getR2Config()
  if (!config) return null
  const normalized = key.replace(/^\/+/, '')
  try {
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')
    const client = new S3Client({
      region: 'auto',
      endpoint: getR2Endpoint(config.accountId),
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
    const res = await client.send(
      new GetObjectCommand({ Bucket: config.bucket, Key: normalized }),
    )
    const bytes = await res.Body?.transformToByteArray()
    if (!bytes) return null
    return Buffer.from(bytes).toString('utf8')
  } catch (err) {
    console.error('[r2] getObject failed:', err instanceof Error ? err.message : err)
    return null
  }
}
