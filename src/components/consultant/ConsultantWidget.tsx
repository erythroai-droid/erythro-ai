'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import './consultant.css'
import { defaultConsultantLabels, type ConsultantLabels } from './labels'
import { useConsultTurnstile } from './turnstile'
import { readConsultStream, type ConsultEscalationTarget } from '@/lib/consultant/stream'
import type { ConsultMessage, ConsultPart } from '@/lib/consultant/types'

/**
 * Self-contained consultant widget.
 *
 * Themed through `--consult-*` variables rather than project design tokens, so
 * a second app can drop the folder in unchanged. Everything Erythro-specific
 * (chips, escalation targets, copy) arrives as props.
 */

export type ConsultantChip = {
  id: string
  label: string
  /** `ask` sends a canned question; the rest leave the widget. */
  action: { kind: 'ask'; text: string } | { kind: 'escalate'; target: ConsultEscalationTarget }
}

/** All off in v1. The contract exists so enabling them is additive. */
export type ConsultantFeatures = {
  voice?: boolean
  files?: boolean
  humanJoin?: boolean
}

export type ConsultantWidgetProps = {
  isOpen: boolean
  onClose: () => void
  /** Chat endpoint. Defaults to the co-located route. */
  api?: string
  otpRequestApi?: string
  otpVerifyApi?: string
  locale?: string
  rtl?: boolean
  labels?: Partial<ConsultantLabels>
  chips?: ConsultantChip[]
  /** Host decides what a chip does — no `useContactModal` inside the module. */
  onEscalate?: (event: { target: ConsultEscalationTarget; slug?: string }) => void
  turnstileSiteKey?: string
  /** Alternative to `turnstileSiteKey` when the host already holds a token. */
  getTurnstileToken?: () => Promise<string>
  /** Local draft key, used only until the visitor is identified. */
  storageKey?: string
  features?: ConsultantFeatures
  /** Extra composer controls (mic, attach) once those features are enabled. */
  renderComposerExtras?: () => React.ReactNode
}

type Notice =
  | { kind: 'text'; text: string }
  | { kind: 'brief'; markdown: string }
  | { kind: 'sent'; projectNumber: string; crmPending: boolean }

type OtpStage = 'none' | 'email' | 'code'

const MAX_STORED = 30

function textOf(parts: ConsultPart[]): string {
  return parts
    .map((part) => (part.type === 'text' ? part.text : ''))
    .filter(Boolean)
    .join('\n')
}

