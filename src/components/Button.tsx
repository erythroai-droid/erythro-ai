'use client'

import React, { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { NAV_DONE_EVENT } from '@/components/NavigationTopLoader'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'dark-outline'    // Variant 1 on dark bg (Outline micro-button: more ➔)
    | 'dark-text'       // Variant 2 on dark bg (Text button with arrow: LET'S TALK...)
    | 'dark-accent'     // Variant 3 on dark bg (GET A START / FIND OUT MORE)
    | 'light-outline'   // Variant 1 on light bg (more ➔)
    | 'light-inverted'  // Variant 2 on light bg (LET'S TALK...)
    | 'light-accent'    // Variant 3 on light bg (Solid Erythro Red: LET'S TALK...)
    | 'gold-outline'    // Custom Gold Outline variant
    | 'nav-talk'        // Custom Navbar "Let's Talk" variant
    | 'white-outline'   // Figma Let's Talk outline variant
    | 'solution-cta'    // Solution pricing cards — unified sizing
  showArrow?: boolean
  children: React.ReactNode
}

const MOBILE_MQ = '(max-width: 1023px)'

/** Shared pressed feedback — :active for the tap, aria-busy while nav loader runs. */
const pressedMotion =
  'active:scale-[0.97] active:brightness-[0.96] aria-busy:scale-[0.97] aria-busy:brightness-[0.96] active:transition-[transform,filter,background-color,border-color,color,box-shadow] active:duration-100 aria-busy:transition-[transform,filter,background-color,border-color,color,box-shadow] aria-busy:duration-100'

