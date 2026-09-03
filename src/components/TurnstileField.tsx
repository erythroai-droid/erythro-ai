'use client'

import Script from 'next/script'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import type { TurnstileAction } from '@/lib/turnstile'

const SITE_KEY = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '').trim()
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileWidgetId = string

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      action: string
      theme: 'light' | 'dark' | 'auto'
      size: 'normal' | 'flexible' | 'compact'
      callback: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
    },
  ) => TurnstileWidgetId
  reset: (widgetId: TurnstileWidgetId) => void
  remove: (widgetId: TurnstileWidgetId) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
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
    onToken: (token: string) => void
    className?: string
  }
>(function TurnstileField({ action, theme, onToken, className }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<TurnstileWidgetId | null>(null)
  const onTokenRef = useRef(onToken)
  onTokenRef.current = onToken

  const renderWidget = useCallback(() => {
    const api = window.turnstile
    const el = containerRef.current
    if (!api || !el || !SITE_KEY || widgetIdRef.current !== null) return
    widgetIdRef.current = api.render(el, {
      sitekey: SITE_KEY,
      action,
      theme,
      size: 'flexible',
      callback: (token) => onTokenRef.current(token),
      'expired-callback': () => onTokenRef.current(''),
      'error-callback': () => onTokenRef.current(''),
    })
  }, [action, theme])

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
  }, [renderWidget])

  if (!SITE_KEY) return null

  const isLight = theme === 'light'
  const shell = isLight ? '#fafafa' : '#313131'

  return (
    <>
      <Script
        id="cf-turnstile"
        src={SCRIPT_SRC}
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div
        className={`turnstile-field w-full overflow-hidden border ps-4 pe-4 py-3 ${
          isLight ? 'turnstile-field--light border-coal-900/15' : 'border-white/15'
        } ${className ?? 'rounded-[80px]'}`}
        style={{ backgroundColor: shell }}
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
