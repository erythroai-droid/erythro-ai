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
    en: 'How much is it costing you?',
    ru: 'Сколько это стоит вам?',
    he: 'כמה זה עולה לכם?',
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
    { en: 'Contacts', ru: 'Контакты', he: 'פרטים' },
    { en: 'Revenue & customers', ru: 'Доход и клиенты', he: 'הכנסה ולקוחות' },
    { en: 'Calculation', ru: 'Расчёт', he: 'חישוב' },
    { en: 'Report', ru: 'Отчёт', he: 'דוח' },
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
} as const
