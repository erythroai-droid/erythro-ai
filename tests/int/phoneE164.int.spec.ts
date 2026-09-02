import { describe, expect, it } from 'vitest'
import {
  defaultPhoneCountry,
  isE164Phone,
  listPhoneCountries,
  toE164Phone,
  whatsAppHref,
} from '@/lib/phoneE164'

describe('phoneE164', () => {
  it('defaults country by UI locale', () => {
    expect(defaultPhoneCountry('he')).toBe('IL')
    expect(defaultPhoneCountry('en')).toBe('IL')
    expect(defaultPhoneCountry('ru')).toBe('RU')
  })

  it('parses national Israel and Russia numbers to E.164', () => {
    expect(toE164Phone('050-123-4567', 'IL')).toBe('+972501234567')
    expect(toE164Phone('+972501234567')).toBe('+972501234567')
    expect(toE164Phone('9123456789', 'RU')).toBe('+79123456789')
  })

  it('rejects incomplete or landline-looking junk', () => {
    expect(toE164Phone('+1')).toBeNull()
    expect(toE164Phone('123', 'IL')).toBeNull()
    expect(isE164Phone('+972501234567')).toBe(true)
    expect(isE164Phone('0501234567')).toBe(false)
  })

  it('builds WhatsApp deep link from E.164', () => {
    expect(whatsAppHref('+972501234567')).toBe('https://wa.me/972501234567')
    expect(whatsAppHref('')).toBeNull()
  })

  it('lists Israel first and localizes names', () => {
    const en = listPhoneCountries('en')
    expect(en[0]?.code).toBe('IL')
    expect(en.some((row) => row.callingCode === '972')).toBe(true)
    const ru = listPhoneCountries('ru')
    expect(ru.find((row) => row.code === 'IL')?.name.toLowerCase()).toContain('израил')
  })
})
