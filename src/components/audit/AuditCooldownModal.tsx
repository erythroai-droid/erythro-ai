'use client'

import React, { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'

export type AuditCooldownModalProps = {
  locale: string
  message: string
  /** Prominent remaining time, e.g. "6 дней 3 часа 12 минут". */
  remainingLabel: string
  closeLabel: string
  onClose: () => void
}

function cooldownCopy(locale: string) {
  if (locale === 'ru') {
    return {
      title: 'Лимит бесплатного аудита',
      nextLabel: 'Следующая бесплатная проверка через',
    }
  }
  if (locale === 'he') {
    return {
      title: 'מגבלת בדיקה חינמית',
      nextLabel: 'הבדיקה החינמית הבאה בעוד',
    }
  }
  return {
    title: 'Free audit limit',
    nextLabel: 'Next free check available in',
  }
}

export default function AuditCooldownModal({
  locale,
  message,
  remainingLabel,
  closeLabel,
  onClose,
}: AuditCooldownModalProps) {
  const titleId = useId()
  const isRtl = locale === 'he'
  const copy = cooldownCopy(locale)
  useLockBodyScroll(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center overflow-hidden overscroll-none p-4 sm:p-6"
      dir={isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm"
      />
      <div className="relative max-h-[90vh] min-w-0 w-full max-w-[520px] overflow-hidden rounded-[12px] border border-white/10 bg-coal-900">
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute top-4 end-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4 4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <div
          data-modal-scroll
          className="faq-accordion-scroll max-h-[90vh] min-w-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain p-5 sm:p-8"
        >
          <div className="py-6 text-center" role="alertdialog" aria-live="assertive">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-erythro-500/20 text-erythro-500">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 8v5m0 3h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2
              id={titleId}
              className="mb-3 font-sans text-xl font-bold uppercase tracking-[0.04em] text-white"
            >
              {copy.title}
            </h2>
            <p className="mx-auto mb-2 max-w-[420px] text-sm text-white/60 leading-6">{copy.nextLabel}</p>
            <p className="mx-auto mb-4 max-w-[420px] font-sans text-2xl font-semibold tracking-wide text-gold-500 sm:text-3xl">
              {remainingLabel}
            </p>
            <p className="mx-auto max-w-[420px] text-sm text-white/80 leading-6">{message}</p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-[40px] border border-white/20 px-8 py-3 text-sm uppercase tracking-widest text-white/80 transition-colors hover:border-white/40 hover:text-white"
              >
                {closeLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
