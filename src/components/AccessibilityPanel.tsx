'use client'

import React, { useEffect, useState } from 'react'
import { accessibility as translations } from '../translations'

interface AccessibilityPanelProps {
  isOpen: boolean
  onClose: () => void
  locale: string
}

interface AccessibilityOption {
  id: string
  labelKey: keyof typeof translations
  icon: React.ReactNode
  className: string
}

export default function AccessibilityPanel({ isOpen, onClose, locale }: AccessibilityPanelProps) {
  const t = (field: Record<string, string>) => field[locale] || field['en']

  // Initial state dictionary
  const [settings, setSettings] = useState({
    biggerText: false,
    dyslexia: false,
    contrast: false,
    monochrome: false,
    highlightLinks: false,
    pauseAnimations: false,
    spacing: false,
    cursor: false,
  })

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('erythro-accessibility-settings')
      if (stored) {
        setSettings(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load accessibility settings', e)
    }
  }, [])

  // Sync state changes with DOM classes and localStorage
  useEffect(() => {
    const root = document.documentElement
    
    // Define all options and their corresponding HTML classes
    const classesMap = {
      biggerText: 'accessibility-bigger-text',
      dyslexia: 'accessibility-dyslexia-friendly',
      contrast: 'accessibility-high-contrast',
      monochrome: 'accessibility-monochrome',
      highlightLinks: 'accessibility-highlight-links',
      pauseAnimations: 'accessibility-pause-animations',
      spacing: 'accessibility-text-spacing',
      cursor: 'accessibility-big-cursor',
    }

    Object.entries(classesMap).forEach(([key, className]) => {
      const isActive = settings[key as keyof typeof settings]
      if (isActive) {
        root.classList.add(className)
      } else {
        root.classList.remove(className)
      }
    })

    // Save to localStorage
    try {
      localStorage.setItem('erythro-accessibility-settings', JSON.stringify(settings))
    } catch (e) {
      console.error(e)
    }
  }, [settings])

  const toggleOption = (id: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const resetAll = () => {
    setSettings({
      biggerText: false,
      dyslexia: false,
      contrast: false,
      monochrome: false,
      highlightLinks: false,
      pauseAnimations: false,
      spacing: false,
      cursor: false,
    })
  }

  const options: AccessibilityOption[] = [
    {
      id: 'biggerText',
      labelKey: 'biggerText',
      className: 'biggerText',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M4 19L9 5h2l5 14M6 14h8M18 13v6M16 16h4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: 'dyslexia',
      labelKey: 'dyslexia',
      className: 'dyslexia',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c2.5 0 4.5-2 4.5-4.5S14.5 5 12 5 7.5 7 7.5 9.5 9.5 14 12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7M9 17h6" />
        </svg>
      ),
    },
    {
      id: 'contrast',
      labelKey: 'contrast',
      className: 'contrast',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v18c4.97 0 9-4.03 9-9s-4.03-9-9-9z" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      id: 'monochrome',
      labelKey: 'monochrome',
      className: 'monochrome',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C7 9 5 12 5 15c0 3.87 3.13 7 7 7s7-3.13 7-7c0-3-2-6-7-13z" />
        </svg>
      ),
    },
    {
      id: 'highlightLinks',
      labelKey: 'highlightLinks',
      className: 'highlightLinks',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      id: 'pauseAnimations',
      labelKey: 'pauseAnimations',
      className: 'pauseAnimations',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 16V8h2v8H9zm4 0V8h2v8h-2z" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      id: 'spacing',
      labelKey: 'spacing',
      className: 'spacing',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l-5 5 5 5M16 7l5 5-5 5M4 12h16" />
        </svg>
      ),
    },
    {
      id: 'cursor',
      labelKey: 'cursor',
      className: 'cursor',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M6 3l12 12-5.5 1 4.5 7.5-3 2-4.5-7.5-3.5 3.5V3z" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
  ]

  const isRTL = locale === 'he'

  return (
    <>
      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 bottom-0 z-50 w-full max-w-[400px] bg-coal-900 border-coal-400/20 shadow-2xl p-6 flex flex-col justify-between transition-transform duration-500 select-none ${
          isRTL
            ? `left-0 border-r ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `right-0 border-l ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
        }`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <h2 className="text-xl font-bold uppercase tracking-wider text-white">
              {t(translations.title)}
            </h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            {options.map((opt) => {
              const active = settings[opt.id as keyof typeof settings]
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleOption(opt.id as keyof typeof settings)}
                  className={`flex flex-col items-center justify-center p-5 rounded-lg border transition-all duration-300 gap-3 group cursor-pointer ${
                    active
                      ? 'bg-erythro-500 border-erythro-500 text-white shadow-lg shadow-erythro-500/25'
                      : 'bg-[#18181b]/80 border-white/5 hover:border-white/20 text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  <div
                    className={`transition-transform duration-300 group-hover:scale-110 ${
                      active ? 'text-white' : 'text-white/60 group-hover:text-white'
                    }`}
                  >
                    {opt.icon}
                  </div>
                  <span className="text-xs font-bold text-center uppercase tracking-wide leading-tight">
                    {t(translations[opt.labelKey])}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
          <button
            onClick={resetAll}
            className="w-full py-3 rounded-lg border border-white/15 text-white/90 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest text-center cursor-pointer"
          >
            {t(translations.reset)}
          </button>
          <div className="text-center font-mono text-[9px] uppercase tracking-widest text-[#a1a1aa]/60">
            {t(translations.poweredBy)}
          </div>
        </div>
      </div>
    </>
  )
}
