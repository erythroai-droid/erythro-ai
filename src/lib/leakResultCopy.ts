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
  step4StatBadgeUpside: { en: 'Uplift', ru: 'Прирост', he: 'גידול' },
  step4StatBadgeLeak: { en: 'Weak spot', ru: 'Уязвимость', he: 'נקודת תורפה' },
  step4StatBadgeStages: { en: 'At risk', ru: 'Под риском', he: 'בסיכון' },
  step4StatUpside: { en: 'more inquiries after fixes', ru: 'больше заявок после исправлений', he: 'יותר פניות אחרי תיקונים' },
  step4StatScore: { en: 'funnel score', ru: 'оценка воронки', he: 'ציון המשפך' },
  step4StatLeakStages: { en: 'funnel stages to improve', ru: 'этапов воронки можно улучшить', he: 'שלבי משפך לשיפור' },
  step4StatDescYear: {
    en: 'Yearly growth potential if the issues found in the audit are fixed.',
    ru: 'Годовой потенциал роста, если устранить проблемы, найденные в аудите.',
    he: 'פוטנציאל צמיחה שנתי אם יתוקנו הבעיות שנמצאו בביקורת.',
  },
  step4StatDescClients: {
    en: 'Clients you could win back each month once the main bottlenecks are closed.',
    ru: 'Клиентов, которых можно вернуть в месяц, закрыв главные узкие места.',
    he: 'לקוחות שאפשר להחזיר בכל חודש אחרי סגירת צווארי הבקבוק העיקריים.',
  },
  step4StatDescUpside: {
    en: 'Projected share of visitors returning to an inquiry after the fixes in this report.',
    ru: 'Прогнозируемая доля посетителей, которые снова дойдут до заявки после исправлений из отчёта.',
    he: 'חלק צפוי של מבקרים שיחזרו לפנייה אחרי התיקונים שבדוח.',
  },
  step4StatDescScore: {
    en: 'Combined score for speed, forms, AI visibility and trust — how well the path to an inquiry works.',
    ru: 'Сводный балл по скорости, формам, видимости в AI и доверию — насколько работает путь к заявке.',
    he: 'ציון משולב למהירות, טפסים, נראות ב-AI ואמון — עד כמה מסלול הפנייה עובד.',
  },
  step4StatDescLeak: {
    en: 'Largest drop-off is at «{stage}» — fix this stage first to unlock the most inquiries.',
    ru: 'Самый большой отсев на этапе «{stage}» — начните с него, чтобы вернуть больше всего заявок.',
    he: 'הנשירה הגדולה ביותר בשלב «{stage}» — התחילו כאן כדי להחזיר הכי הרבה פניות.',
  },
  step4StatDescStages: {
    en: 'Funnel stages that currently cut conversion and are flagged for improvement.',
    ru: 'Этапы воронки, которые сейчас снижают конверсию и отмечены к улучшению.',
    he: 'שלבי משפך שמורידים כרגע המרה ומסומנים לשיפור.',
  },
  // Audit LP H1: “Based on the results” → big % → “visitors leave without inquiries”.
  step4HeroLabel: { en: 'What we found', ru: 'Что мы выяснили', he: 'מה גילינו' },
  step4HeroPctTail: {
    en: 'of visitors leave without an inquiry',
    ru: 'посетителей уходят без заявок',
    he: 'מהמבקרים עוזבים בלי פניות',
  },
  step4HeroContextPct: {
    en: 'Out of every 100 visitors, {lost} leave without sending an inquiry. Fixing the issues in this report can win that share back — that is the growth potential.',
    ru: 'Из каждых 100 посетителей {lost} уходят, не оставив заявку. Исправления из отчёта помогают вернуть эту долю — в этом и потенциал роста.',
    he: 'מתוך כל 100 מבקרים, {lost} עוזבים בלי להשאיר פנייה. תיקון הבעיות בדוח יכול להחזיר את החלק הזה — זה פוטנציאל הצמיחה.',
  },
  step4RingLegendLost: { en: 'Don’t reach an inquiry', ru: 'Не доходят до заявки', he: 'לא מגיעים לפנייה' },
  step4InsightBadge: { en: 'Audit results', ru: 'Результаты аудита', he: 'תוצאות הביקורת' },
  step4LeaksByStage: { en: 'Drop-off by stage', ru: 'Потери по этапам', he: 'נשירה לפי שלב' },
  step4LeaksTotal: { en: 'Total drop-off', ru: 'Суммарные потери', he: 'סך הנשירה' },
  step4LeaksTotalHint: {
    en: 'Share of visitors who leave without an inquiry',
    ru: 'Доля посетителей, которые уходят без заявки',
    he: 'שיעור המבקרים שעוזבים בלי פנייה',
  },
  step4BiggestLeak: { en: 'Top priority', ru: 'Главный приоритет', he: 'העדיפות הראשונה' },
  step4StageShareTag: { en: '{s}% of total drop-off', ru: '{s}% всех потерь', he: '{s}% מכלל הנשירה' },
  step4WhereTitle: { en: 'Where the growth is', ru: 'Где точки роста', he: 'איפה נקודות הצמיחה' },
  step4WhereSub: {
    en: 'Visitor drop-off by funnel stage, from the largest to the smallest.',
    ru: 'Потери посетителей по этапам воронки — от наибольших к меньшим.',
    he: 'נשירת מבקרים לפי שלבי המשפך — מהגדולה לקטנה.',
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
  step4Stage3IssueScore: {
    en: 'Trust and safety {score}/100 — about {loss}% of visitors drop off here. The site may feel unreliable or trigger a browser warning.',
    ru: 'Доверие и безопасность {score}/100 — здесь отсеивается около {loss}% посетителей. Сайт может казаться ненадёжным или вызвать предупреждение браузера.',
    he: 'אמון ובטיחות {score}/100 — כ-{loss}% מהמבקרים נושרים כאן. האתר עלול להרגיש לא אמין או להפעיל אזהרת דפדפן.',
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
  // «Why it happens» card columns: neutral, professional wording (no «спотыкается»).
  step4CardColUser: { en: 'Visitor action', ru: 'Действие посетителя', he: 'פעולת המבקר' },
  step4CardColIssue: { en: 'Issue found', ru: 'Выявленная проблема', he: 'הבעיה שאותרה' },
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