export default function ConsultantWidget({
  isOpen,
  onClose,
  api = '/api/consult',
  otpRequestApi = '/api/consult/request-otp',
  otpVerifyApi = '/api/consult/verify-otp',
  locale = 'en',
  rtl = false,
  labels: labelOverrides,
  chips = [],
  onEscalate,
  turnstileSiteKey,
  getTurnstileToken,
  storageKey = 'erythro-consult-draft',
  features = {},
  renderComposerExtras,
}: ConsultantWidgetProps) {
  const labels = useMemo<ConsultantLabels>(
    () => ({ ...defaultConsultantLabels, ...labelOverrides }),
    [labelOverrides],
  )

  // Draft transcript survives an accidental close, but only until identification;
  // after that the server-side session is the record. Restoring here rather than
  // in an effect avoids a second render, and costs no hydration mismatch because
  // the panel renders `null` until it is opened.
  const [messages, setMessages] = useState<ConsultMessage[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.sessionStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as ConsultMessage[]) : []
    } catch {
      return [] /* private mode */
    }
  })
  const [draft, setDraft] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [notices, setNotices] = useState<Notice[]>([])
  const [otpStage, setOtpStage] = useState<OtpStage>('none')
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpBusy, setOtpBusy] = useState(false)
  const [verified, setVerified] = useState(false)

  const listRef = useRef<HTMLDivElement | null>(null)
  const { container: turnstileContainer, getToken } = useConsultTurnstile(
    turnstileSiteKey,
    locale,
  )

  const resolveToken = useCallback(async () => {
    if (getTurnstileToken) return getTurnstileToken()
    return getToken()
  }, [getTurnstileToken, getToken])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-MAX_STORED)))
    } catch {
      /* quota / private mode */
    }
  }, [messages, storageKey])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, notices, streaming])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  const pushNotice = useCallback((notice: Notice) => {
    setNotices((prev) => [...prev, notice])
  }, [])

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim()
      if (!clean || streaming) return

      const outgoing: ConsultMessage[] = [
        ...messages,
        { role: 'user', parts: [{ type: 'text', text: clean }] },
      ]
      setMessages(outgoing)
      setDraft('')
      setStreaming(true)
      setNotices([])

      let assistant = ''
      const commitAssistant = () => {
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          const parts: ConsultPart[] = [{ type: 'text', text: assistant }]
          if (last?.role === 'assistant') return [...prev.slice(0, -1), { role: 'assistant', parts }]
          return [...prev, { role: 'assistant', parts }]
        })
      }

      try {
        const token = await resolveToken()
        const response = await fetch(api, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locale,
            messages: outgoing,
            'cf-turnstile-response': token,
          }),
        })

        if (!response.body) {
          pushNotice({ kind: 'text', text: labels.unavailable })
          return
        }

        for await (const event of readConsultStream(response.body)) {
          if (event.type === 'text-delta') {
            assistant += event.delta
            commitAssistant()
          } else if (event.type === 'notice') {
            if (event.code === 'otp_required') setOtpStage('email')
            else if (event.code === 'daily_quota_exhausted') {
              pushNotice({ kind: 'text', text: labels.dailyLimitReached })
            } else if (event.code === 'unconfigured' || event.code === 'rate_limited') {
              pushNotice({ kind: 'text', text: labels.unavailable })
            }
          } else if (event.type === 'action') {
            const action = event.action
            if (action.kind === 'escalate') {
              onEscalate?.({
                target: action.target,
                ...(action.slug ? { slug: action.slug } : {}),
              })
            } else if (action.kind === 'brief_ready') {
              pushNotice({ kind: 'brief', markdown: action.markdown })
            } else if (action.kind === 'brief_sent') {
              pushNotice({
                kind: 'sent',
                projectNumber: action.projectNumber,
                crmPending: action.crmStatus === 'pending',
              })
            } else if (action.kind === 'ticket_created') {
              pushNotice({ kind: 'text', text: labels.ticketCreated })
            }
          } else if (event.type === 'error') {
            pushNotice({ kind: 'text', text: labels.streamFailed })
          }
        }
      } catch {
        pushNotice({ kind: 'text', text: labels.streamFailed })
      } finally {
        setStreaming(false)
      }
    },
    [api, labels, locale, messages, onEscalate, pushNotice, resolveToken, streaming],
  )

  const requestOtp = useCallback(async () => {
    setOtpError('')
    setOtpBusy(true)
    try {
      const token = await resolveToken()
      const response = await fetch(otpRequestApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, locale, 'cf-turnstile-response': token }),
      })
      if (response.ok) {
        setOtpStage('code')
        return
      }
      const payload = (await response.json().catch(() => ({}))) as { message?: string }
      if (payload.message === 'invalid_email') setOtpError(labels.otpInvalidEmail)
      else if (response.status === 429) setOtpError(labels.otpTooMany)
      else setOtpError(labels.otpMailFailed)
    } catch {
      setOtpError(labels.otpMailFailed)
    } finally {
      setOtpBusy(false)
    }
  }, [labels, locale, otpEmail, otpRequestApi, resolveToken])

  const verifyOtp = useCallback(async () => {
    setOtpError('')
    setOtpBusy(true)
    try {
      const response = await fetch(otpVerifyApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpCode }),
      })
      if (response.ok) {
        setOtpStage('none')
        setOtpCode('')
        setVerified(true)
        pushNotice({ kind: 'text', text: labels.otpVerified })
        return
      }
      setOtpError(response.status === 429 ? labels.otpTooMany : labels.otpInvalidCode)
    } catch {
      setOtpError(labels.otpInvalidCode)
    } finally {
      setOtpBusy(false)
    }
  }, [labels, otpCode, otpVerifyApi, pushNotice])

  if (!isOpen) return null

  const dir = rtl ? 'rtl' : 'ltr'

  return (
    <div className="consult" dir={dir} role="dialog" aria-modal="false" aria-label={labels.title}>
      <header className="consult__header">
        <div className="consult__titles">
          <p className="consult__title">{labels.title}</p>
          <p className="consult__disclaimer">{labels.disclaimer}</p>
        </div>
        <button
          type="button"
          className="consult__close"
          onClick={onClose}
          aria-label={labels.closeLabel}
        >
          <span aria-hidden>×</span>
        </button>
      </header>

      <div className="consult__list" ref={listRef}>
        <article className="consult__bubble consult__bubble--assistant">
          {labels.greeting}
        </article>

        {messages.map((message, index) => (
          <article
            key={`${message.role}-${index}`}
            className={`consult__bubble consult__bubble--${message.role}`}
          >
            {textOf(message.parts)}
          </article>
        ))}

        {streaming && <p className="consult__typing">{labels.thinking}</p>}

        {notices.map((notice, index) => {
          if (notice.kind === 'brief') {
            return (
              <section className="consult__panel" key={`brief-${index}`}>
                <h3 className="consult__panelTitle">{labels.briefDraftTitle}</h3>
                <pre className="consult__brief">{notice.markdown}</pre>
                <p className="consult__panelHint">{labels.briefDraftHint}</p>
              </section>
            )
          }
          if (notice.kind === 'sent') {
            return (
              <section className="consult__panel" key={`sent-${index}`}>
                <h3 className="consult__panelTitle">{labels.briefSentTitle}</h3>
                <p className="consult__panelHint">
                  {labels.briefSentBody.replace('{number}', notice.projectNumber)}
                </p>
                {notice.crmPending && (
                  <p className="consult__panelHint">{labels.briefCrmPending}</p>
                )}
              </section>
            )
          }
          return (
            <p className="consult__notice" key={`notice-${index}`}>
              {notice.text}
            </p>
          )
        })}
      </div>

      {otpStage !== 'none' && (
        <section className="consult__gate">
          {otpStage === 'email' ? (
            <>
              <p className="consult__gateIntro">{labels.otpIntro}</p>
              <div className="consult__gateRow">
                <input
                  type="email"
                  className="consult__input"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={labels.otpEmailPlaceholder}
                  value={otpEmail}
                  onChange={(event) => setOtpEmail(event.target.value)}
                  disabled={otpBusy}
                />
                <button
                  type="button"
                  className="consult__button"
                  onClick={requestOtp}
                  disabled={otpBusy || !otpEmail.trim()}
                >
                  {labels.otpEmailSubmit}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="consult__gateIntro">{labels.otpCodeIntro}</p>
              <div className="consult__gateRow">
                {/* Codes stay out of the transcript: a dedicated field, never a chat bubble. */}
                <input
                  type="text"
                  className="consult__input consult__input--code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder={labels.otpCodePlaceholder}
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ''))}
                  disabled={otpBusy}
                />
                <button
                  type="button"
                  className="consult__button"
                  onClick={verifyOtp}
                  disabled={otpBusy || otpCode.length !== 6}
                >
                  {labels.otpCodeSubmit}
                </button>
              </div>
              <button
                type="button"
                className="consult__link"
                onClick={requestOtp}
                disabled={otpBusy}
              >
                {labels.otpResend}
              </button>
            </>
          )}
          {otpError && <p className="consult__error">{otpError}</p>}
        </section>
      )}

      {chips.length > 0 && (
        <div className="consult__chips">
          {chips.map((chip) => (
            <button
              type="button"
              key={chip.id}
              className="consult__chip"
              onClick={() => {
                if (chip.action.kind === 'ask') void send(chip.action.text)
                else onEscalate?.({ target: chip.action.target })
              }}
              disabled={streaming}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <form
        className="consult__composer"
        onSubmit={(event) => {
          event.preventDefault()
          void send(draft)
        }}
      >
        {/* Plugin slot: mic and attachments land here when the flags flip on. */}
        {(features.voice || features.files) && renderComposerExtras?.()}
        <input
          type="text"
          className="consult__input"
          placeholder={labels.inputPlaceholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={streaming || otpStage !== 'none'}
          aria-label={labels.inputPlaceholder}
        />
        <button
          type="submit"
          className="consult__button"
          disabled={streaming || !draft.trim() || otpStage !== 'none'}
        >
          {labels.send}
        </button>
      </form>

      <div ref={turnstileContainer} className="consult__turnstile" aria-hidden />
      {verified && <span className="consult__srOnly">{labels.otpVerified}</span>}
    </div>
  )
}
