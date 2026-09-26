'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  paymentCopy,
  type PaymentViewStatus,
} from '@/lib/payments/returnCopy'
import type { SiteLocale } from '@/lib/sitePrefs'

type Props = {
  locale: SiteLocale
  initialStatus: PaymentViewStatus
  submissionId: string
  signature: string
  ticketId: string
  reportHref: string
  retryHref: string
}

function Mark({ status }: { status: PaymentViewStatus }) {
  if (status === 'paid') {
    return (
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }
  if (status === 'pending') {
    return (
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gold-500 text-gold-500">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-current border-e-transparent" />
      </div>
    )
  }
  return (
    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-white/60">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export default function PaymentReturn({
  locale,
  initialStatus,
  submissionId,
  signature,
  ticketId,
  reportHref,
  retryHref,
}: Props) {
  const [status, setStatus] = useState<PaymentViewStatus>(initialStatus)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (initialStatus !== 'pending' || !submissionId || !signature) return
    let attempts = 0
    let stopped = false
    const timer = window.setInterval(async () => {
      attempts += 1
      if (attempts > 15) {
        if (!stopped) setSlow(true)
        window.clearInterval(timer)
        return
      }
      try {
        const res = await fetch(
          `/api/payment/status?id=${encodeURIComponent(submissionId)}&sig=${encodeURIComponent(signature)}`,
          { cache: 'no-store' },
        )
        const json = (await res.json()) as { status?: PaymentViewStatus }
        if (stopped || !json.status || json.status === 'pending' || json.status === 'unknown') return
        setStatus(json.status)
        window.clearInterval(timer)
      } catch {
        // Keep the pending copy until the next tick.
      }
    }, 2000)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [initialStatus, signature, submissionId])

  const titleKey =
    status === 'paid'
      ? 'paidTitle'
      : status === 'pending'
        ? 'pendingTitle'
        : status === 'failed'
          ? 'failedTitle'
          : status === 'refunded'
            ? 'refundedTitle'
            : 'unknownTitle'
  const bodyKey =
    status === 'paid'
      ? 'paidBody'
      : status === 'pending'
        ? slow
          ? 'pendingSlow'
          : 'pendingBody'
        : status === 'failed'
          ? 'failedBody'
          : status === 'refunded'
            ? 'refundedBody'
            : 'unknownBody'

  const dir = locale === 'he' ? 'rtl' : 'ltr'

  return (
    <div dir={dir} lang={locale} className="flex min-h-screen items-center justify-center bg-coal-900 px-6 text-white">
      <div className="w-full max-w-lg text-center">
        <Mark status={status} />
        <h1 className="mb-3 font-sans text-3xl font-bold uppercase tracking-[0.04em]">
          {paymentCopy(titleKey, locale)}
        </h1>
        <p className="mx-auto max-w-md text-base leading-7 text-white/70">{paymentCopy(bodyKey, locale)}</p>
        {ticketId && status !== 'unknown' ? (
          <p className="mt-4 text-sm text-white/60">
            <span className="text-gold-500">{paymentCopy('orderId', locale)}:</span>{' '}
            <code className="font-mono tracking-wide text-white">{ticketId}</code>
          </p>
        ) : null}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {status === 'paid' && reportHref ? (
            <Link
              href={reportHref}
              className="inline-flex items-center justify-center rounded-[40px] border border-gold-500 bg-gold-500 px-8 py-3 text-sm font-semibold uppercase tracking-widest text-coal-900 transition-colors hover:border-gold-400 hover:bg-gold-400"
            >
              {paymentCopy('viewStatus', locale)}
            </Link>
          ) : null}
          {status === 'failed' && retryHref ? (
            <Link
              href={retryHref}
              className="inline-flex items-center justify-center rounded-[40px] border border-gold-500 bg-gold-500 px-8 py-3 text-sm font-semibold uppercase tracking-widest text-coal-900 transition-colors hover:border-gold-400 hover:bg-gold-400"
            >
              {paymentCopy('tryAgain', locale)}
            </Link>
          ) : null}
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-[40px] border border-white/20 px-8 py-3 text-sm uppercase tracking-widest text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            {paymentCopy('home', locale)}
          </Link>
        </div>
      </div>
    </div>
  )
}
