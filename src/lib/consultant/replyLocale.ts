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

function localeFromText(text: string): ConsultLocale | null {
  const he = (text.match(HEBREW) || []).length
  const ru = (text.match(CYRILLIC) || []).length
  const latin = (text.match(LATIN) || []).length

  // Mixed "Oracle … на 50 юзеров" stays Russian: any real Cyrillic/Hebrew wins.
  if (he >= 2 && he >= ru) return 'he'
  if (ru >= 2) return 'ru'
  // RU/HE chrome + English question used to need 12 Latin letters, so
  // "How we work?" fell through to the site locale. Two letters is enough
  // once there is no Cyrillic/Hebrew ("Hi", "ok", "How we work").
  if (latin >= 2) return 'en'
  return null
}

/**
 * Reply language follows the visitor's last words, not the site chrome locale.
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
    const detected = localeFromText(text)
    if (detected) return detected
  }
  return fallback
}
