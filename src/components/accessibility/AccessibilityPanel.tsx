'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import './accessibility.css'
import {
  AccessibilityLabels,
  ScreenReaderTarget,
  defaultAccessibilityLabels,
} from './labels'

export interface AccessibilityPanelProps {
  /** Controls panel visibility. */
  isOpen: boolean
  /** Called when the backdrop or the close button is activated. */
  onClose: () => void
  /** Override any subset of the default (English) labels. */
  labels?: Partial<AccessibilityLabels>
  /** localStorage key used to persist settings. Defaults to `a11y-settings`. */
  storageKey?: string
  /**
   * Elements (by id) the screen-reader option should annotate with an
   * aria-label. Leave empty if your app already labels its landmarks.
   */
  screenReaderTargets?: ScreenReaderTarget[]
  /** Render the panel on the left (for RTL layouts). Defaults to right. */
  rtl?: boolean
  /** Render the small footer credit line. Defaults to false. */
  showPoweredBy?: boolean
}

type SettingKey =
  | 'biggerText'
  | 'dyslexia'
  | 'contrast'
  | 'monochrome'
  | 'highlightLinks'
  | 'pauseAnimations'
  | 'spacing'
  | 'cursor'
  | 'keyboardNavigation'
  | 'screenReader'

type Settings = Record<SettingKey, boolean>

const DEFAULT_SETTINGS: Settings = {
  biggerText: false,
  dyslexia: false,
  contrast: false,
  monochrome: false,
  highlightLinks: false,
  pauseAnimations: false,
  spacing: false,
  cursor: false,
  keyboardNavigation: false,
  screenReader: false,
}

/** Maps each setting to the class toggled on <html>. */
const CLASS_MAP: Record<SettingKey, string> = {
  biggerText: 'a11y-bigger-text',
  dyslexia: 'a11y-dyslexia-friendly',
  contrast: 'a11y-high-contrast',
  monochrome: 'a11y-monochrome',
  highlightLinks: 'a11y-highlight-links',
  pauseAnimations: 'a11y-pause-animations',
  spacing: 'a11y-text-spacing',
  cursor: 'a11y-big-cursor',
  keyboardNavigation: 'a11y-keyboard-navigation',
  screenReader: 'a11y-screen-reader',
}

const LIVE_REGION_ID = 'a11y-live-region'

const SPEAKABLE =
  'p, h1, h2, h3, h4, h5, h6, li, a, button, label, td, th, figcaption, [aria-label], [role="heading"], [role="button"], [role="link"]'

const ICONS: Record<SettingKey, React.ReactNode> = {
  biggerText: (
    <svg className="a11y-card-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M4 19L9 5h2l5 14M6 14h8M18 13v6M16 16h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  dyslexia: (
    <svg className="a11y-card-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c2.5 0 4.5-2 4.5-4.5S14.5 5 12 5 7.5 7 7.5 9.5 9.5 14 12 14z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7M9 17h6" />
    </svg>
  ),
  contrast: (
    <svg className="a11y-card-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18c4.97 0 9-4.03 9-9s-4.03-9-9-9z" fill="currentColor" stroke="none" />
    </svg>
  ),
  monochrome: (
    <svg className="a11y-card-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C7 9 5 12 5 15c0 3.87 3.13 7 7 7s7-3.13 7-7c0-3-2-6-7-13z" />
    </svg>
  ),
  highlightLinks: (
    <svg className="a11y-card-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  pauseAnimations: (
    <svg className="a11y-card-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 16V8h2v8H9zm4 0V8h2v8h-2z" fill="currentColor" stroke="none" />
    </svg>
  ),
  spacing: (
    <svg className="a11y-card-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l-5 5 5 5M16 7l5 5-5 5M4 12h16" />
    </svg>
  ),
  cursor: (
    <svg className="a11y-card-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M6 3l12 12-5.5 1 4.5 7.5-3 2-4.5-7.5-3.5 3.5V3z" fill="currentColor" stroke="none" />
    </svg>
  ),
  keyboardNavigation: (
    <svg className="a11y-card-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path strokeLinecap="round" d="M7 10h2M11 10h2M15 10h2M7 14h10" />
    </svg>
  ),
  screenReader: (
    <svg className="a11y-card-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4a4 4 0 00-4 4v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10v1a4 4 0 008 0v-1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18h12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21h6" />
    </svg>
  ),
}

const OPTION_ORDER: SettingKey[] = [
  'biggerText',
  'dyslexia',
  'contrast',
  'monochrome',
  'highlightLinks',
  'pauseAnimations',
  'spacing',
  'cursor',
  'keyboardNavigation',
  'screenReader',
]

