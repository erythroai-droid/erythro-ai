'use client'

import React, { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/components/leak-lp/motion'
import { TOOL_LOGO } from '@/components/leak-lp/toolLogos'

type Lang = 'en' | 'ru' | 'he'
type Tool = { name: string; logo: keyof typeof TOOL_LOGO; sub: Record<Lang, string> }

// Each card says what we read from that tool.
const SEARCH: Tool[] = [
  { name: 'Google Search', logo: 'google', sub: { en: 'Rankings & Maps', ru: 'Выдача и карты', he: 'תוצאות ומפות' } },
  { name: 'ChatGPT', logo: 'openai', sub: { en: 'AI answers', ru: 'Ответы AI', he: 'תשובות AI' } },
  { name: 'Perplexity', logo: 'perplexity', sub: { en: 'AI citations', ru: 'Цитаты в AI', he: 'ציטוטים ב-AI' } },
  { name: 'Gemini', logo: 'googlegemini', sub: { en: 'AI Overviews', ru: 'AI-обзоры', he: 'סקירות AI' } },
]
const PERF: Tool[] = [
  { name: 'Lighthouse', logo: 'lighthouse', sub: { en: 'Performance audit', ru: 'Аудит скорости', he: 'בדיקת ביצועים' } },
  { name: 'Core Web Vitals', logo: 'cwv', sub: { en: 'LCP · CLS · INP', ru: 'LCP · CLS · INP', he: 'LCP · CLS · INP' } },
  { name: 'Chromium', logo: 'googlechrome', sub: { en: 'Real render', ru: 'Реальный рендер', he: 'רינדור אמיתי' } },
  { name: 'PageSpeed', logo: 'pagespeedinsights', sub: { en: 'Mobile & desktop', ru: 'Мобайл и десктоп', he: 'מובייל ודסקטופ' } },
]

const COUNTER_LABEL: Record<Lang, string> = { en: 'Checks run', ru: 'Проверок проведено', he: 'בדיקות בוצעו' }
// Starting value of the live counter. Placeholder: replace with the real total (audits × checks) when known.
const COUNTER_BASE = 1284517
const fmtCount = (n: number, lang: Lang) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'ru' ? ' ' : ',')

type Pt = [number, number]

const rad = (deg: number) => (deg * Math.PI) / 180
// Coordinates are rounded so server and client render identical attributes (no hydration mismatch from float noise).
const r1 = (v: number) => Math.round(v * 10) / 10
const onEllipse = (c: Pt, rx: number, ry: number, deg: number): Pt => [r1(c[0] + rx * Math.cos(rad(deg))), r1(c[1] + ry * Math.sin(rad(deg)))]

/** Deterministic "graph cloud": golden-angle points in an ellipse + entry points, each linked to its nearest neighbours. */
function buildCloud(c: Pt, rx: number, ry: number, n: number, entries: Pt[]) {
  const pts: Pt[] = []
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt((i + 0.5) / n)
    const a = i * 2.39996
    pts.push([r1(c[0] + rx * r * Math.cos(a)), r1(c[1] + ry * r * Math.sin(a))])
  }
  const all = [...pts, ...entries]
  const seen = new Set<string>()
  const edges: [number, number][] = []
  all.forEach((p, i) => {
    all
      .map((q, j) => [j, (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2] as const)
      .filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .forEach(([j]) => {
        const k = i < j ? `${i}-${j}` : `${j}-${i}`
        if (!seen.has(k)) {
          seen.add(k)
          edges.push([i, j])
        }
      })
  })
  return { pts: all, edges, core: n }
}

