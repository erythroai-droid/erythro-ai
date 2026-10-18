'use client'

import Script from 'next/script'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { TurnstileAction } from '@/lib/turnstile'

const SITE_KEY = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '').trim()
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileWidgetId = string

type TurnstileLanguage = 'en' | 'ru' | 'he'

function turnstileLanguage(locale: string): TurnstileLanguage {
  if (locale === 'ru' || locale === 'he') return locale
  return 'en'
}

export function isTurnstileSiteKeyConfigured(): boolean {
  return SITE_KEY.length > 0
}

export type TurnstileHandle = {
  reset: () => void
}

export const TurnstileField = forwardRef<
  TurnstileHandle,
  {
    action: TurnstileAction
    theme: 'light' | 'dark' | 'auto'
    locale: string
    onToken: (token: string) => void
    className?: string
    /**
     * Wait for focus/pointer inside the parent form before loading the
     * Turnstile script (ads LP — keep api.js off the first paint).
     */
    deferUntilInteraction?: boolean
  }
>(function TurnstileField(
  { action, theme, locale, onToken, className, deferUntilInteraction = false },
  ref,
) {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<TurnstileWidgetId | null>(null)
  const onTokenRef = useRef(onToken)
  onTokenRef.current = onToken
  const language = turnstileLanguage(locale)
  const [armed, setArmed] = useState(!deferUntilInteraction)

  useEffect(() => {
    if (armed || !deferUntilInteraction) return
    const shell = shellRef.current
    const target = shell?.closest('form') ?? shell
    if (!target) return

    const arm = () => setArmed(true)
    target.addEventListener('focusin', arm)
    target.addEventListener('pointerdown', arm)
    return () => {
      target.removeEventListener('focusin', arm)
      target.removeEventListener('pointerdown', arm)
    }
  }, [armed, deferUntilInteraction])

  const renderWidget = useCallback(() => {
    const api = window.turnstile
    const el = containerRef.current
    if (!api || !el || !SITE_KEY || widgetIdRef.current !== null) return
    widgetIdRef.current = api.render(el, {
      sitekey: SITE_KEY,
      action,
      theme,
      size: 'flexible',
      language,
      callback: (token) => onTokenRef.current(token),
      'expired-callback': () => onTokenRef.current(''),
      'error-callback': () => onTokenRef.current(''),
    })
  }, [action, theme, language])

  useImperativeHandle(ref, () => ({
    reset: () => {
      const id = widgetIdRef.current
      if (id && window.turnstile) {
        window.turnstile.reset(id)
      }
      onTokenRef.current('')
    },
  }))

  useEffect(() => {
    if (!armed) return
    renderWidget()
    return () => {
      const id = widgetIdRef.current
      widgetIdRef.current = null
      if (id && window.turnstile) {
        try {
          window.turnstile.remove(id)
        } catch {
          /* widget already gone */
        }
      }
    }
  }, [armed, renderWidget])

  if (!SITE_KEY) return null

  const isLight = theme === 'light'
  const shell = isLight ? '#fafafa' : '#313131'

  return (
    <>
      {armed ? (
        <Script
          id="cf-turnstile"
          src={SCRIPT_SRC}
          strategy="afterInteractive"
          onReady={renderWidget}
        />
      ) : null}
      <div
        ref={shellRef}
        className={`turnstile-field w-full overflow-hidden border ps-4 pe-4 py-3 ${
          isLight ? 'turnstile-field--light border-coal-900/15' : 'border-white/15'
        } ${className ?? 'rounded-[80px]'}`}
        style={{ backgroundColor: shell }}
        aria-hidden={!armed}
      >
        {/*
          Widget chrome lives in a closed-shadow iframe (65px). Overlay CSS
          cannot paint over it, so crop the 1px light stroke on all sides.
        */}
        <div
          className="turnstile-field-clip overflow-hidden"
          style={{
            backgroundColor: shell,
            height: 63,
            transform: 'translateZ(0)',
          }}
        >
          <div
            ref={containerRef}
            className="turnstile-field-host w-full"
            style={{
              height: 65,
              marginTop: -1,
              width: 'calc(100% + 4px)',
              marginInline: -2,
              fontSize: 0,
              lineHeight: 0,
            }}
          />
        </div>
      </div>
    </>
  )
})

TurnstileField.displayName = 'TurnstileField'
