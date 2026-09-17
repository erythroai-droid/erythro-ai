import { solutions, type SolutionCardItem, type SolutionFeature } from '@/translations'

export type LocaleMap = Record<string, string>

export interface OrderPeriod {
  id: string
  label: LocaleMap
  /** Multiply base price; e.g. 1 = full, or months for subscription display */
  months: number
  /** Discount percent off list (one-time) when picking longer commitment */
  discountPercent: number
}

export interface OrderAddon {
  id: string
  name: LocaleMap
  description: LocaleMap
  /** Display price per locale like Feature Value, e.g. "350₪/мес" */
  price: LocaleMap
  /** Discount % for 1 / 6 / 12 month terms */
  discountMonths1?: number
  discountMonths6?: number
  discountMonths12?: number
  recommended?: boolean
  mandatory?: boolean
  note?: LocaleMap
  /** Plain fallback for expandable “Subscription: price/mo” details */
  full?: LocaleMap
  /** Lexical rich text for expandable details on the order add-on card */
  fullRich?: Record<string, unknown>
}

export const SUBSCRIPTION_ADDON_ID = 'subscription'

export const SUBSCRIPTION_ADDON_NAME: LocaleMap = {
  en: 'Monthly subscription',
  ru: 'Ежемесячная подписка',
  he: 'מנוי חודשי',
}

export function isSubscriptionFeatureLabel(label: LocaleMap | undefined): boolean {
  const blob = Object.values(label || {})
    .join(' ')
    .toLowerCase()
  return /subscription|подписка|מנוי/.test(blob)
}

/** Build a Monthly subscription add-on from a homepage “Подписка” feature row. */
export function subscriptionAddonFromFeature(feature: SolutionFeature): OrderAddon {
  return {
    id: SUBSCRIPTION_ADDON_ID,
    name: { ...SUBSCRIPTION_ADDON_NAME },
    description: { en: '', ru: '', he: '' },
    price: {
      en: (feature.value?.en || '').trim(),
      ru: (feature.value?.ru || '').trim(),
      he: (feature.value?.he || '').trim(),
    },
    recommended: true,
  }
}

export const ADDON_TERM_MONTHS = [1, 6, 12] as const
export type AddonTermMonths = (typeof ADDON_TERM_MONTHS)[number]

export function addonTermDiscount(addon: OrderAddon, months: number): number {
  if (months === 6) return Math.max(0, addon.discountMonths6 || 0)
  if (months === 12) return Math.max(0, addon.discountMonths12 || 0)
  return Math.max(0, addon.discountMonths1 || 0)
}

/** Parsed monthly amount from display price ("350₪/мес" → 350) */
export function addonMonthlyAmount(addon: OrderAddon, locale?: string): number {
  if (locale) {
    const fromLocale = parsePrice(tLocale(addon.price, locale))
    if (fromLocale) return fromLocale
  }
  return (
    parsePrice(addon.price?.en || '') ||
    parsePrice(addon.price?.ru || '') ||
    parsePrice(addon.price?.he || '') ||
    0
  )
}

/** list = monthly × months; final applies term discount % */
export function calcAddonAmount(
  monthlyPrice: number,
  months: number,
  discountPercent = 0,
): { list: number; final: number; savings: number } {
  const list = Math.round(monthlyPrice * months)
  const final = Math.round(list * (1 - Math.max(0, discountPercent) / 100))
  return { list, final, savings: Math.max(0, list - final) }
}

export interface OrderPlan {
  slug: string
  kind?: 'solution' | 'audit'
  card: SolutionCardItem
  subtitle: LocaleMap
  periods: OrderPeriod[]
  defaultPeriodId: string
  addons: OrderAddon[]
  promo?: LocaleMap
  /** Note under payment options select on the order page */
  paymentNote?: LocaleMap
  /** Plain fallback for the “what’s included” block */
  includes?: LocaleMap
  /** Lexical rich text for the “what’s included” block (order page) */
  includesRich?: Record<string, unknown>
  /** Tax subtitle / rate, e.g. "17%" — used to compute tax added to total */
  taxNote?: LocaleMap
  /** Optional right-side tax label when no numeric rate (legacy display) */
  taxValue?: LocaleMap
  seoTitle?: LocaleMap
  seoDescription?: LocaleMap
}

