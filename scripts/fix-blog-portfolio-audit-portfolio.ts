/**
 * Portfolio fixes from Translater report `erythro_blog_and_portfolio_audit.md` (2026-11-28).
 * Read + write one locale at a time (PIT-174), depth 0.
 * HE of pro-interior / ai-audit-agent / ai-consultant is rebuilt from the RU Lexical
 * structure with new Hebrew text per text node (HE was machine-made or cut by ~40–50%).
 *
 *   npx tsx scripts/fix-blog-portfolio-audit-portfolio.ts --dry
 *   npx tsx scripts/fix-blog-portfolio-audit-portfolio.ts
 */
import './import-project/lib/load-env'
process.env.PAYLOAD_DISABLE_PUSH = '1'
import { getPayload, type Payload } from 'payload'
import config from '../src/payload.config'

const DRY = process.argv.includes('--dry')
const LOCALES = ['en', 'ru', 'he'] as const
type Loc = (typeof LOCALES)[number]
type Pair = { from: string; to: string }
type Doc = Record<string, any>

const HE_AUDIT_LABEL = 'ביקורת AI חינמית לאתר'

const GLOBAL: Record<Loc, Pair[]> = {
  en: [
    { from: '​', to: '' },
    { from: '«', to: '"' },
    { from: '»', to: '"' },
  ],
  ru: [],
  he: [
    { from: '​', to: '' },
    { from: '«', to: '"' },
    { from: '»', to: '"' },
    { from: 'אודיט AI חינמי לאתר', to: HE_AUDIT_LABEL },
  ],
}

