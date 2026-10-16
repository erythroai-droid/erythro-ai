'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Liquid } from 'liquid-gooey'

export type LocaleCode = 'en' | 'ru' | 'he'

interface LanguageLiquidSwitchProps {
  currentLocale: string
  setLocale: (locale: string) => void
  isDark?: boolean
  className?: string
}

/** 20% larger than the original 14×9.5 flag. */
const FLAG_CLASS = 'h-[11.4px] w-[16.8px] shrink-0'

const UKFlag = ({ className = FLAG_CLASS }: { className?: string }) => (
  <svg
    viewBox="0 0 60 40"
    className={`${className} overflow-hidden rounded-[1.5px] shadow-[0_1px_2px_rgba(0,0,0,0.35)]`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <rect width="60" height="40" fill="#012169" />
    <path d="M0 0L60 40M60 0L0 40" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="square" />
    <path d="M0 0L60 40M60 0L0 40" stroke="#C8102E" strokeWidth="4" strokeLinecap="square" />
    <path d="M30 0V40M0 20H60" stroke="#FFFFFF" strokeWidth="12" />
    <path d="M30 0V40M0 20H60" stroke="#C8102E" strokeWidth="7.2" />
    <rect x="0.5" y="0.5" width="59" height="39" rx="1.5" stroke="#FFFFFF" strokeOpacity="0.25" fill="none" />
  </svg>
)

const RUFlag = ({ className = FLAG_CLASS }: { className?: string }) => (
  <svg
    viewBox="0 0 60 40"
    className={`${className} overflow-hidden rounded-[1.5px] shadow-[0_1px_2px_rgba(0,0,0,0.35)]`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <rect y="0" width="60" height="13.33" fill="#FFFFFF" />
    <rect y="13.33" width="60" height="13.33" fill="#0039A6" />
    <rect y="26.66" width="60" height="13.34" fill="#D52B1E" />
    <rect x="0.5" y="0.5" width="59" height="39" rx="1.5" stroke="#FFFFFF" strokeOpacity="0.2" fill="none" />
  </svg>
)

const ILFlag = ({ className = FLAG_CLASS }: { className?: string }) => (
  <svg
    viewBox="0 0 60 40"
    className={`${className} overflow-hidden rounded-[1.5px] shadow-[0_1px_2px_rgba(0,0,0,0.35)]`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <rect width="60" height="40" fill="#FFFFFF" />
    <rect y="5.5" width="60" height="5" fill="#0038B8" />
    <rect y="29.5" width="60" height="5" fill="#0038B8" />
    <polygon
      points="30,12 36.5,23.5 23.5,23.5"
      fill="none"
      stroke="#0038B8"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <polygon
      points="30,28 36.5,16.5 23.5,16.5"
      fill="none"
      stroke="#0038B8"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <rect x="0.5" y="0.5" width="59" height="39" rx="1.5" stroke="#000000" strokeOpacity="0.1" fill="none" />
  </svg>
)

const LOCALE_CONFIG: Record<
  LocaleCode,
  { code: string; name: string; Flag: React.FC<{ className?: string }> }
> = {
  en: { code: 'en', name: 'English', Flag: UKFlag },
  ru: { code: 'ru', name: 'Русский', Flag: RUFlag },
  he: { code: 'he', name: 'עברית', Flag: ILFlag },
}

const ALL_LOCALES: LocaleCode[] = ['en', 'ru', 'he']

/** Flag + code chip size (wider than the old 30px circle). */
const CHIP = 'h-[30px] w-[52px]'

function chipClass(open: boolean, isDark: boolean, kind: 'trigger' | 'option') {
  const visibility =
    kind === 'option'
      ? open
        ? 'pointer-events-auto opacity-100 scale-100'
        : 'pointer-events-none opacity-0 scale-50'
      : ''
  const tone = isDark
    ? open && kind === 'trigger'
      ? 'text-gold-500'
      : 'text-white hover:text-gold-500'
    : open && kind === 'trigger'
      ? 'text-erythro-500'
      : 'text-coal-900 hover:text-erythro-500'
  return `inline-flex ${CHIP} items-center justify-center gap-1.5 bg-transparent shadow-none transition-all duration-300 cursor-pointer ${tone} ${visibility}`
}

export default function LanguageLiquidSwitch({
  currentLocale,
  setLocale,
  isDark = true,
  className = '',
}: LanguageLiquidSwitchProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const activeLocale: LocaleCode = (
    ALL_LOCALES.includes(currentLocale as LocaleCode) ? currentLocale : 'en'
  ) as LocaleCode

  const otherLocales = ALL_LOCALES.filter((l) => l !== activeLocale)
  const ActiveFlag = LOCALE_CONFIG[activeLocale].Flag

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex ${CHIP} items-center justify-center select-none pointer-events-auto ${className}`}
    >
      <Liquid
        blur={5}
        contrast={18}
        fill="transparent"
        shadow="none"
        className={`relative ${CHIP} overflow-visible`}
      >
        {/* Left-Down Language Option */}
        <Liquid.Item
          x={open ? -36 : 0}
          y={open ? 34 : 0}
          transition="bouncy"
          className={`absolute inset-0 flex ${CHIP} items-center justify-center`}
        >
          {(() => {
            const loc = otherLocales[0]
            const config = LOCALE_CONFIG[loc]
            const Flag = config.Flag
            return (
              <button
                type="button"
                onClick={() => {
                  setLocale(loc)
                  setOpen(false)
                }}
                tabIndex={open ? 0 : -1}
                className={chipClass(open, isDark, 'option')}
                aria-label={`Switch to ${config.name}`}
                title={config.name}
              >
                <Flag className={FLAG_CLASS} />
                <span className="font-sans text-[11px] font-medium uppercase tracking-[0.12em]">
                  {config.code}
                </span>
              </button>
            )
          })()}
        </Liquid.Item>

        {/* Right-Down Language Option */}
        <Liquid.Item
          x={open ? 36 : 0}
          y={open ? 34 : 0}
          transition="bouncy"
          delay={35}
          className={`absolute inset-0 flex ${CHIP} items-center justify-center`}
        >
          {(() => {
            const loc = otherLocales[1]
            const config = LOCALE_CONFIG[loc]
            const Flag = config.Flag
            return (
              <button
                type="button"
                onClick={() => {
                  setLocale(loc)
                  setOpen(false)
                }}
                tabIndex={open ? 0 : -1}
                className={chipClass(open, isDark, 'option')}
                aria-label={`Switch to ${config.name}`}
                title={config.name}
              >
                <Flag className={FLAG_CLASS} />
                <span className="font-sans text-[11px] font-medium uppercase tracking-[0.12em]">
                  {config.code}
                </span>
              </button>
            )
          })()}
        </Liquid.Item>

        {/* Primary/Trigger Button (Top Center) */}
        <Liquid.Item
          x={0}
          y={0}
          className={`absolute inset-0 z-10 flex ${CHIP} items-center justify-center`}
        >
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label={
              activeLocale === 'ru'
                ? 'Выбор языка'
                : activeLocale === 'he'
                  ? 'בחירת שפה'
                  : 'Select language'
            }
            className={`group/lang ${chipClass(open, isDark, 'trigger')}`}
          >
            <ActiveFlag className={`${FLAG_CLASS} transition-transform duration-200 group-hover/lang:scale-105`} />
            <span className="font-sans text-[11px] font-medium uppercase tracking-[0.12em]">
              {LOCALE_CONFIG[activeLocale].code}
            </span>
          </button>
        </Liquid.Item>
      </Liquid>
    </div>
  )
}
