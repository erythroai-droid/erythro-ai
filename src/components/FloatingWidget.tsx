'use client'

import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { useSiteContent } from './SiteContentProvider'

// SVG Icon Components inlined for dynamic styling, sizing, and theme responsiveness
const HumanIcon = ({ className = 'w-[24.6px] h-[24.6px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 23 25" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.485 4.26625C8.995 3.77625 8.75 3.1875 8.75 2.5C8.75 1.8125 8.995 1.22417 9.485 0.735002C9.975 0.245835 10.5633 0.000835452 11.25 2.11864e-06C11.9367 -0.000831215 12.5254 0.244169 13.0163 0.735002C13.5071 1.22584 13.7517 1.81417 13.75 2.5C13.7483 3.18584 13.5037 3.77459 13.0163 4.26625C12.5288 4.75792 11.94 5.0025 11.25 5C10.56 4.9975 9.97167 4.75292 9.485 4.26625ZM7.5 25V8.75H0V6.25H22.5V8.75H15V25H12.5V17.5H10V25H7.5Z" />
  </svg>
)


const LangIcon = ({ className = 'w-[12.5px] h-[12.5px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 21 21" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.375 7.00009H18.875M1.375 13.2501H18.875M0.75 10.1251C0.75 11.3562 0.992491 12.5753 1.46363 13.7127C1.93477 14.8502 2.62532 15.8837 3.49587 16.7542C4.36642 17.6248 5.39992 18.3153 6.53734 18.7865C7.67477 19.2576 8.89386 19.5001 10.125 19.5001C11.3561 19.5001 12.5752 19.2576 13.7127 18.7865C14.8501 18.3153 15.8836 17.6248 16.7541 16.7542C17.6247 15.8837 18.3152 14.8502 18.7864 13.7127C19.2575 12.5753 19.5 11.3562 19.5 10.1251C19.5 7.63869 18.5123 5.25412 16.7541 3.49597C14.996 1.73781 12.6114 0.750092 10.125 0.750092C7.6386 0.750092 5.25403 1.73781 3.49587 3.49597C1.73772 5.25412 0.75 7.63869 0.75 10.1251Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.60415 0.750092C7.84929 3.56219 6.91895 6.81037 6.91895 10.1251C6.91895 13.4398 7.84929 16.688 9.60415 19.5001M10.6458 0.750092C12.4007 3.56219 13.331 6.81037 13.331 10.1251C13.331 13.4398 12.4007 16.688 10.6458 19.5001" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ThemeIcon = ({ className = 'w-[24.6px] h-[24.6px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 29 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.16398 7.92632C6.28238 8.04473 6.41394 8.1434 6.57181 8.20918C6.7231 8.27496 6.88755 8.30785 7.052 8.30785C7.21645 8.30785 7.3809 8.27496 7.53877 8.21576C7.69664 8.15655 7.83478 8.05788 7.9466 7.93948C8.06501 7.82107 8.1571 7.68294 8.22288 7.53165C8.28866 7.38035 8.31497 7.2159 8.31497 7.04487C8.31497 6.88043 8.28208 6.71598 8.2163 6.56469C8.15052 6.4134 8.05843 6.27525 7.93345 6.15685L6.16398 4.38738C5.92717 4.15057 5.61143 4.01901 5.28253 4.01901C4.95363 4.01901 4.63131 4.15057 4.40108 4.38738C4.16427 4.62418 4.03271 4.93993 4.03271 5.26883C4.03271 5.59772 4.16427 5.92005 4.40108 6.15027L6.17055 7.91975L6.16398 7.92632Z" />
    <path d="M4.99925 14.9977C4.99925 14.6688 4.86769 14.3465 4.63088 14.1163C4.39407 13.8795 4.07834 13.7479 3.74944 13.7479H1.24981C0.920915 13.7479 0.598593 13.8795 0.368364 14.1163C0.138136 14.3531 0 14.6688 0 14.9977C0 15.3266 0.131558 15.6489 0.368364 15.8792C0.605171 16.1094 0.920915 16.2475 1.24981 16.2475H3.74944C4.07834 16.2475 4.40065 16.116 4.63088 15.8792C4.86769 15.6423 4.96769 15.6423 4.99925 14.9977Z" />
    <path d="M14.9983 4.99925C15.3272 4.99925 15.6496 4.86769 15.8798 4.63089C16.1166 4.39408 16.2482 4.07834 16.2482 3.74944V1.24981C16.2482 0.920915 16.1166 0.598593 15.8798 0.368364C15.643 0.138136 15.3272 0 14.9983 0C14.6694 0 14.3471 0.131558 14.1169 0.368364C13.8867 0.605171 13.7485 0.920915 13.7485 1.24981V3.74944C13.7485 4.07834 13.8801 4.40066 14.1169 4.63089C14.3537 4.86769 14.6694 4.99925 14.9983 4.99925Z" />
    <path d="M7.9459 22.0494C7.82749 21.931 7.68936 21.8389 7.53806 21.7797C7.38677 21.7205 7.22232 21.6876 7.05129 21.6876C6.88685 21.6876 6.72239 21.7205 6.5711 21.7863C6.41981 21.852 6.28167 21.9441 6.16327 22.0691L4.3938 23.8386C4.16357 24.0754 4.03859 24.3911 4.04517 24.72C4.04517 25.0489 4.17673 25.3581 4.41353 25.5949C4.64376 25.8251 4.9595 25.9567 5.2884 25.9633C5.6173 25.9698 5.93304 25.8383 6.16985 25.6146L7.93932 23.8452C8.05772 23.7268 8.15639 23.5952 8.22217 23.4373C8.28795 23.286 8.32084 23.1216 8.32084 22.9571C8.32084 22.7927 8.28795 22.6282 8.22875 22.4704C8.16297 22.3191 8.07087 22.1744 7.95247 22.0625L7.9459 22.0494Z" />
    <path d="M18.9184 21.3916C18.675 21.2338 18.4382 21.0562 18.2079 20.8654C17.3923 20.1945 16.7608 19.4051 16.3069 18.5105C15.853 17.6093 15.5768 16.6818 15.4847 15.7149C15.3926 14.7479 15.4847 13.781 15.7675 12.814C16.0438 11.847 16.524 10.9524 17.1949 10.1433C17.708 9.525 18.2803 9.01192 18.9052 8.59751C17.7409 7.88709 16.3924 7.49899 14.9979 7.49899C13.0114 7.49899 11.1037 8.28835 9.69606 9.69603C8.28837 11.1037 7.49902 13.0113 7.49902 14.9979C7.49902 16.9844 8.28837 18.892 9.69606 20.2997C11.1037 21.7074 13.0114 22.4967 14.9979 22.4967C16.9844 22.4967 17.7475 22.1086 18.9184 21.3916Z" />
    <path d="M14.9983 24.9962C14.6694 24.9962 14.3471 25.1277 14.1169 25.3645C13.8867 25.6014 13.7485 25.9171 13.7485 26.246V28.7456C13.7485 29.0745 13.8801 29.3968 14.1169 29.6271C14.3537 29.8573 14.6694 29.9954 14.9983 29.9954C15.3272 29.9954 15.6496 29.8639 15.8798 29.6271C16.11 29.3903 16.2482 29.0745 16.2482 28.7456V26.246C16.2482 25.9171 16.1166 25.5948 15.8798 25.3645C15.643 25.1343 15.3272 24.9962 14.9983 24.9962Z" />
    <path d="M19.7596 19.9563C19.0486 19.3626 18.4942 18.6634 18.0963 17.8718C17.6984 17.0735 17.457 16.2489 17.3788 15.398C17.3005 14.547 17.3788 13.6894 17.6266 12.8318C17.868 11.9742 18.2855 11.1826 18.879 10.4636C19.9031 9.21016 21.2012 8.43834 22.7732 8.14149C24.3453 7.84463 25.8325 8.08871 27.248 8.88032C26.4 9.59937 25.7673 10.4702 25.3498 11.4861C24.9323 12.502 24.7758 13.564 24.8802 14.6789C24.9845 15.7938 25.3368 16.8097 25.9369 17.7266C26.537 18.6436 27.3197 19.3824 28.2851 19.9234C27.0523 20.9722 25.6368 21.5 24.0387 21.5066C22.434 21.5066 21.0186 20.992 19.7792 19.9563H19.7596Z" />
  </svg>
)

const BellIcon = ({ className = 'w-[12.5px] h-[12.5px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 18 21" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 17V18H0V17L2 15V9C2 5.9 4.03 3.17 7 2.29V2C7 1.46957 7.21071 0.960859 7.58579 0.585786C7.96086 0.210714 8.46957 0 9 0C9.53043 0 10.0391 0.210714 10.4142 0.585786C10.7893 0.960859 11 1.46957 11 2V2.29C13.97 3.17 16 5.9 16 9V15L18 17ZM11 19C11 19.5304 10.7893 20.0391 10.4142 20.4142C10.0391 20.7893 9.53043 21 9 21C8.46957 21 7.96086 20.7893 7.58579 20.4142C7.21071 20.0391 7 19.5304 7 19" />
  </svg>
)

const PhoneIcon = ({ className = 'w-[12.5px] h-[12.5px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 18 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.62 7.79C5.06 10.62 7.38 12.93 10.21 14.38L12.41 12.18C12.68 11.91 13.08 11.82 13.43 11.94C14.55 12.31 15.76 12.51 17 12.51C17.55 12.51 18 12.96 18 13.51V17C18 17.55 17.55 18 17 18C7.61 18 0 10.39 0 1C0 0.45 0.45 0 1 0H4.5C5.05 0 5.5 0.45 5.5 1C5.5 2.25 5.7 3.45 6.07 4.57C6.18 4.92 6.1 5.31 5.82 5.59L3.62 7.79Z" />
  </svg>
)

const FacebookIcon = ({ className = 'w-[13.8px] h-[18.5px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 10 17" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.66667 9.775H9.04762L10 6.375H6.66667V4.675C6.66667 3.7995 6.66667 2.975 8.57143 2.975H10V0.119C9.68952 0.0824501 8.51714 0 7.27905 0C4.69333 0 2.85714 1.40845 2.85714 3.995V6.375H0V9.775H2.85714V17H6.66667V9.775Z" />
  </svg>
)

const TelegramIcon = ({ className = 'w-[18.5px] h-[18.5px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
)

const ENIcon = ({ className = 'w-[23px] h-[13.8px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 18 11" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M-6.65933e-05 10.1818V5.24521e-06H6.86073V1.77486H2.15263V4.201H6.50775V5.97586H2.15263V8.40697H6.88062V10.1818H-6.65933e-05ZM17.0885 5.24521e-06V10.1818H15.2292L10.7995 3.77344H10.7249V10.1818H8.5722V5.24521e-06H10.4614L14.8563 6.40341H14.9458V5.24521e-06H17.0885Z" />
  </svg>
)

const RUIcon = ({ className = 'w-[23px] h-[13.8px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 18 11" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M-6.65933e-05 10.1818V5.24521e-06H4.01698C4.78592 5.24521e-06 5.44217 0.137553 5.98573 0.412647C6.5326 0.684428 6.94856 1.07055 7.2336 1.57103C7.52195 2.06819 7.66613 2.65318 7.66613 3.326C7.66613 4.00214 7.52029 4.58381 7.22863 5.07103C6.93696 5.55493 6.51438 5.92614 5.96087 6.18466C5.41068 6.44319 4.74449 6.57245 3.96229 6.57245H1.27266V4.84233H3.61428C4.02526 4.84233 4.36665 4.78599 4.63843 4.6733C4.91021 4.56061 5.11239 4.39158 5.24496 4.1662C5.38085 3.94082 5.4488 3.66075 5.4488 3.326C5.4488 2.98793 5.38085 2.70289 5.24496 2.47089C5.11239 2.23888 4.90855 2.06322 4.63346 1.9439C4.36168 1.82126 4.01864 1.75995 3.60434 1.75995H2.15263V10.1818H-6.65933e-05ZM5.49851 5.5483L8.02905 10.1818H5.65263L3.17678 5.5483H5.49851ZM15.4765 5.24521e-06H17.6292V6.61222C17.6292 7.35465 17.4519 8.00427 17.0972 8.56109C16.7459 9.1179 16.2537 9.55209 15.6207 9.86364C14.9876 10.1719 14.2502 10.326 13.4083 10.326C12.5631 10.326 11.824 10.1719 11.191 9.86364C10.5579 9.55209 10.0657 9.1179 9.71442 8.56109C9.3631 8.00427 9.18743 7.35465 9.18743 6.61222V5.24521e-06H11.3401V6.42827C11.3401 6.81606 11.4246 7.16075 11.5937 7.46236C11.766 7.76397 12.008 8.00095 12.3195 8.1733C12.6311 8.34565 12.994 8.43182 13.4083 8.43182C13.8259 8.43182 14.1889 8.34565 14.4971 8.1733C14.8086 8.00095 15.0489 7.76397 15.218 7.46236C15.3903 7.16075 15.4765 6.81606 15.4765 6.42827V5.24521e-06Z" />
  </svg>
)

const HEIcon = ({ className = 'w-[23px] h-[13.8px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 18 11" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M0.000177547 10.1818V5.24521e-06H2.15288V4.201H6.5229V5.24521e-06H8.67063V10.1818H6.5229V5.97586H2.15288V10.1818H0.000177547ZM10.4455 10.1818V5.24521e-06H17.3063V1.77486H12.5982V4.201H16.9533V5.97586H12.5982V8.40697H17.3262V10.1818H10.4455Z" />
  </svg>
)

interface FloatingWidgetProps {
  locale: string
  setLocale: (locale: string) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  onOpenAccessibility: () => void
}

export default function FloatingWidget({
  locale,
  setLocale,
  theme,
  setTheme,
  onOpenAccessibility,
}: FloatingWidgetProps) {
  const site = useSiteContent().siteSettings
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeMobileSubmenu, setActiveMobileSubmenu] = useState<string | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  
  const menuContainerRef = useRef<HTMLDivElement | null>(null)

  // Scroll listener to toggle "Back to Top" visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // GSAP animation for vertical menu items staggered entry/exit
  useEffect(() => {
    if (isMenuOpen) {
      gsap.fromTo(
        '.floating-menu-item',
        { opacity: 0, y: 15, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.35,
          stagger: 0.05,
          ease: 'back.out(1.2)',
          overwrite: 'auto',
        }
      )
    }
  }, [isMenuOpen])

  const toggleMenu = () => {
    if (isMenuOpen) {
      // Animate items down before hiding
      gsap.to('.floating-menu-item', {
        opacity: 0,
        y: 15,
        scale: 0.9,
        duration: 0.25,
        stagger: { each: 0.04, from: 'end' },
        ease: 'power2.in',
        overwrite: 'auto',
        onComplete: () => {
          setIsMenuOpen(false)
          setActiveMobileSubmenu(null)
        },
      })
    } else {
      setIsMenuOpen(true)
    }
  }

  const handleMobileSubmenu = (menu: string) => {
    setActiveMobileSubmenu((prev) => (prev === menu ? null : menu))
  }

  const isRTL = locale === 'he'

  // Click outside handler to collapse the vertical launcher menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
        if (isMenuOpen) {
          toggleMenu()
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  // Get active wrapper classes dynamically to avoid pointer-events conflicts in CSS specificity
  const getSubmenuClasses = (menu: string) => {
    const isMobileActive = activeMobileSubmenu === menu
    const base = `absolute top-1/2 -translate-y-1/2 transition-all duration-300 transform scale-95 flex items-center`
    const position = isRTL
      ? `left-full pl-[14px] origin-left`
      : `right-full pr-[14px] origin-right`

    if (isMobileActive) {
      return `${base} ${position} opacity-100 pointer-events-auto scale-100`
    }
    return `${base} ${position} opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100`
  }

  const submenuInnerClass = `flex items-center gap-[7px] p-[5px] bg-coal-800 border border-white/5 rounded-full shadow-lg`

  return (
    <div
      ref={menuContainerRef}
      className={`fixed bottom-[18px] z-50 flex items-end gap-[14px] select-none pointer-events-auto flex-row ${
        isRTL ? 'left-[18px]' : 'right-[18px]'
      }`}
    >
      <style>{`
        @keyframes loadingDot {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          40% {
            transform: translateY(-5px);
            opacity: 1;
          }
        }
        .animate-dot-1 {
          animation: loadingDot 1.2s infinite ease-in-out;
          animation-delay: 0s;
        }
        .animate-dot-2 {
          animation: loadingDot 1.2s infinite ease-in-out;
          animation-delay: 0.2s;
        }
        .animate-dot-3 {
          animation: loadingDot 1.2s infinite ease-in-out;
          animation-delay: 0.4s;
        }
      `}</style>
      {/* 1. Accessibility Button */}
      <button
        onClick={onOpenAccessibility}
        className="w-[44px] h-[44px] rounded-full bg-erythro-500 hover:bg-gold-500 hover:text-coal-900 text-white flex items-center justify-center border border-white/10 hover:border-gold-500 hover:shadow-lg hover:shadow-gold-500/30 transition-all duration-300 cursor-pointer relative group"
        aria-label={locale === 'ru' ? 'Настройки доступности' : locale === 'he' ? 'הגדרות נגישות' : 'Accessibility settings'}
      >
        <HumanIcon className="w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-110" />
        <span className="absolute bottom-[52px] left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 border border-white/10 text-[13.5px] font-bold text-white uppercase tracking-widest rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          {locale === 'ru' ? 'Доступность' : locale === 'he' ? 'נגישות' : 'Accessibility'}
        </span>
      </button>

      {/* Back to Top Button */}
      <div
        className={`transition-all duration-300 flex shrink-0 justify-center items-center ${
          showScrollTop
            ? 'w-[44px] me-0 opacity-100 scale-100'
            : 'w-0 -me-[14px] opacity-0 scale-0 pointer-events-none'
        }`}
      >
        <button
          onClick={scrollToTop}
          className="w-[44px] h-[44px] rounded-full bg-coal-800 hover:bg-gold-500 hover:text-coal-900 text-white flex items-center justify-center border border-white/10 hover:border-gold-500 hover:shadow-lg hover:shadow-gold-500/30 transition-all duration-300 cursor-pointer relative group overflow-hidden"
          aria-label={locale === 'ru' ? 'Наверх' : locale === 'he' ? 'לראש העמוד' : 'Back to top'}
        >
          <svg
            className="w-[16px] h-[16px] transition-transform duration-300 group-hover:-translate-y-1"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
          </svg>
          <span className="absolute bottom-[52px] left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 border border-white/10 text-[13.5px] font-bold text-white uppercase tracking-widest rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            {locale === 'ru' ? 'Вверх' : locale === 'he' ? 'למעלה' : 'Top'}
          </span>
        </button>
      </div>

      {/* 2. Menu Wrapper (Vertical Menu + Trigger) */}
      <div className="flex flex-col items-center gap-[14px] relative">
        {/* Vertical Stack */}
        {isMenuOpen && (
          <div className="flex flex-col items-center gap-[14px]">
            {/* ITEM 4: Contacts */}
            <div className="relative group floating-menu-item">
              <button
                onClick={() => handleMobileSubmenu('contacts')}
                className="w-[37px] h-[37px] rounded-full bg-coal-800 border border-white/10 text-white hover:bg-gold-500 hover:text-coal-900 hover:border-gold-500 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-md group/btn"
                aria-label={locale === 'ru' ? 'Контакты' : locale === 'he' ? 'יצירת קשר' : 'Contacts'}
                aria-expanded={activeMobileSubmenu === 'contacts'}
              >
                <PhoneIcon className="w-[15px] h-[15px] transition-transform duration-300 group-hover/btn:scale-110 group-hover/btn:rotate-12" />
              </button>
              {/* Flyout horizontally */}
              <div className={getSubmenuClasses('contacts')}>
                <div className={submenuInnerClass}>
                  <a
                    href={`tel:${site.phone}`}
                    className="px-[14px] py-[7px] rounded-full hover:bg-gold-500 hover:text-coal-900 text-[18px] font-mono font-bold text-white flex items-center gap-1.5 transition-all whitespace-nowrap group/phone-link"
                  >
                    <PhoneIcon className="w-[9.5px] h-[9.5px] transition-transform duration-300 group-hover/phone-link:scale-110 group-hover/phone-link:rotate-12" />
                    <bdi dir="ltr">{site.phoneDisplay}</bdi>
                  </a>
                </div>
              </div>
            </div>

            {/* ITEM 3: Notifications */}
            <div className="relative group floating-menu-item">
              <button
                onClick={() => handleMobileSubmenu('bell')}
                className="w-[37px] h-[37px] rounded-full bg-coal-800 border border-white/10 text-white hover:bg-gold-500 hover:text-coal-900 hover:border-gold-500 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-md group/btn"
                aria-label={locale === 'ru' ? 'Соцсети' : locale === 'he' ? 'רשתות חברתיות' : 'Social links'}
                aria-expanded={activeMobileSubmenu === 'bell'}
              >
                <BellIcon className="w-[15px] h-[15px] transition-transform duration-300 group-hover/btn:scale-110 group-hover/btn:rotate-[-12deg]" />
              </button>
              {/* Flyout horizontally */}
              <div className={getSubmenuClasses('bell')}>
                <div className={submenuInnerClass}>
                  <a
                    href={site.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[30px] h-[30px] rounded-full hover:bg-gold-500 hover:text-coal-900 text-white flex items-center justify-center transition-all group/fb-link"
                    aria-label="Facebook"
                  >
                    <FacebookIcon className="w-[11px] h-[15px] transition-transform duration-300 group-hover/fb-link:scale-115" />
                  </a>
                  <a
                    href={site.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[30px] h-[30px] rounded-full hover:bg-gold-500 hover:text-coal-900 text-white flex items-center justify-center transition-all group/tg-link"
                    aria-label="Telegram"
                  >
                    <TelegramIcon className="w-[15px] h-[15px] transition-transform duration-300 group-hover/tg-link:scale-115" />
                  </a>
                </div>
              </div>
            </div>

            {/* ITEM 2: Theme Switcher */}
            <div className="relative group floating-menu-item">
              <button
                onClick={() => handleMobileSubmenu('theme')}
                className="w-[37px] h-[37px] rounded-full bg-coal-800 border border-white/10 text-white hover:bg-gold-500 hover:text-coal-900 hover:border-gold-500 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-md group/btn"
                aria-label={locale === 'ru' ? 'Тема оформления' : locale === 'he' ? 'ערכת נושא' : 'Theme'}
                aria-expanded={activeMobileSubmenu === 'theme'}
              >
                <ThemeIcon className="w-[14px] h-[14px] transition-transform duration-300 group-hover/btn:scale-110 group-hover/btn:rotate-12" />
              </button>
              {/* Flyout horizontally */}
              <div className={getSubmenuClasses('theme')}>
                <div className={submenuInnerClass}>
                  <button
                    onClick={() => setTheme('light')}
                    className={`w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all cursor-pointer hover:bg-gold-500 hover:text-coal-900 group/sun-btn ${
                      theme === 'light' ? 'bg-erythro-500 text-white' : 'text-white/60'
                    }`}
                    aria-label={locale === 'ru' ? 'Светлая тема' : locale === 'he' ? 'ערכת נושא בהירה' : 'Light theme'}
                    aria-pressed={theme === 'light'}
                  >
                    <svg className="w-[14px] h-[14px] transition-transform duration-300 group-hover/sun-btn:rotate-45 group-hover/sun-btn:scale-115" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm-12.37 1.06l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0zm12.37-13.43a.996.996 0 000-1.41l-1.06-1.06c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.38.39 1.02.39 1.41 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all cursor-pointer hover:bg-gold-500 hover:text-coal-900 group/moon-btn ${
                      theme === 'dark' ? 'bg-erythro-500 text-white' : 'text-white/60'
                    }`}
                    aria-label={locale === 'ru' ? 'Тёмная тема' : locale === 'he' ? 'ערכת נושא כהה' : 'Dark theme'}
                    aria-pressed={theme === 'dark'}
                  >
                    <svg className="w-[13px] h-[13px] transition-transform duration-300 group-hover/moon-btn:-rotate-12 group-hover/moon-btn:scale-115" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.3 22h-.1c-5.4 0-9.8-4.4-9.8-9.8 0-5.1 3.9-9.3 9-9.8.6-.1 1.1.4 1 1-.5 2.5.2 5.1 1.9 6.8 1.7 1.7 4.3 2.4 6.8 1.9.6-.1 1.1.4 1 1-.9 5.2-5.3 9-10.8 8.9z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ITEM 1: Language Selector */}
            <div className="relative group floating-menu-item">
              <button
                onClick={() => handleMobileSubmenu('lang')}
                className="w-[37px] h-[37px] rounded-full bg-coal-800 border border-white/10 text-white hover:bg-gold-500 hover:text-coal-900 hover:border-gold-500 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-md group/btn"
                aria-label={locale === 'ru' ? 'Язык' : locale === 'he' ? 'שפה' : 'Language'}
                aria-expanded={activeMobileSubmenu === 'lang'}
              >
                <LangIcon className="w-[15px] h-[15px] transition-transform duration-300 group-hover/btn:scale-110 group-hover/btn:rotate-12" />
              </button>
              {/* Flyout horizontally */}
              <div className={getSubmenuClasses('lang')}>
                <div className={submenuInnerClass}>
                  {['en', 'ru', 'he'].map((lg) => {
                    const Icon = lg === 'en' ? ENIcon : lg === 'ru' ? RUIcon : HEIcon
                    const langName = lg === 'en' ? 'English' : lg === 'ru' ? 'Русский' : 'עברית'
                    return (
                      <button
                        key={lg}
                        onClick={() => {
                          setLocale(lg)
                          setActiveMobileSubmenu(null)
                        }}
                        className={`w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all cursor-pointer hover:bg-gold-500 hover:text-coal-900 group/lang-opt ${
                          locale === lg
                            ? 'bg-erythro-500 text-white'
                            : 'text-white/60'
                        }`}
                        aria-label={langName}
                        aria-pressed={locale === lg}
                        lang={lg}
                      >
                        <Icon className="w-[14px] h-[9px] transition-transform duration-300 group-hover/lang-opt:scale-115" />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Three dots Trigger button */}
        <button
          onClick={toggleMenu}
          className={`w-[44px] h-[44px] rounded-full border flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer relative group ${
            isMenuOpen
              ? 'bg-white border-white text-black hover:bg-gold-500 hover:text-coal-900 hover:border-gold-500'
              : 'bg-coal-800 border-white/10 text-white hover:bg-gold-500 hover:text-coal-900 hover:border-gold-500'
          }`}
          aria-label={
            isMenuOpen
              ? locale === 'ru'
                ? 'Закрыть панель управления'
                : locale === 'he'
                  ? 'סגירת לוח בקרה'
                  : 'Close controls menu'
              : locale === 'ru'
                ? 'Открыть панель управления'
                : locale === 'he'
                  ? 'פתיחת לוח בקרה'
                  : 'Open controls menu'
          }
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <svg className="w-[18px] h-[18px] transition-transform duration-300 rotate-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center gap-[4px]">
              {/* Pulsing rings in background to draw attention */}
              <span className="absolute inset-0 rounded-full bg-gold-500/20 animate-ping pointer-events-none" />
              <span className="w-[4px] h-[4px] rounded-full bg-current animate-dot-1" />
              <span className="w-[4px] h-[4px] rounded-full bg-current animate-dot-2" />
              <span className="w-[4px] h-[4px] rounded-full bg-current animate-dot-3" />
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
