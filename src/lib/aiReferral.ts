/** Known AI assistant referrer hosts for GA4 custom reporting. */
export const AI_REFERRER_HOSTS = [
  'chat.openai.com',
  'chatgpt.com',
  'perplexity.ai',
  'claude.ai',
  'gemini.google.com',
  'copilot.microsoft.com',
  'you.com',
  'phind.com',
  'poe.com',
] as const

export function detectAiReferrer(referrer: string): string | null {
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    for (const candidate of AI_REFERRER_HOSTS) {
      if (host === candidate || host.endsWith(`.${candidate}`)) return candidate
    }
  } catch {
    /* ignore malformed referrer */
  }
  return null
}

/** Push AI referral context into dataLayer (call after analytics consent is granted). */
export function pushAiReferralToDataLayer(): void {
  if (typeof window === 'undefined' || !document.referrer) return

  const aiSource = detectAiReferrer(document.referrer)
  if (!aiSource) return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'ai_referral_detected',
    ai_referral: aiSource,
    llm_source: aiSource,
    ai_channel: 'ai_assistant',
    page_referrer: document.referrer,
  })

  if (typeof window.gtag === 'function') {
    window.gtag('event', 'ai_referral', {
      ai_source: aiSource,
      ai_referral: aiSource,
      llm_source: aiSource,
      page_referrer: document.referrer,
    })
  }
}