const PER: Record<number, Partial<Record<Loc, Pair[]>>> = {
  1: {
    en: [{ from: 'Online store of italian quality products', to: 'Online store for quality Italian products' }],
    he: [
      { from: 'וסקאלה משולחן רחב עד מובייל', to: 'וסקאלה מדסקטופ רחב ועד מובייל' },
      { from: 'ערימת UI', to: 'סטאק UI' },
      { from: 'ומיילים HTML', to: 'ומיילי HTML' },
    ],
  },
  2: {
    en: [
      { from: ' Stretch ceiling studio «PRO Interior»', to: 'PRO Interior stretch ceiling studio' },
      { from: 'suspended ceiling', to: 'stretch ceiling' },
      { from: 'micro-interface animations', to: 'micro-interaction animations' },
      { from: 'ESLint code review', to: 'ESLint linting' },
      { from: 'Results and Business Effect', to: 'Results and business impact' },
    ],
    ru: [
      { from: 'Вызовы и Задачи Проекта', to: 'Вызовы и задачи проекта' },
      { from: 'Инженерное Решение и Архитектура', to: 'Инженерное решение и архитектура' },
      { from: 'Ключевые Возможности и Функционал', to: 'Ключевые возможности и функционал' },
      { from: 'Результаты и Бизнес-Эффект', to: 'Результаты и бизнес-эффект' },
      { from: 'плавных микроинтерфейсных анимаций', to: 'плавных анимаций микроинтеракций' },
    ],
    he: [
      { from: 'סטודיו לתקרה מתוחה «PRO Interior»', to: 'PRO Interior — סטודיו לתקרות מתיחה' },
      { from: 'פתרונות הנדסיים ואדריכלות', to: 'פתרון הנדסי וארכיטקטורה' },
      { from: 'תוצאות ביקורת ומדדי הנדסה', to: 'תוצאות הבדיקה ומדדים הנדסיים' },
    ],
  },
  5: {
    en: [
      { from: 'Branded A44 HTML report', to: 'Branded HTML report' },
      { from: 'printable/responsive A44 report', to: 'printable, responsive report' },
      { from: 'SMTP dollars escaped in Compose (PIT-031).', to: 'escaping $ signs in SMTP_PASS for Docker Compose.' },
    ],
    ru: [
      { from: 'Фирменный HTML-отчёт A44 (desktop', to: 'Фирменный HTML-отчёт (desktop' },
      { from: 'печатном/адаптивном отчёте A44,', to: 'печатном и адаптивном отчёте,' },
      { from: 'в SMTP_PASS для Compose (PIT-031).', to: 'в SMTP_PASS для Docker Compose.' },
    ],
    he: [
      { from: 'שמדרג אתר מסחרי בחמש סקאלות', to: 'שמדרג אתר מסחרי לפי חמישה מדדים' },
      { from: 'scorecard בחמש סקאלות', to: 'scorecard של חמישה מדדים' },
    ],
  },
  6: {
    en: [
      { from: 'catalog hand-off, and TZ briefs', to: 'catalog hand-off, and project briefs' },
      { from: 'capture TZ-{id} briefs', to: 'capture TZ-{id} project briefs' },
      { from: 'produces TZ briefs for the team', to: 'produces project briefs for the team' },
      { from: 'contested IT terms', to: 'ambiguous IT terms' },
    ],
  },
  7: {
    he: [
      { from: 'צינור פריימים', to: 'פייפליין פריימים' },
      { from: 'את הלועדר תקוע', to: 'את ה-preloader תקוע' },
    ],
  },
  8: {
    he: [
      { from: 'קרצוף בדסקטופ', to: 'הרכבה בגלילה בדסקטופ' },
      { from: 'בפריימים שנקרצפים בגלילה', to: 'בפריימים המסונכרנים לגלילה' },
      { from: 'ומטעין מעגלי', to: 'ו-preloader מעגלי' },
      { from: 'המשקלים והאנשי קשר', to: 'המשקלים ואנשי הקשר' },
    ],
  },
  9: {
    en: [
      { from: 'prices in roubles', to: 'prices in rubles' },
      { from: 'The 2015 PSD', to: 'The 2016 PSD' },
      {
        from: 'A public lab score is not claimed here: the PageSpeed Insights API returned HTTP 429 on 13 November 2026. Below are the engineering choices that target Core Web Vitals without inventing a number.',
        to: 'Below are the engineering choices that target Core Web Vitals.',
      },
    ],
    ru: [
      { from: 'Макет 2015 года', to: 'Макет 2016 года' },
      {
        from: 'Публичный лабораторный балл здесь не приводится: PageSpeed Insights API ответил HTTP 429 13 ноября 2026. Ниже — инженерные решения под Core Web Vitals без выдуманной цифры.',
        to: 'Ниже — инженерные решения под Core Web Vitals.',
      },
    ],
    he: [
      { from: 'המקאפ מ־2015', to: 'המקאפ מ־2016' },
      { from: 'גופנים מארחים עצמית', to: 'גופנים המאוחסנים מקומית' },
      { from: '1. ערימת גלילה ותנועה', to: '1. סטאק גלילה ותנועה' },
      {
        from: 'אין כאן ציון מעבדה ציבורי: PageSpeed Insights API החזיר HTTP 429 ב־13 בנובמבר 2026. להלן בחירות הנדסיות ל־Core Web Vitals בלי מספר מומצא.',
        to: 'להלן בחירות הנדסיות ל־Core Web Vitals.',
      },
    ],
  },
  10: {
    en: [
      { from: 'Engineering choices for Core Web Vitals without inventing a number.', to: 'Engineering choices for Core Web Vitals.' },
    ],
    ru: [
      { from: 'Инженерные решения под Core Web Vitals без выдуманной цифры. ', to: 'Инженерные решения под Core Web Vitals.' },
      {
        from: 'а телефоны и visitors с уменьшенной анимацией получают',
        to: 'а телефоны и посетители с включённой настройкой уменьшения анимации получают',
      },
    ],
    he: [
      { from: 'בחירות הנדסיות ל־Core Web Vitals בלי מספר מומצא.', to: 'בחירות הנדסיות ל־Core Web Vitals.' },
      { from: 'כרטיסי תאוצה, טווח וסלאם', to: 'כרטיסי תאוצה, טווח וקו אדום (redline)' },
      { from: 'דף נחיתה לרכב כהה', to: 'דף נחיתה כהה לרכב' },
      { from: 'הגלילה מרים', to: 'הגלילה מרימה' },
      { from: 'שלוש רוחבי פריימים', to: 'שלושה רוחבי פריימים' },
      { from: 'גופנים מארחים עצמית', to: 'גופנים המאוחסנים מקומית' },
    ],
  },
  11: {
    en: [{ from: 'centre-cropped', to: 'center-cropped' }],
    ru: [
      { from: 'centre-cropped', to: 'center-cropped' },
      { from: 'Стейкхаус  на', to: 'Стейкхаус на' },
    ],
    he: [
      { from: 'סטייקהאוס ייבוש יבש', to: 'סטייקהאוס בשר מיושן (Dry-Aged)' },
      { from: 'אש, ייבוש, נתחים', to: 'אש, יישון, נתחים' },
      { from: 'ימי ייבוש', to: 'ימי יישון' },
      { from: 'לא ממתיחים', to: 'לא מותחים' },
      { from: '+ דיוקן 540', to: '+ חבילה אנכית (portrait) 540' },
      { from: 'חבילת דיוקן במסכים גבוהים', to: 'חבילה אנכית במסכים גבוהים' },
      { from: 'ועוד חבילת דיוקן חתוכה במרכז', to: 'ועוד חבילה אנכית (portrait) חתוכה במרכז' },
      { from: 'landscape + דיוקן:', to: 'landscape + חבילה אנכית:' },
      { from: 'מציירים את חבילת הדיוקן', to: 'מציירים את החבילה האנכית' },
    ],
  },
  12: {
    en: [
      { from: 'Live stand at psb.erythro.ai', to: 'Live demo at psb.erythro.ai' },
      { from: 'Required a modern widescreen website', to: 'The brief called for a modern widescreen website' },
    ],
    he: [
      { from: 'ערימת UI', to: 'סטאק UI' },
      { from: 'מחסנית הטכנולוגיות', to: 'הסטאק הטכנולוגי' },
      { from: 'דוכן חי ב־psb.erythro.ai', to: 'אתר דמו חי ב־psb.erythro.ai' },
      { from: 'חברות מוכנות', to: 'חברות מדף' },
      { from: 'ביקורות', to: 'המלצות' },
    ],
  },
  13: {
    en: [
      { from: 'Required a specialty coffee ambiance', to: 'The project called for a specialty coffee ambiance' },
      { from: ' No fabricated lab scores.', to: '' },
    ],
    ru: [{ from: ' Лабораторные баллы не выдумываем.', to: '' }],
    he: [
      { from: 'ערימת UI', to: 'סטאק UI' },
      { from: 'דוכן חי ב־origin.erythro.ai — מהגרגר ועד הכוס', to: 'אתר דמו חי ב־origin.erythro.ai — מפרי הקפה ועד הכוס' },
      { from: 'מהגרגר ועד לכוס', to: 'מפרי הקפה ועד לכוס' },
      { from: 'גרגר, פול,', to: 'פרי הקפה, פול,' },
      { from: '+ דיוקן 540', to: '+ חבילה אנכית (portrait) 540' },
      { from: 'חבילת דיוקן במסכים גבוהים', to: 'חבילה אנכית במסכים גבוהים' },
      { from: 'ביקורות', to: 'המלצות' },
      { from: ' לא ממציאים ציוני מעבדה.', to: '' },
    ],
  },
}

