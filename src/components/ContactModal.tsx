'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { contactForm } from '@/translations'

interface ContactModalContextValue {
  open: () => void
  close: () => void
}

const ContactModalContext = createContext<ContactModalContextValue>({
  open: () => {},
  close: () => {},
})

/** Opens/closes the global contact form modal from any CTA button. */
export function useContactModal(): ContactModalContextValue {
  return useContext(ContactModalContext)
}

type Status = 'idle' | 'sending' | 'success' | 'error'

export function ContactModalProvider({
  locale,
  children,
}: {
  locale: string
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <ContactModalContext.Provider value={{ open, close }}>
      {children}
      {isOpen && <ContactModal locale={locale} onClose={close} />}
    </ContactModalContext.Provider>
  )
}

function ContactModal({ locale, onClose }: { locale: string; onClose: () => void }) {
  const t = (field: Record<string, string>) => field[locale] || field['en']
  const form = contactForm
  const isRtl = locale === 'he'

  const [status, setStatus] = useState<Status>('idle')
  const [values, setValues] = useState({ name: '', email: '', phone: '', message: '' })
  const firstFieldRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    try {
      const draft = sessionStorage.getItem('erythro_order_draft')
      if (draft) {
        setValues((v) => ({ ...v, message: draft }))
        sessionStorage.removeItem('erythro_order_draft')
      }
    } catch {
      /* ignore */
    }
  }, [])

  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstFieldRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, locale }),
      })
      if (!res.ok) throw new Error('Request failed')
      setStatus('success')
      setValues({ name: '', email: '', phone: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  const inputClass =
    'w-full rounded-[12px] border border-white/15 bg-white/[0.04] px-4 py-3 text-white placeholder:text-white/40 outline-none transition-colors focus:border-gold-500 focus:bg-white/[0.06]'

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
      dir={isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-label={t(form.title)}
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label={t(form.close)}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      {/* Panel */}
      <div className="relative max-h-[90vh] w-full max-w-[460px] overflow-y-auto rounded-[20px] border border-white/10 bg-coal-900 p-6 sm:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <button
          type="button"
          onClick={onClose}
          aria-label={t(form.close)}
          // Logical `end` keeps the close button in the corner opposite where
          // the heading text starts: top-right for LTR, top-left for RTL (he),
          // so it never overlaps the right-aligned Hebrew title.
          className="absolute top-4 end-4 flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4 4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {status !== 'success' && (
          <h2 className="mb-6 max-w-[85%] font-semibold normal-case tracking-normal text-[22px] leading-snug text-gold-100 sm:text-[24px]">
            {t(form.title)}
          </h2>
        )}

        {status === 'success' ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-white/85">{t(form.success)}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-[40px] border border-gold-500 px-8 py-3 text-sm uppercase tracking-widest text-gold-500 transition-colors hover:bg-gold-500 hover:text-coal-900"
            >
              {t(form.close)}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <input
              ref={firstFieldRef}
              name="name"
              type="text"
              required
              value={values.name}
              onChange={handleChange}
              placeholder={t(form.name)}
              className={inputClass}
              autoComplete="name"
            />
            <input
              name="email"
              type="email"
              required
              value={values.email}
              onChange={handleChange}
              placeholder={t(form.email)}
              className={inputClass}
              autoComplete="email"
              dir="ltr"
            />
            <input
              name="phone"
              type="tel"
              value={values.phone}
              onChange={handleChange}
              placeholder={t(form.phone)}
              className={inputClass}
              autoComplete="tel"
              dir="ltr"
            />
            <textarea
              name="message"
              required
              value={values.message}
              onChange={handleChange}
              placeholder={t(form.message)}
              rows={4}
              className={`${inputClass} resize-none`}
            />

            {status === 'error' && (
              <p className="text-sm text-erythro-500">{t(form.error)}</p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="mt-2 w-full rounded-[40px] bg-erythro-500 px-8 py-3.5 text-sm font-medium uppercase tracking-widest text-white transition-all hover:shadow-[0_3px_20px_0_rgba(255,233,199,0.30)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'sending' ? t(form.sending) : t(form.submit)}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
