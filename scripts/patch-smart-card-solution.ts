import 'dotenv/config'

process.env.PAYLOAD_DISABLE_PUSH = '1'

import { getPayload } from 'payload'
import config from '../src/payload.config'
import { lexicalFromParagraphs } from '../src/lib/lexical'
import { pingSiteRevalidate } from './import-project/lib/ping-revalidate'

const LOCALES = ['en', 'ru', 'he'] as const
type Locale = (typeof LOCALES)[number]

const TITLES: Record<Locale, string> = {
  en: 'AI Smart Card',
  ru: 'AI-визитка',
  he: 'כרטיס חכם AI',
}

const SUBTITLES: Record<Locale, string> = {
  ru: 'Высокоскоростной сайт на Next.js с базовым AI-консультантом и нулевыми затратами на серверы.',
  en: 'High-speed Next.js website with a basic AI consultant and zero server costs.',
  he: 'אתר בעל ביצועים גבוהים על Next.js עם יועץ AI בסיסי ואפס עלויות שרת.',
}

const PROMOS: Record<Locale, string> = {
  ru: 'Хостинг Vercel Edge CDN, пожизненный SSL и 1 час ежемесячной поддержки инженера включены в подписку.',
  en: 'Vercel Edge CDN hosting, lifetime SSL, and 1 hour of monthly engineering support included in the subscription.',
  he: 'אחסון Vercel Edge CDN, תעודת SSL לכל החיים ושעת תמיכת מהנדס חודשית כלולים במנוי.',
}

const FEATURES: Record<Locale, Array<{ label: string; value: string }>> = {
  en: [
    { label: 'Stack:', value: 'Next.js, TypeScript, Tailwind CSS' },
    { label: 'CMS:', value: 'Git-based (Decap/Tina) / Jamstack' },
    { label: 'AI:', value: 'AI Web Widget (FAQ chatbot without a vector database)' },
    { label: 'Subscription:', value: '400₪/mo.' },
  ],
  ru: [
    { label: 'Стек:', value: 'Next.js, TypeScript, Tailwind CSS' },
    { label: 'CMS:', value: 'Git-based (Decap/Tina) / Jamstack' },
    { label: 'AI:', value: 'AI Web Widget (FAQ-чат-бот без векторной базы данных)' },
    { label: 'Подписка:', value: '400₪/мес' },
  ],
  he: [
    { label: 'סטאק:', value: 'Next.js, TypeScript, Tailwind CSS' },
    { label: 'CMS:', value: 'Git-based (Decap/Tina) / Jamstack' },
    { label: 'AI:', value: 'ווידג׳ט AI (צ׳אטבוט FAQ ללא מסד נתונים וקטורי)' },
    { label: 'מנוי:', value: '400 ₪ לחודש' },
  ],
}

const SUB_NAME: Record<Locale, string> = {
  en: 'Monthly subscription',
  ru: 'Ежемесячная подписка',
  he: 'מנוי חודשי',
}

const SUB_PRICE: Record<Locale, string> = {
  en: '400₪/mo.',
  ru: '400₪/мес',
  he: '₪400/חודש',
}

const SUB_DESC: Record<Locale, string> = {
  en: 'Hosting on Vercel Edge, SSL, 24/7 monitoring, FAQ bot token allowance, and up to 1 hr/month engineering support for content & price updates.',
  ru: 'Хостинг Vercel Edge, SSL, мониторинг доступности 24/7, покрытие токенов FAQ-бота и до 1 часа в месяц работы инженера на обновление цен и контента.',
  he: 'אחסון Vercel Edge, SSL, ניטור זמינות 24/7, כיסוי טוקנים לבוט FAQ ועד שעה בחודש של מהנדס לעדכון מחירים ותוכן.',
}

