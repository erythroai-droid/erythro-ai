export type LocaleMap = Record<string, string>
export type LocaleListMap = Record<string, string[]>
export type ServiceCurrency = 'USD' | 'ILS' | 'EUR'

export interface ServiceOffering {
  name: LocaleMap
  description?: LocaleMap
  price: string
  pricePrefix?: LocaleMap
}

export interface ServicePage {
  id: string
  slug: string
  title: LocaleMap
  hero: { type: 'image' | 'video'; src: string }
  /** Plain-text fallback / legacy; prefer summaryRich when present. */
  summary: LocaleMap
  /** Lexical docs per locale from CMS. */
  summaryRich?: LocaleMap | Record<string, unknown>
  description: LocaleListMap
  /** Lexical docs per locale from CMS. */
  descriptionRich?: LocaleMap | Record<string, unknown>
  features: LocaleListMap
  offerings: ServiceOffering[]
  currency?: ServiceCurrency
  seoTitle?: LocaleMap
  seoDescription?: LocaleMap
}

export const SERVICE_ID_TO_SLUG: Record<string, string> = {
  '1': 'design-branding',
  '2': 'development',
  '3': 'management',
  '4': 'ai-automation',
}

export const SERVICE_PAGES: ServicePage[] = [
  {
    id: '1',
    slug: 'design-branding',
    title: {
      en: 'Design & Branding',
      ru: 'Дизайн и брендинг',
      he: 'עיצוב ומיתוג',
    },
    hero: { type: 'image', src: '/images/service_design_branding.webp' },
    summary: {
      en: 'Visual systems that make the product memorable — from identity to motion.',
      ru: 'Визуальные системы, которые запоминаются — от айдентики до моушна.',
      he: 'מערכות ויזואליות שנשארות בזיכרון — מזהות מותג ועד תנועה.',
    },
    description: {
      en: [
        'We build a clear brand language: type, color, layout, and motion rules that work on web, decks, and campaigns.',
        'Every deliverable is production-ready — for product UI, launch pages, and marketing assets — so design does not stall engineering.',
      ],
      ru: [
        'Собираем понятный язык бренда: типографика, цвет, сетка и правила motion для веба, презентаций и кампаний.',
        'Все материалы готовы к продакшену — UI, лендинги и маркетинг — чтобы дизайн не тормозил разработку.',
      ],
      he: [
        'בונים שפת מותג ברורה: טיפוגרפיה, צבע, רשת וכללי תנועה לאתר, מצגות וקמפיינים.',
        'כל תוצר מוכן לפרודקשן — לממשק, דפי נחיתה ונכסי שיווק — כדי שהעיצוב לא יעכב פיתוח.',
      ],
    },
    features: {
      en: [
        'Brand Identity / Presentations',
        'Banners',
        'Web design',
        'Motion design',
        'Graphic design',
      ],
      ru: [
        'Бренд-айдентика / Презентации',
        'Баннеры',
        'Веб-дизайн',
        'Моушн-дизайн',
        'Графический дизайн',
      ],
      he: [
        'זהות מותג / מצגות',
        'באנרים',
        'עיצוב אתרים',
        'עיצוב בתנועה',
        'עיצוב גרפי',
      ],
    },
    offerings: [
      {
        name: {
          en: 'Brand identity kit',
          ru: 'Бренд-кит',
          he: 'ערכת זהות מותג',
        },
        description: {
          en: 'Logo system, palette, type, basic guidelines.',
          ru: 'Логосистема, палитра, шрифты, базовые гайдлайны.',
          he: 'מערכת לוגו, פלטה, טיפוגרפיה והנחיות בסיס.',
        },
        price: '2 500',
        pricePrefix: { en: 'from', ru: 'от', he: 'מ-' },
      },
      {
        name: {
          en: 'Web & product UI',
          ru: 'Веб и продуктовый UI',
          he: 'ממשק אתר ומוצר',
        },
        description: {
          en: 'Key screens, components, responsive layouts.',
          ru: 'Ключевые экраны, компоненты, адаптив.',
          he: 'מסכים מרכזיים, קומפוננטות ופריסה רספונסיבית.',
        },
        price: '4 500',
        pricePrefix: { en: 'from', ru: 'от', he: 'מ-' },
      },
      {
        name: {
          en: 'Motion & campaign pack',
          ru: 'Моушн и кампании',
          he: 'חבילת מושן וקמפיין',
        },
        description: {
          en: 'Motion templates, banners, launch visuals.',
          ru: 'Моушн-шаблоны, баннеры, визуалы запуска.',
          he: 'תבניות תנועה, באנרים וויזואלים להשקה.',
        },
        price: '1 800',
        pricePrefix: { en: 'from', ru: 'от', he: 'מ-' },
      },
    ],
  },
  {
    id: '2',
    slug: 'development',
    title: {
      en: 'Development',
      ru: 'Разработка',
      he: 'פיתוח',
    },
    hero: { type: 'image', src: '/images/service_development.webp' },
    summary: {
      en: 'Front-end that ships fast — responsive, animated, and ready for CMS.',
      ru: 'Фронтенд, который быстро уходит в прод — адаптив, анимация, готовность к CMS.',
      he: 'פרונטאנד שיוצא לפרודקשן מהר — רספונסיבי, מונפש ומוכן ל-CMS.',
    },
    description: {
      en: [
        'We implement marketing and product surfaces on a modern stack with attention to performance, SEO basics, and editor-friendly publishing.',
        'Motion and micro-interactions are part of the build — not a last-minute layer.',
      ],
      ru: [
        'Делаем маркетинговые и продуктовые поверхности на современном стеке: перфоманс, базовый SEO и удобная публикация для редакторов.',
        'Моушн и микроанимации входят в сборку — не добавляются «в конце».',
      ],
      he: [
        'מממשים משטחי שיווק ומוצר על סטאק מודרני עם דגש על ביצועים, SEO בסיסי ופרסום נוח לעורכים.',
        'תנועה ומיקרו-אינטראקציות הן חלק מהבנייה — לא שכבה של הרגע האחרון.',
      ],
    },
    features: {
      en: [
        'Custom front-end',
        'Responsive Layout',
        'Motion & UI Animation',
        'SEO Setup',
        'Easy Publishing',
      ],
      ru: [
        'Индивидуальный фронтенд',
        'Адаптивная верстка',
        'Моушн и анимация интерфейса',
        'Настройка SEO',
        'Легкая публикация',
      ],
      he: [
        'פרונטאנד בהתאמה אישית',
        'פריסה רספונסיבית',
        'אנימציית ממשק משתמש ומושן',
        'הגדרת SEO',
        'פרסום קל',
      ],
    },
    offerings: [
      {
        name: {
          en: 'Landing / marketing site',
          ru: 'Лендинг / маркетинговый сайт',
          he: 'דף נחיתה / אתר שיווקי',
        },
        price: '3 500',
        pricePrefix: { en: 'from', ru: 'от', he: 'מ-' },
      },
      {
        name: {
          en: 'Multi-page product site',
          ru: 'Многостраничный сайт продукта',
          he: 'אתר מוצר רב-עמודי',
        },
        price: '7 500',
        pricePrefix: { en: 'from', ru: 'от', he: 'מ-' },
      },
      {
        name: {
          en: 'CMS-powered site',
          ru: 'Сайт на CMS',
          he: 'אתר מבוסס CMS',
        },
        price: '9 500',
        pricePrefix: { en: 'from', ru: 'от', he: 'מ-' },
      },
    ],
  },
  {
    id: '3',
    slug: 'management',
    title: {
      en: 'Management',
      ru: 'Управление',
      he: 'ניהול',
    },
    hero: { type: 'image', src: '/images/service_management.webp' },
    summary: {
      en: 'Infrastructure and admin so the product stays publishable and scalable.',
      ru: 'Инфраструктура и админка, чтобы продукт оставался управляемым и масштабируемым.',
      he: 'תשתית ואדמין כדי שהמוצר יישאר ניתן לפרסום ולצמיחה.',
    },
    description: {
      en: [
        'From DNS and launch to CMS, APIs, and custom admin panels — we set up the operational layer behind the site.',
        'Structures are built to grow: clear content models, integrations, and SEO plumbing that editors can keep running.',
      ],
      ru: [
        'От DNS и запуска до CMS, API и кастомных админок — поднимаем операционный слой за сайтом.',
        'Структуры рассчитаны на рост: понятные модели контента, интеграции и SEO, с которыми удобно жить редакторам.',
      ],
      he: [
        'מ-DNS והשקה ועד CMS, API ולוחות ניהול מותאמים — מקימים את שכבת התפעול מאחורי האתר.',
        'המבנים בנויים לצמיחה: מודלי תוכן ברורים, אינטגרציות ו-SEO שעורכים יכולים להמשיך לנהל.',
      ],
    },
    features: {
      en: [
        'SEO optimization',
        'Custom back-end & Admin Panels',
        'DNS setup & launch',
        'Scalable Structure',
        'API Integrations',
        'CMS',
      ],
      ru: [
        'SEO-оптимизация',
        'Кастомный бэкенд и админ-панели',
        'Настройка DNS и запуск',
        'Масштабируемая структура',
        'Интеграция API',
        'CMS',
      ],
      he: [
        'אופטימיזציית SEO',
        'ממשק ניהול וצד אחורי מותאם אישית',
        'הגדרה והשקה של DNS',
        'מבנה בעל יכולת הרחבה',
        'אינטגרציית API',
        'מערכות ניהול תוכן CMS',
      ],
    },
    offerings: [
      {
        name: {
          en: 'Launch & DNS setup',
          ru: 'Запуск и DNS',
          he: 'השקה והגדרת DNS',
        },
        price: '800',
        pricePrefix: { en: 'from', ru: 'от', he: 'מ-' },
      },
      {
        name: {
          en: 'CMS & content model',
          ru: 'CMS и модель контента',
          he: 'CMS ומודל תוכן',
        },
        price: '4 000',
        pricePrefix: { en: 'from', ru: 'от', he: 'מ-' },
      },
      {
        name: {
          en: 'Admin & API integrations',
          ru: 'Админка и API-интеграции',
          he: 'אדמין ואינטגרציות API',
        },
        price: '6 500',
        pricePrefix: { en: 'from', ru: 'от', he: 'מ-' },
      },
    ],
  },
  {
    id: '4',
    slug: 'ai-automation',
    title: {
      en: 'AI & Automation',
      ru: 'ИИ и автоматизация',
      he: 'בינה מלאכותית ואוטומציה',
    },
    hero: { type: 'image', src: '/images/service_ai_automation.webp' },
    summary: {
      en: 'Agents and workflows that remove busywork and move leads to the next step.',
      ru: 'Агенты и сценарии, которые снимают рутину и двигают лиды дальше по воронке.',
      he: 'סוכנים ותהליכים שמסירים עבודה ידנית ומקדמים לידים לשלב הבא.',
    },
    description: {
      en: [
        'We design AI agents and automation pipelines — from lead scoring and booking to chat and voice — wired into the tools you already use.',
        'The goal is measurable outcomes: fewer handoffs, faster response, clearer CRM state.',
      ],
      ru: [
        'Проектируем ИИ-агентов и пайплайны автоматизации — от скоринга и записи до чата и голоса — с привязкой к вашим текущим инструментам.',
        'Цель измерима: меньше ручных передач, быстрее ответ, понятнее состояние CRM.',
      ],
      he: [
        'מתכננים סוכני AI וצינורות אוטומציה — מניקוד לידים וזימון ועד צ׳אט וקול — מחוברים לכלים שכבר בשימוש.',
        'המטרה מדידה: פחות העברות ידניות, תגובה מהירה יותר, מצב CRM ברור יותר.',
      ],
    },
    features: {
      en: ['AI agents', 'Automation process', 'Chat bot', 'Voice assistance'],
      ru: ['ИИ-агенты', 'Автоматизация процессов', 'Чат-боты', 'Голосовые ассистенты'],
      he: ['סוכני AI', 'תהליכי אוטומציה', "צ'אטבוט", 'סיוע קולי'],
    },
    offerings: [
      {
        name: {
          en: 'Single automation flow',
          ru: 'Один сценарий автоматизации',
          he: 'תהליך אוטומציה בודד',
        },
        price: '2 000',
        pricePrefix: { en: 'from', ru: 'от', he: 'מ-' },
      },
      {
        name: {
          en: 'Lead agent + CRM',
          ru: 'Агент лидов + CRM',
          he: 'סוכן לידים + CRM',
        },
        price: '5 500',
        pricePrefix: { en: 'from', ru: 'от', he: 'מ-' },
      },
      {
        name: {
          en: 'Chat / voice assistant',
          ru: 'Чат / голосовой ассистент',
          he: 'עוזר צ׳אט / קולי',
        },
        price: '4 500',
        pricePrefix: { en: 'from', ru: 'от', he: 'מ-' },
      },
    ],
  },
]

export function getServicePage(slug: string): ServicePage | undefined {
  return SERVICE_PAGES.find((page) => page.slug === slug)
}

export function getAllServiceSlugs(): string[] {
  return SERVICE_PAGES.map((page) => page.slug)
}

export function getServiceSlugById(id: string): string | undefined {
  return SERVICE_ID_TO_SLUG[id]
}

export function tLocale(field: LocaleMap, locale: string): string {
  return field[locale] || field.en || Object.values(field)[0] || ''
}

export function tLocaleList(field: LocaleListMap, locale: string): string[] {
  return field[locale] || field.en || Object.values(field)[0] || []
}