/** HE text per RU text node, in RU document order. Keys: summary | subtitle | b{i}p{j}. */
const HE_REBUILD: Record<number, Record<string, string[]>> = {
  5: {
    summary: [
      'פייפליין חי של ביקורת AI ב-erythro.ai: בקשה עם URL ב-/audit, worker ב-Docker על ה-VPS מריץ Playwright ו-PageSpeed, Gemini כותב פסק דין מסחרי, והלקוח פותח דוח HTML באמצעות טוקן. החבילות Free, Diagnostic ו-Pro חולקות פרוטוקול אחד; העומק והתכנים שנפתחים תלויים בחבילה.',
    ],
    subtitle: ['חי ב-/audit — מהטופס ועד דוח HTML עם טוקן'],
    b0p0: [
      'סוכנויות ובעלי אתרים צריכים QA מסחרי רחב יותר מצילום מסך בודד של Lighthouse: טפסי לידים, כותרות אבטחה, SEO ושפות, ונראות ב-AI — עם ציון שאפשר לפעול לפיו. ביקורות ידניות לא התאימו לקנה מידה; מעבדת הדפדפן צריכה לעבוד בלי מפעיל, לשמור HTML גדול בבטחה ולמסור דוח ממותג ב-EN, RU או HE בלי לחשוף את אחסון האובייקטים הפרטי.',
    ],
    b0p1: [
      'ארכיטקטורה: פייפליין async מקצה לקצה — טופס → Payload contact-submission → agent-api → R2 → מייל → /audit/report/[id]?k=…',
      'UI/UX: דוח HTML ממותג (דסקטופ + מובייל) עם scorecard, דירוג A+–F, שלושת הסיכונים המרכזיים ותכנים שנפתחים לפי החבילה',
      'המרה: תצוגה מקדימה חינמית שמוכיחה ערך, ואחריה Diagnostic / Pro / Manual עם אותו חוזה worker לאחר תשלום דרך Grow',
      'אבטחה: הפעלה אוטומטית אחרי קבלת הבקשה, Vercel Cron למשימות תקועות, בדיקת האתר ב-DNS בלבד (בלי HTTP-fetch לכתובת של הלקוח — הגנה מפני SSRF)',
    ],
    b1p0: [
      'סטאק UI: Next.js App Router — דף הנחיתה /audit, הדפים /order/audit-* ו-API לדוח HTML עצמאי',
      'קומפוננטות: ה-Global בשם Audit Page והאוסף Plans (kind: audit). הטופס מאמת את האתר, השפה ופרטי הקשר; ב-blur מתבצעת בדיקת DNS A/AAAA לכתובת IP ציבורית דרך POST /api/audit/check-website. דף הדוח בודק מוכנות במחזוריות ומגיש HTML בכתובת /api/audit/report/[id]/html?k=… (הטוקן חובה; קישורי R2 פרטיים לא נשלחים ללקוח במייל).',
      'אנימציות: ממשק המוצר בנוי במערכת העיצוב של האתר; הדגש הוא על דוח רספונסיבי שמתאים גם להדפסה, ולא על אנימציה שיווקית',
      'רב-לשוניות ו-RTL: הממשק ושפת הדוח ב-EN / RU / HE; החבילות Diagnostic ו-Pro סורקות כמה שפות במסגרת החבילה',
    ],
    b2p0: [
      'תשתית: הרשומות contact-submissions (source=audit) שומרות את auditStatus, auditScore, auditSummary, reportAccessToken ומפתחות האחסון. ה-worker הוא Java QA_Auditor מאחורי agent-api.erythro.ai (Playwright Chromium). טריגר: POST /api/run-audit מאומת. סטטוסים: new → in_progress → report_sent (או failed אחרי ניסיונות חוזרים).',
      'נתונים / CMS: ה-Global בשם Audit Page לטקסטים של דף הנחיתה; Plans — כרטיסי Free / Diagnostic / Pro / Manual ודפי ההזמנה; הרצה מחדש (re-queue) מהאדמין',
      'אינטגרציות: Google PageSpeed Insights, LanguageTool (בדיקת איות EN/RU), Gemini ל-Funnel review (Pro), Cloudflare R2 ל-HTML/PDF, SMTP של Hostinger מ-order@erythro.ai, Grow לחבילות בתשלום',
    ],
    b3p0: [
      'בקרת איכות / CI: Docker Compose על VPS של Hostinger (proxy_network + Caddy, בלי לחשוף את הפורט של ה-worker ב-host); Vercel Cron בנתיב /api/audit/reconcile כל 2 דקות; n8n אופציונלי',
      'אבטחה ו-AI-ops: Turnstile ומגבלות על הטפסים; AGENT_SECRET_TOKEN ל-worker; טוקן גישה לדוח ה-HTML; בדיקת DNS בלבד חוסמת localhost וכתובות IP פרטיות; מפתח Gemini נפרד למבקר ולצ\'אט של היועץ הציבורי; escaping של הסימן $ ב-SMTP_PASS עבור Docker Compose.',
    ],
    b4p0: [
      'מהירות: ב-scorecard המשקל הגבוה ביותר מבין חמשת המדדים (ציון כולל 0–100) הוא ל-Speed & Mobile UX (PageSpeed למובייל ולדסקטופ, TTFB, גלישה אופקית ב-iPhone SE)',
      'עמידות בתקלות: כתיבה ל-R2 וסטטוס report_sent לפני שליחת המייל; Cron ו-after() כשהטריגר פוספס; HTML גדול נשאר ב-R2 אם ה-PATCH ל-Payload נכשל בגלל הגודל',
      'השפעה עסקית: תצוגה מקדימה ב-Free (scorecard, שלושת הסיכונים המרכזיים, Lighthouse) עם מגבלה של דומיין אחד ל-7 ימים; Diagnostic — כרטיסי סיכום ועד 5 כתובות URL במשפך; Pro — עד 10 כתובות URL, צ\'קליסט של 60+ בדיקות, תוכנית תיקונים ו-AI Funnel review',
      'SEO: הפרוטוקול מכסה אינדוקס, SEO לפי שפה, נראות ב-AI (llms.txt, MCP, Organization schema, כללים לבוטים של AI ב-robots) ו-Agent Readiness L1 מחוץ לציון המשוקלל',
    ],
  },
  6: {
    summary: [
      'היועץ הציבורי מבוסס ה-AI ב-erythro.ai מזרים תשובות מ-Gemini 3.6 Flash דרך POST /api/consult. הידע והמחירים מגיעים מ-Payload (markdown משמש רק כגיבוי), בלי מספרים מומצאים. ה-FAQ האנונימי לא דורש פרטי קשר; הקישור לקטלוג נשאר בצ\'אט; בריף אפיון מותאם וטיקטים טכניים — אחרי OTP, ולבריף נדרש גם מספר טלפון.',
    ],
    subtitle: ['וידג\'ט חי — FAQ, העברה לקטלוג ובריפי אפיון'],
    b0p0: [
      'מבקרים שאלו מסביב לשעון על חבילות, מחירים ותהליך העבודה, אבל בוט "אוניברסלי" עם מחירים מומצאים או צ\'אט הזמנה נוסף היה פוגע באמון. היועץ צריך להיצמד לעובדות שפורסמו, לענות ב-EN / RU / HE לפי ההודעה האחרונה, לאסוף בריפי אפיון מובנים ולא להחליף את /order, /audit והתשלום.',
    ],
    b0p1: [
      'ארכיטקטורה: נתיב Gemini בצד השרת בלבד עם tools (KB, translate, hand_off, OTP, draft/submit brief, escalate_tech); מפתח ה-API לא מגיע לדפדפן',
      'UI/UX: פאנל במסך מלא שנפתח מכפתור בכותרת (באותה שפת CTA כמו AI Audit), ו-WhatsApp / יצירת קשר / Telegram בתחתית הפאנל — לא כפתור הזמנה צף נפרד',
      'המרה: לסנן ולהדריך לידים באופן אנונימי, קישורי עומק לחבילות מוכנות, בריפי אפיון TZ-{id} נשלחים ל-order@ ול-Monday.com בלי תשלום בצ\'אט',
      'אבטחה: Turnstile + מגבלת IP + מכסת הודעות אנונימית; עוגיית OTP אחרי אימות; Translater למונחי IT דו-משמעיים ולבריפים ב-EN/HE',
    ],
    b1p0: [
      'סטאק UI: שכבת צ\'אט ב-React + ChatButton; הטקסטים מגיעים מ-GET /api/consult/copy (no-store), כדי שהדגל Consultant enabled יסתיר את כפתור הפתיחה מיד',
      'קומפוננטות: מצבים: FAQ אנונימי (יומן שאלות בלי שם ומייל), hand_off לקטלוג (קישור בתשובה, הצ\'אט לא נסגר), בריף אפיון מותאם (OTP + טלפון → project-briefs), ייעוץ טכני (OTP → tech-consult-tickets, תשובה במייל בלבד). צ\'יפים עם הצעות; "How we work" ו-Extra knowledge תמיד נמצאים ב-KB של המערכת. הצ\'אט לא מבצע הזמנה ולא מקבל פרטי כרטיס אשראי.',
      'אנימציות: הפאנל עולה מלמטה למסך מלא; גלילת הדף ננעלת; כפתור הפתיחה בשפת BorderBeam CTA כמו ב-AI Audit',
      'רב-לשוניות ו-RTL: שפת התשובה נקבעת לפי ההודעה האחרונה של המבקר; ה-KB והכללים נטענים באותה שפה; מעטפת הווידג\'ט ב-EN / RU / HE',
    ],
    b2p0: [
      'תשתית: streamText דרך @ai-sdk/google; ה-thinking_level נקבע לפי שלב (anon minimal → OTP low → brief medium). ה-tools נשלחים בבקשה; מטמון הקידומת של Gemini 3.x לא מופעל כשיש tools. אוספים: consult-question-log, consult-sessions, project-briefs, tech-consult-tickets. שמירה עד 12 חודשים — מצוין בצ\'אט וב-/privacy.',
      'נתונים / CMS: ה-Global בשם Consultant Settings — enabled, guardrails, Extra knowledge, טקסטי OTP, צ\'קליסט לבריף; המחירים מ-Solutions / Services / Audit Plans',
      'אינטגרציות: Gemini API (מפתח נפרד מזה של המבקר), Turnstile action=consult, Translater ב-HTTPS+HMAC על ה-VPS, SMTP ל-order@ ולתיבת הדואר הטכנית, Monday.com לבריפים',
    ],
    b3p0: [
      'בקרת איכות / CI: הנתיבים רצים על Vercel; Translater ב-Docker על Hostinger (proxy_network + Caddy). עותק markdown של ה-KB בריפו משמש רק כשה-CMS לא זמין.',
      'אבטחה ו-AI-ops: בלי מפתחות Gemini ב-NEXT_PUBLIC; ה-grounding של Google Search כבוי; מחירים רק מה-KB; Turnstile מחוץ לקונטיינרים עם transform; ה-OTP נשמר כ-hash+pepper והקוד לא מופיע בתמליל; קבצים מצורפים וכתובות URL בבריפים ובמיילים אסורים.',
    ],
    b4p0: [
      'מהירות: סטרימינג של Gemini Flash ל-FAQ מהיר; thinking_level מינימלי עד לאימות, לפני בריף כבד יותר',
      'עמידות בתקלות: אין מפתח לצ\'אט → 503 ומעבר לטופס; ה-CMS לא זמין → עותק ה-markdown; Translater לא זמין → המונחים נשארים כמו שהם, והבריף מקבל סטטוס skipped',
      'השפעה עסקית: כפתורי ה-CTA של החבילות והביקורת מובילים לדפים קיימים; בקשה מותאמת מעבירה לצוות בריף אפיון; שאלות טכניות הופכות לטיקטים במייל בלי לחסום את ה-FAQ',
      'SEO: זה לא דף נחיתה שיווקי — המוצר מחזק את העזרה בהמרה ועונה באותן עובדות שפורסמו ושמנועי החיפוש רואים',
    ],
  },
  2: {
    summary: ['דף נחיתה לסטודיו לתקרות מתיחה'],
    subtitle: ['אפליקציית ווב בעלת ביצועים גבוהים לשוק B2C/B2B'],
    b0p0: [
      'שירות דיגיטלי ודף נחיתה בעלי ביצועים גבוהים, עם מחשבון עלויות אינטראקטיבי, אנימציות GSAP חלקות וקטלוג שירותים דינמי.',
    ],
    b0p1: [
      'לקוח:',
      ' PRO Interior — סטודיו לתקרות מתיחה',
      'תחום:',
      ' בנייה, עיצוב פנים ושיפוצים',
      'שירות:',
      ' הנדסת ווב, עיצוב UI/UX (Figma), אב טיפוס, מושן דיזיין ב-GSAP, אוטומציית CI/CD (GitHub Actions), מיגרציה של הארכיטקטורה, אופטימיזציית SEO',
      'פיתוח:',
      ' צוות ההנדסה של Erythro.ai',
      'סטאק טכנולוגי:',
      ' Next.js (App Router), React, TypeScript, GSAP (ScrollTrigger), Vanilla CSS, Figma, GitHub Actions (CI/CD Quality Gate), Vercel Serverless',
    ],
    b1p0: [
      'הגרסה הסטטית הקודמת של אתר הסטודיו לא אפשרה להרחיב את קטלוג השירותים ביעילות והגבילה את ההמרות. הלקוח היה צריך אפליקציית ווב מודרנית לשוק B2C/B2B, שמשלבת את האסתטיקה של עיצוב פנים עם מהירות טעינה גבוהה וטריגרים מסחריים ברורים.',
    ],
    b1p1: [
      'יעדי הפיתוח המרכזיים:',
      'עיצוב אינטראקטיבי ואב טיפוס ב-Figma:',
      ' פיתוח מערכת עיצוב UI/UX מלאה ואב טיפוס אינטראקטיבי ברזולוציה גבוהה (High-Fidelity Prototype), כולל תרחישי משתמש (CJM), גרידים רספונסיביים ומצבי קומפוננטות.',
      'מיגרציה של הארכיטקטורה:',
      ' העברת בסיס הקוד הסטטי המיושן ל-',
      'Next.js (App Router)',
      ' המודרני, לאינדוקס SEO חלק ולתגובה מיידית של הממשק.',
      'אוטומציה של פריסה ובקרת איכות (GitHub CI/CD):',
      ' הטמעת workflows של CI/CD מקצה לקצה ב-GitHub Actions: בדיקת טיפוסים אוטומטית ב-TypeScript, בדיקת קוד ב-ESLint ובניית בדיקה לפני כל ריליס.',
      'מושן דיזיין הנדסי (GSAP):',
      ' הטמעת אנימציות מיקרו-אינטראקציה חלקות ואפקטי גלילה ב-GSAP, בלי לפגוע בביצועים ובציוני PageSpeed.',
      'יצירה דינמית של דפי שירות:',
      ' מערכת ניתוב אוניברסלית לדפי נחיתה של סוגי תקרות ספציפיים (PVC, בד, תקרות רב-מפלסיות, מערכות LED).',
      'כלי המרה אינטראקטיביים:',
      ' מחשבון מובנה לחישוב עלות הפרויקט וחלונות מודאליים דו-שלביים להשארת פרטים.',
      'חוויית Mobile-First מושלמת:',
      ' תצוגה תקינה של הקטלוג, הטבלאות וגלריית העבודות בכל מסך, בלי גלילה אופקית ובלי תזוזות פריסה (CLS).',
    ],
    b2p0: [
      '1. עיצוב UX/UI ואב טיפוס (Figma)',
      'לפני כתיבת הקוד, צוות Erythro.ai בנה ב-Figma מערכת ויזואלית מקיפה:',
      'Design System & Foundations:',
      ' טוקנים של טיפוגרפיה, גיאומטריה ופלטת צבעים, שיוצרים איזון ויזואלי בין עיצוב פנים פרימיום לבין מסחר B2C.',
      'אב טיפוס אינטראקטיבי:',
      ' תכנון התגובות של הכפתורים, החלונות המודאליים (',
      'CalculatorModal',
      ', ',
      'RequestModal',
      ') והמעברים באב הטיפוס ב-Figma, כך שאפשר היה לבדוק השערות המרה עוד לפני שלב הקידוד.',
      'פריסות רספונסיביות:',
      ' תכנון גרידים נפרדים לדסקטופ (1920px), לטאבלט ולמובייל עם Auto Layout 5.0.',
      '2. פייפליין CI/CD ו-DevOps (GitHub Actions + Vercel)',
      'כדי למנוע תקלות בפרודקשן ולהפוך את אספקת העדכונים לאוטומטית, הוגדר בריפו תהליך של אינטגרציה ומסירה רציפות (CI/CD):',
      'Quality Gate (CI):',
      ' הרצה אוטומטית של ה-workflow ',
      '.github/workflows/ci-quality-gate.yml',
      ' בכל Pull Request. הוא בודק את תחביר ESLint, מריץ בדיקת טיפוסים קפדנית ',
      'tsc --noEmit',
      ' ומבצע קומפילציית בדיקה של Next.js.',
      'Continuous Deployment (CD):',
      ' במיזוג קוד לענף ',
      'main',
      ', ה-workflow ',
      '.github/workflows/deploy-vercel.yml',
      ' בונה אוטומטית את חבילת הפרודקשן ופורס אותה ל-Vercel Serverless, כולל אימות SSL וניקוי מטמון ה-CDN.',
      '3. סטאק הארכיטקטורה וביצועים',
      'כדי להגיע למדדי Core Web Vitals קרובים למושלמים (',
      'PageSpeed 95+',
      '), הפרויקט נבנה בגישה היברידית:',
      'Next.js App Router & React:',
      ' רינדור בצד השרת (SSR) ויצירת דפים סטטיים (SSG) לטעינה מיידית של הקטלוג.',
      'אנימציה עם GSAP & ScrollTrigger:',
      ' ספריית GSAP משמשת לאנימציות גלילה מרשימות של בלוקי טקסט, להופעה חלקה של כרטיסי השירותים ולמעברי מצב אינטראקטיביים בגלריית הפרויקטים.',
      'אופטימיזציית Bundle (Vanilla CSS):',
      ' כ-46.4% מבסיס הקוד הם CSS נקי ומובנה בקפדנות. הוויתור על פריימוורקים כבדים של UI צמצם את כמות ה-JavaScript בצד הלקוח והאיץ את ה-hydration.',
      'טיפוסיות חזקה (TypeScript):',
      ' נתוני הקטלוג ומצבי החלונות האינטראקטיביים מוגדרי טיפוסים במלואם (',
      'src/data/ceilings.ts',
      '), וכך נמנעות שגיאות runtime בעבודה עם פרמטרי השירותים.',
    ],
    b3p0: [
      'הגנה אוטומטית על ריליסים (CI/CD):',
      ' אף commit לא מגיע לפרודקשן בלי לעבור את כל בדיקות הטיפוסים והבנייה האוטומטיות ב-GitHub Actions.',
      'אנימציות GSAP אינטראקטיביות:',
      ' עיטורי גלילה דינמיים, הופעה מדורגת וחלקה של הכרטיסים בקטלוג ומעברים אינטראקטיביים שיוצרים תחושה של מוצר דיגיטלי פרימיום.',
      'קטלוג שירותים דינמי (',
      '/ceilings/[slug]',
      '):',
      ' מחולל הדפים יוצר אוטומטית דפי נחיתה לכל חומר וטכנולוגיה (יריעות PVC מט ומבריקות, תקרות בד ללא תפרים Descor/Clipso, קווי תאורה ועוד) עם תגיות מטא משלהם ל-SEO.',
      'מחשבון עלויות (',
      'CalculatorModal',
      '):',
      ' כלי נוח שלב אחר שלב, שמאפשר ללקוח לחשב תקציב משוער לפרויקט עוד לפני השיחה עם נציג.',
      'טופס השארת פנייה (',
      'RequestModal',
      '):',
      ' טופס ממוטב להזמנת מומחה למדידה, עם אימות שדות.',
      'גריד רספונסיבי של 4 עמודות:',
      ' הקטלוג וגלריית העבודות מתאימים את עצמם למובייל בלי לאבד מידע ובלי לשבור את הגריד.',
      'בסיס דו-לשוני (i18n):',
      ' הארכיטקטורה כוללת מבנה רב-לשוני לתוכן ברוסית ובאנגלית.',
    ],
    b4p0: [
      'בדיקה מקיפה של ביצועים, נגישות ועמידה בסטנדרטים של Google הראתה תוצאות טכניות יוצאות דופן.',
      'מדד',
      'ערך',
      'הערכה',
      'סטנדרט Google',
      'LCP (Largest Contentful Paint)',
      'כ-290–300 מילישניות',
      '🟢 מצוין',
      '< 2.5 שניות',
      'TTFB (Time to First Byte)',
      'כ-70 מילישניות',
      '🟢 מצוין',
      '< 800 מילישניות',
      'CLS (Cumulative Layout Shift)',
      '0.00',
      '🟢 מושלם',
      '< 0.1',
      'FCP (First Contentful Paint)',
      'כ-200 מילישניות',
      '🟢 מצוין',
      '< 1.8 שניות',
      'Render-Blocking Delay',
      '0 מילישניות',
      '🟢 מצוין',
      'עיכוב מינימלי',
    ],
    b4p1: [
      'ציוני Lighthouse (מובייל)',
      '🟢 ',
      'Best Practices:',
      ' 100 / 100',
      '🟢 ',
      'SEO:',
      ' 100 / 100',
      '🟢 ',
      'Accessibility (נגישות):',
      ' 90 / 100',
    ],
    b4p2: [
      'מאפיינים הנדסיים של המימוש',
      'אחסון ו-CDN (Vercel Edge):',
      ' זמן התגובה של השרת (TTFB כ-70 מילישניות) מהיר מאוד בזכות רשת הפצת התוכן הגלובלית של Vercel Serverless.',
      'אפס תזוזת פריסה (CLS = 0.00):',
      ' הדף נטען בלי קפיצות פתאומיות של תוכן בזמן הרינדור.',
      'אופטימיזציית גופנים:',
      ' הגופנים (Oswald, PT Serif) נטענים בפורמט הדחוס והמודרני ',
      '.woff2',
      ' עם ההנחיה ',
      'rel="preload"',
      ', וכך הטקסט מופיע בלי עיכוב.',
      'סקריפטים אסינכרוניים:',
      ' כל חבילות ה-JS של Next.js מפוצלות ל-chunks ונטענות עם המאפיין ',
      'async',
      ', בלי לחסום את הרינדור הראשוני של ה-HTML.',
    ],
    b5p0: [
      'תגובה מיידית:',
      ' השילוב של Next.js App Router, אופטימיזציה של GSAP ו-CSS נקי מאפשר טעינה של האתר בשבריר שנייה ומדדי Core Web Vitals מקסימליים.',
      '100% יציבות בריליסים:',
      ' האינטגרציה עם GitHub CI/CD מבטלת את הסיכון לשגיאות תחביר, באגים בפריסה או אי-התאמות TypeScript בפרודקשן.',
      'מעורבות גבוהה (User Engagement):',
      ' אב טיפוס מתוכנן היטב ב-Figma ואפקטים חלקים של GSAP שומרים על תשומת הלב של המשתמשים ומורידים את שיעור הנטישה (Bounce Rate).',
      'עלייה בהמרות:',
      ' מחשבון עלויות ברור וחלונות מודאליים ממוטבים להשארת פרטים קיצרו את הדרך של הלקוח לשליחת פנייה.',
      'בסיס ל-SEO:',
      ' דפי הנחיתה הדינמיים ',
      '/ceilings/[slug]',
      ' מוכנים לקידום אורגני יעיל בביטויי חיפוש בתדירות נמוכה ובינונית.',
      'עמידות בתקלות:',
      ' פריסת CI/CD אוטומטית ל-Vercel מבטיחה 99.9% זמינות והגנה מפני עומסי שיא.',
    ],
  },
}

