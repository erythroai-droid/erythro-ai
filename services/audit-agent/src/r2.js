/**
 * Cloudflare R2 env helpers (mirror of src/lib/r2.ts for the standalone worker).
 */

export const R2_AUDIT_BUCKET_DEFAULT = 'erythro-audit-reports'

export function getR2Endpoint(accountId) {
  return `https://${accountId}.r2.cloudflarestorage.com`
}

export function getR2Config() {
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
