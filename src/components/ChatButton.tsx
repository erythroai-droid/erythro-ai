'use client'

import { useContactModal } from './ContactModal'

/**
 * Desktop-only pulsing chat CTA. Opens the same contact modal as “Let's Talk”.
 * Mobile keeps WhatsAppButton instead.
 */
export default function ChatButton() {
  const { open } = useContactModal()

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open chat"
      className="pointer-events-auto fixed bottom-[24px] end-[24px] z-50 hidden h-[54px] w-[54px] cursor-pointer items-center justify-center lg:flex"
    >
      <span className="absolute inset-0 rounded-full bg-erythro-500 opacity-60 animate-ping" />
      <span className="relative flex h-[54px] w-[54px] items-center justify-center rounded-full bg-erythro-500 text-white shadow-lg shadow-erythro-500/40 transition-transform duration-300 hover:scale-105 active:scale-95">
        <svg
          className="h-[26px] w-[26px]"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" />
          <path d="M7 9H17V11H7V9ZM7 6H17V8H7V6ZM7 12H14V14H7V12Z" />
        </svg>
      </span>
    </button>
  )
}
