import type { Localized } from '@/lib/auditCalcCopy'

/**
 * Copy for the premium AI audit landing (route name "leak" is historical) (`/lp/audit/leak/{locale}`).
 * Searchable-style editorial LP; the funnel itself reuses `auditCalcCopy`.
 */
export const leakLpCopy = {
  metaTitle: {
    en: 'Free AI website audit — speed, conversion, AI visibility',
    ru: 'Бесплатный AI-аудит сайта — скорость, конверсия, видимость в AI',
    he: 'אודיט AI חינמי לאתר — מהירות, המרות ונראות ב-AI',
  } satisfies Localized,
  metaDescription: {
    en: 'Free audit of speed, lead forms, Google and AI visibility. 230+ checks and a prioritised fix plan — in about 5 minutes.',
    ru: 'Бесплатный аудит скорости, форм заявок, видимости в Google и AI. 230+ проверок и план исправлений по приоритету — примерно за 5 минут.',
    he: 'בדיקה חינמית של מהירות, טפסי לידים ונראות בגוגל וב-AI. ‏230+ בדיקות ותוכנית תיקונים לפי עדיפות — תוך כ-5 דקות.',
  } satisfies Localized,

  strip: {
    en: 'Free · 230+ checks · result in about 5 minutes',
    ru: 'Бесплатно · 230+ проверок · результат примерно за 5 минут',
    he: 'חינם · ‏230+ בדיקות · תוצאה תוך כ-5 דקות',
  } satisfies Localized,

  navHow: { en: 'How it works', ru: 'Как это работает', he: 'איך זה עובד' } satisfies Localized,
  navChecks: { en: 'What we check', ru: 'Что проверяем', he: 'מה בודקים' } satisfies Localized,
  navFaq: { en: 'FAQ', ru: 'Вопросы', he: 'שאלות' } satisfies Localized,

  heroKicker: {
    en: 'AI website audit · CRO & GEO',
    ru: 'AI-аудит сайта · CRO и GEO',
    he: 'אודיט AI לאתר · CRO ו-GEO',
  } satisfies Localized,
  heroL1: {
    en: 'See what holds your website back —',
    ru: 'Узнайте, что мешает вашему сайту расти —',
    he: 'גלו מה מעכב את האתר שלכם —',
  } satisfies Localized,
  heroL2: {
    en: 'and what to fix first',
    ru: 'и что исправить в первую очередь',
    he: 'ומה לתקן קודם',
  } satisfies Localized,
  heroSub: {
    en: 'We test mobile speed, lead forms and how you show up in',
    ru: 'Проверяем скорость на мобильных, формы заявок и то, как вас видят',
    he: 'בודקים מהירות במובייל, טפסי לידים ואיך רואים אתכם ב-',
  } satisfies Localized,
  heroSubTail: {
    en: '— then rank every fix by its impact.',
    ru: '— и составляем план исправлений по приоритету.',
    he: '— ובונים תוכנית תיקונים לפי סדר עדיפויות.',
  } satisfies Localized,
  heroProof: {
    en: 'No admin access · No card · 1 domain / 7 days',
    ru: 'Без доступа к админке · Без карты · 1 домен / 7 дней',
    he: 'ללא גישת ניהול · ללא כרטיס אשראי · דומיין 1 / 7 ימים',
  } satisfies Localized,

  /* ---- product window ---- */
  windowSecure: { en: 'Encrypted · not shared', ru: 'Шифруется · не передаётся', he: 'מוצפן · לא מועבר' } satisfies Localized,


  /* ---- measured with ---- */
  measuredTitle: {
    en: 'Measured with Google and AI search tools',
    ru: 'Измеряем инструментами Google и AI-поиска',
    he: 'מודדים בכלים של גוגל וחיפוש AI',
  } satisfies Localized,
  measuredSearch: { en: 'Search & AI', ru: 'Поиск и AI', he: 'חיפוש ו-AI' } satisfies Localized,
  measuredPerf: { en: 'Performance & UX', ru: 'Скорость и UX', he: 'ביצועים ו-UX' } satisfies Localized,

  /* ---- bento ---- */
  bentoKicker: { en: 'What we check', ru: 'Что проверяем', he: 'מה בודקים' } satisfies Localized,
  bentoTitle: {
    en: 'Four areas. One clear plan.',
    ru: 'Четыре направления. Один понятный план.',
    he: 'ארבעה תחומים. תוכנית אחת ברורה.',
  } satisfies Localized,
  bentoSub: {
    en: 'Every finding is ranked by its business impact, so you know what to fix first.',
    ru: 'Каждая находка оценена по влиянию на бизнес — понятно, что исправлять в первую очередь.',
    he: 'כל ממצא מדורג לפי ההשפעה העסקית — כך ברור מה לתקן קודם.',
  } satisfies Localized,

  bLossLabel: { en: 'Business impact', ru: 'Бизнес-эффект', he: 'השפעה עסקית' } satisfies Localized,
  bLossTitle: {
    en: 'Technical findings in business terms.',
    ru: 'Технические находки — на языке бизнеса.',
    he: 'ממצאים טכניים בשפה עסקית.',
  } satisfies Localized,
  bLossBody: {
    en: 'Add revenue or client numbers and we estimate the impact of each fix in ₪. Without numbers, in percent.',
    ru: 'Укажите выручку или число клиентов — оценим эффект каждого исправления в ₪. Без цифр — в процентах.',
    he: 'הוסיפו הכנסה או מספר לקוחות ונעריך את השפעת כל תיקון ב-₪. בלי נתונים — באחוזים.',
  } satisfies Localized,
  bLossPoints: [
    { en: 'Impact in ₪ / mo', ru: 'Эффект в ₪ / мес', he: 'השפעה ב-₪ לחודש' },
    { en: 'Leads by cause', ru: 'Заявки по причинам', he: 'לידים לפי סיבה' },
    { en: 'Payback per fix', ru: 'Окупаемость правок', he: 'החזר לכל תיקון' },
  ] satisfies Localized[],

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
    en: 'From URL to a fix plan in five minutes.',
    ru: 'От сайта до плана исправлений за 5 минут.',
    he: 'מהאתר לתוכנית תיקונים תוך 5 דקות.',
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
        en: 'Optional: monthly revenue and clients, for an impact estimate in ₪.',
        ru: 'По желанию: выручка и клиенты в месяц — для оценки эффекта в ₪.',
        he: 'לא חובה: הכנסה ולקוחות בחודש — להערכת השפעה ב-₪.',
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
      t: { en: 'Get the report & fix plan', ru: 'Получите отчёт и план', he: 'קבלו דוח ותוכנית' },
      d: {
        en: 'Site score, top-3 problems and the priority of each fix — on screen and by email.',
        ru: 'Оценка сайта, топ-3 проблемы и приоритет каждого исправления — на экране и на почте.',
        he: 'ציון האתר, 3 הבעיות המרכזיות וסדר העדיפויות של כל תיקון — על המסך ובמייל.',
      },
    },
  ] satisfies { t: Localized; d: Localized }[],
  stats: [
    { v: '230+', l: { en: 'automated checks', ru: 'автоматических проверок', he: 'בדיקות אוטומטיות' } },
    { v: '~5', l: { en: 'minutes to result', ru: 'минут до результата', he: 'דקות לתוצאה' } },
    { v: '4', l: { en: 'audit areas', ru: 'направления проверки', he: 'תחומי בדיקה' } },
    { v: '0 ₪', l: { en: 'cost of the audit', ru: 'стоимость аудита', he: 'עלות הבדיקה' } },
  ] satisfies { v: string; l: Localized }[],

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
        en: 'Yes. The audit is free, one domain once every 7 days. No card, no subscription.',
        ru: 'Да. Аудит бесплатный — один домен раз в 7 дней. Без карты и подписки.',
        he: 'כן. האודיט בחינם — דומיין אחד פעם ב-7 ימים. בלי כרטיס ובלי מנוי.',
      },
    },
    {
      q: { en: 'How is the impact in ₪ estimated?', ru: 'Как оценивается эффект в ₪?', he: 'איך מוערכת ההשפעה ב-₪?' },
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
        en: 'No. Skip that step and you get the impact as a percentage of your traffic. Numbers you enter are used only for the estimate.',
        ru: 'Нет. Пропустите шаг — эффект покажем в процентах от трафика. Введённые цифры используются только для оценки.',
        he: 'לא. דלגו על השלב ותקבלו את ההשפעה באחוזים מהתנועה. הנתונים שמוזנים משמשים להערכה בלבד.',
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

  faqWaCta: { en: 'Message an engineer on WhatsApp', ru: 'Написать инженеру в WhatsApp', he: 'לכתוב למהנדס ב-WhatsApp' } satisfies Localized,
  headerWaCta: {
    en: 'Get a WhatsApp consult',
    ru: 'Получить консультацию в WhatsApp',
    he: 'לקבל ייעוץ ב-WhatsApp',
  } satisfies Localized,
  faqWaText: {
    en: 'Hi! I have a question about the AI website audit.',
    ru: 'Здравствуйте! У меня вопрос по AI-аудиту сайта.',
    he: 'שלום! יש לי שאלה לגבי אודיט ה-AI לאתר.',
  } satisfies Localized,

  /* ---- final CTA / footer ---- */
  finalTitle: {
    en: 'See your website the way clients and AI see it.',
    ru: 'Посмотрите на сайт глазами клиентов и AI.',
    he: 'ראו את האתר כמו שלקוחות וה-AI רואים אותו.',
  } satisfies Localized,
  finalSub: {
    en: 'Free audit, 230+ checks, result in about five minutes.',
    ru: 'Бесплатный аудит, 230+ проверок, результат примерно за пять минут.',
    he: 'בדיקה חינמית, ‏230+ בדיקות, תוצאה תוך כחמש דקות.',
  } satisfies Localized,
  finalCta: { en: 'Run the audit', ru: 'Запустить аудит', he: 'להפעלת האודיט' } satisfies Localized,
  footerPrivacy: { en: 'Privacy', ru: 'Конфиденциальность', he: 'פרטיות' } satisfies Localized,
  footerMain: { en: 'erythro.ai', ru: 'erythro.ai', he: 'erythro.ai' } satisfies Localized,
  footerNote: {
    en: 'Estimates are based on public research and your inputs.',
    ru: 'Оценки основаны на открытых исследованиях и ваших данных.',
    he: 'ההערכות מבוססות על מחקרים פתוחים ועל הנתונים שלכם.',
  } satisfies Localized,
} as const
