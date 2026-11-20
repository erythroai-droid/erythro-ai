'use client'

import React, { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/components/leak-lp/motion'

type Lang = 'en' | 'ru' | 'he'
type Query = { e: string; q: Record<Lang, string>; hit: boolean }

// Decorative "live answers" feed: real-looking local queries; the dot says whether the business got into the AI answer.
const QUERIES: Query[] = [
  { e: 'ChatGPT', q: { en: 'best dentist near me', ru: 'лучшая стоматология рядом', he: 'רופא שיניים מומלץ באזור' }, hit: false },
  { e: 'Perplexity', q: { en: 'emergency AC repair', ru: 'срочный ремонт кондиционера', he: 'תיקון מזגנים דחוף' }, hit: true },
  { e: 'Gemini', q: { en: 'real estate lawyer reviews', ru: 'юрист по недвижимости отзывы', he: 'עורך דין נדל"ן המלצות' }, hit: false },
  { e: 'Google', q: { en: 'flower delivery today', ru: 'доставка цветов сегодня', he: 'משלוח פרחים היום' }, hit: false },
  { e: 'ChatGPT', q: { en: 'car service open now', ru: 'автосервис открыт сейчас', he: 'מוסך פתוח עכשיו' }, hit: true },
  { e: 'Perplexity', q: { en: 'beauty salon prices', ru: 'салон красоты цены', he: 'מכון יופי מחירים' }, hit: false },
  { e: 'Gemini', q: { en: 'kitchen renovation quote', ru: 'ремонт кухни под ключ цена', he: 'שיפוץ מטבח הצעת מחיר' }, hit: false },
  { e: 'Google', q: { en: 'physiotherapist for back pain', ru: 'физиотерапевт при боли в спине', he: 'פיזיותרפיסט לכאבי גב' }, hit: true },
]

// Explains the feed: real customer queries to AI search, dot = whether the business is in the answer.
const LEGEND: Record<'badge' | 'hit' | 'miss', Record<Lang, string>> = {
  badge: {
    en: 'How customers search in AI today',
    ru: 'Так клиенты ищут в AI-поиске',
    he: 'כך לקוחות מחפשים בחיפוש AI',
  },
  hit: { en: 'business is in the AI answer', ru: 'бизнес есть в ответе AI', he: 'העסק מופיע בתשובת ה-AI' },
  miss: { en: 'business is missing — the client goes to a competitor', ru: 'бизнеса нет — клиент уходит к конкуренту', he: 'העסק חסר — הלקוח עובר למתחרה' },
}

function Chip({ item, lang }: { item: Query; lang: Lang }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[13px] leading-none text-white/75 backdrop-blur-[2px]">
      <span className="text-white/40" dir="ltr">
        {item.e}
      </span>
      <span className="h-3 w-px bg-white/15" aria-hidden="true" />
      <span dir={lang === 'he' ? 'rtl' : 'ltr'}>{item.q[lang]}</span>
      <span className={`size-1.5 rounded-full ${item.hit ? 'bg-[var(--lk-green)]' : 'bg-[var(--lk-red)]'}`} aria-hidden="true" />
    </span>
  )
}

/**
 * Live graph background for the right half: drifting nodes that link when close, a few red "hot" nodes that pulse.
 * Canvas (cheap to redraw every frame); pauses off screen; one static frame for reduced motion.
 */
