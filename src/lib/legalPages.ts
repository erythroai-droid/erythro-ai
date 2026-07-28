/** Localized legal pages — Israeli law oriented (he/en/ru). */

export type LegalLocale = 'en' | 'ru' | 'he'
export type LegalPageId = 'privacy' | 'terms' | 'accessibility'

export type LocalizedString = Record<LegalLocale, string>
export type LocalizedParagraphs = Record<LegalLocale, string[]>

export interface LegalSection {
  heading: LocalizedString
  paragraphs: LocalizedParagraphs
  bullets?: LocalizedParagraphs
}

export interface LegalPage {
  id: LegalPageId
  slug: string
  title: LocalizedString
  metaDescription: LocalizedString
  updatedLabel: LocalizedString
  /** ISO date shown as last update */
  updatedAt: string
  intro: LocalizedString
  sections: LegalSection[]
  closing?: LocalizedString
}

const CONTACT_LINE: LocalizedString = {
  en: 'Contact: erythro.ai@gmail.com · +972 50 931 27 46 · Eilat, Israel',
  ru: 'Контакты: erythro.ai@gmail.com · +972 50 931 27 46 · Эйлат, Израиль',
  he: 'יצירת קשר: erythro.ai@gmail.com · +972 50 931 27 46 · אילת, ישראל',
}

