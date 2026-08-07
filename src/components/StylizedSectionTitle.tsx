import React from 'react'

interface StylizedSectionTitleProps {
  text: string
  /** Classes for the remainder of the title (color / theme). */
  restClassName?: string
  className?: string
}

/**
 * Section heading with a red first letter + wide tracking.
 *
 * Large `letter-spacing` + `overflow: hidden/clip` ancestors often slice the
 * first glyph (and the opposite edge in RTL). An inline-block with symmetric
 * inline padding keeps sidebearings and trailing tracking inside the box.
 */
export default function StylizedSectionTitle({
  text,
  restClassName,
  className = '',
}: StylizedSectionTitleProps) {
  if (!text) return null

  const chars = Array.from(text)
  const firstChar = chars[0] ?? ''
  const rest = chars.slice(1).join('')

  return (
    <span
      aria-label={text}
      className={`inline-block max-w-full ps-[0.22em] pe-[0.42em] ${className}`.trim()}
    >
      <span aria-hidden="true" className="text-erythro-500">
        {firstChar}
      </span>
      {rest ? (
        <span aria-hidden="true" className={restClassName}>
          {rest}
        </span>
      ) : null}
    </span>
  )
}
