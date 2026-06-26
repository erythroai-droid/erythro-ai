import React from 'react'
import { cookies } from 'next/headers'
import './styles.css'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

const SUPPORTED_LOCALES = ['en', 'ru', 'he']

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  const locale = cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale) ? cookieLocale : 'en'

  return (
    <html lang={locale} dir={locale === 'he' ? 'rtl' : 'ltr'}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
