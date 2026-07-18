'use client'

import React, { useEffect, useRef, useState } from 'react'
import Button from './Button'
import { useSiteContent } from './SiteContentProvider'
import { useContactModal } from './ContactModal'

interface NavbarProps {
  currentLocale: string
  setLocale: (locale: string) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  onOpenAccessibility: () => void
  /** Portfolio / inner pages: always use the mobile burger menu (no desktop pill). */
  forceBurger?: boolean
}

// Accessibility (person) glyph used on the mobile control circle
const HumanIcon = ({ className = 'w-[18px] h-[18px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 23 25" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.485 4.26625C8.995 3.77625 8.75 3.1875 8.75 2.5C8.75 1.8125 8.995 1.22417 9.485 0.735002C9.975 0.245835 10.5633 0.000835452 11.25 2.11864e-06C11.9367 -0.000831215 12.5254 0.244169 13.0163 0.735002C13.5071 1.22584 13.7517 1.81417 13.75 2.5C13.7483 3.18584 13.5037 3.77459 13.0163 4.26625C12.5288 4.75792 11.94 5.0025 11.25 5C10.56 4.9975 9.97167 4.75292 9.485 4.26625ZM7.5 25V8.75H0V6.25H22.5V8.75H15V25H12.5V17.5H10V25H7.5Z" />
  </svg>
)

// Contact & social glyphs used in the mobile burger menu
const PhoneIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 18 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.62 7.79C5.06 10.62 7.38 12.93 10.21 14.38L12.41 12.18C12.68 11.91 13.08 11.82 13.43 11.94C14.55 12.31 15.76 12.51 17 12.51C17.55 12.51 18 12.96 18 13.51V17C18 17.55 17.55 18 17 18C7.61 18 0 10.39 0 1C0 0.45 0.45 0 1 0H4.5C5.05 0 5.5 0.45 5.5 1C5.5 2.25 5.7 3.45 6.07 4.57C6.18 4.92 6.1 5.31 5.82 5.59L3.62 7.79Z" />
  </svg>
)

const FacebookIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 10 17" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.66667 9.775H9.04762L10 6.375H6.66667V4.675C6.66667 3.7995 6.66667 2.975 8.57143 2.975H10V0.119C9.68952 0.0824501 8.51714 0 7.27905 0C4.69333 0 2.85714 1.40845 2.85714 3.995V6.375H0V9.775H2.85714V17H6.66667V9.775Z" />
  </svg>
)

const TikTokIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 14 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.1071 2.50667C10.4969 1.81291 10.1606 0.922133 10.1607 0H7.40179V11.0222C7.38095 11.6188 7.12814 12.1841 6.6967 12.5987C6.26526 13.0133 5.68893 13.2448 5.08929 13.2444C3.82143 13.2444 2.76786 12.2133 2.76786 10.9333C2.76786 9.40444 4.25 8.25778 5.77679 8.72889V5.92C2.69643 5.51111 0 10.9333 0 10.9333C0 13.8933 2.46429 16 5.08036 16C7.88393 16 10.1607 13.7333 10.1607 10.9333V5.34222C11.2795 6.14209 12.6226 6.57124 14 6.56889V3.82222C14 3.82222 12.3214 3.90222 11.1071 2.50667Z" />
  </svg>
)

