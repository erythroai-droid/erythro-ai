'use client'

import React from 'react'
import CookieConsent from '@/components/CookieConsent'
import HeaderChipStrip from '@/components/HeaderChipStrip'
import WhatsAppButton from '@/components/WhatsAppButton'
import { SiteContentProvider, useSiteContent } from '@/components/SiteContentProvider'
import StylizedSectionTitle from '@/components/StylizedSectionTitle'
import AuditLpForm from '@/components/audit/AuditLpForm'
import type { SiteContent } from '@/lib/defaultContent'
import type { AuditPageContent } from '@/lib/auditPage'
import {
  auditLpCopy,
  mainSiteUrl,
  tAuditLp,
  type AuditLpLocale,
} from '@/lib/auditLp'
import { auditSampleReportHref, auditSampleReportLabel } from '@/lib/auditSampleReports'
import { openConsentSettings } from '@/lib/privacyConsent'
import { useSitePrefs } from '@/hooks/useSitePrefs'

interface AuditLpClientProps {
  locale: AuditLpLocale
  content: SiteContent
  auditPageContent: AuditPageContent
}

/** Official wordmark — same SVG mark as Navbar (mobile). */
function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      width="138"
      height="30"
      viewBox="0 0 138 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g clipPath="url(#clip_audit_lp_logo)">
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
        <path
          d="M9.16691 19.7986C7.3611 19.4147 6.01019 18.4824 5.72071 16.6041H17.3689C17.4792 15.9734 17.5481 15.1234 17.5481 14.3967C17.5481 9.09086 14.4465 6.41735 9.20827 6.41735C9.19449 6.41735 9.16692 6.41735 9.15313 6.41735V9.96832C9.20827 9.96832 9.26341 9.96832 9.31855 9.96832C11.4414 9.96832 12.5304 11.0514 12.5993 13.2039H9.15313H5.70692H0.510037C0.385974 13.8758 0.31705 14.6024 0.31705 15.3839C0.31705 21.0188 3.8184 23.7472 9.16691 24.0899V19.8123V19.7986Z"
          fill="#E52421"
        />
        <path
          d="M136.043 6.623H122.63C121.549 6.623 120.672 7.49464 120.672 8.56987V21.91C120.672 22.9852 121.549 23.8569 122.63 23.8569H136.043C137.124 23.8569 138 22.9852 138 21.91V8.56987C138 7.49464 137.124 6.623 136.043 6.623Z"
          fill="#E52421"
        />
        <path
          d="M126.214 19.7301C125.745 19.7301 125.332 19.6615 124.973 19.5107C124.615 19.3599 124.339 19.1268 124.132 18.8252C123.926 18.5235 123.829 18.1397 123.829 17.6735C123.829 17.2074 123.898 16.9606 124.036 16.6864C124.174 16.4122 124.367 16.1928 124.601 16.0146C124.835 15.8363 125.125 15.7129 125.456 15.617C125.787 15.521 126.131 15.4661 126.503 15.4387C126.917 15.4113 127.234 15.3702 127.482 15.329C127.73 15.2879 127.91 15.2194 128.02 15.1371C128.13 15.0548 128.185 14.9589 128.185 14.8218V14.7943C128.185 14.6847 128.158 14.6024 128.089 14.5201C128.02 14.4379 127.937 14.383 127.813 14.3419C127.689 14.3008 127.551 14.2734 127.386 14.2734C127.22 14.2734 127.069 14.3008 126.945 14.3419C126.821 14.383 126.71 14.4653 126.641 14.5613C126.572 14.6572 126.517 14.7669 126.49 14.9177L124.091 14.8629C124.146 14.3693 124.298 13.9306 124.56 13.5741C124.822 13.2177 125.208 12.9435 125.69 12.7515C126.173 12.5596 126.779 12.4636 127.482 12.4636C128.185 12.4636 128.488 12.5184 128.902 12.6281C129.316 12.7378 129.66 12.9023 129.95 13.108C130.239 13.3136 130.446 13.5741 130.598 13.8758C130.749 14.1774 130.818 14.5201 130.818 14.904V19.6204H128.268V18.6332H128.24C128.089 18.9074 127.91 19.1268 127.717 19.2913C127.524 19.4558 127.289 19.5655 127.041 19.6341C126.793 19.7026 126.517 19.7438 126.214 19.7438V19.7301ZM127.082 18.0848C127.275 18.0848 127.455 18.0437 127.634 17.9751C127.813 17.9066 127.951 17.7969 128.075 17.6461C128.199 17.4953 128.24 17.3308 128.24 17.1114V16.5493C128.171 16.5767 128.102 16.6041 128.034 16.6178C127.965 16.6315 127.882 16.6589 127.799 16.6864C127.717 16.7138 127.62 16.7275 127.524 16.7412C127.427 16.7549 127.317 16.7823 127.193 16.8098C127.013 16.8372 126.848 16.892 126.724 16.9469C126.6 17.0017 126.49 17.084 126.421 17.1799C126.352 17.2759 126.324 17.3856 126.324 17.4953C126.324 17.605 126.352 17.7283 126.421 17.8106C126.49 17.8929 126.572 17.9614 126.696 18.0163C126.821 18.0711 126.945 18.0848 127.096 18.0848H127.082Z"
          fill="white"
        />
        <path
          d="M133.451 12.066C133.051 12.066 132.72 11.9426 132.459 11.7095C132.197 11.4765 132.073 11.1748 132.073 10.8184C132.073 10.4619 132.197 10.1603 132.459 9.92719C132.72 9.69411 133.051 9.57072 133.451 9.57072C133.851 9.57072 134.182 9.69411 134.444 9.92719C134.705 10.1603 134.829 10.4619 134.829 10.8184C134.829 11.1748 134.705 11.4765 134.444 11.7095C134.182 11.9426 133.851 12.066 133.451 12.066ZM132.141 19.6067V12.6007H134.774V19.6067H132.141Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="clip_audit_lp_logo">
          <rect width="138" height="30" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

function ThemeToggleButton({
  locale,
  theme,
  setTheme,
}: {
  locale: string
  theme: 'light' | 'dark'
  setTheme: (next: 'light' | 'dark') => void
}) {
  const next = theme === 'dark' ? 'light' : 'dark'
  const isLight = theme === 'light'
  const label =
    next === 'light'
      ? tAuditLp(auditLpCopy.themeToLight, locale)
      : tAuditLp(auditLpCopy.themeToDark, locale)

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className={`pointer-events-auto flex size-11 cursor-pointer items-center justify-center rounded-full border backdrop-blur-sm transition-colors hover:border-gold-500 hover:bg-gold-500 hover:text-coal-900 ${
        isLight
          ? 'border-coal-900/15 bg-white/70 text-coal-900'
          : 'border-white/20 bg-coal-900/40 text-white'
      }`}
      aria-label={label}
      title={label}
    >
      {theme === 'dark' ? (
        <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm-12.37 1.06l-1.06 1.06c-.39.39-.39 1.03 0 1.41.39.39 1.03.39 1.41 0l1.06-1.06c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0zm12.37-13.43a.996.996 0 000-1.41l-1.06-1.06c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.38.39 1.02.39 1.41 0z" />
        </svg>
      ) : (
        <svg className="size-[15px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12.3 22h-.1c-5.4 0-9.8-4.4-9.8-9.8 0-5.1 3.9-9.3 9-9.8.6-.1 1.1.4 1 1-.5 2.5.2 5.1 1.9 6.8 1.7 1.7 4.3 2.4 6.8 1.9.6-.1 1.1.4 1 1-.9 5.2-5.3 9-10.8 8.9z" />
        </svg>
      )}
    </button>
  )
}