export default function Button({
  variant = 'light-accent',
  showArrow = false,
  children,
  className = '',
  onClick,
  disabled,
  ...props
}: ButtonProps) {
  const pathname = usePathname()
  const pathAtPress = useRef(pathname)
  const [pending, setPending] = useState(false)

  // Release when the route actually changes (soft nav).
  useEffect(() => {
    if (!pending) return
    if (pathname !== pathAtPress.current) setPending(false)
  }, [pathname, pending])

  // Keep pressed while #nprogress is busy; release on nav-done or if nav never starts.
  useEffect(() => {
    if (!pending) return

    let sawBusy = false
    const isBusy = () => document.documentElement.classList.contains('nprogress-busy')

    const release = () => setPending(false)

    const obs = new MutationObserver(() => {
      if (isBusy()) {
        sawBusy = true
        return
      }
      if (sawBusy) release()
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    window.addEventListener(NAV_DONE_EVENT, release)

    const releaseIfIdle = window.setTimeout(() => {
      if (!isBusy()) release()
    }, 480)

    const safety = window.setTimeout(release, 10000)

    return () => {
      obs.disconnect()
      window.removeEventListener(NAV_DONE_EVENT, release)
      window.clearTimeout(releaseIfIdle)
      window.clearTimeout(safety)
    }
  }, [pending])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || disabled) return
    if (typeof window === 'undefined') return
    if (!window.matchMedia(MOBILE_MQ).matches) return

    pathAtPress.current = pathname
    setPending(true)
  }
  
  const isFixedSizeButton =
    variant === 'solution-cta' ||
    variant === 'dark-outline' ||
    variant === 'light-outline'

  // Base classes with premium micro-transitions
  const baseClasses = isFixedSizeButton
      ? `inline-flex items-center justify-center shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none cursor-pointer select-none gap-[10px] ${pressedMotion}`
      : `inline-flex items-center justify-center font-button-base font-medium rounded-radius-2xl tracking-widest transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none cursor-pointer select-none gap-2 ${pressedMotion}`

  // Map variant to styling classes
  let variantClasses = ''
  
  switch (variant) {
    case 'nav-talk':
      variantClasses =
        'py-3 px-8 rounded-[var(--xl,40px)] border border-gold-500 text-gold-500 bg-transparent hover:border-[var(--Button-Primary-stroke-hover,#FFE9C7)] hover:bg-[var(--Button-Primary-hover,#FFE9C7)] hover:text-coal-900 hover:shadow-[0_3px_20px_0_var(--Buttons-Primary,rgba(255,233,199,0.30))] active:border-[var(--Button-Primary-stroke-hover,#FFE9C7)] active:bg-[var(--Button-Primary-hover,#FFE9C7)] active:text-coal-900 active:shadow-[0_3px_20px_0_var(--Buttons-Primary,rgba(255,233,199,0.30))] aria-busy:border-[var(--Button-Primary-stroke-hover,#FFE9C7)] aria-busy:bg-[var(--Button-Primary-hover,#FFE9C7)] aria-busy:text-coal-900 aria-busy:shadow-[0_3px_20px_0_var(--Buttons-Primary,rgba(255,233,199,0.30))] uppercase'
      break

    case 'gold-outline':
      variantClasses =
        'py-3.5 px-8 border border-gold-500 text-gold-500 bg-[var(--coal-alpha-30)] hover:bg-gold-500 hover:text-coal-900 hover:shadow-btn-secondary active:bg-gold-500 active:text-coal-900 active:shadow-btn-secondary aria-busy:bg-gold-500 aria-busy:text-coal-900 aria-busy:shadow-btn-secondary uppercase'
      break

    case 'white-outline':
      variantClasses =
        'h-[48px] py-0 px-[40px] gap-[10px] border border-white text-white rounded-[var(--xl,40px)] hover:bg-white hover:text-coal-900 hover:border-white active:bg-white active:text-coal-900 active:border-white aria-busy:bg-white aria-busy:text-coal-900 aria-busy:border-white font-button-base-sm uppercase tracking-[2.4px]'
      break

    case 'solution-cta':
      variantClasses =
        'h-[48px] min-h-[48px] min-w-[183px] py-0 px-[40px] gap-[10px] rounded-[var(--xl,40px)] border bg-transparent text-[12px] rtl:text-[14px] leading-[18px] font-normal uppercase tracking-[2.4px]'
      break

    case 'dark-outline':
      variantClasses =
        'h-[48px] min-h-[48px] min-w-[110px] py-0 px-[40px] border border-[var(--Button-Tertiary-link,#FFE9C7)] text-[var(--Button-Tertiary-link,#FFE9C7)] rounded-[var(--xl,40px)] hover:bg-[var(--Button-Tertiary-link,#FFE9C7)] hover:text-coal-900 hover:border-[var(--Button-Tertiary-link,#FFE9C7)] active:bg-[var(--Button-Tertiary-link,#FFE9C7)] active:text-coal-900 active:border-[var(--Button-Tertiary-link,#FFE9C7)] aria-busy:bg-[var(--Button-Tertiary-link,#FFE9C7)] aria-busy:text-coal-900 aria-busy:border-[var(--Button-Tertiary-link,#FFE9C7)] text-[12px] rtl:text-[14px] leading-[18px] font-normal lowercase tracking-[2.4px] bg-transparent'
      break
      
    case 'dark-text':
      variantClasses =
        'py-3 px-8 border border-white/10 text-coal-100 rounded-none bg-transparent hover:bg-white hover:text-coal-900 hover:border-white hover:-translate-y-0.5 active:bg-white active:text-coal-900 active:border-white active:translate-y-0 aria-busy:bg-white aria-busy:text-coal-900 aria-busy:border-white aria-busy:translate-y-0 shadow-btn-secondary uppercase'
      break
      
    case 'dark-accent':
      variantClasses =
        'py-3.5 px-8 border border-coal-300 text-coal-100 bg-transparent hover:bg-gold-200/20 hover:text-coal-900 hover:border-gold-500 hover:-translate-y-0.5 active:bg-gold-200/30 active:text-coal-900 active:border-gold-500 active:translate-y-0 aria-busy:bg-gold-200/30 aria-busy:text-coal-900 aria-busy:border-gold-500 aria-busy:translate-y-0 shadow-btn-primary-dark uppercase'
      break
      
    case 'light-outline':
      variantClasses =
        'h-[48px] min-h-[48px] min-w-[110px] py-0 px-[40px] border border-coal-900 text-coal-900 rounded-[var(--xl,40px)] hover:bg-white hover:text-coal-900 hover:border-coal-900 active:bg-white active:text-coal-900 active:border-coal-900 aria-busy:bg-white aria-busy:text-coal-900 aria-busy:border-coal-900 text-[12px] rtl:text-[14px] leading-[18px] font-normal lowercase tracking-[2.4px] bg-transparent'
      break
      
    case 'light-inverted':
      variantClasses =
        'py-3 px-8 text-white bg-gold-800 border border-gold-800 hover:bg-white hover:text-coal-900 hover:border-coal-900 hover:-translate-y-0.5 active:bg-white active:text-coal-900 active:border-coal-900 active:translate-y-0 aria-busy:bg-white aria-busy:text-coal-900 aria-busy:border-coal-900 aria-busy:translate-y-0 shadow-btn-secondary uppercase'
      break
      
    case 'light-accent':
    default:
      variantClasses =
        'py-3 px-8 bg-erythro-500 text-white border border-[var(--gold-100,#fff)] rounded-[var(--xl,40px)] hover:bg-erythro-500 hover:border-erythro-500 hover:shadow-[0_3px_20px_0_rgba(255,233,199,0.30)] active:bg-erythro-700 active:border-erythro-700 active:shadow-[0_2px_12px_0_rgba(229,36,33,0.45)] aria-busy:bg-erythro-700 aria-busy:border-erythro-700 aria-busy:shadow-[0_2px_12px_0_rgba(229,36,33,0.45)] uppercase'
      break
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${pending ? 'pointer-events-none' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      aria-busy={pending || undefined}
      {...props}
    >
      <span>{children}</span>
      {showArrow && (
        <span className="inline-block transform transition-transform duration-300 rtl:rotate-180 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="11" viewBox="0 0 10 11" fill="none" className="w-2.5 h-2.5">
            <path
              d="M9.67029 5.15683L5.15651 5.15753M5.15004 5.15753L0.250037 5.15753M5.15004 0.25L9.40026 4.5004C9.57253 4.67269 9.6693 4.90636 9.6693 5.15C9.6693 5.39364 9.57253 5.62731 9.40026 5.7996L5.15004 10.05"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </button>
  )
}
