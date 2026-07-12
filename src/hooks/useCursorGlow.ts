'use client'

import { useEffect, type RefObject } from 'react'

const LERP = 0.1

function readDefault(el: HTMLElement, axis: 'x' | 'y') {
  const value = el.dataset[axis === 'x' ? 'glowX' : 'glowY']
  const parsed = value ? Number.parseFloat(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : axis === 'x' ? 50 : 36
}

export function useCursorGlow(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const finePointer = window.matchMedia('(pointer: fine)')
    if (!finePointer.matches) return

    const defaultX = readDefault(el, 'x')
    const defaultY = readDefault(el, 'y')

    let targetX = defaultX
    let targetY = defaultY
    let currentX = defaultX
    let currentY = defaultY
    let frameId = 0
    let tracking = false

    const apply = () => {
      currentX += (targetX - currentX) * LERP
      currentY += (targetY - currentY) * LERP
      el.style.setProperty('--cursor-glow-x', `${currentX}%`)
      el.style.setProperty('--cursor-glow-y', `${currentY}%`)

      const settled =
        Math.abs(currentX - targetX) < 0.08 && Math.abs(currentY - targetY) < 0.08

      if (tracking || !settled) {
        frameId = requestAnimationFrame(apply)
      } else {
        frameId = 0
      }
    }

    const startLoop = () => {
      if (!frameId) frameId = requestAnimationFrame(apply)
    }

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      targetX = ((e.clientX - rect.left) / rect.width) * 100
      targetY = ((e.clientY - rect.top) / rect.height) * 100
      tracking = true
      startLoop()
    }

    const onLeave = () => {
      tracking = false
      targetX = defaultX
      targetY = defaultY
      startLoop()
    }

    el.style.setProperty('--cursor-glow-x', `${defaultX}%`)
    el.style.setProperty('--cursor-glow-y', `${defaultY}%`)

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)

    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      if (frameId) cancelAnimationFrame(frameId)
      el.style.removeProperty('--cursor-glow-x')
      el.style.removeProperty('--cursor-glow-y')
    }
  }, [ref])
}