export const legalPages: Record<LegalPageId, LegalPage> = {
  privacy: {
    id: 'privacy',
    slug: 'privacy',
    title: {
      en: 'Privacy Policy',
      ru: 'Политика конфиденциальности',
      he: 'מדיניות פרטיות',
    },
    metaDescription: {
      en: 'How Erythro.ai collects, uses, and protects personal data under Israeli Privacy Protection Law.',
      ru: 'Как Erythro.ai собирает, использует и защищает персональные данные в соответствии с законодательством Израиля о защите конфиденциальности.',
      he: 'כיצד Erythro.ai אוסף, משתמש ומגן על מידע אישי בהתאם לחוק הגנת הפרטיות הישראלי.',
    },
    updatedLabel: {
      en: 'Last updated',
      ru: 'Последнее обновление',
      he: 'עודכן לאחרונה',
    },
    updatedAt: '2026-07-26',
    intro: {
      en: 'This Privacy Policy explains how Erythro.ai (“we”, “us”) processes personal information when you visit erythro.ai, contact us, or use our services. We process data in accordance with the Israeli Privacy Protection Law, 5741-1981 (including Amendment 13), and applicable regulations.',
      ru: 'Настоящая Политика конфиденциальности объясняет, как Erythro.ai («мы») обрабатывает персональные данные при посещении сайта erythro.ai, обращении к нам или использовании наших услуг. Мы обрабатываем данные в соответствии с Законом Израиля о защите конфиденциальности 5741-1981 (включая Поправку 13) и применимыми нормами.',
      he: 'מדיניות פרטיות זו מסבירה כיצד Erythro.ai (“אנחנו”) מעבדים מידע אישי כאשר אתם מבקרים באתר erythro.ai, יוצרים עמנו קשר או משתמשים בשירותינו. אנו מעבדים מידע בהתאם לחוק הגנת הפרטיות, התשמ״א-1981 (לרבות תיקון 13) ולהוראות הדין החלות.',
    },
    sections: [
      {
        heading: {
          en: '1. Data controller',
          ru: '1. Оператор данных',
          he: '1. בעל השליטה במידע',
        },
        paragraphs: {
          en: [
            'The data controller is Erythro.ai, based in Eilat, Israel. For privacy requests, email erythro.ai@gmail.com or call +972 50 931 27 46.',
          ],
          ru: [
            'Оператор персональных данных — Erythro.ai, Эйлат, Израиль. По вопросам конфиденциальности пишите на erythro.ai@gmail.com или звоните +972 50 931 27 46.',
          ],
          he: [
            'בעל השליטה במידע הוא Erythro.ai, אילת, ישראל. לפניות בנושא פרטיות ניתן לפנות ל־erythro.ai@gmail.com או לטלפון +972 50 931 27 46.',
          ],
        },
      },
      {
        heading: {
          en: '2. What we collect',
          ru: '2. Какие данные мы собираем',
          he: '2. אילו נתונים אנו אוספים',
        },
        paragraphs: {
          en: [
            'Depending on how you interact with us, we may process:',
          ],
          ru: [
            'В зависимости от взаимодействия с нами мы можем обрабатывать:',
          ],
          he: [
            'בהתאם לאופן השימוש באתר ובשירותים, אנו עשויים לעבד:',
          ],
        },
        bullets: {
          en: [
            'Identity and contact details you submit (name, email, phone, company, message content).',
            'Technical data such as IP address, browser type, device, pages viewed, and approximate location derived from IP.',
            'Cookie and similar technology data (see Cookies below), including analytics identifiers when you accept cookies.',
            'Project and billing details needed to deliver contracted services.',
          ],
          ru: [
            'Идентификационные и контактные данные, которые вы указываете (имя, email, телефон, компания, текст сообщения).',
            'Технические данные: IP-адрес, тип браузера, устройство, просмотренные страницы и приблизительное местоположение по IP.',
            'Данные cookie и аналогичных технологий (см. раздел Cookie), включая идентификаторы аналитики при согласии.',
            'Сведения о проекте и оплате, необходимые для оказания услуг по договору.',
          ],
          he: [
            'פרטי זיהוי ויצירת קשר שתספקו (שם, דוא״ל, טלפון, חברה, תוכן פנייה).',
            'מידע טכני כגון כתובת IP, סוג דפדפן, מכשיר, עמודים שנצפו ומיקום משוער על בסיס IP.',
            'מידע מקובצי Cookie וטכנולוגיות דומות (ראו להלן), כולל מזהי אנליטיקה אם אישרתם Cookie.',
            'פרטי פרויקט וחיוב הנחוצים למתן השירותים לפי הסכם.',
          ],
        },
      },
      {
        heading: {
          en: '3. Purposes and legal bases',
          ru: '3. Цели и основания обработки',
          he: '3. מטרות ועילות לעיבוד',
        },
        paragraphs: {
          en: [
            'We use personal data to respond to inquiries, provide and improve our services, operate and secure the website, measure traffic (with consent where required), comply with Israeli law, and establish or defend legal claims. Where consent is required (for example, non-essential cookies), you may withdraw it at any time without affecting processing based on other lawful grounds.',
          ],
          ru: [
            'Мы используем персональные данные для ответа на обращения, оказания и улучшения услуг, работы и защиты сайта, измерения трафика (при согласии, где требуется), соблюдения израильского законодательства и защиты законных интересов. Если требуется согласие (например, на необязательные cookie), вы можете отозвать его в любой момент, не затрагивая обработку на иных законных основаниях.',
          ],
          he: [
            'אנו משתמשים במידע אישי כדי להשיב לפניות, לספק ולשפר שירותים, להפעיל ולאבטח את האתר, למדוד תנועה (בהסכמה כנדרש), לעמוד בדין הישראלי ולקיים או להגן על תביעות משפטיות. כאשר נדרשת הסכמה (למשל ל־Cookie שאינם חיוניים), ניתן לבטלה בכל עת מבלי לפגוע בעיבוד המבוסס על עילות חוקיות אחרות.',
          ],
        },
      },
      {
        heading: {
          en: '4. Cookies and analytics',
          ru: '4. Cookie и аналитика',
          he: '4. Cookie ואנליטיקה',
        },
        paragraphs: {
          en: [
            'We use essential cookies needed for basic site functions (for example, language preference and cookie consent choice). With your consent via the cookie banner, we may use Google Analytics or similar tools to understand usage. You can decline non-essential cookies; essential cookies may still be set. Browser settings can also block cookies, which may affect some features.',
          ],
          ru: [
            'Мы используем необходимые cookie для базовой работы сайта (например, язык и выбор согласия на cookie). При вашем согласии через баннер можем использовать Google Analytics или аналогичные инструменты. Вы можете отклонить необязательные cookie; необходимые могут сохраняться. Настройки браузера также позволяют блокировать cookie, что может ограничить функции сайта.',
          ],
          he: [
            'אנו משתמשים ב־Cookie חיוניים לתפקוד בסיסי של האתר (למשל העדפת שפה ובחירת הסכמה ל־Cookie). בהסכמתכם באמצעות באנר ה־Cookie ייתכן שימוש ב־Google Analytics או כלים דומים. ניתן לדחות Cookie שאינם חיוניים; Cookie חיוניים עשויים להישמר. ניתן גם לחסום Cookie בהגדרות הדפדפן, מה שעשוי להשפיע על חלק מהפונקציות.',
          ],
        },
      },
      {
        heading: {
          en: '5. Sharing and transfers',
          ru: '5. Передача данных',
          he: '5. העברת מידע',
        },
        paragraphs: {
          en: [
            'We do not sell personal data. We may share data with service providers who help us host, analyse, communicate, or deliver projects (for example, hosting, email, analytics), under appropriate confidentiality and security obligations. Some providers may process data outside Israel; where required, we take steps consistent with Israeli law to protect the information. We may also disclose data if required by law or to protect rights and safety.',
          ],
          ru: [
            'Мы не продаём персональные данные. Мы можем передавать их подрядчикам, которые помогают с хостингом, аналитикой, коммуникацией или реализацией проектов, при обязательствах конфиденциальности и безопасности. Часть обработчиков может находиться за пределами Израиля; где требуется, мы принимаем меры, соответствующие израильскому праву. Данные также могут быть раскрыты по закону или для защиты прав и безопасности.',
          ],
          he: [
            'איננו מוכרים מידע אישי. אנו עשויים לשתף מידע עם ספקי שירות המסייעים באחסון, אנליטיקה, תקשורת או ביצוע פרויקטים, בכפוף להתחייבויות סודיות ואבטחה. חלק מהספקים עשויים לעבד מידע מחוץ לישראל; כנדרש בדין ננקוט צעדים להגנה על המידע. ייתכן גם גילוי מידע אם נדרש על פי דין או להגנה על זכויות ובטיחות.',
          ],
        },
      },
      {
        heading: {
          en: '6. Retention and security',
          ru: '6. Срок хранения и безопасность',
          he: '6. שמירה ואבטחה',
        },
        paragraphs: {
          en: [
            'We retain personal data only as long as needed for the purposes above, including legal, accounting, or dispute-resolution needs, then delete or anonymise it where feasible. We apply technical and organisational measures appropriate to the risk; no method of transmission or storage is completely secure.',
          ],
          ru: [
            'Мы храним персональные данные столько, сколько нужно для указанных целей, включая юридические, бухгалтерские требования и разрешение споров, затем удаляем или обезличиваем их, где это возможно. Мы применяем технические и организационные меры, соразмерные риску; ни один способ передачи или хранения не является полностью безопасным.',
          ],
          he: [
            'אנו שומרים מידע אישי רק למשך הזמן הנדרש למטרות לעיל, לרבות צרכים משפטיים, חשבונאיים או ליישוב מחלוקות, ולאחר מכן מוחקים או הופכים אותו לאנונימי ככל הניתן. אנו מיישמים אמצעים טכניים וארגוניים התואמים את הסיכון; אין שיטת העברה או אחסון בטוחה לחלוטין.',
          ],
        },
      },
      {
        heading: {
          en: '7. Your rights',
          ru: '7. Ваши права',
          he: '7. זכויותיכם',
        },
        paragraphs: {
          en: [
            'Subject to Israeli law, you may have the right to access, correct, delete, or restrict processing of your personal data, to object to certain processing, and to withdraw consent where processing is consent-based. To exercise these rights, contact us using the details below. You may also contact the Israeli Privacy Protection Authority regarding complaints.',
          ],
          ru: [
            'В соответствии с израильским правом вы можете иметь право на доступ, исправление, удаление или ограничение обработки ваших данных, возражение против определённой обработки и отзыв согласия, если обработка основана на согласии. Для реализации прав свяжитесь с нами. Также можно обратиться в Управление по защите конфиденциальности Израиля (PPA) с жалобой.',
          ],
          he: [
            'בכפוף לדין הישראלי, ייתכן שתהיה לכם זכות לעיין, לתקן, למחוק או להגביל עיבוד של מידע אישי, להתנגד לעיבוד מסוים ולבטל הסכמה כאשר העיבוד מבוסס על הסכמה. למימוש הזכויות פנו אלינו. ניתן גם לפנות לרשות להגנת הפרטיות בישראל בנוגע לתלונות.',
          ],
        },
      },
      {
        heading: {
          en: '8. Children',
          ru: '8. Дети',
          he: '8. קטינים',
        },
        paragraphs: {
          en: [
            'Our services are directed to businesses and adults. We do not knowingly collect personal data from children under 18. If you believe a child provided data, contact us and we will take appropriate steps.',
          ],
          ru: [
            'Наши услуги предназначены для бизнеса и совершеннолетних. Мы сознательно не собираем данные лиц младше 18 лет. Если вы считаете, что ребёнок передал нам данные, свяжитесь с нами — мы примем меры.',
          ],
          he: [
            'שירותינו מיועדים לעסקים ולבוגרים. איננו אוספים ביודעין מידע אישי מקטינים מתחת לגיל 18. אם לדעתכם קטין מסר מידע, פנו אלינו ונפעל בהתאם.',
          ],
        },
      },
      {
        heading: {
          en: '9. Changes',
          ru: '9. Изменения',
          he: '9. שינויים',
        },
        paragraphs: {
          en: [
            'We may update this Policy from time to time. The “Last updated” date will change accordingly. Continued use of the site after updates constitutes awareness of the revised Policy where permitted by law.',
          ],
          ru: [
            'Мы можем обновлять Политику. Дата «Последнее обновление» будет изменена. Продолжение использования сайта после обновлений означает ознакомление с новой редакцией, где это допускается законом.',
          ],
          he: [
            'אנו עשויים לעדכן מדיניות זו מעת לעת. תאריך “עודכן לאחרונה” ישתנה בהתאם. המשך שימוש באתר לאחר עדכון מהווה מודעות למדיניות המעודכנת ככל שהדין מאפשר.',
          ],
        },
      },
    ],
    closing: CONTACT_LINE,
  },

  terms: {
    id: 'terms',
    slug: 'terms',
    title: {
      en: 'Terms of Use',
      ru: 'Условия использования',
      he: 'תנאי שימוש',
    },
    metaDescription: {
      en: 'Terms governing use of the Erythro.ai website and services under Israeli law.',
      ru: 'Условия использования сайта и услуг Erythro.ai в соответствии с законодательством Израиля.',
      he: 'תנאים החלים על השימוש באתר ובשירותי Erythro.ai לפי הדין הישראלי.',
    },
    updatedLabel: {
      en: 'Last updated',
      ru: 'Последнее обновление',
      he: 'עודכן לאחרונה',
    },
    updatedAt: '2026-07-26',
    intro: {
      en: 'These Terms of Use (“Terms”) govern access to and use of the erythro.ai website and related online materials. By using the site you agree to these Terms. If you do not agree, please do not use the site. Separate written agreements apply to paid projects and retainers.',
      ru: 'Настоящие Условия использования («Условия») регулируют доступ к сайту erythro.ai и связанным материалам. Используя сайт, вы соглашаетесь с Условиями. Если вы не согласны — не используйте сайт. На платные проекты и сопровождение действуют отдельные письменные договоры.',
      he: 'תנאי שימוש אלה (“התנאים”) חלים על הגישה לאתר erythro.ai ולחומרים המקוונים הקשורים אליו. השימוש באתר מהווה הסכמה לתנאים. אם אינכם מסכימים — אין להשתמש באתר. לפרויקטים בתשלום ולריטיינרים יחולו הסכמים בכתב נפרדים.',
    },
    sections: [
      {
        heading: {
          en: '1. Who we are',
          ru: '1. Кто мы',
          he: '1. מי אנחנו',
        },
        paragraphs: {
          en: [
            'The site is operated by Erythro.ai, Eilat, Israel. Contact: erythro.ai@gmail.com, +972 50 931 27 46.',
          ],
          ru: [
            'Сайт управляется Erythro.ai, Эйлат, Израиль. Контакты: erythro.ai@gmail.com, +972 50 931 27 46.',
          ],
          he: [
            'האתר מופעל על ידי Erythro.ai, אילת, ישראל. יצירת קשר: erythro.ai@gmail.com, +972 50 931 27 46.',
          ],
        },
      },
      {
        heading: {
          en: '2. Informational nature of the site',
          ru: '2. Информационный характер сайта',
          he: '2. אופי האתר',
        },
        paragraphs: {
          en: [
            'Content on the site (including service descriptions, portfolios, prices, and timelines) is for general information and marketing. It is not a binding offer unless expressly confirmed in a signed proposal, order, or contract. We may update or remove content without notice.',
          ],
          ru: [
            'Материалы сайта (описания услуг, портфолио, цены и сроки) носят общий информационный и маркетинговый характер и не являются офертой, пока прямо не подтверждены в подписанном предложении, заказе или договоре. Мы можем обновлять или удалять контент без предварительного уведомления.',
          ],
          he: [
            'התכנים באתר (לרבות תיאורי שירותים, פורטפוליו, מחירים ולוחות זמנים) הם מידע כללי ושיווקי ואינם הצעה מחייבת אלא אם אושרו במפורש בהצעה, הזמנה או הסכם חתומים. אנו רשאים לעדכן או להסיר תכנים ללא הודעה מוקדמת.',
          ],
        },
      },
      {
        heading: {
          en: '3. Acceptable use',
          ru: '3. Допустимое использование',
          he: '3. שימוש מותר',
        },
        paragraphs: {
          en: ['You agree not to:'],
          ru: ['Вы обязуетесь не:'],
          he: ['אתם מתחייבים שלא:'],
        },
        bullets: {
          en: [
            'Use the site in any unlawful way or in violation of Israeli or other applicable law.',
            'Attempt to gain unauthorised access to systems, scrape content aggressively, or disrupt the site.',
            'Upload malware or harmful code, or misuse contact forms for spam.',
            'Misrepresent your identity or affiliation when contacting us.',
          ],
          ru: [
            'Использовать сайт незаконно или в нарушение израильского или иного применимого права.',
            'Пытаться получить несанкционированный доступ, агрессивно парсить контент или нарушать работу сайта.',
            'Загружать вредоносный код или использовать формы связи для спама.',
            'Указывать ложные сведения о себе при обращении к нам.',
          ],
          he: [
            'להשתמש באתר באופן בלתי חוקי או בניגוד לדין הישראלי או דין אחר החל.',
            'לנסות לגשת למערכות ללא הרשאה, לבצע scraping אגרסיבי או לשבש את האתר.',
            'להעלות קוד זדוני או לנצל טפסי יצירת קשר לספאם.',
            'למסור מצג שווא לגבי זהותכם או זיקתכם בעת פנייה אלינו.',
          ],
        },
      },
      {
        heading: {
          en: '4. Intellectual property',
          ru: '4. Интеллектуальная собственность',
          he: '4. קניין רוחני',
        },
        paragraphs: {
          en: [
            'Unless otherwise stated, the site design, text, graphics, logos, videos, and other materials are owned by Erythro.ai or its licensors and are protected by Israeli and international IP laws. You may view and share links for personal, non-commercial use. You may not copy, modify, or commercially exploit site materials without prior written permission. Client project IP is governed by the relevant client agreement.',
          ],
          ru: [
            'Если не указано иное, дизайн, тексты, графика, логотипы, видео и иные материалы сайта принадлежат Erythro.ai или лицензиарам и защищены израильским и международным правом ИС. Допускается просмотр и распространение ссылок для личного некоммерческого использования. Копирование, изменение или коммерческое использование без письменного разрешения запрещены. ИС клиентских проектов регулируется соответствующим договором.',
          ],
          he: [
            'אלא אם צוין אחרת, עיצוב האתר, טקסטים, גרפיקה, לוגו, סרטונים וחומרים אחרים הם בבעלות Erythro.ai או מעניקי רישיון ומוגנים בדיני קניין רוחני ישראליים ובינלאומיים. מותר לצפות ולשתף קישורים לשימוש אישי שאינו מסחרי. אין להעתיק, לשנות או לנצל מסחרית חומרי אתר ללא אישור בכתב מראש. קניין רוחני בפרויקטי לקוחות יוסדר בהסכם הלקוח הרלוונטי.',
          ],
        },
      },
      {
        heading: {
          en: '5. Third-party links and tools',
          ru: '5. Сторонние ссылки и инструменты',
          he: '5. קישורים וכלים של צדדים שלישיים',
        },
        paragraphs: {
          en: [
            'The site may link to third-party websites or embed third-party tools (for example, analytics or messaging). We are not responsible for their content, policies, or availability. Your use of third-party services is at your own risk and subject to their terms.',
          ],
          ru: [
            'Сайт может содержать ссылки на сторонние ресурсы или встраивать сторонние инструменты (аналитика, мессенджеры и т.п.). Мы не отвечаем за их содержание, политики и доступность. Использование сторонних сервисов — на ваш риск и на их условиях.',
          ],
          he: [
            'האתר עשוי לכלול קישורים לאתרים של צדדים שלישיים או להטמיע כלים חיצוניים (למשל אנליטיקה או מסרים). איננו אחראים לתכנים, למדיניות או לזמינות שלהם. השימוש בשירותי צד שלישי הוא באחריותכם ובהתאם לתנאיהם.',
          ],
        },
      },
      {
        heading: {
          en: '6. Disclaimers and limitation of liability',
          ru: '6. Отказ от гарантий и ограничение ответственности',
          he: '6. הצהרת פטור והגבלת אחריות',
        },
        paragraphs: {
          en: [
            'The site is provided “as is” and “as available”. To the fullest extent permitted by Israeli law, we disclaim warranties of merchantability, fitness for a particular purpose, and non-infringement regarding the site. We do not warrant uninterrupted or error-free operation. Our aggregate liability arising from use of the site (excluding liability that cannot be limited by law, such as for willful misconduct or fraud where applicable) is limited to NIS 500. Nothing in these Terms excludes liability that Israeli mandatory law does not allow to be limited.',
          ],
          ru: [
            'Сайт предоставляется «как есть» и «как доступен». В максимальной степени, допускаемой израильским правом, мы отказываемся от гарантий товарной пригодности, соответствия конкретной цели и ненарушения прав в отношении сайта. Мы не гарантируем бесперебойную работу без ошибок. Совокупная ответственность, связанная с использованием сайта (кроме ответственности, которую нельзя ограничить по закону, например за умышленные действия или мошенничество, где применимо), ограничена суммой 500 ₪. Ничто в Условиях не исключает ответственность, которую обязательные нормы израильского права не позволяют ограничивать.',
          ],
          he: [
            'האתר מסופק “כמות שהוא” ו“כפי שהוא זמין”. במידה המרבית המותרת לפי הדין הישראלי, אנו פוטרים עצמנו מאחריות בגין אחריות משתמעת לסחירות, התאמה למטרה מסוימת ואי־הפרה ביחס לאתר. איננו מתחייבים לפעילות רציפה או נטולת שגיאות. אחריותנו המצטברת הנובעת משימוש באתר (למעט אחריות שאין להגבילה על פי דין, כגון בגין זדון או מרמה ככל שחל) מוגבלת לסכום של 500 ₪. אין בתנאים אלה כדי לשלול אחריות שהדין הישראלי הקוגנטי אינו מתיר להגביל.',
          ],
        },
      },
      {
        heading: {
          en: '7. Orders and paid services',
          ru: '7. Заказы и платные услуги',
          he: '7. הזמנות ושירותים בתשלום',
        },
        paragraphs: {
          en: [
            'Requests submitted through the site or contact forms do not create a contract until we confirm scope, price, and terms in writing. Payment, delivery, refunds, and IP ownership for projects are defined in the applicable proposal or agreement. Published package prices may change and may exclude VAT where applicable.',
          ],
          ru: [
            'Заявки через сайт или формы не создают договор, пока мы письменно не подтвердим объём, цену и условия. Оплата, сроки, возвраты и ИС по проектам определяются в предложении или договоре. Указанные пакетные цены могут меняться и могут не включать НДС, где применимо.',
          ],
          he: [
            'פניות דרך האתר או טפסים אינן יוצרות חוזה עד לאישור בכתב של היקף, מחיר ותנאים. תשלום, אספקה, החזרים ובעלות בקניין רוחני בפרויקטים יוסדרו בהצעה או בהסכם. מחירי חבילות עשויים להשתנות ועשויים שלא לכלול מע״מ ככל שחל.',
          ],
        },
      },
      {
        heading: {
          en: '8. Governing law and jurisdiction',
          ru: '8. Применимое право и юрисдикция',
          he: '8. דין חל וסמכות שיפוט',
        },
        paragraphs: {
          en: [
            'These Terms are governed by the laws of the State of Israel, without regard to conflict-of-law rules. Exclusive jurisdiction lies with the competent courts in Israel (Eilat / Southern District, as applicable), subject to mandatory consumer protections where they apply.',
          ],
          ru: [
            'Условия регулируются законодательством Государства Израиль без учёта коллизионных норм. Исключительная подсудность — компетентным судам Израиля (Эйлат / Южный округ, по применимости), с учётом императивных норм о защите потребителей, где они применяются.',
          ],
          he: [
            'על תנאים אלה יחולו דיני מדינת ישראל, ללא כללי ברירת הדין. סמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים בישראל (אילת / מחוז הדרום, לפי העניין), בכפוף להגנות צרכניות קוגנטיות ככל שחלות.',
          ],
        },
      },
      {
        heading: {
          en: '9. Changes',
          ru: '9. Изменения',
          he: '9. שינויים',
        },
        paragraphs: {
          en: [
            'We may revise these Terms by posting an updated version on this page. The “Last updated” date will reflect the change. Continued use after the update constitutes acceptance where permitted by law.',
          ],
          ru: [
            'Мы можем обновлять Условия, публикуя новую редакцию на этой странице. Дата «Последнее обновление» отразит изменение. Продолжение использования после обновления означает согласие, где это допускается законом.',
          ],
          he: [
            'אנו רשאים לעדכן תנאים אלה על ידי פרסום גרסה מעודכנת בעמוד זה. תאריך “עודכן לאחרונה” ישקף את השינוי. המשך שימוש לאחר העדכון מהווה הסכמה ככל שהדין מאפשר.',
          ],
        },
      },
    ],
    closing: CONTACT_LINE,
  },

  accessibility: {
    id: 'accessibility',
    slug: 'accessibility',
    title: {
      en: 'Accessibility Statement',
      ru: 'Заявление о доступности',
      he: 'הצהרת נגישות',
    },
    metaDescription: {
      en: 'Erythro.ai accessibility statement (Israeli Standard 5568 / WCAG alignment).',
      ru: 'Заявление Erythro.ai о доступности (стандарт Израиля 5568 / соответствие WCAG).',
      he: 'הצהרת הנגישות של Erythro.ai (ת״י 5568 / התאמה ל־WCAG).',
    },
    updatedLabel: {
      en: 'Statement date',
      ru: 'Дата заявления',
      he: 'תאריך ההצהרה',
    },
    updatedAt: '2026-07-29',
    intro: {
      en: 'Erythro.ai is committed to making this website accessible in line with Israeli accessibility requirements and Israeli Standard 5568 (WCAG 2.0 Level AA principles). This statement describes implemented measures, known technical limitations, and how to request assistance or an alternative format.',
      ru: 'Erythro.ai стремится сделать сайт доступным в соответствии с требованиями Израиля по доступности и стандартом Израиля 5568 (принципы WCAG 2.0 уровня AA). В заявлении описаны реализованные меры, известные технические ограничения и способ запросить помощь или альтернативный формат.',
      he: 'Erythro.ai מחויבת להנגשת האתר בהתאם לדרישות הנגישות בישראל ולתקן ישראלי ת״י 5568 (עקרונות WCAG 2.0 ברמת AA). הצהרה זו מתארת אמצעים שיושמו, מגבלות טכניות ידועות, וכיצד ניתן לבקש סיוע או פורמט חלופי.',
    },
    sections: [
      {
        heading: {
          en: '1. Scope',
          ru: '1. Область применения',
          he: '1. היקף',
        },
        paragraphs: {
          en: [
            'This statement applies to the public website at erythro.ai, including the home page, services, portfolio, contact flows, and legal pages. Third-party embeds (for example, analytics or messaging widgets) may have their own accessibility characteristics outside our full control.',
          ],
          ru: [
            'Заявление относится к публичному сайту erythro.ai, включая главную, услуги, портфолио, формы связи и юридические страницы. Сторонние встраивания (аналитика, виджеты сообщений) могут иметь собственные характеристики доступности вне полного нашего контроля.',
          ],
          he: [
            'הצהרה זו חלה על האתר הציבורי בכתובת erythro.ai, לרבות דף הבית, שירותים, פורטפוליו, תהליכי יצירת קשר ועמודי מדיניות. רכיבים של צדדים שלישיים (למשל אנליטיקה או ווידג׳טים) עשויים להיות בעלי מאפייני נגישות שאינם בשליטתנו המלאה.',
          ],
        },
      },
      {
        heading: {
          en: '2. Accessibility measures',
          ru: '2. Меры доступности',
          he: '2. אמצעי נגישות',
        },
        paragraphs: {
          en: ['Among other steps, we aim to provide:'],
          ru: ['Среди прочего мы стремимся обеспечить:'],
          he: ['בין היתר אנו שואפים לספק:'],
        },
        bullets: {
          en: [
            'Document language attributes and right-to-left (RTL) layout for Hebrew.',
            'Skip link to main content and a clear page landmark structure.',
            'Labeled contact form fields with accessible error messages.',
            'Visible keyboard focus indicators on interactive controls.',
            'An on-site accessibility panel (text size, contrast, motion preferences, and related aids).',
            'Descriptive alternative text for key images when provided in the content management system.',
            'This accessibility statement with coordinator contact details.',
          ],
          ru: [
            'Языковые атрибуты документа и раскладка RTL для иврита.',
            'Ссылка «перейти к содержимому» и понятная структура ориентиров страницы.',
            'Подписанные поля форм связи и доступные сообщения об ошибках.',
            'Видимый фокус клавиатуры на интерактивных элементах.',
            'Панель доступности на сайте (размер текста, контраст, анимация и связанные настройки).',
            'Альтернативный текст для ключевых изображений, если он задан в CMS.',
            'Настоящее заявление о доступности с контактами координатора.',
          ],
          he: [
            'מאפייני שפה במסמך ותמיכה ב־RTL לעברית.',
            'קישור «דלג לתוכן» ומבנה ציוני דרך ברור בעמוד.',
            'שדות טופס יצירת קשר עם תוויות והודעות שגיאה נגישות.',
            'סימון מיקוד מקלדת גלוי ברכיבים אינטראקטיביים.',
            'חלונית נגישות באתר (גודל טקסט, ניגודיות, העדפות תנועה ועזרים נוספים).',
            'טקסט חלופי לתמונות מפתח ככל שסופק במערכת התוכן.',
            'הצהרת נגישות זו עם פרטי יצירת קשר לרכז/ת הנגישות.',
          ],
        },
      },
      {
        heading: {
          en: '3. Compatibility',
          ru: '3. Совместимость',
          he: '3. תאימות',
        },
        paragraphs: {
          en: [
            'The site is designed to work with current major browsers (Chrome, Firefox, Safari, Edge) on common desktop and mobile devices. We recommend keeping your browser and assistive technology up to date.',
          ],
          ru: [
            'Сайт рассчитан на актуальные версии основных браузеров (Chrome, Firefox, Safari, Edge) на типичных компьютерах и мобильных устройствах. Рекомендуем обновлять браузер и вспомогательные технологии.',
          ],
          he: [
            'האתר מיועד לעבוד עם דפדפנים עיקריים עדכניים (Chrome, Firefox, Safari, Edge) במחשבים ובמכשירים ניידים נפוצים. מומלץ לעדכן את הדפדפן ואת טכנולוגיות העזר.',
          ],
        },
      },
      {
        heading: {
          en: '4. Known limitations',
          ru: '4. Известные ограничения',
          he: '4. מגבלות ידועות',
        },
        paragraphs: {
          en: [
            'We do not claim full WCAG 2.0 AA conformance for every page and interaction. Some experiences use rich scroll animation (including GSAP-pinned sections), decorative looping background video without captions, and complex overlays (mobile menu / dialogs) that may not yet meet every success criterion for all assistive technologies.',
            'CMS-driven media may occasionally lack complete alternative text until editors update it. The on-site accessibility panel helps many users but does not replace a standards-compliant page by itself.',
            'If you encounter a barrier, contact us. We will try to provide the information in an accessible format (for example by email, phone, or an alternative document) within a reasonable time.',
          ],
          ru: [
            'Мы не заявляем полное соответствие WCAG 2.0 AA для каждой страницы и каждого сценария. На части экранов используются сложная scroll-анимация (в том числе закреплённые GSAP-секции), декоративное зацикленное фоновое видео без субтитров и сложные оверлеи (мобильное меню / диалоги), которые могут пока не полностью удовлетворять всем критериям для всех вспомогательных технологий.',
            'В материалах из CMS иногда может не хватать полного альтернативного текста до обновления редактором. Панель доступности на сайте помогает многим пользователям, но сама по себе не заменяет соответствие стандарту.',
            'Если вы столкнулись с барьером — свяжитесь с нами. Мы постараемся предоставить информацию в доступном формате (например по email, телефону или альтернативным документом) в разумный срок.',
          ],
          he: [
            'איננו טוענים לעמידה מלאה ב־WCAG 2.0 AA בכל עמוד ובכל אינטראקציה. בחלק מהחוויות יש אנימציית גלילה מורכבת (כולל מקטעים נעוצים ב־GSAP), וידאו רקע דקורטיבי בלולאה ללא כתוביות, ושכבות מורכבות (תפריט נייד / דיאלוגים) שעדיין עשויות שלא לעמוד בכל קריטריוני ההצלחה לכל טכנולוגיות העזר.',
            'מדיה ממערכת התוכן עלולה לעיתים לחסור בטקסט חלופי מלא עד לעדכון על ידי העורכים. חלונית הנגישות באתר מסייעת למשתמשים רבים אך אינה מחליפה כשלעצמה עמידה בתקן.',
            'אם נתקלתם במחסום — פנו אלינו. נשתדל לספק את המידע בפורמט נגיש (למשל בדוא״ל, בטלפון או במסמך חלופי) בזמן סביר.',
          ],
        },
      },
      {
        heading: {
          en: '5. Accessibility contact',
          ru: '5. Контакт по вопросам доступности',
          he: '5. רכז/ת נגישות ויצירת קשר',
        },
        paragraphs: {
          en: [
            'For accessibility requests, feedback, or to report a problem on the site, contact our accessibility coordinator:',
            'Email: erythro.ai@gmail.com',
            'Phone: +972 50 931 27 46',
            'Location: Eilat, Israel',
            'We aim to respond within a reasonable time and to offer a practical solution (for example, sending content in another format).',
          ],
          ru: [
            'По вопросам доступности, отзывам или сообщениям о проблемах на сайте обращайтесь к координатору по доступности:',
            'Email: erythro.ai@gmail.com',
            'Телефон: +972 50 931 27 46',
            'Адрес: Эйлат, Израиль',
            'Мы стремимся ответить в разумный срок и предложить практическое решение (например, предоставить материалы в другом формате).',
          ],
          he: [
            'לבקשות נגישות, משוב או דיווח על תקלה באתר, פנו לרכז/ת הנגישות:',
            'דוא״ל: erythro.ai@gmail.com',
            'טלפון: +972 50 931 27 46',
            'מיקום: אילת, ישראל',
            'אנו שואפים להשיב בזמן סביר ולהציע פתרון מעשי (למשל מסירת תוכן בפורמט אחר).',
          ],
        },
      },
      {
        heading: {
          en: '6. Enforcement',
          ru: '6. Надзор',
          he: '6. אכיפה',
        },
        paragraphs: {
          en: [
            'If you believe accessibility obligations were not met, you may contact us first. You may also contact the Commission for Equal Rights of Persons with Disabilities and other Israeli authorities responsible for accessibility enforcement according to applicable regulations.',
          ],
          ru: [
            'Если вы считаете, что обязательства по доступности не выполнены, сначала свяжитесь с нами. Также можно обратиться в Комиссию по равным правам людей с ограниченными возможностями и в другие уполномоченные израильские органы по надзору за доступностью согласно применимым нормам.',
          ],
          he: [
            'אם לדעתכם לא עמדנו בחובות הנגישות, ניתן לפנות אלינו תחילה. ניתן גם לפנות לנציבות שוויון זכויות לאנשים עם מוגבלות ולגורמי אכיפה נוספים בישראל המוסמכים בנושא נגישות בהתאם לתקנות החלות.',
          ],
        },
      },
    ],
    closing: {
      en: 'This statement was prepared for erythro.ai. We will update it when significant accessibility changes are made.',
      ru: 'Заявление подготовлено для erythro.ai. Мы обновим его при существенных изменениях доступности.',
      he: 'הצהרה זו הוכנה עבור erythro.ai. נעדכן אותה בעת שינויי נגישות משמעותיים.',
    },
  },
}

export function getLegalPage(id: LegalPageId): LegalPage {
  return legalPages[id]
}

export function tLegal(field: LocalizedString, locale: string): string {
  const key = (locale === 'ru' || locale === 'he' ? locale : 'en') as LegalLocale
  return field[key] || field.en
}

export function tLegalList(field: LocalizedParagraphs, locale: string): string[] {
  const key = (locale === 'ru' || locale === 'he' ? locale : 'en') as LegalLocale
  return field[key] || field.en
}
