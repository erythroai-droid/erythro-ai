import {
  ANALYTICS_AW_ID,
  ANALYTICS_GA_ID,
  ANALYTICS_META_PIXEL_ID,
} from '@/lib/analyticsEager'

export const META_PIXEL_ID = ANALYTICS_META_PIXEL_ID

const AW_ID = ANALYTICS_AW_ID
const GA_ID = ANALYTICS_GA_ID
const PIXEL_ID = ANALYTICS_META_PIXEL_ID

/**
 * Head bootstrap (ISR-static layout cannot see ?gclid= at SSR — branch in JS).
 *
 * Eager (paid params / ads LP /audit /order): same as before — gtag.js + Meta in
 * head with Consent Mode denied (PIT-108 / PIT-116 / PIT-117).
 *
 * Organic marketing pages: stub only (dataLayer, consent default, UTM snapshot);
 * network scripts load on Accept or first conversion via __erythroLoadAnalyticsScripts.
 */
const BOOTSTRAP_JS = `
(function(){
var AW='${AW_ID}';
var GA='${GA_ID}';
var PIXEL='${PIXEL_ID}';
window.dataLayer = window.dataLayer || [];
var host = (window.location && window.location.hostname || '').toLowerCase();
var path = (window.location && window.location.pathname || '/').split('?')[0] || '/';
var q = window.location && window.location.search || '';
var prod = host === 'erythro.ai' || host.slice(-11) === '.erythro.ai';
window.__ERYTHRO_ANALYTICS_DISABLED__ = !prod;
function gtag(){if(prod){dataLayer.push(arguments);}}
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
window.__ERYTHRO_GA_ID__ = GA;
window.__ERYTHRO_AW_ID__ = AW;
window.__ERYTHRO_META_PIXEL_ID__ = PIXEL;
try {
  var sp = new URLSearchParams(q);
  var fbclid = sp.get('fbclid');
  var gclid = sp.get('gclid') || sp.get('gbraid') || sp.get('wbraid');
  var utmCampaign = sp.get('utm_campaign');
  var utmSource = sp.get('utm_source') || (fbclid ? 'fb' : gclid ? 'google' : null);
  var utmMedium = sp.get('utm_medium') || (fbclid ? 'paid' : gclid ? 'cpc' : null);
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

function isAuditLpHost(h){
  return /^audit-[a-z0-9-]+\\.erythro\\.ai$/.test(h);
}
function needsEager(){
  if (isAuditLpHost(host)) return true;
  if (path === '/audit' || path.indexOf('/audit/') === 0) return true;
  if (path.indexOf('/lp/audit') === 0) return true;
  if (path.indexOf('/order/') === 0) return true;
  if (!q) return false;
  try {
    var p = new URLSearchParams(q.charAt(0)==='?' ? q.slice(1) : q);
    return p.has('fbclid')||p.has('gclid')||p.has('gbraid')||p.has('wbraid')||
      p.has('utm_source')||p.has('utm_campaign')||p.has('utm_medium');
  } catch (e) { return false; }
}

function injectGtag(){
  if (!prod) return;
  var s=document.createElement('script');
  s.async=true;
  s.src='https://www.googletagmanager.com/gtag/js?id='+AW;
  var first=document.getElementsByTagName('script')[0];
  if(first&&first.parentNode) first.parentNode.insertBefore(s, first);
  else (document.head||document.documentElement).appendChild(s);
  gtag('config', AW);
}

function injectMeta(){
  if (!prod) {
    window.fbq = window.fbq || function(){};
    return;
  }
  // Official snippet no-ops if fbq already exists — do not stub before this runs.
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window,document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('consent', 'revoke');
  fbq('init', PIXEL);
  fbq('track', 'PageView');
}

window.__erythroLoadAnalyticsScripts = function(){
  if (!prod) return;
  if (window.__ERYTHRO_ANALYTICS_SCRIPTS_REQUESTED__) return;
  window.__ERYTHRO_ANALYTICS_SCRIPTS_REQUESTED__ = true;
  injectGtag();
  injectMeta();
};

if (needsEager()) {
  window.__ERYTHRO_ANALYTICS_DEFERRED__ = false;
  window.__erythroLoadAnalyticsScripts();
} else {
  // Organic: no gtag.js / fbevents until Accept or conversion (requestAnalyticsScripts).
  window.__ERYTHRO_ANALYTICS_DEFERRED__ = true;
}
})();
`.trim()

export default function AnalyticsBootstrap() {
  return (
    <>
      <script
        id="google-tag-bootstrap"
        dangerouslySetInnerHTML={{ __html: BOOTSTRAP_JS }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height={1}
          width={1}
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
