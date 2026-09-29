'use client'

import { useSiteContent } from './SiteContentProvider'

/**
 * Grow's site review looks for purchase terms on the homepage and again
 * next to the checkout checkbox: delivery, liability, age, cancellation, privacy.
 * Copy comes from the Footer global (purchase terms notice).
 * Terms and privacy links stay in the footer legal bar and on the order checkbox.
 */
export default function PurchaseTermsNotice({
  locale,
  id,
}: {
  locale: string
  id?: string
}) {
  const notice = useSiteContent().footer.purchaseTermsNotice
  const text = notice?.[locale] || notice?.en || ''
  if (!text) return null

  return (
    <p id={id} className="m-0 text-start text-xs font-normal normal-case leading-relaxed text-white/75">
      {text}
    </p>
  )
}
