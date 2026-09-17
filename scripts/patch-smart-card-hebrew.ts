import 'dotenv/config'

process.env.PAYLOAD_DISABLE_PUSH = '1'

import { getPayload } from 'payload'
import config from '../src/payload.config'

function t(text: string, format = 0) {
  return {
    type: 'text',
    text,
    format,
    mode: 'normal',
    style: '',
    detail: 0,
    version: 1,
  }
}

function p(children: any[]) {
  return {
    type: 'paragraph',
    format: 'start',
    indent: 0,
    version: 1,
    children,
    direction: null,
    textStyle: '',
    textFormat: children.some((c) => c.format === 1) ? 1 : 0,
  }
}

function li(value: number, children: any[]) {
  return {
    type: 'listitem',
    value,
    format: 'start',
    indent: 0,
    version: 1,
    children,
    direction: null,
  }
}

function ul(items: any[]) {
  return {
    tag: 'ul',
    type: 'list',
    start: 1,
    format: '',
    indent: 0,
    version: 1,
    children: items,
    listType: 'bullet',
    direction: null,
  }
}

const hebrewIncludesTree = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    children: [
      // 1. Architecture & layout
      p([t('1. אפיון ופיתוח ב-Next.js (5–6 סקציות):', 1)]),
      ul([
        li(1, [
          t('מסך פתיחה (Hero):', 1),
          t(' כותרת ראשית, כותרת משנה, כפתור הנעה לפעולה (CTA) עם המרה גבוהה וגרפיקה אופטימלית מהדור החדש (WebP/AVIF באמצעות '),
          t('next/image', 16),
          t(').'),
        ]),
        li(2, [
          t('אודות / יתרונות:', 1),
          t(' בלוק עם אייקונים וקטוריים, עובדות מפתח ויתרונות החברה בליווי מיקרו-אנימציות עדינות ב-Tailwind CSS.'),
        ]),
        li(3, [
          t('שירותים ומחירים:', 1),
          t(' כרטיסי שירותים מעוצבים עם תמחור שקוף ותיאור ברור.'),
        ]),
        li(4, [
          t('טופס יצירת קשר מאובטח:', 1),
          t(' נתיב Serverless API Route קליל ב-Next.js להעברה מיידית של פניות לטלגרם ולאימייל (כולל הגנת Honeypot מובנית מפני בוטים וספאם, ללא תוספים חיצוניים כבדים).'),
        ]),
        li(5, [
          t('פרטי קשר ופוטר:', 1),
          t(' מפה אינטראקטיבית, חיוג מהיר ('),
          t('tel:', 16),
          t('), קישורים ישירים ל-WhatsApp/Telegram, רשתות חברתיות ומסמכים משפטיים.'),
        ]),
      ]),

      // 2. Content management
      p([t('2. ניהול תוכן:', 1)]),
      ul([
        li(1, [
          t('Git-based CMS:', 1),
          t(' ממשק ניהול נוח ישירות בדפדפן. כל התוכן נשמר כקובצי JSON/Markdown ישירות במאגר ה-GitHub — ללא צורך במסד נתונים, ללא סיכוני פריצות SQL וללא עלויות אחסון נוספות.'),
        ]),
      ]),

      // 3. Basic AI consultant
      p([t('3. יועץ AI בסיסי (AI Web Widget):', 1)]),
      ul([
        li(1, [
          t('ווידג׳ט צ׳אט קליל:', 1),
          t(' רכיב אינטרנט עצמאי (כפתור צף וחלון שיחה מהיר) המוטמע ישירות בקוד ללא פגיעה בביצועי הדף (PageSpeed).'),
        ]),
        li(2, [
          t('System Prompt מותאם אישית:', 1),
          t(' הגדרת אישיות ה-AI בהתאם לקול המותג של החברה (שירות אדיב, מענה מדויק וסיוע בבחירת השירות המתאים).'),
        ]),
        li(3, [
          t('הדרכה על בסיס FAQ סטטי:', 1),
          t(' הזנת תשובות ל-10–15 שאלות נפוצות של לקוחות ישירות להקשר הפרומפט (ללא הקמת מסד נתונים וקטורי מורכב pgvector וללא RAG).'),
        ]),
        li(4, [
          t('אבטחה והגבלת טוקנים:', 1),
          t(' תיווך מאובטח של בקשות ה-LLM דרך Serverless (מפתחות API מוסתרים, הגבלת אורך הודעות ומניעת חריגה מצריכת טוקנים).'),
        ]),
      ]),

      // 4. Performance, SEO & RTL
      p([t('4. ביצועים, קידום (SEO) והתאמת RTL טבעית:', 1)]),
      ul([
        li(1, [
          t('מהירות יוצאת דופן:', 1),
          t(' ציון Google PageSpeed מושלם (95–100) הודות לרינדור סטטי של Next.js ומערך שרתי קצה Vercel Edge / Cloudflare (זמן תגובה TTFB < 50ms).'),
        ]),
        li(2, [
          t('עברית ו-RTL טבעיים:', 1),
          t(' פיתוח מלא ומדויק מימין לשמאל באמצעות מחלקות לוגיות של Tailwind CSS ('),
          t('ps-', 16),
          t(', '),
          t('pe-', 16),
          t(', '),
          t('start-', 16),
          t(', '),
          t('end-', 16),
          t(') ללא שבירת סימני פיסוק וללא קפיצות טקסט.'),
        ]),
        li(3, [
          t('SEO טכני:', 1),
          t(' יצירה דינמית של '),
          t('sitemap.xml', 16),
          t(' ו-'),
          t('robots.txt', 16),
          t(', מיקרו-דאטה Schema.org, תגיות מטא Open Graph / Twitter Card לתצוגה עשירה ברשתות.'),
        ]),
        li(4, [
          t('אנליטיקה:', 1),
          t(' חיבור ל-Google Analytics 4 / Google Tag Manager בהתאם לתקני פרטיות מחמירים.'),
        ]),
      ]),
    ],
    direction: null,
  },
}

