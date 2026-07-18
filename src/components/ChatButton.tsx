'use client'

import { useContactModal } from './ContactModal'

/**
 * Desktop-only pulsing chat CTA (styled like the old FloatingWidget “three dots”
 * trigger: coal-800 plate, white icon, soft gold ping). Opens the contact modal.
 * Mobile keeps WhatsAppButton instead.
 */
export default function ChatButton() {
  const { open } = useContactModal()

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open chat"
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
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" />
        <path d="M7 9H17V11H7V9ZM7 6H17V8H7V6ZM7 12H14V14H7V12Z" />
      </svg>
    </button>
  )
}
