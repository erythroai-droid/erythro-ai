'use client'

import Link from 'next/link'
import { footer } from '@/translations'

/**
 * Grow's site review looks for purchase terms on the homepage and again
 * next to the checkout checkbox: delivery, liability, age, cancellation, privacy.
 * Rendered from code so a CMS footer cannot drop it.
 */
export default function PurchaseTermsNotice({
  locale,
  id,
}: {
  locale: string
  id?: string
}) {
  const t = (field: Record<string, string>) => field[locale] || field.en
  const linkClass =
    'font-normal text-gold-500/90 underline underline-offset-2 decoration-gold-500/35 transition-colors hover:text-gold-100 hover:decoration-gold-100'

  return (
    <div id={id} className="flex flex-col items-start gap-2 text-start">
      <p className="m-0 text-xs font-normal normal-case leading-relaxed text-white/75">
        {t(footer.purchaseTermsNotice)}
      </p>
      <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-normal normal-case leading-relaxed">
        <Link href="/terms" className={linkClass}>
          {t(footer.legalLinks[1].label)}
        </Link>
        <Link href="/privacy" className={linkClass}>
          {t(footer.legalLinks[0].label)}
        </Link>
      </p>
    </div>
  )
}
