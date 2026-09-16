import { createHmac } from 'crypto'

import type { ConsultLocale, TranslateResult, TranslateStyle } from './types'

/**
 * Client for the Translater pipeline (Docker on the VPS, reached through Caddy).
 *
 * The browser never talks to it — only `POST /api/consult` does, so the URL and
 * the shared secret must never become `NEXT_PUBLIC_*`. When the service is
 * unreachable the caller keeps the original wording rather than guessing:
 * a wrong Hebrew term in a brief is worse than a Russian one.
 */

const DEFAULT_URL = 'https://translate.erythro.ai/api/translate'
const TERM_TIMEOUT_MS = 15_000
const BRIEF_TIMEOUT_MS = 60_000

export function translateUrl(): string {
  const raw = process.env.CONSULT_TRANSLATE_URL?.trim()
  if (raw === '') return ''
  return raw || DEFAULT_URL
}

export function isTranslaterConfigured(): boolean {
  return Boolean(translateUrl())
}

function signBody(body: string): string | null {
  const secret = process.env.CONSULT_TRANSLATE_SECRET?.trim()
  if (!secret) return null
  return createHmac('sha256', secret).update(body).digest('hex')
}

type TranslaterResponse = {
  text?: string
  translation?: string
}

/**
 * `UI/Microcopy` is used for single terms inside the chat, `Documentation/RFC`
 * for a whole brief. Source language is always Russian (the analyst language);
 * `locale` is the target.
 */
export async function translateViaService(input: {
  text: string
  locale: ConsultLocale
  style: TranslateStyle
}): Promise<TranslateResult> {
  const url = translateUrl()
  if (!url || input.locale === 'ru' || !input.text.trim()) {
    return { text: input.text, status: 'skipped' }
  }

  const body = JSON.stringify({
    text: input.text,
    source: 'ru',
    target: input.locale,
    style: input.style,
  })
  const signature = signBody(body)
  const timeout = input.style === 'Documentation/RFC' ? BRIEF_TIMEOUT_MS : TERM_TIMEOUT_MS

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(signature ? { 'X-Erythro-Signature': `sha256=${signature}` } : {}),
      },
      body,
      signal: AbortSignal.timeout(timeout),
    })
    if (!res.ok) {
      console.error('[consult/translate] service returned', res.status)
      return { text: input.text, status: 'skipped' }
    }
    const json = (await res.json()) as TranslaterResponse
    const text = (json.text || json.translation || '').trim()
    if (!text) return { text: input.text, status: 'skipped' }
    return { text, status: 'translated' }
  } catch (err) {
    console.error(
      '[consult/translate] unreachable:',
      err instanceof Error ? err.message : String(err),
    )
    return { text: input.text, status: 'skipped' }
  }
}
