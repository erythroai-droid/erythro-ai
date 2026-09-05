import React from 'react'

export const FORM_SUBMIT_CLASS =
  'flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-erythro-500 px-8 py-3 text-sm font-medium uppercase tracking-widest text-white shadow-none transition-[box-shadow,transform,opacity] duration-300 ease-out hover:shadow-[0_3px_20px_0_rgba(229,36,33,0.45)] disabled:cursor-wait disabled:hover:shadow-none'

export function requiredPlaceholder(text: string) {
  return `${text} *`
}

export function FormPillShell({
  isLight,
  hasError,
  clip = false,
  tall = false,
  children,
}: {
  isLight: boolean
  hasError?: boolean
  /** Clip Chrome autofill squares to the pill. Off when a child opens a dropdown. */
  clip?: boolean
  /** Multi-line fields keep a 24px radius instead of a capsule. */
  tall?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={`audit-pill-shell flex min-w-0 flex-col rounded-[24px] border ${
        tall ? '' : 'sm:flex-row sm:rounded-full'
      } ${clip ? 'overflow-hidden' : 'overflow-visible'} ${
        hasError
          ? 'border-erythro-500'
          : isLight
            ? 'border-coal-900/15'
            : 'border-white/15'
      } ${isLight ? 'bg-white' : 'bg-white/[0.04]'}`}
    >
      {children}
    </div>
  )
}

export function FormPillDivider({ isLight }: { isLight: boolean }) {
  return (
    <div
      className={`hidden h-auto w-px shrink-0 self-stretch sm:block ${
        isLight ? 'bg-coal-900/15' : 'bg-white/15'
      }`}
      aria-hidden
    />
  )
}

export function formPillFieldClass(isLight: boolean) {
  return `h-12 w-full min-w-0 flex-1 border-0 bg-transparent ps-4 pe-4 text-sm outline-none sm:h-[52px] ${
    isLight
      ? 'text-coal-900 placeholder:text-coal-900/40'
      : 'text-white placeholder:text-white/40'
  } rtl:placeholder:text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-erythro-500`
}

export function formPillTextareaClass(isLight: boolean) {
  return `min-h-[120px] w-full min-w-0 flex-1 resize-none border-0 bg-transparent px-4 py-3 text-sm outline-none ${
    isLight
      ? 'text-coal-900 placeholder:text-coal-900/40'
      : 'text-white placeholder:text-white/40'
  } rtl:placeholder:text-right focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-erythro-500`
}
