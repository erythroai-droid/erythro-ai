'use client'

import React from 'react'
import Link from 'next/link'
import { BorderBeam } from 'border-beam'

/** Hide header CTA until AI Audit MVP is publicly ready. */
export const AI_AUDIT_HEADER_CTA_ENABLED = false

const SparklesIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden
  >
    <path d="M9.5 3C9.5 8 5.5 11.5 1 11.5C5.5 11.5 9.5 15 9.5 20C9.5 15 13.5 11.5 18 11.5C13.5 11.5 9.5 8 9.5 3Z" />
    <path d="M17.5 2C17.5 5 15 6.5 12.5 6.5C15 6.5 17.5 8 17.5 11C17.5 8 20 6.5 22.5 6.5C20 6.5 17.5 5 17.5 2Z" />
    <path d="M16.5 14C16.5 16.5 14.5 18 12.5 18C14.5 18 16.5 19.5 16.5 22C16.5 19.5 18.5 18 20.5 18C18.5 18 16.5 16.5 16.5 14Z" />
  </svg>
)

interface AiAuditHeaderButtonProps {
  currentLocale: string
  className?: string
}

export default function AiAuditHeaderButton({
  currentLocale,
  className = '',
}: AiAuditHeaderButtonProps) {
  if (!AI_AUDIT_HEADER_CTA_ENABLED) {
    return null
  }

  const label =
    currentLocale === 'ru'
      ? 'AI-аудит'
      : currentLocale === 'he'
        ? 'ביקורת AI'
        : 'AI Audit'

  return (
    <div className={`relative inline-flex items-center justify-center overflow-visible pointer-events-auto ${className}`}>
      <BorderBeam
        size="pulse-outside"
        colorVariant="colorful"
        duration={2.2}
        strength={1}
        className="overflow-visible"
      >
        <Link
          href="/audit"
          className="group relative flex h-[30px] items-center gap-1.5 rounded-full border border-white/15 bg-coal-950/80 bg-gradient-to-r from-violet-950/75 via-fuchsia-950/65 to-amber-950/70 px-3.5 py-1 text-white backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.08)] transition-all duration-300 hover:from-violet-900/60 hover:via-fuchsia-900/50 hover:to-amber-900/55 hover:border-white/25 hover:scale-105 active:scale-95 cursor-pointer select-none"
          aria-label={label}
        >
          <SparklesIcon className="h-3.5 w-3.5 text-gold-200 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 drop-shadow-[0_0_6px_rgba(255,233,199,0.6)]" />
          <span className="font-sans text-[10px] font-normal uppercase tracking-[0.1em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] whitespace-nowrap">
            {label}
          </span>
        </Link>
      </BorderBeam>
    </div>
  )
}
