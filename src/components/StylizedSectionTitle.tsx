import React from 'react'

interface StylizedSectionTitleProps {
  text: string
  /** Classes for the title body (color / theme). First letter stays erythro red via ::first-letter. */
  restClassName?: string
  className?: string
}

/**
 * Section heading with a red first letter + room for wide tracking.
 *
 * Uses a single text node (`::first-letter`) so scrapers/OCR/a11y see the full
 * string (e.g. "SERVICES"), not a truncated "ERVICES" from a split-span paint.
 * Inline padding keeps glyph sidebearings inside overflow:clip ancestors.
 */
export default function StylizedSectionTitle({
  text,
  restClassName,
  className = '',
}: StylizedSectionTitleProps) {
  if (!text) return null

  return (
    <span
      className={`inline-block max-w-full overflow-visible ps-[0.35em] pe-[0.55em] first-letter:text-erythro-500 ${restClassName ?? ''} ${className}`.trim()}
    >
      {text}
    </span>
  )
}
