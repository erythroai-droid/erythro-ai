import type { ReactNode } from 'react'

type BidiTextProps = {
  children: ReactNode
  className?: string
  /** Force LTR even when the string starts with a RTL letter. */
  forceLtr?: boolean
}

/**
 * Isolates a text run so punctuation, commas, and currency (₪) in Hebrew RTL
 * layouts do not jump to the wrong side of the line.
 *
 * Uses `<bdi>` (`unicode-bidi: isolate`). Latin-leading / currency values get
 * `dir="ltr"`; otherwise `dir="auto"` keeps pure Hebrew prose correct.
 */
export default function BidiText({ children, className, forceLtr = false }: BidiTextProps) {
  const text = typeof children === 'string' ? children.trim() : ''
  const ltr =
    forceLtr || (text.length > 0 && (/[₪$€£]/.test(text) || /^[\dA-Za-z]/.test(text)))

  return (
    <bdi dir={ltr ? 'ltr' : undefined} className={className}>
      {children}
    </bdi>
  )
}
