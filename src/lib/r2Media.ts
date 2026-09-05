/**
 * Cloudflare R2 config for Payload `media` (separate from audit reports).
 * Bucket: `erythro-media` (WEUR). Public URLs require r2.dev / custom domain.
 */

import { getR2Endpoint } from '@/lib/r2'

export const R2_MEDIA_BUCKET_DEFAULT = 'erythro-media'

export type R2MediaConfig = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  /** Public base, e.g. https://pub-xxx.r2.dev or https://media.erythro.ai */
  publicBaseUrl: string
  endpoint: string
}

/** True when R2 media is fully configured (including a public serve URL). */
export function isR2MediaEnabled(): boolean {
  return getR2MediaConfig() !== null
}

export function getR2MediaConfig(): R2MediaConfig | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  const bucket = process.env.R2_MEDIA_BUCKET?.trim() || R2_MEDIA_BUCKET_DEFAULT
  const publicBaseUrl = process.env.R2_MEDIA_PUBLIC_BASE_URL?.trim()

  if (!accountId || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
    return null
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ''),
    endpoint: getR2Endpoint(accountId),
  }
}

export function buildR2MediaPublicUrl(key: string, config: R2MediaConfig): string {
  const normalized = key.replace(/^\/+/, '')
  return `${config.publicBaseUrl}/${normalized}`
}
