'use client'

import { ThinkingOrb } from 'thinking-orbs'

/**
 * Chat thinking chip: dotted working-orb + status label, same pattern as
 * the libraries.dev / thinking-orbs “Working” playground chip.
 */
export default function ThinkingStatus({ label }: { label: string }) {
  return (
    <div className="consult__working" role="status" aria-live="polite" aria-label={label}>
      <span className="consult__workingOrb" aria-hidden>
        <ThinkingOrb state="working" size={20} theme="dark" />
      </span>
      <span className="consult__workingLabel">
        {label}
        <span className="consult__workingDots" aria-hidden />
      </span>
    </div>
  )
}
