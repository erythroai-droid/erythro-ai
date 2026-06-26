'use client'

import React, { useEffect, useMemo, useState } from 'react'
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

export default function AccessibilityPanel({
  isOpen,
  onClose,
  labels,
  storageKey = 'a11y-settings',
  screenReaderTargets = [],
  rtl = false,
  showPoweredBy = false,
}: AccessibilityPanelProps) {
  const t = useMemo<AccessibilityLabels>(
    () => ({ ...defaultAccessibilityLabels, ...labels }),
    [labels],
  )

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  // Load persisted settings on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }))
      }
    } catch (e) {
      console.error('Failed to load accessibility settings', e)
    }
  }, [storageKey])

  // Sync settings -> <html> classes + localStorage.
  useEffect(() => {
    const root = document.documentElement
    ;(Object.keys(CLASS_MAP) as SettingKey[]).forEach((key) => {
      root.classList.toggle(CLASS_MAP[key], settings[key])
    })

    try {
      localStorage.setItem(storageKey, JSON.stringify(settings))
    } catch (e) {
      console.error(e)
    }
  }, [settings, storageKey])

  // Screen-reader live region + landmark labelling.
  useEffect(() => {
    let liveRegion = document.getElementById(LIVE_REGION_ID) as HTMLDivElement | null

    if (settings.screenReader) {
      if (!liveRegion) {
        liveRegion = document.createElement('div')
        liveRegion.id = LIVE_REGION_ID
        liveRegion.className = 'a11y-sr-only'
        liveRegion.setAttribute('aria-live', 'polite')
        liveRegion.setAttribute('aria-atomic', 'true')
        document.body.appendChild(liveRegion)
      }

      screenReaderTargets.forEach(({ id, label }) => {
        const element = document.getElementById(id)
        if (element && !element.dataset.a11yLabeled) {
          element.setAttribute('aria-label', label)
          element.dataset.a11yLabeled = 'true'
        }
      })

      liveRegion.textContent = t.screenReaderEnabled
    } else {
      document.querySelectorAll('[data-a11y-labeled="true"]').forEach((element) => {
        element.removeAttribute('aria-label')
        element.removeAttribute('data-a11y-labeled')
      })

      if (liveRegion) {
        liveRegion.textContent = ''
      }
    }
  }, [settings.screenReader, screenReaderTargets, t.screenReaderEnabled])

  const toggleOption = (id: SettingKey) => {
    setSettings((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const resetAll = () => setSettings(DEFAULT_SETTINGS)

  return (
    <>
      {isOpen && <div className="a11y-overlay" onClick={onClose} />}

      <div
        className={`a11y-panel ${rtl ? 'a11y-panel--left' : 'a11y-panel--right'} ${
          isOpen ? 'is-open' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
      >
        <div>
          <div className="a11y-header">
            <h2 className="a11y-title">{t.title}</h2>
            <button type="button" className="a11y-close" onClick={onClose} aria-label={t.closeLabel}>
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
                >
                  {ICONS[id]}
                  <span className="a11y-card-label">{t[id]}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="a11y-footer">
          <button type="button" className="a11y-reset" onClick={resetAll}>
            {t.reset}
          </button>
          {showPoweredBy && t.poweredBy && <div className="a11y-powered">{t.poweredBy}</div>}
        </div>
      </div>
    </>
  )
}
