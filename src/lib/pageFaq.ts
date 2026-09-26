import { tLocale, tLocaleList, type LocaleMap } from '@/lib/servicePages'

export type PageFaqItem = {
  question: LocaleMap
  /** Direct answer: 1–2 sentences a snippet can quote. */
  answer: LocaleMap
  details?: Record<string, string[]>
}

export type PageFaqBlock = {
  title: LocaleMap
  items: PageFaqItem[]
}

const TITLE: LocaleMap = {
  en: 'Questions and answers',
  ru: 'Вопросы и ответы',
  he: 'שאלות ותשובות',
}

const PAGE_FAQ: Record<string, PageFaqBlock> = {
  development: {
    title: TITLE,
    items: [
      {
        question: {
          en: 'How long does a Next.js website take to build?',
          ru: 'Сколько времени занимает разработка сайта на Next.js?',
          he: 'כמה זמן לוקח לפתח אתר על Next.js?',
        },
        answer: {
          en: 'A landing page usually takes a few weeks. A site with a CMS, integrations, and motion needs more time. The schedule depends on content, design approval, and the systems we connect. After the brief we give a roadmap with milestones before development starts.',
          ru: 'Лендинг обычно занимает несколько недель. Сайт с CMS, интеграциями и анимацией требует больше времени. Срок зависит от контента, согласования дизайна и систем, которые нужно подключить. После брифа даём план с этапами до старта разработки.',
          he: 'דף נחיתה לוקח בדרך כלל כמה שבועות. אתר עם CMS, אינטגרציות ואנימציה דורש יותר זמן. לוח הזמנים תלוי בתוכן, באישור העיצוב ובמערכות שצריך לחבר. אחרי הבריף אנחנו נותנים מפת דרכים עם אבני דרך לפני תחילת הפיתוח.',
        },
        details: {
          en: [
            'Motion and micro-interactions are part of the build, not a layer added at the end.',
            'Editor publishing is included when the page is a CMS site.',
          ],
          ru: [
            'Моушн и микроанимации входят в сборку, а не добавляются в конце.',
            'Если сайт на CMS, публикация для редакторов входит в объём.',
          ],
          he: [
            'תנועה ומיקרו-אינטראקציות הן חלק מהבנייה, לא שכבה שנוספת בסוף.',
            'כשהאתר על CMS, פרסום לעורכים כלול בהיקף.',
          ],
        },
      },
      {
        question: {
          en: 'What is the difference between custom development and a website builder?',
          ru: 'В чем разница между разработкой с нуля и конструктором?',
          he: 'מה ההבדל בין פיתוח מאפס לבין בונה אתרים?',
        },
        answer: {
          en: 'Custom Next.js development is built around your content model, performance, and search setup. A builder such as WordPress and Elementor starts a marketing page faster, but layout and integrations stay inside the template. We deliver both: a builder for a landing page, and Next.js when the site needs its own components, room on Core Web Vitals, and a path to automation later.',
          ru: 'Разработка с нуля на Next.js собирается вокруг вашей модели контента, скорости и SEO. Конструктор вроде WordPress и Elementor быстрее запускает маркетинговую страницу, но сетка и интеграции живут внутри шаблона. Мы делаем и то и другое: конструктор — для лендинга, Next.js — когда нужны свои компоненты, запас по Core Web Vitals и дальнейшая автоматизация.',
          he: 'פיתוח מאפס ב-Next.js נבנה סביב מודל התוכן, הביצועים וה-SEO שלכם. בונה אתרים כמו WordPress ו-Elementor משיק דף שיווקי מהר יותר, אבל הפריסה והאינטגרציות נשארות בתוך התבנית. אנחנו מספקים את שניהם: בונה אתרים לדף נחיתה, ו-Next.js כשהאתר צריך רכיבים משלו, מרווח ב-Core Web Vitals ודרך לאוטומציה אחר כך.',
        },
        details: {
          en: [
            'A custom site can reuse the same components for new pages instead of cloning a template.',
            'Baseline SEO — titles, canonicals, and editor-managed fields — is part of the build.',
          ],
          ru: [
            'Сайт с нуля переиспользует одни компоненты для новых страниц, а не клонирует шаблон.',
            'Базовое SEO — заголовки, canonical и поля, которыми управляет редактор — входит в сборку.',
          ],
          he: [
            'אתר מותאם משתמש באותם רכיבים לעמודים חדשים במקום לשכפל תבנית.',
            'SEO בסיסי — כותרות, canonical ושדות שהעורך מנהל — הוא חלק מהבנייה.',
          ],
        },
      },
      {
        question: {
          en: 'Can we edit the website ourselves after launch?',
          ru: 'Можно ли редактировать сайт самим после запуска?',
          he: 'אפשר לערוך את האתר לבד אחרי ההשקה?',
        },
        answer: {
          en: 'Yes. The site ships with an editor-friendly CMS, so your team can update copy, images, case studies, services, and SEO fields without a developer. Components and layout stay in code. Everyday publishing stays in the admin.',
          ru: 'Да. Сайт выходит с CMS, удобной для редактора: команда меняет тексты, изображения, кейсы, услуги и SEO-поля без разработчика. Компоненты и сетка остаются в коде. Ежедневная публикация — в админке.',
          he: 'כן. האתר עולה עם CMS נוח לעורך, כך שהצוות מעדכן טקסטים, תמונות, עבודות, שירותים ושדות SEO בלי מפתח. הרכיבים והפריסה נשארים בקוד. הפרסום השוטף נשאר בממשק הניהול.',
        },
        details: {
          en: ['New pages reuse the same fields instead of one-off layouts.'],
          ru: ['Новые страницы используют те же поля, а не разовые макеты.'],
          he: ['עמודים חדשים משתמשים באותם שדות, לא בפריסות חד-פעמיות.'],
        },
      },
    ],
  },
  'ai-automation': {
    title: TITLE,
    items: [
      {
        question: {
          en: 'How do you add AI agents to existing business processes?',
          ru: 'Как внедрить AI-агентов в существующие бизнес-процессы?',
          he: 'איך מטמיעים סוכני AI בתהליכים עסקיים קיימים?',
        },
        answer: {
          en: 'We map the process you already run — leads, booking, support, or CRM updates — and add an agent only where it removes a handoff. The agent reads the tools you use, such as the inbox, forms, CRM, or n8n, and writes back a clear next step. The goal is fewer manual transfers and a faster first response, not a chatbot pasted onto the homepage.',
          ru: 'Сначала разбираем процесс, который уже работает — лиды, запись, поддержка или обновления в CRM — и ставим агента только там, где он снимает ручную передачу. Агент читает ваши инструменты: почту, формы, CRM или n8n — и записывает понятный следующий шаг. Цель — меньше ручных передач и быстрее первый ответ, а не чат, приклеенный к главной.',
          he: 'קודם ממפים את התהליך שכבר רץ — לידים, זימון, תמיכה או עדכוני CRM — ומוסיפים סוכן רק במקום שבו הוא מסיר העברה ידנית. הסוכן קורא את הכלים שבשימוש, כמו תיבת הדואר, הטפסים, ה-CRM או n8n, ורושם חזרה את הצעד הבא. המטרה היא פחות העברות ידניות ותגובה ראשונה מהירה יותר, לא צ׳אט מודבק לדף הבית.',
        },
        details: {
          en: [
            'A person still takes over when the agent is not confident.',
            'Chat or voice is added only when it shortens the same process.',
          ],
          ru: [
            'Человек забирает шаг, если агент не уверен.',
            'Чат или голос добавляем только если они сокращают тот же процесс.',
          ],
          he: [
            'אדם עדיין לוקח את הצעד כשהסוכן לא בטוח.',
            'צ׳אט או קול מתווספים רק כשהם מקצרים את אותו תהליך.',
          ],
        },
      },
      {
        question: {
          en: 'Do AI agents replace a CRM or sit on top of it?',
          ru: 'AI-агент заменяет CRM или работает поверх неё?',
          he: 'סוכן AI מחליף את ה-CRM או יושב מעליו?',
        },
        answer: {
          en: 'The agent sits on top of the CRM. The CRM stays the source of truth. The agent can score a lead, draft a reply, or book a slot, then write that result back so your team sees the same record. You do not have to migrate the stack to add automation.',
          ru: 'Агент работает поверх CRM. CRM остаётся источником правды. Агент может оценить лид, набросать ответ или записать слот и вернуть результат в ту же карточку. Переносить стек, чтобы включить автоматизацию, не нужно.',
          he: 'הסוכן יושב מעל ה-CRM. ה-CRM נשאר מקור האמת. הסוכן יכול לדרג ליד, לנסח תשובה או לקבוע תור, ואז לכתוב את התוצאה לאותו כרטיס. אין צורך להעביר את המערכת כדי להוסיף אוטומציה.',
        },
        details: {
          en: ['Typical connections are the inbox, site forms, CRM, and n8n.'],
          ru: ['Обычные связки — почта, формы сайта, CRM и n8n.'],
          he: ['חיבורים טיפוסיים הם תיבת הדואר, טפסי האתר, CRM ו-n8n.'],
        },
      },
      {
        question: {
          en: 'What does an AI automation project include?',
          ru: 'Что входит в проект AI-автоматизации?',
          he: 'מה כולל פרויקט אוטומציה מבוססת AI?',
        },
        answer: {
          en: 'A typical project covers one workflow from trigger to handoff: the steps, the agent or n8n actions, the tools it may call, and a person who takes over when confidence is low. Scope and price are fixed after we map the current steps.',
          ru: 'Обычный проект закрывает один сценарий от триггера до передачи человеку: шаги, действия агента или n8n, инструменты, которые он может вызвать, и человека, который забирает задачу при низкой уверенности. Объём и цена фиксируются после того, как разложены текущие шаги.',
          he: 'פרויקט טיפוסי מכסה תהליך אחד מהטריגר ועד מסירה לאדם: הצעדים, פעולות הסוכן או n8n, הכלים שהוא רשאי לקרוא, ואדם שלוקח פיקוד כשהביטחון נמוך. ההיקף והמחיר נקבעים אחרי שממפים את הצעדים הנוכחיים.',
        },
        details: {
          en: [
            'A single flow, a lead agent with CRM, or a chat or voice assistant are separate packages.',
            'We do not add a model where a rule or an n8n step already does the job.',
          ],
          ru: [
            'Один сценарий, агент лидов с CRM или чат/голос — отдельные пакеты.',
            'Модель не ставим там, где задачу уже закрывает правило или шаг n8n.',
          ],
          he: [
            'תהליך בודד, סוכן לידים עם CRM, או צ׳אט וקול — חבילות נפרדות.',
            'לא מוסיפים מודל במקום שבו כלל או צעד n8n כבר עושים את העבודה.',
          ],
        },
      },
    ],
  },
  'design-branding': {
    title: TITLE,
    items: [
      {
        question: {
          en: 'What is included in a brand identity kit?',
          ru: 'Что входит в бренд-кит?',
          he: 'מה כוללת ערכת זהות מותג?',
        },
        answer: {
          en: 'A brand identity kit includes the logo system, color palette, type, and basic guidelines your team can apply on the web, in decks, and in campaigns. The files are production-ready, not a moodboard. Product screens and motion are separate packages when the brand also needs to live in an interface.',
          ru: 'Бренд-кит включает логосистему, палитру, шрифты и базовые гайдлайны, которые команда применяет на сайте, в презентациях и в кампаниях. Файлы готовы к продакшену, это не мудборд. Экраны продукта и моушн — отдельные пакеты, если бренду ещё нужно жить в интерфейсе.',
          he: 'ערכת זהות מותג כוללת מערכת לוגו, פלטת צבע, טיפוגרפיה והנחיות בסיס שהצוות מיישם באתר, במצגות ובקמפיינים. הקבצים מוכנים לפרודקשן, לא לוח השראה. מסכי מוצר ומושן הם חבילות נפרדות כשהמותג צריך לחיות גם בממשק.',
        },
        details: {
          en: ['Guidelines cover type, color, layout, and motion rules.'],
          ru: ['Гайдлайны закрывают шрифт, цвет, сетку и правила motion.'],
          he: ['ההנחיות מכסות טיפוגרפיה, צבע, פריסה וכללי תנועה.'],
        },
      },
      {
        question: {
          en: 'How is branding different from web design?',
          ru: 'Чем брендинг отличается от веб-дизайна?',
          he: 'מה ההבדל בין מיתוג לעיצוב אתר?',
        },
        answer: {
          en: 'Branding sets the rules: type, color, layout, and motion that stay the same across pages. Web design applies those rules to specific screens, components, and responsive layouts. We can do both. Identity comes first so each page does not invent a new look.',
          ru: 'Брендинг задаёт правила: шрифт, цвет, сетка и motion, одинаковые на всех страницах. Веб-дизайн применяет эти правила к конкретным экранам, компонентам и адаптиву. Можем сделать и то и другое. Сначала айдентика, чтобы каждая страница не придумывала новый вид.',
          he: 'מיתוג קובע את הכללים: טיפוגרפיה, צבע, פריסה ותנועה שנשארים זהים בין עמודים. עיצוב אתר מיישם את הכללים האלה על מסכים, רכיבים ופריסה רספונסיבית. אפשר לעשות את שניהם. הזהות קודמת, כדי שכל עמוד לא ימציא מראה חדש.',
        },
        details: {
          en: ['UI screens and a motion pack are priced separately from the identity kit.'],
          ru: ['Экраны UI и моушн-пакет считаются отдельно от бренд-кита.'],
          he: ['מסכי ממשק וחבילת מושן מתומחרים בנפרד מערכת הזהות.'],
        },
      },
      {
        question: {
          en: 'Can you design the brand without rebuilding the website?',
          ru: 'Можно ли сделать дизайн, не пересобирая сайт?',
          he: 'אפשר לעצב את המותג בלי לבנות את האתר מחדש?',
        },
        answer: {
          en: 'Yes. We can deliver identity, key screens, or a motion pack for the current site and hand production-ready files to your developers. When you want one team to ship the interface, design and Next.js development stay in the same engagement.',
          ru: 'Да. Можем отдать айдентику, ключевые экраны или моушн-пакет под текущий сайт и передать готовые к продакшену файлы вашим разработчикам. Если интерфейс должен собрать один подрядчик, дизайн и разработка на Next.js остаются в одной работе.',
          he: 'כן. אפשר למסור זהות, מסכים מרכזיים או חבילת מושן לאתר הקיים ולהעביר קבצים מוכנים לפרודקשן למפתחים שלכם. כשצוות אחד צריך להוציא את הממשק, העיצוב ופיתוח Next.js נשארים באותה עבודה.',
        },
        details: {
          en: ['Banners and campaign visuals can ship without a new front-end.'],
          ru: ['Баннеры и визуалы кампании можно отдать без нового фронтенда.'],
          he: ['באנרים וויזואלים לקמפיין יכולים לצאת בלי פרונטאנד חדש.'],
        },
      },
    ],
  },
  management: {
    title: TITLE,
    items: [
      {
        question: {
          en: 'What does a CMS and content model setup include?',
          ru: 'Что входит в настройку CMS и модели контента?',
          he: 'מה כוללת הקמת CMS ומודל תוכן?',
        },
        answer: {
          en: 'CMS setup defines the content types editors actually publish — pages, services, case studies, and SEO fields — and wires them into the admin. DNS and launch can be part of the same engagement. New pages reuse those fields, so the model can grow without one-off layouts.',
          ru: 'Настройка CMS задаёт типы контента, которые редакторы реально публикуют — страницы, услуги, кейсы и SEO-поля — и подключает их к админке. DNS и запуск могут входить в ту же работу. Новые страницы переиспользуют эти поля, поэтому модель растёт без разовых макетов.',
          he: 'הקמת CMS מגדירה את סוגי התוכן שהעורכים באמת מפרסמים — עמודים, שירותים, עבודות ושדות SEO — ומחברת אותם לממשק הניהול. DNS והשקה יכולים להיות חלק מאותה עבודה. עמודים חדשים משתמשים מחדש בשדות האלה, כך שהמודל גדל בלי פריסות חד-פעמיות.',
        },
        details: {
          en: ['Editors update copy and SEO without a developer.'],
          ru: ['Редакторы меняют тексты и SEO без разработчика.'],
          he: ['עורכים מעדכנים טקסט ו-SEO בלי מפתח.'],
        },
      },
      {
        question: {
          en: 'Can you connect the site to APIs we already use?',
          ru: 'Можно ли подключить сайт к API, которые уже используются?',
          he: 'אפשר לחבר את האתר ל-API שכבר בשימוש?',
        },
        answer: {
          en: 'Yes. Admin and API work connects the site to the systems you already use, such as forms, a CRM, or payments. Editors stay in the CMS and do not handle keys or endpoints. Each connection is scoped after we see the current stack.',
          ru: 'Да. Админка и API связывают сайт с системами, которые вы уже используете: формы, CRM или оплаты. Редакторы остаются в CMS и не работают с ключами и эндпоинтами. Каждую связку оцениваем после того, как видим текущий стек.',
          he: 'כן. אדמין ו-API מחברים את האתר למערכות שכבר בשימוש, כמו טפסים, CRM או תשלומים. העורכים נשארים ב-CMS ולא נוגעים במפתחות או בנקודות קצה. כל חיבור מוגדר אחרי שרואים את הסטאק הנוכחי.',
        },
        details: {
          en: ['Integrations sit behind the admin so publishing does not depend on a developer.'],
          ru: ['Интеграции стоят за админкой, публикация не зависит от разработчика.'],
          he: ['האינטגרציות יושבות מאחורי ממשק הניהול, והפרסום לא תלוי במפתח.'],
        },
      },
      {
        question: {
          en: 'What happens when you launch the site?',
          ru: 'Что происходит при запуске сайта?',
          he: 'מה קורה בהשקת האתר?',
        },
        answer: {
          en: 'Launch covers DNS, HTTPS, and the first production deploy, plus a short checklist so editors can publish without us. The domain is not left pointing at staging. After launch, the CMS and integrations are the layer your team keeps running.',
          ru: 'Запуск включает DNS, HTTPS и первый деплой в прод, плюс короткий чеклист, чтобы редакторы публиковали без нас. Домен не остаётся на Staging. После запуска CMS и интеграции — слой, которым команда продолжает пользоваться.',
          he: 'ההשקה כוללת DNS, HTTPS ואת הפריסה הראשונה לפרודקשן, וגם רשימת בדיקה קצרה כדי שהעורכים יפרסמו בלעדינו. הדומיין לא נשאר מצביע לסטייג׳ינג. אחרי ההשקה, ה-CMS והאינטגרציות הם השכבה שהצוות ממשיך להפעיל.',
        },
        details: {
          en: ['SEO fields and content models are already in the admin at launch.'],
          ru: ['SEO-поля и модели контента уже в админке на момент запуска.'],
          he: ['שדות SEO ומודלי התוכן כבר נמצאים בממשק הניהול בזמן ההשקה.'],
        },
      },
    ],
  },
  audit: {
    title: TITLE,
    items: [
      {
        question: {
          en: 'What does a technical SEO audit of a website include?',
          ru: 'Что включает в себя технический SEO-аудит сайта?',
          he: 'מה כולל SEO טכני בביקורת אתר?',
        },
        answer: {
          en: 'The SEO pass checks signals that block crawling and indexing: title and description, canonical, hreflang, robots.txt, sitemap, Open Graph, favicon, headings, and broken funnel pages. Diagnostic and Pro probe English, Russian, and Hebrew. Free checks the report language and the homepage. The report lists fixes in an order a team can act on.',
          ru: 'SEO-проверка смотрит сигналы, которые мешают обходу и индексации: title и description, canonical, hreflang, robots.txt, sitemap, Open Graph, favicon, заголовки и битые страницы воронки. Diagnostic и Pro снимают английский, русский и иврит. Free проверяет язык отчёта и главную. В отчёте правки идут в порядке, по которому команда может действовать.',
          he: 'בדיקת ה-SEO בודקת אותות שחוסמים סריקה ואינדוקס: title ו-description, canonical, hreflang, robots.txt, sitemap, Open Graph, favicon, כותרות ועמודי משפך שבורים. Diagnostic ו-Pro בודקים אנגלית, רוסית ועברית. Free בודק את שפת הדוח ואת דף הבית. הדוח מפרט תיקונים בסדר שצוות יכול לפעול לפיו.',
        },
        details: {
          en: [
            'SEO and visibility is 22% of the overall score.',
            'The scorecard is a summary. Each finding maps to a specific check.',
          ],
          ru: [
            'SEO и видимость — 22% итоговой оценки.',
            'Scorecard — это свод. Каждая находка привязана к конкретной проверке.',
          ],
          he: [
            'SEO ונראות הם 22% מהציון הכולל.',
            'ה-scorecard הוא סיכום. כל ממצא מקושר לבדיקה מסוימת.',
          ],
        },
      },
      {
        question: {
          en: 'How do Google Core Web Vitals affect search rankings?',
          ru: 'Как оценка Google Core Web Vitals влияет на позиции в поиске?',
          he: 'איך Core Web Vitals של Google משפיעים על דירוג בחיפוש?',
        },
        answer: {
          en: 'Google treats Core Web Vitals — LCP, CLS, and interaction delay — as one part of page experience. They do not replace relevance, but a slow or shifting page is easier to lose to a faster result. This audit measures them with PageSpeed on mobile and desktop, plus TTFB, and names the metric to fix first. The report does not promise a ranking.',
          ru: 'Google учитывает Core Web Vitals — LCP, CLS и задержку взаимодействия — как часть page experience. Они не заменяют релевантность, но медленную или прыгающую страницу проще проиграть более быстрой. Аудит снимает их через PageSpeed на mobile и desktop, плюс TTFB, и называет метрику, которую чинить первой. Отчёт не обещает позицию.',
          he: 'Google מתייחס ל-Core Web Vitals — LCP, CLS ועיכוב אינטראקציה — כחלק מחוויית העמוד. הם לא מחליפים רלוונטיות, אבל עמוד איטי או קופץ קל יותר להפסיד לתוצאה מהירה יותר. הביקורת מודדת אותם ב-PageSpeed במובייל ובדסקטופ, וגם TTFB, ומציינת איזה מדד לתקן קודם. הדוח לא מבטיח דירוג.',
        },
        details: {
          en: [
            'Speed and mobile UX is 27% of the score: PageSpeed, TTFB, overflow at 375px, and mobile layout.',
            'Lighthouse metrics include LCP, CLS, and TBT on both mobile and desktop.',
          ],
          ru: [
            'Скорость и мобильный UX — 27% оценки: PageSpeed, TTFB, overflow на 375px и мобильная вёрстка.',
            'Метрики Lighthouse включают LCP, CLS и TBT на mobile и desktop.',
          ],
          he: [
            'מהירות ו-UX למובייל הם 27% מהציון: PageSpeed, TTFB, overflow ב-375px ופריסת מובייל.',
            'מדדי Lighthouse כוללים LCP, CLS ו-TBT במובייל ובדסקטופ.',
          ],
        },
      },
      {
        question: {
          en: 'How do speed and mobile UX affect the audit score?',
          ru: 'Как скорость и мобильная версия входят в оценку аудита?',
          he: 'איך מהירות ו-UX למובייל נכנסים לציון הביקורת?',
        },
        answer: {
          en: 'Speed and mobile UX is the largest scale, at 27% of the score. The lab checks Google PageSpeed on mobile and desktop, TTFB, horizontal overflow at 375px, and mobile layout issues. The other four scales cover lead forms, SEO, security, and whether AI tools can find the brand.',
          ru: 'Скорость и мобильный UX — самая тяжёлая шкала, 27% оценки. Лаборатория проверяет Google PageSpeed на mobile и desktop, TTFB, горизонтальный overflow на 375px и проблемы мобильной вёрстки. Остальные четыре шкалы — формы заявок, SEO, безопасность и то, находят ли бренд AI-инструменты.',
          he: 'מהירות ו-UX למובייל הם הסקאלה הכבדה ביותר, 27% מהציון. המעבדה בודקת Google PageSpeed במובייל ובדסקטופ, TTFB, overflow אופקי ב-375px ובעיות פריסה במובייל. ארבע הסקאלות האחרות מכסות טפסי לידים, SEO, אבטחה, והאם כלי AI מוצאים את המותג.',
        },
        details: {
          en: ['The five scales summarise the lab. They are not the whole protocol.'],
          ru: ['Пять шкал — свод лаборатории, не весь протокол.'],
          he: ['חמש הסקאלות מסכמות את המעבדה. הן לא כל הפרוטוקול.'],
        },
      },
    ],
  },
}

PAGE_FAQ['enterprise-engineering'] = PAGE_FAQ.management

export function getPageFaq(key: string): PageFaqBlock | undefined {
  return PAGE_FAQ[key]
}

export function formatPageFaqMarkdown(key: string, locale: string): string {
  const block = getPageFaq(key)
  if (!block) return ''

  const lines = [`## ${tLocale(block.title, locale)}`, '']
  for (const item of block.items) {
    lines.push(`### ${tLocale(item.question, locale)}`)
    lines.push(tLocale(item.answer, locale))
    const details = tLocaleList(item.details, locale)
    if (details.length) {
      lines.push('')
      for (const line of details) lines.push(`- ${line}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}