const INCLUDES_PARAGRAPHS: Record<Locale, string[]> = {
  ru: [
    'Проектирование и верстка на Next.js (5–6 секций): Hero-экран с конверсионным CTA; Преимущества / О компании; Карточки услуг с ценами; Форма захвата контактов; Футер, контакты, соцсети.',
    'Скорость и SEO: Мгновенный отклик (Google PageSpeed 95–100), нативная RTL-верстка под иврит, Schema.org и динамический robots.txt/sitemap.',
    'Безопасная обработка лидов: Serverless API Route с отправкой заявок сразу в Telegram и на Email (с защитой от спам-ботов через Honeypot, без n8n).',
    'Управление контентом: Pure Jamstack (правки текстов через 1 ч инженера в подписке) или Git-based CMS (Decap CMS / TinaCMS) с бесплатной админкой прямо в браузере и хранением в GitHub.',
    'Базовый AI-консультант: Встраиваемый легковесный виджет чата с обучением по статическому FAQ компании (без сложной векторной БД и без RAG).',
    'Подписка за ₪400/мес: Хостинг Vercel Edge CDN, SSL-сертификат, мониторинг доступности 24/7, покрытие токенов FAQ-бота и до 1 часа в месяц работы инженера на обновление цен и контента.',
    'Четкие границы пакета: ❌ Нет тяжелой реляционной базы данных PostgreSQL (данные хранятся в репозитории/файлах); ❌ Нет n8n оркестрации и сквозной интеграции с CRM; ❌ Нет сложного RAG-поиска по PDF-документам компании.',
  ],
  en: [
    'Next.js Architecture & Layout (5–6 sections): Hero screen with high-converting CTA; Key advantages / About company; Service cards with pricing; Lead capture form; Footer, contacts, social links.',
    'Performance & SEO: Instant response (Google PageSpeed 95–100), native RTL Hebrew support, Schema.org microdata, and dynamic robots.txt/sitemap.',
    'Secure Lead Handling: Serverless API Route delivering submissions directly to Telegram & Email with Honeypot anti-spam protection (no heavy n8n instance needed).',
    'Content Management: Pure Jamstack (content edits via 1 hr included engineering support) or Git-based CMS (Decap CMS / TinaCMS) with in-browser admin storing JSON/Markdown in GitHub.',
    'Basic AI Consultant: Lightweight embedded chat widget trained on static company FAQ (without complex vector DB or RAG pipeline).',
    'Maintenance at ₪400/mo: Vercel Edge CDN hosting, SSL, 24/7 uptime monitoring, token allowance for FAQ bot, and up to 1 hr/month engineering work for price and content changes.',
    'Clear Package Boundaries: ❌ No heavy PostgreSQL relational database; ❌ No n8n workflow orchestration or multi-step CRM integration; ❌ No complex RAG search over corporate PDF documents.',
  ],
  he: [
    'אפיון ופיתוח ב-Next.js (5–6 סקציות): מסך Hero עם CTA ממיר; יתרונות / אודות החברה; כרטיסי שירותים ומחירים; טופס לכידת לידים; פוטר, יצירת קשר ורשתות חברתיות.',
    'ביצועים ו-SEO: תגובה מהירה במיוחד (Google PageSpeed 95–100), תמיכה טבעית ב-RTL לעברית, מיקרו-דאטה Schema.org וקובצי robots.txt/sitemap דינמיים.',
    'ניתוב לידים מאובטח: נתיב Serverless API המעביר פניות ישירות לטלגרם ולאימייל עם מנגנון Honeypot נגד בוטים (ללא תלות ב-n8n).',
    'ניהול תוכן: Pure Jamstack (עדכוני תוכן במסגרת שעת מהנדס במנוי) או Git-based CMS (Decap / TinaCMS) עם ממשק ניהול בדפדפן ושמירה ב-GitHub ללא מסד נתונים.',
    'יועץ AI בסיסי: ווידג׳ט צ׳אט מוטמע וקליל המאומן על שאלות ותשובות נפוצות (FAQ) סטטיות (ללא מסד נתונים וקטורי וללא RAG מורכב).',
    'מנוי תחזוקה ב-₪400/חודש: אחסון Vercel Edge CDN, תעודת SSL, ניטור זמינות 24/7, כיסוי טוקנים לבוט ועד שעה בחודש של מהנדס לעדכון מחירים ותכנים.',
    'גבולות ברורים של החבילה: ❌ ללא מסד נתונים רלציוני כבד PostgreSQL; ❌ ללא תזמור תהליכים ב-n8n ואינטגרציית CRM עמוקה; ❌ ללא חיפוש RAG מתקדם על גבי מסמכי PDF.',
  ],
}

