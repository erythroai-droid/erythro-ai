'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { BorderBeam } from 'border-beam'

import './consultant.css'
import { defaultConsultantLabels, type ConsultantLabels } from './labels'
import { useConsultTurnstile } from './turnstile'
import { readConsultStream, type ConsultEscalationTarget } from '@/lib/consultant/stream'
import type { ConsultMessage, ConsultPart } from '@/lib/consultant/types'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'

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
  action:
    | { kind: 'ask'; text: string; /** Open the OTP gate after sending (brief / tech). */ gate?: 'otp' }
    | { kind: 'escalate'; target: ConsultEscalationTarget }
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
  /** WhatsApp FAB in the panel corner. Contacts / Telegram stay on the site chrome. */
  footerActions?: ConsultantChip[]
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
/** Keep in sync with `.consult` transform duration. */
const SLIDE_MS = 850
const TYPE_MS = 48

/** Same beam as the audit form card (`AuditFormShell`). */
const COMPOSER_BEAM_STYLE = {
  '--pulse-glow-boost': 1.45,
  '--beam-glow-brightness': 1.15,
} as CSSProperties

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function textOf(parts: ConsultPart[]): string {
  return parts
    .map((part) => (part.type === 'text' ? part.text : ''))
    .filter(Boolean)
    .join('\n')
}

