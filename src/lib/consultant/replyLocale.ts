import type { ConsultLocale, ConsultMessage } from './types'

const HEBREW = /[\u0590-\u05FF]/g
const CYRILLIC = /[\u0400-\u04FF]/g
const LATIN = /[A-Za-z]/g

function userText(message: ConsultMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
}

/**
 * Reply language follows the visitor's words, not the site chrome locale.
 * EN homepage + Russian question must not stay locked to "Reply in English only".
 */
export function detectReplyLocale(
  messages: ConsultMessage[],
  fallback: ConsultLocale,
): ConsultLocale {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message.role !== 'user') continue
    const text = userText(message)
    if (!text) continue

    const he = (text.match(HEBREW) || []).length
    const ru = (text.match(CYRILLIC) || []).length
    const latin = (text.match(LATIN) || []).length

    if (he >= 2 && he >= ru) return 'he'
    if (ru >= 2 && ru > he) return 'ru'
    if (latin >= 12 && he === 0 && ru === 0) return 'en'
  }
  return fallback
}
