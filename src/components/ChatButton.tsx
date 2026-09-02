'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Liquid } from 'liquid-gooey'
import { useContactModal } from './ContactModal'
import { useSiteContent } from './SiteContentProvider'
import WhatsAppButton from './WhatsAppButton'

/**
 * Site-wide contact FAB. Desktop: chat trigger fans mail (10 o'clock) +
 * WhatsApp (12 o'clock, mirrored in RTL). Mobile/tablet: original WhatsApp icon.
 */

const FAN_RADIUS = 60
const MAIL_ANGLE_DEG = 60
const WA_ANGLE_DEG = 0

function fanOffset(open: boolean, angleDeg: number, inward: number) {
  if (!open) return { x: 0, y: 0 }
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: Math.round(inward * FAN_RADIUS * Math.sin(rad)),
    y: Math.round(-FAN_RADIUS * Math.cos(rad)),
  }
}

const COPY = {
  en: {
    trigger: 'Contact',
    triggerOpen: 'Close contact options',
    mail: 'Open contact form',
    whatsapp: 'WhatsApp',
  },
  ru: {
    trigger: 'Связаться',
    triggerOpen: 'Закрыть варианты связи',
    mail: 'Открыть контактную форму',
    whatsapp: 'WhatsApp',
  },
  he: {
    trigger: 'יצירת קשר',
    triggerOpen: 'סגירת אפשרויות יצירת קשר',
    mail: 'פתיחת טופס יצירת קשר',
    whatsapp: 'WhatsApp',
  },
} as const

function pickCopy(locale: string) {
  if (locale === 'ru' || locale === 'he') return COPY[locale]
  return COPY.en
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.5 3.75A2.25 2.25 0 0 0 2.25 6v8.25A2.25 2.25 0 0 0 4.5 16.5h.75v2.69c0 .62.74.95 1.2.54L10.2 16.5h9.3A2.25 2.25 0 0 0 21.75 14.25V6A2.25 2.25 0 0 0 19.5 3.75h-15Z" />
    </svg>
  )
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 15" fill="currentColor" aria-hidden>
      <path d="M18.611 0H0.639003C0.469567 0.000264627 0.307151 0.0677071 0.187365 0.18754C0.0675796 0.307372 0.0002009 0.469815 2.54918e-06 0.63925V1.92525C2.54918e-06 1.9845 0.0642526 2.0525 0.116753 2.08L9.56325 7.47575C9.58745 7.48958 9.61488 7.49674 9.64275 7.4965C9.67125 7.49663 9.69924 7.48903 9.72375 7.4745L18.8848 2.08525C18.9363 2.0565 19.0728 1.9805 19.124 1.9455C19.186 1.90325 19.25 1.865 19.25 1.78925V0.639C19.2497 0.469608 19.1823 0.307229 19.0626 0.187451C18.9428 0.0676724 18.7804 0.000264469 18.611 0ZM19.1703 3.86425C19.1457 3.85013 19.1178 3.84278 19.0895 3.84295C19.0612 3.84313 19.0334 3.85082 19.009 3.86525L13.8248 6.9155C13.8041 6.92754 13.7864 6.94407 13.773 6.96388C13.7596 6.98368 13.7509 7.00625 13.7474 7.0299C13.7439 7.05356 13.7458 7.07769 13.7529 7.10052C13.76 7.12334 13.7722 7.14427 13.7885 7.16175L18.9735 12.751C18.9883 12.7672 19.0064 12.7801 19.0265 12.7888C19.0466 12.7976 19.0683 12.8021 19.0903 12.802C19.1326 12.8019 19.1732 12.7851 19.2031 12.7551C19.2331 12.7252 19.2499 12.6846 19.25 12.6423V4.003C19.2501 3.97491 19.2427 3.94729 19.2287 3.92294C19.2147 3.89858 19.1946 3.87834 19.1703 3.86425ZM12.3308 7.93975C12.3061 7.91295 12.2731 7.8954 12.2371 7.89003C12.2011 7.88466 12.1644 7.8918 12.133 7.91025L10.055 9.133C9.93328 9.20342 9.79532 9.24093 9.6547 9.24185C9.51408 9.24277 9.37564 9.20707 9.253 9.13825L7.42425 8.0935C7.39473 8.07669 7.36062 8.0697 7.32686 8.07357C7.29311 8.07744 7.26146 8.09195 7.2365 8.115L0.292003 14.5565C0.273797 14.5735 0.259819 14.5946 0.251182 14.6179C0.242546 14.6413 0.23949 14.6664 0.242258 14.6912C0.245026 14.7159 0.253542 14.7397 0.267127 14.7606C0.280711 14.7815 0.298989 14.7989 0.320502 14.8115C0.428502 14.875 0.532753 14.9052 0.638753 14.9052H18.427C18.4581 14.9052 18.4885 14.896 18.5145 14.8789C18.5404 14.8618 18.5609 14.8375 18.5733 14.809C18.5856 14.7805 18.5893 14.7491 18.5841 14.7185C18.5789 14.6879 18.5648 14.6595 18.5438 14.6368L12.3308 7.93975ZM5.7085 7.353C5.72685 7.33597 5.74094 7.31487 5.74965 7.2914C5.75835 7.26793 5.76143 7.24275 5.75864 7.21787C5.75584 7.193 5.74725 7.16913 5.73354 7.14818C5.71984 7.12723 5.70142 7.10978 5.67975 7.09725L0.238253 3.98925C0.213968 3.97546 0.186489 3.96829 0.158564 3.96846C0.130639 3.96862 0.103246 3.97611 0.0791258 3.99019C0.0550052 4.00426 0.035002 4.02442 0.0211167 4.04865C0.00723134 4.07287 -4.93733e-05 4.10032 2.54918e-06 4.12825V12.2832C-0.000173643 12.3144 0.0087872 12.3449 0.0257758 12.371C0.0427645 12.3971 0.0670351 12.4177 0.0955838 12.4301C0.124133 12.4426 0.155706 12.4464 0.186396 12.4411C0.217086 12.4358 0.245546 12.4216 0.268253 12.4003L5.7085 7.353Z" />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

