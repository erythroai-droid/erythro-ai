import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cookies } from 'next/headers'

const COPY = {
  en: {
    title: '404',
    message: 'This page could not be found.',
    home: 'Back home',
  },
  ru: {
    title: '404',
    message: 'Страница не найдена.',
    home: 'На главную',
  },
  he: {
    title: '404',
    message: 'העמוד לא נמצא.',
    home: 'חזרה הביתה',
  },
} as const

type Locale = keyof typeof COPY

function resolveLocale(value?: string): Locale {
  if (value === 'ru' || value === 'he') return value
  return 'en'
}

export default async function NotFound() {
  const cookieStore = await cookies()
  const locale = resolveLocale(cookieStore.get('NEXT_LOCALE')?.value)
  const t = COPY[locale]

  return (
    <div
      dir={locale === 'he' ? 'rtl' : 'ltr'}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-coal-900 text-white"
    >
      <Image
        src="/images/broken_chip.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-coal-900/55 via-coal-900/35 to-coal-900/70"
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-[720px] flex-col items-center gap-6 px-[30px] py-16 text-center">
        <h1 className="m-0 font-sans text-[clamp(72px,18vw,140px)] font-bold leading-none tracking-tight text-white">
          {t.title}
        </h1>
        <p className="m-0 max-w-[420px] font-sans text-base font-light leading-7 text-gold-100/90 md:text-lg">
          {t.message}
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex h-12 min-w-[183px] items-center justify-center rounded-[40px] border border-gold-500 px-10 text-xs font-medium uppercase tracking-[2.4px] text-gold-500 transition-all duration-300 hover:border-gold-200 hover:bg-gold-200 hover:text-coal-900"
        >
          {t.home}
        </Link>
      </div>
    </div>
  )
}