function Logo({ tool, cx, cy, size }: { tool: Tool; cx: number; cy: number; size: number }) {
  const l = TOOL_LOGO[tool.logo]
  return (
    <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${size / 24})`}>
      <path d={l.d} fill={l.color} />
    </g>
  )
}

/** Tool card: tinted logo tile, name + what we read from it, a small live meter, and the port the wire leaves from. */
function Node({
  x,
  y,
  w,
  h,
  tool,
  fs,
  lang,
  port,
  meter,
  i,
}: {
  x: number
  y: number
  w: number
  h: number
  tool: Tool
  fs: number
  lang: Lang
  port: Pt
  meter: boolean
  i: number
}) {
  const l = TOOL_LOGO[tool.logo]
  const pad = Math.round(h * 0.24)
  const tile = h - pad * 2 - 2
  const tx = x + pad
  const ty = y + (h - tile) / 2
  const textX = tx + tile + pad
  const cy = y + h / 2
  const he = lang === 'he'
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={5} fill="#fff" stroke="var(--lk-line)" className="lk-hair" />
      <rect x={tx} y={ty} width={tile} height={tile} rx={4} fill={l.color} fillOpacity={0.07} stroke={l.color} strokeOpacity={0.18} />
      <Logo tool={tool} cx={tx + tile / 2} cy={ty + tile / 2} size={Math.round(tile * 0.52)} />
      <text x={textX} y={cy - 3} fontSize={fs} fontWeight={600} letterSpacing="-0.01em" fill="var(--lk-ink)">
        {tool.name}
      </text>
      <text x={textX} y={cy + fs * 0.85} fontSize={Math.round(fs * 0.76 * 10) / 10} fill="var(--lk-faint)" direction={he ? 'rtl' : 'ltr'} textAnchor={he ? 'end' : 'start'}>
        {tool.sub[lang]}
      </text>
      {meter ? (
        // Activity meter: four bars breathing at offset phases.
        <g className="lk-eq" fill={l.color} fillOpacity={0.55}>
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={x + w - pad - 17 + k * 5} y={cy - 7} width={2.5} height={14} rx={1.25} style={{ animationDelay: `${-(i * 0.37 + k * 0.23)}s` }} />
          ))}
        </g>
      ) : null}
      <circle cx={port[0]} cy={port[1]} r={3.5} fill="#fff" stroke="var(--lk-ink)" strokeWidth={1.3} />
    </g>
  )
}

/** Group header: a labelled divider — hairlines with end ticks, a pill with a count badge and the group name. */
function GroupHead({ x0, x1, cy, label, count, fs, he }: { x0: number; x1: number; cy: number; label: string; count: number; fs: number; he: boolean }) {
  const ref = useRef<SVGGElement>(null)
  const text = he ? label : label.toUpperCase()
  const cx = (x0 + x1) / 2
  const h = Math.round(fs * 3.1)
  const badge = Math.round(fs * 0.85)
  const est = Math.round(text.length * fs * (he ? 0.6 : 0.74))
  const [tw, setTw] = useState(est)
  // Fit the pill to the real text width once fonts have rendered.
  useEffect(() => {
    const t = ref.current?.querySelector('text[data-label]') as SVGTextElement | null
    const m = t?.getComputedTextLength?.() || 0
    if (m > 0) setTw(Math.round(m))
  }, [text])
  const pw = 7 + badge * 2 + 10 + tw + 16
  const left = cx - pw / 2
  const right = cx + pw / 2
  return (
    <g ref={ref}>
      <line x1={x0 + 3} y1={cy} x2={left - 8} y2={cy} stroke="var(--lk-line-2)" className="lk-hair" />
      <line x1={right + 8} y1={cy} x2={x1 - 3} y2={cy} stroke="var(--lk-line-2)" className="lk-hair" />
      <circle cx={x0 + 1.5} cy={cy} r={1.5} fill="var(--lk-line-2)" />
      <circle cx={x1 - 1.5} cy={cy} r={1.5} fill="var(--lk-line-2)" />
      <rect x={left} y={cy - h / 2} width={pw} height={h} rx={h / 2} fill="#fff" stroke="var(--lk-line)" className="lk-hair" />
      <circle cx={left + 7 + badge} cy={cy} r={badge} fill="var(--lk-ink)" />
      <text x={left + 7 + badge} y={cy} dy="0.35em" textAnchor="middle" fontSize={fs * 0.9} fontWeight={600} fill="#fff">
        {count}
      </text>
      <text
        data-label=""
        x={he ? right - 16 : left + 7 + badge * 2 + 10}
        y={cy}
        dy="0.35em"
        fontSize={fs}
        fontWeight={600}
        letterSpacing={he ? 0 : '0.08em'}
        fill="var(--lk-muted)"
        direction={he ? 'rtl' : 'ltr'}
        textAnchor="start"
      >
        {text}
      </text>
    </g>
  )
}

/** Live counter card under the cloud: label + a number that keeps ticking up while the block is on screen. */
function Counter({ cx, y, w, lang, value, big }: { cx: number; y: number; w: number; lang: Lang; value: string; big: number }) {
  const h = Math.round(big * 2.75)
  return (
    <g>
      <rect x={cx - w / 2} y={y} width={w} height={h} rx={5} fill="#fff" stroke="var(--lk-line)" className="lk-hair" />
      <text x={cx} y={y + big * 1.05} textAnchor="middle" fontSize={Math.round(big * 0.55 * 10) / 10} fill="var(--lk-faint)" letterSpacing={lang === 'he' ? 0 : '0.02em'} direction={lang === 'he' ? 'rtl' : 'ltr'}>
        {COUNTER_LABEL[lang]}
      </text>
      <g transform={`translate(${cx} ${y + big * 2.25})`}>
        <circle className="lk-live" cx={-big * 3.4} cy={-big * 0.34} r={big * 0.2} fill="var(--lk-green)" />
        <text data-count="" x={0} y={0} textAnchor="middle" fontSize={big} fontWeight={600} letterSpacing="-0.02em" fill="var(--lk-ink)" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </text>
      </g>
    </g>
  )
}

function Wire({ d, i, reduced }: { d: string; i: number; reduced: boolean }) {
  return (
    <g>
      <path d={d} fill="none" stroke="var(--lk-line-2)" strokeWidth={1} />
      <path d={d} fill="none" stroke="var(--lk-ink)" strokeWidth={1} strokeDasharray="2 14" className="lk-wire" style={{ animationDelay: `${-i * 0.35}s` }} />
      {reduced ? null : (
        <circle r={3} fill="var(--lk-ink)" opacity={0}>
          <set attributeName="opacity" to="1" begin={`${i * 0.4}s`} />
          <animateMotion dur="3.2s" begin={`${i * 0.4}s`} repeatCount="indefinite" path={d} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.25 1" />
        </circle>
      )}
    </g>
  )
}

// Readings that cycle on the tagged nodes: what the analysis "finds" right now (good = green, issue = red).
const METRICS: [string, boolean][] = [
  ['LCP 3.8s', false],
  ['Schema.org', true],
  ['CLS 0.24', false],
  ['llms.txt —', false],
  ['INP 310ms', false],
  ['H1 ✓', true],
  ['TTFB 1.4s', false],
  ['FAQ ✓', true],
  ['robots.txt ✓', true],
  ['alt 12/40', false],
  ['OG tags ✓', true],
  ['AI mention 0/5', false],
]

const seed = (k: number) => {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

type Layer = 'back' | 'mid' | 'front'
type Meta = { z: number; layer: Layer; color: string; R: number; entry: boolean }

/** Depth model: each core node gets a z; back nodes are small and faint, front ones are large rings. */
function nodeMeta(i: number, core: number): Meta {
  if (i >= core) return { z: 0.5, layer: 'mid', color: 'var(--lk-ink)', R: 3.5, entry: true }
  const z = seed(i + 7)
  const layer: Layer = z < 0.34 ? 'back' : z > 0.7 ? 'front' : 'mid'
  const color = i % 7 === 3 ? 'var(--lk-red)' : i % 5 === 1 ? '#e8a94f' : 'var(--lk-ink)'
  const R = layer === 'back' ? 2 + z * 3 : layer === 'mid' ? 3 + (z - 0.34) * 3 : 5 + (z - 0.7) * 6
  return { z, layer, color, R: r1(R), entry: false }
}

const tagW = (text: string, fs: number) => Math.round(text.length * fs * 0.6 + fs + 10)

function Cloud({
  cloud,
  c,
  rx,
  ry,
  link,
  live,
  tags,
  fs,
}: {
  cloud: ReturnType<typeof buildCloud>
  c: Pt
  rx: number
  ry: number
  link: number
  live: boolean
  tags: number
  fs: number
}) {
  const { pts, edges, core } = cloud
  const rootRef = useRef<SVGGElement>(null)
  // Tagged nodes: one outer node per evenly spaced angle, so tags sit around the cloud instead of stacking.
  const ang = (i: number) => Math.atan2((pts[i][1] - c[1]) / ry, (pts[i][0] - c[0]) / rx)
  const tagged: number[] = []
  for (let k = 0; k < tags; k++) {
    const target = -Math.PI + ((k + 0.5) * 2 * Math.PI) / tags
    let best = -1
    let bestD = Infinity
    for (let i = Math.floor(core * 0.35); i < core; i++) {
      if (tagged.includes(i)) continue
      const d = Math.abs(Math.atan2(Math.sin(ang(i) - target), Math.cos(ang(i) - target)))
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    if (best >= 0) tagged.push(best)
  }
  // Tagged nodes always render as near-plane rings.
  const meta = pts.map((_, i) => {
    const m = nodeMeta(i, core)
    return tagged.includes(i) ? { ...m, z: Math.max(m.z, 0.75), layer: 'front' as Layer, R: Math.max(m.R, 5.5) } : m
  })
  const tagH = fs + 7

  useEffect(() => {
    if (!live) return
    const root = rootRef.current
    if (!root || root.getBoundingClientRect().width === 0) return
    const nodeEls: SVGGElement[] = []
    root.querySelectorAll<SVGGElement>('[data-i]').forEach((el) => (nodeEls[Number(el.dataset.i)] = el))
    const halo = nodeEls.map((el) => el.querySelector<SVGCircleElement>('.lk-halo-r'))
    const backLines = Array.from(root.querySelector('[data-pool="back"]')?.children ?? []) as SVGLineElement[]
    const frontLines = Array.from(root.querySelector('[data-pool="front"]')?.children ?? []) as SVGLineElement[]
    const tagEls = Array.from(root.querySelectorAll<SVGGElement>('[data-tag]'))
    const n = pts.length

    const motion = pts.slice(0, core).map((p, i) => {
      const dx = (p[0] - c[0]) / rx
      const dy = (p[1] - c[1]) / ry
      // Parallax: far nodes drift slower and less than near ones.
      const s = 0.5 + meta[i].z * 0.8
      return {
        r: Math.min(1, Math.hypot(dx, dy)),
        a: Math.atan2(dy, dx),
        // Tagged nodes share one orbit speed so their tags keep their spacing.
        w: tagged.includes(i) ? 0.16 : (0.14 + seed(i) * 0.3) * (i % 3 === 0 ? -1 : 1) * s,
        amp: s,
        wobF: 0.4 + seed(i + 50) * 0.7,
        wobP: seed(i + 99) * Math.PI * 2,
      }
    })
    const pos = pts.map((p) => [p[0], p[1]] as Pt)
    const act = new Float32Array(n)
    const tagState = tagged.map((node, j) => ({
      node,
      step: j * 5,
      fade: 0,
      side: pts[node][0] > c[0] ? -1 : 1,
      text: tagEls[j]?.querySelector('text') as SVGTextElement | null,
      rect: tagEls[j]?.querySelector('rect') as SVGRectElement | null,
      dot: tagEls[j]?.querySelector('circle') as SVGCircleElement | null,
      lead: tagEls[j]?.querySelector('line') as SVGLineElement | null,
      body: tagEls[j]?.querySelector('[data-body]') as SVGGElement | null,
      w: tagW(METRICS[(j * 5) % METRICS.length][0], fs),
    }))
    // Fit the pills to the real rendered text width.
    tagState.forEach((s) => {
      const measured = s.text?.getComputedTextLength?.() || 0
      if (measured > 0) {
        s.w = Math.round(measured + fs + 10)
        s.rect?.setAttribute('width', String(s.w))
      }
    })
    let raf = 0
    let last = performance.now()
    let nextFire = 0
    let nextTag = last + 900
    let tagTurn = 0
    const t0 = last

    const setLine = (el: SVGLineElement, a: Pt, b: Pt, op: number, hot: boolean) => {
      el.setAttribute('x1', a[0].toFixed(1))
      el.setAttribute('y1', a[1].toFixed(1))
      el.setAttribute('x2', b[0].toFixed(1))
      el.setAttribute('y2', b[1].toFixed(1))
      el.setAttribute('stroke-opacity', op.toFixed(2))
      el.setAttribute('stroke', hot ? 'var(--lk-red)' : 'var(--lk-ink)')
    }

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = (now - t0) / 1000
      for (let i = 0; i < core; i++) {
        const m = motion[i]
        const r = Math.min(1, m.r * (1 + 0.1 * Math.sin(t * m.wobF + m.wobP)))
        const a = m.a + m.w * t
        pos[i][0] = c[0] + rx * r * Math.cos(a) + 10 * m.amp * Math.sin(t * m.wobF * 2.2 + m.wobP)
        pos[i][1] = c[1] + ry * r * Math.sin(a) + 8 * m.amp * Math.cos(t * m.wobF * 1.8 + m.wobP * 2)
      }
      if (now > nextFire) {
        act[Math.floor(seed(now) * core)] = 1
        nextFire = now + 220 + seed(now + 1) * 380
      }
      // A tag "re-reads" its node: fade out, swap the reading, fade in; the node fires at the same moment.
      if (tagState.length && now > nextTag) {
        const s = tagState[tagTurn % tagState.length]
        s.fade = 0.5
        act[s.node] = 1
        tagTurn++
        nextTag = now + 1300
      }
      for (let i = 0; i < n; i++) act[i] = Math.max(0, act[i] - dt * 0.9)

      // Links: far pairs go to the faint pool, near pairs to the sharp one.
      let kb = 0
      let kf = 0
      const lim2 = link * link
      for (let a = 0; a < n; a++) {
        let nearest = -1
        let nearestD = Infinity
        for (let b = a + 1; b < n; b++) {
          if (a >= core && b >= core) continue
          const d2 = (pos[a][0] - pos[b][0]) ** 2 + (pos[a][1] - pos[b][1]) ** 2
          if (a >= core && b < core && d2 < nearestD) {
            nearestD = d2
            nearest = b
          }
          if (d2 > lim2) continue
          const heat = Math.max(act[a], act[b])
          const back = meta[a].layer === 'back' || meta[b].layer === 'back'
          const op = 0.1 + 0.45 * (1 - Math.sqrt(d2) / link) + 0.5 * heat
          if (back && kb < backLines.length) setLine(backLines[kb++], pos[a], pos[b], op * 0.7, heat > 0.35)
          else if (!back && kf < frontLines.length) setLine(frontLines[kf++], pos[a], pos[b], op, heat > 0.35)
        }
        if (a >= core && nearest >= 0 && nearestD > lim2 && kf < frontLines.length) setLine(frontLines[kf++], pos[a], pos[nearest], 0.35, false)
      }
      for (let j = kb; j < backLines.length; j++) backLines[j].setAttribute('stroke-opacity', '0')
      for (let j = kf; j < frontLines.length; j++) frontLines[j].setAttribute('stroke-opacity', '0')

      for (let i = 0; i < core; i++) {
        nodeEls[i].setAttribute('transform', `translate(${pos[i][0].toFixed(1)} ${pos[i][1].toFixed(1)}) scale(${(1 + act[i] * 0.55).toFixed(3)})`)
        const h = halo[i]
        if (h) {
          h.setAttribute('r', (meta[i].R + 2 + (1 - act[i]) * 12).toFixed(1))
          h.setAttribute('stroke-opacity', (act[i] * 0.55).toFixed(2))
        }
      }

      tagState.forEach((s, j) => {
        const el = tagEls[j]
        if (!el) return
        if (s.fade > 0) {
          const before = s.fade
          s.fade = Math.max(0, s.fade - dt)
          if (before > 0.25 && s.fade <= 0.25) {
            // Next reading that no other tag is showing.
            do s.step++
            while (tagState.some((o) => o !== s && o.step % METRICS.length === s.step % METRICS.length))
            const [txt, ok] = METRICS[s.step % METRICS.length]
            if (s.text) s.text.textContent = txt
            s.dot?.setAttribute('fill', ok ? 'var(--lk-green)' : 'var(--lk-red)')
            const measured = s.text?.getComputedTextLength?.() || 0
            s.w = measured > 0 ? Math.round(measured + fs + 10) : tagW(txt, fs)
            s.rect?.setAttribute('width', String(s.w))
          }
        }
        const op = s.fade > 0.25 ? (s.fade - 0.25) / 0.25 : s.fade > 0 ? 1 - s.fade / 0.25 : 1
        // The tag slides to whichever side keeps it inside the cloud.
        const want = pos[s.node][0] > c[0] ? -1 : 1
        s.side += (want - s.side) * Math.min(1, dt * 3)
        const k = (s.side + 1) / 2
        const left = (-14 - s.w) * (1 - k) + 14 * k
        const anchor = (left + s.w) * (1 - k) + left * k
        el.setAttribute('transform', `translate(${pos[s.node][0].toFixed(1)} ${pos[s.node][1].toFixed(1)})`)
        s.body?.setAttribute('transform', `translate(${left.toFixed(1)} ${-tagH - 9})`)
        s.body?.setAttribute('opacity', op.toFixed(2))
        s.lead?.setAttribute('x2', anchor.toFixed(1))
      })

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // meta/tagged derive from pts/core and are stable for a given cloud.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, pts, core, c, rx, ry, link, fs, tagH])

  const nodeEl = (i: number) => {
    const m = meta[i]
    const p = pts[i]
    const tf = `translate(${p[0]} ${p[1]})`
    if (m.layer === 'back')
      return (
        <g key={i} data-i={i} transform={tf}>
          <circle r={m.R} fill={m.color} fillOpacity={0.4} />
        </g>
      )
    if (m.entry)
      return (
        <g key={i} data-i={i} transform={tf}>
          <circle r={m.R + 1} fill="#fff" stroke="var(--lk-ink)" strokeWidth={1.4} />
        </g>
      )
    if (m.layer === 'mid')
      return (
        <g key={i} data-i={i} transform={tf}>
          <circle className="lk-halo-r" r={m.R + 14} fill="none" stroke={m.color} strokeWidth={1} strokeOpacity={0} />
          <circle r={m.R} fill={m.color} fillOpacity={0.85} />
        </g>
      )
    return (
      <g key={i} data-i={i} transform={tf}>
        <circle className="lk-halo-r" r={m.R + 14} fill="none" stroke={m.color} strokeWidth={1.2} strokeOpacity={0} />
        <circle r={m.R} fill="#fff" stroke={m.color} strokeWidth={1.6} />
        <circle r={r1(m.R * 0.42)} fill={m.color} />
      </g>
    )
  }

  const idx = pts.map((_, i) => i)
  return (
    <g>
      <g ref={rootRef} className="lk-cloud">
        {/* Far plane: faint links and points. */}
        <g opacity={0.6}>
          <g data-pool="back">
            {live ? Array.from({ length: 140 }, (_, i) => <line key={i} strokeWidth={1} stroke="var(--lk-ink)" strokeOpacity={0} />) : null}
          </g>
          {idx.filter((i) => meta[i].layer === 'back').map(nodeEl)}
        </g>
        {/* Near plane: sharp links, mid points, then front rings and their reading tags. */}
        <g data-pool="front">
          {live
            ? Array.from({ length: 200 }, (_, i) => <line key={i} strokeWidth={1.1} stroke="var(--lk-ink)" strokeOpacity={0} />)
            : edges.map(([a, b], i) => <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke="var(--lk-ink)" strokeWidth={0.8} strokeOpacity={0.3} />)}
        </g>
        {idx.filter((i) => meta[i].layer === 'mid').map(nodeEl)}
        <g>{idx.filter((i) => meta[i].layer === 'front').map(nodeEl)}</g>
        <g>
          {tagged.map((node, j) => {
            const [txt, ok] = METRICS[(j * 5) % METRICS.length]
            const w = tagW(txt, fs)
            const side = pts[node][0] > c[0] ? -1 : 1
            const left = side > 0 ? 14 : -14 - w
            const anchor = side > 0 ? left : left + w
            return (
              <g key={j} data-tag={j} transform={`translate(${pts[node][0]} ${pts[node][1]})`}>
                <line x1={0} y1={-meta[node].R - 2} x2={anchor} y2={-9} stroke="var(--lk-ink)" strokeOpacity={0.35} strokeWidth={1} />
                <g data-body="" transform={`translate(${left} ${-tagH - 9})`}>
                  <rect width={w} height={tagH} rx={tagH / 2} fill="#fff" stroke="var(--lk-line-2)" className="lk-hair" />
                  <circle cx={6 + fs * 0.3} cy={tagH / 2} r={fs * 0.22} fill={ok ? 'var(--lk-green)' : 'var(--lk-red)'} />
                  <text x={7 + fs * 0.6} y={tagH / 2} dy="0.35em" fontSize={fs} fontWeight={500} fill="var(--lk-ink)" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {txt}
                  </text>
                </g>
              </g>
            )
          })}
        </g>
      </g>
    </g>
  )
}

/** "Measured with" diagram: search/AI and performance tools wired into an analysing graph cloud, data pulses flowing in. */
export default function LeakToolsGraph({ locale, searchLabel, perfLabel }: { locale: string; searchLabel: string; perfLabel: string }) {
  const reduced = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [play, setPlay] = useState(false)
  const lang = (['en', 'ru', 'he'].includes(locale) ? locale : 'en') as Lang
  const he = lang === 'he'

  // Hairline = one device pixel, so card outlines stay crisp at any zoom / display scaling.
  useEffect(() => {
    const set = () => ref.current?.style.setProperty('--lk-hair', `${1 / (window.devicePixelRatio || 1)}px`)
    set()
    window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => {
      setPlay(e.isIntersecting)
      el.querySelectorAll('svg').forEach((s) => (e.isIntersecting ? s.unpauseAnimations() : s.pauseAnimations()))
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Live counter: ticks up by a few checks at irregular intervals while on screen (text is written directly, no re-render).
  const count = useRef(COUNTER_BASE)
  useEffect(() => {
    if (!play || reduced) return
    const els = Array.from(ref.current?.querySelectorAll<SVGTextElement>('[data-count]') ?? [])
    let timer = 0
    const tick = () => {
      count.current += 1 + Math.floor(Math.random() * 9)
      const s = fmtCount(count.current, lang)
      els.forEach((e) => (e.textContent = s))
      timer = window.setTimeout(tick, 250 + Math.random() * 650)
    }
    timer = window.setTimeout(tick, 400)
    return () => window.clearTimeout(timer)
  }, [play, reduced, lang])
  const countText = fmtCount(COUNTER_BASE, lang)

  // Desktop: two columns of tool cards feeding a central cloud.
  const D = { W: 1000, H: 420, nw: 236, nh: 68 }
  const rowsY = [62, 142, 222, 302]
  const dc: Pt = [500, 206]
  const drx = 175
  const dry = 135
  const dLeft = [205, 192, 168, 155].map((a) => onEllipse(dc, drx, dry, a))
  const dRight = [-25, -12, 12, 25].map((a) => onEllipse(dc, drx, dry, a))
  const dCloud = buildCloud(dc, drx * 0.85, dry * 0.85, 42, [...dLeft, ...dRight])

  // Mobile: tool cards above and below the cloud.
  const M = { W: 360, H: 640, nw: 172, nh: 58 }
  const mTop: Pt[] = [
    [0, 44],
    [188, 44],
    [0, 110],
    [188, 110],
  ]
  const mBot: Pt[] = [
    [0, 496],
    [188, 496],
    [0, 562],
    [188, 562],
  ]
  const mc: Pt = [180, 292]
  const mrx = 145
  const mry = 108
  const mTopIn = [-145, -35, -112, -68].map((a) => onEllipse(mc, mrx, mry, a))
  // Bottom wires enter from the sides so they pass beside the counter card.
  const mBotIn = [165, 15, 140, 40].map((a) => onEllipse(mc, mrx, mry, a))
  const mCloud = buildCloud(mc, mrx * 0.85, mry * 0.85, 30, [...mTopIn, ...mBotIn])

  return (
    <div ref={ref} data-play={play ? '' : undefined} className="lk-graph w-full" dir="ltr">
      {/* Desktop */}
      <svg
        viewBox={`0 0 ${D.W} ${D.H}`}
        className="hidden h-auto w-full sm:block"
        role="img"
        aria-label={`${searchLabel}: ${SEARCH.map((s) => s.name).join(', ')}. ${perfLabel}: ${PERF.map((s) => s.name).join(', ')}.`}
      >
        <GroupHead x0={0.5} x1={D.nw + 0.5} cy={34} label={searchLabel} count={SEARCH.length} fs={10} he={he} />
        <GroupHead x0={D.W - D.nw - 0.5} x1={D.W - 0.5} cy={34} label={perfLabel} count={PERF.length} fs={10} he={he} />
        <Cloud tags={6} fs={9.5} cloud={dCloud} c={dc} rx={drx * 0.85} ry={dry * 0.85} link={62} live={play && !reduced} />
        {SEARCH.map((t, i) => {
          const y = rowsY[i] + D.nh / 2
          const [ex, ey] = dLeft[i]
          return <Wire key={`ws${i}`} i={i} reduced={reduced} d={`M${D.nw},${y} C${D.nw + 90},${y} ${ex - 70},${ey} ${ex},${ey}`} />
        })}
        {PERF.map((t, i) => {
          const y = rowsY[i] + D.nh / 2
          const [ex, ey] = dRight[i]
          return <Wire key={`wp${i}`} i={i + 4} reduced={reduced} d={`M${D.W - D.nw},${y} C${D.W - D.nw - 90},${y} ${ex + 70},${ey} ${ex},${ey}`} />
        })}
        <Counter cx={dc[0]} y={362} w={232} lang={lang} value={countText} big={19} />
        {SEARCH.map((t, i) => (
          <Node key={`ns${i}`} i={i} x={0.5} y={rowsY[i]} w={D.nw - 0.5} h={D.nh} tool={t} fs={15} lang={lang} port={[D.nw, rowsY[i] + D.nh / 2]} meter />
        ))}
        {PERF.map((t, i) => (
          <Node key={`np${i}`} i={i + 4} x={D.W - D.nw} y={rowsY[i]} w={D.nw - 0.5} h={D.nh} tool={t} fs={15} lang={lang} port={[D.W - D.nw, rowsY[i] + D.nh / 2]} meter />
        ))}
      </svg>

      {/* Mobile */}
      <svg viewBox={`0 0 ${M.W} ${M.H}`} className="mx-auto block h-auto w-full max-w-[420px] sm:hidden" role="img" aria-label={`${searchLabel}, ${perfLabel}`}>
        <GroupHead x0={0.5} x1={M.W - 0.5} cy={18} label={searchLabel} count={SEARCH.length} fs={9} he={he} />
        <GroupHead x0={0.5} x1={M.W - 0.5} cy={476} label={perfLabel} count={PERF.length} fs={9} he={he} />
        <Cloud tags={3} fs={8.5} cloud={mCloud} c={mc} rx={mrx * 0.85} ry={mry * 0.85} link={54} live={play && !reduced} />
        {mTop.map(([x, y], i) => {
          const sx = x + M.nw / 2
          const sy = y + M.nh
          const [ex, ey] = mTopIn[i]
          return <Wire key={`mt${i}`} i={i} reduced={reduced} d={`M${sx},${sy} C${sx},${ey - 50} ${ex},${ey - 50} ${ex},${ey}`} />
        })}
        {mBot.map(([x, y], i) => {
          const sx = x + M.nw / 2
          const [ex, ey] = mBotIn[i]
          return <Wire key={`mb${i}`} i={i + 4} reduced={reduced} d={`M${sx},${y} C${sx},${ey + 50} ${ex},${ey + 50} ${ex},${ey}`} />
        })}
        <Counter cx={mc[0]} y={412} w={172} lang={lang} value={countText} big={15} />
        {SEARCH.map((t, i) => (
          <Node key={`ms${i}`} i={i} x={mTop[i][0] + 0.5} y={mTop[i][1]} w={M.nw - 1} h={M.nh} tool={t} fs={12.5} lang={lang} port={[mTop[i][0] + M.nw / 2, mTop[i][1] + M.nh]} meter={false} />
        ))}
        {PERF.map((t, i) => (
          <Node key={`mp${i}`} i={i + 4} x={mBot[i][0] + 0.5} y={mBot[i][1]} w={M.nw - 1} h={M.nh} tool={t} fs={12.5} lang={lang} port={[mBot[i][0] + M.nw / 2, mBot[i][1]]} meter={false} />
        ))}
      </svg>
    </div>
  )
}
