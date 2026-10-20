import { describe, expect, it } from 'vitest'
import { pickLocaleFromLanguageTags } from '@/lib/sitePrefs'

describe('pickLocaleFromLanguageTags', () => {
  it('picks the first supported tag in preference order', () => {
    expect(pickLocaleFromLanguageTags(['fr-FR', 'ru-RU', 'en'])).toBe('ru')
    expect(pickLocaleFromLanguageTags(['he-IL', 'en-US'])).toBe('he')
    expect(pickLocaleFromLanguageTags(['en-GB'])).toBe('en')
  })

  it('maps legacy iw to he', () => {
    expect(pickLocaleFromLanguageTags(['iw', 'en'])).toBe('he')
  })

  it('returns null when no supported locale is present', () => {
    expect(pickLocaleFromLanguageTags(['fr-FR', 'de-DE'])).toBeNull()
    expect(pickLocaleFromLanguageTags([])).toBeNull()
  })
})