// ---------------------------------------------------------------------------

const esc = (x: string) => JSON.stringify(x).slice(1, -1)

function textNodes(n: any, out: any[] = []): any[] {
  if (!n || typeof n !== 'object') return out
  if (n.type === 'text' && typeof n.text === 'string') out.push(n)
  for (const c of n.children ?? []) textNodes(c, out)
  return out
}

/** Clone RU Lexical value and swap text node strings for HE ones. */
function rebuild(ruValue: any, he: string[], where: string): any {
  const clone = structuredClone(ruValue)
  const nodes = textNodes(clone?.root)
  if (nodes.length !== he.length) throw new Error(`${where}: RU has ${nodes.length} text nodes, HE has ${he.length}`)
  nodes.forEach((n, i) => {
    n.text = he[i]
  })
  return clone
}

function applyHeRebuild(id: number, doc: Doc, ru: Doc) {
  const plan = HE_REBUILD[id]
  if (!plan) return
  for (const [key, he] of Object.entries(plan)) {
    if (key === 'summary' || key === 'subtitle') {
      doc[key] = rebuild(ru[key], he, `#${id} ${key}`)
      continue
    }
    const m = /^b(\d+)p(\d+)$/.exec(key)
    if (!m) throw new Error(`bad key ${key}`)
    const [bi, pi] = [Number(m[1]), Number(m[2])]
    const ruPara = ru.body?.[bi]?.paragraphs?.[pi]
    const hePara = doc.body?.[bi]?.paragraphs?.[pi]
    if (!ruPara || !hePara || ruPara.id !== hePara.id) throw new Error(`#${id} ${key}: paragraph row mismatch`)
    hePara.text = rebuild(ruPara.text, he, `#${id} ${key}`)
  }
}

