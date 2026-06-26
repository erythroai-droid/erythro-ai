import React from 'react'
import { cookies } from 'next/headers'
import HomeClient from './HomeClient'

const SUPPORTED_LOCALES = ['en', 'ru', 'he']
const DEFAULT_LOCALE = 'en'

export default async function HomePage() {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const initialLocale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  return <HomeClient initialLocale={initialLocale} />
}