/** Escape + a tiny markdown subset so **bold** and line breaks show as intended. */
function formatBubble(text: string) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />')
  return <span dangerouslySetInnerHTML={{ __html: escaped }} />
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
  footerActions = [],
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
  // after that the server-side session is the record. Restore after mount so the
  // always-present overlay does not hydrate with sessionStorage on the server.
  const [messages, setMessages] = useState<ConsultMessage[]>([])
  const [draftReady, setDraftReady] = useState(false)
  const [draft, setDraft] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [notices, setNotices] = useState<Notice[]>([])
  const [otpStage, setOtpStage] = useState<OtpStage>('none')
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpBusy, setOtpBusy] = useState(false)
  const [verified, setVerified] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [typedCount, setTypedCount] = useState(0)
  const [typedAssistant, setTypedAssistant] = useState('')
  const [liveAnswer, setLiveAnswer] = useState(false)
  const [slideOpen, setSlideOpen] = useState(false)

  const listRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { container: turnstileContainer, getToken } = useConsultTurnstile(
    turnstileSiteKey,
    locale,
  )

  const resolveToken = useCallback(async () => {
    if (getTurnstileToken) return getTurnstileToken()
    return getToken()
  }, [getTurnstileToken, getToken])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setSlideOpen(false)
      return
    }
    // After paint so a first mount-while-open still runs translateY(100%) → 0.
    // Double rAF: the overlay may be inserted in this commit; one frame is not
    // always enough for the closed transform to become the transition start.
    let inner = 0
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setSlideOpen(true))
    })
    return () => {
      window.cancelAnimationFrame(outer)
      window.cancelAnimationFrame(inner)
    }
  }, [isOpen])

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(storageKey)
      if (raw) setMessages(JSON.parse(raw) as ConsultMessage[])
    } catch {
      /* quota / private mode */
    }
    setDraftReady(true)
  }, [storageKey])

  useEffect(() => {
    if (!draftReady) return
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-MAX_STORED)))
    } catch {
      /* quota / private mode */
    }
  }, [draftReady, messages, storageKey])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, notices, streaming, typedAssistant])

  useLockBodyScroll(isOpen)

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      setRevealed(false)
      return
    }
    const reduce = prefersReducedMotion()
    if (reduce) {
      setRevealed(true)
      return
    }
    const id = window.setTimeout(() => setRevealed(true), SLIDE_MS)
    return () => window.clearTimeout(id)
  }, [isOpen])

  const greetingUnits = useMemo(() => Array.from(labels.greeting), [labels.greeting])

  useEffect(() => {
    if (!isOpen) {
      setTypedCount(0)
      return
    }
    if (!revealed) return
    if (prefersReducedMotion()) {
      setTypedCount(greetingUnits.length)
      return
    }
    setTypedCount(0)
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setTypedCount(i)
      if (i >= greetingUnits.length) window.clearInterval(id)
    }, TYPE_MS)
    return () => window.clearInterval(id)
  }, [greetingUnits, isOpen, revealed])

  const lastMessage = messages[messages.length - 1]
  const assistantTarget =
    lastMessage?.role === 'assistant' ? textOf(lastMessage.parts) : ''
  const assistantTargetUnits = useMemo(
    () => Array.from(assistantTarget),
    [assistantTarget],
  )

  useEffect(() => {
    if (!liveAnswer) return
    const typedUnits = Array.from(typedAssistant)
    if (typedUnits.length >= assistantTargetUnits.length) {
      if (typedAssistant !== assistantTarget) setTypedAssistant(assistantTarget)
      if (!streaming) setLiveAnswer(false)
      return
    }
    if (prefersReducedMotion()) {
      setTypedAssistant(assistantTarget)
      if (!streaming) setLiveAnswer(false)
      return
    }
    const id = window.setTimeout(() => {
      setTypedAssistant(assistantTargetUnits.slice(0, typedUnits.length + 1).join(''))
    }, TYPE_MS)
    return () => window.clearTimeout(id)
  }, [assistantTarget, assistantTargetUnits, liveAnswer, streaming, typedAssistant])

  useEffect(() => {
    if (!isOpen || !revealed || otpStage !== 'none') return
    inputRef.current?.focus()
  }, [isOpen, otpStage, revealed])

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
      setTypedAssistant('')
      setLiveAnswer(true)
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

        const contentType = response.headers.get('content-type') || ''
        if (!response.body || !contentType.includes('text/event-stream')) {
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

  const activateChip = useCallback(
    (chip: ConsultantChip) => {
      if (chip.action.kind === 'ask') {
        if (chip.action.gate === 'otp') setOtpStage('email')
        void send(chip.action.text)
        return
      }
      onEscalate?.({ target: chip.action.target })
    },
    [onEscalate, send],
  )

  const idle = messages.length === 0 && notices.length === 0
  const composing = draft.trim().length > 0 || otpStage !== 'none'
  const dir = rtl ? 'rtl' : 'ltr'
  const openClass = isOpen && slideOpen ? ' consult--open' : ''
  const idleClass = idle ? ' consult--idle' : ''
  const dockEndClass = !idle || composing ? ' consult--dock-end' : ''
  const revealedClass = revealed ? ' consult--revealed' : ''
  const typedGreeting = revealed ? greetingUnits.slice(0, typedCount).join('') : ''
  const typingDone = typedCount >= greetingUnits.length
  const whatsAppAction = footerActions.find(
    (action) => action.action.kind === 'escalate' && action.action.target === 'whatsapp',
  )

  if (!mounted) return null

  return createPortal(
    <div
      className={`consult${openClass}${idleClass}${dockEndClass}${revealedClass}`}
      dir={dir}
      role="dialog"
      aria-modal={isOpen}
      aria-hidden={!isOpen}
      aria-label={labels.title}
      inert={!isOpen}
    >
      <div className="consult__topbar">
        <button
          type="button"
          className="consult__close"
          onClick={onClose}
          aria-label={labels.closeLabel}
        >
          <span className="consult__closeText">{labels.closeLabel}</span>
          <svg
            className="consult__closeIcon"
            width="21"
            height="12"
            viewBox="-4 -6 29 24"
            fill="none"
            overflow="visible"
            aria-hidden
          >
            <path
              d="M5 1C5 0.447715 5.44772 0 6 0H20C20.5523 0 21 0.447715 21 1V1C21 1.55228 20.5523 2 20 2H6C5.44772 2 5 1.55228 5 1V1Z"
              fill="currentColor"
            />
            <path
              d="M0 6C0 5.44772 0.447715 5 1 5H15C15.5523 5 16 5.44772 16 6V6C16 6.55228 15.5523 7 15 7H1C0.447715 7 0 6.55228 0 6V6Z"
              fill="currentColor"
            />
            <path
              d="M5 11C5 10.4477 5.44772 10 6 10H20C20.5523 10 21 10.4477 21 11V11C21 11.5523 20.5523 12 20 12H6C5.44772 12 5 11.5523 5 11V11Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <div className="consult__stage">
        <div className="consult__list" ref={listRef} data-modal-scroll>
          {!idle && (
            <article className="consult__bubble consult__bubble--assistant">
              {labels.greeting}
            </article>
          )}

          {messages.map((message, index) => {
            const full = textOf(message.parts)
            const isLiveAssistant =
              liveAnswer && message.role === 'assistant' && index === messages.length - 1
            const shown = isLiveAssistant ? typedAssistant : full
            if (isLiveAssistant && !shown) return null
            const stillTyping = isLiveAssistant && shown !== full
            return (
              <article
                key={`${message.role}-${index}`}
                className={`consult__bubble consult__bubble--${message.role}`}
              >
                {shown ? formatBubble(shown) : null}
                {stillTyping ? <span className="consult__caret" /> : null}
              </article>
            )
          })}

          {streaming && !typedAssistant && (
            <p className="consult__typing">{labels.thinking}</p>
          )}

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
                {labels.savePolicy ? <p className="consult__gateIntro">{labels.savePolicy}</p> : null}
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

        <div className="consult__dock">
          {idle && (
            <div className="consult__intro">
              <p className="consult__greeting" aria-label={labels.greeting}>
                <span className="consult__greetingGhost" aria-hidden>
                  {labels.greeting}
                </span>
                <span className="consult__greetingLive" aria-hidden>
                  {typedGreeting}
                  {revealed && !typingDone ? (
                    <span className="consult__caret" />
                  ) : null}
                </span>
              </p>
            </div>
          )}

          <div className="consult__composerWrap audit-beam-hue">
            <BorderBeam
              size="pulse-outside"
              colorVariant="colorful"
              strength={0.7}
              duration={2.2}
              theme="dark"
              className="consult__composerBeam"
              style={COMPOSER_BEAM_STYLE}
            >
              <form
                className="consult__composer"
                onSubmit={(event) => {
                  event.preventDefault()
                  void send(draft)
                }}
              >
                {(features.voice || features.files) && renderComposerExtras?.()}
                <input
                  ref={inputRef}
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
                  className="consult__send"
                  disabled={streaming || !draft.trim() || otpStage !== 'none'}
                  aria-label={labels.send}
                >
                  <svg className="consult__sendIcon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M3.4 20.6 20.5 12 3.4 3.4l.1 6.6 12 2-12 2z" />
                  </svg>
                </button>
              </form>
            </BorderBeam>
          </div>

          {idle && (
            <p className="consult__disclaimer">{labels.disclaimer}</p>
          )}

          {chips.length > 0 && (
            <div className="consult__chips">
              {chips.map((chip) => (
                <button
                  type="button"
                  key={chip.id}
                  className="consult__chip"
                  onClick={() => activateChip(chip)}
                  disabled={streaming}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {whatsAppAction && (
        <div className="consult__wa">
          <span className="consult__waPing" aria-hidden />
          <button
            type="button"
            className="consult__waBtn"
            onClick={() => activateChip(whatsAppAction)}
            aria-label={whatsAppAction.label}
          >
            <WhatsAppGlyph />
          </button>
        </div>
      )}

      <div ref={turnstileContainer} className="consult__turnstile" aria-hidden />
      {verified && <span className="consult__srOnly">{labels.otpVerified}</span>}
    </div>,
    document.body,
  )
}
