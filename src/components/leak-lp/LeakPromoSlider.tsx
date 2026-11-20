'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { AuditLpLocale } from '@/lib/auditLp'
import { trackLeakLp } from '@/lib/leakLpAnalytics'

type Lang = 'en' | 'ru' | 'he'
type PromoVideo = { src: string; label: string }

/**
 * Promo videos (16:9) shown while the audit runs. Each locale has its own list;
 * for now every locale plays the same two Hebrew cuts — replace per locale when the localized renders exist.
 * Files live in /public/videos/promo.
 */
const HE_CUTS: PromoVideo[] = [
  { src: '/videos/promo/ora60a-1920x1080-he.mp4', label: 'ORA 60A' },
  { src: '/videos/promo/ember-1920x1080-he.mp4', label: 'EMBER Steakhouse' },
]
export const LEAK_PROMO_VIDEOS: Record<Lang, PromoVideo[]> = {
  en: HE_CUTS,
  ru: HE_CUTS,
  he: HE_CUTS,
}

const COPY: Record<'title' | 'prev' | 'next' | 'slide' | 'soundOn' | 'soundOff', Record<Lang, string>> = {
  soundOn: { en: 'Turn sound on', ru: 'Включить звук', he: 'הפעלת סאונד' },
  soundOff: { en: 'Turn sound off', ru: 'Выключить звук', he: 'השתקת סאונד' },
  title: {
    en: 'While we check your site — a few of our projects',
    ru: 'Пока идёт проверка — несколько наших проектов',
    he: 'בזמן שאנחנו בודקים את האתר — כמה מהפרויקטים שלנו',
  },
  prev: { en: 'Previous video', ru: 'Предыдущее видео', he: 'הסרטון הקודם' },
  next: { en: 'Next video', ru: 'Следующее видео', he: 'הסרטון הבא' },
  slide: { en: 'Video', ru: 'Видео', he: 'סרטון' },
}

/** 16:9 video slider for the waiting screen: autoplays muted, goes to the next video when one ends. */
export default function LeakPromoSlider({ locale }: { locale: AuditLpLocale }) {
  const lang = (['en', 'ru', 'he'].includes(locale) ? locale : 'en') as Lang
  const videos = LEAK_PROMO_VIDEOS[lang]
  const [index, setIndex] = useState(0)
  const ref = useRef<HTMLVideoElement>(null)
  const count = videos.length
  const go = (step: number) => setIndex((i) => (i + step + count) % count)

  // Sound on by default. The waiting screen follows a form submit, so the page usually has user activation
  // and browsers allow audible autoplay; if one refuses, fall back to muted and let the viewer turn sound on.
  const [muted, setMuted] = useState(false)
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  // One <video> element for all slides (src changes, the element stays), so no detached player can keep
  // playing sound in the background. Start each video from the beginning when the slide changes.
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = mutedRef.current
    void v.play().catch(() => {
      v.muted = true
      setMuted(true)
      void v.play().catch(() => {})
    })
  }, [index])

  // Stop playback and sound when the slider leaves the page (stage changes to ready / failed).
  useEffect(() => {
    const v = ref.current
    return () => {
      if (!v) return
      v.muted = true
      v.pause()
    }
  }, [])

  const toggleSound = () => {
    const v = ref.current
    const next = !muted
    setMuted(next)
    trackLeakLp('promo_video', { action: next ? 'sound_off' : 'sound_on', video: current.label })
    if (v) {
      v.muted = next
      if (v.paused) void v.play().catch(() => {})
    }
  }

  if (!count) return null
  const current = videos[index]

  return (
    <div className="lk-promo w-full">
      <p className="lk-promo-title m-0">{COPY.title[lang]}</p>
      <div className="lk-promo-frame relative w-full overflow-hidden" dir="ltr">
        <video
          ref={ref}
          src={current.src}
          className="absolute inset-0 size-full object-cover"
          playsInline
          preload="metadata"
          loop={count === 1}
          onEnded={() => {
            trackLeakLp('promo_video', { action: 'complete', video: current.label })
            go(1)
          }}
          aria-label={`${COPY.slide[lang]} ${index + 1} / ${count}: ${current.label}`}
        />
        <button
          type="button"
          className="lk-promo-sound"
          aria-label={muted ? COPY.soundOn[lang] : COPY.soundOff[lang]}
          aria-pressed={!muted}
          onClick={toggleSound}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H3v6h3l5 4V5z" />
            {muted ? (
              <path d="m22 9-6 6M16 9l6 6" />
            ) : (
              <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
            )}
          </svg>
        </button>
        {count > 1 ? (
          <>
            <button type="button" className="lk-promo-arrow lk-promo-prev" aria-label={COPY.prev[lang]} onClick={() => {
                trackLeakLp('promo_video', { action: 'prev', video: current.label })
                go(-1)
              }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button type="button" className="lk-promo-arrow lk-promo-next" aria-label={COPY.next[lang]} onClick={() => {
                trackLeakLp('promo_video', { action: 'next', video: current.label })
                go(1)
              }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            <div className="lk-promo-dots" role="tablist" aria-label={COPY.title[lang]}>
              {videos.map((v, i) => (
                <button
                  key={v.src}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`${COPY.slide[lang]} ${i + 1}: ${v.label}`}
                  className="lk-promo-dot"
                  onClick={() => {
                    trackLeakLp('promo_video', { action: 'dot', video: v.label })
                    setIndex(i)
                  }}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
