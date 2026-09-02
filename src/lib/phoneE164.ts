import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js'

export type { CountryCode }

/** Israeli HQ default; RU UI still often serves CIS numbers. */
const PRIORITY_COUNTRIES: CountryCode[] = [
  'IL',
  'RU',
  'UA',
  'US',
  'DE',
  'GB',
  'FR',
  'CY',
  'GE',
  'KZ',
  'BY',
  'PL',
  'AE',
  'TR',
]

export function defaultPhoneCountry(locale: string): CountryCode {
  if (locale === 'ru') return 'RU'
  return 'IL'
}

export function toE164Phone(raw: string, defaultCountry?: CountryCode): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry)
  if (!parsed?.isValid()) return null
  return parsed.number
}

export function isE164Phone(raw: string): boolean {
  const trimmed = raw.trim()
  return Boolean(trimmed) && isValidPhoneNumber(trimmed)
}

/** Digits for wa.me / tel: from a stored E.164 (or loose) value. */
export function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function whatsAppHref(raw: string): string | null {
  const digits = phoneDigits(raw)
  if (digits.length < 8) return null
  return `https://wa.me/${digits}`
}

export type PhoneCountryOption = {
  code: CountryCode
  callingCode: string
  name: string
}

export function listPhoneCountries(locale: string): PhoneCountryOption[] {
  const lang = locale === 'he' ? 'he' : locale === 'ru' ? 'ru' : 'en'
  const display = new Intl.DisplayNames([lang], { type: 'region' })
  const all = getCountries().map((code) => ({
    code,
    callingCode: String(getCountryCallingCode(code)),
    name: display.of(code) || code,
  }))
  const priority = new Set(PRIORITY_COUNTRIES)
  const head = PRIORITY_COUNTRIES.map((code) => all.find((row) => row.code === code)).filter(
    (row): row is PhoneCountryOption => Boolean(row),
  )
  const tail = all
    .filter((row) => !priority.has(row.code))
    .sort((a, b) => a.name.localeCompare(b.name, lang))
  return [...head, ...tail]
}
