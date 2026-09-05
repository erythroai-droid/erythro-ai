'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AsYouType, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'
import { contactForm } from '@/translations'
import { FieldOkCheck } from '@/components/FieldOkCheck'
import {
  defaultPhoneCountry,
  isE164Phone,
  listPhoneCountries,
  toE164Phone,
} from '@/lib/phoneE164'

function tForm(locale: string, field: Record<string, string>): string {
  return field[locale] || field.en
}

/** Territories that share a parent-country flag on flagcdn. */
const FLAG_CODE_ALIASES: Partial<Record<CountryCode, string>> = {
  AC: 'sh',
  TA: 'sh',
}

function countryFlagUrl(code: CountryCode, width: 40 | 80): string {
  const iso = (FLAG_CODE_ALIASES[code] || code).toLowerCase()
  return `https://flagcdn.com/w${width}/${iso}.png`
}

function CountryFlag({ code }: { code: CountryCode }) {
  return (
    <img
      src={countryFlagUrl(code, 40)}
      srcSet={`${countryFlagUrl(code, 40)} 1x, ${countryFlagUrl(code, 80)} 2x`}
      alt=""
      width={20}
      height={15}
      draggable={false}
      className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover"
      loading="lazy"
      decoding="async"
      aria-hidden
    />
  )
}

function formatNational(country: CountryCode, raw: string): string {
  return new AsYouType(country).input(raw)
}

