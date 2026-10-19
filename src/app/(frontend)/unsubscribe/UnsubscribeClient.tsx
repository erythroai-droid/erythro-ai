'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { unsubscribeCopy } from '@/lib/mailUnsubscribeCopy'

type Props = {
  locale: string
  token: string | null
  emailMasked: string | null
}

type Phase = 'confirm' | 'done' | 'already' | 'invalid' | 'error'

export default function UnsubscribeClient({ locale, token, emailMasked }: Props) {
  const copy = unsubscribeCopy(locale)
  const dir = locale === 'he' ? 'rtl' : 'ltr'
  const [phase, setPhase] = useState<Phase>(token ? 'confirm' : 'invalid')
  const [busy, setBusy] = useState(false)

  const onConfirm = async () => {
    if (!token || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: token, source: 'pro_offer' }),
        signal: AbortSignal.timeout(15_000),
      })
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        already?: boolean
        code?: string
      } | null
      if (!res.ok || !data?.ok) {
        setPhase(data?.code === 'invalid_token' ? 'invalid' : 'error')
        return
      }
      setPhase(data.already ? 'already' : 'done')
    } catch {
      setPhase('error')
    } finally {
      setBusy(false)
    }
  }

  const title =
    phase === 'done' || phase === 'already'
      ? copy.doneTitle
      : phase === 'invalid' || phase === 'error'
        ? copy.invalidTitle
        : copy.title

  const body =
    phase === 'done'
      ? copy.doneBody
      : phase === 'already'
        ? copy.alreadyBody
        : phase === 'invalid' || phase === 'error'
          ? copy.invalidBody
          : copy.body

  return (
    <div
      dir={dir}
      lang={locale}
      className="flex min-h-screen items-center justify-center bg-[#F4F1EC] px-6 text-coal-900"
    >
      <div className="w-full max-w-lg text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-erythro-500">
          Erythro.ai
        </p>
        <h1 className="mb-3 font-sans text-2xl font-bold tracking-wide md:text-3xl">{title}</h1>
        {emailMasked && phase === 'confirm' ? (
          <p className="mb-2 font-mono text-sm text-coal-900/60" dir="ltr">
            {emailMasked}
          </p>
        ) : null}
        <p className="mx-auto max-w-md text-base leading-7 text-coal-900/75">{body}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {phase === 'confirm' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onConfirm()}
              className="inline-flex items-center justify-center rounded-[40px] border border-erythro-500 bg-erythro-500 px-8 py-3 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:border-erythro-600 hover:bg-erythro-600 disabled:opacity-60"
            >
              {busy ? '…' : copy.confirm}
            </button>
          ) : null}
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-[40px] border border-coal-900/20 px-8 py-3 text-sm uppercase tracking-widest text-coal-900/80 transition-colors hover:border-coal-900/40 hover:text-coal-900"
          >
            {copy.home}
          </Link>
        </div>
      </div>
    </div>
  )
}
