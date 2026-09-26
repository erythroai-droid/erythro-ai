import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { paymentCopy } from '@/lib/payments/returnCopy'
import { getRequestPrefs } from '@/lib/requestPrefs'

export const dynamic = 'force-dynamic'

interface CancelPageProps {
  searchParams: Promise<{ slug?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const { initialLocale } = await getRequestPrefs()
  return {
    title: `${paymentCopy('cancelTitle', initialLocale)} | Erythro.ai`,
    robots: { index: false, follow: false },
  }
}

export default async function PaymentCancelPage({ searchParams }: CancelPageProps) {
  const params = await searchParams
  const { initialLocale } = await getRequestPrefs()
  const slug = (params.slug || '').replace(/[^a-z0-9-]/gi, '')
  const orderHref = slug ? `/order/${slug}` : '/'
  const dir = initialLocale === 'he' ? 'rtl' : 'ltr'

  return (
    <div dir={dir} lang={initialLocale} className="flex min-h-screen items-center justify-center bg-coal-900 px-6 text-white">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-white/60">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M18 6 6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="mb-3 font-sans text-3xl font-bold uppercase tracking-[0.04em]">
          {paymentCopy('cancelTitle', initialLocale)}
        </h1>
        <p className="mx-auto max-w-md text-base leading-7 text-white/70">
          {paymentCopy('cancelBody', initialLocale)}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={orderHref}
            className="inline-flex items-center justify-center rounded-[40px] border border-gold-500 bg-gold-500 px-8 py-3 text-sm font-semibold uppercase tracking-widest text-coal-900 transition-colors hover:border-gold-400 hover:bg-gold-400"
          >
            {paymentCopy('tryAgain', initialLocale)}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-[40px] border border-white/20 px-8 py-3 text-sm uppercase tracking-widest text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            {paymentCopy('home', initialLocale)}
          </Link>
        </div>
      </div>
    </div>
  )
}