/** Chip strip + logo + theme toggle. Scrolls with the page. */
function AuditLpHeader({
  locale,
  theme,
  setTheme,
}: {
  locale: string
  theme: 'light' | 'dark'
  setTheme: (next: 'light' | 'dark') => void
}) {
  const logoAlt = tAuditLp(auditLpCopy.homeLink, locale)

  const isLight = theme === 'light'
  const logoSrc = isLight
    ? '/images/logo/Logo_digital-on-light.svg'
    : '/images/logo/Logo_digital.svg'

  return (
    <div className="relative z-20 w-full">
      <HeaderChipStrip page="legal" pin={false} />
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex w-full items-center justify-between gap-4 px-[30px] py-5 lg:px-[50px] lg:py-8">
        <a
          href={mainSiteUrl('/')}
          className={`pointer-events-auto flex items-center transition-opacity hover:opacity-80 ${
            isLight ? 'text-coal-900' : 'text-white'
          }`}
          aria-label={logoAlt}
        >
          {/* Inline SVG on small screens — avoid preloading desktop wordmark on mobile. */}
          <BrandLogo className="h-[30px] w-auto lg:hidden" />
          <span
            role="img"
            aria-hidden
            className="hidden h-[52px] w-[235px] bg-contain bg-left bg-no-repeat lg:block"
            style={{ backgroundImage: `url('${logoSrc}')` }}
          />
        </a>
        <ThemeToggleButton locale={locale} theme={theme} setTheme={setTheme} />
      </header>
    </div>
  )
}