const SEO_TITLES: Record<Locale, string> = {
  en: 'AI Smart Card | Order | Erythro.ai',
  ru: 'AI-визитка | Оформление заказа | Erythro.ai',
  he: 'כרטיס חכם AI | הזמנה | Erythro.ai',
}

const SEO_DESCS: Record<Locale, string> = {
  en: 'Custom AI Smart Card & Landing Page built on Next.js, TypeScript & Tailwind CSS for ₪7,000. Features embedded AI assistant, native RTL Hebrew support, and ₪400/mo maintenance.',
  ru: 'Закажите разработку AI-визитки на Next.js, TypeScript и Tailwind CSS за ₪7,000. Включен встроенный ИИ-виджет для ответов на FAQ, хостинг и поддержка ₪400/мес, SEO и RTL-поддержка иврита.',
  he: 'הזמינו כרטיס חכם דיגיטלי על בסיס Next.js, TypeScript ו-Tailwind CSS ב-₪7,000. כולל עוזר AI מובנה, תמיכה מלאה ב-RTL, אחסון ותחזוקה ב-₪400/חודש.',
}

async function run() {
  const payload = await getPayload({ config })

  console.log('Fetching current doc 2...')
  const existing = await payload.findByID({
    collection: 'solution-plans',
    id: 2,
    locale: 'all',
    depth: 0,
  })

  // Retain existing priority support addon if present
  const existingAddons = Array.isArray(existing.addons) ? existing.addons : []
  const priorityAddon = existingAddons.find((a: any) => a.addonId === 'priority-support')

  for (const loc of LOCALES) {
    console.log(`Updating solution-plans/2 for locale: ${loc}...`)

    const subFullRich = lexicalFromParagraphs([
      SUB_DESC[loc],
      loc === 'ru'
        ? 'Включает: Vercel Edge CDN, SSL, мониторинг 24/7, токены AI-виджета, 1 час работы инженера/мес.'
        : loc === 'he'
          ? 'כולל: אחסון Vercel Edge CDN, תעודת SSL, ניטור 24/7, טוקנים לווידג׳ט AI ושעת עבודת מהנדס לחודש.'
          : 'Includes: Vercel Edge CDN hosting, SSL, 24/7 monitoring, AI widget tokens, and 1 hr/mo engineering support.',
    ])

    const updatedAddons = [
      {
        addonId: 'subscription',
        name: SUB_NAME[loc],
        priceDisplay: SUB_PRICE[loc],
        description: SUB_DESC[loc],
        recommended: true,
        mandatory: false,
        discountMonths1: 0,
        discountMonths6: 0,
        discountMonths12: 0,
        fullRich: subFullRich,
      },
      ...(priorityAddon
        ? [
            {
              addonId: 'priority-support',
              name: typeof priorityAddon.name === 'object' ? priorityAddon.name[loc] || priorityAddon.name.en : priorityAddon.name,
              priceDisplay: typeof priorityAddon.priceDisplay === 'object' ? priorityAddon.priceDisplay[loc] || priorityAddon.priceDisplay.en : priorityAddon.priceDisplay,
              description: typeof priorityAddon.description === 'object' ? priorityAddon.description?.[loc] || '' : priorityAddon.description || '',
              recommended: false,
              mandatory: false,
            },
          ]
        : []),
    ]

    await payload.update({
      collection: 'solution-plans',
      id: 2,
      locale: loc,
      data: {
        title: TITLES[loc],
        slug: 'ai-smart-card',
        price: '7 000',
        currency: 'ILS',
        subtitle: SUBTITLES[loc],
        promo: PROMOS[loc],
        features: FEATURES[loc].map((f) => ({
          label: f.label,
          value: f.value,
        })),
        addons: updatedAddons,
        includesRich: lexicalFromParagraphs(INCLUDES_PARAGRAPHS[loc]),
        seo: {
          title: SEO_TITLES[loc],
          description: SEO_DESCS[loc],
        },
      },
    })
    console.log(`  ✓ locale ${loc} saved.`)
  }

  console.log('Busting site cache...')
  await pingSiteRevalidate([
    '/',
    '/order/ai-smart-card',
    '/order/ai-business-card',
  ])

  console.log('Done patching AI Smart Card solution plan in DB.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
