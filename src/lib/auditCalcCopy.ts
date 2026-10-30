import type { LightLevel } from '@/lib/revenueLeak'

type Localized = { en: string; ru: string; he: string }

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
        en: 'A real audit of your homepage: mobile speed, forms, security and visibility in search and AI.',
        ru: 'Реальный аудит главной: скорость на телефоне, формы, безопасность и видимость в поиске и AI.',
        he: 'ביקורת אמיתית של דף הבית: מהירות במובייל, טפסים, אבטחה ונראות בחיפוש וב-AI.',
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
    green: { en: 'OK', ru: 'Отлично', he: 'תקין' },
  } satisfies Record<LightLevel, Localized>,

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
        en: 'The site is visible to search and AI.',
        ru: 'Сайт хорошо виден поиску и AI.',
        he: 'האתר נראה היטב לחיפוש ול-AI.',
      },
    },
  } satisfies Record<CalcArea, Record<LightLevel, Localized>>,

  calcHeading: {
    en: 'Express Audit Setup',
    ru: 'Запуск экспресс-аудита',
    he: 'הגדרת ביקורת מהירה',
  } satisfies Localized,
  step1Heading: {
    en: 'Express Audit Setup',
    ru: 'Запуск экспресс-аудита',
    he: 'הגדרת ביקורת מהירה',
  } satisfies Localized,
  step1Sub: {
    en: 'Enter your website and email. Our automated lab will run 230+ tests on your homepage.',
    ru: 'Укажите сайт и email — автоматическая лаборатория проверит 230+ параметров главной страницы.',
    he: 'הזינו כתובת אתר ומייל — מעבדת הבדיקה תריץ 230+ בדיקות אוטומטיות של דף הבית.',
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
  step1Guarantee2: { en: 'No admin access required', ru: 'Без доступа к админке', he: 'ללא גישה למערכת הניהול' } satisfies Localized,
  step1Guarantee3: { en: 'Full report sent to email', ru: 'Отчёт придёт и на почту', he: 'הדוח יישלח גם למייל' } satisfies Localized,
  nextStepCalc: {
    en: 'Next: revenue & loss calculation →',
    ru: 'Далее: доход и расчёт потерь →',
    he: 'המשך: הכנסות וחישוב הפсדים ←',
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
    { en: '04 · Loss Report', ru: '04 · Отчёт о потерях', he: '04 · דוח הפסדים' },
  ] as const,
  stepOf: { en: 'Step {n} of {total}', ru: 'Шаг {n} из {total}', he: 'שלב {n} מתוך {total}' } satisfies Localized,
  next: { en: 'Next step', ru: 'Следующий шаг', he: 'השלב הבא' } satisfies Localized,
  back: { en: 'Back', ru: 'Назад', he: 'חזרה' } satisfies Localized,
  perYear: { en: 'per year', ru: 'в год', he: 'בשנה' } satisfies Localized,
  progressStages: [
    { en: 'Checking speed on phones…', ru: 'Проверяем скорость на телефоне…', he: 'בודקים מהירות בטלפון…' },
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
    en: 'Hello, the calculator showed a loss of {amount}/month for {domain}. How can we fix this?',
    ru: 'Здравствуйте, калькулятор показал потерю {amount}/мес по сайту {domain}. Как это исправить?',
    he: 'שלום, המחשבון הראה הפסד של {amount} לחודש באתר {domain}. איך אפשר לתקן את זה?',
  } satisfies Localized,
  waMessageNoLoss: {
    en: 'Hello, I ran the audit for {domain}. Can you send a plan to improve it?',
    ru: 'Здравствуйте, я прошёл аудит сайта {domain}. Пришлите, пожалуйста, план улучшений.',
    he: 'שלום, עשיתי ביקורת לאתר {domain}. אפשר לקבל תוכנית שיפור?',
  } satisfies Localized,

  detailsSummary: {
    en: 'See the technical data behind the estimate',
    ru: 'Посмотреть технические данные, на которых строится оценка',
    he: 'לצפייה בנתונים הטכניים שמאחורי ההערכה',
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
  heroKicker: { en: 'Revenue leak audit', ru: 'Аудит утечек выручки', he: 'ביקורת דליפות הכנסה' } satisfies Localized,
  heroLive: { en: 'Auditor online', ru: 'Аудитор онлайн', he: 'הבודק מחובר' } satisfies Localized,
  heroL1: { en: 'How much', ru: 'Сколько', he: 'כמה' } satisfies Localized,
  heroL2: { en: 'money', ru: 'денег', he: 'כסף' } satisfies Localized,
  heroL3: { en: 'does your site lose?', ru: 'теряет ваш сайт?', he: 'האתר שלכם מפסיד?' } satisfies Localized,
  heroWaitL1: { en: 'Auditing', ru: 'Проверяем', he: 'בודקים' } satisfies Localized,
  heroWaitL3: { en: 'right now', ru: 'прямо сейчас', he: 'ממש עכשיו' } satisfies Localized,
  heroReadyL1: { en: 'Done,', ru: 'Готово,', he: 'מוכן,' } satisfies Localized,
  heroReadyL3: { en: 'here is where the money leaks', ru: 'вот где утекают деньги', he: 'כאן הכסף מדלף' } satisfies Localized,
  heroSubForm: {
    en: 'We check speed, forms, search visibility and security, then turn every defect into shekels per month.',
    ru: 'Проверим скорость, формы, видимость в поиске и безопасность, а каждый дефект переведём в шекели в месяц.',
    he: 'נבדוק מהירות, טפסים, נראות בחיפוש ואבטחה, ונהפוך כל ליקוי לשקלים בחודש.',
  } satisfies Localized,
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