function nationalDigits(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function PhoneE164Field({
  id,
  locale,
  value,
  onChange,
  invalid,
  describedBy,
  placeholder,
  variant,
  isLight = false,
  showOk = false,
  required = true,
  split = false,
  onBlur,
}: {
  id: string
  locale: string
  value: string
  onChange: (next: string) => void
  invalid?: boolean
  describedBy?: string
  placeholder: string
  variant: 'pill' | 'box'
  isLight?: boolean
  showOk?: boolean
  /** HTML required. Off for optional contact-form phones. */
  required?: boolean
  /** Top border on small screens when this field shares a pill with a sibling. */
  split?: boolean
  onBlur?: () => void
}) {
  const fallbackCountry = defaultPhoneCountry(locale)
  const countries = useMemo(() => listPhoneCountries(locale), [locale])
  const [country, setCountry] = useState<CountryCode>(() => {
    const parsed = parsePhoneNumberFromString(value)
    return parsed?.country || fallbackCountry
  })
  const [national, setNational] = useState(() => {
    const parsed = parsePhoneNumberFromString(value)
    return parsed ? parsed.formatNational() : value
  })
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const listId = `${id}-countries`
  const countryId = `${id}-country`
  const callingCode = countries.find((row) => row.code === country)?.callingCode || ''

  useEffect(() => {
    if (!value) {
      setNational('')
      return
    }
    if (!isE164Phone(value)) return
    const parsed = parsePhoneNumberFromString(value)
    if (!parsed) return
    if (parsed.country) setCountry(parsed.country)
    const formatted = parsed.formatNational()
    setNational((current) => (current === formatted ? current : formatted))
  }, [value])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    searchRef.current?.focus()
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return countries
    return countries.filter((row) => {
      return (
        row.name.toLowerCase().includes(q) ||
        row.code.toLowerCase().includes(q) ||
        row.callingCode.includes(q.replace(/^\+/, ''))
      )
    })
  }, [countries, query])

  const emit = (nextCountry: CountryCode, nextNational: string) => {
    const trimmed = nextNational.trim()
    if (!trimmed) {
      onChange('')
      return
    }
    onChange(toE164Phone(trimmed, nextCountry) || trimmed)
  }

  const handleCountry = (next: CountryCode) => {
    const digits = nationalDigits(national)
    const nextNational = formatNational(next, digits)
    setCountry(next)
    setNational(nextNational)
    setOpen(false)
    setQuery('')
    emit(next, nextNational)
  }

  const handleNational = (raw: string) => {
    if (raw.trim().startsWith('+')) {
      const parsed = parsePhoneNumberFromString(raw)
      if (parsed?.country) {
        setCountry(parsed.country)
        const formatted = parsed.isValid() ? parsed.formatNational() : formatNational(parsed.country, raw)
        setNational(formatted)
        emit(parsed.country, parsed.isValid() ? parsed.number : raw)
        return
      }
    }
    const formatted = formatNational(country, raw)
    setNational(formatted)
    emit(country, formatted)
  }

  const pill = variant === 'pill'
  const triggerClass = pill
    ? `flex h-12 shrink-0 items-center gap-1.5 bg-transparent ps-4 pe-2 text-sm sm:h-[52px] ${
        isLight ? 'text-coal-900' : 'text-white'
      } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-erythro-500`
    : 'flex h-full shrink-0 items-center gap-1.5 bg-transparent ps-3.5 pe-2 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-erythro-500'
  const inputClass = pill
    ? `audit-pill-phone-input h-12 min-w-0 flex-1 border-0 bg-transparent ps-1 text-sm outline-none sm:h-[52px] ${
        showOk ? 'pe-10' : 'pe-4'
      } ${
        isLight
          ? 'text-coal-900 placeholder:text-coal-900/40'
          : 'text-white placeholder:text-white/40'
      } rtl:placeholder:text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-erythro-500`
    : `h-full min-w-0 flex-1 border-0 bg-transparent py-2.5 ps-1 text-sm text-white placeholder:text-white/40 outline-none ${
        showOk ? 'pe-10' : 'pe-3.5'
      } rtl:placeholder:text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-erythro-500`
  const shellClass = pill
    ? `relative flex min-w-0 flex-1 flex-row items-stretch ${
        split ? `border-t sm:border-t-0 ${isLight ? 'border-coal-900/15' : 'border-white/15'}` : ''
      }`
    : `relative flex min-w-0 flex-row items-stretch overflow-visible rounded-[10px] border ${
        invalid ? 'border-erythro-500' : 'border-white/15 focus-within:border-gold-500'
      } bg-white/[0.04]`

  return (
    <div ref={rootRef} className={shellClass} dir="ltr">
      <div className="shrink-0">
        <label htmlFor={countryId} className="sr-only">
          {tForm(locale, contactForm.countryCode)}
        </label>
        <button
          id={countryId}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((current) => !current)}
          className={`${triggerClass} cursor-pointer`}
        >
          <span dir="ltr" className="flex items-center gap-1.5">
            <CountryFlag code={country} />
            <span>+{callingCode}</span>
          </span>
          <svg
            className={`h-3.5 w-3.5 opacity-60 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <path
              d="m5 7.5 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <label htmlFor={id} className="sr-only">
        {tForm(locale, contactForm.phone)}
      </label>
      <input
        id={id}
        name="phone"
        type="tel"
        inputMode="tel"
        required={required}
        value={national}
        onChange={(event) => handleNational(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={inputClass}
        autoComplete="tel-national"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        dir="ltr"
        aria-required="true"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      />
      <FieldOkCheck show={showOk} isLight={isLight} />
      {open ? (
        <div
          dir={locale === 'he' ? 'rtl' : 'ltr'}
          className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-[16px] bg-coal-500 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
        >
          <div className="px-4 pb-1 pt-1.5">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tForm(locale, contactForm.searchCountry)}
              className="w-full rounded-md border-0 bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none rtl:placeholder:text-right"
              autoComplete="off"
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={countryId}
            className="faq-accordion-scroll max-h-56 overflow-y-auto"
          >
            {filtered.map((row) => {
              const selected = row.code === country
              return (
                <li key={row.code} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleCountry(row.code)}
                    className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-start text-sm transition-colors ${
                      selected ? 'text-gold-500' : 'text-white'
                    } hover:bg-gold-500 hover:text-coal-900`}
                  >
                    <CountryFlag code={row.code} />
                    <span className="min-w-0 flex-1 truncate">{row.name}</span>
                    <span dir="ltr" className="shrink-0 opacity-80">
                      +{row.callingCode}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
