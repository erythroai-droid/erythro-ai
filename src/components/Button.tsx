'use client'

import React from 'react'

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

/** Shared pressed feedback — clear on touch where hover does not stick. */
const pressedMotion =
  'active:scale-[0.97] active:brightness-[0.96] active:transition-[transform,filter,background-color,border-color,color,box-shadow] active:duration-100'

export default function Button({
  variant = 'light-accent',
  showArrow = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  
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
      // Custom Let's Talk button in Navbar
      variantClasses =
        'py-3 px-8 rounded-[var(--xl,40px)] border border-gold-500 text-gold-500 bg-transparent hover:border-[var(--Button-Primary-stroke-hover,#FFE9C7)] hover:bg-[var(--Button-Primary-hover,#FFE9C7)] hover:text-coal-900 hover:shadow-[0_3px_20px_0_var(--Buttons-Primary,rgba(255,233,199,0.30))] active:border-[var(--Button-Primary-stroke-hover,#FFE9C7)] active:bg-[var(--Button-Primary-hover,#FFE9C7)] active:text-coal-900 active:shadow-[0_3px_20px_0_var(--Buttons-Primary,rgba(255,233,199,0.30))] uppercase'
      break

    case 'gold-outline':
      // Background: Coal/Alpha/Dark-30, Border: 1px solid Gold500, Text: Gold500
      // Hover/pressed: Background: gold 500, Shadow: button secondary, text: coal 900
      variantClasses =
        'py-3.5 px-8 border border-gold-500 text-gold-500 bg-[var(--coal-alpha-30)] hover:bg-gold-500 hover:text-coal-900 hover:shadow-btn-secondary active:bg-gold-500 active:text-coal-900 active:shadow-btn-secondary uppercase'
      break

    case 'white-outline':
      // Border: 1px solid white, Text: white, Hover/pressed: bg white, text coal-900
      variantClasses =
        'h-[48px] py-0 px-[40px] gap-[10px] border border-white text-white rounded-[var(--xl,40px)] hover:bg-white hover:text-coal-900 hover:border-white active:bg-white active:text-coal-900 active:border-white font-button-base-sm uppercase tracking-[2.4px]'
      break

    case 'solution-cta':
      // Solution cards: fixed Figma geometry, colors via className (include active there)
      variantClasses =
        'h-[48px] min-h-[48px] min-w-[183px] py-0 px-[40px] gap-[10px] rounded-[var(--xl,40px)] border bg-transparent text-[12px] rtl:text-[14px] leading-[18px] font-normal uppercase tracking-[2.4px]'
      break

    case 'dark-outline':
      // Variant 1 (Dark): Outline micro-button, text var(--Button-Tertiary-link, #FFE9C7)
      variantClasses =
        'h-[48px] min-h-[48px] min-w-[110px] py-0 px-[40px] border border-[var(--Button-Tertiary-link,#FFE9C7)] text-[var(--Button-Tertiary-link,#FFE9C7)] rounded-[var(--xl,40px)] hover:bg-[var(--Button-Tertiary-link,#FFE9C7)] hover:text-coal-900 hover:border-[var(--Button-Tertiary-link,#FFE9C7)] active:bg-[var(--Button-Tertiary-link,#FFE9C7)] active:text-coal-900 active:border-[var(--Button-Tertiary-link,#FFE9C7)] text-[12px] rtl:text-[14px] leading-[18px] font-normal lowercase tracking-[2.4px] bg-transparent'
      break
      
    case 'dark-text':
      // Variant 2 (Dark): No background, thin alpha border, text Coal/100, hover bg-white, text Coal/900
      variantClasses =
        'py-3 px-8 border border-white/10 text-coal-100 rounded-none bg-transparent hover:bg-white hover:text-coal-900 hover:border-white hover:-translate-y-0.5 active:bg-white active:text-coal-900 active:border-white active:translate-y-0 shadow-btn-secondary uppercase'
      break
      
    case 'dark-accent':
      // Variant 3 (Dark): Accent button, text Coal/100, hover Gold/Alpha bg, text Coal/900
      variantClasses =
        'py-3.5 px-8 border border-coal-300 text-coal-100 bg-transparent hover:bg-gold-200/20 hover:text-coal-900 hover:border-gold-500 hover:-translate-y-0.5 active:bg-gold-200/30 active:text-coal-900 active:border-gold-500 active:translate-y-0 shadow-btn-primary-dark uppercase'
      break
      
    case 'light-outline':
      // Variant 1 (Light): Thin dark border, dark text, hover/pressed white bg
      variantClasses =
        'h-[48px] min-h-[48px] min-w-[110px] py-0 px-[40px] border border-coal-900 text-coal-900 rounded-[var(--xl,40px)] hover:bg-white hover:text-coal-900 hover:border-coal-900 active:bg-white active:text-coal-900 active:border-coal-900 text-[12px] rtl:text-[14px] leading-[18px] font-normal lowercase tracking-[2.4px] bg-transparent'
      break
      
    case 'light-inverted':
      // Variant 2 (Light): Light/creamy/beige background, white text, hover white bg, dark text
      variantClasses =
        'py-3 px-8 text-white bg-gold-800 border border-gold-800 hover:bg-white hover:text-coal-900 hover:border-coal-900 hover:-translate-y-0.5 active:bg-white active:text-coal-900 active:border-coal-900 active:translate-y-0 shadow-btn-secondary uppercase'
      break
      
    case 'light-accent':
    default:
      // Variant 3 (Light): Solid Red Erythro — pressed darkens fill so tap is obvious
      variantClasses =
        'py-3 px-8 bg-erythro-500 text-white border border-[var(--gold-100,#fff)] rounded-[var(--xl,40px)] hover:bg-erythro-500 hover:border-erythro-500 hover:shadow-[0_3px_20px_0_rgba(255,233,199,0.30)] active:bg-erythro-700 active:border-erythro-700 active:shadow-[0_2px_12px_0_rgba(229,36,33,0.45)] uppercase'
      break
  }

  return (
    <button className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
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
