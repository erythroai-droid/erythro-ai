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
    en: 'Free commercial website audit: Speed & Mobile UX, lead forms, SEO & Visibility, security, and AI Visibility. Score 0–100, top-3 risks, PDF by plan.',
    ru: 'Бесплатный коммерческий аудит сайта: скорость и мобильный UX, формы, SEO и видимость, безопасность и AI Visibility. Оценка 0–100, топ-3 риска, PDF по тарифу.',
    he: 'ביקורת מסחרית חינמית לאתר: מהירות ו-UX למובייל, טפסים, SEO ונראות, אבטחה ונראות AI. ציון 0–100, 3 סיכונים עיקריים, PDF לפי חבילה.',
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
      en: 'Enter your site URL, contacts, and preferred report language. The lab scores five scales — Speed & Mobile UX, Lead gen & Forms, SEO & Visibility, Security & Stability, AI Visibility & Brand Discovery — then we send a report with the score, top-3 risks, and what your plan unlocks.',
      ru: 'Укажите URL сайта, контакты и язык отчёта. Лаборатория считает пять шкал — скорость и мобильный UX, лиды и формы, SEO и видимость, безопасность и стабильность, AI Visibility & Brand Discovery — и мы пришлём отчёт с оценкой, топ-3 рисками и тем, что открывает ваш тариф.',
      he: 'הזינו כתובת אתר, פרטי קשר ושפת דוח. המעבדה מחשבת חמש סקאלות — מהירות ו-UX למובייל, לידים וטפסים, SEO ונראות, אבטחה ויציבות, נראות AI וגילוי מותג — ונשלח דוח עם הציון, 3 הסיכונים העיקריים ומה שהחבילה שלכם פותחת.',
    } satisfies Localized,
    introNote: {
      en: 'Free preview audit: one domain per user every 5 days.',
      ru: 'Бесплатный превью-аудит: один домен на пользователя раз в 5 дней.',
      he: 'ביקורת תצוגה מקדימה חינמית: דומיין אחד למשתמש פעם ב-5 ימים.',
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
    kicker: {
      en: 'Lab protocol',
      ru: 'Протокол лаборатории',
      he: 'פרוטוקול המעבדה',
    } satisfies Localized,
    heroTitle: {
      en: 'How the audit works',
      ru: 'Как работает аудит',
      he: 'איך עובדת הביקורת',
    } satisfies Localized,
    heroIntro: {
      en: 'The lab runs a commercial QA audit on five scorecard scales: Speed & Mobile UX, Lead gen & Forms, SEO & Visibility, Security & Stability, and AI Visibility & Brand Discovery. You get a 0–100 score with a letter grade (A+–F) and the issues that cost you leads and visibility.',
      ru: 'Лаборатория проводит коммерческий QA-аудит по пяти шкалам scorecard: скорость и мобильный UX, лиды и формы, SEO и видимость, безопасность и стабильность, AI Visibility & Brand Discovery. Вы получаете оценку 0–100 с грейдом (A+–F) и проблемы, которые мешают заявкам и видимости.',
      he: 'המעבדה מבצעת ביקורת QA מסחרית בחמש סקאלות: מהירות ו-UX למובייל, לידים וטפסים, SEO ונראות, אבטחה ויציבות, נראות AI וגילוי מותג. אתם מקבלים ציון 0–100 עם דרגה (A+–F) ואת הבעיות שפוגעות בלידים ובנראות.',
    } satisfies Localized,
    stats: [
      {
        en: '60+ signal types',
        ru: '60+ типов сигналов',
        he: '60+ סוגי אותות',
      },
      {
        en: '5 scorecard scales',
        ru: '5 шкал scorecard',
        he: '5 סקאלות scorecard',
      },
      {
        en: 'EN · RU · HE',
        ru: 'EN · RU · HE',
        he: 'EN · RU · HE',
      },
      {
        en: 'Lighthouse × 2',
        ru: 'Lighthouse × 2',
        he: 'Lighthouse × 2',
      },
      {
        en: 'Up to 10 funnel URLs',
        ru: 'До 10 URL воронки',
        he: 'עד 10 כתובות משפך',
      },
    ] satisfies Localized[],
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
          en: 'The lab runs 60+ checks and the funnel',
          ru: 'Лаборатория снимает 60+ проверок и воронку',
          he: 'המעבדה מריצה 60+ בדיקות ואת המשפך',
        } satisfies Localized,
        body: {
          en: 'The lab crawls the homepage and commercially important pages from sitemap and nav (contacts, services, portfolio, pricing) — up to 10 URLs. Locales EN / RU / HE. Mobile at iPhone SE 375×667. PageSpeed (mobile + desktop), forms, SEO, security headers, AI Visibility, Agent Readiness, and LanguageTool spelling on EN/RU.',
          ru: 'Лаборатория обходит главную и коммерчески важные страницы из sitemap и навигации (контакты, услуги, портфолио, цены) — до 10 URL. Локали EN / RU / HE. Мобильная вёрстка — iPhone SE 375×667. PageSpeed (mobile + desktop), формы, SEO, security-заголовки, AI Visibility, Agent Readiness и орфография LanguageTool на EN/RU.',
          he: 'המעבדה סורקת את דף הבית ועמודים מסחריים מ-sitemap ומהניווט (יצירת קשר, שירותים, פורטפוליו, מחירים) — עד 10 כתובות. שפות EN / RU / HE. מובייל ב-iPhone SE 375×667. PageSpeed (מובייל + דסקטופ), טפסים, SEO, כותרות אבטחה, נראות AI, Agent Readiness ואיות LanguageTool ב-EN/RU.',
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
          en: 'Score 0–100 with a letter grade (A+–F) and the top-3 conversion risks. Free preview: scorecard, top-3, and Lighthouse. Diagnostic unlocks summary cards and up to 5 funnel URLs. Pro unlocks up to 10 URLs, the full 60+ checklist, and the fix plan.',
          ru: 'Оценка 0–100 с грейдом (A+–F) и топ-3 уязвимости конверсии. Бесплатное превью: scorecard, топ-3 и Lighthouse. Diagnostic открывает сводные карточки и до 5 URL воронки. Pro — до 10 URL, полный чеклист 60+ и план правок.',
          he: 'ציון 0–100 עם דרגה (A+–F) ו-3 סיכוני המרה עיקריים. תצוגה מקדימה חינם: scorecard, טופ-3 ו-Lighthouse. Diagnostic פותח כרטיסי סיכום ועד 5 כתובות משפך. Pro — עד 10 כתובות, צ׳ק-ליסט 60+ מלא ותוכנית תיקון.',
        } satisfies Localized,
      },
    ],
    methodologyTitle: {
      en: 'Five scales behind your score',
      ru: 'Пять шкал вашей оценки',
      he: 'חמש סקאלות מאחורי הציון',
    } satisfies Localized,
    weightNote: {
      en: 'of the score',
      ru: 'веса оценки',
      he: 'מהציון',
    } satisfies Localized,
    methodologyIntro: {
      en: 'The overall score is weighted by business impact: what slows the site, blocks leads, hurts search, creates risk, or leaves the brand invisible to AI tools. The five scales summarise the lab — they are not the whole protocol.',
      ru: 'Итоговый балл взвешен по влиянию на бизнес: что тормозит сайт, ломает заявки, мешает поиску, создаёт риски и делает бренд «невидимым» для AI-инструментов. Пять шкал — это свод лаборатории, а не весь протокол.',
      he: 'הציון הכולל משוקלל לפי השפעה עסקית: מה מאט את האתר, חוסם לידים, פוגע בחיפוש, יוצר סיכון או משאיר את המותג בלתי נראה לכלי AI. חמש הסקאלות מסכמות את המעבדה — הן לא כל הפרוטוקול.',
    } satisfies Localized,
    pillars: [
      {
        weight: '27%',
        title: {
          en: 'Speed & Mobile UX',
          ru: 'Скорость и мобильный UX',
          he: 'מהירות ו-UX למובייל',
        } satisfies Localized,
        body: {
          en: 'Google PageSpeed (mobile + desktop), TTFB, horizontal overflow at iPhone SE 375×667, and mobile layout issues.',
          ru: 'Google PageSpeed (mobile + desktop), TTFB, горизонтальный overflow на iPhone SE 375×667 и проблемы мобильной вёрстки.',
          he: 'Google PageSpeed (מובייל + דסקטופ), TTFB, overflow אופקי ב-iPhone SE 375×667 ובעיות פריסה במובייל.',
        } satisfies Localized,
      },
      {
        weight: '22%',
        title: {
          en: 'Lead gen & Forms',
          ru: 'Лидогенерация и формы',
          he: 'לידים וטפסים',
        } satisfies Localized,
        body: {
          en: 'Contact forms (name, email, phone, submit), anti-spam (Turnstile, reCAPTCHA, hCaptcha, honeypot), chat/messengers (wa.me, t.me), and JS errors that break the funnel.',
          ru: 'Формы заявок (имя, email, телефон, submit), антиспам (Turnstile, reCAPTCHA, hCaptcha, honeypot), чат/мессенджеры (wa.me, t.me) и JS-ошибки, которые ломают воронку.',
          he: 'טפסי לידים (שם, אימייל, טלפון, שליחה), אנטי-ספאם (Turnstile, reCAPTCHA, hCaptcha, honeypot), צ׳אט/מסרים (wa.me, t.me) ושגיאות JS ששוברות את המשפך.',
        } satisfies Localized,
      },
      {
        weight: '22%',
        title: {
          en: 'SEO & Visibility',
          ru: 'SEO и видимость',
          he: 'SEO ונראות',
        } satisfies Localized,
        body: {
          en: 'robots.txt, sitemap, canonical, hreflang, Open Graph for messengers, favicon, Lighthouse SEO, and broken funnel pages.',
          ru: 'robots.txt, sitemap, canonical, hreflang, Open Graph для мессенджеров, favicon, Lighthouse SEO и битые страницы воронки.',
          he: 'robots.txt, sitemap, canonical, hreflang, Open Graph למסרים, favicon, Lighthouse SEO ועמודי משפך שבורים.',
        } satisfies Localized,
      },
      {
        weight: '18%',
        title: {
          en: 'Security & Stability',
          ru: 'Безопасность и стабильность',
          he: 'אבטחה ויציבות',
        } satisfies Localized,
        body: {
          en: 'HTTPS, six security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), 4xx/5xx responses, and runtime JS errors.',
          ru: 'HTTPS, шесть security-заголовков (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), ответы 4xx/5xx и runtime-ошибки JS.',
          he: 'HTTPS, שש כותרות אבטחה (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), תגובות 4xx/5xx ושגיאות JS בזמן ריצה.',
        } satisfies Localized,
      },
      {
        weight: '11%',
        title: {
          en: 'AI Visibility & Brand Discovery',
          ru: 'AI Visibility & Brand Discovery',
          he: 'נראות AI וגילוי מותג',
        } satisfies Localized,
        body: {
          en: 'Seven scorecard criteria: llms.txt, MCP manifest, /about, AI-bot rules in robots, Organization schema, llms link, and GA4 dataLayer + consent stub. Agent Readiness (Content-Signal, markdown) is reported separately and does not change the score.',
          ru: 'Семь критериев scorecard: llms.txt, MCP-манифест, /about, правила AI-ботов в robots, Organization schema, ссылка на llms.txt и GA4 dataLayer + consent stub. Agent Readiness (Content-Signal, markdown) — отдельный блок, без веса в оценке.',
          he: 'שבעה קריטריונים ל-scorecard: llms.txt, מניפסט MCP, /about, כללי בוטי AI ב-robots, סכמת Organization, קישור ל-llms.txt ו-GA4 dataLayer + consent stub. Agent Readiness (Content-Signal, markdown) מדווח בנפרד ואינו משנה את הציון.',
        } satisfies Localized,
      },
    ],
    categoriesTitle: {
      en: 'What the lab actually runs',
      ru: 'Что лаборатория снимает',
      he: 'מה המעבדה מריצה בפועל',
    } satisfies Localized,
    categoriesIntro: {
      en: '60+ unique signal types. Some run once per site, some on every locale (EN / RU / HE). Every finding maps to a concrete check — the scorecard is a summary, not the protocol.',
      ru: '60+ уникальных типов сигналов. Часть — один раз на сайт, часть — на каждой локали (EN / RU / HE). Каждая находка привязана к конкретной проверке: scorecard — это свод, не протокол.',
      he: '60+ סוגי אותות ייחודיים. חלק פעם אחת לאתר, חלק בכל שפה (EN / RU / HE). כל ממצא מקושר לבדיקה קונקרטית — ה-scorecard הוא סיכום, לא הפרוטוקול.',
    } satisfies Localized,
    categories: [
      {
        title: {
          en: 'Network & security',
          ru: 'Сеть и безопасность',
          he: 'רשת ואבטחה',
        } satisfies Localized,
        body: {
          en: '13 parameters: HTTPS, homepage HTTP status, TTFB, Server, six headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), 4xx/5xx, and runtime JS (console / PageError).',
          ru: '13 параметров: HTTPS, HTTP-статус главной, TTFB, Server, шесть заголовков (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), ответы 4xx/5xx и runtime JS (console / PageError).',
          he: '13 פרמטרים: HTTPS, סטטוס HTTP של דף הבית, TTFB, Server, שש כותרות (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), 4xx/5xx ו-JS בזמן ריצה (console / PageError).',
        } satisfies Localized,
      },
      {
        title: {
          en: 'Indexing & AI crawlers',
          ru: 'Индексация и AI-боты',
          he: 'אינדוקס ובוטי AI',
        } satisfies Localized,
        body: {
          en: 'robots.txt, sitemap.xml, Sitemap: directive; rules for 8 AI crawlers (GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, CCBot, Google-Extended, Applebot-Extended, PerplexityBot) and the severe_block flag.',
          ru: 'robots.txt, sitemap.xml, директива Sitemap:; правила для 8 AI-ботов (GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, CCBot, Google-Extended, Applebot-Extended, PerplexityBot) и флаг severe_block.',
          he: 'robots.txt, sitemap.xml, הנחיית Sitemap:; כללים ל-8 בוטי AI (GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, CCBot, Google-Extended, Applebot-Extended, PerplexityBot) ודגל severe_block.',
        } satisfies Localized,
      },
      {
        title: {
          en: 'PageSpeed Insights',
          ru: 'PageSpeed Insights',
          he: 'PageSpeed Insights',
        } satisfies Localized,
        body: {
          en: '10 Lighthouse metrics × mobile and desktop: Performance, Accessibility, Best Practices, SEO, FCP, LCP, CLS, TBT, Speed Index, TTI. Plus TTFB on the origin.',
          ru: '10 метрик Lighthouse × mobile и desktop: Performance, Accessibility, Best Practices, SEO, FCP, LCP, CLS, TBT, Speed Index, TTI. Плюс TTFB на origin.',
          he: '10 מדדי Lighthouse × מובייל ודסקטופ: Performance, Accessibility, Best Practices, SEO, FCP, LCP, CLS, TBT, Speed Index, TTI. וגם TTFB ב-origin.',
        } satisfies Localized,
      },
      {
        title: {
          en: 'Per locale — UX, forms, SEO assets',
          ru: 'На каждой локали — UX, формы, SEO',
          he: 'לכל שפה — UX, טפסים, נכסי SEO',
        } satisfies Localized,
        body: {
          en: '~28 signals × EN / RU / HE: title, description, Open Graph, canonical, hreflang, favicon, headings, overflow-x at 375px, forms and anti-spam (Turnstile / reCAPTCHA / hCaptcha / honeypot), chat/messengers, axe-core WCAG 2.1 AA / IS 5568. Hebrew: RTL dir and heading alignment. Spelling: LanguageTool on EN and RU.',
          ru: '~28 сигналов × EN / RU / HE: title, description, Open Graph, canonical, hreflang, favicon, заголовки, overflow-x на 375px, формы и антиспам (Turnstile / reCAPTCHA / hCaptcha / honeypot), чат/мессенджеры, axe-core WCAG 2.1 AA / IS 5568. Иврит: RTL dir и выравнивание заголовков. Орфография: LanguageTool на EN и RU.',
          he: '~28 אותות × EN / RU / HE: title, description, Open Graph, canonical, hreflang, favicon, כותרות, overflow-x ב-375px, טפסים ואנטי-ספאם (Turnstile / reCAPTCHA / hCaptcha / honeypot), צ׳אט/מסרים, axe-core WCAG 2.1 AA / IS 5568. עברית: dir ל-RTL ויישור כותרות. איות: LanguageTool ב-EN ו-RU.',
        } satisfies Localized,
      },
      {
        title: {
          en: 'AI Visibility',
          ru: 'AI Visibility',
          he: 'נראות AI',
        } satisfies Localized,
        body: {
          en: 'Seven scorecard criteria: GET /llms.txt, /.well-known/mcp, /api/mcp, /about; JSON-LD Organization/FAQ, rel=describedby, dataLayer and consent stub. The seven points feed the score — they are not the whole block.',
          ru: 'Семь критериев scorecard: GET /llms.txt, /.well-known/mcp, /api/mcp, /about; JSON-LD Organization/FAQ, rel=describedby, dataLayer и consent stub. Семь баллов входят в оценку — это не весь блок.',
          he: 'שבעה קריטריונים ל-scorecard: GET /llms.txt, /.well-known/mcp, /api/mcp, /about; JSON-LD Organization/FAQ, rel=describedby, dataLayer ו-consent stub. שבע הנקודות נכנסות לציון — זה לא כל הבלוק.',
        } satisfies Localized,
      },
      {
        title: {
          en: 'Agent Readiness Level 1',
          ru: 'Agent Readiness Level 1',
          he: 'Agent Readiness Level 1',
        } satisfies Localized,
        body: {
          en: 'Five checks reported separately: valid robots, agent sitemap, crawler rules, Content-Signal, markdown negotiation. The L1 score is not part of the 7 AI Visibility criteria and does not change the overall grade.',
          ru: 'Пять отдельных проверок: валидный robots, sitemap для агентов, правила ботов, Content-Signal, markdown negotiation. Балл L1 не входит в 7 критериев AI Visibility и не меняет итоговую оценку.',
          he: 'חמש בדיקות מדווחות בנפרד: robots תקין, sitemap לסוכנים, כללי בוטים, Content-Signal, markdown negotiation. ציון L1 אינו חלק מ-7 קריטריוני AI Visibility ואינו משנה את הציון הכולל.',
        } satisfies Localized,
      },
      {
        title: {
          en: 'Funnel crawl',
          ru: 'Обход воронки',
          he: 'סריקת משפך',
        } satisfies Localized,
        body: {
          en: 'Candidates from sitemap and nav; lab opens up to 10 commercial URLs. Per page: HTTP, title, h1, forms, CTA, soft-404, lang, dir, word count. Free discloses 1 URL (homepage); Diagnostic unlocks up to 5; Pro unlocks up to 10 and the full row-by-row checklist.',
          ru: 'Кандидаты из sitemap и навигации; лаборатория открывает до 10 коммерческих URL. На каждую страницу: HTTP, title, h1, формы, CTA, soft-404, lang, dir, объём текста. Free раскрывает 1 URL (главная); Diagnostic — до 5; Pro — до 10 и полный построчный чеклист.',
          he: 'מועמדים מ-sitemap ומהניווט; המעבדה פותחת עד 10 כתובות מסחריות. לכל עמוד: HTTP, title, h1, טפסים, CTA, soft-404, lang, dir, היקף טקסט. Free חושף URL אחד (דף הבית); Diagnostic — עד 5; Pro — עד 10 ואת צ׳ק-ליסט השורות המלא.',
        } satisfies Localized,
      },
    ],
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
          en: 'AI Visibility, not fake “ChatGPT checks”',
          ru: 'AI Visibility, без ложных «проверок ChatGPT»',
          he: 'נראות AI, בלי “בדיקות ChatGPT” מזויפות',
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
          en: 'Top-3 risks come with business impact. Diagnostic unlocks summary cards. The row-by-row 60+ checklist and fix plan are in Pro; Delegate adds implementation with our team.',
          ru: 'Топ-3 рисков — с влиянием на бизнес. Diagnostic открывает сводные карточки. Построчный чеклист 60+ и план правок — в Pro; Delegate добавляет внедрение вместе с нашей командой.',
          he: '3 הסיכונים העיקריים מגיעים עם השפעה עסקית. Diagnostic פותח כרטיסי סיכום. צ׳ק-ליסט 60+ שורה-שורה ותוכנית תיקון — ב-Pro; Delegate מוסיף יישום עם הצוות שלנו.',
        } satisfies Localized,
      },
    ],
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
      en: 'Start with a free preview: scorecard, top-3, and Lighthouse. Diagnostic unlocks summary cards and up to 5 funnel URLs. Pro opens the full 60+ checklist, up to 10 funnel URLs, the fix plan, and monthly re-audits — or hand implementation to us.',
      ru: 'Начните с бесплатного превью: scorecard, топ-3 и Lighthouse. Diagnostic открывает сводные карточки и до 5 URL воронки. Pro — полный чеклист 60+, до 10 URL воронки, план правок и ежемесячный повтор, либо передайте внедрение нам.',
      he: 'התחילו בתצוגה מקדימה חינם: scorecard, טופ-3 ו-Lighthouse. Diagnostic פותח כרטיסי סיכום ועד 5 כתובות משפך. Pro — צ׳ק-ליסט 60+ מלא, עד 10 כתובות משפך, תוכנית תיקון וביקורת חודשית, או תעבירו את היישום אלינו.',
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
          en: 'Preview: scorecard, top-3, Lighthouse.',
          ru: 'Превью: scorecard, топ-3, Lighthouse.',
          he: 'תצוגה מקדימה: scorecard, טופ-3, Lighthouse.',
        } satisfies Localized,
        features: [
          {
            en: 'Score 0–100 across 5 scorecard scales (A+–F)',
            ru: 'Оценка 0–100 по 5 шкалам scorecard (A+–F)',
            he: 'ציון 0–100 ב-5 סקאלות scorecard (A+–F)',
          },
          {
            en: 'Top-3 conversion / visibility risks',
            ru: 'Топ-3 уязвимости конверсии и видимости',
            he: '3 סיכוני המרה ונראות עיקריים',
          },
          {
            en: 'Lighthouse mobile + desktop preview',
            ru: 'Превью Lighthouse mobile + desktop',
            he: 'תצוגת Lighthouse למובייל ולדסקטופ',
          },
          {
            en: 'Homepage disclosed (funnel crawl stays locked)',
            ru: 'Раскрыта главная (обход воронки закрыт)',
            he: 'דף הבית גלוי (סריקת המשפך נעולה)',
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
          en: 'Summary cards and funnel URLs, one-time.',
          ru: 'Сводные карточки и URL воронки, разово.',
          he: 'כרטיסי סיכום וכתובות משפך, חד-פעמי.',
        } satisfies Localized,
        features: [
          {
            en: 'Everything in Free, plus:',
            ru: 'Всё из Free, плюс:',
            he: 'הכל מ-Free, ובנוסף:',
          },
          {
            en: 'Summary checklist cards (excellent → attention → critical)',
            ru: 'Сводные карточки чеклиста (отлично → внимание → критично)',
            he: 'כרטיסי סיכום צ׳ק-ליסט (מצוין → לתשומת לב → קריטי)',
          },
          {
            en: 'Funnel crawl disclosed — up to 5 URLs',
            ru: 'Обход воронки раскрыт — до 5 URL',
            he: 'סריקת המשפך גלויה — עד 5 כתובות',
          },
          {
            en: 'PageSpeed mobile + desktop details',
            ru: 'PageSpeed mobile и desktop подробно',
            he: 'פרטי PageSpeed למובייל ולדסקטופ',
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
            en: 'Full 60+ checklist and fix plan unlocked',
            ru: 'Полный чеклист 60+ и план правок открыты',
            he: 'צ׳ק-ליסט 60+ מלא ותוכנית תיקון פתוחים',
          },
          {
            en: 'Funnel crawl disclosed — up to 10 URLs',
            ru: 'Обход воронки раскрыт — до 10 URL',
            he: 'סריקת המשפך גלויה — עד 10 כתובות',
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