// Brand wordmark (erythro.ai). `text-*` controls the wordmark color via currentColor.
const BrandLogo = ({ className = '' }: { className?: string }) => (
  <svg
    width="138"
    height="30"
    viewBox="0 0 138 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <g clipPath="url(#clip0_23_40)">
      {/* Main brand letters: rythro... */}
      <path
        d="M20.1534 23.5004V6.96576H25.3641V9.89976H25.433C25.7501 8.84407 26.2188 8.06258 26.8804 7.58272C27.5283 7.10286 28.3968 6.86979 29.4582 6.86979C30.5196 6.86979 29.9958 6.86979 30.2439 6.8835C30.4921 6.8835 30.7126 6.91092 30.9332 6.92463V11.3805C30.7264 11.3668 30.4093 11.3393 29.9958 11.3119C29.5823 11.2982 29.1825 11.2845 28.8103 11.2845C28.1624 11.2845 27.5972 11.4353 27.101 11.7232C26.6047 12.0112 26.2188 12.4225 25.9431 12.9572C25.6674 13.4919 25.5295 14.1362 25.5295 14.904V23.5004H20.1534Z"
        fill="currentColor"
      />
      <path
        d="M34.1037 29.8757L34.3656 25.79L36.2955 25.8311C36.7366 25.8586 37.0812 25.8311 37.3707 25.7352C37.6464 25.6392 37.8669 25.461 38.0324 25.2142C38.1978 24.9674 38.3218 24.6383 38.4183 24.227L38.6389 23.4867L32.2841 6.96576H37.9083L40.3758 14.6984C40.6928 15.7541 40.9961 16.8098 41.2718 17.8792C41.5475 18.9486 41.8232 20.0317 42.0989 21.1285H40.6653C40.941 20.0317 41.2167 18.9349 41.4924 17.8655C41.7818 16.796 42.0851 15.7404 42.4297 14.6984L44.9661 6.96576H50.5352L43.4085 25.694C43.05 26.6675 42.6089 27.4627 42.0989 28.1071C41.5889 28.7514 40.9685 29.2176 40.2517 29.5329C39.5349 29.8483 38.6665 29.9991 37.6602 29.9991C36.6539 29.9991 36.4471 29.9991 35.8406 29.9717C35.2203 29.9442 34.6413 29.9168 34.1037 29.8757Z"
        fill="currentColor"
      />
      <path
        d="M63.1759 6.96576V11.0651H51.8034V6.96576H63.1759ZM54.4915 2.59217H59.8675V18.0574C59.8675 18.5647 59.9778 18.9211 60.1846 19.1131C60.3914 19.3187 60.7911 19.4147 61.3563 19.4147C61.9215 19.4147 61.9215 19.4147 62.3075 19.4147C62.6934 19.4147 62.9691 19.4147 63.1346 19.3873L63.2862 23.4455C62.9278 23.4455 62.4729 23.5141 61.9077 23.5278C61.3425 23.5415 60.7636 23.5552 60.1846 23.5552C58.2409 23.5552 56.8211 23.1713 55.8837 22.4036C54.9601 21.6358 54.4915 20.4567 54.4915 18.8526V2.59217Z"
        fill="currentColor"
      />
      <path
        d="M71.2125 14.4242V23.5141H65.8364V0.480784H71.1849V11.3393H70.4405C70.9368 9.91347 71.6536 8.77552 72.6047 7.92548C73.5559 7.07544 74.8103 6.63671 76.368 6.63671C77.9257 6.63671 78.6011 6.89721 79.442 7.40449C80.2967 7.92548 80.9446 8.65213 81.4132 9.62556C81.8681 10.5853 82.1025 11.7369 82.1025 13.0806V23.5004H76.7264V14.1637C76.7264 13.1902 76.4921 12.4499 76.0234 11.9426C75.5547 11.4216 74.893 11.1748 74.0246 11.1748C73.1561 11.1748 72.9631 11.2982 72.5358 11.5313C72.1085 11.7644 71.7914 12.1208 71.5571 12.6007C71.3227 13.0806 71.2125 13.6838 71.2125 14.4105V14.4242Z"
        fill="currentColor"
      />
      <path
        d="M85.5211 23.5004V6.96576H90.7318V9.89976H90.7869C91.104 8.84407 91.5727 8.06258 92.2343 7.58272C92.8822 7.10286 93.7507 6.86979 94.8121 6.86979C95.8735 6.86979 95.3497 6.86979 95.5978 6.8835C95.846 6.8835 96.0665 6.91092 96.2871 6.92463V11.3805C96.0803 11.3668 95.7633 11.3393 95.3497 11.3119C94.9362 11.2982 94.5364 11.2845 94.1642 11.2845C93.5163 11.2845 92.9512 11.4353 92.4549 11.7232C91.9586 12.0112 91.5727 12.4225 91.297 12.9572C91.0213 13.4919 90.8834 14.1362 90.8834 14.904V23.5004H85.5073H85.5211Z"
        fill="currentColor"
      />
      <path
        d="M106.295 23.8569C104.558 23.8569 103.028 23.5004 101.732 22.7875C100.436 22.0745 99.43 21.0737 98.7132 19.7849C97.9964 18.4961 97.638 16.988 97.638 15.2468C97.638 13.5056 97.9964 12.0112 98.7132 10.7224C99.43 9.43361 100.436 8.43276 101.732 7.70612C103.028 6.97947 104.558 6.623 106.295 6.623C108.032 6.623 109.548 6.97947 110.844 7.70612C112.14 8.43276 113.146 9.43361 113.863 10.7224C114.58 12.0112 114.938 13.5193 114.938 15.2468C114.938 16.9743 114.58 18.4961 113.863 19.7849C113.146 21.0737 112.14 22.0745 110.844 22.7875C109.548 23.5004 108.032 23.8569 106.295 23.8569ZM106.295 19.6615C106.929 19.6615 107.48 19.4833 107.963 19.1405C108.445 18.784 108.818 18.2905 109.093 17.6324C109.369 16.9743 109.493 16.1791 109.493 15.2742C109.493 14.3693 109.355 13.5467 109.093 12.8886C108.818 12.2442 108.445 11.7369 107.963 11.3942C107.48 11.0377 106.929 10.8732 106.295 10.8732C105.661 10.8732 105.082 11.0514 104.599 11.3942C104.117 11.7369 103.731 12.2442 103.469 12.8886C103.207 13.5467 103.069 14.3419 103.069 15.2742C103.069 16.2065 103.207 16.988 103.469 17.6461C103.731 18.3042 104.103 18.7978 104.599 19.1542C105.082 19.5107 105.647 19.6752 106.295 19.6752V19.6615Z"
        fill="currentColor"
      />

      {/* E Logo Mark (filled with brand Red #E52421) */}
      <path
        d="M9.16691 19.7986C7.3611 19.4147 6.01019 18.4824 5.72071 16.6041H17.3689C17.4792 15.9734 17.5481 15.1234 17.5481 14.3967C17.5481 9.09086 14.4465 6.41735 9.20827 6.41735C9.19449 6.41735 9.16692 6.41735 9.15313 6.41735V9.96832C9.20827 9.96832 9.26341 9.96832 9.31855 9.96832C11.4414 9.96832 12.5304 11.0514 12.5993 13.2039H9.15313H5.70692H0.510037C0.385974 13.8758 0.31705 14.6024 0.31705 15.3839C0.31705 21.0188 3.8184 23.7472 9.16691 24.0899V19.8123V19.7986Z"
        fill="#E52421"
      />

      {/* .ai Box (filled with brand Red #E52421) */}
      <path
        d="M136.043 6.623H122.63C121.549 6.623 120.672 7.49464 120.672 8.56987V21.91C120.672 22.9852 121.549 23.8569 122.63 23.8569H136.043C137.124 23.8569 138 22.9852 138 21.91V8.56987C138 7.49464 137.124 6.623 136.043 6.623Z"
        fill="#E52421"
      />

      {/* .ai text inside the red box (always white) */}
      <path
        d="M126.214 19.7301C125.745 19.7301 125.332 19.6615 124.973 19.5107C124.615 19.3599 124.339 19.1268 124.132 18.8252C123.926 18.5235 123.829 18.1397 123.829 17.6735C123.829 17.2074 123.898 16.9606 124.036 16.6864C124.174 16.4122 124.367 16.1928 124.601 16.0146C124.835 15.8363 125.125 15.7129 125.456 15.617C125.787 15.521 126.131 15.4661 126.503 15.4387C126.917 15.4113 127.234 15.3702 127.482 15.329C127.73 15.2879 127.91 15.2194 128.02 15.1371C128.13 15.0548 128.185 14.9589 128.185 14.8218V14.7943C128.185 14.6847 128.158 14.6024 128.089 14.5201C128.02 14.4379 127.937 14.383 127.813 14.3419C127.22 14.2734 127.069 14.3008 126.945 14.3419C126.821 14.383 126.71 14.4653 126.641 14.5613C126.572 14.6572 126.517 14.7669 126.49 14.9177L124.091 14.8629C124.146 14.3693 124.298 13.9306 124.56 13.5741C124.822 13.2177 125.208 12.9435 125.69 12.7515C126.173 12.5596 126.779 12.4636 127.482 12.4636C128.185 12.4636 128.488 12.5184 128.902 12.6281C129.316 12.7378 129.66 12.9023 129.95 13.108C130.239 13.3136 130.446 13.5741 130.598 13.8758C130.749 14.1774 130.818 14.5201 130.818 14.904V19.6204H128.268V18.6332H128.24C128.089 18.9074 127.91 19.1268 127.717 19.2913C127.524 19.4558 127.289 19.5655 127.041 19.6341C126.793 19.7026 126.517 19.7438 126.214 19.7438V19.7301ZM127.082 18.0848C127.275 18.0848 127.455 18.0437 127.634 17.9751C127.813 17.9066 127.951 17.7969 128.075 17.6461C128.199 17.4953 128.24 17.3308 128.24 17.1114V16.5493C128.171 16.5767 128.102 16.6041 128.034 16.6178C127.965 16.6315 127.882 16.6589 127.799 16.6864C127.717 16.7138 127.62 16.7275 127.524 16.7412C127.427 16.7549 127.317 16.7823 127.193 16.8098C127.013 16.8372 126.848 16.892 126.724 16.9469C126.6 17.0017 126.49 17.1799 126.421 17.1799C126.421 17.1799 126.324 17.3856 126.324 17.4953C126.324 17.605 126.352 17.7283 126.421 17.8106C126.49 17.8929 126.572 17.9614 126.696 18.0163C126.821 18.0711 126.945 18.0848 127.096 18.0848H127.082Z"
        fill="white"
      />
      <path
        d="M133.451 12.066C133.051 12.066 132.72 11.9426 132.459 11.7095C132.197 11.4765 132.073 11.1748 132.073 10.8184C132.073 10.4619 132.197 10.1603 132.459 9.92719C132.72 9.69411 133.051 9.57072 133.451 9.57072C133.851 9.57072 134.182 9.69411 134.444 9.92719C134.705 10.1603 134.829 10.4619 134.829 10.8184C134.829 11.1748 134.705 11.4765 134.444 11.7095C134.182 11.9426 133.851 12.066 133.451 12.066ZM132.141 19.6067V12.6007H134.774V19.6067H132.141Z"
        fill="white"
      />
    </g>
    <defs>
      <clipPath id="clip0_23_40">
        <rect width="138" height="30" fill="white" />
      </clipPath>
    </defs>
  </svg>
)

export default function Navbar({
  currentLocale,
  setLocale,
  theme,
  setTheme,
  onOpenAccessibility,
  forceBurger = false,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  // Once the user scrolls past the hero a bit, collapse the mobile logo so the
  // fixed header plate becomes more compact.
  const [scrolled, setScrolled] = useState(false)
  // Portfolio: logo only at page top — hides on scroll and stays hidden until top
  const [logoHidden, setLogoHidden] = useState(false)
  // Desktop inner pages: Menu/logo contrast vs content under the fixed header
  // (mix-blend fails inside a fixed stacking context, so we sample the backdrop).
  const [overDarkBg, setOverDarkBg] = useState(true)
  const menuBtnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      setScrolled(y > 60)
      // Desktop burger header (home + inner): hide logo after a short scroll.
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches
      if (forceBurger || isDesktop) {
        setLogoHidden(isDesktop && y > 24)
      } else {
        setLogoHidden(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [forceBurger])

  useEffect(() => {
    // Sample backdrop under Menu on desktop (home + inner pages).
    const parseRgb = (color: string) => {
      const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
      if (!m) return null
      return {
        r: Number(m[1]) / 255,
        g: Number(m[2]) / 255,
        b: Number(m[3]) / 255,
        a: m[4] === undefined ? 1 : Number(m[4]),
      }
    }

    const luminance = (r: number, g: number, b: number) =>
      0.2126 * r + 0.7152 * g + 0.0722 * b

    const isDarkAtPoint = (x: number, y: number) => {
      const stack = document.elementsFromPoint(x, y)
      for (const el of stack) {
        if (!(el instanceof Element)) continue
        if (el.closest('header')) continue
        if (el.closest('[aria-label="Toggle menu"]')) continue

        const tag = el.tagName
        if (tag === 'IMG' || tag === 'VIDEO' || tag === 'CANVAS') return true

        let node: Element | null = el
        while (node && node !== document.documentElement) {
          if (node instanceof HTMLElement && node.dataset.menuContrast) {
            return node.dataset.menuContrast === 'dark'
          }
          const style = getComputedStyle(node)
          const bg = parseRgb(style.backgroundColor)
          if (bg && bg.a >= 0.15) return luminance(bg.r, bg.g, bg.b) < 0.55
          if (style.backgroundImage && style.backgroundImage !== 'none') return true
          node = node.parentElement
        }
      }
      return theme === 'dark'
    }

    let raf = 0
    const update = () => {
      raf = 0
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches
      // Mobile home keeps the plate — follow theme. Inner mobile too.
      if (!isDesktop || mobileOpen) {
        setOverDarkBg(theme === 'dark')
        return
      }
      const btn = menuBtnRef.current
      if (!btn) {
        setOverDarkBg(true)
        return
      }
      const rect = btn.getBoundingClientRect()
      const x = Math.min(window.innerWidth - 2, Math.max(1, rect.left + rect.width / 2))
      const y = Math.min(window.innerHeight - 2, Math.max(1, rect.top + rect.height / 2))
      setOverDarkBg(isDarkAtPoint(x, y))
    }

    const schedule = () => {
      if (raf) return
      raf = window.requestAnimationFrame(update)
    }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (raf) window.cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [forceBurger, theme, mobileOpen])

  const content = useSiteContent()
  const { navItems, ctaLabel } = content.navbar
  const site = content.siteSettings
  const { open: openContact } = useContactModal()

  const t = (field: Record<string, string>) => field[currentLocale] || field['en']

  // Desktop: contrast from sampled backdrop. Mobile plate: follow site theme.
  const menuOnDark = mobileOpen || overDarkBg
  const logoOnDark = mobileOpen || overDarkBg || theme === 'dark'

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      // On inner pages, hash targets live on the home page.
      if (forceBurger) {
        window.location.href = `/${href}`
        setMobileOpen(false)
        return
      }
      const targetId = href.substring(1)
      const targetElement = targetId === 'contacts'
        ? document.querySelector('footer')
        : document.getElementById(targetId)
      
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' })
      }
      setMobileOpen(false)
    }
  }

  return (
    <header className="fixed top-0 start-0 end-0 z-[60] w-full max-w-none select-none pointer-events-none overflow-visible px-0 lg:z-50">
      {/* ===== Burger header: all breakpoints on inner pages; desktop-only on home ===== */}
      <div
        className={`relative z-[70] w-full pointer-events-auto items-center justify-between overflow-visible px-[30px] py-5 lg:border-transparent lg:bg-transparent lg:px-[50px] lg:py-8 lg:backdrop-blur-none transition-colors duration-300 ${
          forceBurger ? 'flex' : 'hidden lg:flex'
        } ${
          mobileOpen
            ? 'max-lg:border-transparent max-lg:bg-transparent max-lg:backdrop-blur-none'
            : theme === 'light'
              ? 'max-lg:border-b max-lg:border-coal-900/10 max-lg:bg-gold-100 max-lg:backdrop-blur-md'
              : 'max-lg:border-b max-lg:border-white/5 max-lg:bg-coal-900/50 max-lg:backdrop-blur-md'
        }`}
      >
          <a
            href="/"
            aria-label="Erythro.ai"
            className={`relative z-10 flex items-center select-none cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              logoHidden
                ? '-translate-y-[140%] opacity-0 pointer-events-none'
                : 'translate-y-0 opacity-100'
            }`}
          >
            <BrandLogo
              className={`h-[30px] w-auto transition-colors duration-300 ${
                logoOnDark ? 'text-white' : 'text-coal-900'
              }`}
            />
          </a>
          <button
            ref={menuBtnRef}
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`group relative z-[70] flex items-center gap-3 overflow-visible cursor-pointer transition-colors duration-300 ${
              menuOnDark
                ? 'text-white hover:text-gold-500'
                : 'text-coal-900 hover:text-erythro-500'
            }`}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span className="font-sans text-xs uppercase tracking-[2.4px]">
              {mobileOpen ? 'Close' : 'Menu'}
            </span>
            <svg
              width="21"
              height="12"
              viewBox="-4 -6 29 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              overflow="visible"
              className="h-[20px] w-[21px] shrink-0 overflow-visible"
              aria-hidden
            >
              {/* Top bar — offset right; hover slides left; open → X */}
              <path
                d="M5 1C5 0.447715 5.44772 0 6 0H20C20.5523 0 21 0.447715 21 1V1C21 1.55228 20.5523 2 20 2H6C5.44772 2 5 1.55228 5 1V1Z"
                fill="currentColor"
                className={`[transform-box:view-box] origin-[10.5px_6px] transition-transform duration-300 ease-out ${
                  mobileOpen
                    ? 'translate-y-[5px] -rotate-45 scale-x-[0.85]'
                    : 'group-hover:-translate-x-[5px]'
                }`}
              />
              {/* Middle bar — offset left; hover slides right; open → hide */}
              <path
                d="M0 6C0 5.44772 0.447715 5 1 5H15C15.5523 5 16 5.44772 16 6V6C16 6.55228 15.5523 7 15 7H1C0.447715 7 0 6.55228 0 6V6Z"
                fill="currentColor"
                className={`[transform-box:view-box] origin-[10.5px_6px] transition-all duration-300 ease-out ${
                  mobileOpen
                    ? 'opacity-0'
                    : 'group-hover:translate-x-[5px]'
                }`}
              />
              {/* Bottom bar — offset right; hover slides left; open → X */}
              <path
                d="M5 11C5 10.4477 5.44772 10 6 10H20C20.5523 10 21 10.4477 21 11V11C21 11.5523 20.5523 12 20 12H6C5.44772 12 5 11.5523 5 11V11Z"
                fill="currentColor"
                className={`[transform-box:view-box] origin-[10.5px_6px] transition-transform duration-300 ease-out ${
                  mobileOpen
                    ? '-translate-y-[5px] rotate-45 scale-x-[0.85]'
                    : 'group-hover:-translate-x-[5px]'
                }`}
              />
            </svg>
          </button>
        </div>

      {/* ===== Mobile header (below lg): full-width backing plate with logo + controls ===== */}
      {!forceBurger && (
      <div
        className={`lg:hidden w-full pointer-events-auto flex flex-col items-center px-[30px] border-b backdrop-blur-md transition-all duration-300 ${
          scrolled ? 'gap-0 py-3' : 'gap-4 py-[30px]'
        } ${
          theme === 'light'
            ? 'bg-gold-100 border-coal-900/10'
            : 'bg-coal-900/50 border-white/5'
        }`}
      >
        <a
          href="/"
          aria-label="Erythro.ai"
          className={`flex w-full items-center justify-center select-none cursor-pointer overflow-hidden transition-all duration-300 ${
            scrolled ? 'max-h-0 opacity-0' : 'max-h-[56px] opacity-100'
          }`}
        >
          <BrandLogo
            className={`h-[44px] w-auto transition-colors duration-300 ${theme === 'light' ? 'text-coal-900' : 'text-white'}`}
          />
        </a>

        <div className="flex w-full items-center justify-between gap-3">
          {/* Accessibility settings */}
          <button
            onClick={onOpenAccessibility}
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
              theme === 'light'
                ? 'bg-white border border-coal-900 text-coal-900 hover:bg-gold-500'
                : 'bg-gold-500 text-coal-900 hover:bg-white'
            }`}
            aria-label="Accessibility Settings"
          >
            <HumanIcon className="w-[18px] h-[18px]" />
          </button>

          {/* Let's Talk CTA */}
          <Button
            variant={theme === 'light' ? 'light-accent' : 'nav-talk'}
            className="!px-7 min-w-0 shrink"
            onClick={openContact}
          >
            {t(ctaLabel)}
          </Button>

          {/* Hamburger menu */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`w-11 h-11 shrink-0 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-300 cursor-pointer z-50 ${
              theme === 'light'
                ? 'bg-white border border-coal-900 text-coal-900 hover:bg-gold-500'
                : 'bg-gold-500 text-coal-500 hover:bg-white'
            }`}
            aria-label="Toggle menu"
          >
            <span
              className={`w-4 h-0.5 rounded-full bg-current transition-all duration-300 origin-center ${
                mobileOpen ? 'rotate-45 translate-y-[4px]' : ''
              }`}
            />
            <span
              className={`w-4 h-0.5 rounded-full bg-current transition-opacity duration-300 ${
                mobileOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`w-4 h-0.5 rounded-full bg-current transition-all duration-300 origin-center ${
                mobileOpen ? '-rotate-45 -translate-y-[4px]' : ''
              }`}
            />
          </button>
        </div>
      </div>
      )}

      {/* 
        Mobile Menu Overlay: 
        Slides in from Screen End (Right in LTR, Left in RTL).
        Features a deep coal background, glass blur, and smooth layout mirror.
      */}
      <div
        className={`fixed inset-y-0 start-0 end-0 z-[65] bg-coal-900/90 backdrop-blur-lg transition-transform duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          mobileOpen
            ? 'translate-x-0'
            : currentLocale === 'he'
              ? '-translate-x-full'
              : 'translate-x-full'
        }`}
        style={{ pointerEvents: mobileOpen ? 'auto' : 'none' }}
      >
        {/* Close — home mobile plate only (desktop / inner pages use Menu ↔ Close in the header) */}
        {!forceBurger && (
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-8 end-8 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-gold-500 text-coal-900 transition-all duration-300 hover:bg-white lg:hidden"
            aria-label="Close menu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div
          className={`flex h-full flex-col justify-between p-12 ${
            forceBurger ? 'pt-28 lg:pt-32' : 'pt-32 lg:pt-28'
          }`}
        >
          {/* Menu Items — centered block, left-aligned titles + subtext (Emily Nolan style) */}
          <nav className="flex flex-1 flex-col items-center justify-center -translate-y-[50px]">
            <ul className="flex w-max max-w-full flex-col items-start gap-7 text-start">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="group relative flex flex-col items-start gap-1.5 ps-5 text-start"
                  >
                    <span
                      className="pointer-events-none absolute start-0 top-[0.55em] h-px w-3 origin-left scale-x-0 bg-erythro-500 transition-transform duration-300 ease-out group-hover:scale-x-100"
                      aria-hidden
                    />
                    <span className="font-sans text-[28px] font-bold uppercase leading-none tracking-[0.04em] text-white transition-all duration-300 ease-out group-hover:translate-x-2 group-hover:text-erythro-500 md:text-[32px]">
                      {t(item.label)}
                    </span>
                    {'description' in item && item.description ? (
                      <span className="font-sans text-base font-normal normal-case leading-snug tracking-normal text-white/35">
                        {t(item.description)}
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Settings and CTA */}
          <div className="flex flex-col items-center gap-6">
            {/* Contact & social links (moved from the floating controls widget) */}
            <div className="flex flex-col items-center gap-4">
              <a
                href={`tel:${site.phone}`}
                className="flex items-center gap-2 font-mono text-base font-bold text-white hover:text-erythro-500 transition-colors duration-300"
              >
                <PhoneIcon className="w-4 h-4" />
                <span dir="ltr">{site.phoneDisplay}</span>
              </a>

              <div className="flex items-center gap-3">
                <a
                  href={site.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-gold-500 hover:text-coal-900 hover:border-gold-500 transition-all duration-300"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-[14px] h-[18px]" />
                </a>
                <a
                  href={site.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-gold-500 hover:text-coal-900 hover:border-gold-500 transition-all duration-300"
                  aria-label="TikTok"
                >
                  <TikTokIcon className="w-[18px] h-[18px]" />
                </a>
              </div>
            </div>

            {/* Quick selectors for play testing in mobile */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-full text-white">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-sm px-2 cursor-pointer"
              >
                {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
              </button>

              <div className="w-px h-4 bg-white/20" />

              <div className="flex gap-2">
                {['en', 'ru', 'he'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLocale(lang)}
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      currentLocale === lang ? 'bg-erythro-500 text-white' : 'text-gray-400'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex w-full max-w-[280px] flex-col gap-3">
              <Button
                variant="light-accent"
                className="w-full !border-transparent hover:!border-transparent hover:!shadow-[0_3px_20px_0_rgba(229,36,33,0.45)]"
                onClick={() => {
                  setMobileOpen(false)
                  onOpenAccessibility()
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <HumanIcon className="w-4 h-4" />
                  {currentLocale === 'ru'
                    ? 'Доступность'
                    : currentLocale === 'he'
                      ? 'נגישות'
                      : 'Accessibility'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
