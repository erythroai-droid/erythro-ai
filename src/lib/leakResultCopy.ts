import { auditCalcCopy, type Localized } from '@/lib/auditCalcCopy'

/**
 * Result-screen wording for the AI audit landing (`/lp/audit/leak/{locale}`).
 * The report itself is the shared calculator report (CalcReport); this landing presents it as an audit:
 * "growth potential", "impact", "priority" instead of "losses" and "leaks". Only the keys below differ;
 * everything else falls back to the shared `auditCalcCopy`. The calculator LP is not affected.
 */
const overrides = {
  progressStages: [
    auditCalcCopy.progressStages[0],
    auditCalcCopy.progressStages[1],
    auditCalcCopy.progressStages[2],
    { en: 'Preparing your report…', ru: 'Готовим отчёт…', he: 'מכינים את הדוח…' },
  ],
  step3Deliverable1Title: { en: 'Impact estimate', ru: 'Оценка эффекта', he: 'הערכת השפעה' },
  step4StatYear: { en: 'potential per year', ru: 'потенциал за год', he: 'פוטנציאל בשנה' },
  step4StatBadgeLoss: { en: 'Potential', ru: 'Потенциал', he: 'פוטנציאל' },
  step4StatClients: { en: 'clients per month to win back', ru: 'клиентов в месяц можно вернуть', he: 'לקוחות בחודש שאפשר להחזיר' },
  step4StatBadgeLeak: { en: 'Bottleneck', ru: 'Узкое место', he: 'צוואר בקבוק' },
  step4StatLeakStages: { en: 'funnel stages to improve', ru: 'этапов воронки можно улучшить', he: 'שלבי משפך לשיפור' },
  step4HeroLabel: { en: 'Growth potential', ru: 'Потенциал роста', he: 'פוטנציאל צמיחה' },
  step4HeroContextPct: {
    en: 'Out of every 100 visitors, {lost} leave without an inquiry. The fixes in this report help win part of them back.',
    ru: 'Из каждых 100 посетителей {lost} уходят, не оставив заявку. Исправления из отчёта помогут вернуть часть из них.',
    he: 'מתוך כל 100 מבקרים, {lost} עוזבים בלי להשאיר פנייה. התיקונים בדוח יעזרו להחזיר חלק מהם.',
  },
  step4RingLegendLost: { en: 'Don’t reach an inquiry', ru: 'Не доходят до заявки', he: 'לא מגיעים לפנייה' },
  step4LeaksByStage: { en: 'Potential by stage', ru: 'Потенциал по этапам', he: 'פוטנציאל לפי שלבים' },
  step4LeaksTotal: { en: 'Total potential', ru: 'Всего потенциал', he: 'סה״כ פוטנציאל' },
  step4BiggestLeak: { en: 'Top priority', ru: 'Главный приоритет', he: 'העדיפות הראשונה' },
  step4StageShareTag: { en: '{s}% of total potential', ru: '{s}% всего потенциала', he: '{s}% מכלל הפוטנציאל' },
  step4WhereTitle: { en: 'Where the growth is', ru: 'Где точки роста', he: 'איפה נקודות הצמיחה' },
  step4WhereSub: {
    en: 'Potential by funnel stage, from the biggest to the smallest.',
    ru: 'Потенциал по этапам воронки — от самого большого к меньшему.',
    he: 'הפוטנציאל לפי שלבי המשפך, מהגדול לקטן.',
  },
  step4WhySub: {
    en: 'The visitor’s path step by step: what they do and where the site can do better.',
    ru: 'Путь клиента шаг за шагом: что он делает и где сайт можно улучшить.',
    he: 'מסלול הלקוח צעד אחר צעד: מה הוא עושה והיכן אפשר לשפר את האתר.',
  },
  waMessageWithLoss: {
    en: 'Hello! I ran the AI audit for {domain}. I’d like to go through the findings and the fix plan — up to {percent}% more inquiries.',
    ru: 'Здравствуйте! Прошёл AI-аудит сайта {domain}. Хочу разобрать находки и план исправлений — потенциал до {percent}% обращений.',
    he: 'שלום! ביצעתי אודיט AI לאתר {domain}. אשמח לעבור על הממצאים ותוכנית התיקונים — פוטנציאל של עד {percent}% פניות.',
  },
  areaImpact: {
    ...auditCalcCopy.areaImpact,
    speed: {
      ...auditCalcCopy.areaImpact.speed,
      yellow: {
        en: 'Speed is average: some paid clicks don’t reach the first screen.',
        ru: 'Скорость средняя: часть платных кликов не доходит до первого экрана.',
        he: 'המהירות בינונית: חלק מהקליקים בתשלום לא מגיעים למסך הראשון.',
      },
      green: {
        en: 'Speed is solid, with room to load even faster.',
        ru: 'Скорость хорошая, есть запас для ускорения загрузки.',
        he: 'המהירות טובה, ויש מקום לטעינה מהירה עוד יותר.',
      },
    },
    forms: {
      ...auditCalcCopy.areaImpact.forms,
      red: {
        en: 'The path to an inquiry is weak or unprotected: some leads don’t get through or end up in spam.',
        ru: 'Путь к заявке слабый или без защиты: часть лидов не доходит или тонет в спаме.',
        he: 'הדרך לפנייה חלשה או לא מוגנת: חלק מהלידים לא מגיעים או נבלעים בספאם.',
      },
    },
  },
  step4TechLoss: { en: 'Impact', ru: 'Эффект', he: 'השפעה' },
  protoNotes: [
    {
      en: 'Each defect found maps to a typical share of missed inquiries: speed up to 20%, forms 15%, visibility 10%, security 5%.',
      ru: 'Каждому дефекту из аудита соответствует типичная доля недополученных обращений: скорость до 20%, формы 15%, видимость 10%, безопасность 5%.',
      he: 'לכל ליקוי מתאים נתח אופייני של פניות שלא התקבלו: מהירות עד 20%, טפסים 15%, נראות 10%, אבטחה 5%.',
    },
    {
      en: 'This share is applied to your monthly revenue: revenue × p / (1 − p).',
      ru: 'Эта доля применяется к вашему месячному доходу: доход × p / (1 − p).',
      he: 'הנתח הזה מוחל על ההכנסה החודשית שלכם: הכנסה × p / (1 − p).',
    },
    {
      en: 'Payback compares the impact with the fixed price of the fix sprint.',
      ru: 'Окупаемость сравнивает эффект с фиксированной ценой спринта исправлений.',
      he: 'ההחזר משווה את ההשפעה למחיר הקבוע של ספרינט התיקונים.',
    },
    auditCalcCopy.protoNotes[3],
  ],
  step4FixTitlePre: { en: 'We implement the fixes in', ru: 'Внедрим исправления за', he: 'ניישם את התיקונים תוך' },
  ctaL1: { en: 'Fix the bottlenecks.', ru: 'Устраните узкие места.', he: 'תקנו את צווארי הבקבוק.' },
  disclaimer: {
    en: 'An estimate for guidance, not a promise of results. It is built from the audit scores and the typical conversion impact of the defects found, and does not measure your real traffic.',
    ru: 'Оценка носит ориентировочный характер и не обещает результат. Она строится на баллах аудита и типичном влиянии найденных дефектов на конверсию и не измеряет ваш реальный трафик.',
    he: 'הערכה מנחה ולא הבטחה לתוצאה. היא מבוססת על ציוני הביקורת ועל ההשפעה האופיינית של הליקויים שנמצאו על ההמרות, ואינה מודדת את התנועה האמיתית שלכם.',
  },
} satisfies Partial<Record<keyof typeof auditCalcCopy, unknown>>

// The shared copy is `as const` (literal string types), so the reworded values need a cast to the same shape.
export const leakResultCopy = { ...auditCalcCopy, ...overrides } as unknown as typeof auditCalcCopy

// Keeps the Localized type in use for editors jumping here from the shared copy.
export type { Localized }