/** Slim LP footer: copyright + legal only. */
function AuditLpFooter({ locale, theme }: { locale: string; theme: 'light' | 'dark' }) {
  const content = useSiteContent()
  const footer = content.footer
  const cookieConsent = content.cookieConsent
  const t = (field?: Record<string, string> | null) => field?.[locale] || field?.en || ''
  const cookieSettingsLabel =
    t(cookieConsent.manage) ||
    (locale === 'ru' ? 'Настройки Cookie' : locale === 'he' ? 'הגדרות Cookie' : 'Cookie Settings')
  const isLight = theme === 'light'

  return (
    <footer className="relative z-10 mx-auto w-full max-w-[1170px] px-[30px] pb-10 pt-2">
      <div
        className={`flex w-full flex-col items-start justify-between gap-6 border-t pt-6 lg:flex-row lg:items-center lg:gap-4 ${
          isLight ? 'border-coal-900/10' : 'border-white/10'
        }`}
      >
        <p
          className={`m-0 text-xs uppercase leading-[1.5] ${
            isLight ? 'text-coal-900' : 'text-white'
          }`}
        >
          {t(footer.copyright)}
        </p>
        <div className="flex flex-wrap items-center gap-x-[30px] gap-y-3">
          {footer.legalLinks.map((link) => (
            <a
              key={link.id}
              href={mainSiteUrl(link.href)}
              className={`text-xs uppercase leading-[1.5] transition-colors hover:text-gold-500 ${
                isLight ? 'text-coal-900' : 'text-white'
              }`}
            >
              {t(link.label)}
            </a>
          ))}
          <button
            type="button"
            onClick={openConsentSettings}
            className={`cursor-pointer text-xs uppercase leading-[1.5] transition-colors hover:text-gold-500 ${
              isLight ? 'text-coal-900' : 'text-white'
            }`}
          >
            {cookieSettingsLabel}
          </button>
        </div>
      </div>
    </footer>
  )
}

/**
 * Ads landing: fixed locale, logo-only header on chip strip, WhatsApp FAB.
 */
