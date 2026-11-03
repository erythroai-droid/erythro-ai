import type { LightLevel, ScoreLabelKey } from '@/lib/revenueLeak'

export type Localized = { en: string; ru: string; he: string }

export function tCalc(field: Localized, locale: string): string {
  return field[locale as keyof Localized] || field.en
}

/** `{name}` placeholders → values. */
export function fillCalc(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in values ? String(values[key]) : `{${key}}`,
  )
}

const INTL_TAG: Record<string, string> = { en: 'en-IL', ru: 'ru-RU', he: 'he-IL' }

/** ₪ amount for the locale, no decimals. */
export function formatIls(value: number, locale: string): string {
  return new Intl.NumberFormat(INTL_TAG[locale] || 'en-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(value)
}

/** Number with at most one decimal, locale separators (27,4 in ru). */
export function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(INTL_TAG[locale] || 'en-IL', { maximumFractionDigits: 1 }).format(value)
}

export type CalcArea = 'speed' | 'forms' | 'security' | 'visibility'

export const auditCalcCopy = {
  sectionTitle: {
    en: 'Revenue Leak Calculator',
    ru: 'Калькулятор потерь',
    he: 'מחשבון אובדן הכנסות',
  } satisfies Localized,
  headline: {
    en: 'How much is your website losing in ₪?',
    ru: 'Сколько ваш сайт теряет в шекелях?',
    he: 'כמה האתר שלכם מפסיד בשקלים?',
  } satisfies Localized,
  badge: {
    en: 'Free · about 5 minutes · no card',
    ru: 'Бесплатно · около 5 минут · без карты',
    he: 'חינם · כ-5 דקות · בלי כרטיס אשראי',
  } satisfies Localized,
  formKicker: {
    en: 'Check where your site loses leads',
    ru: 'Проверьте, где сайт теряет заявки',
    he: 'בדקו איפה האתר מאבד פניות',
  } satisfies Localized,

  submit: {
    en: 'Calculate my loss',
    ru: 'Рассчитать потери',
    he: 'חשבו את ההפסד',
  } satisfies Localized,

  steps: [
    {
      title: {
        en: 'We audit your site',
        ru: 'Проверяем сайт',
        he: 'בודקים את האתר',
      },
      body: {
        en: 'A real audit of your homepage: mobile & desktop speed, forms, security and visibility in search and AI.',
        ru: 'Реальный аудит главной: скорость на смартфонах и ПК, формы, безопасность и видимость в поиске и AI.',
        he: 'ביקורת אמיתית של דף הבית: מהירות במובייל ובמחשב, טפסים, אבטחה ונראות בחיפוש וב-AI.',
      },
    },
    {
      title: {
        en: 'You enter your numbers',
        ru: 'Вводите свои цифры',
        he: 'מזינים את המספרים שלכם',
      },
      body: {
        en: 'Monthly revenue from the site, or leads and average deal. The calculator turns defects into ₪.',
        ru: 'Месячный доход с сайта или заявки и средний чек. Калькулятор переводит дефекты в шекели.',
        he: 'הכנסה חודשית מהאתר, או פניות ועסקה ממוצעת. המחשבון הופך ליקויים לשקלים.',
      },
    },
    {
      title: {
        en: 'We send a fix plan in WhatsApp',
        ru: 'Присылаем план исправлений в WhatsApp',
        he: 'שולחים תוכנית תיקון בוואטסאפ',
      },
      body: {
        en: 'No calls. A short text plan with price and timeline, right in the chat.',
        ru: 'Без созвонов. Короткий текстовый план со сметой и сроками прямо в чате.',
        he: 'בלי שיחות. תוכנית כתובה קצרה עם מחיר ולוח זמנים, ישר בצ׳אט.',
      },
    },
  ] as const,

  waitingTitle: {
    en: 'Auditing {domain}',
    ru: 'Проверяем {domain}',
    he: 'בודקים את {domain}',
  } satisfies Localized,
  waitingBody: {
    en: 'This is a real audit, not an estimate from a form. It takes about 5–10 minutes. Keep this page open: the calculator appears here automatically. The report is also sent to your email.',
    ru: 'Это настоящий аудит, а не оценка по анкете. Он занимает 5–10 минут. Оставьте страницу открытой: калькулятор появится здесь сам. Отчёт также придёт на почту.',
    he: 'זו ביקורת אמיתית ולא הערכה לפי שאלון. היא לוקחת 5–10 דקות. השאירו את העמוד פתוח: המחשבון יופיע כאן אוטומטית. הדוח יישלח גם למייל.',
  } satisfies Localized,
  waitingShort: {
    en: 'The report will also be emailed to you.',
    ru: 'Отчёт придёт и на почту.',
    he: 'הדוח יישלח גם למייל.',
  } satisfies Localized,
  waitingRemaining: {
    en: 'About {n} min left',
    ru: 'Осталось примерно {n} мин',
    he: 'נותרו כ-{n} דקות',
  } satisfies Localized,
  waitingLong: {
    en: 'Taking longer than usual. The report will arrive by email.',
    ru: 'Дольше обычного. Отчёт придёт на почту.',
    he: 'לוקח יותר זמן מהרגיל. הדוח יגיע למייל.',
  } satisfies Localized,
  failedTitle: {
    en: 'We could not finish the audit',
    ru: 'Не удалось завершить аудит',
    he: 'לא הצלחנו להשלים את הביקורת',
  } satisfies Localized,
  failedBody: {
    en: 'Check the address and try again, or write to us in WhatsApp. Your order ID: {orderId}.',
    ru: 'Проверьте адрес и попробуйте снова или напишите нам в WhatsApp. ID заказа: {orderId}.',
    he: 'בדקו את הכתובת ונסו שוב, או כתבו לנו בוואטסאפ. מספר הזמנה: {orderId}.',
  } satisfies Localized,
  tryAgain: {
    en: 'Try another address',
    ru: 'Ввести другой адрес',
    he: 'להזין כתובת אחרת',
  } satisfies Localized,
  failedLeadWithDomain: {
    en: 'Could not complete the audit for {domain}.',
    ru: 'Не удалось завершить аудит для {domain}.',
    he: 'לא ניתן היה להשלים את הביקורת עבור {domain}.',
  } satisfies Localized,
  failedLead: {
    en: 'Could not complete the audit.',
    ru: 'Не удалось завершить аудит.',
    he: 'לא ניתן היה להשלים את הביקורת.',
  } satisfies Localized,
  failedHint: {
    en: 'Check the URL and try again, or chat with our engineer.',
    ru: 'Проверьте адрес сайта и повторите попытку или напишите инженеру.',
    he: 'בדקו את כתובת האתר ונסו שוב, או דברו עם המהנדס שלנו.',
  } satisfies Localized,
  chatWithEngineer: {
    en: 'Chat with engineer',
    ru: 'Написать инженеру',
    he: 'צ׳אט עם מהנדס',
  } satisfies Localized,

  resultKicker: {
    en: 'Diagnosis',
    ru: 'Диагноз',
    he: 'אבחון',
  } satisfies Localized,
  scoreLabel: {
    en: 'Score',
    ru: 'Оценка',
    he: 'ציון',
  } satisfies Localized,
  verdict: {
    low: {
      en: 'Critical risk of losing mobile customers',
      ru: 'Критический риск потери клиентов с телефонов',
      he: 'סיכון קריטי לאובדן לקוחות מהמובייל',
    },
    mid: {
      en: 'Noticeable loss of inquiries',
      ru: 'Заметные потери заявок',
      he: 'אובדן פניות ניכר',
    },
    high: {
      en: 'The site is in good shape',
      ru: 'Сайт в хорошей форме',
      he: 'האתר במצב טוב',
    },
  } satisfies Record<'low' | 'mid' | 'high', Localized>,

  levelLabel: {
    red: { en: 'Critical', ru: 'Критично', he: 'קריטי' },
    yellow: { en: 'Needs attention', ru: 'Требует внимания', he: 'דורש תשומת לב' },
    /** Score ≥80 with attributed loss — good, not perfect. */
    green: { en: 'Good', ru: 'Хорошо', he: 'טוב' },
    /** Score ≥80 and zero loss on that scale — only then «Excellent». */
    excellent: { en: 'Excellent', ru: 'Отлично', he: 'מצוין' },
  } satisfies Record<ScoreLabelKey, Localized>,

  areaTitle: {
    speed: { en: 'Speed on phones', ru: 'Скорость на телефоне', he: 'מהירות בטלפון' },
    forms: { en: 'Forms and inquiries', ru: 'Формы и заявки', he: 'טפסים ופניות' },
    security: {
      en: 'Security and stability',
      ru: 'Безопасность и стабильность',
      he: 'אבטחה ויציבות',
    },
    visibility: {
      en: 'Visibility in Google and AI',
      ru: 'Видимость в Google и AI',
      he: 'נראות בגוגל וב-AI',
    },
  } satisfies Record<CalcArea, Localized>,
  areaImpact: {
    speed: {
      red: {
        en: 'Slow pages: visitors leave before the page opens.',
        ru: 'Медленные страницы: посетители уходят, не дождавшись загрузки.',
        he: 'עמודים איטיים: גולשים עוזבים לפני שהעמוד נפתח.',
      },
      yellow: {
        en: 'Speed is average: part of paid clicks is lost on loading.',
        ru: 'Скорость средняя: часть платных кликов теряется на загрузке.',
        he: 'המהירות בינונית: חלק מהקליקים בתשלום הולכים לאיבוד בטעינה.',
      },
      green: {
        en: 'Speed is solid, but a slice of visits still drops on load.',
        ru: 'Скорость хорошая, но часть визитов всё ещё теряется на загрузке.',
        he: 'המהירות טובה, אך חלק מהביקורים עדיין הולך לאיבוד בטעינה.',
      },
      excellent: {
        en: 'Pages open fast on phones.',
        ru: 'Страницы быстро открываются на телефонах.',
        he: 'העמודים נפתחים מהר בטלפונים.',
      },
    },
    forms: {
      red: {
        en: 'The path to an inquiry is weak or unprotected: leads get lost or buried in spam.',
        ru: 'Путь к заявке слабый или без защиты: лиды теряются или тонут в спаме.',
        he: 'הדרך לפנייה חלשה או לא מוגנת: לידים הולכים לאיבוד או טובעים בספאם.',
      },
      yellow: {
        en: 'Forms work, but the path to an inquiry has gaps.',
        ru: 'Формы работают, но в пути к заявке есть пробелы.',
        he: 'הטפסים עובדים, אך בדרך לפנייה יש פערים.',
      },
      green: {
        en: 'The path mostly works, yet a share of ready buyers still drop off.',
        ru: 'Путь в целом работает, но доля готовых покупателей всё ещё срывается.',
        he: 'הדרך עובדת בדרך כלל, אך חלק מהקונים המוכנים עדיין נושרים.',
      },
      excellent: {
        en: 'The path to an inquiry is clear and protected.',
        ru: 'Путь к заявке понятный и защищённый.',
        he: 'הדרך לפנייה ברורה ומוגנת.',
      },
    },
    security: {
      red: {
        en: 'Gaps in security and stability: risk of browser warnings, spam bots and downtime.',
        ru: 'Пробелы в безопасности и стабильности: риск предупреждений браузера, спам-ботов и простоя.',
        he: 'פערים באבטחה וביציבות: סיכון להתראות דפדפן, בוטים של ספאם והשבתות.',
      },
      yellow: {
        en: 'Basic protection is there, some hardening is missing.',
        ru: 'Базовая защита есть, часть мер не хватает.',
        he: 'יש הגנה בסיסית, חסרים כמה צעדי חיזוק.',
      },
      green: {
        en: 'Basics are fine; remaining gaps still cost a little trust.',
        ru: 'База в порядке; оставшиеся пробелы всё ещё чуть бьют по доверию.',
        he: 'הבסיס תקין; הפערים שנותרו עדיין פוגעים מעט באמון.',
      },
      excellent: {
        en: 'Security basics are in place.',
        ru: 'Базовая безопасность на месте.',
        he: 'יסודות האבטחה במקום.',
      },
    },
    visibility: {
      red: {
        en: 'Search engines and AI assistants hardly see the site: new customers do not find you.',
        ru: 'Поисковики и AI-ассистенты почти не видят сайт: новые клиенты вас не находят.',
        he: 'מנועי חיפוש ועוזרי AI כמעט לא רואים את האתר: לקוחות חדשים לא מוצאים אתכם.',
      },
      yellow: {
        en: 'Visibility is limited: search and AI see only part of the site.',
        ru: 'Видимость ограничена: поиск и AI видят только часть сайта.',
        he: 'הנראות מוגבלת: חיפוש ו-AI רואים רק חלק מהאתר.',
      },
      green: {
        en: 'Visibility is decent, but search and AI still miss some demand.',
        ru: 'Видимость нормальная, но поиск и AI всё ещё не видят часть спроса.',
        he: 'הנראות סבירה, אך חיפוש ו-AI עדיין מפספסים חלק מהביקוש.',
      },
      excellent: {
        en: 'The site is visible to search and AI.',
        ru: 'Сайт хорошо виден поиску и AI.',
        he: 'האתר נראה היטב לחיפוש ול-AI.',
      },
    },
  } satisfies Record<CalcArea, Record<ScoreLabelKey, Localized>>,

  calcHeading: {
    en: 'Express Audit Setup',
    ru: 'Запуск экспресс-аудита',
    he: 'הגדרת ביקורת מהירה',
  } satisfies Localized,
  step1Heading: {
    en: 'Revenue Leak Calculation',
    ru: 'Расчёт финансовых утечек',
    he: 'חישוב דליפות הכנסה',
  } satisfies Localized,
  step1Sub: {
    en: 'Enter your website and email to calculate monthly revenue loss and drop-off points.',
    ru: 'Укажите сайт и email, чтобы рассчитать ежемесячные потери бюджета и точки срыва заявок.',
    he: 'הזינו כתובת אתר ומייל כדי לחשב אובדן הכנסות חודשי ומוקדי נשירת לקוחות.',
  } satisfies Localized,
  step2Heading: {
    en: 'Revenue & Business Scale',
    ru: 'Доход и параметры бизнеса',
    he: 'הכנסות ונתוני העסק',
  } satisfies Localized,
  step2Sub: {
    en: 'Add your revenue to convert technical defects into exact shekel losses per month.',
    ru: 'Укажите доход, чтобы калькулятор перевёл технические ошибки в точные суммы потерь.',
    he: 'הזינו הכנסות כדי שהמחשבון יתרגם ליקויים טכניים להפסד כספי חודשי מדויק.',
  } satisfies Localized,
  step1ScopeTitle: {
    en: 'What will be audited in ~5 minutes:',
    ru: 'Что проверяет лаборатория за 5 минут:',
    he: 'מה בודקת המעבדה בתוך כ-5 דקות:',
  } satisfies Localized,
  step1Scopes: [
    {
      icon: 'speed',
      code: 'CWV-01',
      title: { en: 'Speed & Core Web Vitals', ru: 'Скорость и Core Web Vitals', he: 'מהירות מובייל ו-CWV' },
      desc: { en: 'LCP, CLS, mobile response time', ru: 'LCP, CLS, время загрузки на смартфонах', he: 'LCP, CLS וזמני טעינה במובייל' },
    },
    {
      icon: 'forms',
      code: 'LEAD-02',
      title: { en: 'Lead Forms & Conversion', ru: 'Формы заявок и конверсия', he: 'טופסי לידים והמרה' },
      desc: { en: 'Form friction, bot traps, drop-offs', ru: 'Путь к заявке, боты, потеря клиентов', he: 'חסימת בוטים, נשירת גولשים בטפסים' },
    },
    {
      icon: 'seo',
      code: 'SEO-03',
      title: { en: 'Google Indexing & SEO', ru: 'Индексация в Google и SEO', he: 'אינדוקס בגוגל ו-SEO' },
      desc: { en: 'Robots.txt, sitemap, meta tags', ru: 'Robots.txt, Sitemap, разметка и теги', he: 'Robots.txt, מפת אתר ותגיות מטא' },
    },
    {
      icon: 'ai',
      code: 'AI-04',
      title: { en: 'AI Search & Security', ru: 'Видимость в ИИ и защита', he: 'נראות ב-AI ואבטחה' },
      desc: { en: 'ChatGPT, Claude, SSL, CSP headers', ru: 'ChatGPT, Claude, SSL и заголовки CSP', he: 'ChatGPT, Claude, תעודת SSL ואבטחה' },
    },
  ],
  step1Guarantee1: { en: '0 ₪ · No card needed', ru: '0 ₪ · Без оплаты и карты', he: '0 ₪ · ללא צורך בכרטיס' } satisfies Localized,
  step1Guarantee2: { en: '1 domain / 7 days', ru: '1 домен / 7 дней', he: 'דומיין 1 / 7 ימים' } satisfies Localized,
  step1Guarantee3: { en: 'Full report sent to email', ru: 'Отчёт придёт и на почту', he: 'הדוח יישלח גם למייל' } satisfies Localized,
  nextStepCalc: {
    en: 'Next step →',
    ru: 'Следующий шаг →',
    he: 'השלב הבא ←',
  } satisfies Localized,
  calcHint: {
    en: 'Enter your numbers: the estimate is based on the audit of your site.',
    ru: 'Введите свои цифры: оценка строится на аудите вашего сайта.',
    he: 'הזינו את המספרים שלכם: ההערכה מבוססת על הביקורת של האתר.',
  } satisfies Localized,
  modeRevenue: {
    en: 'Revenue from the site',
    ru: 'Доход с сайта',
    he: 'הכנסה מהאתר',
  } satisfies Localized,
  modeLeads: {
    en: 'Leads and average deal',
    ru: 'Заявки и средний чек',
    he: 'פניות ועסקה ממוצעת',
  } satisfies Localized,
  fieldRevenue: {
    en: 'Monthly revenue from the website, ₪',
    ru: 'Месячный доход с сайта, ₪',
    he: 'הכנסה חודשית מהאתר, ₪',
  } satisfies Localized,
  fieldLeads: {
    en: 'Leads per month',
    ru: 'Заявок в месяц',
    he: 'פניות בחודש',
  } satisfies Localized,
  fieldDeal: {
    en: 'Average deal, ₪',
    ru: 'Средний чек сделки, ₪',
    he: 'עסקה ממוצעת, ₪',
  } satisfies Localized,
  sliderRevenue: {
    en: 'Monthly revenue from the site',
    ru: 'Ежемесячный доход с сайта',
    he: 'הכנסה חודשית מהאתר',
  } satisfies Localized,
  clientsLabel: {
    en: 'Customers per month',
    ru: 'Клиентов в месяц',
    he: 'לקוחות בחודש',
  } satisfies Localized,
  lostClients: {
    en: 'Customers lost per month',
    ru: 'Клиентов теряется в месяц',
    he: 'לקוחות אובדים בחודש',
  } satisfies Localized,
  lostMoney: {
    en: 'Lost revenue per month',
    ru: 'Упущенная выгода в месяц',
    he: 'הכנסה אבודה בחודש',
  } satisfies Localized,
  addNumbersHint: {
    en: 'Add your monthly revenue or customers on the form to see the loss in ₪ and customers.',
    ru: 'Укажите доход или клиентов в форме, чтобы увидеть потери в ₪ и в клиентах.',
    he: 'הוסיפו הכנסה חודשית או לקוחות בטופס כדי לראות את ההפסד בש״ח ובלקוחות.',
  } satisfies Localized,
  stepper: [
    { en: '01 · Site & Email', ru: '01 · Сайт и почта', he: '01 · אתר ומייל' },
    { en: '02 · Revenue & Scale', ru: '02 · Доход и чек', he: '02 · הכנסות ולקוחות' },
    { en: '03 · Lab Analysis', ru: '03 · Анализ лаборатории', he: '03 · ניתוח מעבדה' },
    { en: '04 · Bottlenecks & Growth', ru: '04 · Проблемы и точки роста', he: '04 · אבחון כשלים ושיפור' },
  ] as const,
  stepOf: { en: 'Step {n} of {total}', ru: 'Шаг {n} из {total}', he: 'שלב {n} מתוך {total}' } satisfies Localized,
  next: { en: 'Next step', ru: 'Следующий шаг', he: 'השלב הבא' } satisfies Localized,
  back: { en: 'Back', ru: 'Назад', he: 'חזרה' } satisfies Localized,
  backToPreviousStep: {
    en: 'Back to previous step',
    ru: 'Вернуться на шаг назад',
    he: 'חזרה לשלב הקודם',
  } satisfies Localized,
  skipStep: {
    en: 'Skip this step',
    ru: 'Пропустить шаг',
    he: 'דילוג על שלב זה',
  } satisfies Localized,
  clearValues: {
    en: 'Clear values',
    ru: 'Очистить значения',
    he: 'איפוס נתונים',
  } satisfies Localized,
  perYear: { en: 'per year', ru: 'в год', he: 'בשנה' } satisfies Localized,
  progressStages: [
    { en: 'Checking speed: mobile & desktop…', ru: 'Проверяем скорость: смартфоны и десктоп…', he: 'בודקים מהירות במובייל ובמחשב…' },
    { en: 'Checking forms and inquiries…', ru: 'Проверяем формы и заявки…', he: 'בודקים טפסים ופניות…' },
    { en: 'Checking Google and AI visibility…', ru: 'Проверяем видимость в Google и AI…', he: 'בודקים נראות בגוגל וב-AI…' },
    { en: 'Counting your losses…', ru: 'Считаем ваши потери…', he: 'מחשבים את ההפסדים…' },
  ] as const,
  perMonth: { en: '/ month', ru: '/ мес', he: '/ חודש' } satisfies Localized,
  badgeYours: {
    en: 'Your audit',
    ru: 'Ваш аудит',
    he: 'הביקורת שלכם',
  } satisfies Localized,
  donutCenter: {
    en: 'of inquiries lost',
    ru: 'обращений теряется',
    he: 'מהפניות אובדות',
  } satisfies Localized,
  whereLeaks: {
    en: 'Where the money leaks',
    ru: 'Куда утекают деньги',
    he: 'לאן הכסף מדלף',
  } satisfies Localized,
  yearTrend: {
    en: 'Cumulative loss over 12 months',
    ru: 'Накопленные потери за 12 месяцев',
    he: 'הפסד מצטבר ב-12 חודשים',
  } satisfies Localized,
  calcEmpty: {
    en: 'Enter a number to see the estimate.',
    ru: 'Введите число, чтобы увидеть оценку.',
    he: 'הזינו מספר כדי לראות את ההערכה.',
  } satisfies Localized,
  stepNumbers: {
    en: 'Step 2 · Your numbers',
    ru: 'Шаг 2 · Ваши цифры',
    he: 'שלב 2 · המספרים שלכם',
  } satisfies Localized,
  stepSite: {
    en: 'Step 1 · Your website',
    ru: 'Шаг 1 · Ваш сайт',
    he: 'שלב 1 · האתר שלכם',
  } satisfies Localized,
  waitingHeading: {
    en: 'Auditing your site',
    ru: 'Проверяем ваш сайт',
    he: 'בודקים את האתר שלכם',
  } satisfies Localized,
  resultHeading: {
    en: 'Estimated loss',
    ru: 'Оценка потерь',
    he: 'הערכת ההפסד',
  } satisfies Localized,
  calcLocked: {
    en: 'Enter your numbers and your site: the loss appears right here once the audit is done.',
    ru: 'Введите свои цифры и адрес сайта: потери появятся здесь сразу после проверки.',
    he: 'הזינו את המספרים והכתובת: ההפסד יופיע כאן מיד בסיום הבדיקה.',
  } satisfies Localized,
  percentLine: {
    en: 'About {p}% of potential inquiries are lost because of the defects found.',
    ru: 'Примерно {p}% потенциальных обращений теряется из-за найденных дефектов.',
    he: 'כ-{p}% מהפניות הפוטנציאליות אובדות בגלל הליקויים שנמצאו.',
  } satisfies Localized,
  lostMonthly: {
    en: 'Lost per month',
    ru: 'Потери в месяц',
    he: 'הפסד חודשי',
  } satisfies Localized,
  lostYearly: {
    en: 'Lost per year',
    ru: 'Потери в год',
    he: 'הפסד שנתי',
  } satisfies Localized,
  sprintCost: {
    en: 'Cost of the fix sprint',
    ru: 'Стоимость спринта исправлений',
    he: 'עלות ספרינט התיקונים',
  } satisfies Localized,
  payback: {
    en: 'Pays back in',
    ru: 'Срок окупаемости',
    he: 'החזר השקעה תוך',
  } satisfies Localized,
  paybackDays: {
    en: '{n} days',
    ru: '{n} дн.',
    he: '{n} ימים',
  } satisfies Localized,
  paybackMonths: {
    en: 'about {n} months',
    ru: 'около {n} мес.',
    he: 'כ-{n} חודשים',
  } satisfies Localized,
  goodShape: {
    en: 'Good news: the audit found no defects that cost you noticeable money. Small improvements are still possible.',
    ru: 'Хорошая новость: аудит не нашёл дефектов, которые заметно стоят вам денег. Небольшие улучшения всё равно возможны.',
    he: 'חדשות טובות: הביקורת לא מצאה ליקויים שעולים לכם כסף באופן ניכר. עדיין אפשר לשפר קצת.',
  } satisfies Localized,
  disclaimer: {
    en: 'An estimate for guidance, not a promise of results. It is built from the audit scores and typical conversion loss for the defects found, and does not measure your real traffic.',
    ru: 'Оценка носит ориентировочный характер и не обещает результат. Она строится на баллах аудита и типичных потерях конверсии от найденных дефектов и не измеряет ваш реальный трафик.',
    he: 'הערכה מנחה ולא הבטחה לתוצאה. היא מבוססת על ציוני הביקורת ועל אובדן המרות אופייני לליקויים שנמצאו, ואינה מודדת את התנועה האמיתית שלכם.',
  } satisfies Localized,

  offerTitle: {
    en: 'Deep Pro audit is included',
    ru: 'Глубокий аудит Pro входит в стоимость',
    he: 'ביקורת עומק Pro כלולה',
  } satisfies Localized,
  offerBody: {
    en: 'Pro audit, 230+ checks, goes with the fix sprint at no extra charge.',
    ru: 'Аудит Pro на 230+ проверок идёт в составе спринта без доплаты.',
    he: 'ביקורת Pro עם 230+ בדיקות כלולה בספרינט התיקונים ללא תוספת.',
  } satisfies Localized,
  offerOldPrice: '₪490',
  offerNewPrice: '₪0',

  waButton: {
    en: 'Send me a fix plan in WhatsApp',
    ru: 'Пришлите мне план исправлений в WhatsApp',
    he: 'שלחו לי תוכנית תיקון בוואטסאפ',
  } satisfies Localized,
  waLocked: {
    en: 'Available as soon as your plan is ready.',
    ru: 'Станет доступна, когда план будет готов.',
    he: 'תהיה זמינה ברגע שהתוכנית תהיה מוכנה.',
  } satisfies Localized,
  waNote: {
    en: 'Text chat only, no calls.',
    ru: 'Только переписка, без созвонов.',
    he: 'רק הודעות, בלי שיחות.',
  } satisfies Localized,
  waMessageWithLoss: {
    en: 'Hello! The audit for {domain} identified key funnel barriers and up to {percent}% inquiry loss. How can we eliminate them?',
    ru: 'Здравствуйте! Прошёл аудит сайта {domain}. Обнаружены сбои в воронке и потери до {percent}% обращений. Как их устранить?',
    he: 'שלום! ביצעתי ביקורת לאתר {domain}. אותרו כשלי משפך ואובדן של עד {percent}% מהפניות. איך ניתן לתקן זאת?',
  } satisfies Localized,
  waMessageNoLoss: {
    en: 'Hello! I completed the audit for {domain}. Could you send an engineering plan to optimize the funnel?',
    ru: 'Здравствуйте! Прошёл аудит сайта {domain}. Пришлите, пожалуйста, инженерный план улучшений воронки.',
    he: 'שלום! ביצעתי ביקורת לאתר {domain}. אפשר לקבל תוכנית הנדסית לשיפור משפך ההמרה?',
  } satisfies Localized,

  detailsSummary: {
    en: 'See the technical data behind the estimate',
    ru: 'Посмотреть технические данные, на которых строится оценка',
    he: 'לצפייה בנתונים הטכניים שמאחורי ההערכה',
  } satisfies Localized,

  /* ---- Step 4: Executive Problem & Bottlenecks View ---- */
  step4Kicker: {
    en: '§ 04 — FUNNEL DIAGNOSTIC RESULTS',
    ru: '§ 04 — РЕЗУЛЬТАТЫ ДИАГНОСТИКИ ВОРОНКИ',
    he: '§ 04 — תוצאות אבחון משפך ההמרה',
  } satisfies Localized,
  step4HeroL1: {
    en: 'KEY BOTTLENECKS',
    ru: 'ОБНАРУЖЕНЫ КЛЮЧЕВЫЕ',
    he: 'אותרו כשלים מרכזיים',
  } satisfies Localized,
  step4HeroL2: {
    en: 'IN THE WEBSITE FUNNEL',
    ru: 'СБОИ ВОРОНКИ САЙТА',
    he: 'במשפך ההמרה של האתר',
  } satisfies Localized,
  step4SubPrefix: {
    en: 'Chromium Audit Lab tested the website across 230+ parameters, probing user journeys and ',
    ru: 'Лаборатория Chromium проверила сайт по 230+ параметрам, протестировала путь клиента и ',
    he: 'מעבדת Chromium בדקה את האתר בלמעלה מ-230 פרמטרים, בחנה את מסלול המשתמש ו-',
  } satisfies Localized,
  step4SubHighlight: {
    en: 'identifying critical bottlenecks',
    ru: 'выявила ключевые сбои воронки',
    he: 'איתרה נקודות כשל קריטיות',
  } satisfies Localized,
  step4Title: {
    en: 'KEY FUNNEL BREAKDOWNS IDENTIFIED',
    ru: 'ОБНАРУЖЕНЫ КЛЮЧЕВЫЕ СБОИ ВОРОНКИ',
    he: 'אותרו הכשלים המרכזיים במשפך ההמרה',
  } satisfies Localized,
  step4Subtitle: {
    en: 'Chromium Audit Lab tested the website across 230+ parameters. Critical barriers were found causing a loss of up to {percent}% of potential customer inquiries. Below is the 5-area diagnosis and remediation plan.',
    ru: 'Лаборатория Chromium протестировала сайт по 230+ параметрам. Обнаружены критические барьеры, из-за которых теряется до {percent}% потенциальных обращений. Ниже — детальный разбор уязвимостей и план их устранения.',
    he: 'מעבדת Chromium בדקה את האתר בלמעלה מ-230 פרמטרים. אותרו כשלים קריטיים הגורמים לאובדן של עד {percent}% מהפניות הפוטנציאליות. להלן ניתוח נקודות התורפה ותוכנית תיקון הנדסית.',
  } satisfies Localized,
  step4OverallScore: {
    en: 'Overall Health Score',
    ru: 'Общий индекс здоровья сайта',
    he: 'מדד בריאות האתר הכולל',
  } satisfies Localized,
  overallHealthTitle: {
    en: 'Overall Health Index',
    ru: 'Индекс здоровья сайта',
    he: 'מדד בריאות האתר',
  } satisfies Localized,
  kpiLossTitle: {
    en: 'Conversion loss',
    ru: 'Потери конверсии',
    he: 'אובדן המרה',
  } satisfies Localized,
  step4CardLossKicker: {
    en: 'Critical Funnel Leak',
    ru: 'Ключевая утечка',
    he: 'נקודת כשל מרכזית',
  } satisfies Localized,
  step4CardHealthKicker: {
    en: 'Audit Result',
    ru: 'Результат аудита',
    he: 'תוצאת הביקורת',
  } satisfies Localized,
  step4FrictionSpeed: {
    en: 'Speed & mobile UX',
    ru: 'Задержки и скорость',
    he: 'מהירות וחוויית מובייל',
  } satisfies Localized,
  step4FrictionForms: {
    en: 'Form & CTA glitches',
    ru: 'Сбои на формах и CTA',
    he: 'שיבושי טפסים ו-CTA',
  } satisfies Localized,
  step4FrictionVisibility: {
    en: 'Search & AI drop-off',
    ru: 'Потери в поиске и AI',
    he: 'אובדן בחיפוש ו-AI',
  } satisfies Localized,
  step4FrictionSecurity: {
    en: 'Security & trust flaws',
    ru: 'Уязвимости и сбои SSL',
    he: 'כשלי אבטחה ו-SSL',
  } satisfies Localized,
  step4TotalLossBadge: {
    en: 'Sum: {p}% losses',
    ru: 'В сумме: {p}% потерь',
    he: 'סך הכול: {p}% איבוד',
  } satisfies Localized,
  step4LostClientsLabel: {
    en: 'Clients at risk:',
    ru: 'Потери клиентов:',
    he: 'אובדן לקוחות:',
  } satisfies Localized,
  step4PriorityLabel: {
    en: 'Priority:',
    ru: 'Приоритет:',
    he: 'עדיפות:',
  } satisfies Localized,
  step4PriorityVal: {
    en: 'Fix bottleneck sprint',
    ru: 'Устранение узких мест',
    he: 'ספרינט תיקון כשלים',
  } satisfies Localized,
  step3TestsBadge: {
    en: '230+ funnel tests',
    ru: '230+ тестов воронки',
    he: '230+ בדיקות משפך',
  } satisfies Localized,
  step4HealthLabel: {
    green: { en: 'Optimal condition', ru: 'В норме', he: 'מצב תקין' },
    yellow: { en: 'Needs attention', ru: 'Требует внимания', he: 'דורש תשומת לב' },
    red: { en: 'Critical breakdowns', ru: 'Критическое состояние', he: 'מצב קריטי' },
  } satisfies Record<LightLevel, Localized>,
  step4LossMetricLabel: {
    en: 'Conversion loss',
    ru: 'Потери конверсии',
    he: 'אובדן המרה',
  } satisfies Localized,
  step4LossMetricVal: {
    en: 'up to {p}% of inquiries',
    ru: 'до {p}% обращений',
    he: 'עד {p}% מהפניות',
  } satisfies Localized,
  step4LossMetricSub: {
    en: 'lost at funnel friction points',
    ru: 'отсекаются на этапах воронки',
    he: 'נושרים במחסומי המשפך',
  } satisfies Localized,
  step4IssuesMetricLabel: {
    en: 'Critical bottlenecks',
    ru: 'Критических сбоев',
    he: 'כשלים קריטיים',
  } satisfies Localized,
  step4IssuesMetricVal: {
    en: '{n} priority zones',
    ru: '{n} ключевые точки',
    he: '{n} נקודות תורפה',
  } satisfies Localized,
  step4IssuesMetricSub: {
    en: 'require immediate sprint fixes',
    ru: 'требуют первоочередного спринта',
    he: 'דורשים תיקון הנדסי מיידי',
  } satisfies Localized,
  step4TestsMetricLabel: {
    en: 'Tests completed',
    ru: 'Тестов пройдено',
    he: 'בדיקות שבוצעו',
  } satisfies Localized,
  step4TestsMetricVal: {
    en: '230+ checks',
    ru: '230+ проверок воронки',
    he: '230+ בדיקות משפך',
  } satisfies Localized,
  step4TestsMetricSub: {
    en: 'mobile, desktop, SEO & AI',
    ru: 'смартфоны, ПК, поисковики и AI',
    he: 'מובייל, מחשב, חיפוש ו-AI',
  } satisfies Localized,
  step4UpsideMetricLabel: {
    en: 'Growth upside',
    ru: 'Потенциал роста',
    he: 'פוטנציאל צמיחה',
  } satisfies Localized,
  step4UpsideMetricVal: {
    en: '+{p}% in new inquiries',
    ru: '+{p}% к объёму заявок',
    he: '+{p}% לגידול בפניות',
  } satisfies Localized,
  step4UpsideMetricSub: {
    en: 'after eliminating bottlenecks',
    ru: 'после устранения узких мест',
    he: 'לאחר הסרת צווארי הבקבוק',
  } satisfies Localized,
  step4RevenueNote: {
    en: 'Estimated unrealized volume based on stated revenue ({rev}): ≈ −{monthly}/mo (−{yearly}/yr)',
    ru: 'Ориентир недополученного объёма при указанном обороте ({rev}): ≈ −{monthly}/мес (−{yearly}/год)',
    he: 'אומדן מחזור שלא מומש לפי ההכנסה שצוינה ({rev}): ≈ −{monthly} לחודש (−{yearly} לשנה)',
  } satisfies Localized,
  googleVerifyBadge: {
    en: 'Official Google Lighthouse & Web Vitals Data',
    ru: 'Официальные данные Google Lighthouse & Web Vitals',
    he: 'נתוני Google Lighthouse ו-Web Vitals רשמיים',
  } satisfies Localized,
  googleVerifyTitle: {
    en: 'Independent Google PageSpeed Insights Verification',
    ru: 'Независимая проверка в Google PageSpeed Insights',
    he: 'אימות עצמאי ב-Google PageSpeed Insights',
  } satisfies Localized,
  googleVerifyText: {
    en: 'All speed, Cumulative Layout Shift (CLS), and mobile responsiveness metrics are captured by the Chromium engine following Google Lighthouse standards. You can open Google’s official tool to verify the precision of our data.',
    ru: 'Все показатели скорости, стабильности вёрстки (CLS) и отклика на смартфонах замерены движком Chromium по стандартам Google Lighthouse. Вы можете в один клик открыть официальный сервис Google и убедиться в точности наших расчетов.',
    he: 'כל מדדי המהירות, יציבות העימוד (CLS) ותגובתיות המובייל נמדדו באמצעות מנוע Chromium לפי תקני Google Lighthouse. באפשרותכם לפתוח בלחיצה אחת את הכלי הרשמי של גוגל ולוודא את דיוק הנתונים.',
  } satisfies Localized,
  googleVerifyBtn: {
    en: 'Verify {domain} in Google PageSpeed Insights ↗',
    ru: 'Проверить {domain} в Google PageSpeed Insights ↗',
    he: 'בדיקת {domain} ב-Google PageSpeed Insights ↗',
  } satisfies Localized,
  googleVerifyHint: {
    en: 'Opens in a new tab on Google’s official analysis server',
    ru: 'Откроется в новой вкладке на официальном сервере Google',
    he: 'ייפתח בלשונית חדשה בשרת הבדיקות הרשמי של Google',
  } satisfies Localized,
  step4DiagnosticScalesTitle: {
    en: '5-Area Diagnostic Results',
    ru: 'Результаты диагностики по 5 направлениям',
    he: 'תוצאות אבחון ב-5 תחומים',
  } satisfies Localized,
  step4DiagnosticScalesSub: {
    en: 'Detailed health breakdown across mobile speed, lead intake, search discoverability, and AI readiness.',
    ru: 'Детальный срез показателей скорости, приёма заявок, безопасности, поисковой видимости и готовности к AI-поиску.',
    he: 'פילוח מפורט של מהירות מובייל, קליטת פניות, אבטחה, נראות במנועי חיפוש ומוכנות לעוזרי AI.',
  } satisfies Localized,
  step4Top3Title: {
    en: 'Top 3 Critical Conversion Bottlenecks',
    ru: 'Топ-3 ключевые проблемы конверсии',
    he: '3 נקודות התורפה המרכזיות בהמרה',
  } satisfies Localized,
  step4Top3Sub: {
    en: 'Critical bottlenecks causing the greatest customer drop-off before reaching contact forms',
    ru: 'Узкие места в воронке, которые отсекают больше всего потенциальных клиентов перед отправкой заявки',
    he: 'צווארי הבקבוק במשפך הגורמים לנשירת הלקוחות הגבוהה ביותר טרם השלמת הפנייה',
  } satisfies Localized,
  step4RowProblem: {
    en: 'Where the breakdown occurs',
    ru: 'Где возник сбой',
    he: 'היכן אירע הכשל',
  } satisfies Localized,
  step4RowImpact: {
    en: 'Conversion impact',
    ru: 'Влияние на конверсию',
    he: 'השפעה על ההמרה',
  } satisfies Localized,
  step4RowSolution: {
    en: 'Engineering solution',
    ru: 'Инженерное решение',
    he: 'פתרון הנדסי',
  } satisfies Localized,
  step4FullChecklistTitle: {
    en: 'Full Audit Checklist (230+ Parameters)',
    ru: 'Полный чеклист аудита (230+ тестов)',
    he: 'צ׳ק-ליסט בדיקה מלא (230+ פרמטרים)',
  } satisfies Localized,
  step4FullChecklistSub: {
    en: 'Interactive inspection across all technical diagnostic criteria',
    ru: 'Интерактивная проверка по всем критериям технической диагностики',
    he: 'בדיקה אינטראקטיבית בכל מדדי האבחון הטכני',
  } satisfies Localized,
  step4AuditProtocolTitle: {
    en: 'Audit Protocol & Calculation Methodology',
    ru: 'Протокол выполненного аудита и методика расчёта',
    he: 'פרוטוקול הביקורת ומתודולוגיית החישוב',
  } satisfies Localized,
  step4AuditProtocolSub: {
    en: 'Detailed engineering protocol generated by Chromium Audit Lab',
    ru: 'Инженерный протокол тестирования лаборатории Chromium',
    he: 'פרוטוקול הנדסי שהופק על ידי מעבדת Chromium',
  } satisfies Localized,
  step4TechScalesTag: { en: 'Key indicators', ru: 'Основные показатели', he: 'מדדים עיקריים' } satisfies Localized,
  step4TechLoss: { en: 'Loss', ru: 'Потери', he: 'אובדן' } satisfies Localized,
  step4TechChecks: { en: 'Audit level', ru: 'Уровень аудита', he: 'רמת הביקורת' } satisfies Localized,
  step4TechAreas: { en: 'Areas', ru: 'Направлений', he: 'תחומים' } satisfies Localized,
  step4TechSite: { en: 'Website', ru: 'Сайт', he: 'אתר' } satisfies Localized,
  step4CwvTitle: {
    en: 'Speed & Core Web Vitals',
    ru: 'Скорость и Core Web Vitals',
    he: 'מהירות ו-Core Web Vitals',
  } satisfies Localized,
  step4CwvTag: { en: 'Google Lighthouse', ru: 'Google Lighthouse', he: 'Google Lighthouse' } satisfies Localized,
  step4CwvColMetric: { en: 'Metric', ru: 'Метрика', he: 'מדד' } satisfies Localized,
  step4CwvColMobile: { en: 'Mobile (iPhone SE)', ru: 'Mobile (iPhone SE)', he: 'Mobile (iPhone SE)' } satisfies Localized,
  step4CwvColDesktop: { en: 'Desktop', ru: 'Desktop', he: 'Desktop' } satisfies Localized,
  step4CwvMetricPerf: { en: 'Performance', ru: 'Performance', he: 'Performance' } satisfies Localized,
  step4CwvMetricA11y: { en: 'Accessibility', ru: 'Accessibility', he: 'Accessibility' } satisfies Localized,
  step4CwvMetricBp: { en: 'Best practices', ru: 'Best practices', he: 'Best practices' } satisfies Localized,
  step4CwvMetricSeo: { en: 'SEO', ru: 'SEO', he: 'SEO' } satisfies Localized,
  step4CwvMetricFcp: { en: 'FCP', ru: 'FCP', he: 'FCP' } satisfies Localized,
  step4CwvMetricLcp: { en: 'LCP', ru: 'LCP', he: 'LCP' } satisfies Localized,
  step4CwvMetricCls: { en: 'CLS', ru: 'CLS', he: 'CLS' } satisfies Localized,
  step4CwvFunnel: {
    en: 'Funnel pages',
    ru: 'Страницы воронки',
    he: 'עמודי המשפך',
  } satisfies Localized,
  /** Free audit always walks 1 homepage. */
  step4CwvFunnelCount: { en: '1/1', ru: '1/1', he: '1/1' } satisfies Localized,
  step4SprintCta: {
    en: 'Fix Sprint: Eliminate all identified funnel bottlenecks in 3–5 days',
    ru: 'Спринт исправлений: устраняем все найденные сбои воронки за 3–5 дней',
    he: 'ספרינט תיקונים: ביטול כל כשלי המשפך שאותרו תוך 3–5 ימים',
  } satisfies Localized,

  /* ---- Step 4: Vertical Funnel Journey (Option 1) ---- */
  step4JourneyKicker: {
    en: '§ 04 — USER JOURNEY & FUNNEL BREAKDOWN',
    ru: '§ 04 — АНАТОМИЯ ВОРОНКИ И ТОЧКИ СБОЕВ',
    he: '§ 04 — מסלול הלקוח ונקודות הכשל במשפך',
  } satisfies Localized,
  step4HeadlinePrefix: {
    en: 'Where your website loses up to ',
    ru: 'Где ваш сайт теряет до ',
    he: 'איפה האתר שלכם מאבד עד ',
  } satisfies Localized,
  step4HeadlineSuffix: {
    en: ' of potential clients',
    ru: ' потенциальных клиентов',
    he: ' מהלקוחות הפוטנציאליים',
  } satisfies Localized,
  step4PillLoss: {
    en: 'Total loss: −{p}%',
    ru: 'Суммарные потери: −{p}%',
    he: 'סך אובדן: −{p}%',
  } satisfies Localized,
  step4PillScore: {
    en: 'Funnel Score: {score}/100 ({status})',
    ru: 'Оценка воронки: {score}/100 ({status})',
    he: 'ציון משפך: {score}/100 ({status})',
  } satisfies Localized,
  step4PillBottlenecks: {
    en: '{n} critical drop-off points',
    ru: '{n} критических сбоя воронки',
    he: '{n} נקודות כשל קריטיות',
  } satisfies Localized,
  step4PillUpside: {
    en: 'Growth upside: +{p}% leads',
    ru: 'Потенциал роста: +{p}% заявок',
    he: 'פוטנציאל גידול: +{p}% פניות',
  } satisfies Localized,
  step4PillClients: {
    en: 'At risk: ≈ {n} clients/mo',
    ru: 'Под угрозой: ≈ {n} клиентов/мес',
    he: 'בסיכון: כ-~{n} לקוחות/חודש',
  } satisfies Localized,
  step4CardColUser: {
    en: 'Customer action',
    ru: 'Что делает клиент',
    he: 'מה עושה הלקוח',
  } satisfies Localized,
  step4CardColIssue: {
    en: 'Where friction occurs',
    ru: 'Где возникает сбой',
    he: 'היכן מתרחש הכשל',
  } satisfies Localized,
  step4JourneyHeroL1: {
    en: 'WHERE YOUR WEBSITE LOSES',
    ru: 'ГДЕ ВАШ САЙТ ТЕРЯЕТ',
    he: 'איפה האתר שלכם מאבד',
  } satisfies Localized,
  step4JourneyHeroL2: {
    en: 'UP TO {p}% OF CLIENTS',
    ru: 'ДО {p}% ПОТЕНЦИАЛЬНЫХ КЛИЕНТОВ',
    he: 'עד {p}% מהלקוחות הפוטנציאליים',
  } satisfies Localized,
  step4JourneySub: {
    en: 'Step-by-step breakdown of the visitor path from search to checkout. We identified critical bottlenecks where customers drop off before leaving an inquiry.',
    ru: 'Пошаговый разбор пути посетителя от первого поиска до заявки. Мы проверили ключевые этапы и выявили, где клиенты спотыкаются и уходят к конкурентам.',
    he: 'פירוק שלב-אחר-שלב של מסלול המבקר מחיפוש ראשוני ועד שליחת פנייה. בדקנו את השלבים המרכזיים ואיתרנו היכן לקוחות נושרים ועוברים למתחרים.',
  } satisfies Localized,
  step4JourneyVerdict: {
    en: 'Funnel Verdict: Out of 100 potential customers, only ~{retained} reach checkout. The funnel breaks down at key friction points.',
    ru: 'Вердикт воронки: из 100 потенциальных клиентов до заявки доходят только ~{retained}. Воронка даёт сбой на ключевых этапах пути.',
    he: 'פסיקת המשפך: מתוך 100 לקוחות פוטנציאליים, רק כ-~{retained} מגיעים להשלמת פנייה. המשפך כושל בנקודות חיכוך קריטיות.',
  } satisfies Localized,
  step4JourneySummaryLossLabel: {
    en: 'Funnel conversion leak',
    ru: 'Потери конверсии',
    he: 'אובדן המרה במשפך',
  } satisfies Localized,
  step4JourneySummaryLossSub: {
    en: 'lost across funnel stages',
    ru: 'отсекаются на этапах воронки',
    he: 'נושרים בשלבי המשפך',
  } satisfies Localized,
  step4JourneySummaryScoreLabel: {
    en: 'Funnel health index',
    ru: 'Общая оценка воронки',
    he: 'מדד תקינות המשפך',
  } satisfies Localized,
  step4JourneySummaryScoreSub: {
    en: 'out of 100 (230+ checks)',
    ru: 'из 100 по 230+ тестам',
    he: 'מתוך 100 (230+ בדיקות)',
  } satisfies Localized,
  step4JourneyTimelineHeading: {
    en: 'Step-by-Step Funnel Journey: Where Visitors Drop Off',
    ru: 'Путь клиента: 4 ключевых этапа воронки',
    he: 'מסלול הלקוח: 4 שלבי המשפך שבהם מאבדים לקוחות',
  } satisfies Localized,
  step4JourneyTimelineSub: {
    en: 'Follow the vertical line down to see what happens at each stage of the visit and why visitors abandon the site.',
    ru: 'Двигайтесь по вертикальной линии вниз, чтобы увидеть, что происходит на каждом этапе визита и почему посетители уходят.',
    he: 'עקבו לאורך הקו האנכי כדי לראות מה מתרחש בכל שלב בביקור ומדוע לקוחות נוטשים את האתר.',
  } satisfies Localized,

  /* 4 Journey Stages */
  step4Stage1Tag: {
    en: 'Stage 01 · Search & AI',
    ru: 'Этап 01 · Привлечение и поиск',
    he: 'שלב 01 · איתור ונראות בחיפוש',
  } satisfies Localized,
  step4Stage1Title: {
    en: 'Can new customers find your site in Google & AI?',
    ru: 'Находят ли сайт в Google и AI-поисковиках?',
    he: 'האם לקוחות חדשים מוצאים את האתר בגוגל וב-AI?',
  } satisfies Localized,
  step4Stage1ActionLabel: {
    en: 'What the user does:',
    ru: 'Что делает клиент:',
    he: 'מה עושה הלקוח:',
  } satisfies Localized,
  step4Stage1ActionDesc: {
    en: 'Searches for your service in Google, ChatGPT, or Perplexity to find a solution.',
    ru: 'Ищет ваши услуги в поиске Google или запрашивает рекомендации у ChatGPT и Perplexity.',
    he: 'מחפש את השירותים שלכם בגוגל או מבקש המלצות מ-ChatGPT ומ-Perplexity.',
  } satisfies Localized,
  step4Stage1IssueLabel: {
    en: 'Where the friction occurs:',
    ru: 'Где возникает сбой:',
    he: 'היכן מתרחש הכשל:',
  } satisfies Localized,
  step4Stage1IssueDesc: {
    en: 'Missing structured data (Schema.org), weak snippets, or poor indexing cause search engines and AI to overlook your services.',
    ru: 'Отсутствие микроразметки (Schema.org), слабые сниппеты и проблемы индексации мешают сайту попадать в топ и в ответы AI.',
    he: 'היעדר נתונים מובנים (Schema.org), תגיות חלשות ואינדוקס לקוי גורמים למנועי חיפוש ול-AI לפספס את השירותים שלכם.',
  } satisfies Localized,
  step4Stage1IssueMetrics: {
    en: 'Lighthouse SEO mobile {seoM}/100, desktop {seoD}/100; AI visibility {ai}/100. About {loss}% of the leak is demand that never reaches the site.',
    ru: 'Lighthouse SEO: телефон {seoM}/100, десктоп {seoD}/100; AI-видимость {ai}/100. Около {loss}% утечки — спрос, который до сайта не доходит.',
    he: 'Lighthouse SEO: מובייל {seoM}/100, דסקטופ {seoD}/100; נראות AI {ai}/100. כ-{loss}% מהדליפה — ביקוש שלא מגיע לאתר.',
  } satisfies Localized,
  step4Stage1IssueScore: {
    en: 'Search {seo}/100 and AI {ai}/100 — about {loss}% of the leak is demand that never finds the site (snippets, index, AI crawlers).',
    ru: 'Поиск {seo}/100 и AI {ai}/100 — около {loss}% утечки: спрос не находит сайт (сниппеты, индекс, AI-краулеры).',
    he: 'חיפוש {seo}/100 ו-AI {ai}/100 — כ-{loss}% מהדליפה: ביקוש שלא מוצא את האתר (snippet, אינדקס, בוטי AI).',
  } satisfies Localized,
  step4Stage1LossText: {
    en: 'Lost search & AI potential',
    ru: 'Потери потенциального спроса',
    he: 'אובדן פוטנציאל חיפוש ו-AI',
  } satisfies Localized,

  step4Stage2Tag: {
    en: 'Stage 02 · First Click & Mobile Speed',
    ru: 'Этап 02 · Первый экран и скорость',
    he: 'שלב 02 · כניסה ראשונה ומהירות מובייל',
  } satisfies Localized,
  step4Stage2Title: {
    en: 'Does the visitor wait for the page to load?',
    ru: 'Дожидается ли посетитель загрузки сайта?',
    he: 'האם המבקר ממתין לטעינת האתר?',
  } satisfies Localized,
  step4Stage2ActionLabel: {
    en: 'What the user does:',
    ru: 'Что делает клиент:',
    he: 'מה עושה הלקוח:',
  } satisfies Localized,
  step4Stage2ActionDesc: {
    en: 'Clicks your link or ad from a smartphone and waits for the screen to become interactive.',
    ru: 'Кликает по ссылке или рекламе со смартфона и ждёт появления контента.',
    he: 'מקליק על קישור או מודעה בסמארטפון וממתין להופעת התוכן.',
  } satisfies Localized,
  step4Stage2IssueLabel: {
    en: 'Where the friction occurs:',
    ru: 'Где возникает сбой:',
    he: 'היכן מתרחש הכשל:',
  } satisfies Localized,
  step4Stage2IssueDesc: {
    en: 'Slow mobile render (>2.5s on 4G) and layout jumps (CLS). Visitors leave before the page even finishes loading.',
    ru: 'Задержка отрисовки экрана более 2.5–3.5 секунд на 4G и скачки вёрстки. Посетители закрывают вкладку, не дождавшись загрузки.',
    he: 'עיכוב בטעינת מסך ראשון מעל 2.5–3.5 שניות ב-4G ותזוזות עימוד. גולשים סוגרים את הדף עוד לפני שהוצג במלואו.',
  } satisfies Localized,
  /** Speed issue with lab numbers (mobile Lighthouse). */
  step4Stage2IssueMetrics: {
    en: 'Lab: mobile Performance {perf}/100, LCP {lcp}, CLS {cls}. Above ~2.5 s LCP or a jumpy layout, people close the tab before the screen settles.',
    ru: 'Замер: Performance на телефоне {perf}/100, LCP {lcp}, CLS {cls}. При LCP выше ~2.5 с или скачках вёрстки вкладку закрывают до отрисовки экрана.',
    he: 'מדידה: Performance במובייל {perf}/100, LCP {lcp}, CLS {cls}. מעל ~2.5 שנ׳ LCP או קפיצות עימוד — סוגרים את הלשונית לפני שהמסך מתייצב.',
  } satisfies Localized,
  step4Stage2IssueScore: {
    en: 'Speed scale {score}/100 — about {loss}% of visits still drop while the page loads on phones.',
    ru: 'Шкала скорости {score}/100 — около {loss}% визитов всё ещё срывается на загрузке на телефоне.',
    he: 'מדד מהירות {score}/100 — כ-{loss}% מהביקורים עדיין נושרים בטעינה במובייל.',
  } satisfies Localized,
  step4Stage2LossText: {
    en: 'Lost mobile visits',
    ru: 'Потери мобильных визитов',
    he: 'אובדן ביקורים במובייל',
  } satisfies Localized,

  step4Stage3Tag: {
    en: 'Stage 03 · Trust & Security',
    ru: 'Этап 03 · Доверие и безопасность',
    he: 'שלב 03 · אמון ואבטחת מידע',
  } satisfies Localized,
  step4Stage3Title: {
    en: 'Does the site inspire safety and confidence?',
    ru: 'Вызывает ли сайт доверие и безопасен ли он?',
    he: 'האם האתר משדר ביטחון ואמינות?',
  } satisfies Localized,
  step4Stage3ActionLabel: {
    en: 'What the user does:',
    ru: 'Что делает клиент:',
    he: 'מה עושה הלקוח:',
  } satisfies Localized,
  step4Stage3ActionDesc: {
    en: 'Evaluates your credibility, looks for security indicators, and expects a reliable experience.',
    ru: 'Оценивает надёжность компании, обращает внимание на безопасность браузера и стабильность работы.',
    he: 'בוחן את אמינות העסק, שם לב לרמת האבטחה בדפדפן ומצפה לחוויה יציבה ללא תקלות.',
  } satisfies Localized,
  step4Stage3IssueLabel: {
    en: 'Where the friction occurs:',
    ru: 'Где возникает сбой:',
    he: 'היכן מתרחש הכשל:',
  } satisfies Localized,
  step4Stage3IssueDesc: {
    en: 'Missing security headers (CSP/HSTS), console script errors, or risks of browser security alerts scare clients away.',
    ru: 'Ошибки скриптов в консоли, неполные заголовки безопасности (CSP/HSTS) или риски предупреждений браузера.',
    he: 'שגיאות סקריפט, כותרי אבטחה חסרים (CSP/HSTS) וסיכון להתראות אבטחה שמרתיעות לקוחות.',
  } satisfies Localized,
  step4Stage3IssueScore: {
    en: 'Security & stability {score}/100 — about {loss}% of the leak. Typical gaps: CSP/HSTS headers, console script errors, or browser warning risk.',
    ru: 'Безопасность и стабильность {score}/100 — около {loss}% утечки. Типичные пробелы: заголовки CSP/HSTS, ошибки скриптов в консоли или риск предупреждения браузера.',
    he: 'אבטחה ויציבות {score}/100 — כ-{loss}% מהדליפה. פערים אופייניים: כותרי CSP/HSTS, שגיאות סקריפט או סיכון להתראת דפדפן.',
  } satisfies Localized,
  step4Stage3LossText: {
    en: 'Lost to trust concerns',
    ru: 'Потери из-за сбоев доверия',
    he: 'אובדן עקב כשלי אמון ואבטחה',
  } satisfies Localized,

  step4Stage4Tag: {
    en: 'Stage 04 · Conversion & Contact Forms',
    ru: 'Этап 04 · Оформление заявки и контакты',
    he: 'שלב 04 · השלמת פנייה וטפסים',
  } satisfies Localized,
  step4Stage4Title: {
    en: 'Do forms and call-to-action buttons work smoothly?',
    ru: 'Срабатывает ли форма заказа и кнопка заявки?',
    he: 'האם טופסי הפנייה וכפתורי הקריאה לפעולה מגיבים?',
  } satisfies Localized,
  step4Stage4ActionLabel: {
    en: 'What the user does:',
    ru: 'Что делает клиент:',
    he: 'מה עושה הלקוח:',
  } satisfies Localized,
  step4Stage4ActionDesc: {
    en: 'Ready to buy: fills in phone or email, taps WhatsApp, or submits an inquiry form.',
    ru: 'Готов обратиться: вводит телефон/email, нажимает кнопку отправки или переходит в WhatsApp.',
    he: 'מוכן לפנות: מזין טלפון/מייל, לוחץ על כפתור השליחה או פותח וואטסאפ.',
  } satisfies Localized,
  step4Stage4IssueLabel: {
    en: 'Where the friction occurs:',
    ru: 'Где возникает сбой:',
    he: 'היכן מתרחש הכשל:',
  } satisfies Localized,
  step4Stage4IssueDesc: {
    en: 'Unresponsive mobile buttons, rigid input masking, or form validation crashes cause high-intent buyers to drop off right at the finish line.',
    ru: 'Неотзывчивые кнопки на смартфонах, сбои маски ввода телефона или зависание формы срывают готовую заявку в самый последний момент.',
    he: 'כפתורים שאינם מגיבים במובייל, אימות שדות קשיח או תקיעת הטופס מובילים לנשירת לקוחות בשלים ממש על קו הסיום.',
  } satisfies Localized,
  step4Stage4IssueScore: {
    en: 'Forms & inquiries {score}/100 — about {loss}% drop at the finish: mobile taps, phone masks, spam filters, or a stuck submit.',
    ru: 'Формы и заявки {score}/100 — около {loss}% срыва на финише: тапы на смартфоне, маска телефона, антиспам или зависшая отправка.',
    he: 'טפסים ופניות {score}/100 — כ-{loss}% נשירה בקו הסיום: לחיצות במובייל, מסכת טלפון, אנטי-ספאם או שליחה שנתקעת.',
  } satisfies Localized,
  step4Stage4LossText: {
    en: 'Lost checkout inquiries',
    ru: 'Срыв готовых заявок',
    he: 'אובדן פניות מוכנות',
  } satisfies Localized,

  /* Step 4 funnel ledger: headline, funnel bars, stage list */
  step4MetaReport: {
    en: 'Audit report · 230+ checks',
    ru: 'Отчёт об аудите · 230+ проверок',
    he: 'דוח ביקורת · 230+ בדיקות',
  } satisfies Localized,
  step4FunnelHeadline: {
    en: 'Out of 100 visitors, only {kept} reach an inquiry',
    ru: 'Из 100 посетителей до заявки доходят {kept}',
    he: 'מתוך 100 מבקרים, רק {kept} מגיעים לפנייה',
  } satisfies Localized,
  step4FunnelSub: {
    en: 'Your site loses {p}% of clients across four funnel stages. Overall funnel score: {score} out of 100 ({status}).',
    ru: 'Сайт теряет {p}% клиентов на четырёх этапах воронки. Общая оценка воронки: {score} из 100 ({status}).',
    he: 'האתר מאבד {p}% מהלקוחות בארבעה שלבי המשפך. ציון המשפך הכולל: {score} מתוך 100 ({status}).',
  } satisfies Localized,
  step4FunnelEntry: {
    en: 'Visitors',
    ru: 'Посетители',
    he: 'מבקרים',
  } satisfies Localized,
  step4FunnelReached: {
    en: 'Left an inquiry',
    ru: 'Оставили заявку',
    he: 'השאירו פנייה',
  } satisfies Localized,
  step4FunnelLegendKept: {
    en: 'Moved on',
    ru: 'Прошли дальше',
    he: 'המשיכו הלאה',
  } satisfies Localized,
  step4FunnelLegendLost: {
    en: 'Left at this stage',
    ru: 'Ушли на этапе',
    he: 'עזבו בשלב זה',
  } satisfies Localized,
  step4StageShortSearch: { en: 'Search and AI', ru: 'Поиск и AI', he: 'חיפוש ו-AI' } satisfies Localized,
  step4StageShortSpeed: { en: 'Load speed', ru: 'Скорость', he: 'מהירות' } satisfies Localized,
  step4StageShortTrust: { en: 'Trust', ru: 'Доверие', he: 'אמון' } satisfies Localized,
  step4StageShortForm: { en: 'Inquiry form', ru: 'Заявка', he: 'טופס פנייה' } satisfies Localized,
  step4FunnelTitle: { en: 'Visitor funnel', ru: 'Воронка посетителей', he: 'משפך המבקרים' } satisfies Localized,
  step4FunnelCaption: { en: 'per 100 visitors', ru: 'на 100 посетителей', he: 'לכל 100 מבקרים' } satisfies Localized,
  step4FunnelPassed: { en: 'of 100 move on', ru: 'из 100 идут дальше', he: 'מתוך 100 ממשיכים' } satisfies Localized,
  step4StepLabel: { en: 'Step', ru: 'Шаг', he: 'שלב' } satisfies Localized,
  step4HeroLabel: { en: 'Your site is losing', ru: 'Ваш сайт теряет', he: 'האתר שלכם מאבד' } satisfies Localized,
  step4HeroPerMonth: { en: 'every month', ru: 'каждый месяц', he: 'בכל חודש' } satisfies Localized,
  step4PerMonthShort: { en: '/mo', ru: '/мес', he: '/חודש' } satisfies Localized,
  step4HeroPctTail: {
    en: 'of clients who already reached your site',
    ru: 'клиентов, которые уже пришли на сайт',
    he: 'מהלקוחות שכבר הגיעו לאתר',
  } satisfies Localized,
  step4StatYear: { en: 'lost per year', ru: 'теряется за год', he: 'אובדים בשנה' } satisfies Localized,
  step4StatClients: { en: 'clients lost per month', ru: 'клиентов уходят в месяц', he: 'לקוחות אובדים בחודש' } satisfies Localized,
  step4StatReach: { en: 'of 100 visitors leave an inquiry', ru: 'из 100 посетителей оставляют заявку', he: 'מתוך 100 מבקרים משאירים פנייה' } satisfies Localized,
  step4StatUpside: { en: 'more inquiries once leaks are closed', ru: 'больше заявок, если закрыть утечки', he: 'יותר פניות אחרי סגירת הדליפות' } satisfies Localized,
  step4StatScore: { en: 'funnel score', ru: 'оценка воронки', he: 'ציון המשפך' } satisfies Localized,
  step4WhereTitle: { en: 'Where the money leaks', ru: 'Куда уходят деньги', he: 'לאן הכסף דולף' } satisfies Localized,
  step4WhereSub: {
    en: 'Losses by funnel stage, from the biggest to the smallest.',
    ru: 'Потери по этапам воронки — от самой большой к меньшей.',
    he: 'האובדן לפי שלבי המשפך, מהגדול לקטן.',
  } satisfies Localized,
  step4StageShare: {
    en: '{p}% of visitors leave here · {s}% of all losses',
    ru: 'здесь уходят {p}% посетителей · {s}% всех потерь',
    he: '{p}% מהמבקרים עוזבים כאן · {s}% מכלל האובדן',
  } satisfies Localized,
  step4LeaksAcross: { en: 'across all funnel stages', ru: 'на всех этапах воронки', he: 'בכל שלבי המשפך' } satisfies Localized,
  step4StageVisitors: { en: '{p}% of visitors leave here', ru: 'здесь уходят {p}% посетителей', he: '{p}% מהמבקרים עוזבים כאן' } satisfies Localized,
  step4StageShareTag: { en: '{s}% of all losses', ru: '{s}% всех потерь', he: '{s}% מכלל האובדן' } satisfies Localized,
  step4StageWhyLink: { en: 'Why: {stage}', ru: 'Почему: {stage}', he: 'למה: {stage}' } satisfies Localized,
  step4FixKicker: { en: 'How we fix it', ru: 'Как мы это решим', he: 'איך נפתור את זה' } satisfies Localized,
  step4FixTitlePre: { en: 'We close the leaks in', ru: 'Закроем утечки за', he: 'נסגור את הדליפות תוך' } satisfies Localized,
  step4FixTitleDays: { en: '3–5 days', ru: '3–5 дней', he: '\u20663–5\u2069 ימים' } satisfies Localized,
  step4FixSub: {
    en: 'A fix sprint for the problems we found: our team does the work, your team does not have to.',
    ru: 'Спринт исправлений по найденным проблемам: всё делаем сами, без участия вашей команды.',
    he: 'ספרינט תיקונים לבעיות שמצאנו: אנחנו עושים את העבודה, בלי לערב את הצוות שלכם.',
  } satisfies Localized,
  step4FixPriceLabel: { en: 'Fixed sprint price', ru: 'Фиксированная цена спринта', he: 'מחיר קבוע לספרינט' } satisfies Localized,
  step4FixCta: { en: 'Start the sprint', ru: 'Запустить спринт', he: 'להתחיל את הספרינט' } satisfies Localized,
  step4FixListTitle: { en: 'What we fix', ru: 'Что исправим', he: 'מה נתקן' } satisfies Localized,
  step4FixBackPctTail: { en: 'of visitors back', ru: 'посетителей обратно', he: 'מהמבקרים חוזרים' } satisfies Localized,
  step4FixTileDays: { en: 'sprint length', ru: 'срок спринта', he: 'משך הספרינט' } satisfies Localized,
  step4FixTilePayback: { en: 'sprint pays back in', ru: 'окупаемость спринта', he: 'החזר ההשקעה בספרינט' } satisfies Localized,
  step4FixPaybackValue: { en: '{n} days', ru: '{n} дн.', he: '{n} ימים' } satisfies Localized,
  step4FixTileChecks: { en: 'checks in the Pro audit', ru: 'проверок в аудите Pro', he: 'בדיקות בביקורת Pro' } satisfies Localized,
  step4FixTileAudit: { en: 'Pro audit instead of {old}', ru: 'аудит Pro вместо {old}', he: 'ביקורת Pro במקום {old}' } satisfies Localized,
  step4FixBonusTag: { en: 'Bonus', ru: 'Бонус', he: 'בונוס' } satisfies Localized,
  step4FixBonusTitle: { en: 'Deep Pro audit as a gift', ru: 'Глубокий аудит Pro в подарке', he: 'ביקורת Pro מעמיקה במתנה' } satisfies Localized,
  step4FixBonusBody: {
    en: '230+ site checks are included in the sprint price.',
    ru: '230+ проверок сайта входят в стоимость спринта.',
    he: '230+ בדיקות לאתר כלולות במחיר הספרינט.',
  } satisfies Localized,
  step4FixTotal: { en: 'Fix total', ru: 'Сумма исправлений', he: 'סכום התיקונים' } satisfies Localized,
  /** Shown under the sprint price on the lilac plate: price + turnaround. */
  step4FixTotalTerm: {
    en: 'Turnaround',
    ru: 'Срок исправления',
    he: 'משך התיקון',
  } satisfies Localized,
  step4FixIncludesPro: { en: 'The price includes the Pro audit: full report on 230+ checks', ru: 'В стоимость входит аудит Pro: полный отчёт по 230+ проверкам', he: 'המחיר כולל ביקורת Pro: דוח מלא על 230+ בדיקות' } satisfies Localized,
  step4FixEstimateNote: {
    en: '* Preliminary estimate. The final price and timeline are agreed with you.',
    ru: '* Предварительный расчёт. Точная цена и сроки — после согласования.',
    he: '* הערכה ראשונית. המחיר ולוח הזמנים הסופיים — לאחר תיאום.',
  } satisfies Localized,
  step4Total: { en: 'Total', ru: 'Итого', he: 'סה״כ' } satisfies Localized,
  step4WhyTitle: { en: 'Why it happens', ru: 'Почему это происходит', he: 'למה זה קורה' } satisfies Localized,
  step4WhySub: {
    en: 'The visitor’s path step by step: what they do and where the site loses them.',
    ru: 'Путь клиента шаг за шагом: что он делает и где сайт его теряет.',
    he: 'מסלול הלקוח צעד אחר צעד: מה הוא עושה והיכן האתר מאבד אותו.',
  } satisfies Localized,
  step4HeroContextMoney: {
    en: 'With {rev} monthly revenue, the site misses {p}% of inquiries. That is {yearly} a year.',
    ru: 'При выручке {rev} в месяц сайт недополучает {p}% заявок. За год это {yearly}.',
    he: 'בהכנסה של {rev} בחודש האתר מפספס {p}% מהפניות. בשנה זה {yearly}.',
  } satisfies Localized,
  step4HeroContextPct: {
    en: 'Out of every 100 visitors, {lost} leave without sending an inquiry. They are ready to buy, but the site lets them go.',
    ru: 'Из каждых 100 посетителей {lost} уходят, так и не оставив заявку. Они готовы купить, но сайт их упускает.',
    he: 'מתוך כל 100 מבקרים, {lost} עוזבים בלי להשאיר פנייה. הם מוכנים לקנות, אבל האתר מפספס אותם.',
  } satisfies Localized,
  step4HeroCta: { en: 'Get the fix plan', ru: 'Получить план исправлений', he: 'לקבל תוכנית תיקון' } satisfies Localized,
  step4HeroMore: { en: 'See the breakdown', ru: 'Смотреть разбор', he: 'לפירוט המלא' } satisfies Localized,
  step4DotsTitle: { en: 'Out of 100 site visitors', ru: 'Из 100 посетителей сайта', he: 'מתוך 100 מבקרים באתר' } satisfies Localized,
  step4DotsAria: {
    en: '{kept} of 100 visitors leave an inquiry, {lost} leave without one',
    ru: '{kept} из 100 посетителей оставляют заявку, {lost} уходят без неё',
    he: '{kept} מתוך 100 מבקרים משאירים פנייה, {lost} עוזבים בלעדיה',
  } satisfies Localized,
  step4DotsLost: { en: '{n} leave without an inquiry', ru: '{n} уходят без заявки', he: '{n} עוזבים בלי פנייה' } satisfies Localized,
  step4DotsKept: { en: '{n} leave an inquiry', ru: '{n} оставляют заявку', he: '{n} משאירים פנייה' } satisfies Localized,
  step4RingTitle: { en: 'Who reaches an inquiry', ru: 'Кто доходит до заявки', he: 'מי מגיע לפנייה' } satisfies Localized,
  step4RingCenter: { en: 'reach an inquiry', ru: 'доходят до заявки', he: 'מגיעים לפנייה' } satisfies Localized,
  step4RingLegendKept: { en: 'Reach an inquiry', ru: 'Доходят до заявки', he: 'מגיעים לפנייה' } satisfies Localized,
  step4RingLegendLost: { en: 'Lost on the way', ru: 'Теряются по пути', he: 'אובדים בדרך' } satisfies Localized,
  step4LeaksByStage: { en: 'Losses by stage', ru: 'Потери по этапам', he: 'אובדן לפי שלבים' } satisfies Localized,
  step4LeaksTotal: { en: 'Total lost', ru: 'Всего теряется', he: 'סה״כ אובדן' } satisfies Localized,
  step4TopLeaks: { en: 'Biggest leaks', ru: 'Главные утечки', he: 'הדליפות הגדולות' } satisfies Localized,
  step4StatLeakStages: { en: 'funnel stages losing clients', ru: 'этапов воронки теряют клиентов', he: 'שלבי משפך מאבדים לקוחות' } satisfies Localized,
  step4StagesHeading: {
    en: 'Where exactly clients drop off',
    ru: 'Где именно уходят клиенты',
    he: 'היכן בדיוק הלקוחות נושרים',
  } satisfies Localized,
  step4StageClient: { en: 'Visitor', ru: 'Клиент', he: 'הלקוח' } satisfies Localized,
  step4StageFailure: { en: 'Failure', ru: 'Сбой', he: 'הכשל' } satisfies Localized,
  step4StageScore: { en: 'score {score}/100', ru: 'балл {score}/100', he: 'ציון {score}/100' } satisfies Localized,
  step4StageNoLoss: { en: 'no loss', ru: 'без потерь', he: 'ללא אובדן' } satisfies Localized,
  step4BiggestLeak: { en: 'Biggest leak', ru: 'Главная утечка', he: 'הדליפה הגדולה' } satisfies Localized,
  step4PageSpeedLink: {
    en: 'Check in PageSpeed Insights',
    ru: 'Проверить в PageSpeed Insights',
    he: 'בדיקה ב-PageSpeed Insights',
  } satisfies Localized,

  /* Final Outcome Card */
  step4OutcomeTag: {
    en: 'Funnel Outcome',
    ru: 'Итог воронки',
    he: 'סיכום המשפך',
  } satisfies Localized,
  step4OutcomeTitle: {
    en: 'Total Funnel Leak: Up to {p}% of potential clients lost',
    ru: 'Суммарный диагноз: сайт теряет до {p}% обращений',
    he: 'אבחנה מסכמת: האתר מאבד עד {p}% מהפניות',
  } satisfies Localized,
  step4OutcomeDesc: {
    en: 'Every bottleneck above chips away at your conversion rate. Eliminating these 4 friction points recovers lost inquiries without increasing ad spend.',
    ru: 'Каждое узкое место выше отсекает часть посетителей. Устранение этих 4 сбоев возвращает потерянные заявки без увеличения рекламного бюджета.',
    he: 'כל נקודת כשל לעיל גורעת מהמרת האתר. ביטול 4 צווארי הבקבוק הללו מחזיר פניות אבודות לעסק ללא הגדלת תקציב הפרסום.',
  } satisfies Localized,

  /* Tech Details Accordion */
  step4TechSpoilerBtn: {
    en: 'Technical Details & Audit Protocol',
    ru: 'Технические подробности и протокол аудита',
    he: 'פרטים טכניים ופרוטוקול הביקורת',
  } satisfies Localized,
  step4TechSpoilerSub: {
    en: 'Expand to view raw engineering scores, diagnostics breakdown, and complete audit checklist',
    ru: 'Разверните, чтобы увидеть подробные шкалы, критерии диагностики и чеклист для разработчика',
    he: 'הרחיבו לצפייה בציונים הנדסיים מפורטים, פירוק מדדים וצ׳ק-ליסט מלא למפתחים',
  } satisfies Localized,
  scaleSpeed: { en: 'Speed & Mobile UX', ru: 'Скорость и мобильный UX', he: 'מהירות ו-UX למובייל' } satisfies Localized,
  scaleLeads: { en: 'Lead gen & Forms', ru: 'Лиды и формы', he: 'לידים וטפסים' } satisfies Localized,
  scaleSeo: { en: 'SEO & Visibility', ru: 'SEO и видимость', he: 'SEO ונראות' } satisfies Localized,
  scaleSecurity: {
    en: 'Security & Stability',
    ru: 'Безопасность и стабильность',
    he: 'אבטחה ויציבות',
  } satisfies Localized,
  scaleAi: {
    en: 'AI Visibility',
    ru: 'AI Visibility',
    he: 'נראות AI',
  } satisfies Localized,
  openReport: {
    en: 'Open the full report',
    ru: 'Открыть полный отчёт',
    he: 'לפתיחת הדוח המלא',
  } satisfies Localized,
  scalesApprox: {
    en: 'The audit did not store per-scale scores for this site, so every scale uses the overall score.',
    ru: 'Для этого сайта аудит не сохранил оценки по шкалам, поэтому для каждой шкалы взят общий балл.',
    he: 'הביקורת לא שמרה ציונים לפי סקאלה לאתר הזה, ולכן בכל סקאלה נלקח הציון הכללי.',
  } satisfies Localized,

  /* ---- design 2 (report-style blocks) ---- */
  headTagFree: { en: 'Free · no card', ru: 'Бесплатно · без карты', he: 'חינם · בלי כרטיס' } satisfies Localized,
  checkedOn: { en: 'Checked: {d}', ru: 'Проверено: {d}', he: 'נבדק: {d}' } satisfies Localized,
  scoreTag: { en: '4 areas · homepage', ru: '4 направления · главная страница', he: '4 תחומים · דף הבית' } satisfies Localized,
  scoreNote: {
    en: 'Site score {score} of 100. The weakest area is “{area}” ({value}).',
    ru: 'Оценка сайта {score} из 100. Самая слабая зона — «{area}» ({value}).',
    he: 'ציון האתר {score} מתוך 100. התחום החלש ביותר הוא «{area}» ({value}).',
  } satisfies Localized,
  scalesTag: { en: 'Key indicators', ru: 'Основные показатели', he: 'מדדים עיקריים' } satisfies Localized,
  top3Title: { en: 'Top-3 sources of loss', ru: 'Топ-3 источника потерь', he: 'שלושת מקורות ההפסד המובילים' } satisfies Localized,
  top3Sub: {
    en: 'The problems that cost you the most inquiries and money.',
    ru: 'Проблемы, которые сильнее всего стоят вам заявок и денег.',
    he: 'הבעיות שעולות לכם הכי הרבה פניות וכסף.',
  } satisfies Localized,
  rowProblem: { en: 'Problem', ru: 'Проблема', he: 'הבעיה' } satisfies Localized,
  rowLoss: { en: 'Business loss', ru: 'Потери бизнеса', he: 'הפסד לעסק' } satisfies Localized,
  rowSolution: { en: 'Solution by Erythro.ai', ru: 'Решение от Erythro.ai', he: 'הפתרון של Erythro.ai' } satisfies Localized,
  lossPerMonth: { en: '−{amount} per month.', ru: '−{amount} в месяц.', he: '−{amount} לחודש.' } satisfies Localized,
  fixLink: { en: 'Included in the fix sprint ↓', ru: 'Входит в спринт исправлений ↓', he: 'כלול בספרינט התיקונים ↓' } satisfies Localized,
  areaLoss: {
    speed: {
      en: 'Every extra 100 ms of delay lowers conversion and raises the cost of a lead.',
      ru: 'Каждые +100 мс задержки снижают конверсию и увеличивают стоимость заявки.',
      he: 'כל 100 מילישניות נוספות של השהיה מורידות המרה ומייקרות כל ליד.',
    },
    forms: {
      en: 'Visitors ready to write drop off on the way to the form, or spam buries the real inquiries.',
      ru: 'Посетители, готовые написать, отваливаются по пути к форме, а настоящие заявки тонут в спаме.',
      he: 'גולשים שרצו לפנות נושרים בדרך לטופס, ופניות אמיתיות טובעות בספאם.',
    },
    security: {
      en: 'Browser warnings and downtime scare customers off and cost you trust.',
      ru: 'Предупреждения браузера и простои отпугивают клиентов и стоят вам доверия.',
      he: 'אזהרות דפדפן והשבתות מרחיקות לקוחות וגורעות מהאמון.',
    },
    visibility: {
      en: 'Customers who look for your service in Google or ChatGPT find competitors instead.',
      ru: 'Клиенты, которые ищут вашу услугу в Google или ChatGPT, находят конкурентов.',
      he: 'לקוחות שמחפשים את השירות שלכם בגוגל או ב-ChatGPT מוצאים מתחרים.',
    },
  } satisfies Record<CalcArea, Localized>,
  areaFix: {
    speed: {
      en: 'Image compression, critical CSS and CDN caching.',
      ru: 'Сжатие изображений, критический CSS и CDN-кэширование.',
      he: 'דחיסת תמונות, CSS קריטי ו-CDN.',
    },
    forms: {
      en: 'A shorter path to the form, spam protection, instant reply.',
      ru: 'Короткий путь к форме, защита от спама, мгновенный ответ.',
      he: 'דרך קצרה לטופס, הגנה מספאם ומענה מיידי.',
    },
    security: {
      en: 'HTTPS, security headers and error monitoring.',
      ru: 'HTTPS, заголовки безопасности и контроль ошибок.',
      he: 'HTTPS, כותרות אבטחה וניטור שגיאות.',
    },
    visibility: {
      en: 'Markup, llms.txt and fixes for search and AI indexing.',
      ru: 'Разметка, llms.txt и правки для индексации поиском и AI.',
      he: 'מיקרו-דאטה, llms.txt ותיקונים לאינדוקס בחיפוש וב-AI.',
    },
  } satisfies Record<CalcArea, Localized>,
  checkTitle: { en: 'All scales checked', ru: 'Все шкалы проверки', he: 'כל סקאלות הבדיקה' } satisfies Localized,
  checkTag: { en: 'Results: {n} of {total}', ru: 'Результаты: {n} из {total}', he: 'תוצאות: {n} מתוך {total}' } satisfies Localized,
  filterAll: { en: 'All', ru: 'Все', he: 'הכול' } satisfies Localized,
  noItems: { en: 'No scales with this status.', ru: 'Нет шкал с таким статусом.', he: 'אין סקאלות בסטטוס הזה.' } satisfies Localized,
  protoTitle: { en: 'How the loss is calculated', ru: 'Как посчитаны потери', he: 'איך חושבו ההפסדים' } satisfies Localized,
  protoSub: {
    en: 'Your numbers and the audit scores go into one formula.',
    ru: 'Ваши цифры и баллы аудита попадают в одну формулу.',
    he: 'המספרים שלכם וציוני הביקורת נכנסים לנוסחה אחת.',
  } satisfies Localized,
  protoScore: { en: 'Site score', ru: 'Оценка сайта', he: 'ציון האתר' } satisfies Localized,
  protoNotes: [
    {
      en: 'Each defect found by the audit maps to a typical share of lost inquiries: speed up to 20%, forms 15%, visibility 10%, security 5%.',
      ru: 'Каждому дефекту из аудита соответствует типичная доля потерянных обращений: скорость до 20%, формы 15%, видимость 10%, безопасность 5%.',
      he: 'לכל ליקוי בביקורת מתאים נתח אופייני של פניות אבודות: מהירות עד 20%, טפסים 15%, נראות 10%, אבטחה 5%.',
    },
    {
      en: 'The lost share is applied to your monthly revenue: revenue × p / (1 − p).',
      ru: 'Доля потерь применяется к вашему месячному доходу: доход × p / (1 − p).',
      he: 'נתח ההפסד מוחל על ההכנסה החודשית שלכם: הכנסה × p / (1 − p).',
    },
    {
      en: 'Payback compares the loss with the fixed price of the fix sprint.',
      ru: 'Окупаемость сравнивает потери с фиксированной ценой спринта исправлений.',
      he: 'ההחזר משווה את ההפסד למחיר הקבוע של ספרינט התיקונים.',
    },
    {
      en: 'The site was checked on 230+ parameters; the free audit shows a short summary. The full report on every check is in the Pro audit, which comes with the fix sprint.',
      ru: 'Сайт проверен по 230+ параметрам, в бесплатном аудите показана краткая сводка. Полный отчёт по каждой проверке даёт аудит Pro, он входит в спринт исправлений.',
      he: 'האתר נבדק לפי 230+ פרמטרים; בביקורת החינמית מוצג סיכום קצר. הדוח המלא על כל בדיקה נמצא בביקורת Pro, הכלולה בספרינט התיקונים.',
    },
  ] as const,
  sprintBadge: { en: 'Sprint', ru: 'Спринт', he: 'ספרינט' } satisfies Localized,
  sprintTitle: {
    en: 'Fix sprint: we close the found leaks',
    ru: 'Спринт исправлений: закрываем найденные дыры',
    he: 'ספרינט תיקונים: סוגרים את הדליפות שנמצאו',
  } satisfies Localized,
  sprintIncludes: { en: 'What the sprint fixes', ru: 'Что исправляет спринт', he: 'מה מתקן הספרינט' } satisfies Localized,
  ctaTitle: {
    en: 'Close the leaks and get the lost inquiries back',
    ru: 'Закройте утечки и верните потерянные заявки',
    he: 'סגרו את הדליפות והחזירו את הפניות האבודות',
  } satisfies Localized,
  ctaBody: {
    en: 'We send a short text plan with price and timeline right to WhatsApp.',
    ru: 'Пришлём короткий текстовый план со сметой и сроками прямо в WhatsApp.',
    he: 'נשלח תוכנית כתובה קצרה עם מחיר ולוח זמנים ישר לוואטסאפ.',
  } satisfies Localized,
  flowIn: { en: 'What we check', ru: 'Что проверяем', he: 'מה בודקים' } satisfies Localized,
  flowSteps: { en: 'What the auditor does', ru: 'Что делает аудитор', he: 'מה עושה הבודק' } satisfies Localized,
  flowOut: { en: 'What you get', ru: 'Что вы получите', he: 'מה תקבלו' } satisfies Localized,
  pillHome: { en: 'Homepage', ru: 'Главная страница', he: 'דף הבית' } satisfies Localized,
  pillMobile: { en: 'Mobile', ru: 'Телефон', he: 'מובייל' } satisfies Localized,
  pillDesktop: { en: 'Desktop', ru: 'Компьютер', he: 'מחשב' } satisfies Localized,
  outcomes: [
    { en: 'The loss in ₪ per month', ru: 'Потери в шекелях в месяц', he: 'ההפסד בשקלים בחודש' },
    { en: 'Where exactly the money leaks', ru: 'Куда именно утекают деньги', he: 'לאן בדיוק הכסף מדלף' },
    { en: 'Top-3 problems with solutions', ru: 'Топ-3 проблемы и решения', he: 'שלוש הבעיות המובילות ופתרונות' },
    { en: 'Payback of the fix sprint', ru: 'Срок окупаемости спринта', he: 'החזר ההשקעה בספרינט' },
  ] as const,
  waitingTag: { en: 'Usually 5–10 min', ru: 'Обычно 5–10 мин', he: 'בדרך כלל 5–10 דקות' } satisfies Localized,
  minShort: { en: 'min', ru: 'мин', he: 'דק׳' } satisfies Localized,
  statusOk: { en: 'OK', ru: 'OK', he: 'OK' } satisfies Localized,

  /* ---- hero (giant headings, background words) ---- */
  heroKicker: {
    en: 'AI Audit Online',
    ru: 'AI-аудит онлайн',
    he: 'AI Audit אונליין',
  } satisfies Localized,
  heroLive: { en: 'Auditor online', ru: 'Аудитор онлайн', he: 'הבודק מחובר' } satisfies Localized,
  heroL1: { en: 'How much', ru: 'Сколько', he: 'כמה' } satisfies Localized,
  heroL2: { en: 'money', ru: 'денег', he: 'כסף' } satisfies Localized,
  heroL3: { en: 'does your site lose?', ru: 'теряет ваш сайт?', he: 'האתר שלכם מפסיד?' } satisfies Localized,
  heroWaitL1: { en: 'Auditing', ru: 'Проверяем', he: 'בודקים' } satisfies Localized,
  heroWaitL3: { en: 'right now', ru: 'прямо сейчас', he: 'ממש עכשיו' } satisfies Localized,
  heroReadyL1: { en: 'Done,', ru: 'Готово,', he: 'מוכן,' } satisfies Localized,
  heroReadyL3: { en: 'here is where the money leaks', ru: 'вот где утекают деньги', he: 'כאן הכסף מדלף' } satisfies Localized,
  heroSubForm: {
    en: 'We audit mobile speed, checkout flow, and visibility across Google, ChatGPT, and Perplexity — and calculate your lost revenue.',
    ru: 'Проверяем мобильную скорость, работу заказа и видимость в Google, ChatGPT, Perplexity — рассчитаем сумму упущенной выгоды.',
    he: 'בודקים מהירות במובייל, תקינות תהליך ההזמנה ונראות ב-Google,‏ ChatGPT ו-Perplexity — ומחשבים את ההכנסות האבודות שלכם.',
  } satisfies Localized,
  heroSubFormPrefix: {
    en: 'We audit mobile speed, checkout flow, and visibility across Google, ChatGPT, and Perplexity — and calculate your ',
    ru: 'Проверяем мобильную скорость, работу заказа и видимость в Google, ChatGPT, Perplexity — рассчитаем сумму ',
    he: 'בודקים מהירות במובייל, תקינות תהליך ההזמנה ונראות ב-Google,‏ ChatGPT ו-Perplexity — ומחשבים את ',
  } satisfies Localized,
  heroSubFormHighlight: {
    en: 'lost revenue',
    ru: 'упущенной выгоды',
    he: 'ההכנסות האבודות שלכם',
  } satisfies Localized,
  heroStep2Kicker: {
    en: 'Business Scale & Metrics',
    ru: 'Масштаб бизнеса и доход',
    he: 'נתוני עסק והכנסות',
  } satisfies Localized,
  heroStep2L1: {
    en: 'HOW MUCH IS EVERY',
    ru: 'СКОЛЬКО СТОИТ',
    he: 'כמה עולה לכם',
  } satisfies Localized,
  heroStep2L2: {
    en: 'FUNNEL BREAKDOWN',
    ru: 'КАЖДЫЙ СБОЙ',
    he: 'כל כשל',
  } satisfies Localized,
  heroStep2L3: {
    en: 'COSTING YOU?',
    ru: 'В ВАШЕЙ ВОРОНКЕ?',
    he: 'במשפך ההמרה?',
  } satisfies Localized,
  heroStep2SubPrefix: {
    en: 'Enter your business metrics to translate website errors ',
    ru: 'Укажите параметры бизнеса, чтобы перевести ошибки сайта ',
    he: 'הזינו מדדים עסקיים כדי לתרגם שגיאות באתר ',
  } satisfies Localized,
  heroStep2SubHighlight: {
    en: 'into actual revenue loss',
    ru: 'в реальные суммы потерь',
    he: 'להפסדים כספיים בפועל',
  } satisfies Localized,
  step2OptionalBadge: {
    en: 'Optional step',
    ru: 'Необязательный шаг',
    he: 'שלב רשות',
  } satisfies Localized,
  step2PercentBadge: {
    en: 'Available in % calculation',
    ru: 'Доступен расчёт только в %',
    he: 'זמין לחישוב ב-% בלבד',
  } satisfies Localized,
  step2SkipBtn: {
    en: 'Skip step (calculate in %)',
    ru: 'Пропустить шаг (расчёт в %)',
    he: 'דילוג על השלב (חישוב ב-%)',
  } satisfies Localized,
  step2SkipCheckbox: {
    en: 'Calculate in % only (skip revenue)',
    ru: 'Рассчитать только в процентах (без ввода выручки)',
    he: 'חישוב באחוזים בלבד (ללא הזנת הכנסות)',
  } satisfies Localized,
  submitPercent: {
    en: 'Calculate losses in %',
    ru: 'Рассчитать потери в %',
    he: 'חשבו הפסדים ב-%',
  } satisfies Localized,
  submitMoney: {
    en: 'Calculate losses in ₪',
    ru: 'Рассчитать потери в ₪',
    he: 'חשבו הפסדים בש״ח',
  } satisfies Localized,
  heroSubLossPrefix: {
    en: 'Every ad click is paid for, but ',
    ru: 'Вы платите за каждый клик, но ',
    he: 'אתם משלמים על כל קליק, אך ',
  } satisfies Localized,
  heroSubLossBadge: {
    en: 'up to 35% of ad budget is lost',
    ru: 'до 35% бюджета сгорает',
    he: 'עד 35% מהתקציב יורד לטמיון',
  } satisfies Localized,
  heroSubLossSuffix: {
    en: ' on hidden funnel leaks.',
    ru: ' из-за скрытых сбоев воронки.',
    he: ' בגלל ליקויים סמויים במשפך.',
  } satisfies Localized,
  heroStep3Kicker: {
    en: 'Chromium Audit Lab',
    ru: 'Chromium Audit Lab',
    he: 'Chromium Audit Lab',
  } satisfies Localized,
  heroStep3L1: {
    en: 'AUDITING WEBSITE',
    ru: 'ПРОВЕРЯЕМ САЙТ',
    he: 'בודקים את האתר',
  } satisfies Localized,
  heroStep3L2: {
    en: 'IN REAL TIME',
    ru: 'ПРЯМО СЕЙЧАС',
    he: 'ממש עכשיו',
  } satisfies Localized,
  heroStep3L3: {
    en: 'ACROSS 230+ METRICS',
    ru: 'ПО 230+ ПАРАМЕТРАМ',
    he: 'לפי 230+ פרמטרים',
  } satisfies Localized,
  heroStep3SubPrefix: {
    en: 'Chromium browser running: simulating mobile and desktop visits, probing funnel and ',
    ru: 'Запущен браузер Chromium: эмулируем визиты со смартфонов и ПК, тестируем воронку и ',
    he: 'דפדפן Chromium פועל: מדמים גלישה במובייל ובמחשב, בודקים את המשפך ו-',
  } satisfies Localized,
  heroStep3SubHighlight: {
    en: 'identifying critical bottlenecks',
    ru: 'выявляем критические сбои',
    he: 'מזהים נקודות כשל קריטיות',
  } satisfies Localized,
  step3EngineBadge: {
    en: 'Chromium Engine 2026: Active',
    ru: 'Chromium Engine 2026: Активен',
    he: 'מנוע כרומיום 2026: פעיל',
  } satisfies Localized,
  step3AutoEmailBadge: {
    en: 'Report copy sent to email',
    ru: 'Дубликат уйдёт на email',
    he: 'עותק יישלח לאימייל',
  } satisfies Localized,
  step3CardHeading: {
    en: 'Funnel Analysis & Audit',
    ru: 'Анализ воронки и аудит',
    he: 'ניתוח משפך ובדיקה',
  } satisfies Localized,
  step3CardSub: {
    en: 'Automated site scan in our cloud browser lab',
    ru: 'Автоматическая проверка в облачной лаборатории',
    he: 'בדיקה אוטומטית של האתר במעבדת ענן',
  } satisfies Localized,
  step3DoNotClose: {
    en: 'Keep this tab open: results appear automatically',
    ru: 'Не закрывайте вкладку: страница обновится сама',
    he: 'נא לא לסגור את הלשונית: התוצאות יופיעו אוטומטית',
  } satisfies Localized,
  step3DeliverablesHeader: {
    en: 'What you’ll get in your report:',
    ru: 'Что войдёт в ваш отчёт:',
    he: 'מה יכלול הדוח שלכם:',
  } satisfies Localized,
  step3Deliverable1Title: {
    en: 'Lost revenue',
    ru: 'Сумма потерь',
    he: 'חישוב הפסדים',
  } satisfies Localized,
  step3Deliverable1Desc: {
    en: 'exact revenue leakage in ₪ or % across your funnel',
    ru: 'точный расчёт утечек выручки в ₪ или % по воронке',
    he: 'אומדן דליפת הכנסות מדויק בש״ח או ב-% לאורך המשפך',
  } satisfies Localized,
  step3Deliverable2Title: {
    en: 'Summary of 230+ checks',
    ru: 'Итоги 230+ тестов',
    he: 'סיכום 230+ בדיקות',
  } satisfies Localized,
  step3Deliverable2Desc: {
    en: 'speed on mobile & desktop, order forms, SEO & AI',
    ru: 'скорость на смартфонах и ПК, формы заказа, SEO и AI',
    he: 'מהירות במובייל ובמחשב, טפסי הזמנה, SEO ו-AI',
  } satisfies Localized,
  step3Deliverable3Title: {
    en: 'Action plan',
    ru: 'План исправлений',
    he: 'תוכנית פעולה',
  } satisfies Localized,
  step3Deliverable3Desc: {
    en: 'prioritized step-by-step sprint for your developers',
    ru: 'пошаговый спринт доработок с приоритетами для разработчиков',
    he: 'ספרינט משימות מתועדף וממוקד למפתחים',
  } satisfies Localized,
  step3Deliverable1Sub: {
    en: 'in ₪ or %',
    ru: 'в ₪ или в %',
    he: 'בש״ח או %',
  } satisfies Localized,
  step3Deliverable2Sub: {
    en: 'mobile, SEO, AI',
    ru: 'ПК, мобайл, AI',
    he: 'מובייל, SEO, AI',
  } satisfies Localized,
  step3Deliverable3Sub: {
    en: 'dev sprint',
    ru: 'спринт для Dev',
    he: 'ספרינט למפתחים',
  } satisfies Localized,
  heroFinancialLeaks: [
    {
      icon: 'ad',
      tag: {
        en: '−40% CLICKS',
        ru: '−40% КЛИКОВ',
        he: '40%- קליקים',
      },
      title: {
        en: 'Wasted ad traffic',
        ru: 'Слив платного трафика',
        he: 'בזבוז תנועה ממומנת',
      },
      desc: {
        en: 'Up to 40% of paid clicks bounce when mobile pages take >2.5s to load.',
        ru: 'До 40% платных кликов теряются при медленной загрузке (>2.5 с) на смартфонах.',
        he: 'עד 40% מהקליקים הממומנים אובדים כאשר דפי מובייל נטענים מעל 2.5 שניות.',
      },
      impactLabel: {
        en: 'Loss:',
        ru: 'Потери:',
        he: 'הפסד:',
      },
      impactVal: {
        en: 'wasted ad spend',
        ru: 'бюджет впустую',
        he: 'תקציב מבוזבז',
      },
    },
    {
      icon: 'lead',
      tag: {
        en: 'SCRIPT ERRORS',
        ru: 'СБОИ СКРИПТОВ',
        he: 'שגיאות סקריפט',
      },
      title: {
        en: 'Broken lead forms',
        ru: 'Срыв заявок в формах',
        he: 'שיבושי טפסי לידים',
      },
      desc: {
        en: 'Silent script crashes, captchas, and mobile keyboard overlap block leads from reaching CRM.',
        ru: 'Скрытые ошибки скриптов, капчи и перекрытие полей клавиатурой срывают заявки мимо CRM.',
        he: 'שגיאות סקריפט סמויות, קפצ׳ה ושיבושי מקלדת בנייד מונעים הגעת פניות ל-CRM.',
      },
      impactLabel: {
        en: 'Loss:',
        ru: 'Потери:',
        he: 'הפסד:',
      },
      impactVal: {
        en: 'lost sales & leads',
        ru: 'упущенные продажи',
        he: 'אובדן מכירות',
      },
    },
    {
      icon: 'ai',
      tag: {
        en: '0 OF 8 AI BOTS',
        ru: '0 ИЗ 8 AI-БОТОВ',
        he: '0 מתוך 8 בוטים',
      },
      title: {
        en: 'AI & search blindspots',
        ru: 'Слепая зона AI и поиска',
        he: 'עיוורון AI וחיפוש',
      },
      desc: {
        en: 'Site is invisible to ChatGPT answers with lost trust from browser warnings.',
        ru: 'Сайт невидим для ответов ChatGPT, а предупреждения браузера отпугивают клиентов.',
        he: 'האתר שקוף לתשובות ChatGPT עם פגיעה באמינות מאזהרות דפדפן.',
      },
      impactLabel: {
        en: 'Loss:',
        ru: 'Потери:',
        he: 'הפסד:',
      },
      impactVal: {
        en: 'zero AI traffic',
        ru: 'нулевой спрос с AI',
        he: 'אפס תנועה מ-AI',
      },
    },
  ] as const,
  heroSubWait: {
    en: 'The auditor opens your homepage on a phone and a desktop and counts every lost inquiry.',
    ru: 'Аудитор открывает вашу главную на телефоне и компьютере и считает каждую потерянную заявку.',
    he: 'הבודק פותח את דף הבית בטלפון ובמחשב וסופר כל פנייה שאבדה.',
  } satisfies Localized,
  heroSubReady: {
    en: 'Four areas, a ranked list of problems and the price of fixing them.',
    ru: 'Четыре направления, список проблем по важности и цена их исправления.',
    he: 'ארבעה תחומים, רשימת בעיות לפי חשיבות והמחיר לתיקונן.',
  } satisfies Localized,
  ghostForm: { en: 'LEAK', ru: 'УТЕЧКА', he: 'דליפה' } satisfies Localized,
  ghostWait: { en: 'AUDIT', ru: 'АУДИТ', he: 'ביקורת' } satisfies Localized,
  ghostReady: { en: 'REPORT', ru: 'ОТЧЁТ', he: 'דוח' } satisfies Localized,
  heroFacts: [
    {
      big: '42%',
      tag: 'MAX LEAK',
      label: { en: 'maximum revenue loss on flawed sites', ru: 'максимальная утечка выручки', he: 'אובדן הכנסה מרבי באתרים לקויים' },
    },
    {
      big: '230+',
      tag: 'CHECKS',
      label: { en: 'automated technical tests', ru: 'проверок кода, скорости и SEO', he: 'בדיקות קוד, מהירות ו-SEO' },
    },
    {
      big: '5 мин',
      tag: 'FREE 0 ₪',
      label: { en: 'express estimate online', ru: 'экспресс-расчёт бесплатно', he: 'חישוב מהיר אונליין' },
    },
  ] as const,
  marquee: [
    { en: 'Speed', ru: 'Скорость', he: 'מהירות' },
    { en: 'Forms', ru: 'Формы', he: 'טפסים' },
    { en: 'Visibility', ru: 'Видимость', he: 'נראות' },
    { en: 'Security', ru: 'Безопасность', he: 'אבטחה' },
    { en: 'AI search', ru: 'AI-поиск', he: 'חיפוש AI' },
    { en: 'Lost inquiries', ru: 'Потерянные заявки', he: 'פניות שאבדו' },
  ] as const,
  scaleWeight: { en: 'Weight in loss: {n} of {total}', ru: 'Вес в потерях: {n} из {total}', he: 'משקל בהפסד: {n} מתוך {total}' } satisfies Localized,
  ctaL1: { en: 'Close the leaks.', ru: 'Закройте утечки.', he: 'סגרו את הדליפות.' } satisfies Localized,
  ctaL2: { en: 'Get inquiries back.', ru: 'Верните заявки.', he: 'החזירו את הפניות.' } satisfies Localized,
  ctaGhost: { en: 'WhatsApp', ru: 'WhatsApp', he: 'WhatsApp' } satisfies Localized,
} as const
