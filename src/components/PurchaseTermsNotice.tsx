'use client'

import Link from 'next/link'
import { useSiteContent } from './SiteContentProvider'

/**
 * Grow's site review looks for purchase terms on the homepage and again
 * next to the checkout checkbox: delivery, liability, age, cancellation, privacy.
 * Copy comes from the Footer global (purchase terms notice).
 */
export default function PurchaseTermsNotice({
  locale,
  id,
}: {
  locale: string
  id?: string
}) {
  const footer = useSiteContent().footer
  const t = (field: Record<string, string> | undefined) => field?.[locale] || field?.en || ''
  const terms = footer.legalLinks.find((link) => link.id === 'terms') ?? footer.legalLinks[1]
  const privacy = footer.legalLinks.find((link) => link.id === 'privacy') ?? footer.legalLinks[0]
  const linkClass =
    'font-normal text-gold-500/90 underline underline-offset-2 decoration-gold-500/35 transition-colors hover:text-gold-100 hover:decoration-gold-100'

  return (
    <div id={id} className="flex flex-col items-start gap-2 text-start">
      <p className="m-0 text-xs font-normal normal-case leading-relaxed text-white/75">
        {t(footer.purchaseTermsNotice)}
      </p>
      <p className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-normal normal-case leading-relaxed">
        {terms ? (
          <Link href={terms.href || '/terms'} className={linkClass}>
            {t(terms.label)}
          </Link>
        ) : null}
        {privacy ? (
          <Link href={privacy.href || '/privacy'} className={linkClass}>
            {t(privacy.label)}
          </Link>
        ) : null}
      </p>
    </div>
  )
}
