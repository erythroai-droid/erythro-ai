import Script from 'next/script'

const GA_ID = 'G-F3BTVWGDRS'

/** Consent Mode + dataLayer stub — always in HTML so crawlers and GTM rules can detect GA4. */
export default function AnalyticsBootstrap() {
  return (
  <Script id="ga-bootstrap" strategy="beforeInteractive">
    {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted'
});
gtag('js', new Date());
window.__ERYTHRO_GA_ID__ = '${GA_ID}';
`}
  </Script>
  )
}
