'use client'

import { useContactModal } from './ContactModal'

/**
 * Desktop-only pulsing contact CTA (styled like the old FloatingWidget “three dots”
 * trigger: coal-800 plate, white mail icon, soft gold ping). Opens the contact modal.
 * Mobile keeps WhatsAppButton instead.
 */
export default function ChatButton() {
  const { open } = useContactModal()

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open contact form"
      className="pointer-events-auto fixed bottom-[18px] end-[18px] z-50 hidden h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-full border border-white/10 bg-coal-800 text-white shadow-lg transition-all duration-300 hover:border-gold-500 hover:bg-gold-500 hover:text-coal-900 hover:shadow-gold-500/30 lg:flex"
    >
      <span className="absolute inset-0 rounded-full bg-gold-500/20 animate-ping pointer-events-none" />
      <svg
        className="relative h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" />
      </svg>
    </button>
  )
}
