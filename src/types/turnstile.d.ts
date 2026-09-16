/**
 * One ambient shape for the Cloudflare Turnstile script.
 *
 * Two call sites share `window.turnstile` — the visible field on the forms and
 * the chat's invisible `execute` widget — and TypeScript only merges repeated
 * `Window` declarations when the property types are identical. Declaring it
 * once here keeps them from fighting.
 */
type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      action: string
      callback: (token: string) => void
      appearance?: 'always' | 'execute' | 'interaction-only'
      theme?: 'light' | 'dark' | 'auto'
      size?: 'normal' | 'flexible' | 'compact' | 'invisible'
      language?: string
      'expired-callback'?: () => void
      'error-callback'?: () => void
    },
  ) => string
  execute: (widgetId: string, options?: { action?: string }) => void
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

interface Window {
  turnstile?: TurnstileApi
}