function ensureLiveRegion(): HTMLElement {
  let el = document.getElementById(LIVE_REGION_ID)
  if (!el) {
    el = document.createElement('div')
    el.id = LIVE_REGION_ID
    el.className = 'a11y-sr-only'
    el.setAttribute('role', 'status')
    el.setAttribute('aria-live', 'polite')
    el.setAttribute('aria-atomic', 'true')
    document.body.appendChild(el)
  }
  return el
}

function announce(message: string) {
  const el = ensureLiveRegion()
  el.textContent = ''
  window.setTimeout(() => {
    el.textContent = message
  }, 50)
}

function getSpeechLang(): string {
  const lang = document.documentElement.lang || 'en'
  if (lang.startsWith('he')) return 'he-IL'
  if (lang.startsWith('ru')) return 'ru-RU'
  return 'en-US'
}

function stopSpeech() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const trimmed = text.replace(/\s+/g, ' ').trim()
  if (!trimmed) return
  stopSpeech()
  const utter = new SpeechSynthesisUtterance(trimmed.slice(0, 500))
  utter.lang = getSpeechLang()
  utter.rate = 0.95
  window.speechSynthesis.speak(utter)
}

function readableFromElement(el: Element): string {
  if (!(el instanceof HTMLElement)) return ''
  const aria = el.getAttribute('aria-label')
  if (aria?.trim()) return aria.trim()
  const labelledBy = el.getAttribute('aria-labelledby')
  if (labelledBy) {
    const parts = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim())
      .filter(Boolean)
    if (parts.length) return parts.join(' ')
  }
  return (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim()
}

function applyLandmarkLabels(targets: ScreenReaderTarget[], enabled: boolean) {
  targets.forEach(({ id, label }) => {
    const el = document.getElementById(id)
    if (!el) return
    if (enabled) {
      if (!el.hasAttribute('data-a11y-labeled')) {
        el.setAttribute('data-a11y-prev-aria-label', el.getAttribute('aria-label') ?? '')
        el.setAttribute('data-a11y-labeled', 'true')
      }
      el.setAttribute('aria-label', label)
    } else if (el.hasAttribute('data-a11y-labeled')) {
      const prev = el.getAttribute('data-a11y-prev-aria-label')
      if (prev) el.setAttribute('aria-label', prev)
      else el.removeAttribute('aria-label')
      el.removeAttribute('data-a11y-prev-aria-label')
      el.removeAttribute('data-a11y-labeled')
    }
  })
}

function setPausedMedia(paused: boolean) {
  if (paused) {
    gsap.globalTimeline.pause()
    document.querySelectorAll('video').forEach((video) => {
      if (!video.paused) {
        video.dataset.a11yWasPlaying = 'true'
        video.pause()
      }
    })
  } else {
    gsap.globalTimeline.resume()
    document.querySelectorAll('video').forEach((video) => {
      if (video.dataset.a11yWasPlaying === 'true') {
        delete video.dataset.a11yWasPlaying
        void video.play().catch(() => {})
      }
    })
  }
}

