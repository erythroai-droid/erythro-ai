// Report shown instead of an audit when the site answers the lab with a bot challenge (PIT-149):
// report 244 (shirielectric.co.il) was built on an empty AWS WAF challenge page and told the client
// the site had no form, no headers and no robots.txt. One message, what to do, how to reach us.
//
// Looks like the approved report: <head> (all styles), the logo and the page script (smooth scroll to
// #action-… with highlight, copy button) are taken from
// audit_template_<tier>_<lang>.html, the body uses only report classes. A change to the report
// styles reaches this page by itself.
//
// CLI (preview):  node scripts/render-blocked-report.mjs <out-dir> [site] [protection] [status]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES = path.resolve(HERE, '../templates');

export const LAB_IP = '46.202.155.56';
const EMAIL = 'team@erythro.ai';
const WA = '972505308305';

const TIER_NAMES = { free: 'Free', diagnostic: 'Diagnostic', pro: 'Pro' };

// The big message is the only thing the report has no class for
const EXTRA_STYLE = `<style data-blocked>
:root:root:root section.blocked-card { border-top: 4px solid #e52421 !important; }
.blocked-title { margin: 28px 0 0; font-size: clamp(30px, 4.6vw, 52px); line-height: 1.1; font-weight: 500; letter-spacing: -.01em; text-wrap: balance; }
.blocked-title + .sub { margin-top: 18px; max-width: 760px; }
@media (max-width: 720px) { .blocked-card .proto { grid-template-columns: 1fr; } }
</style>`;

