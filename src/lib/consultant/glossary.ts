import type { ConsultLocale } from './types'

/**
 * Slim RU → EN/HE glossary inlined into the system prompt. It covers the
 * idioms where a literal translation produces nonsense in a brief; anything
 * outside this list goes through the `translate_terms` tool instead of being
 * guessed by the model.
 */
export const IT_GLOSSARY: Array<{ ru: string; en: string; he: string; note?: string }> = [
  { ru: 'ручка (API)', en: 'endpoint', he: 'endpoint', note: 'не handle / knob' },
  { ru: 'накатить (релиз/миграцию)', en: 'deploy / apply', he: 'לפרוס', note: 'не roll on' },
  { ru: 'под капотом', en: 'under the hood', he: 'מאחורי הקלעים' },
  { ru: 'костыль', en: 'workaround', he: 'פתרון עקיף', note: 'не crutch' },
  { ru: 'заглушка', en: 'stub / placeholder', he: 'stub' },
  { ru: 'прод', en: 'production', he: 'פרודקשן' },
  { ru: 'выкатка', en: 'rollout', he: 'הטמעה' },
  { ru: 'откат', en: 'rollback', he: 'rollback' },
  { ru: 'лид', en: 'lead', he: 'ליד', note: 'не lead engineer' },
  { ru: 'личный кабинет', en: 'customer portal / account area', he: 'אזור אישי' },
  { ru: 'админка', en: 'admin panel', he: 'ממשק ניהול' },
  { ru: 'правки', en: 'revisions', he: 'תיקונים' },
  { ru: 'ТЗ', en: 'technical brief / SOW', he: 'מסמך אפיון' },
  { ru: 'сроки', en: 'timeline', he: 'לוח זמנים', note: 'не deadlines, если дата не согласована' },
  { ru: 'бэк / фронт', en: 'backend / frontend', he: 'בקאנד / פרונטאנד' },
  { ru: 'интеграция', en: 'integration', he: 'אינטגרציה' },
  { ru: 'воронка', en: 'funnel', he: 'פאנל שיווקי' },
  { ru: 'нагрузка', en: 'load / traffic', he: 'עומס' },
]

export function glossaryForPrompt(locale: ConsultLocale): string {
  if (locale === 'ru') {
    return IT_GLOSSARY.map((row) => `- ${row.ru}${row.note ? ` (${row.note})` : ''}`).join('\n')
  }
  const target = locale === 'he' ? 'he' : 'en'
  return IT_GLOSSARY.map((row) => {
    const hint = row.note ? ` — ${row.note}` : ''
    return `- ${row.ru} → ${row[target]}${hint}`
  }).join('\n')
}

/** Terms that must never be improvised: trigger `translate_terms` instead. */
export function isGlossaryTerm(value: string): boolean {
  const needle = value.trim().toLowerCase()
  if (!needle) return false
  return IT_GLOSSARY.some(
    (row) =>
      row.ru.toLowerCase().includes(needle) ||
      row.en.toLowerCase().includes(needle) ||
      needle.includes(row.ru.toLowerCase()),
  )
}
