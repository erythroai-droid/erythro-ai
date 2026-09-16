'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Invisible Turnstile for the chat.
 *
 * A visible challenge per chat message would be unusable, and tokens are
 * single-use — so the widget keeps one managed instance in `execute` mode and
 * mints a fresh token per request. Hosts that already own a token source can
 * pass `getTurnstileToken` instead and skip this entirely.
 */

const SCRIPT_ID = 'cf-turnstile-consult'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const EXECUTE_TIMEOUT_MS = 12_000

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  if (window.turnstile) return Promise.resolve()

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('turnstile failed')), {
        once: true,
      })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('turnstile failed'))
    document.head.appendChild(script)
  })
}

export function useConsultTurnstile(
  siteKey: string | undefined,
  locale: string,
): { container: (node: HTMLDivElement | null) => void; getToken: () => Promise<string> } {
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const pendingRef = useRef<((token: string) => void) | null>(null)

  const container = useCallback((node: HTMLDivElement | null) => {
    nodeRef.current = node
  }, [])

  useEffect(() => {
    return () => {
      const id = widgetIdRef.current
      widgetIdRef.current = null
      if (id && window.turnstile) {
        try {
          window.turnstile.remove(id)
        } catch {
          /* already gone */
        }
      }
    }
  }, [])

  const getToken = useCallback(async (): Promise<string> => {
    if (!siteKey) return ''
    try {
      await loadScript()
    } catch {
      return ''
    }
    const api = window.turnstile
    const node = nodeRef.current
    if (!api || !node) return ''

    if (widgetIdRef.current === null) {
      widgetIdRef.current = api.render(node, {
        sitekey: siteKey,
        action: 'consult',
        appearance: 'execute',
        size: 'invisible',
        language: locale,
        callback: (token) => pendingRef.current?.(token),
        'expired-callback': () => pendingRef.current?.(''),
        'error-callback': () => pendingRef.current?.(''),
      })
    }

    const widgetId = widgetIdRef.current
    return new Promise<string>((resolve) => {
      let settled = false
      const finish = (token: string) => {
        if (settled) return
        settled = true
        pendingRef.current = null
        resolve(token)
      }
      pendingRef.current = finish
      // A stuck challenge must not freeze the composer; the server still has
      // IP limits and the anonymous quota.
      setTimeout(() => finish(''), EXECUTE_TIMEOUT_MS)
      try {
        api.reset(widgetId)
        api.execute(widgetId, { action: 'consult' })
      } catch {
        finish('')
      }
    })
  }, [siteKey, locale])

  return { container, getToken }
}
