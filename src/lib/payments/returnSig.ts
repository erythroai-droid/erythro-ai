import { createHmac } from 'node:crypto'
import { timingSafeStringEqual } from '@/lib/agentAuth'

function secret(): string {
  return process.env.PAYLOAD_SECRET?.trim() || ''
}

/** HMAC for the browser return URL. The sequential submission id is not a secret by itself. */
export function signPaymentReturn(submissionId: string): string {
  const key = secret()
  if (!key) throw new Error('[payplus] PAYLOAD_SECRET is required to sign the return URL')
  return createHmac('sha256', key).update(`payplus-return:${submissionId}`).digest('base64url')
}

export function verifyPaymentReturn(
  submissionId: string | null | undefined,
  signature: string | null | undefined,
): boolean {
  const id = submissionId?.trim() || ''
  const sig = signature?.trim() || ''
  const key = secret()
  if (!id || !sig || !key || !/^\d+$/.test(id)) return false
  const expected = createHmac('sha256', key).update(`payplus-return:${id}`).digest('base64url')
  return timingSafeStringEqual(expected, sig)
}
