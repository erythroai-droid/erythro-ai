import type { ReactNode } from 'react'

type BidiTextProps = {
  children: ReactNode
  className?: string
  /** Force LTR even when the string starts with a RTL letter. */
  forceLtr?: boolean
}

const HEBREW = /[\u0590-\u05FF]/
const LATIN = /[A-Za-z]/

function analyzeBidi(text: string, forceLtr: boolean) {
  const hasHebrew = HEBREW.test(text)
  const hasLatin = LATIN.test(text)
  const ltr =
    forceLtr ||
    (text.length > 0 &&
      (/[₪$€£]/.test(text) ||
        /^[\dA-Za-z]/.test(text) ||
        (hasLatin && !hasHebrew)))

  // Pure Latin tech strings (WordPress, Elementor Pro) must keep source order in RTL UI.
  const useBdo = ltr && text.length > 0 && !hasHebrew

  return { ltr, useBdo }
}

/**
 * Isolates a text run so punctuation, commas, and currency (₪) in Hebrew RTL
 * layouts do not jump to the wrong side of the line.
 *
 * Pure Latin values use `<bdo dir="ltr">` so words like "Elementor Pro" stay in
 * source order; mixed Hebrew/Latin uses `<bdi>` with `dir="ltr"` or `dir="auto"`.
 */
export default function BidiText({ children, className, forceLtr = false }: BidiTextProps) {
  const text = typeof children === 'string' ? children.trim() : ''
  const { ltr, useBdo } = analyzeBidi(text, forceLtr)

  if (useBdo) {
    return (
      <bdo dir="ltr" className={['inline-block text-left align-top', className].filter(Boolean).join(' ')}>
        {children}
      </bdo>
    )
  }

  return (
    <bdi dir={ltr ? 'ltr' : undefined} className={className}>
      {children}
    </bdi>
  )
}