export default function AuditLpClient({
  locale: lockedLocale,
  content,
  auditPageContent,
}: AuditLpClientProps) {
  const { locale, theme, setTheme } = useSitePrefs(lockedLocale, 'dark', undefined, {
    lockedLocale,
  })
  const isRtl = locale === 'he'
  const isLight = theme === 'light'
  const sampleHref = auditSampleReportHref('audit-free', locale)
  // Light tokens match /audit (`AuditBody`): solution-light-bg + gold-900 accents.
  const ink = isLight ? 'text-coal-900' : 'text-white'
  const muted = isLight ? 'text-coal-900/85' : 'text-white/75'
  const mutedSoft = isLight ? 'text-coal-900/70' : 'text-white/65'
  const listText = isLight ? 'text-coal-900/85' : 'text-white/80'
  const accent = isLight ? 'text-gold-900' : 'text-gold-500'
  const accentBorder = isLight ? 'border-coal-900/10' : 'border-gold-500'
  const shell = isLight ? 'bg-gold-100' : 'bg-coal-900'
  const plate = isLight ? 'solution-light-bg text-coal-900' : 'dark-gradient-bg text-white'
  const cardClass = isLight
    ? 'border border-white bg-white shadow-card-services hover:shadow-[0_8px_26px_0_rgba(13,13,13,0.22)]'
    : 'border border-gold-500 bg-coal-900 hover:shadow-[0_8px_26px_0_rgba(0,0,0,0.45)]'

  return (
    <SiteContentProvider value={content}>
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`relative min-h-screen overflow-x-clip font-sans transition-colors duration-500 ${shell} ${ink}`}
      >
        <AuditLpHeader locale={locale} theme={theme} setTheme={setTheme} />

        <section
          id="audit-lp"
          data-menu-contrast={isLight ? 'light' : 'dark'}
          className={`relative z-20 w-full shadow-[0_-12px_30px_rgba(0,0,0,0.28)] max-lg:-mt-8 max-lg:overflow-clip max-lg:rounded-t-[28px] ${plate}`}
        >
          <div className="solution-section-noise absolute inset-0 z-[1] pointer-events-none" aria-hidden />
          <div className="relative z-10 mx-auto flex w-full max-w-[1170px] flex-col gap-10 px-[30px] pb-16 pt-6 max-lg:pt-10 lg:gap-12 lg:pb-20 lg:pt-10">
          <div className="flex w-full flex-col items-center gap-4 text-center">
            <div className="flex flex-col items-center gap-[5px]">
              <h1
                className={`m-0 font-sans text-[32px] font-extralight uppercase leading-tight tracking-[9.6px] lg:text-[48px] lg:leading-[60px] ${ink}`}
              >
                <StylizedSectionTitle
                  text={tAuditLp(auditLpCopy.sectionTitle, locale)}
                  restClassName={ink}
                />
              </h1>
              <p
                className={`m-0 max-w-2xl font-sans text-base font-light leading-8 tracking-[3.2px] ${
                  isLight ? 'text-gold-900' : 'text-gold-800'
                }`}
              >
                {tAuditLp(auditLpCopy.headline, locale)}
              </p>
              <p
                className={`m-0 max-w-xl font-sans text-sm font-light leading-7 sm:text-base sm:leading-8 ${mutedSoft}`}
              >
                {tAuditLp(auditLpCopy.subhead, locale)}
              </p>
            </div>
            <p
              className={`m-0 rounded-[40px] border bg-transparent px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] ${
                isLight ? 'border-coal-900/15 text-gold-900' : `${accentBorder} ${accent}`
              }`}
            >
              {tAuditLp(auditLpCopy.freeBadge, locale)}
            </p>
            {sampleHref ? (
              <p className="m-0">
                <a
                  href={sampleHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm font-medium underline decoration-from-font underline-offset-4 transition-colors ${
                    isLight
                      ? 'text-gold-900 hover:text-coal-900'
                      : 'text-gold-500 hover:text-gold-400'
                  }`}
                >
                  {auditSampleReportLabel(locale)}
                </a>
              </p>
            ) : null}
          </div>

          <div className="grid w-full grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="flex min-w-0 flex-col gap-6 text-start">
              <p className={`m-0 w-full text-sm font-light leading-7 sm:text-base sm:leading-8 ${muted}`}>
                {tAuditLp(auditLpCopy.about, locale)}
              </p>

              <div className="flex flex-col gap-3">
                <p className={`m-0 text-[11px] font-bold uppercase tracking-[0.14em] ${accent}`}>
                  {tAuditLp(auditLpCopy.scalesHeading, locale)}
                </p>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {auditLpCopy.scales.map((scale) => (
                    <li
                      key={scale.en}
                      className={`flex items-start gap-2 text-[13px] font-light leading-[1.7] ${listText}`}
                    >
                      <span
                        aria-hidden
                        className="mt-[7px] size-1 shrink-0 rounded-full bg-erythro-500"
                      />
                      <span>{tAuditLp(scale, locale)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <p className={`m-0 text-[11px] font-bold uppercase tracking-[0.14em] ${accent}`}>
                  {tAuditLp(auditLpCopy.deliverablesHeading, locale)}
                </p>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {auditLpCopy.deliverables.map((item) => (
                    <li
                      key={item.en}
                      className={`flex items-start gap-2 text-[13px] font-light leading-[1.7] ${listText}`}
                    >
                      <span
                        aria-hidden
                        className="mt-[7px] size-1 shrink-0 rounded-full bg-erythro-500"
                      />
                      <span>{tAuditLp(item, locale)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="min-w-0 w-full">
              <AuditLpForm locale={locale} theme={theme} page={auditPageContent} />
            </div>
          </div>

          <div className="flex w-full flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <p className={`m-0 text-[11px] font-bold uppercase tracking-[0.18em] ${accent}`}>
                {tAuditLp(auditLpCopy.benefitsKicker, locale)}
              </p>
              <h2
                className={`m-0 font-sans text-xl font-normal leading-[1.5] tracking-[0.04em] md:text-2xl ${ink}`}
              >
                {tAuditLp(auditLpCopy.benefitsHeading, locale)}
              </h2>
            </div>

            <div className="relative w-full py-1" aria-hidden>
              <div className="pointer-events-none absolute start-[16.666%] end-[16.666%] top-1/2 hidden h-px -translate-y-1/2 bg-gold-500 md:block" />
              <ol className="relative m-0 grid list-none grid-cols-3 justify-items-center p-0">
                {auditLpCopy.benefits.map((_, index) => (
                  <li key={index} className="flex justify-center">
                    <span
                      dir="ltr"
                      className={`relative z-[1] flex size-11 items-center justify-center rounded-full border text-sm font-bold tracking-[0.06em] shadow-[0_3px_16px_0_rgba(229,36,33,0.35)] ${
                        isLight
                          ? 'border-coal-900 bg-coal-900 text-white'
                          : 'border-gold-500 bg-erythro-500 text-white'
                      }`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <ol className="m-0 grid w-full list-none grid-cols-1 gap-4 p-0 md:grid-cols-3">
              {auditLpCopy.benefits.map((step, index) => (
                <li
                  key={step.title.en}
                  className={`rounded-[10px] p-6 pb-11 transition-shadow duration-300 md:p-8 md:pb-[52px] ${cardClass}`}
                >
                  <p
                    className={`m-0 mb-2 text-[11px] font-bold uppercase tracking-[0.14em] md:hidden ${accent}`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3
                    className={`m-0 mb-3 font-sans text-[22px] font-semibold leading-[1.4] tracking-normal sm:text-[24px] sm:leading-[1.5] ${accent}`}
                  >
                    {tAuditLp(step.title, locale)}
                  </h3>
                  <p className={`m-0 text-base font-light leading-7 ${listText}`}>
                    {tAuditLp(step.body, locale)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
          </div>
        </section>

        <div id="footer">
          <AuditLpFooter locale={locale} theme={theme} />
        </div>

        <WhatsAppButton alwaysVisible />
        <CookieConsent
          locale={locale}
          theme={theme}
          privacyHref={mainSiteUrl('/privacy')}
        />
      </div>
    </SiteContentProvider>
  )
}
