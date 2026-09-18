'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Invisible Turnstile for the chat.
 *
 * A visible challenge per chat message would be unusable, and tokens are
 * single-use — so each mint is a fresh widget. `reset()` on a solved widget
 * fires `expired-callback` with an empty string; treating that as the token
 * sent `POST /api/consult` 403 and the unavailable notice (PIT-094).
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
      if (window.turnstile) {
        resolve()
        return
      }
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

    if (widgetIdRef.current !== null) {
      try {
        api.remove(widgetIdRef.current)
      } catch {
        /* already gone */
      }
      widgetIdRef.current = null
      node.replaceChildren()
    }

    return new Promise<string>((resolve) => {
      let settled = false
      const finish = (token: string) => {
        if (settled) return
        settled = true
        resolve(token)
      }

      const timer = window.setTimeout(() => finish(''), EXECUTE_TIMEOUT_MS)

      try {
        widgetIdRef.current = api.render(node, {
          sitekey: siteKey,
          action: 'consult',
          appearance: 'execute',
          size: 'invisible',
          language: locale,
          callback: (token) => {
            if (!token) return
            window.clearTimeout(timer)
            finish(token)
          },
          // `reset()` / expiry must not resolve an in-flight mint with ''.
          'expired-callback': () => undefined,
          'error-callback': () => undefined,
        })
        const widgetId = widgetIdRef.current
        if (!widgetId) {
          window.clearTimeout(timer)
          finish('')
          return
        }
        api.execute(widgetId, { action: 'consult' })
      } catch {
        window.clearTimeout(timer)
        finish('')
      }
    })
  }, [siteKey, locale])

  return { container, getToken }
}