const FIELDS = [
  'title',
  'description',
  'summary',
  'subtitle',
  'categoryLabel',
  'relatedAuditHref',
  'relatedAuditLabel',
  'highlights',
  'body',
  'seo',
  'client',
  'stack',
  'performanceScores',
] as const

function structural(id: number, loc: Loc, doc: Doc) {
  // HE audit CTA: one term + trailing slash, label never empty
  if (loc === 'he') {
    if (typeof doc.relatedAuditHref === 'string' && /^https:\/\/ai-audit-he\.erythro\.ai$/.test(doc.relatedAuditHref)) {
      doc.relatedAuditHref = 'https://ai-audit-he.erythro.ai/'
    }
    if (id === 13) {
      doc.relatedAuditHref = 'https://ai-audit-he.erythro.ai/'
      doc.relatedAuditLabel = HE_AUDIT_LABEL
    }
  }
  if ((id === 11 || id === 12) && loc === 'ru') {
    for (const h of doc.highlights ?? []) if (h?.label === 'CI') h.label = 'Поставка'
  }
  if (id === 11 && doc.performanceScores?.agentBrowse === '2') doc.performanceScores.agentBrowse = '2/2'
  if (id === 2) {
    doc.categoryLabel = '' // use category label (Websites / Сайты / אתרים)
    doc.client = 'PRO Interior'
    if (Array.isArray(doc.stack) && doc.stack.length === 1 && String(doc.stack[0]?.item).includes(',')) {
      doc.stack = String(doc.stack[0].item)
        .split(',')
        .map((s: string) => ({ item: s.trim() }))
        .filter((r: { item: string }) => r.item)
    }
    const seo = {
      en: {
        title: 'PRO Interior — Stretch Ceiling Studio Landing Page on Next.js | Erythro.ai',
        description:
          'Erythro.ai case study: PRO Interior stretch ceiling studio landing page built with Next.js and GSAP, featuring a cost calculator, dynamic catalog, and CI/CD.',
      },
      ru: {
        title: 'PRO Interior — лендинг студии натяжных потолков на Next.js | Erythro.ai',
        description:
          'Кейс Erythro.ai: лендинг студии натяжных потолков PRO Interior на Next.js и GSAP с калькулятором стоимости, динамическим каталогом и CI/CD.',
      },
      he: {
        title: 'PRO Interior — דף נחיתה לסטודיו לתקרות מתיחה ב-Next.js | Erythro.ai',
        description:
          'קייס של Erythro.ai: דף נחיתה לסטודיו לתקרות מתיחה PRO Interior ב-Next.js ו-GSAP, כולל מחשבון עלויות, קטלוג דינמי ו-CI/CD.',
      },
    }[loc]
    if (!doc.seo?.title && !doc.seo?.description) doc.seo = seo
  }
}

