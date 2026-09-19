import type { ConsultLocale } from './types'

/**
 * Grounded cooperation facts. Same heading in every locale so the prompt can
 * point at one section. Numbers and legal terms that are not on the site are
 * not invented here — contract / deposit / SLA hours stay with the team.
 */
export const HOW_WE_WORK_HEADING = 'How we work'

const BODY: Record<ConsultLocale, string> = {
  en: [
    `- First reply from the team: within **one business day** (email, WhatsApp, or after a brief). Same promise as the Contacts page.`,
    `- This chat does not take payment and does not sign a contract. Ready packages and audits are ordered on the site; prices there are a guideline, not an offer.`,
    `- Typical sequence: conversation in this chat → for a custom project, a brief → the team confirms within one business day → roadmap and milestones after the brief. Landing sites are usually a few weeks; CMS and integrations take longer; timeline always depends on scope.`,
    `- Full cycle is available: strategy, design, development, CMS, baseline SEO, launch, then support if needed.`,
    `- Payment and contract terms are agreed with the team after the brief, not in the chat. Do not invent deposits, percentages, or SLA hours. Quote an instalment line only when that package's order page says so.`,
    `- For "how do we start / collaboration / contract / payment / response time": stay on this section. Do not ask what kind of website. Do not start the brief checklist unless they then ask to assemble a custom brief.`,
  ].join('\n'),
  ru: [
    `- Первый ответ команды: в течение **одного рабочего дня** (email, WhatsApp или после ТЗ). Та же формулировка, что на странице контактов.`,
    `- Этот чат не принимает оплату и не подписывает договор. Готовые пакеты и аудит заказывают на сайте; цены там — ориентир, не оферта.`,
    `- Обычная последовательность: разговор в чате → для кастома собираем ТЗ → команда подтверждает в течение одного рабочего дня → после ТЗ — roadmap и этапы. Лендинг обычно несколько недель; CMS и интеграции дольше; срок всегда зависит от объёма.`,
    `- Доступен полный цикл: стратегия, дизайн, разработка, CMS, базовое SEO, запуск, затем поддержка при необходимости.`,
    `- Договор и оплату согласовывает команда после ТЗ, не в этом чате. Не выдумывать предоплату, проценты и часы SLA. Рассрочку упоминать только если она указана на странице конкретного пакета.`,
    `- На вопросы «как устроено сотрудничество / договор / оплата / срок ответа»: оставаться в этой секции. Не спрашивать «какой сайт». Чеклист ТЗ не начинать, пока человек сам не попросит собрать ТЗ.`,
  ].join('\n'),
  he: [
    `- מענה ראשון מהצוות: תוך **יום עסקים אחד** (אימייל, WhatsApp או אחרי אפיון). אותה הבטחה כמו בדף יצירת הקשר.`,
    `- הצ׳אט לא גובה תשלום ולא חותם חוזה. חבילות מוכנות וביקורת מוזמנות באתר; המחירים שם הם הכוונה, לא הצעה מחייבת.`,
    `- רצף טיפוסי: שיחה בצ׳אט → לפרויקט מותאם בונים אפיון → הצוות מאשר תוך יום עסקים אחד → אחרי האפיון: מפת דרכים ואבני דרך. דף נחיתה בדרך כלל כמה שבועות; CMS ואינטגרציות ארוכות יותר; לוח הזמנים תלוי בהיקף.`,
    `- מחזור מלא זמין: אסטרטגיה, עיצוב, פיתוח, CMS, SEO בסיסי, השקה, ואז תמיכה לפי הצורך.`,
    `- תנאי חוזה ותשלום סוגרים עם הצוות אחרי האפיון, לא בצ׳אט. אין להמציא מקדמה, אחוזים או שעות SLA. אפשרות תשלומים — רק אם היא כתובה בדף החבילה.`,
    `- לשאלות «איך עובדים / שיתוף פעולה / חוזה / תשלום / זמן מענה»: להישאר בסקציה הזו. לא לשאול איזה אתר. לא להתחיל את רשימת האפיון עד שהמבקר מבקש לבנות אפיון.`,
  ].join('\n'),
}

export function howWeWorkMarkdown(locale: ConsultLocale): string {
  return `## ${HOW_WE_WORK_HEADING}\n${BODY[locale]}`
}
