const PURCHASE_SEND_TO = 'AW-18453652197/-mcPCMys6Z0dEOXFsd9E'
const SENT_KEY_PREFIX = 'erythro:ads-purchase:'

/** Google Ads «Покупка». Fires once per submission per browser; Ads also dedupes by transaction_id. */
export function trackAdsPurchase(transactionId: string, value: number | null) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function' || !transactionId) return

  const key = `${SENT_KEY_PREFIX}${transactionId}`
  try {
    if (window.localStorage.getItem(key)) return
    window.localStorage.setItem(key, '1')
  } catch {
    // Storage blocked: rely on transaction_id dedupe in Google Ads.
  }

  window.gtag('event', 'conversion', {
    send_to: PURCHASE_SEND_TO,
    transaction_id: transactionId,
    ...(typeof value === 'number' && value > 0 ? { value, currency: 'ILS' } : {}),
  })
}