async function readLoc(payload: Payload, id: number, loc: Loc): Promise<Doc> {
  return (await payload.findByID({
    collection: 'portfolio-projects',
    id,
    locale: loc,
    fallbackLocale: false,
    depth: 0,
    overrideAccess: true,
  })) as Doc
}

async function fixPortfolio(payload: Payload, problems: string[]) {
  const res = await payload.find({ collection: 'portfolio-projects', depth: 0, limit: 100, overrideAccess: true })
  const ids = res.docs.map((d) => Number(d.id)).sort((a, b) => a - b)
  for (const id of ids) {
    const ru = await readLoc(payload, id, 'ru')
    for (const loc of LOCALES) {
      const before = await readLoc(payload, id, loc)
      const pairs = [...(PER[id]?.[loc] ?? []), ...GLOBAL[loc]]
      let json = JSON.stringify(before)
      const hits: string[] = []
      for (const p of pairs) {
        const f = esc(p.from)
        if (!json.includes(f)) {
          if (PER[id]?.[loc]?.includes(p)) problems.push(`#${id} [${loc}] no match: "${p.from}"`)
          continue
        }
        hits.push(`${p.from.slice(0, 28)}×${json.split(f).length - 1}`)
        json = json.split(f).join(esc(p.to))
      }
      const doc = JSON.parse(json) as Doc
      if (loc === 'he') applyHeRebuild(id, doc, ru)
      structural(id, loc, doc)

      const data: Doc = {}
      for (const f of FIELDS) {
        if (JSON.stringify(doc[f] ?? null) !== JSON.stringify(before[f] ?? null)) data[f] = doc[f]
      }
      if (!Object.keys(data).length) continue
      console.log(`#${id} ${before.slug} [${loc}] ${Object.keys(data).join(',')}${hits.length ? ' :: ' + hits.join(' | ') : ''}`)
      if (DRY) continue
      await payload.update({ collection: 'portfolio-projects', id, locale: loc, overrideAccess: true, data })
    }
  }
}