export default function AccessibilityPanel({
  isOpen,
  onClose,
  labels,
  storageKey = 'a11y-settings',
  screenReaderTargets = [],
  rtl = false,
  showPoweredBy = false,
}: AccessibilityPanelProps) {
  const titleId = useId()
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)
  const prevScreenReaderRef = useRef<boolean | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  const t = useMemo<AccessibilityLabels>(
    () => ({ ...defaultAccessibilityLabels, ...labels }),
    [labels],
  )

  // Load persisted settings once — do not write defaults before hydrate.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }))
      }
    } catch (e) {
      console.error('Failed to load accessibility settings', e)
    } finally {
      setHydrated(true)
    }
  }, [storageKey])

  // Sync settings → <html> classes + localStorage (after hydrate only).
  useEffect(() => {
    if (!hydrated) return

    const root = document.documentElement
    ;(Object.keys(CLASS_MAP) as SettingKey[]).forEach((key) => {
      root.classList.toggle(CLASS_MAP[key], settings[key])
    })

    setPausedMedia(settings.pauseAnimations)

    try {
      localStorage.setItem(storageKey, JSON.stringify(settings))
    } catch (e) {
      console.error(e)
    }
  }, [settings, storageKey, hydrated])

  // Screen-reader mode: live region, TTS announce, landmark labels.
  useEffect(() => {
    if (!hydrated) return

    const wasOn = prevScreenReaderRef.current
    prevScreenReaderRef.current = settings.screenReader

    if (settings.screenReader) {
      ensureLiveRegion()
      applyLandmarkLabels(screenReaderTargets, true)
      if (wasOn === false) {
        announce(t.screenReaderEnabled)
        speak(t.screenReaderEnabled)
      }
    } else {
      stopSpeech()
      applyLandmarkLabels(screenReaderTargets, false)
      const live = document.getElementById(LIVE_REGION_ID)
      if (live) live.textContent = ''
    }
  }, [settings.screenReader, screenReaderTargets, t.screenReaderEnabled, hydrated])

  // Re-label landmarks if sections mount later (client hydration / lazy UI).
  useEffect(() => {
    if (!hydrated || !settings.screenReader || screenReaderTargets.length === 0) return
    const observer = new MutationObserver(() => {
      applyLandmarkLabels(screenReaderTargets, true)
    })
    observer.observe(document.body, { childList: true, subtree: true })
    applyLandmarkLabels(screenReaderTargets, true)
    return () => observer.disconnect()
  }, [hydrated, settings.screenReader, screenReaderTargets])

  // Click / keyboard focus → read aloud while Screen Reader mode is on.
  useEffect(() => {
    if (!hydrated || !settings.screenReader) return

    // Avoid double-speaking when a click also focuses the same control.
    let skipFocusSpeak = false

    const fromEventTarget = (target: EventTarget | null): string => {
      if (!(target instanceof Element)) return ''
      if (target.closest('.a11y-panel, .a11y-overlay')) return ''
      const el = target.closest(SPEAKABLE)
      if (!el) return ''
      return readableFromElement(el)
    }

    const onPointerDown = () => {
      skipFocusSpeak = true
    }

    const onClick = (e: MouseEvent) => {
      const text = fromEventTarget(e.target)
      if (text) speak(text)
    }

    const onFocusIn = (e: FocusEvent) => {
      if (skipFocusSpeak) {
        skipFocusSpeak = false
        return
      }
      const text = fromEventTarget(e.target)
      if (text) speak(text)
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('click', onClick, true)
    document.addEventListener('focusin', onFocusIn, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('focusin', onFocusIn, true)
    }
  }, [hydrated, settings.screenReader])

  // Escape closes; move focus into panel on open and restore on close.
  useEffect(() => {
    if (!isOpen) return
    prevFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusTimer = window.setTimeout(() => closeBtnRef.current?.focus(), 0)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKeyDown)
      prevFocusRef.current?.focus?.()
    }
  }, [isOpen, onClose])

  useEffect(() => {
    return () => {
      stopSpeech()
      setPausedMedia(false)
      applyLandmarkLabels(screenReaderTargets, false)
      document.getElementById(LIVE_REGION_ID)?.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount cleanup only
  }, [])

  const toggleOption = (id: SettingKey) => {
    setSettings((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const resetAll = () => {
    stopSpeech()
    setSettings(DEFAULT_SETTINGS)
  }

  return (
    <>
      {isOpen && <div className="a11y-overlay" onClick={onClose} aria-hidden="true" />}

      <div
        className={`a11y-panel ${rtl ? 'a11y-panel--left' : 'a11y-panel--right'} ${
          isOpen ? 'is-open' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
      >
        <div className="a11y-body">
          <div className="a11y-header">
            <h2 id={titleId} className="a11y-title">
              {t.title}
            </h2>
            <button
              ref={closeBtnRef}
              type="button"
              className="a11y-close"
              onClick={onClose}
              aria-label={t.closeLabel}
              tabIndex={isOpen ? 0 : -1}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="a11y-grid">
            {OPTION_ORDER.map((id) => {
              const active = settings[id]
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleOption(id)}
                  aria-pressed={active}
                  className={`a11y-card ${active ? 'is-active' : ''}`}
                  tabIndex={isOpen ? 0 : -1}
                >
                  {ICONS[id]}
                  <span className="a11y-card-label">{t[id]}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="a11y-footer">
          {t.statementLink && (
            <a
              href="/accessibility"
              className="a11y-statement-link"
              onClick={onClose}
              tabIndex={isOpen ? 0 : -1}
            >
              {t.statementLink}
            </a>
          )}
          <button type="button" className="a11y-reset" onClick={resetAll} tabIndex={isOpen ? 0 : -1}>
            {t.reset}
          </button>
          {showPoweredBy && t.poweredBy && <div className="a11y-powered">{t.poweredBy}</div>}
        </div>
      </div>
    </>
  )
}