const hebrewSubscriptionFull = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    children: [
      ul([
        li(1, [
          t('אחסון מהיר על גבי Vercel Edge CDN עם הגנת DDoS גלובלית ותעודת SSL אוטומטית.'),
        ]),
        li(2, [
          t('ניטור זמינות שרתים 24/7.'),
        ]),
        li(3, [
          t('כיסוי מלא של צריכת טוקנים (API) עבור בוט ה-FAQ.'),
        ]),
        li(4, [
          t('עד שעת עבודה חודשית של מהנדס פיתוח לעדכוני מחירים, מבצעים ותוכן.'),
        ]),
      ]),
    ],
    direction: null,
  },
}

async function run() {
  const payload = await getPayload({ config })

  console.log('Fetching RU doc for reference...')
  const ruDoc = await payload.findByID({
    collection: 'solution-plans',
    id: 2,
    locale: 'ru',
    depth: 0,
  })

  console.log('Updating HE locale for doc 2...')

  // Features
  const features = [
    { label: 'סטאק:', value: 'Next.js, TypeScript, Tailwind CSS' },
    { label: 'CMS:', value: 'Git-based (Decap/Tina) / Jamstack' },
    { label: 'AI:', value: 'ווידג׳ט AI (צ׳אטבוט FAQ ללא מסד נתונים וקטורי)' },
  ]

  // Addons
  const addons = [
    {
      addonId: 'subscription',
      name: 'מנוי חודשי',
      priceDisplay: '400',
      description: null,
      full: hebrewSubscriptionFull,
      recommended: true,
      mandatory: false,
      discountMonths1: 0,
      discountMonths6: 0,
      discountMonths12: 0,
    },
  ]

  await payload.update({
    collection: 'solution-plans',
    id: 2,
    locale: 'he',
    data: {
      title: 'כרטיס חכם AI',
      slug: 'ai-smart-card',
      price: '7 000',
      currency: 'ILS',
      subtitle: 'אתר בעל ביצועים גבוהים על Next.js עם יועץ AI בסיסי ואפס עלויות שרת.',
      promo: 'אחסון Vercel Edge CDN, תעודת SSL לכל החיים ושעת תמיכת מהנדס חודשית כלולים במנוי.',
      features,
      addons,
      includes: hebrewIncludesTree,
      seo: {
        title: 'כרטיס חכם AI | הזמנה | Erythro.ai',
        description: 'הזמינו פיתוח כרטיס חכם דיגיטלי על Next.js, TypeScript ו-Tailwind CSS ב-₪7,000. כולל ווידג׳ט AI מובנה לשאלות נפוצות, אחסון ותמיכה ב-₪400/חודש, SEO ותמיכת RTL מלאה.',
      },
    },
  })

  console.log('✓ Hebrew locale updated successfully in Payload CMS.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
