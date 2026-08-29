export type Localized = { en: string; ru: string; he: string }

export type AuditTabId = 'audit' | 'how' | 'pricing'

export function tAudit(field: Localized, locale: string): string {
  return field[locale as keyof Localized] || field.en
}

export const auditPage = {
  slug: 'audit',
  title: {
    en: 'AI Audit',
    ru: 'AI Аудит',
    he: 'ביקורת AI',
  } satisfies Localized,
  metaDescription: {
    en: 'Free commercial website audit: speed, forms, SEO, security, and AI readiness. Clear score, top issues, and a full PDF report when you need it.',
    ru: 'Бесплатный коммерческий аудит сайта: скорость, формы, SEO, безопасность и готовность к AI. Понятная оценка, главные проблемы и полный PDF-отчёт.',
    he: 'ביקורת מסחרית חינמית לאתר: מהירות, טפסים, SEO, אבטחה ומוכנות ל-AI. ציון ברור, בעיות מרכזיות ודוח PDF מלא.',
  } satisfies Localized,
  tabs: {
    audit: {
      en: 'AI Audit',
      ru: 'AI Аудит',
      he: 'ביקורת AI',
    } satisfies Localized,
    how: {
      en: 'How it works',
      ru: 'Как это работает',
      he: 'איך זה עובד',
    } satisfies Localized,
    pricing: {
      en: 'Pricing',
      ru: 'Цены',
      he: 'מחירים',
    } satisfies Localized,
  },
  form: {
    heading: {
      en: 'Free website audit',
      ru: 'Бесплатный аудит сайта',
      he: 'ביקורת אתר בחינם',
    } satisfies Localized,
    intro: {
      en: 'Enter your site URL, contacts, and preferred report language. We run a commercial QA audit of speed, lead forms, SEO basics, security, and AI readiness — then send a clear report with the main growth opportunities and issues.',
      ru: 'Укажите URL сайта, контакты и язык отчёта. Мы проведём коммерческий QA-аудит: скорость, формы заявок, SEO-база, безопасность и готовность к AI — и пришлём понятный отчёт с ключевыми точками роста и найденными проблемами.',
      he: 'הזינו כתובת אתר, פרטי קשר ושפת דוח. נריץ ביקורת QA מסחרית: מהירות, טפסי לידים, בסיס SEO, אבטחה ומוכנות ל-AI — ונשלח דוח ברור עם נקודות צמיחה ובעיות שזוהו.',
    } satisfies Localized,
    introNote: {
      en: 'Free preview audit: one domain per user every 48 hours.',
      ru: 'Бесплатный превью-аудит: один домен на пользователя раз в 48 часов.',
      he: 'ביקורת תצוגה מקדימה חינמית: דומיין אחד למשתמש פעם ב-48 שעות.',
    } satisfies Localized,
    requiredNote: {
      en: 'Required field',
      ru: 'Обязательное поле',
      he: 'שדה חובה',
    } satisfies Localized,
    website: {
      en: 'Website URL',
      ru: 'Адрес сайта',
      he: 'כתובת אתר',
    } satisfies Localized,
    websitePlaceholder: {
      en: 'example.com',
      ru: 'example.com',
      he: 'example.com',
    } satisfies Localized,
    websiteInvalid: {
      en: 'Enter a valid domain or URL',
      ru: 'Введите корректный домен или URL',
      he: 'הזינו דומיין או כתובת URL תקינים',
    } satisfies Localized,
    auditLanguage: {
      en: 'Audit report language',
      ru: 'Язык отчёта аудита',
      he: 'שפת דוח הביקורת',
    } satisfies Localized,
    auditLanguageOptions: {
      en: { en: 'English', ru: 'Английский', he: 'אנגלית' },
      ru: { en: 'Russian', ru: 'Русский', he: 'רוסית' },
      he: { en: 'Hebrew', ru: 'Иврит', he: 'עברית' },
    },
    submit: {
      en: 'Request free audit',
      ru: 'Заказать бесплатный аудит',
      he: 'בקשת ביקורת חינם',
    } satisfies Localized,
    success: {
      en: 'Thank you! We will run your audit and contact you shortly.',
      ru: 'Спасибо! Мы проведём аудит и свяжемся с вами в ближайшее время.',
      he: 'תודה! נריץ את הביקורת וניצור איתכם קשר בהקדם.',
    } satisfies Localized,
  },
  how: {
    heroTitle: {
      en: 'How the audit works',
      ru: 'Как работает аудит',
      he: 'איך עובדת הביקורת',
    } satisfies Localized,
    heroIntro: {
      en: 'We run a commercial QA audit of your website: speed and mobile UX, lead forms, SEO basics, security, and technical readiness for AI assistants. You get a clear score and the issues that cost you leads and visibility.',
      ru: 'Мы проводим коммерческий QA-аудит сайта: скорость и мобильный UX, формы заявок, SEO-база, безопасность и техническая готовность к AI-ассистентам. Вы получаете понятную оценку и список проблем, которые мешают заявкам и видимости.',
      he: 'אנחנו מבצעים ביקורת QA מסחרית לאתר: מהירות ו-UX למובייל, טפסי לידים, בסיס SEO, אבטחה ומוכנות טכנית לעוזרי AI. אתם מקבלים ציון ברור ואת הבעיות שפוגעות בלידים ובנראות.',
    } satisfies Localized,
    stepsHeading: {
      en: 'Three steps to a clear picture',
      ru: 'Три шага к понятной картине',
      he: 'שלושה שלבים לתמונה ברורה',
    } satisfies Localized,
    steps: [
      {
        label: { en: 'Step 1', ru: 'Шаг 1', he: 'שלב 1' } satisfies Localized,
        title: {
          en: 'Send us your URL',
          ru: 'Отправьте URL сайта',
          he: 'שלחו לנו את כתובת האתר',
        } satisfies Localized,
        body: {
          en: 'Leave the domain, contacts, and report language. No card needed for the free preview.',
          ru: 'Укажите домен, контакты и язык отчёта. Для бесплатного превью карта не нужна.',
          he: 'השאירו דומיין, פרטי קשר ושפת דוח. לתצוגה מקדימה חינמית לא נדרש כרטיס.',
        } satisfies Localized,
      },
      {
        label: { en: 'Step 2', ru: 'Шаг 2', he: 'שלב 2' } satisfies Localized,
        title: {
          en: 'We check key pages and ~60 checks',
          ru: 'Проверяем ключевые страницы и ~60 пунктов',
          he: 'בודקים עמודים מרכזיים ו-~60 בדיקות',
        } satisfies Localized,
        body: {
          en: 'We open the homepage and up to 5 sales-critical pages (contacts, services, pricing), measure mobile speed, forms, SEO basics, security headers, and AI-readiness signals like llms.txt and schema.',
          ru: 'Открываем главную и до 5 коммерчески важных страниц (контакты, услуги, цены), замеряем мобильную скорость, формы, SEO-базу, security-заголовки и сигналы готовности к AI — llms.txt, schema и доступ для AI-ботов.',
          he: 'פותחים את דף הבית ועד 5 עמודים מסחריים חשובים (יצירת קשר, שירותים, מחירים), מודדים מהירות במובייל, טפסים, בסיס SEO, כותרות אבטחה ואותות מוכנות ל-AI כמו llms.txt ו-schema.',
        } satisfies Localized,
      },
      {
        label: { en: 'Step 3', ru: 'Шаг 3', he: 'שלב 3' } satisfies Localized,
        title: {
          en: 'You get a score and next steps',
          ru: 'Вы получаете оценку и следующие шаги',
          he: 'מקבלים ציון וצעדים הבאים',
        } satisfies Localized,
        body: {
          en: 'Score 0–100 with a letter grade, top conversion risks, and recommendations. The free preview shows the essentials; paid plans unlock the full PDF with every finding and fix plan.',
          ru: 'Оценка 0–100 с буквенным грейдом, топ рисков для заявок и рекомендации. В бесплатном превью — главное; в платных тарифах — полный PDF со всеми находками и планом правок.',
          he: 'ציון 0–100 עם דרגה, סיכוני המרה עיקריים והמלצות. בתצוגה מקדימה חינמית — העיקר; בחבילות בתשלום — PDF מלא עם כל הממצאים ותוכנית תיקון.',
        } satisfies Localized,
      },
    ],
    methodologyTitle: {
      en: 'Five scales behind your score',
      ru: 'Пять шкал вашей оценки',
      he: 'חמש סקאלות מאחורי הציון',
    } satisfies Localized,
    methodologyIntro: {
      en: 'The overall score is weighted by business impact: what slows the site, blocks leads, hurts search, creates risk, or leaves the brand invisible to AI tools.',
      ru: 'Итоговый балл взвешен по влиянию на бизнес: что тормозит сайт, ломает заявки, мешает поиску, создаёт риски и делает бренд «невидимым» для AI-инструментов.',
      he: 'הציון הכולל משוקלל לפי השפעה עסקית: מה מאט את האתר, חוסם לידים, פוגע בחיפוש, יוצר סיכון או משאיר את המותג בלתי נראה לכלי AI.',
    } satisfies Localized,
    pillars: [
      {
        title: {
          en: 'Speed & mobile UX',
          ru: 'Скорость и мобильный UX',
          he: 'מהירות ו-UX למובייל',
        } satisfies Localized,
        body: {
          en: 'PageSpeed (mobile/desktop), TTFB, horizontal overflow on phones, and mobile layout issues.',
          ru: 'PageSpeed (mobile/desktop), TTFB, горизонтальный скролл на смартфоне и проблемы мобильной вёрстки.',
          he: 'PageSpeed (מובייל/דסקטופ), TTFB, גלילה אופקית בטלפון ובעיות פריסה במובייל.',
        } satisfies Localized,
      },
      {
        title: {
          en: 'Lead gen & forms',
          ru: 'Лиды и формы',
          he: 'לידים וטפסים',
        } satisfies Localized,
        body: {
          en: 'Contact forms, spam protection, chat/messengers, and JS errors that break the funnel.',
          ru: 'Формы заявок, защита от спама, чат/мессенджеры и JS-ошибки, которые ломают воронку.',
          he: 'טפסי יצירת קשר, הגנה מספאם, צ׳אט/מסרים ושגיאות JS ששוברות את המשפך.',
        } satisfies Localized,
      },
      {
        title: {
          en: 'SEO & previews',
          ru: 'SEO и превью',
          he: 'SEO ותצוגות מקדימות',
        } satisfies Localized,
        body: {
          en: 'robots.txt, sitemap, canonical, Open Graph for messengers, favicon, and broken key pages.',
          ru: 'robots.txt, sitemap, canonical, Open Graph для мессенджеров, favicon и битые ключевые страницы.',
          he: 'robots.txt, sitemap, canonical, Open Graph למסרים, favicon ועמודים מרכזיים שבורים.',
        } satisfies Localized,
      },
      {
        title: {
          en: 'Security & stability',
          ru: 'Безопасность и стабильность',
          he: 'אבטחה ויציבות',
        } satisfies Localized,
        body: {
          en: 'HTTPS, key security headers, server response, and runtime JS/network errors.',
          ru: 'HTTPS, ключевые security-заголовки, отклик сервера и runtime-ошибки JS/сети.',
          he: 'HTTPS, כותרות אבטחה מרכזיות, תגובת שרת ושגיאות JS/רשת בזמן ריצה.',
        } satisfies Localized,
      },
      {
        title: {
          en: 'AI readiness',
          ru: 'Готовность к AI',
          he: 'מוכנות ל-AI',
        } satisfies Localized,
        body: {
          en: 'llms.txt, schema/Organization, AI-bot access in robots, brand/about page, analytics readiness — so assistants can understand your business.',
          ru: 'llms.txt, schema/Organization, доступ AI-ботов в robots, страница о компании, готовность аналитики — чтобы ассистенты могли понять ваш бизнес.',
          he: 'llms.txt, schema/Organization, גישת בוטי AI ב-robots, עמוד אודות, מוכנות אנליטיקה — כדי שעוזרים יוכלו להבין את העסק.',
        } satisfies Localized,
      },
    ],
    categoriesTitle: {
      en: 'What we actually check',
      ru: 'Что именно проверяем',
      he: 'מה אנחנו בודקים בפועל',
    } satisfies Localized,
    categoriesIntro: {
      en: 'About 55–60 technical checks across the site and languages. The score is transparent: every finding maps to a concrete check.',
      ru: 'Около 55–60 технических проверок по сайту и языковым версиям. Оценка прозрачна: каждая находка привязана к конкретной проверке.',
      he: 'כ-55–60 בדיקות טכניות באתר ובשפות. הציון שקוף: כל ממצא מקושר לבדיקה קונקרטית.',
    } satisfies Localized,
    categories: [
      {
        en: 'Mobile layout & RTL — overflow, dir=rtl, basic accessibility',
        ru: 'Мобильная вёрстка и RTL — overflow, dir=rtl, базовая доступность',
        he: 'פריסת מובייל ו-RTL — overflow, dir=rtl, נגישות בסיסית',
      },
      {
        en: 'Forms & lead capture — fields, submit, anti-spam, chat widgets',
        ru: 'Формы и захват лидов — поля, отправка, антиспам, чат-виджеты',
        he: 'טפסים ולידים — שדות, שליחה, אנטי-ספאם, ווידג׳טי צ׳אט',
      },
      {
        en: 'SEO basics — robots, sitemap, canonical, Open Graph, icons',
        ru: 'SEO-база — robots, sitemap, canonical, Open Graph, иконки',
        he: 'בסיס SEO — robots, sitemap, canonical, Open Graph, אייקונים',
      },
      {
        en: 'Speed — Google PageSpeed mobile & desktop, TTFB',
        ru: 'Скорость — Google PageSpeed mobile и desktop, TTFB',
        he: 'מהירות — Google PageSpeed מובייל ודסקטופ, TTFB',
      },
      {
        en: 'Security — HTTPS and headers (HSTS, CSP, XFO, and more)',
        ru: 'Безопасность — HTTPS и заголовки (HSTS, CSP, XFO и др.)',
        he: 'אבטחה — HTTPS וכותרות (HSTS, CSP, XFO ועוד)',
      },
      {
        en: 'AI readiness — llms.txt, MCP/schema, AI bots in robots, brand facts',
        ru: 'Готовность к AI — llms.txt, MCP/schema, AI-боты в robots, факты о бренде',
        he: 'מוכנות ל-AI — llms.txt, MCP/schema, בוטי AI ב-robots, עובדות מותג',
      },
    ] satisfies Localized[],
    principlesTitle: {
      en: 'What makes this audit useful',
      ru: 'Чем полезен этот аудит',
      he: 'למה הביקורת הזו שימושית',
    } satisfies Localized,
    principles: [
      {
        title: {
          en: 'Business language, not jargon',
          ru: 'Язык бизнеса, не жаргон',
          he: 'שפת עסקים, לא ז׳רגון',
        } satisfies Localized,
        body: {
          en: 'We translate technical issues into lost leads, ad waste, and trust risks — so you know what to fix first.',
          ru: 'Переводим технические проблемы в потерянные заявки, слив рекламы и риски доверия — чтобы было ясно, что чинить в первую очередь.',
          he: 'מתרגמים בעיות טכניות ללידים שאבדו, בזבוז פרסום וסיכוני אמון — כדי לדעת מה לתקן קודם.',
        } satisfies Localized,
      },
      {
        title: {
          en: 'AI readiness, not fake “ChatGPT checks”',
          ru: 'Готовность к AI, без ложных «проверок ChatGPT»',
          he: 'מוכנות ל-AI, בלי “בדיקות ChatGPT” מזויפות',
        } satisfies Localized,
        body: {
          en: 'We do not claim live citations in ChatGPT. We check whether your site is technically ready for AI crawlers and assistants.',
          ru: 'Мы не обещаем «живые цитаты» из ChatGPT. Проверяем, готов ли сайт технически для AI-краулеров и ассистентов.',
          he: 'אנחנו לא טוענים לציטוטים חיים ב-ChatGPT. בודקים אם האתר מוכן טכנית לזחלני AI ולעוזרים.',
        } satisfies Localized,
      },
      {
        title: {
          en: 'Clear next steps',
          ru: 'Понятные следующие шаги',
          he: 'צעדים הבאים ברורים',
        } satisfies Localized,
        body: {
          en: 'Top risks come with impact and recommended fixes. Full plans add a complete PDF and a path to implementation with our team.',
          ru: 'Топ-риски — с влиянием и рекомендованными правками. Полные тарифы дают полный PDF и путь к внедрению вместе с нашей командой.',
          he: 'הסיכונים העיקריים מגיעים עם השפעה ותיקונים מומלצים. בחבילות המלאות — PDF מלא ונתיב ליישום עם הצוות שלנו.',
        } satisfies Localized,
      },
    ],
    cta: {
      en: 'Request your free audit',
      ru: 'Заказать бесплатный аудит',
      he: 'בקשת ביקורת חינם',
    } satisfies Localized,
  },
  pricing: {
    kicker: {
      en: 'Plans & pricing',
      ru: 'Тарифы и цены',
      he: 'חבילות ומחירים',
    } satisfies Localized,
    title: {
      en: 'Pick the right plan for you',
      ru: 'Выберите подходящий тариф',
      he: 'בחרו את החבילה המתאימה',
    } satisfies Localized,
    intro: {
      en: 'Start with a free preview of your score and top issues. Upgrade for the full PDF, action plan, or hand the fixes to us.',
      ru: 'Начните с бесплатного превью: оценка и главные проблемы. Полный PDF и план правок — в платных тарифах, либо передайте внедрение нам.',
      he: 'התחילו בתצוגה מקדימה חינמית: ציון ובעיות עיקריות. PDF מלא ותוכנית תיקון — בחבילות בתשלום, או תעבירו את היישום אלינו.',
    } satisfies Localized,
    footnote: {
      en: 'Secure payments · Cancel anytime · Reports in RU / EN / HE',
      ru: 'Безопасная оплата · Отмена в любой момент · Отчёты на RU / EN / HE',
      he: 'תשלום מאובטח · ביטול בכל עת · דוחות ב-RU / EN / HE',
    } satisfies Localized,
    agency: {
      en: 'Need audits for 10+ domains or run an agency?',
      ru: 'Нужен аудит для 10+ доменов или агентство?',
      he: 'צריכים ביקורות ל-10+ דומיינים או סוכנות?',
    } satisfies Localized,
    agencyCta: {
      en: 'Contact us for an agency plan',
      ru: 'Связаться по агентскому тарифу',
      he: 'צרו קשר לחבילת סוכנות',
    } satisfies Localized,
    plans: [
      {
        id: 'free',
        badge: null,
        name: { en: 'Free', ru: 'Бесплатно', he: 'חינם' } satisfies Localized,
        price: { en: '₪0', ru: '₪0', he: '₪0' } satisfies Localized,
        priceNote: {
          en: 'no card required',
          ru: 'карта не нужна',
          he: 'ללא כרטיס',
        } satisfies Localized,
        description: {
          en: 'Preview of your site’s health.',
          ru: 'Превью состояния сайта.',
          he: 'תצוגה מקדימה של מצב האתר.',
        } satisfies Localized,
        features: [
          {
            en: 'Homepage + key funnel pages (up to 5)',
            ru: 'Главная и ключевые страницы воронки (до 5)',
            he: 'דף הבית ועמודי משפך מרכזיים (עד 5)',
          },
          {
            en: 'Score 0–100 across 5 business scales',
            ru: 'Оценка 0–100 по 5 бизнес-шкалам',
            he: 'ציון 0–100 ב-5 סקאלות עסקיות',
          },
          {
            en: 'Top 3 conversion / visibility risks',
            ru: 'Топ-3 риска для заявок и видимости',
            he: '3 סיכונים עיקריים ללידים ולנראות',
          },
          {
            en: 'Preview report (essentials unlocked)',
            ru: 'Превью-отчёт (основные блоки открыты)',
            he: 'דוח תצוגה מקדימה (הבלוקים העיקריים פתוחים)',
          },
        ] satisfies Localized[],
        cta: {
          en: 'Get started',
          ru: 'Начать сейчас',
          he: 'להתחיל עכשיו',
        } satisfies Localized,
        ctaHref: '/order/audit-free',
      },
      {
        id: 'diagnostic',
        badge: null,
        name: { en: 'Diagnostic', ru: 'Диагностика', he: 'אבחון' } satisfies Localized,
        price: { en: '₪99', ru: '₪99', he: '₪99' } satisfies Localized,
        priceCompare: { en: '₪290', ru: '₪290', he: '₪290' } satisfies Localized,
        priceNote: {
          en: 'one-time · promo price',
          ru: 'разово · промо',
          he: 'חד-פעמי · מחיר מבצע',
        } satisfies Localized,
        description: {
          en: 'Full PDF report, one-time.',
          ru: 'Полный PDF-отчёт, разово.',
          he: 'דוח PDF מלא, חד-פעמי.',
        } satisfies Localized,
        features: [
          {
            en: 'Everything in Free, plus:',
            ru: 'Всё из Free, плюс:',
            he: 'הכל מ-Free, ובנוסף:',
          },
          {
            en: 'Full checklist of ~60 checks unlocked',
            ru: 'Полный чеклист из ~60 проверок',
            he: 'צ׳ק-ליסט מלא של ~60 בדיקות',
          },
          {
            en: 'Mobile + desktop PageSpeed details',
            ru: 'PageSpeed mobile и desktop подробно',
            he: 'פרטי PageSpeed למובייל ולדסקטופ',
          },
          {
            en: 'Priority fix plan with clear next steps',
            ru: 'Приоритетный план правок с понятными шагами',
            he: 'תוכנית תיקון לפי עדיפות עם צעדים ברורים',
          },
          {
            en: 'PDF report in RU / EN / HE',
            ru: 'PDF-отчёт на RU / EN / HE',
            he: 'דוח PDF ב-RU / EN / HE',
          },
        ] satisfies Localized[],
        cta: {
          en: 'Get started',
          ru: 'Начать сейчас',
          he: 'להתחיל עכשיו',
        } satisfies Localized,
        ctaHref: '/order/audit-diagnostic',
      },
      {
        id: 'pro',
        badge: null,
        name: { en: 'Pro', ru: 'Pro', he: 'Pro' } satisfies Localized,
        price: { en: '₪490', ru: '₪490', he: '₪490' } satisfies Localized,
        priceNote: {
          en: '/ month',
          ru: '/ мес',
          he: '/ חודש',
        } satisfies Localized,
        description: {
          en: 'Monthly re-audit and support.',
          ru: 'Ежемесячный повторный аудит и поддержка.',
          he: 'ביקורת חוזרת חודשית ותמיכה.',
        } satisfies Localized,
        features: [
          {
            en: 'Everything in Diagnostic, plus:',
            ru: 'Всё из Diagnostic, плюс:',
            he: 'הכל מ-Diagnostic, ובנוסף:',
          },
          {
            en: 'Monthly re-run of the full audit',
            ru: 'Ежемесячный повтор полного аудита',
            he: 'הרצה חוזרת חודשית של הביקורת המלאה',
          },
          {
            en: 'Score trend vs previous month',
            ru: 'Динамика оценки к прошлому месяцу',
            he: 'מגמת ציון מול החודש הקודם',
          },
          {
            en: 'Extra recheck after your fixes',
            ru: 'Дополнительная перепроверка после ваших правок',
            he: 'בדיקה חוזרת נוספת אחרי התיקונים שלכם',
          },
          {
            en: 'Priority support (<24h response)',
            ru: 'Приоритетная поддержка (<24 ч)',
            he: 'תמיכה בעדיפות (<24 שעות)',
          },
        ] satisfies Localized[],
        cta: {
          en: 'Get started',
          ru: 'Начать сейчас',
          he: 'להתחיל עכשיו',
        } satisfies Localized,
        ctaHref: '/order/audit-pro',
      },
      {
        id: 'delegate',
        badge: null,
        name: { en: 'Delegate', ru: 'Делегат', he: 'דלגט' } satisfies Localized,
        price: { en: '₪1990+', ru: '₪1990+', he: '₪1990+' } satisfies Localized,
        features: [
          {
            en: 'Full audit + 45-minute call',
            ru: 'Полный аудит + созвон 45 минут',
            he: 'ביקורת מלאה + שיחה של 45 דקות',
          },
          {
            en: 'Priority roadmap we own with you',
            ru: 'Приоритетная дорожная карта вместе с вами',
            he: 'מפת דרכים בעדיפות יחד איתכם',
          },
          {
            en: '30 days of implementation support',
            ru: '30 дней поддержки внедрения',
            he: '30 ימי תמיכה ביישום',
          },
          {
            en: 'Content & UX fixes (optional)',
            ru: 'Правки контента и UX (опционально)',
            he: 'תיקוני תוכן ו-UX (אופציונלי)',
          },
          {
            en: 'Ongoing optimization (optional)',
            ru: 'Постоянная оптимизация (опционально)',
            he: 'אופטימיזציה מתמשכת (אופציונלי)',
          },
        ] satisfies Localized[],
        cta: {
          en: 'Talk to us',
          ru: 'Поговорите с нами',
          he: 'דברו איתנו',
        } satisfies Localized,
        ctaHref: '/contacts',
      },
    ],
  },
} as const
