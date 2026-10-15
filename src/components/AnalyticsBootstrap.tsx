const GA_ID = 'G-F3BTVWGDRS'
const AW_ID = 'AW-18453652197'

const BOOTSTRAP_JS = `
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
gtag('config', '${AW_ID}');
window.__ERYTHRO_GA_ID__ = '${GA_ID}';
window.__ERYTHRO_AW_ID__ = '${AW_ID}';
`.trim()

/**
 * Google tag always in &lt;head&gt; as raw scripts so Ads verification finds
 * `gtag/js?id=AW-…` in page source. Consent Mode denies storage until Accept.
 * One gtag.js only — AnalyticsLoader must not load a second copy.
 */
export default function AnalyticsBootstrap() {
  return (
    <>
      {/* Google tag (gtag.js) */}
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${AW_ID}`} />
      <script
        id="google-tag-bootstrap"
        dangerouslySetInnerHTML={{ __html: BOOTSTRAP_JS }}
      />
    </>
  )
}