const optionClass = (open: boolean) =>
  `flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-full bg-coal-800 text-gold-100 shadow-md transition-all duration-300 hover:border-gold-500 hover:bg-gold-500 hover:text-coal-900 ${
    open ? 'pointer-events-auto opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-50'
  }`

export default function ChatButton({ locale = 'en' }: { locale?: string }) {
  const copy = pickCopy(locale)
  const { open: openModal } = useContactModal()
  const site = useSiteContent().siteSettings
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const number = (site.phone || '').replace(/[^0-9]/g, '')
  const whatsAppHref = number ? `https://wa.me/${number}` : ''

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const inward = locale === 'he' ? 1 : -1
  const mailPos = fanOffset(open, MAIL_ANGLE_DEG, inward)
  const waPos = fanOffset(open, WA_ANGLE_DEG, inward)

  return (
    <>
    <WhatsAppButton />
    <div
      ref={containerRef}
      className="pointer-events-auto hidden lg:inline-flex fixed bottom-[18px] end-[32px] z-[70] h-[44px] w-[44px] items-center justify-center select-none"
    >
      <Liquid
        blur={5}
        contrast={18}
        fill="#111111"
        shadow="0 4px 14px rgba(0, 0, 0, 0.5)"
        filterPadding={160}
        className="relative h-[44px] w-[44px] overflow-visible"
      >
        <Liquid.Item
          x={mailPos.x}
          y={mailPos.y}
          transition="bouncy"
          className="absolute inset-0 flex h-[44px] w-[44px] items-center justify-center"
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              openModal()
            }}
            tabIndex={open ? 0 : -1}
            className={optionClass(open)}
            aria-label={copy.mail}
            title={copy.mail}
          >
            <MailIcon className="h-[10.5px] w-[14px]" />
          </button>
        </Liquid.Item>

        <Liquid.Item
          x={waPos.x}
          y={waPos.y}
          transition="bouncy"
          delay={35}
          className="absolute inset-0 flex h-[44px] w-[44px] items-center justify-center"
        >
          {whatsAppHref ? (
            <a
              href={whatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className={`${optionClass(open)} text-[#25D366] hover:text-coal-900`}
              aria-label={copy.whatsapp}
              title={copy.whatsapp}
            >
              <WhatsAppIcon className="h-[18px] w-[18px]" />
            </a>
          ) : (
            <span className={optionClass(false)} aria-hidden />
          )}
        </Liquid.Item>

        <Liquid.Item
          x={0}
          y={0}
          className="absolute inset-0 z-10 flex h-[44px] w-[44px] items-center justify-center"
        >
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label={open ? copy.triggerOpen : copy.trigger}
            className={`group/chat relative flex h-[44px] w-[44px] cursor-pointer items-center justify-center rounded-full border shadow-lg transition-all duration-300 ${
              open
                ? 'border-white bg-white text-coal-900 hover:border-gold-500 hover:bg-gold-500'
                : 'border-white/10 bg-coal-800 text-gold-100 hover:border-gold-500 hover:bg-gold-500 hover:text-coal-900 hover:shadow-gold-500/30'
            }`}
          >
            {!open && (
              <span className="pointer-events-none absolute inset-0 rounded-full bg-gold-500/20 animate-ping" />
            )}
            <ChatIcon className="relative h-[18px] w-[18px] transition-transform duration-200 group-hover/chat:scale-105" />
          </button>
        </Liquid.Item>
      </Liquid>
    </div>
    </>
  )
}
