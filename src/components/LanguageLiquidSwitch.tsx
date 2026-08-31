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

const UKFlag = ({ className = 'w-[14px] h-[9.5px]' }: { className?: string }) => (
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

const RUFlag = ({ className = 'w-[14px] h-[9.5px]' }: { className?: string }) => (
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

const ILFlag = ({ className = 'w-[14px] h-[9.5px]' }: { className?: string }) => (
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
  { label: string; name: string; Flag: React.FC<{ className?: string }> }
> = {
  en: { label: 'English', name: 'English', Flag: UKFlag },
  ru: { label: 'Русский', name: 'Русский', Flag: RUFlag },
  he: { label: 'עברית', name: 'עברית', Flag: ILFlag },
}

const ALL_LOCALES: LocaleCode[] = ['en', 'ru', 'he']

export default function LanguageLiquidSwitch({
  currentLocale,
  setLocale,
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

  const liquidFill = '#0d0d0d'
  const liquidShadow = '0 4px 14px rgba(0, 0, 0, 0.5)'

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex h-[30px] w-[30px] items-center justify-center select-none pointer-events-auto ${className}`}
    >
      <Liquid
        blur={5}
        contrast={18}
        fill={liquidFill}
        shadow={liquidShadow}
        className="relative h-[30px] w-[30px] overflow-visible"
      >
        {/* Left-Down Language Option */}
        <Liquid.Item
          x={open ? -22 : 0}
          y={open ? 32 : 0}
          transition="bouncy"
          className="absolute inset-0 flex h-[30px] w-[30px] items-center justify-center"
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
                className={`flex h-[30px] w-[30px] items-center justify-center rounded-full bg-coal-900 shadow-md transition-all duration-300 cursor-pointer hover:bg-coal-500 ${
                  open
                    ? 'pointer-events-auto opacity-100 scale-100'
                    : 'pointer-events-none opacity-0 scale-50'
                }`}
                aria-label={`Switch to ${config.name}`}
                title={config.name}
              >
                <Flag className="h-[9.5px] w-[14px] shrink-0" />
              </button>
            )
          })()}
        </Liquid.Item>

        {/* Right-Down Language Option */}
        <Liquid.Item
          x={open ? 22 : 0}
          y={open ? 32 : 0}
          transition="bouncy"
          delay={35}
          className="absolute inset-0 flex h-[30px] w-[30px] items-center justify-center"
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
                className={`flex h-[30px] w-[30px] items-center justify-center rounded-full bg-coal-900 shadow-md transition-all duration-300 cursor-pointer hover:bg-coal-500 ${
                  open
                    ? 'pointer-events-auto opacity-100 scale-100'
                    : 'pointer-events-none opacity-0 scale-50'
                }`}
                aria-label={`Switch to ${config.name}`}
                title={config.name}
              >
                <Flag className="h-[9.5px] w-[14px] shrink-0" />
              </button>
            )
          })()}
        </Liquid.Item>

        {/* Primary/Trigger Button (Top Center) */}
        <Liquid.Item
          x={0}
          y={0}
          className="absolute inset-0 z-10 flex h-[30px] w-[30px] items-center justify-center"
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
            className={`group/lang relative flex h-[30px] w-[30px] items-center justify-center rounded-full shadow-md transition-all duration-300 cursor-pointer ${
              open
                ? 'bg-coal-500'
                : 'bg-coal-900 hover:bg-coal-500'
            }`}
          >
            <ActiveFlag className="h-[9.5px] w-[14px] shrink-0 transition-transform duration-200 group-hover/lang:scale-105" />
          </button>
        </Liquid.Item>
      </Liquid>
    </div>
  )
}