const COPY = {
  ru: {
    title: 'Аудит не выполнен',
    tierBadge: (t) => `Аудит сайта · ${t}`,
    checkedAt: (d) => `Попытка: ${d}`,
    locale: 'Локаль: RU',
    kicker: 'Аудит не выполнен',
    status: 'Нет доступа',
    headline: 'Ваш сайт закрыт защитой от ботов — мы не смогли его проверить',
    lead: 'Вместо страниц сайта наша лаборатория получила проверку «вы не робот». Поэтому в отчёте нет оценки и выводов: отчёт по пустой странице защиты был бы неверным.',
    protectionLabel: 'защита сайта',
    answerLabel: 'ответ сервера',
    pages: '0 из 1',
    pagesLabel: 'страниц проверено',
    scoreLabel: 'оценка не выставлена',
    todo: 'Что сделать',
    todoSub: 'Откройте доступ лаборатории или напишите нам — после этого проверим сайт заново.',
    step1Title: 'Добавьте лабораторию Erythro.ai в allowlist',
    step1Tag: 'Защита от ботов',
    step1Sev: 'Без этого аудит невозможен',
    step1Text: 'В настройках защиты (Cloudflare, AWS WAF, панель хостинга) разрешите доступ с IP-адреса лаборатории. Обычные посетители этого не заметят.',
    ipLabel: 'IP лаборатории',
    stepWord: 'Шаг',
    ctaTitle: 'Напишите нам',
    ctaText: 'Подскажем, где в вашей защите добавить исключение, или проверим сайт другим способом. Как только доступ откроется, перезапустим проверку бесплатно.',
    waLabel: 'Написать в WhatsApp',
    waShort: 'WhatsApp',
    waText: (site) => `Здравствуйте! Мой сайт ${site} закрыт защитой от ботов, аудит не прошёл.`,
    disclaimer: 'Это служебное сообщение, а не результат аудита. Оно не оценивает сайт и не означает, что с ним что-то не так: защита от ботов работает так, как её настроили.',
    months: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  },
  en: {
    title: 'Audit not completed',
    tierBadge: (t) => `Website audit · ${t}`,
    checkedAt: (d) => `Attempted: ${d}`,
    locale: 'Locale: EN',
    kicker: 'Audit not completed',
    status: 'No access',
    headline: 'Your site is behind bot protection — we could not check it',
    lead: 'Instead of your pages, our lab got an “are you human?” check. So the report has no score and no findings: a report on an empty protection page would be wrong.',
    protectionLabel: 'site protection',
    answerLabel: 'server answer',
    pages: '0 of 1',
    pagesLabel: 'pages checked',
    scoreLabel: 'no score given',
    todo: 'What to do',
    todoSub: 'Open access for the lab or write to us — then we check the site again.',
    step1Title: 'Add the Erythro.ai lab to your allowlist',
    step1Tag: 'Bot protection',
    step1Sev: 'Needed for any audit',
    step1Text: 'In your protection settings (Cloudflare, AWS WAF, hosting panel) allow access from the lab IP address. Regular visitors will not notice anything.',
    ipLabel: 'Lab IP',
    stepWord: 'Step',
    ctaTitle: 'Write to us',
    ctaText: 'We will show you where to add the exception in your protection, or check the site another way. As soon as access is open, we re-run the check for free.',
    waLabel: 'Message us on WhatsApp',
    waShort: 'WhatsApp',
    waText: (site) => `Hi! My site ${site} is behind bot protection and the audit did not run.`,
    disclaimer: 'This is a service message, not an audit result. It does not rate the site or mean something is wrong with it: the bot protection works as it was set up.',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  he: {
    title: 'הבדיקה לא בוצעה',
    tierBadge: (t) => `ביקורת אתר · ${t}`,
    checkedAt: (d) => `ניסיון: ${d}`,
    locale: 'שפה: HE',
    kicker: 'הבדיקה לא בוצעה',
    status: 'אין גישה',
    headline: 'האתר שלכם מוגן מפני בוטים — לא הצלחנו לבדוק אותו',
    lead: 'במקום עמודי האתר, המעבדה שלנו קיבלה בדיקת «אני לא רובוט». לכן בדוח אין ציון ואין ממצאים: דוח על דף הגנה ריק היה שגוי.',
    protectionLabel: 'הגנת האתר',
    answerLabel: 'תשובת השרת',
    pages: '0 מתוך 1',
    pagesLabel: 'עמודים נבדקו',
    scoreLabel: 'לא ניתן ציון',
    todo: 'מה לעשות',
    todoSub: 'פתחו גישה למעבדה או כתבו לנו — ואז נבדוק את האתר מחדש.',
    step1Title: 'הוסיפו את המעבדה של Erythro.ai לרשימת ההיתרים (allowlist)',
    step1Tag: 'הגנה מפני בוטים',
    step1Sev: 'בלי זה אין ביקורת',
    step1Text: 'בהגדרות ההגנה (Cloudflare, AWS WAF, לוח הבקרה של האחסון) אפשרו גישה מכתובת ה-IP של המעבדה. מבקרים רגילים לא ירגישו בשינוי.',
    ipLabel: 'IP של המעבדה',
    stepWord: 'שלב',
    ctaTitle: 'כתבו לנו',
    ctaText: 'נראה לכם איפה להוסיף חריגה בהגנה, או נבדוק את האתר בדרך אחרת. ברגע שהגישה תיפתח, נריץ את הבדיקה מחדש בחינם.',
    waLabel: 'כתבו לנו ב-WhatsApp',
    waShort: 'WhatsApp',
    waText: (site) => `שלום! האתר שלי ${site} מוגן מפני בוטים והבדיקה לא בוצעה.`,
    disclaimer: 'זו הודעת שירות, לא תוצאת ביקורת. היא לא מדרגת את האתר ולא אומרת שמשהו בו לא תקין: ההגנה מפני בוטים עובדת כפי שהוגדרה.',
    months: ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳']
  }
};

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function fmtDate(d, c) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCDate()} ${c.months[d.getUTCMonth()]} ${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

// Head, logo and page script of the approved report for this tier and language
function reportParts(tier, lang) {
  const file = [`audit_template_${tier}_${lang}.html`, `audit_template_free_${lang}.html`]
    .map((f) => path.join(TEMPLATES, f)).find((f) => fs.existsSync(f));
  if (!file) throw new Error(`blocked report: no report template for ${tier}/${lang}`);
  const src = fs.readFileSync(file, 'utf8');
  const headEnd = src.indexOf('</head>');
  const logo = src.match(/<a class="logo"[\s\S]*?<\/a>/);
  // The same script the report uses for its badges: smooth scroll to #action-… and the copy button
  const script = src.match(/<script>(?:(?!<\/script>)[\s\S])*Smooth scroll and highlight[\s\S]*?<\/script>/);
  if (headEnd < 0 || !logo || !script) throw new Error(`blocked report: ${path.basename(file)} has no head, logo or page script`);
  return { head: src.slice(0, headEnd), logo: logo[0], script: script[0] };
}

/**
 * @param {{ site: string, lang?: string, tier?: string, protection?: string, status?: string, checkedAt?: Date }} input
 * @returns {string} HTML
 */
export function renderBlockedReport(input) {
  const lang = COPY[input.lang] ? input.lang : 'en';
  const c = COPY[lang];
  const tierKey = TIER_NAMES[String(input.tier || 'free').toLowerCase()] ? String(input.tier || 'free').toLowerCase() : 'free';
  const at = input.checkedAt || new Date();
  const site = input.site;
  const parts = reportParts(tierKey, lang);
  const head = parts.head
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(c.title)} · ${esc(site)} — Erythro.ai</title>`)
    + EXTRA_STYLE + '\n</head>';
  const values = {
    REPORT_HEAD: head,
    LOGO: parts.logo,
    REPORT_SCRIPT: parts.script,
    TIER_BADGE: c.tierBadge(TIER_NAMES[tierKey]),
    CHECKED_AT: c.checkedAt(fmtDate(at, c)),
    LOCALE_BADGE: c.locale,
    SITE: site,
    KICKER: c.kicker,
    STATUS: c.status,
    HEADLINE: c.headline,
    LEAD: c.lead,
    STAT_PROTECTION: input.protection || '—',
    STAT_PROTECTION_LABEL: c.protectionLabel,
    STAT_ANSWER: input.status || '—',
    STAT_ANSWER_LABEL: c.answerLabel,
    STAT_PAGES: c.pages,
    STAT_PAGES_LABEL: c.pagesLabel,
    STAT_SCORE_LABEL: c.scoreLabel,
    TODO_TITLE: c.todo,
    TODO_SUB: c.todoSub,
    STEP1_TITLE: c.step1Title,
    STEP1_TAG: c.step1Tag,
    STEP1_SEV: c.step1Sev,
    STEP1_TEXT: c.step1Text,
    IP_LABEL: c.ipLabel,
    LAB_IP,
    STEP_WORD: c.stepWord,
    CTA_TITLE: c.ctaTitle,
    CTA_TEXT: c.ctaText,
    EMAIL,
    WA_HREF: `https://wa.me/${WA}?text=${encodeURIComponent(c.waText(site))}`,
    WA_LABEL: c.waLabel,
    WA_SHORT: c.waShort,
    DISCLAIMER: c.disclaimer,
    YEAR: String(at.getUTCFullYear())
  };
  const raw = new Set(['REPORT_HEAD', 'LOGO', 'REPORT_SCRIPT']);
  const tpl = fs.readFileSync(path.join(TEMPLATES, 'audit_template_blocked.html'), 'utf8');
  return tpl.replace(/\{\{([A-Z0-9_]+)\}\}/g, (m, k) => {
    if (!(k in values)) throw new Error(`blocked template: no value for ${k}`);
    return raw.has(k) ? values[k] : esc(values[k]);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [outDir = '.', site = 'shirielectric.co.il', protection = 'AWS WAF', status = 'HTTP 202'] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  for (const lang of Object.keys(COPY)) {
    const out = path.join(outDir, `blocked-${lang}.html`);
    fs.writeFileSync(out, renderBlockedReport({ site, lang, tier: 'free', protection, status, checkedAt: new Date('2026-10-30T12:34:00Z') }));
    console.log('[✓]', out);
  }
}
