import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import PaymentReturn from '@/components/payment/PaymentReturn'
import { paymentCopy, type PaymentViewStatus } from '@/lib/payments/returnCopy'
import { verifyPaymentReturn } from '@/lib/payments/returnSig'
import { getRequestPrefs } from '@/lib/requestPrefs'
import { formatSubmissionTicketId } from '@/lib/submissionTicket'
import type { SiteLocale } from '@/lib/sitePrefs'

export const dynamic = 'force-dynamic'

interface SuccessPageProps {
  searchParams: Promise<{ id?: string; sig?: string }>
}

function viewStatus(value: string | null | undefined): PaymentViewStatus {
  if (value === 'paid' || value === 'pending' || value === 'failed' || value === 'refunded') return value
  return 'unknown'
}

export async function generateMetadata({ searchParams }: SuccessPageProps): Promise<Metadata> {
  const params = await searchParams
  const { initialLocale } = await getRequestPrefs()
  const signed = verifyPaymentReturn(params.id, params.sig)
  const titleKey = signed ? 'pendingTitle' : 'unknownTitle'
  return {
    title: `${paymentCopy(titleKey, initialLocale)} | Erythro.ai`,
    robots: { index: false, follow: false },
  }
}

export default async function PaymentSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams
  const { initialLocale } = await getRequestPrefs()
  const locale: SiteLocale = initialLocale
  const id = params.id?.trim() || ''
  const sig = params.sig?.trim() || ''

  let status: PaymentViewStatus = 'unknown'
  let ticketId = ''
  let reportHref = ''
  let retryHref = ''

  if (verifyPaymentReturn(id, sig)) {
    try {
      const payload = await getPayload({ config })
      const doc = await payload.findByID({
        collection: 'contact-submissions',
        id: Number(id),
        depth: 0,
        overrideAccess: true,
      })
      if (doc) {
        status = viewStatus(doc.paymentStatus)
        ticketId = formatSubmissionTicketId(doc.source, doc.id) || ''
        reportHref = `/audit/report/${doc.id}`
        retryHref = doc.planSlug ? `/order/${doc.planSlug}` : ''
      }
    } catch (err) {
      console.error('[order/success]', err instanceof Error ? err.message : 'error')
      status = 'pending'
    }
  }

  return (
    <PaymentReturn
      locale={locale}
      initialStatus={status}
      submissionId={status === 'unknown' ? '' : id}
      signature={status === 'unknown' ? '' : sig}
      ticketId={ticketId}
      reportHref={reportHref}
      retryHref={retryHref}
    />
  )
}