const SMART_CARD_INCLUDES: Record<'en' | 'ru' | 'he', string[]> = {
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

function buildOrderPlan(card: SolutionCardItem): OrderPlan {
  const homeSubscription = card.features.find((f) => isSubscriptionFeatureLabel(f.label))
  const addons = homeSubscription ? [subscriptionAddonFromFeature(homeSubscription)] : []

  const isSmartCard = card.id === 'ai-smart-card'
  if (isSmartCard && addons[0]) {
    addons[0] = {
      ...addons[0],
      full: {
        ru: 'Хостинг Vercel Edge, SSL, мониторинг доступности 24/7, покрытие токенов FAQ-бота и до 1 часа в месяц работы инженера на обновление цен и контента.',
        en: 'Hosting on Vercel Edge, SSL, 24/7 monitoring, FAQ bot token allowance, and up to 1 hr/month engineering support for content & price updates.',
        he: 'אחסון Vercel Edge, SSL, ניטור זמינות 24/7, כיסוי טוקנים לבוט FAQ ועד שעה בחודש של מהנדס לעדכון מחירים ותוכן.',
      },
    }
  }

  return {
    slug: card.id,
    kind: 'solution',
    card: {
      ...card,
      // Subscription rows stay on Solutions cards only — order uses the Add-on card
      features: card.features.filter((f) => !isSubscriptionFeatureLabel(f.label)),
    },
    subtitle: isSmartCard
      ? {
          ru: 'Высокоскоростной сайт на Next.js с базовым AI-консультантом и нулевыми затратами на серверы.',
          en: 'High-speed Next.js website with a basic AI consultant and zero server costs.',
          he: 'אתר בעל ביצועים גבוהים על Next.js עם יועץ AI בסיסי ואפס עלויות שרת.',
        }
      : { en: '', ru: '', he: '' },
    promo: isSmartCard
      ? {
          ru: 'Хостинг Vercel Edge CDN, пожизненный SSL и 1 час ежемесячной поддержки инженера включены в подписку.',
          en: 'Vercel Edge CDN hosting, lifetime SSL, and 1 hour of monthly engineering support included in the subscription.',
          he: 'אחסון Vercel Edge CDN, תעודת SSL לכל החיים ושעת תמיכת מהנדס חודשית כלולים במנוי.',
        }
      : undefined,
    includes: isSmartCard
      ? {
          ru: SMART_CARD_INCLUDES.ru.join('\n\n'),
          en: SMART_CARD_INCLUDES.en.join('\n\n'),
          he: SMART_CARD_INCLUDES.he.join('\n\n'),
        }
      : undefined,
    /** Periods / promo / tax come from CMS only — subscription add-on may be derived above */
    periods: [],
    defaultPeriodId: '',
    addons,
    seoTitle: {
      en: `${card.title.en} | Order | Erythro.ai`,
      ru: `${card.title.ru} | Оформление заказа | Erythro.ai`,
      he: `${card.title.he} | הזמנה | Erythro.ai`,
    },
  }
}

/** Lab protocol groups — mirror QA_Auditor `ReportScopeOfWork` itemsCore (PIT-029). */
export const AUDIT_CHECK_CATEGORIES = [
  {
    title: {
      en: 'Network & security',
      ru: 'Сеть и безопасность',
      he: 'רשת ואבטחה',
    } satisfies LocaleMap,
    description: {
      en: '13 parameters: HTTPS, HTTP status, TTFB, Server, six headers, 4xx/5xx, runtime JS',
      ru: '13 параметров: HTTPS, HTTP-статус, TTFB, Server, шесть заголовков, 4xx/5xx, runtime JS',
      he: '13 פרמטרים: HTTPS, סטטוס HTTP, TTFB, Server, שש כותרות, 4xx/5xx, JS בזמן ריצה',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'Indexing & AI crawlers',
      ru: 'Индексация и AI-боты',
      he: 'אינדוקס ובוטי AI',
    } satisfies LocaleMap,
    description: {
      en: 'robots.txt, sitemap, Sitemap: directive; rules for 8 AI bots and severe_block',
      ru: 'robots.txt, sitemap, директива Sitemap:; правила для 8 AI-ботов и severe_block',
      he: 'robots.txt, sitemap, הנחיית Sitemap:; כללים ל-8 בוטי AI ו-severe_block',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'PageSpeed Insights',
      ru: 'PageSpeed Insights',
      he: 'PageSpeed Insights',
    } satisfies LocaleMap,
    description: {
      en: '10 Lighthouse metrics × mobile and desktop, plus TTFB on origin',
      ru: '10 метрик Lighthouse × mobile и desktop, плюс TTFB на origin',
      he: '10 מדדי Lighthouse × מובייל ודסקטופ, וגם TTFB ב-origin',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'Per locale — UX, forms, SEO',
      ru: 'На каждой локали — UX, формы, SEO',
      he: 'לכל שפה — UX, טפסים, SEO',
    } satisfies LocaleMap,
    description: {
      en: '~28 signals × EN/RU/HE: meta, OG, overflow at 375px, forms, axe-core; RTL + LanguageTool EN/RU',
      ru: '~28 сигналов × EN/RU/HE: meta, OG, overflow на 375px, формы, axe-core; RTL + LanguageTool EN/RU',
      he: '~28 אותות × EN/RU/HE: meta, OG, overflow ב-375px, טפסים, axe-core; RTL + LanguageTool EN/RU',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'AI Visibility',
      ru: 'AI Visibility',
      he: 'נראות AI',
    } satisfies LocaleMap,
    description: {
      en: 'llms.txt, MCP, /about, Organization schema, AI-bot rules, GA4 dataLayer + consent stub',
      ru: 'llms.txt, MCP, /about, Organization schema, правила AI-ботов, GA4 dataLayer + consent stub',
      he: 'llms.txt, MCP, /about, סכמת Organization, כללי בוטי AI, GA4 dataLayer + consent stub',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'Agent Readiness Level 1',
      ru: 'Agent Readiness Level 1',
      he: 'Agent Readiness Level 1',
    } satisfies LocaleMap,
    description: {
      en: '5 checks: robots, agent sitemap, crawler rules, Content-Signal, markdown negotiation (not in score)',
      ru: '5 проверок: robots, sitemap для агентов, правила ботов, Content-Signal, markdown (не в оценке)',
      he: '5 בדיקות: robots, sitemap לסוכנים, כללי בוטים, Content-Signal, markdown (לא בציון)',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'Funnel crawl',
      ru: 'Обход воронки',
      he: 'סריקת משפך',
    } satisfies LocaleMap,
    description: {
      en: 'Free: 1 URL (homepage). Diagnostic: up to 5. Pro: up to 10 — HTTP, title, h1, forms (inline and after CTA click), CTA, chat/WhatsApp, soft-404',
      ru: 'Free: 1 URL (главная). Diagnostic: до 5. Pro: до 10 — HTTP, title, h1, формы (встроенные и после клика по CTA), CTA, чат/WhatsApp, soft-404',
      he: 'Free: כתובת אחת (דף הבית). Diagnostic: עד 5. Pro: עד 10 — HTTP, title, h1, טפסים (משובצים ואחרי CTA), CTA, צ׳אט/WhatsApp, soft-404',
    } satisfies LocaleMap,
  },
  {
    title: {
      en: 'Funnel review',
      ru: 'Funnel review',
      he: 'Funnel review',
    } satisfies LocaleMap,
    description: {
      en: 'Pro only: AI verdict on the path to a lead (modal forms and chat/WhatsApp count), up to 3 funnel gaps, and one priority fix',
      ru: 'Только Pro: AI-вердикт по пути к заявке (модалки и чат считаются), до 3 пробелов воронки и одна приоритетная доработка',
      he: 'רק Pro: פסק דין AI על הדרך לליד (טפסי מודאל וצ׳אט נספרים), עד 3 פערי משפך ותיקון אחד בעדיפות',
    } satisfies LocaleMap,
  },
]

export const AUDIT_ORDER_PLANS: OrderPlan[] = [
  {
    slug: 'audit-free',
    kind: 'audit',
    card: {
      id: 'audit-free',
      currency: 'ILS',
      price: '0',
      title: {
        en: 'Free AI Audit',
        ru: 'Бесплатный AI Аудит',
        he: 'ביקורת AI בחינם',
      },
      features: [
        {
          value: {
            en: 'Score 0–100 and grade A+–F across 5 scales (speed, leads, SEO, security, AI Visibility)',
            ru: 'Оценка 0–100 и грейд A+–F по 5 шкалам (скорость, лиды, SEO, безопасность, AI Visibility)',
            he: 'ציון 0–100 ודרגה A+–F ב-5 סקאלות (מהירות, לידים, SEO, אבטחה, נראות AI)',
          },
        },
        {
          value: {
            en: 'Top-3 risks with business impact',
            ru: 'Топ-3 риска с влиянием на бизнес',
            he: '3 הסיכונים העיקריים עם השפעה עסקית',
          },
        },
        {
          value: {
            en: 'Lighthouse: mobile and desktop',
            ru: 'Lighthouse: mobile и desktop',
            he: 'Lighthouse: מובייל ודסקטופ',
          },
        },
        {
          value: {
            en: 'Homepage only · one site language',
            ru: 'Проверяется главная · один язык сайта',
            he: 'דף הבית בלבד · שפת אתר אחת',
          },
        },
        {
          value: {
            en: 'HTML report in the language you choose (EN / RU / HE)',
            ru: 'HTML-отчёт на выбранном языке (EN / RU / HE)',
            he: 'דוח HTML בשפה שבחרתם (EN / RU / HE)',
          },
        },
      ],
    },
    subtitle: {
      en: 'Homepage preview: score, top-3, and Lighthouse.',
      ru: 'Превью главной: оценка, топ-3 и Lighthouse.',
      he: 'תצוגה מקדימה של דף הבית: ציון, 3 סיכונים ו-Lighthouse.',
    },
    periods: [],
    defaultPeriodId: '',
    addons: [],
    includes: {
      en: 'The report includes a 0–100 score and A+–F grade on five scales (speed & mobile UX, lead gen & forms, SEO, security, AI Visibility), the top-3 risks with business impact, and a Lighthouse table for mobile and desktop. The lab opens one page — the homepage — in the report language. Summary cards, funnel crawl, and the fix plan are in Diagnostic and Pro.',
      ru: 'В отчёте: оценка 0–100 и грейд A+–F по пяти шкалам (скорость и мобильный UX, лиды и формы, SEO, безопасность, AI Visibility), топ-3 риска с влиянием на бизнес и таблица Lighthouse mobile + desktop. Лаборатория открывает одну страницу — главную — на языке отчёта. Сводные карточки, обход воронки и план правок — в Диагностике и Pro.',
      he: 'הדוח כולל ציון 0–100 ודרגה A+–F בחמש סקאלות (מהירות ו-UX למובייל, לידים וטפסים, SEO, אבטחה, נראות AI), את 3 הסיכונים העיקריים עם השפעה עסקית וטבלת Lighthouse למובייל ולדסקטופ. המעבדה פותחת עמוד אחד — דף הבית — בשפת הדוח. כרטיסי הסיכום, סריקת המשפך ותוכנית התיקון הם באבחון וב-Pro.',
    },
    seoTitle: {
      en: 'Free AI Website Audit | Erythro.ai',
      ru: 'Бесплатный AI Аудит сайта | Erythro.ai',
      he: 'ביקורת אתר AI בחינם | Erythro.ai',
    },
    seoDescription: {
      en: 'Free preview audit: 0–100 score on five scales, top-3 risks, and Lighthouse. Homepage only, one language.',
      ru: 'Бесплатный превью-аудит: оценка 0–100 по пяти шкалам, топ-3 риска и Lighthouse. Главная страница, один язык.',
      he: 'ביקורת תצוגה מקדימה חינם: ציון 0–100 בחמש סקאלות, 3 סיכונים ו-Lighthouse. דף הבית בלבד, שפה אחת.',
    },
  },
  {
    slug: 'audit-diagnostic',
    kind: 'audit',
    card: {
      id: 'audit-diagnostic',
      currency: 'ILS',
      price: '99',
      originalPrice: '290',
      featured: true,
      priceNote: true,
      title: {
        en: 'AI Audit: Diagnostic',
        ru: 'AI Аудит: Диагностика',
        he: 'ביקורת AI: אבחון',
      },
      features: [
        {
          value: {
            en: 'Everything in Free, plus:',
            ru: 'Всё из бесплатного, плюс:',
            he: 'הכל מהחבילה החינמית, ובנוסף:',
          },
        },
        {
          value: {
            en: 'Site crawl in EN, RU and HE',
            ru: 'Сканирование сайта на EN, RU и HE',
            he: 'בדיקת האתר ב-EN, RU ו-HE',
          },
        },
        {
          value: {
            en: 'Funnel crawl — up to 5 URLs',
            ru: 'Обход воронки — до 5 URL',
            he: 'סריקת משפך — עד 5 כתובות',
          },
        },
        {
          value: {
            en: 'Summary checklist cards (excellent → attention → critical)',
            ru: 'Сводные карточки чеклиста (отлично → внимание → критично)',
            he: 'כרטיסי סיכום צ׳ק-ליסט (מצוין → לתשומת לב → קריטי)',
          },
        },
        {
          value: {
            en: 'Rollup of forms, HTTPS, layout, and AI Visibility',
            ru: 'Свод по формам, HTTPS, вёрстке и AI Visibility',
            he: 'סיכום טפסים, HTTPS, פריסה ונראות AI',
          },
        },
        {
          value: {
            en: 'HTML report in your language · full checklist is in Pro',
            ru: 'HTML-отчёт на выбранном языке · полный чеклист — в Pro',
            he: 'דוח HTML בשפה שבחרתם · הצ׳ק-ליסט המלא ב-Pro',
          },
        },
      ],
    },
    subtitle: {
      en: 'Three site languages and up to 5 funnel URLs, one-time.',
      ru: 'Три языка сайта и до 5 URL воронки, разово.',
      he: 'שלוש שפות אתר ועד 5 כתובות משפך, חד-פעמי.',
    },
    promo: {
      en: 'Special promo price · ₪191 off',
      ru: 'Специальная промо-цена · скидка 191 ₪',
      he: 'מחיר מבצע מיוחד · הנחה של ₪191',
    },
    periods: [],
    defaultPeriodId: '',
    addons: [],
    includes: {
      en: 'Everything in Free, plus a crawl of the site in EN, RU and HE and up to 5 funnel pages. The report adds summary checklist cards (excellent → attention → critical): layout, forms, HTTPS, AI Visibility, stability. The row-by-row 60+ checklist and written recommendations stay in Pro. One HTML report in the language you choose.',
      ru: 'Как бесплатный тариф, плюс сканирование сайта на EN, RU и HE и обход до 5 страниц воронки. В отчёте — сводные карточки чеклиста (отлично → внимание → критично): вёрстка, формы, HTTPS, AI Visibility, стабильность. Построчный чеклист 60+ и текст рекомендаций остаются в Pro. Один HTML-отчёт на выбранном языке.',
      he: 'הכל מהחבילה החינמית, ובנוסף בדיקת האתר ב-EN, RU ו-HE וסריקה של עד 5 עמודי משפך. בדוח — כרטיסי סיכום צ׳ק-ליסט (מצוין → לתשומת לב → קריטי): פריסה, טפסים, HTTPS, נראות AI ויציבות. צ׳ק-ליסט 60+ שורה-שורה והמלצות כתובות נשארים ב-Pro. דוח HTML אחד בשפה שבחרתם.',
    },
    seoTitle: {
      en: 'Diagnostic AI Audit | Summary report | Erythro.ai',
      ru: 'AI Аудит Диагностика | Сводный отчёт | Erythro.ai',
      he: 'ביקורת AI אבחון | דוח סיכום | Erythro.ai',
    },
    seoDescription: {
      en: 'Diagnostic website audit: score, top-3, summary cards, three languages, and up to 5 funnel URLs.',
      ru: 'Диагностика сайта: оценка, топ-3, сводные карточки, три языка и до 5 URL воронки.',
      he: 'ביקורת אבחון לאתר: ציון, 3 סיכונים, כרטיסי סיכום, שלוש שפות ועד 5 כתובות משפך.',
    },
  },
  {
    slug: 'audit-pro',
    kind: 'audit',
    card: {
      id: 'audit-pro',
      currency: 'ILS',
      price: '490',
      title: {
        en: 'AI Audit: Pro',
        ru: 'AI Аудит: Pro',
        he: 'ביקורת AI: Pro',
      },
      features: [
        {
          value: {
            en: 'Everything in Diagnostic, plus:',
            ru: 'Всё из Диагностики, плюс:',
            he: 'הכל מחבילת האבחון, ובנוסף:',
          },
        },
        {
          value: {
            en: 'Full 60+ checklist and a fix plan on every row',
            ru: 'Полный чеклист 60+ и план правок по каждой строке',
            he: 'צ׳ק-ליסט 60+ מלא ותוכנית תיקון לכל שורה',
          },
        },
        {
          value: {
            en: 'Funnel crawl — up to 10 URLs',
            ru: 'Обход воронки — до 10 URL',
            he: 'סריקת משפך — עד 10 כתובות',
          },
        },
        {
          value: {
            en: 'Funnel review: AI verdict on the lead path (modal forms and chat count), gaps, and one priority fix',
            ru: 'Funnel review: AI-вердикт по пути к заявке (модалки и чат считаются), пробелы и приоритетная доработка',
            he: 'Funnel review: פסק דין AI על דרך הליד (טפסי מודאל וצ׳אט נספרים), פערים ותיקון בעדיפות',
          },
        },
        {
          value: {
            en: 'AI Visibility: 7 criteria + Agent Readiness L1',
            ru: 'AI Visibility: 7 критериев + Agent Readiness L1',
            he: 'נראות AI: 7 קריטריונים + Agent Readiness L1',
          },
        },
        {
          value: {
            en: 'In-report recommendations you can copy',
            ru: 'Рекомендации в отчёте, можно копировать',
            he: 'המלצות בדוח, עם אפשרות להעתקה',
          },
        },
        {
          value: {
            en: 'Full HTML report in the language you choose',
            ru: 'Полный HTML-отчёт на выбранном языке',
            he: 'דוח HTML מלא בשפה שבחרתם',
          },
        },
      ],
    },
    subtitle: {
      en: 'Full 60+ checklist, Funnel review, fix plan, and AI Visibility breakdown.',
      ru: 'Полный чеклист 60+, Funnel review, план правок и разбор AI Visibility.',
      he: 'צ׳ק-ליסט 60+ מלא, Funnel review, תוכנית תיקון ופירוט נראות AI.',
    },
    periods: [],
    defaultPeriodId: '',
    addons: [],
    includes: {
      en: 'Everything in Diagnostic, plus up to 10 funnel pages and Funnel review (AI verdict on the path to a lead, including modal forms and chat widgets). Unlocks the full 60+ checklist with a fix on every row — including 7 AI Visibility criteria and Agent Readiness L1. HTML report in the language you choose; recommendations can be copied.',
      ru: 'Как Диагностика, плюс до 10 страниц воронки и Funnel review (AI-вердикт по пути к заявке, включая модальные формы и чат). Открыт полный чеклист 60+ с рекомендациями по каждой строке — включая 7 критериев AI Visibility и Agent Readiness L1. HTML-отчёт на выбранном языке, рекомендации можно копировать.',
      he: 'הכל מחבילת האבחון, ובנוסף עד 10 עמודי משפך ו-Funnel review (פסק דין AI על הדרך לליד, כולל טפסי מודאל וצ׳אט). נפתח צ׳ק-ליסט 60+ מלא עם המלצה לכל שורה — כולל 7 קריטריוני נראות AI ו-Agent Readiness L1. דוח HTML בשפה שבחרתם; אפשר להעתיק את ההמלצות.',
    },
    seoTitle: {
      en: 'Pro AI Audit | Full checklist & fix plan | Erythro.ai',
      ru: 'AI Аудит Pro | Полный чеклист и план правок | Erythro.ai',
      he: 'ביקורת AI Pro | צ׳ק-ליסט מלא ותוכנית תיקון | Erythro.ai',
    },
    seoDescription: {
      en: 'Full website audit: 60+ checklist, Funnel review, fix plan, up to 10 funnel URLs, and AI Visibility breakdown.',
      ru: 'Полный аудит сайта: чеклист 60+, Funnel review, план правок, до 10 URL воронки и разбор AI Visibility.',
      he: 'ביקורת אתר מלאה: צ׳ק-ליסט 60+, Funnel review, תוכנית תיקון, עד 10 כתובות משפך ופירוט נראות AI.',
    },
  },
]

export const ORDER_PLANS: OrderPlan[] = [
  ...solutions.cards.map(buildOrderPlan),
  ...AUDIT_ORDER_PLANS,
]

const ORDER_SLUG_ALIASES: Record<string, string> = {
  free: 'audit-free',
  diagnostic: 'audit-diagnostic',
  pro: 'audit-pro',
  'ai-business-card': 'ai-smart-card',
}

export function getOrderPlan(slug: string): OrderPlan | undefined {
  const direct = ORDER_PLANS.find((plan) => plan.slug === slug)
  if (direct) return direct
  const aliased = ORDER_SLUG_ALIASES[slug]
  if (aliased) return ORDER_PLANS.find((plan) => plan.slug === aliased)
  return undefined
}

export function getAllOrderSlugs(): string[] {
  return ORDER_PLANS.map((plan) => plan.slug)
}

export function tLocale(field: LocaleMap | undefined, locale: string): string {
  if (!field) return ''
  return field[locale] || field.en || Object.values(field)[0] || ''
}

/** Parse "14 999" / "5000" → number */
export function parsePrice(price: string): number {
  const n = Number(String(price).replace(/[^\d]/g, ''))
  return Number.isFinite(n) ? n : 0
}

const CURRENCY_SYMBOL: Record<string, string> = {
  ILS: '₪',
  USD: '$',
  EUR: '€',
}

export function currencySymbol(currency?: string): string {
  return CURRENCY_SYMBOL[currency || 'ILS'] || CURRENCY_SYMBOL.ILS
}

export function formatPrice(amount: number, locale: string, currency?: string): string {
  const formatted = new Intl.NumberFormat(
    locale === 'he' ? 'he-IL' : locale === 'ru' ? 'ru-RU' : 'en-US',
  ).format(amount)
  const symbol = currencySymbol(currency)
  if (locale === 'he') {
    return `${symbol}${formatted}`
  }
  return `${formatted} ${symbol}`
}

export function calcPlanAmount(plan: OrderPlan, periodId: string): {
  base: number
  list: number
  perMonth: number | null
  savings: number
} {
  const list = parsePrice(plan.card.originalPrice || plan.card.price)
  const sale = parsePrice(plan.card.price)
  const period = plan.periods.find((p) => p.id === periodId) || plan.periods[0]
  const discounted = Math.round(sale * (1 - (period?.discountPercent || 0) / 100))
  const savings = Math.max(0, list - discounted)
  const perMonth = period && period.months > 1 ? Math.ceil(discounted / period.months) : null
  return { base: discounted, list, perMonth, savings }
}

/** Parse "17%" / "17" → 17; returns 0 when not a rate. */
export function parseTaxPercent(taxNote: string | undefined): number {
  if (!taxNote) return 0
  const m = String(taxNote).match(/(\d+(?:[.,]\d+)?)\s*%?/)
  if (!m) return 0
  const n = Number(m[1].replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Tax amount added on top of subtotal. Prefer % from taxNote; else fixed number in taxValue. */
export function calcTaxAmount(
  subtotal: number,
  taxNote: string | undefined,
  taxValue: string | undefined,
): number {
  const percent = parseTaxPercent(taxNote)
  if (percent > 0) return Math.round((subtotal * percent) / 100)

  if (taxValue) {
    const fixed = Number(String(taxValue).replace(/[^\d.,]/g, '').replace(',', '.'))
    if (Number.isFinite(fixed) && fixed > 0) return Math.round(fixed)
  }
  return 0
}

export function featureLines(features: SolutionFeature[], locale: string): string[] {
  return features
    .map((feature) => {
      const label = feature.label ? tLocale(feature.label, locale) : ''
      const value = feature.value ? tLocale(feature.value, locale) : ''
      return `${label} ${value}`.trim()
    })
    .filter(Boolean)
}