function NetCanvas({ play, reduced }: { play: boolean; reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let w = 0
    let h = 0
    type P = { x: number; y: number; vx: number; vy: number; r: number; hot: boolean; ph: number }
    let pts: P[] = []
    const rnd = (k: number) => {
      const x = Math.sin(k * 127.1 + 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.max(24, Math.min(70, Math.round((w * h) / 7000)))
      pts = Array.from({ length: n }, (_, i) => ({
        x: rnd(i + 1) * w,
        y: rnd(i + 51) * h,
        vx: (rnd(i + 101) - 0.5) * 18,
        vy: (rnd(i + 151) - 0.5) * 18,
        r: 1.2 + rnd(i + 201) * 1.8,
        hot: i % 9 === 4,
        ph: rnd(i + 251) * Math.PI * 2,
      }))
    }
    const link = 120
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      for (let a = 0; a < pts.length; a++) {
        for (let b = a + 1; b < pts.length; b++) {
          const dx = pts[a].x - pts[b].x
          const dy = pts[a].y - pts[b].y
          const d = Math.hypot(dx, dy)
          if (d > link) continue
          const k = 1 - d / link
          const hot = pts[a].hot || pts[b].hot
          ctx.strokeStyle = hot ? `rgba(229,36,33,${(0.55 * k).toFixed(3)})` : `rgba(255,255,255,${(0.22 * k).toFixed(3)})`
          ctx.lineWidth = hot ? 1 : 0.8
          ctx.beginPath()
          ctx.moveTo(pts[a].x, pts[a].y)
          ctx.lineTo(pts[b].x, pts[b].y)
          ctx.stroke()
        }
      }
      for (const p of pts) {
        if (p.hot) {
          // Pulse ring around hot nodes.
          const s = (Math.sin(t / 700 + p.ph) + 1) / 2
          ctx.strokeStyle = `rgba(229,36,33,${(0.45 * (1 - s)).toFixed(3)})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r + 3 + s * 9, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.fillStyle = p.hot ? '#e52421' : 'rgba(255,255,255,0.7)'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.hot ? p.r + 1.2 : p.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    size()
    const ro = new ResizeObserver(() => {
      size()
      draw(performance.now())
    })
    ro.observe(canvas)
    draw(performance.now())
    if (!play || reduced) return () => ro.disconnect()

    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      for (const p of pts) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10
      }
      draw(now)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [play, reduced])

  return <canvas ref={ref} className="absolute inset-0 size-full" aria-hidden="true" />
}

// Where the floating query chips sit on the graph panel (percent of the panel), each with its own float delay.
const CHIP_SPOTS = [
  { top: '12%', left: '10%', d: '0s' },
  { top: '30%', left: '38%', d: '-1.4s' },
  { top: '50%', left: '6%', d: '-2.6s' },
  { top: '66%', left: '34%', d: '-0.8s' },
  { top: '83%', left: '14%', d: '-2s' },
]

/** Final CTA: copy and the button on the left; on the right a live graph with real-looking AI queries floating over it. */
export default function LeakFinalCta({
  locale,
  title,
  sub,
  cta,
  onCta,
}: {
  locale: string
  title: string
  sub: string
  cta: string
  onCta: () => void
}) {
  const lang = (['en', 'ru', 'he'].includes(locale) ? locale : 'en') as Lang
  const reduced = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [play, setPlay] = useState(false)

  // Loops run only while the block is on screen.
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setPlay(e.isIntersecting), { rootMargin: '80px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-play={play ? '' : undefined}
      className="lk-stage relative isolate grid overflow-hidden rounded-[10px] bg-[var(--lk-dark)] text-white lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
    >
      <div className="lk-grad-move absolute -inset-[20%] -z-20" aria-hidden="true" />

      {/* Left: copy and the call to action. */}
      <div className="relative flex flex-col items-start justify-center gap-5 px-6 py-14 text-start sm:px-14 sm:py-16 lg:min-h-[640px] lg:px-12 lg:py-24">
        <span className="inline-flex items-center gap-2 lk-label rounded-[4px] border border-white/15 bg-[var(--lk-dark)] px-2 py-0.5 !text-[var(--lk-gold)]">
          <span className="relative flex size-1.5">
            <span className="lk-ping absolute inline-flex size-full rounded-full bg-[var(--lk-red)] opacity-70" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[var(--lk-red)]" />
          </span>
          {LEGEND.badge[lang]}
        </span>
        <h2 className="lk-h2 lk-bar m-0 w-fit text-balance text-[34px] leading-[1.12] sm:text-[44px]">{title}</h2>
        <p className="m-0 text-base leading-[1.5] text-white/70 ps-[30px]">{sub}</p>
        {/* Legend: what the dots on the query cards mean. */}
        <p className="m-0 flex flex-col items-start gap-1.5 text-[13px] leading-[1.5] text-white/60 ps-[30px]">
          <span className="inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[var(--lk-green)]" aria-hidden="true" />
            {LEGEND.hit[lang]}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[var(--lk-red)]" aria-hidden="true" />
            {LEGEND.miss[lang]}
          </span>
        </p>
        <button type="button" onClick={onCta} className="lk-btn-red mt-2 inline-flex h-12 cursor-pointer items-center justify-center gap-2 px-7 ms-[30px]">
          {cta}
          <span aria-hidden="true" className="rtl:-scale-x-100">→</span>
        </button>
      </div>

      {/* Right: live graph background with query cards floating over it. */}
      <div className="lk-net relative min-h-[280px] overflow-hidden border-t border-white/10 lg:min-h-0 lg:border-s lg:border-t-0" dir="ltr" aria-hidden="true">
        <NetCanvas play={play} reduced={reduced} />
        {QUERIES.slice(0, CHIP_SPOTS.length).map((q, i) => (
          <div key={i} className="lk-float absolute" style={{ top: CHIP_SPOTS[i].top, left: CHIP_SPOTS[i].left, animationDelay: CHIP_SPOTS[i].d }}>
            <Chip item={q} lang={lang} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Fix-sprint items floating over the graph on the result screen: what gets fixed, the dot is green = done.
const FIXES: { e: string; q: Record<Lang, string> }[] = [
  { e: 'Speed', q: { en: 'images compressed', ru: 'сжатие изображений', he: 'דחיסת תמונות' } },
  { e: 'CSS', q: { en: 'critical CSS inlined', ru: 'критический CSS', he: 'CSS קריטי' } },
  { e: 'Form', q: { en: 'shorter inquiry form', ru: 'короткая форма заявки', he: 'טופס פנייה קצר' } },
  { e: 'AI', q: { en: 'llms.txt and schema', ru: 'llms.txt и разметка', he: 'llms.txt וסכמה' } },
  { e: 'Trust', q: { en: 'HTTPS and headers', ru: 'HTTPS и заголовки', he: 'HTTPS וכותרות' } },
]
const FIX_SPOTS = [
  { top: '10%', left: '8%', d: '0s' },
  { top: '28%', left: '36%', d: '-1.4s' },
  { top: '47%', left: '4%', d: '-2.6s' },
  { top: '65%', left: '30%', d: '-0.8s' },
  { top: '82%', left: '10%', d: '-2s' },
]

/** Right half of the result-screen CTA plate: the same live graph as the final CTA, with the sprint's fixes floating over it. */
export function LeakFixVisual({ locale }: { locale: string }) {
  const lang = (['en', 'ru', 'he'].includes(locale) ? locale : 'en') as Lang
  const reduced = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [play, setPlay] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setPlay(e.isIntersecting), { rootMargin: '80px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} data-play={play ? '' : undefined} className="lk-stage lk-net absolute inset-0 overflow-hidden" dir="ltr">
      <NetCanvas play={play} reduced={reduced} />
      {FIXES.map((f, i) => (
        <div key={f.e} className="lk-float absolute" style={{ top: FIX_SPOTS[i].top, left: FIX_SPOTS[i].left, animationDelay: FIX_SPOTS[i].d }}>
          <span className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[13px] leading-none text-white/75 backdrop-blur-[2px]">
            <span className="text-white/40">{f.e}</span>
            <span className="h-3 w-px bg-white/15" aria-hidden="true" />
            <span dir={lang === 'he' ? 'rtl' : 'ltr'}>{f.q[lang]}</span>
            <span className="size-1.5 rounded-full bg-[var(--lk-green)]" aria-hidden="true" />
          </span>
        </div>
      ))}
    </div>
  )
}

// Heading of the result-screen CTA plate (above the sum and timeline).
const FIX_TITLE: Record<Lang, string> = {
  en: 'We fix everything the audit found',
  ru: 'Исправим всё, что нашёл аудит',
  he: 'נתקן את כל מה שהביקורת מצאה',
}
export function leakFixTitle(locale: string): string {
  return FIX_TITLE[(['en', 'ru', 'he'].includes(locale) ? locale : 'en') as Lang]
}
