'use client'

import React, { useEffect, useRef } from 'react'

interface Point {
  x: number
  y: number
  originX: number
  originY: number
  vx: number
  vy: number
}

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Accessibility & mobile check: disable on mobile portrait or if motion is reduced
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobilePortrait = window.matchMedia('(max-width: 767px)').matches || window.matchMedia('(orientation: portrait) and (max-width: 1023px)').matches
    if (isMobilePortrait) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    let dpr = window.devicePixelRatio || 1

    let gridPoints: Point[] = []
    const SPACING = 108 // Wide architectural grid step (2x larger)
    let animTime = 0
    const smoothMouse = { x: -1000, y: -1000 }
    let mouseVx = 0
    let mouseVy = 0

    const initElements = () => {
      gridPoints = []
      const cols = Math.ceil(width / SPACING) + 3
      const rows = Math.ceil(height / SPACING) + 3
      const startX = (width - (cols - 1) * SPACING) / 2
      const startY = (height - (rows - 1) * SPACING) / 2

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = startX + c * SPACING
          const y = startY + r * SPACING
          gridPoints.push({
            x,
            y,
            originX: x,
            originY: y,
            vx: 0,
            vy: 0,
          })
        }
      }
    }

    const handleResize = () => {
      if (!canvas) return
      dpr = window.devicePixelRatio || 1
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)
      initElements()
    }

    // Pointer tracking
    const handlePointerMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true }
    }
    const handlePointerLeave = () => {
      mouseRef.current.active = false
    }

    window.addEventListener('mousemove', handlePointerMove, { passive: true })
    document.addEventListener('mouseleave', handlePointerLeave)
    window.addEventListener('resize', handleResize)

    // Init canvas
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)
    initElements()

    // Reduced motion static render
    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'rgba(148, 163, 184, 0.40)'
      for (let i = 0; i < gridPoints.length; i++) {
        const p = gridPoints[i]
        ctx.beginPath()
        ctx.arc(p.originX, p.originY, 1.05, 0, Math.PI * 2)
        ctx.fill()
      }
      return () => {
        window.removeEventListener('mousemove', handlePointerMove)
        document.removeEventListener('mouseleave', handlePointerLeave)
        window.removeEventListener('resize', handleResize)
      }
    }

    // Main animation loop
    const render = () => {
      ctx.clearRect(0, 0, width, height)
      animTime += 0.015

      // Cursor with liquid trailing easing (grid stretches and trails behind cursor)
      const targetMx = mouseRef.current.x
      const targetMy = mouseRef.current.y
      const mActive = mouseRef.current.active

      if (mActive) {
        if (smoothMouse.x === -1000) {
          smoothMouse.x = targetMx
          smoothMouse.y = targetMy
        } else {
          const prevX = smoothMouse.x
          const prevY = smoothMouse.y
          // Liquid trailing easing: center of influence follows smoothly
          smoothMouse.x += (targetMx - smoothMouse.x) * 0.085
          smoothMouse.y += (targetMy - smoothMouse.y) * 0.085
          mouseVx = smoothMouse.x - prevX
          mouseVy = smoothMouse.y - prevY
        }
      } else {
        mouseVx *= 0.92
        mouseVy *= 0.92
      }

      // Render Gravity Grid: wide 320px reach for the 108px grid step
      const radius = 320
      const radiusSq = radius * radius

      for (let i = 0; i < gridPoints.length; i++) {
        const p = gridPoints[i]

        if (mActive && smoothMouse.x !== -1000) {
          const dx = smoothMouse.x - p.originX
          const dy = smoothMouse.y - p.originY
          const distSq = dx * dx + dy * dy

          if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq)
            const norm = 1 - dist / radius
            // Smooth cosine bell-curve (clean spatial gradient, zero flutter)
            const smoothFactor = Math.sin(norm * (Math.PI / 2))

            // Pure smooth gravitational pull + trailing drag
            const force = smoothFactor * 36
            const angle = Math.atan2(dy, dx)

            const dragInfluence = smoothFactor * 1.6
            const dragX = mouseVx * dragInfluence
            const dragY = mouseVy * dragInfluence

            const targetX = p.originX + Math.cos(angle) * force + dragX
            const targetY = p.originY + Math.sin(angle) * force + dragY

            // Gentle low-frequency acceleration
            p.vx += (targetX - p.x) * 0.038
            p.vy += (targetY - p.y) * 0.038
          } else {
            // Low-frequency harmonic wave return: slow, majestic oscillation
            p.vx += (p.originX - p.x) * 0.026
            p.vy += (p.originY - p.y) * 0.026
          }
        } else {
          // Low-frequency harmonic wave return: gentle settling
          p.vx += (p.originX - p.x) * 0.026
          p.vy += (p.originY - p.y) * 0.026
        }

        // Gentle ambient breathing drift
        p.vx += Math.sin(animTime + p.originY * 0.015) * 0.01
        p.vy += Math.cos(animTime + p.originX * 0.015) * 0.01

        // Viscous fluid damping (0.932): smooth long-wave decay without jerking
        p.vx *= 0.932
        p.vy *= 0.932
        p.x += p.vx
        p.y += p.vy

        // Continuous, seamless dot size and color interpolation (no threshold flicker)
        const disp = Math.hypot(p.x - p.originX, p.y - p.originY)
        const pointSize = 1.05 + Math.min(0.55, disp * 0.02)

        // Smoothly bloom into a soft, light lilac tone in the active cursor area, returning to neutral gray
        const t = Math.min(1, disp / 16)
        const r = Math.round(148 + 40 * t) // 148 -> 188
        const g = Math.round(163 - 33 * t) // 163 -> 130
        const b = Math.round(184 + 64 * t) // 184 -> 248
        const alpha = Math.min(0.72, 0.40 + t * 0.30)

        ctx.beginPath()
        ctx.arc(p.x, p.y, pointSize, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', handlePointerMove)
      document.removeEventListener('mouseleave', handlePointerLeave)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 select-none opacity-80 hidden md:block"
    />
  )
}
