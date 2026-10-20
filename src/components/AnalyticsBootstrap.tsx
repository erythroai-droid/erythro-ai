const GA_ID = 'G-F3BTVWGDRS'
const AW_ID = 'AW-18453652197'
export const META_PIXEL_ID = '2395401914532727'

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
gtag('set', 'url_passthrough', true);
gtag('js', new Date());
gtag('config', '${AW_ID}');
window.__ERYTHRO_GA_ID__ = '${GA_ID}';
window.__ERYTHRO_AW_ID__ = '${AW_ID}';
try {
  var sp = new URLSearchParams(window.location.search || '');
  var utmCampaign = sp.get('utm_campaign');
  var utmSource = sp.get('utm_source');
  var utmMedium = sp.get('utm_medium');
  if (utmCampaign || utmSource || utmMedium) {
    window.__ERYTHRO_INITIAL_UTM__ = {
      campaign_name: utmCampaign || undefined,
      campaign_source: utmSource || undefined,
      campaign_medium: utmMedium || undefined,
      campaign_content: sp.get('utm_content') || undefined,
      campaign_term: sp.get('utm_term') || undefined
    };
  }
} catch (e) {}
`.trim()

/** Meta Pixel in &lt;head&gt; so Events Manager verifies the base code. Consent revoke until Accept. */
const META_PIXEL_JS = `
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('consent', 'revoke');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
window.__ERYTHRO_META_PIXEL_ID__ = '${META_PIXEL_ID}';
`.trim()

/**
 * Google tag always in &lt;head&gt; as raw scripts so Ads verification finds
 * `gtag/js?id=AW-…` in page source. Consent Mode denies storage until Accept.
 * One gtag.js only — AnalyticsLoader must not load a second copy.
 * Meta Pixel base code sits alongside with consent revoke until Accept.
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
      {/* Meta (Facebook) Pixel */}
      <script
        id="meta-pixel-bootstrap"
        dangerouslySetInnerHTML={{ __html: META_PIXEL_JS }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height={1}
          width={1}
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
