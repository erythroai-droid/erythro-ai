'use client'

import { useCallback, useEffect, useRef } from 'react'

/**
 * Invisible Turnstile for the chat.
 *
 * Tokens are single-use. The host lives on `document.body`, not inside
 * `.consult`: that panel uses `transform`, and Cloudflare will not mint a
 * token from a `visibility: hidden` / 0×0 / transformed ancestor (PIT-094).
 */

const SCRIPT_ID = 'cf-turnstile-consult'
const HOST_ID = 'cf-turnstile-consult-host'
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

/** Real box, off the overlay, not `display:none` / `visibility:hidden`. */
function ensureHost(): HTMLDivElement {
  const found = document.getElementById(HOST_ID)
  if (found instanceof HTMLDivElement) return found

  const el = document.createElement('div')
  el.id = HOST_ID
  el.setAttribute('aria-hidden', 'true')
  el.style.cssText = [
    'position:fixed',
    'left:-9999px',
    'top:0',
    'width:300px',
    'height:65px',
    'overflow:hidden',
    'pointer-events:none',
  ].join(';')
  document.body.appendChild(el)
  return el
}

function destroyWidget(api: TurnstileAPI | undefined, id: string | null) {
  if (!api || !id) return
  try {
    api.remove(id)
  } catch {
    /* already gone */
  }
}

type TurnstileAPI = NonNullable<Window['turnstile']>

export function useConsultTurnstile(
  siteKey: string | undefined,
  locale: string,
): { container: (node: HTMLDivElement | null) => void; getToken: () => Promise<string> } {
  const widgetIdRef = useRef<string | null>(null)

  const container = useCallback((_node: HTMLDivElement | null) => {
    /* Host is on document.body — the in-panel node is unused (PIT-094). */
  }, [])

  useEffect(() => {
    return () => {
      destroyWidget(window.turnstile, widgetIdRef.current)
      widgetIdRef.current = null
      document.getElementById(HOST_ID)?.remove()
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
    if (!api) return ''

    const node = ensureHost()
    destroyWidget(api, widgetIdRef.current)
    widgetIdRef.current = null
    node.replaceChildren()

    return new Promise<string>((resolve) => {
      let settled = false
      const finish = (token: string) => {
        if (settled) return
        settled = true
        resolve(token)
      }

      const timer = window.setTimeout(() => finish(''), EXECUTE_TIMEOUT_MS)

      try {
        const widgetId = api.render(node, {
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
          'expired-callback': () => undefined,
          'error-callback': () => {
            if (settled || !widgetIdRef.current) return
            try {
              api.execute(widgetIdRef.current, { action: 'consult' })
            } catch {
              /* timeout still running */
            }
          },
        })
        widgetIdRef.current = widgetId
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
