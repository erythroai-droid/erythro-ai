'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useSiteContent } from './SiteContentProvider'
import { useContactModal } from './ContactModal'
import { navigateCtaHref } from '@/lib/ctaNav'
import { openConsentSettings } from '@/lib/privacyConsent'
import Button from './Button'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface FooterSectionProps {
  locale: string
  theme?: 'light' | 'dark'
  /** Home page: spacer lets Footer ride over pinned Solutions. Portfolio skips it to avoid a black void. */
  pinSpacer?: boolean
}

function FooterBrandLogo() {
  const letterFill = '#FFFFFF'

  return (
    <svg
      viewBox="0 0 138 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-auto w-full max-w-[746px]"
      aria-label="Erythro.ai"
    >
      <g clipPath="url(#clip_footer_logo)">
        <path d="M20.1534 23.5004V6.96576H25.3641V9.89976H25.433C25.7501 8.84407 26.2188 8.06258 26.8804 7.58272C27.5283 7.10286 28.3968 6.86979 29.4582 6.86979C30.5196 6.86979 29.9958 6.86979 30.2439 6.8835C30.4921 6.8835 30.7126 6.91092 30.9332 6.92463V11.3805C30.7264 11.3668 30.4093 11.3393 29.9958 11.3119C29.5823 11.2982 29.1825 11.2845 28.8103 11.2845C28.1624 11.2845 27.5972 11.4353 27.101 11.7232C26.6047 12.0112 26.2188 12.4225 25.9431 12.9572C25.6674 13.4919 25.5295 14.1362 25.5295 14.904V23.5004H20.1534Z" fill={letterFill} />
        <path d="M34.1037 29.8757L34.3656 25.79L36.2955 25.8311C36.7366 25.8586 37.0812 25.8311 37.3707 25.7352C37.6464 25.6392 37.8669 25.461 38.0324 25.2142C38.1978 24.9674 38.3218 24.6383 38.4183 24.227L38.6389 23.4867L32.2841 6.96576H37.9083L40.3758 14.6984C40.6928 15.7541 40.9961 16.8098 41.2718 17.8792C41.5475 18.9486 41.8232 20.0317 42.0989 21.1285H40.6653C40.941 20.0317 41.2167 18.9349 41.4924 17.8655C41.7818 16.796 42.0851 15.7404 42.4297 14.6984L44.9661 6.96576H50.5352L43.4085 25.694C43.05 26.6675 42.6089 27.4627 42.0989 28.1071C41.5889 28.7514 40.9685 29.2176 40.2517 29.5329C39.5349 29.8483 38.6665 29.9991 37.6602 29.9991C36.6539 29.9991 36.4471 29.9991 35.8406 29.9717C35.2203 29.9442 34.6413 29.9168 34.1037 29.8757Z" fill={letterFill} />
        <path d="M63.1759 6.96576V11.0651H51.8034V6.96576H63.1759ZM54.4915 2.59217H59.8675V18.0574C59.8675 18.5647 59.9778 18.9211 60.1846 19.1131C60.3914 19.3187 60.7911 19.4147 61.3563 19.4147C61.9215 19.4147 61.9215 19.4147 62.3075 19.4147C62.6934 19.4147 62.9691 19.4147 63.1346 19.3873L63.2862 23.4455C62.9278 23.4867 62.4729 23.5141 61.9077 23.5278C61.3425 23.5415 60.7636 23.5552 60.1846 23.5552C58.2409 23.5552 56.8211 23.1713 55.8837 22.4036C54.9601 21.6358 54.4915 20.4567 54.4915 18.8526V2.59217Z" fill={letterFill} />
        <path d="M71.2125 14.4242V23.5141H65.8364V0.480784H71.1849V11.3393H70.4405C70.9368 9.91347 71.6536 8.77552 72.6047 7.92548C73.5559 7.07544 74.8103 6.63671 76.368 6.63671C77.9257 6.63671 78.6011 6.89721 79.442 7.40449C80.2967 7.92548 80.9446 8.65213 81.4132 9.62556C81.8681 10.5853 82.1025 11.7369 82.1025 13.0806V23.5004H76.7264V14.1637C76.7264 13.1902 76.4921 12.4499 76.0234 11.9426C75.5547 11.4216 74.893 11.1748 74.0246 11.1748C73.1561 11.1748 72.9631 11.2982 72.5358 11.5313C72.1085 11.7644 71.7914 12.1208 71.5571 12.6007C71.3227 13.0806 71.2125 13.6838 71.2125 14.4105V14.4242Z" fill={letterFill} />
        <path d="M85.5211 23.5004V6.96576H90.7318V9.89976H90.7869C91.104 8.84407 91.5727 8.06258 92.2343 7.58272C92.8822 7.10286 93.7507 6.86979 94.8121 6.86979C95.8735 6.86979 95.3497 6.86979 95.5978 6.8835C95.846 6.8835 96.0665 6.91092 96.2871 6.92463V11.3805C96.0803 11.3668 95.7633 11.3393 95.3497 11.3119C94.9362 11.2982 94.5364 11.2845 94.1642 11.2845C93.5163 11.2845 92.9512 11.4353 92.4549 11.7232C91.9586 12.0112 91.5727 12.4225 91.297 12.9572C91.0213 13.4919 90.8834 14.1362 90.8834 14.904V23.5004H85.5073H85.5211Z" fill={letterFill} />
        <path d="M106.295 23.8569C104.558 23.8569 103.028 23.5004 101.732 22.7875C100.436 22.0745 99.43 21.0737 98.7132 19.7849C97.9964 18.4961 97.638 16.988 97.638 15.2468C97.638 13.5056 97.9964 12.0112 98.7132 10.7224C99.43 9.43361 100.436 8.43276 101.732 7.70612C103.028 6.97947 104.558 6.623 106.295 6.623C108.032 6.623 109.548 6.97947 110.844 7.70612C112.14 8.43276 113.146 9.43361 113.863 10.7224C114.58 12.0112 114.938 13.5193 114.938 15.2468C114.938 16.9743 114.58 18.4961 113.863 19.7849C113.146 21.0737 112.14 22.0745 110.844 22.7875C109.548 23.5004 108.032 23.8569 106.295 23.8569ZM106.295 19.6615C106.929 19.6615 107.48 19.4833 107.963 19.1405C108.445 18.784 108.818 18.2905 109.093 17.6324C109.369 16.9743 109.493 16.1791 109.493 15.2742C109.493 14.3693 109.355 13.5467 109.093 12.8886C108.818 12.2442 108.445 11.7369 107.963 11.3942C107.48 11.0377 106.929 10.8732 106.295 10.8732C105.661 10.8732 105.082 11.0514 104.599 11.3942C104.117 11.7369 103.731 12.2442 103.469 12.8886C103.207 13.5467 103.069 14.3419 103.069 15.2742C103.069 16.2065 103.207 16.988 103.469 17.6461C103.731 18.3042 104.103 18.7978 104.599 19.1542C105.082 19.5107 105.647 19.6752 106.295 19.6752V19.6615Z" fill={letterFill} />
        <path d="M9.16691 19.7986C7.3611 19.4147 6.01019 18.4824 5.72071 16.6041H17.3689C17.4792 15.9734 17.5481 15.1234 17.5481 14.3967C17.5481 9.09086 14.4465 6.41735 9.20827 6.41735C9.19449 6.41735 9.16692 6.41735 9.15313 6.41735V9.96832C9.20827 9.96832 9.26341 9.96832 9.31855 9.96832C11.4414 9.96832 12.5304 11.0514 12.5993 13.2039H9.15313H5.70692H0.510037C0.385974 13.8758 0.31705 14.6024 0.31705 15.3839C0.31705 21.0188 3.8184 23.7472 9.16691 24.0899V19.8123V19.7986Z" fill="#E52421" />
        <path d="M136.043 6.623H122.63C121.549 6.623 120.672 7.49464 120.672 8.56987V21.91C120.672 22.9852 121.549 23.8569 122.63 23.8569H136.043C137.124 23.8569 138 22.9852 138 21.91V8.56987C138 7.49464 137.124 6.623 136.043 6.623Z" fill="#E52421" />
        <path d="M126.214 19.7301C125.745 19.7301 125.332 19.6615 124.973 19.5107C124.615 19.3599 124.339 19.1268 124.132 18.8252C123.926 18.5235 123.829 18.1397 123.829 17.6735C123.829 17.2074 123.898 16.9606 124.036 16.6864C124.174 16.4122 124.367 16.1928 124.601 16.0146C124.835 15.8363 125.125 15.7129 125.456 15.617C125.787 15.521 126.131 15.4661 126.503 15.4387C126.917 15.4113 127.234 15.3702 127.482 15.329C127.73 15.2879 127.91 15.2194 128.02 15.1371C128.13 15.0548 128.185 14.9589 128.185 14.8218V14.7943C128.185 14.6847 128.158 14.6024 128.089 14.5201C128.02 14.4379 127.937 14.383 127.813 14.3419C127.689 14.3008 127.551 14.2734 127.386 14.2734C127.22 14.2734 127.069 14.3008 126.945 14.3419C126.821 14.383 126.71 14.4653 126.641 14.5613C126.572 14.6572 126.517 14.7669 126.49 14.9177L124.091 14.8629C124.146 14.3693 124.298 13.9306 124.56 13.5741C124.822 13.2177 125.208 12.9435 125.69 12.7515C126.173 12.5596 126.779 12.4636 127.482 12.4636C128.185 12.4636 128.488 12.5184 128.902 12.6281C129.316 12.7378 129.66 12.9023 129.95 13.108C130.239 13.3136 130.446 13.5741 130.598 13.8758C130.749 14.1774 130.818 14.5201 130.818 14.904V19.6204H128.268V18.6332H128.24C128.089 18.9074 127.91 19.1268 127.717 19.2913C127.524 19.4558 127.289 19.5655 127.041 19.6341C126.793 19.7026 126.517 19.7438 126.214 19.7438V19.7301ZM127.082 18.0848C127.275 18.0848 127.455 18.0437 127.634 17.9751C127.813 17.9066 127.951 17.7969 128.075 17.6461C128.199 17.4953 128.24 17.3308 128.24 17.1114V16.5493C128.171 16.5767 128.102 16.6041 128.034 16.6178C127.965 16.6315 127.882 16.6589 127.799 16.6864C127.717 16.7138 127.62 16.7275 127.524 16.7412C127.427 16.7549 127.317 16.7823 127.193 16.8098C127.013 16.8372 126.848 16.892 126.724 16.9469C126.6 17.0017 126.49 17.084 126.421 17.1799C126.352 17.2759 126.324 17.3856 126.324 17.4953C126.324 17.605 126.352 17.7283 126.421 17.8106C126.49 17.8929 126.572 17.9614 126.696 18.0163C126.821 18.0711 126.945 18.0848 127.096 18.0848H127.082Z" fill="#FFFFFF" />
        <path d="M133.451 12.066C133.051 12.066 132.72 11.9426 132.459 11.7095C132.197 11.4765 132.073 11.1748 132.073 10.8184C132.073 10.4619 132.197 10.1603 132.459 9.92719C132.72 9.69411 133.051 9.57072 133.451 9.57072C133.851 9.57072 134.182 9.69411 134.444 9.92719C134.705 10.1603 134.829 10.4619 134.829 10.8184C134.829 11.1748 134.705 11.4765 134.444 11.7095C134.182 11.9426 133.851 12.066 133.451 12.066ZM132.141 19.6067V12.6007H134.774V19.6067H132.141Z" fill="#FFFFFF" />
      </g>
      <defs>
        <clipPath id="clip_footer_logo">
          <rect width="138" height="30" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function FooterLinkItem({
  href,
  children,
  external,
  onClick,
}: {
  href?: string
  children: React.ReactNode
  external?: boolean
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}) {
  const content = (
    <>
      <span className="size-1 shrink-0 rounded-[1px] bg-erythro-500" aria-hidden="true" />
      <span className="text-base font-medium capitalize leading-6 text-white transition-colors duration-300 hover:text-gold-500">
        {children}
      </span>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className="flex items-center gap-2 px-2"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {content}
      </a>
    )
  }

  return <div className="flex items-center gap-2 px-2">{content}</div>
}

export default function FooterSection({ locale, pinSpacer = true }: FooterSectionProps) {
  const content = useSiteContent()
  const translations = content.footer
  const cookieConsent = content.cookieConsent
  const site = content.siteSettings
  const { open: openContact } = useContactModal()
  const t = (field?: Record<string, string> | null) => field?.[locale] || field?.en || ''
  const cookieSettingsLabel =
    t(cookieConsent.manage) ||
    (locale === 'ru' ? 'Настройки Cookie' : locale === 'he' ? 'הגדרות Cookie' : 'Cookie Settings')

  const footerButtonClassName =
    'border-[var(--Button-Tertiary-link,#FFE9C7)] text-[var(--Button-Tertiary-link,#FFE9C7)] hover:bg-[var(--Button-Tertiary-link,#FFE9C7)] hover:text-coal-900 hover:border-[var(--Button-Tertiary-link,#FFE9C7)] active:bg-[var(--Button-Tertiary-link,#FFE9C7)] active:text-coal-900 active:border-[var(--Button-Tertiary-link,#FFE9C7)] aria-busy:bg-[var(--Button-Tertiary-link,#FFE9C7)] aria-busy:text-coal-900 aria-busy:border-[var(--Button-Tertiary-link,#FFE9C7)]'

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const sectionId = href.substring(1)

      // Map section IDs to their ScrollTrigger pin IDs.
      // Using st.start gives the EXACT scroll position where each section's
      // pin begins, regardless of DOM spacers inside each wrapper.
      const pinIdMap: Record<string, string> = {
        cases: 'cases-pin',
        services: 'services-pin',
        solutions: 'solutions-pin',
      }

      const pinId = pinIdMap[sectionId]
      if (pinId) {
        const st = ScrollTrigger.getById(pinId)
        if (st) {
          window.scrollTo({ top: st.start, behavior: 'smooth' })
          return
        }
      }

      // Fallback: scroll to element directly, or jump to home section from inner pages
      const target = document.getElementById(sectionId)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
        return
      }
      window.dispatchEvent(new Event('erythro:nav-start'))
      window.location.href = `/${href}`
    }
  }

  const footerRef = useRef<HTMLElement | null>(null)
  const columnsRef = useRef<HTMLDivElement | null>(null)
  const logoRef = useRef<HTMLDivElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const animationState = useRef({ frame: 0 })
  const [images, setImages] = useState<HTMLImageElement[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Preloading image sequence (desktop only, runs after mount)
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(max-width: 1023px)').matches) {
      return
    }

    const loadedImages: HTMLImageElement[] = []
    const imagesCount = 110
    const basePath = '/images/hero-sequence/'
    let completed = 0

    for (let i = 1; i <= imagesCount; i++) {
      const img = new window.Image()
      img.src = `${basePath}chip (${i}).webp`

      const handleLoad = () => {
        completed++
        if (completed === imagesCount) {
          setIsLoaded(true)
        }
      }

      img.onload = handleLoad
      img.onerror = handleLoad

      loadedImages.push(img)
    }

    setImages(loadedImages)
  }, [])

  // Helper to find the nearest loaded image
  const getNearestLoadedImage = (index: number): HTMLImageElement | null => {
    if (images.length === 0) return null

    const exactImg = images[index]
    if (exactImg && exactImg.complete) return exactImg

    for (let i = index - 1; i >= 0; i--) {
      const prevImg = images[i]
      if (prevImg && prevImg.complete) return prevImg
    }

    for (let i = index + 1; i < images.length; i++) {
      const nextImg = images[i]
      if (nextImg && nextImg.complete) return nextImg
    }

    return null
  }

  // Draw frame on canvas
  const render = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const currentFrame = Math.round(animationState.current.frame)
    const img = getNearestLoadedImage(currentFrame)

    if (img) {
      context.clearRect(0, 0, canvas.width, canvas.height)

      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const imgWidth = img.naturalWidth || img.width
      const imgHeight = img.naturalHeight || img.height

      if (imgWidth && imgHeight) {
        const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight)
        const x = canvasWidth / 2 - (imgWidth / 2) * scale
        const y = canvasHeight / 2 - (imgHeight / 2) * scale
        context.drawImage(img, x, y, imgWidth * scale, imgHeight * scale)
      } else {
        context.drawImage(img, 0, 0, canvasWidth, canvasHeight)
      }
    }
  }

  const renderRef = useRef<() => void>(() => {})
  renderRef.current = render

  // Trigger re-render of canvas once preloading is completed
  useEffect(() => {
    if (isLoaded) {
      renderRef.current()
    }
  }, [isLoaded])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add('(min-width: 1024px)', () => {
        // Set canvas resolution on desktop mount
        const canvas = canvasRef.current
        if (canvas) {
          canvas.width = 1920
          canvas.height = 1080
        }

        // Draw initial frame if we have images
        renderRef.current()

        gsap.set([columnsRef.current, logoRef.current, barRef.current], {
          opacity: 0,
          y: 60,
        })

        gsap.to([columnsRef.current, logoRef.current, barRef.current], {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.25,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        })

        // Pin the footer and scrub the chip animation
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top top',
            end: '+=100%', // Pin scroll distance
            pin: true,
            pinSpacing: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        })

        tl.to(
          animationState.current,
          {
            frame: 109,
            snap: 'frame',
            ease: 'none',
            onUpdate: () => {
              renderRef.current()
            },
            duration: 1.2,
          },
          0,
        )
      })

      mm.add('(max-width: 1023px)', () => {
        gsap.set([columnsRef.current, logoRef.current, barRef.current], {
          opacity: 0,
          y: 30,
        })

        gsap.to([columnsRef.current, logoRef.current, barRef.current], {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 92%',
            toggleActions: 'play none none reverse',
          },
        })
      })
    }, footerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div className="relative z-40 w-full pointer-events-none">
      {/* Hold while FAQ stays fully visible before Footer rides up (home).
          Keep transparent so the pinned previous section shows through. */}
      {pinSpacer && (
        <div className="hidden lg:block h-[140vh] w-full pointer-events-none" aria-hidden />
      )}

      <footer
        id="footer"
        ref={footerRef}
        className="relative w-full py-[60px] transition-colors duration-500 shadow-[0_-12px_30px_rgba(0,0,0,0.28)] lg:-mt-[2px] lg:py-0 lg:h-screen lg:flex lg:flex-col lg:justify-center select-none pointer-events-auto overflow-hidden"
        style={{ background: 'var(--background-footer-bg, #0D0D0D)' }}
      >
        <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none z-[1]" />

        {/* 1. Desktop Mode: HTML5 Canvas rendering */}
        <div className="hidden lg:flex absolute inset-0 w-full h-full items-center justify-center pointer-events-none select-none z-0">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover opacity-85"
          />
        </div>

        {/* 2. Mobile/Tablet Fallback: Optimized next/image displaying first frame */}
        <div className="block lg:hidden absolute inset-0 z-0 select-none pointer-events-none">
          <Image
            src="/images/hero-sequence/chip (1).webp"
            alt="Erythro Neural Chip"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-75"
          />
        </div>

        {/* Dark overlay to dim the background image/animation */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{ backgroundColor: 'rgba(13,13,13,0.8)' }}
        />

        {/* Ambient background gradients to tie canvas to the overall site theme */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, #0D0D0D 90%)',
          }}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-[1170px] flex-col items-center gap-[30px] px-[30px]">
          {/* Columns Grid */}
          <div
            ref={columnsRef}
            className="grid w-full grid-cols-1 gap-[30px] md:grid-cols-2 lg:grid-cols-3"
          >
            {/* CTA column */}
            <div className="flex flex-col items-start gap-[30px]">
              <p className="px-2 text-2xl font-bold leading-9 text-white">
                {t(translations.ctaHeadingLine1)}
                <br />
                {t(translations.ctaHeadingLine2)}
              </p>
              <Button
                variant="solution-cta"
                className={footerButtonClassName}
                onClick={() =>
                  navigateCtaHref(translations.ctaHref || '#contact-modal', { openContact })
                }
              >
                {t(translations.ctaButton)}
              </Button>
            </div>

            {/* Company column */}
            <div className="flex flex-col items-start gap-4">
              <p className="px-2 text-2xl font-bold leading-9 text-white">
                {t(translations.companyTitle)}
              </p>
              {translations.companyLinks.map((link) => (
                <FooterLinkItem
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                >
                  {t(link.label)}
                </FooterLinkItem>
              ))}
            </div>

            {/* Contact column */}
            <div className="flex flex-col items-start gap-4 md:col-span-2 lg:col-span-1">
              <p className="px-2 text-2xl font-bold leading-9 text-white">
                {t(translations.contactTitle)}
              </p>
              <FooterLinkItem href={`mailto:${site.email.toLowerCase()}`}>
                <span className="font-bold uppercase">{t(translations.emailLabel)} </span>
                <span dir="ltr" className="inline-block normal-case lowercase">
                  {site.email.toLowerCase()}
                </span>
              </FooterLinkItem>
              <FooterLinkItem href={`tel:${site.phone}`}>
                <span className="font-bold uppercase">{t(translations.phoneLabel)} </span>
                <bdi dir="ltr" className="inline-block normal-case">
                  {site.phoneDisplay}
                </bdi>
              </FooterLinkItem>
              <FooterLinkItem>
                <span className="font-bold uppercase">{t(translations.locationLabel)}</span>
                {t(translations.locationValue)}
              </FooterLinkItem>
            </div>
          </div>

          {/* Large brand logo */}
          <div ref={logoRef} className="flex w-full justify-center py-4">
            <FooterBrandLogo />
          </div>

          {/* Bottom legal bar */}
          <div
            ref={barRef}
            className="flex w-full flex-col items-start justify-between gap-8 border-t border-white/5 pt-6 lg:flex-row lg:items-start lg:gap-4"
          >
            <p className="text-xs uppercase leading-[1.5] text-white">
              {t(translations.copyright)}
            </p>

            <div className="flex flex-wrap items-center gap-[30px]">
              {translations.legalLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  className="text-xs uppercase leading-[1.5] text-white transition-colors duration-300 hover:text-gold-500 active:text-gold-500"
                >
                  {t(link.label)}
                </a>
              ))}
              <button
                type="button"
                onClick={openConsentSettings}
                className="text-xs uppercase leading-[1.5] text-white transition-colors duration-300 hover:text-gold-500 active:text-gold-500"
              >
                {cookieSettingsLabel}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
