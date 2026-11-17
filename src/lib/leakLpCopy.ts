import type { Localized } from '@/lib/auditCalcCopy'

/**
 * Copy for the premium Revenue Leak landing (`/lp/audit/leak/{locale}`).
 * Searchable-style editorial LP; the funnel itself reuses `auditCalcCopy`.
 */
export const leakLpCopy = {
  metaTitle: {
    en: 'Revenue Leak Calculator — how much your website loses',
    ru: 'Калькулятор потерь — сколько теряет ваш сайт',
    he: 'מחשבון אובדן הכנסות — כמה האתר שלכם מפסיד',
  } satisfies Localized,
  metaDescription: {
    en: 'Free audit of speed, lead forms, Google and AI visibility. 230+ checks and your monthly loss in ₪ — in about 5 minutes.',
    ru: 'Бесплатный аудит скорости, форм заявок, видимости в Google и AI. 230+ проверок и сумма потерь в ₪ в месяц — примерно за 5 минут.',
    he: 'בדיקה חינמית של מהירות, טפסי לידים ונראות בגוגל וב-AI. ‏230+ בדיקות וסכום האובדן החודשי ב-₪ — תוך כ-5 דקות.',
  } satisfies Localized,

  strip: {
    en: 'Free · 230+ checks · result in about 5 minutes',
    ru: 'Бесплатно · 230+ проверок · результат примерно за 5 минут',
    he: 'חינם · ‏230+ בדיקות · תוצאה תוך כ-5 דקות',
  } satisfies Localized,
  stripLink: { en: 'See a real report', ru: 'Смотреть реальный отчёт', he: 'לדוח אמיתי' } satisfies Localized,

  navHow: { en: 'How it works', ru: 'Как это работает', he: 'איך זה עובד' } satisfies Localized,
  navChecks: { en: 'What we check', ru: 'Что проверяем', he: 'מה בודקים' } satisfies Localized,
  navFaq: { en: 'FAQ', ru: 'Вопросы', he: 'שאלות' } satisfies Localized,
  navCta: { en: 'Calculate losses', ru: 'Рассчитать потери', he: 'לחישוב האובדן' } satisfies Localized,

  heroKicker: {
    en: 'Revenue Leak Calculator · CRO & GEO',
    ru: 'Калькулятор потерь · CRO и GEO',
    he: 'מחשבון אובדן הכנסות · CRO ו-GEO',
  } satisfies Localized,
  heroL1: {
    en: 'See where your website loses leads —',
    ru: 'Узнайте, где сайт теряет заявки —',
    he: 'גלו איפה האתר מאבד לידים —',
  } satisfies Localized,
  heroL2: {
    en: 'and what it costs you',
    ru: 'и сколько это стоит',
    he: 'וכמה זה עולה לכם',
  } satisfies Localized,
  heroSub: {
    en: 'We test mobile speed, lead forms and how you show up in Google and',
    ru: 'Проверяем скорость на мобильных, формы заявок и то, как вас видят Google и',
    he: 'בודקים מהירות במובייל, טפסי לידים ואיך רואים אתכם בגוגל וב-',
  } satisfies Localized,
  heroSubTail: {
    en: '— then turn every issue into lost revenue.',
    ru: '— и переводим каждую ошибку в потерянную выручку.',
    he: '— ומתרגמים כל תקלה להכנסה שאבדה.',
  } satisfies Localized,
  heroCta: { en: 'Calculate my losses', ru: 'Рассчитать мои потери', he: 'לחשב את האובדן שלי' } satisfies Localized,
  heroCtaSecondary: { en: 'Sample report', ru: 'Пример отчёта', he: 'דוגמת דוח' } satisfies Localized,
  heroProof: {
    en: 'No admin access · No card · 1 domain / 7 days',
    ru: 'Без доступа к админке · Без карты · 1 домен / 7 дней',
    he: 'ללא גישת ניהול · ללא כרטיס אשראי · דומיין 1 / 7 ימים',
  } satisfies Localized,

  /* ---- product window ---- */
  windowNewAudit: { en: 'New audit', ru: 'Новый аудит', he: 'בדיקה חדשה' } satisfies Localized,
  windowSample: { en: 'Sample result', ru: 'Пример результата', he: 'דוגמת תוצאה' } satisfies Localized,
  windowSecure: { en: 'Encrypted · not shared', ru: 'Шифруется · не передаётся', he: 'מוצפן · לא מועבר' } satisfies Localized,
  tabLoss: { en: 'Revenue loss', ru: 'Потери', he: 'אובדן הכנסות' } satisfies Localized,
  tabSpeed: { en: 'Speed', ru: 'Скорость', he: 'מהירות' } satisfies Localized,
  tabForms: { en: 'Lead forms', ru: 'Формы заявок', he: 'טפסי לידים' } satisfies Localized,
  tabAi: { en: 'AI visibility', ru: 'AI-видимость', he: 'נראות ב-AI' } satisfies Localized,

  pvLossTitle: { en: 'Estimated monthly loss', ru: 'Оценка потерь в месяц', he: 'אובדן חודשי משוער' } satisfies Localized,
  pvLossHint: {
    en: 'Leads that left before contacting you',
    ru: 'Клиенты, которые ушли, не оставив заявку',
    he: 'לקוחות שעזבו בלי להשאיר פנייה',
  } satisfies Localized,
  pvLossLeads: { en: 'lost leads / month', ru: 'потерянных заявок / мес', he: 'לידים אבודים / חודש' } satisfies Localized,
  pvLossBySource: { en: 'Where it leaks', ru: 'Где утекает', he: 'איפה זה דולף' } satisfies Localized,
  pvScore: { en: 'Health score', ru: 'Оценка сайта', he: 'ציון האתר' } satisfies Localized,
  pvSpeedTitle: { en: 'Core Web Vitals · mobile', ru: 'Core Web Vitals · мобильные', he: 'Core Web Vitals · מובייל' } satisfies Localized,
  pvSpeedHint: {
    en: '53% of visitors leave a page that loads longer than 3 s',
    ru: '53% посетителей уходят, если страница грузится дольше 3 с',
    he: '53% מהגולשים עוזבים עמוד שנטען יותר מ-3 שניות',
  } satisfies Localized,
  pvFormsTitle: { en: 'Lead form friction', ru: 'Трение в форме заявки', he: 'חיכוך בטופס הלידים' } satisfies Localized,
  pvAiTitle: { en: 'Answer in ChatGPT', ru: 'Ответ в ChatGPT', he: 'תשובה ב-ChatGPT' } satisfies Localized,
  pvAiPrompt: {
    en: 'Best dental clinic near me with weekend hours?',
    ru: 'Лучшая стоматология рядом, которая работает в выходные?',
    he: 'מרפאת שיניים טובה קרוב אליי שפתוחה בסופ״ש?',
  } satisfies Localized,
  pvAiYou: { en: 'Your site', ru: 'Ваш сайт', he: 'האתר שלכם' } satisfies Localized,
  pvAiMissing: { en: 'not mentioned', ru: 'не упомянут', he: 'לא מוזכר' } satisfies Localized,
  pvAiCompetitor: { en: 'Competitor', ru: 'Конкурент', he: 'מתחרה' } satisfies Localized,
  pvSampleNote: {
    en: 'Sample data. Your numbers come from your own audit.',
    ru: 'Демо-данные. Ваши цифры — по результатам вашего аудита.',
    he: 'נתוני דוגמה. המספרים שלכם יגיעו מהבדיקה שלכם.',
  } satisfies Localized,

  /* ---- measured with ---- */
  measuredTitle: {
    en: 'Measured with the tools Google and AI actually use',
    ru: 'Измеряем теми же инструментами, что используют Google и AI',
    he: 'מודדים עם הכלים שגוגל וה-AI באמת משתמשים בהם',
  } satisfies Localized,
  measuredSearch: { en: 'Search & AI', ru: 'Поиск и AI', he: 'חיפוש ו-AI' } satisfies Localized,
  measuredPerf: { en: 'Performance & UX', ru: 'Скорость и UX', he: 'ביצועים ו-UX' } satisfies Localized,

  /* ---- bento ---- */
  bentoKicker: { en: 'What we check', ru: 'Что проверяем', he: 'מה בודקים' } satisfies Localized,
  bentoTitle: {
    en: 'Four leaks. One number in ₪.',
    ru: 'Четыре утечки. Одна сумма в ₪.',
    he: 'ארבע דליפות. מספר אחד ב-₪.',
  } satisfies Localized,
  bentoSub: {
    en: 'Every finding is tied to the visitors it costs you, so you know what to fix first — and what it is worth.',
    ru: 'Каждая находка привязана к клиентам, которых она стоит, — понятно, что чинить первым и сколько это принесёт.',
    he: 'כל ממצא מקושר ללקוחות שהוא עולה לכם — כך ברור מה לתקן קודם ומה זה שווה.',
  } satisfies Localized,

  bLossLabel: { en: 'Revenue loss', ru: 'Потери выручки', he: 'אובדן הכנסות' } satisfies Localized,
  bLossTitle: {
    en: 'Website errors, translated into money.',
    ru: 'Ошибки сайта, переведённые в деньги.',
    he: 'תקלות באתר, מתורגמות לכסף.',
  } satisfies Localized,
  bLossBody: {
    en: 'Add your monthly revenue or clients and we convert every bottleneck into lost leads and ₪ per month and per year. Skip it, and you get the loss as a percentage.',
    ru: 'Укажите выручку или число клиентов — и каждое узкое место превратится в потерянные заявки и ₪ в месяц и в год. Без цифр покажем потери в процентах.',
    he: 'הזינו הכנסה חודשית או מספר לקוחות — וכל צוואר בקבוק יתורגם ללידים אבודים ול-₪ בחודש ובשנה. בלי נתונים — תקבלו את האובדן באחוזים.',
  } satisfies Localized,
  bLossPoints: [
    { en: 'Loss per month and per year', ru: 'Потери в месяц и в год', he: 'אובדן בחודש ובשנה' },
    { en: 'Lost leads by source', ru: 'Потерянные заявки по причинам', he: 'לידים אבודים לפי מקור' },
    { en: 'Payback of each fix', ru: 'Окупаемость каждого исправления', he: 'החזר ההשקעה של כל תיקון' },
  ] satisfies Localized[],
  bLossChart: { en: 'Lost revenue, 12 months', ru: 'Потерянная выручка, 12 мес', he: 'הכנסה שאבדה, 12 חודשים' } satisfies Localized,

  bSpeedLabel: { en: 'Speed', ru: 'Скорость', he: 'מהירות' } satisfies Localized,
  bSpeedTitle: {
    en: 'Every extra second costs clicks.',
    ru: 'Каждая лишняя секунда стоит кликов.',
    he: 'כל שנייה מיותרת עולה בקליקים.',
  } satisfies Localized,
  bSpeedBody: {
    en: 'Google Lighthouse on a real mobile profile and on desktop: LCP, CLS, TBT and what slows the first screen.',
    ru: 'Google Lighthouse на реальном мобильном профиле и на десктопе: LCP, CLS, TBT и что тормозит первый экран.',
    he: 'Google Lighthouse בפרופיל מובייל אמיתי ובדסקטופ: LCP,‏ CLS,‏ TBT ומה מאט את המסך הראשון.',
  } satisfies Localized,

  bFormsLabel: { en: 'Lead forms', ru: 'Формы заявок', he: 'טפסי לידים' } satisfies Localized,
  bFormsTitle: {
    en: 'Find the field that kills the lead.',
    ru: 'Найдём поле, которое убивает заявку.',
    he: 'מוצאים את השדה שהורג את הליד.',
  } satisfies Localized,
  bFormsBody: {
    en: 'We walk the path a client takes on a phone: buttons, forms, phone and WhatsApp links, trust signals.',
    ru: 'Проходим путь клиента с телефона: кнопки, формы, ссылки на звонок и WhatsApp, сигналы доверия.',
    he: 'עוברים את המסלול של לקוח מהטלפון: כפתורים, טפסים, קישורי חיוג ו-WhatsApp, סימני אמון.',
  } satisfies Localized,
  bFormsIssues: [
    { en: '9 fields before submit', ru: '9 полей до отправки', he: '9 שדות לפני שליחה' },
    { en: 'Button below the fold', ru: 'Кнопка ниже первого экрана', he: 'הכפתור מתחת לקפל' },
    { en: 'No click-to-call', ru: 'Нет звонка в один тап', he: 'אין חיוג בלחיצה' },
  ] satisfies Localized[],

  bAiLabel: { en: 'AI visibility', ru: 'AI-видимость', he: 'נראות ב-AI' } satisfies Localized,
  bAiTitle: {
    en: 'Are you in the answer — or your competitor?',
    ru: 'В ответе AI вы — или конкурент?',
    he: 'בתשובה של ה-AI מופיעים אתם — או המתחרה?',
  } satisfies Localized,
  bAiBody: {
    en: 'Clients now ask ChatGPT, Perplexity and Gemini. We check whether AI can read, trust and cite your site.',
    ru: 'Клиенты всё чаще спрашивают ChatGPT, Perplexity и Gemini. Проверяем, может ли AI прочитать, понять и процитировать ваш сайт.',
    he: 'לקוחות שואלים היום את ChatGPT,‏ Perplexity ו-Gemini. בודקים אם ה-AI יכול לקרוא, להבין ולצטט את האתר שלכם.',
  } satisfies Localized,

  /* ---- how it works (dark) ---- */
  howKicker: { en: 'How it works', ru: 'Как это работает', he: 'איך זה עובד' } satisfies Localized,
  howTitle: {
    en: 'From URL to a number in ₪ in about five minutes.',
    ru: 'От адреса сайта до суммы в ₪ примерно за пять минут.',
    he: 'מכתובת האתר לסכום ב-₪ בתוך כחמש דקות.',
  } satisfies Localized,
  howSteps: [
    {
      t: { en: 'Enter your website', ru: 'Укажите сайт', he: 'הזינו את האתר' },
      d: {
        en: 'Address and contacts. No passwords, no admin access, no code on your site.',
        ru: 'Адрес и контакты. Без паролей, доступа к админке и кода на сайте.',
        he: 'כתובת ופרטי קשר. בלי סיסמאות, בלי גישת ניהול ובלי קוד באתר.',
      },
    },
    {
      t: { en: 'Add your numbers', ru: 'Добавьте цифры', he: 'הוסיפו נתונים' },
      d: {
        en: 'Optional: monthly revenue and clients, to see the loss in ₪ instead of %.',
        ru: 'По желанию: выручка и клиенты в месяц, чтобы увидеть потери в ₪, а не в %.',
        he: 'לא חובה: הכנסה ולקוחות בחודש, כדי לראות את האובדן ב-₪ ולא באחוזים.',
      },
    },
    {
      t: { en: 'We run 230+ checks', ru: 'Запускаем 230+ проверок', he: 'מריצים 230+ בדיקות' },
      d: {
        en: 'A real Chromium browser loads your site on mobile and desktop and scores it.',
        ru: 'Настоящий браузер Chromium открывает сайт на мобильном и десктопе и оценивает его.',
        he: 'דפדפן Chromium אמיתי טוען את האתר במובייל ובדסקטופ ומדרג אותו.',
      },
    },
    {
      t: { en: 'Get the loss & fix plan', ru: 'Получите потери и план', he: 'קבלו אובדן ותוכנית' },
      d: {
        en: 'Your loss, top-3 problems and what each fix is worth — on screen and by email.',
        ru: 'Сумма потерь, топ-3 проблемы и цена каждого исправления — на экране и на почте.',
        he: 'סכום האובדן, 3 הבעיות המרכזיות ומה שווה כל תיקון — על המסך ובמייל.',
      },
    },
  ] satisfies { t: Localized; d: Localized }[],
  stats: [
    { v: '230+', l: { en: 'automated checks', ru: 'автоматических проверок', he: 'בדיקות אוטומטיות' } },
    { v: '~5', l: { en: 'minutes to result', ru: 'минут до результата', he: 'דקות לתוצאה' } },
    { v: '4', l: { en: 'leak areas in ₪', ru: 'зоны потерь в ₪', he: 'תחומי דליפה ב-₪' } },
    { v: '0 ₪', l: { en: 'cost of the audit', ru: 'стоимость аудита', he: 'עלות הבדיקה' } },
  ] satisfies { v: string; l: Localized }[],
  sampleCardTitle: {
    en: 'Look at a real report first',
    ru: 'Сначала посмотрите реальный отчёт',
    he: 'קודם תסתכלו על דוח אמיתי',
  } satisfies Localized,
  sampleCardBody: {
    en: 'A full result for a live website: score, loss, top-3 problems and the fix plan.',
    ru: 'Полный результат по живому сайту: оценка, потери, топ-3 проблемы и план исправлений.',
    he: 'תוצאה מלאה לאתר חי: ציון, אובדן, 3 הבעיות המרכזיות ותוכנית התיקון.',
  } satisfies Localized,

  /* ---- FAQ ---- */
  faqKicker: { en: 'FAQ', ru: 'Вопросы', he: 'שאלות נפוצות' } satisfies Localized,
  faqTitle: { en: 'Questions, answered.', ru: 'Ответы на вопросы.', he: 'תשובות לשאלות.' } satisfies Localized,
  faqSub: {
    en: 'Something else? Write to an engineer on WhatsApp.',
    ru: 'Остался вопрос? Напишите инженеру в WhatsApp.',
    he: 'נשארה שאלה? כתבו למהנדס ב-WhatsApp.',
  } satisfies Localized,
  faq: [
    {
      q: { en: 'Is it really free?', ru: 'Это правда бесплатно?', he: 'זה באמת בחינם?' },
      a: {
        en: 'Yes. The audit and the loss calculation are free, one domain once every 7 days. No card, no subscription.',
        ru: 'Да. Аудит и расчёт потерь бесплатны — один домен раз в 7 дней. Без карты и подписки.',
        he: 'כן. הבדיקה וחישוב האובדן בחינם — דומיין אחד פעם ב-7 ימים. בלי כרטיס ובלי מנוי.',
      },
    },
    {
      q: { en: 'How is the loss in ₪ calculated?', ru: 'Как считается сумма потерь?', he: 'איך מחושב האובדן ב-₪?' },
      a: {
        en: 'Each issue has a share of visitors it typically turns away, based on public research (Google, Baymard and others). We apply it to your revenue or clients. It is an estimate, not an accounting figure.',
        ru: 'У каждой проблемы есть доля посетителей, которых она обычно отсекает, по открытым исследованиям (Google, Baymard и др.). Мы применяем её к вашей выручке или числу клиентов. Это оценка, а не бухгалтерская цифра.',
        he: 'לכל בעיה יש אחוז גולשים שהיא בדרך כלל מבריחה, לפי מחקרים פתוחים (Google,‏ Baymard ועוד). אנחנו מחילים אותו על ההכנסה או מספר הלקוחות שלכם. זו הערכה, לא נתון חשבונאי.',
      },
    },
    {
      q: { en: 'Do you need access to my website?', ru: 'Нужен доступ к сайту?', he: 'צריך גישה לאתר?' },
      a: {
        en: 'No. We test the public site the way a visitor and a search engine see it. Nothing is installed or changed.',
        ru: 'Нет. Проверяем публичный сайт так, как его видят посетитель и поисковик. Ничего не устанавливаем и не меняем.',
        he: 'לא. בודקים את האתר הציבורי כפי שגולש ומנוע חיפוש רואים אותו. לא מתקינים ולא משנים דבר.',
      },
    },
    {
      q: { en: 'Do I have to share revenue?', ru: 'Обязательно указывать выручку?', he: 'חייבים לשתף הכנסות?' },
      a: {
        en: 'No. Skip that step and you get the loss as a percentage of your traffic. Numbers you enter are used only for the calculation.',
        ru: 'Нет. Пропустите шаг — и получите потери в процентах от трафика. Введённые цифры используются только для расчёта.',
        he: 'לא. דלגו על השלב ותקבלו את האובדן באחוזים מהתנועה. הנתונים שמוזנים משמשים לחישוב בלבד.',
      },
    },
    {
      q: { en: 'What happens after the report?', ru: 'Что после отчёта?', he: 'מה קורה אחרי הדוח?' },
      a: {
        en: 'You keep the report. If you want help, an engineer can walk you through the fixes on WhatsApp — no obligation.',
        ru: 'Отчёт остаётся у вас. Если нужна помощь, инженер разберёт исправления с вами в WhatsApp — без обязательств.',
        he: 'הדוח נשאר אצלכם. אם תרצו עזרה, מהנדס יעבור איתכם על התיקונים ב-WhatsApp — בלי התחייבות.',
      },
    },
  ] satisfies { q: Localized; a: Localized }[],

  /* ---- final CTA / footer ---- */
  finalTitle: {
    en: 'Find out what your website is costing you.',
    ru: 'Узнайте, во сколько вам обходится сайт.',
    he: 'גלו כמה האתר עולה לכם.',
  } satisfies Localized,
  finalSub: {
    en: 'Free audit, 230+ checks, result in about five minutes.',
    ru: 'Бесплатный аудит, 230+ проверок, результат примерно за пять минут.',
    he: 'בדיקה חינמית, ‏230+ בדיקות, תוצאה תוך כחמש דקות.',
  } satisfies Localized,
  footerPrivacy: { en: 'Privacy', ru: 'Конфиденциальность', he: 'פרטיות' } satisfies Localized,
  footerMain: { en: 'erythro.ai', ru: 'erythro.ai', he: 'erythro.ai' } satisfies Localized,
  footerNote: {
    en: 'Estimates are based on public research and your inputs.',
    ru: 'Оценки основаны на открытых исследованиях и ваших данных.',
    he: 'ההערכות מבוססות על מחקרים פתוחים ועל הנתונים שלכם.',
  } satisfies Localized,
} as const