async function fixLabels(payload: Payload) {
  const cat: Record<Loc, string> = { en: 'Websites', ru: 'Сайты', he: 'אתרים' }
  for (const loc of LOCALES) {
    const c = (await payload.findByID({ collection: 'portfolio-categories', id: 3, locale: loc, fallbackLocale: false, depth: 0, overrideAccess: true })) as Doc
    if (c.label !== cat[loc]) {
      console.log(`category #3 [${loc}] label "${c.label}" → "${cat[loc]}"`)
      if (!DRY) await payload.update({ collection: 'portfolio-categories', id: 3, locale: loc, overrideAccess: true, data: { label: cat[loc] } })
    }
  }
  const services = await payload.find({ collection: 'services', depth: 0, limit: 50, overrideAccess: true })
  for (const s of services.docs) {
    for (const loc of LOCALES) {
      const d = (await payload.findByID({ collection: 'services', id: s.id, locale: loc, fallbackLocale: false, depth: 0, overrideAccess: true })) as Doc
      if (typeof d.title !== 'string') continue
      let next = d.title.trim()
      if (loc === 'en' && next === 'Ai & Automation') next = 'AI & Automation'
      if (next === d.title) continue
      console.log(`service #${s.id} [${loc}] title "${d.title}" → "${next}"`)
      if (!DRY) await payload.update({ collection: 'services', id: s.id, locale: loc, overrideAccess: true, data: { title: next } })
    }
  }
}

async function main() {
  const payload = await getPayload({ config })
  console.log(DRY ? 'DRY RUN' : 'APPLY', '— portfolio audit 2026-11-28')
  const problems: string[] = []
  await fixLabels(payload)
  await fixPortfolio(payload, problems)
  if (problems.length) {
    console.log('\nPROBLEMS:')
    for (const p of problems) console.log('  ' + p)
  }
  console.log('\ndone')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
