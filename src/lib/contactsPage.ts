export type Localized = { en: string; ru: string; he: string }

export function tContacts(field: Localized, locale: string): string {
  return field[locale as keyof Localized] || field.en
}

export const contactsPage = {
  slug: 'contacts',
  title: {
    en: 'Contacts',
    ru: 'Контакты',
    he: 'יצירת קשר',
  } satisfies Localized,
  intro: {
    en: 'Tell us about your project — or just say hello. We reply within one business day.',
    ru: 'Расскажите о проекте — или просто напишите. Ответим в течение одного рабочего дня.',
    he: 'ספרו לנו על הפרויקט — או פשוט תגידו שלום. נחזור אליכם תוך יום עסקים אחד.',
  } satisfies Localized,
  metaDescription: {
    en: 'Contact Erythro.ai — email, phone, and a short message form. Based in Eilat, Israel.',
    ru: 'Связаться с Erythro.ai — email, телефон и короткая форма. Эйлат, Израиль.',
    he: 'צרו קשר עם Erythro.ai — אימייל, טלפון וטופס קצר. אילת, ישראל.',
  } satisfies Localized,
  detailsHeading: {
    en: 'Reach us',
    ru: 'Связаться',
    he: 'דרכי התקשרות',
  } satisfies Localized,
  formHeading: {
    en: 'Send a message',
    ru: 'Написать нам',
    he: 'שלחו הודעה',
  } satisfies Localized,
  socialHeading: {
    en: 'Social',
    ru: 'Соцсети',
    he: 'רשתות',
  } satisfies Localized,
}
