export interface TranslationDict {
  [locale: string]: string
}

// 1. Navbar translations
export const navbar = {
  navItems: [
    { label: { en: 'CASE STUDIES', ru: 'КЕЙСЫ', he: 'מקרי מבחן' }, href: '#cases' },
    { label: { en: 'SERVICES', ru: 'УСЛУГИ', he: 'שירותים' }, href: '#services' },
    { label: { en: 'SOLUTION', ru: 'РЕШЕНИЯ', he: 'פתרונות' }, href: '#solutions' },
    { label: { en: 'CONTACTS', ru: 'КОНТАКТЫ', he: 'אנשי קשר' }, href: '#contacts' },
  ],
  ctaLabel: {
    en: "LET'S TALK...",
    ru: 'ОБСУДИТЬ...',
    he: 'בואו נדבר...',
  },
}

// 2. Hero translations
export const hero = {
  preHeading: {
    en: 'Precision AI Engineering',
    ru: 'НЕЙРОННЫЕ БИЗНЕС-СИСТЕМЫ',
    he: 'מערכות עסקיות עצביות',
  },
  mainHeading: {
    en: 'Engineering the future',
    ru: 'Инженерия будущего',
    he: 'הנדסת העתיд',
  },
  subtext: {
    en: 'Bridging the gap between traditional mechanical engineering and cutting-edge machine intelligence for high-stakes business automation.',
    ru: 'Преодолеваем разрыв между традиционным машиностроением и передовым машинным интеллектом для автоматизации бизнеса в критически важных сферах.',
    he: 'גישור על הפער בין הנדסה מכנית מסורתית לבינה מלאכותית מתקדמת לאוטומציה עסקית בעלת סיכון גבוה.',
  },
  ctaFind: {
    en: 'FIND OUT MORE',
    ru: 'ПОДРОБНЕЕ',
    he: 'למידע נוסף',
  },
}

// 3. Services translations
export interface ServiceItem {
  id: string
  number: string
  title: Record<string, string>
  features: Record<string, string[]>
  image: string
}

export const services = {
  sectionTitle: {
    en: 'SERVICES',
    ru: 'УСЛУГИ',
    he: 'שירותים',
  },
  sectionSubtitle: {
    en: 'From strategy to launch',
    ru: 'От стратегии до запуска',
    he: 'מאסטרטגיה להשקה',
  },
  startCTA: {
    en: 'GET STARTED',
    ru: 'НАЧАТЬ РАБОТУ',
    he: 'בואו נתחיל',
  },
  priceLabel: {
    en: 'Starting from',
    ru: 'Начиная от',
    he: 'החל מ-',
  },
  items: [
    {
      id: '1',
      number: '01',
      title: {
        en: 'Design & Branding',
        ru: 'Дизайн и брендинг',
        he: 'עיצוב ומיתוג',
      },
      features: {
        en: [
          'Brand Identity / Presentations',
          'Brand book',
          'Banners',
          'Web design',
          'Motion design',
          'Graphic design',
        ],
        ru: [
          'Бренд-айдентика / Презентации',
          'Брендбук',
          'Баннеры',
          'Веб-дизайн',
          'Моушн-дизайн',
          'Графический дизайн',
        ],
        he: [
          'מיתוג ואסטרטגיה / מצגות',
          'ספר מותג',
          'באנרים',
          'עיצוב אתרים',
          'עיצוב בתנועה',
          'עיצוב גרפי',
        ],
      },
      image: '/images/service_design_branding.png',
    },
    {
      id: '2',
      number: '02',
      title: {
        en: 'Development',
        ru: 'Разработка',
        he: 'פיתוח',
      },
      features: {
        en: [
          'Custom front-end',
          'Responsive Layout',
          'Motion & UI Animation',
          'SEO Setup',
          'Easy Publishing',
        ],
        ru: [
          'Индивидуальный фронтенд',
          'Адаптивная верстка',
          'Моушн и анимация интерфейса',
          'Настройка SEO',
          'Легкая публикация',
        ],
        he: [
          'פרונטאנד בהתאמה אישית',
          'פריסה רספונסיבית',
          'אנימציה וממשק משתמש',
          'הגדרת SEO',
          'פרסום קל',
        ],
      },
      image: '/images/service_development.png',
    },
    {
      id: '3',
      number: '03',
      title: {
        en: 'Management',
        ru: 'Поддержка',
        he: 'ניהול',
      },
      features: {
        en: [
          'SEO optimization',
          'Custom back-end & Admin Panels',
          'DNS setup & launch',
          'Scalable Structure',
          'API Integrations',
          'CMS',
        ],
        ru: [
          'SEO-оптимизация',
          'Кастомный бэкенд и админ-панели',
          'Настройка DNS и запуск',
          'Масштабируемая структура',
          'Интеграция API',
          'CMS',
        ],
        he: [
          'אופטימיזציית SEO',
          'ממשק ניהול וצד אחורי מותאם אישית',
          'הגדרה והשקה של DNS',
          'מבנה בעל יכולת גדילה',
          'אינטגרציית API',
          'מערכות ניהול תוכן CMS',
        ],
      },
      image: '/images/service_management.png',
    },
    {
      id: '4',
      number: '04',
      title: {
        en: 'Ai & Automation',
        ru: 'ИИ и автоматизация',
        he: 'בינה מלאכותית ואוטומציה',
      },
      features: {
        en: ['AI agents', 'Automation process', 'Chat bot', 'Voice assistance'],
        ru: ['ИИ-агенты', 'Автоматизация процессов', 'Чат-боты', 'Голосовые ассистенты'],
        he: ['סוכני AI', 'תהליכי אוטומציה', "צ'אט בוט", 'סיוע קולי'],
      },
      image: '/images/service_ai_automation.png',
    },
  ] as ServiceItem[],
}

// 4. Page & Showcase translations
export const page = {
  buttonShowcaseTitle: {
    en: 'Interactive Button Matrix',
    ru: 'Матрица интерактивных кнопок',
    he: 'מטריצת כפתורים אינטראקטיביים',
  },
  buttonShowcaseSubtitle: {
    en: 'Observe the micro-animations, pixel borders, and responsive RTL flipping in different states.',
    ru: 'Наблюдайте за микроанимациями, пиксельными рамками и адаптивным переворотом RTL в различных состояниях.',
    he: 'צפו במיקרו-אנימציות, גבולות פיקסלים והיפוך RTL רספונסיבי במצבים שונים.',
  },
  darkBgLabel: {
    en: 'On Dark Background (Coal/800)',
    ru: 'На темном фоне (Coal/800)',
    he: 'על רקע כהה (Coal/800)',
  },
  lightBgLabel: {
    en: 'On Light Background (Gold/200)',
    ru: 'На светлом фоне (Gold/200)',
    he: 'על רקע בהיר (Gold/200)',
  },
  ctaLabel: {
    en: "LET'S TALK...",
    ru: 'ОБСУДИТЬ...',
    he: 'בואו נדבר...',
  },
  moreLabel: {
    en: 'more',
    ru: 'подробнее',
    he: 'עוד',
  },
  getStartLabel: {
    en: 'GET A START',
    ru: 'НАЧАТЬ СЕЙЧАС',
    he: 'להתחיל עכשיו',
  },
  footerText: {
    en: '© 2026 Erythro.ai. All rights reserved. Orchestrated by autonomous agents.',
    ru: '© 2026 Erythro.ai. Все права защищены. Оркестровано автономными агентами.',
    he: '© 2026 Erythro.ai. כל הזכויות שמורות. מתוזמר על ידי סוכנים אוטונומיים.',
  },
}

// 5. Case Studies translations
export const caseStudies = {
  preTitle: {
    en: 'CASE STUDIES',
    ru: 'КЕЙСЫ',
    he: 'מקרי מבחן',
  },
  subtitle: {
    en: 'We are building digital identities',
    ru: 'Мы создаем цифровые личности',
    he: 'אנחנו בונים זהויות דיגיטליות',
  },
  cardTitle: {
    en: 'Smarter solutions for your product',
    ru: 'Более умные решения для вашего продукта',
    he: 'פתרונות חכמים יותר עבור המוצר שלך',
  },
  cardCategory: {
    en: 'Business Solutions',
    ru: 'Бизнес-решения',
    he: 'פתרונות עסקיים',
  },
  cardDescription: {
    en: 'We develop high-performance architectures, neural pipelines, and premium digital systems designed to optimize and scale your business processes.',
    ru: 'Мы разрабатываем высокопроизводительные архитектуры, нейросети и премиальные цифровые системы для оптимизации и масштабирования ваших бизнес-процессов.',
    he: 'אנו מפתחים ארכיטקטורות בעלות ביצועים גבוהים, צינורות נתונים עצביים ומערכות דיגיטליות יוקрתיות שנועדו לייעל ולהרחיב את התהליכים העсקיים שלך.',
  },
  cardCTA: {
    en: 'GET STARTED',
    ru: 'НАЧАТЬ РАБОТУ',
    he: 'להתחיל לעבוד',
  },
}

// 6. Solution Section translations
export interface SolutionFeature {
  label?: Record<string, string>
  value?: Record<string, string>
  full?: Record<string, string>
}

export interface SolutionCardItem {
  id: string
  price: string
  pricePrefix?: Record<string, string>
  priceNote?: boolean
  originalPrice?: string
  title: Record<string, string>
  features: SolutionFeature[]
  disclaimer?: Record<string, string>
  featured?: boolean
}

export const solutions = {
  sectionTitle: {
    en: 'SOLUTIONS',
    ru: 'РЕШЕНИЯ',
    he: 'פתרונות',
  },
  sectionSubtitle: {
    en: 'Clear pricing models for different types of collaboration',
    ru: 'Прозрачные модели ценообразования для разных форматов сотрудничества',
    he: 'מודלים ברורים לתמחור לסוגים שונים של שיתוף פעולה',
  },
  ctaLabel: {
    en: 'Get a start',
    ru: 'Начать сейчас',
    he: 'להתחיל עכשיו',
  },
  cards: [
    {
      id: 'free-start',
      price: '0',
      title: {
        en: 'Free Start',
        ru: 'Бесплатный старт',
        he: 'התחלה חינם',
      },
      features: [
        {
          label: { en: 'Hosting:', ru: 'Хостинг:', he: 'אירוח:' },
          value: { en: '0₪', ru: '0₪', he: '0₪' },
        },
        {
          label: { en: 'Stack:', ru: 'Стек:', he: 'סטאק:' },
          value: {
            en: 'HTML+CSS+JS (static)',
            ru: 'HTML+CSS+JS (статика)',
            he: 'HTML+CSS+JS (סטטי)',
          },
        },
        {
          label: { en: 'Subscription:', ru: 'Подписка:', he: 'מנוי:' },
          value: { en: '199₪/mth', ru: '199₪/мес', he: '199₪/חודש' },
        },
      ],
    },
    {
      id: 'ai-business-card',
      price: '5 000',
      title: {
        en: 'AI-Business Card',
        ru: 'AI-визитка',
        he: 'כרטיס ביקור AI',
      },
      features: [
        {
          label: { en: 'Stack:', ru: 'Стек:', he: 'סטאק:' },
          value: {
            en: 'WordPress, Elementor',
            ru: 'WordPress, Elementor',
            he: 'WordPress, Elementor',
          },
        },
        {
          full: {
            en: 'AI: Integration of a ready-made chatbot for recording and answering FAQs',
            ru: 'AI: Интеграция готового чат-бота для записи и ответов на FAQ',
            he: 'AI: שילוב צ׳אטבוט מוכן לקביעת תורים ומענה על שאלות נפוצות',
          },
        },
        {
          label: { en: 'Subscription:', ru: 'Подписка:', he: 'מנוי:' },
          value: { en: '350₪/mth', ru: '350₪/мес', he: '350₪/חודש' },
        },
      ],
    },
    {
      id: 'business-automation',
      price: '14 999',
      priceNote: true,
      originalPrice: '18 000',
      featured: true,
      title: {
        en: 'business automation',
        ru: 'бизнес-автоматизация',
        he: 'אוטומציה עסקית',
      },
      features: [
        {
          label: { en: 'Stack:', ru: 'Стек:', he: 'סטאק:' },
          value: {
            en: 'Next.js, Payload, PostgreSQL',
            ru: 'Next.js, Payload, PostgreSQL',
            he: 'Next.js, Payload, PostgreSQL',
          },
        },
        {
          full: {
            en: 'Automation: n8n (integration with your CRM, WhatsApp and newsletters)',
            ru: 'Автоматизация: n8n (интеграция с CRM, WhatsApp и рассылками)',
            he: 'אוטומציה: n8n (אינטגרציה עם CRM, WhatsApp וניוזלטרים)',
          },
        },
        {
          full: {
            en: 'Training: Personal workshop for the team (2-3 hours)',
            ru: 'Обучение: Персональный воркшоп для команды (2–3 часа)',
            he: 'הדרכה: סדנה אישית לצוות (2–3 שעות)',
          },
        },
        {
          label: { en: 'Subscription:', ru: 'Подписка:', he: 'מנוי:' },
          value: { en: '650 ₪/mth', ru: '650 ₪/мес', he: '650 ₪/חודש' },
        },
      ],
      disclaimer: {
        en: '* possible the payment into 12 payments',
        ru: '* возможна оплата в 12 платежей',
        he: '* אפשרות לתשלום ב-12 תשלומים',
      },
    },
    {
      id: 'enterprise-custom',
      price: '45 000',
      pricePrefix: { en: 'from', ru: 'от', he: 'מ-' },
      priceNote: true,
      title: {
        en: 'Enterprise: Custom',
        ru: 'Enterprise: Custom',
        he: 'Enterprise: Custom',
      },
      features: [
        {
          full: {
            en: 'Stack: React, Java Spring Boot, Docker, custom AI agents',
            ru: 'Стек: React, Java Spring Boot, Docker, кастомные AI-агенты',
            he: 'סטאק: React, Java Spring Boot, Docker, סוכני AI מותאמים',
          },
        },
        {
          full: {
            en: 'Support: 24/7 monitoring, DevOps, big data work',
            ru: 'Поддержка: мониторинг 24/7, DevOps, работа с big data',
            he: 'תמיכה: ניטור 24/7, DevOps, עבודה עם big data',
          },
        },
        {
          full: {
            en: 'Training: Comprehensive implementation program.',
            ru: 'Обучение: комплексная программа внедрения.',
            he: 'הדרכה: תוכנית הטמעה מקיפה.',
          },
        },
        {
          label: { en: 'Subscription:', ru: 'Подписка:', he: 'מנוי:' },
          value: { en: '₪2 500/mth', ru: '₪2 500/мес', he: '₪2 500/חודש' },
        },
      ],
      disclaimer: {
        en: '* possible the payment into 12 payments',
        ru: '* возможна оплата в 12 платежей',
        he: '* אפשרות לתשלום ב-12 תשלומים',
      },
    },
  ] as SolutionCardItem[],
}

// 7. Footer translations
export const footer = {
  ctaHeadingLine1: {
    en: 'You have a project idea ?',
    ru: 'Есть идея для проекта?',
    he: 'יש לך רעיון לפרויקט?',
  },
  ctaHeadingLine2: {
    en: 'Lets talk about it!',
    ru: 'Давайте обсудим!',
    he: 'בואו נדבר על זה!',
  },
  ctaButton: {
    en: 'Get a start',
    ru: 'Начать сейчас',
    he: 'להתחיל עכשיו',
  },
  companyTitle: {
    en: 'Company',
    ru: 'Компания',
    he: 'חברה',
  },
  companyLinks: [
    {
      href: '#cases',
      label: { en: 'case studies', ru: 'кейсы', he: 'מקרי מבחן' },
    },
    {
      href: '#services',
      label: { en: 'services', ru: 'услуги', he: 'שירותים' },
    },
    {
      href: '#solutions',
      label: { en: 'solutions', ru: 'решения', he: 'פתרונות' },
    },
  ],
  contactTitle: {
    en: 'Contact Info',
    ru: 'Контакты',
    he: 'פרטי קשר',
  },
  emailLabel: {
    en: 'email:',
    ru: 'email:',
    he: 'אימייל:',
  },
  phoneLabel: {
    en: 'phone:',
    ru: 'телефон:',
    he: 'טלפון:',
  },
  locationLabel: {
    en: 'Location:',
    ru: 'Адрес:',
    he: 'מיקום:',
  },
  locationValue: {
    en: ' Eilat, Israel',
    ru: ' Эйлат, Израиль',
    he: ' אילת, ישראל',
  },
  copyright: {
    en: 'Copyright © 2026. All rights reserved',
    ru: 'Copyright © 2026. Все права защищены',
    he: 'Copyright © 2026. כל הזכויות שמורות',
  },
  legalLinks: [
    {
      id: 'privacy',
      href: '#',
      label: { en: 'Privacy', ru: 'Конфиденциальность', he: 'פרטיות' },
    },
    {
      id: 'terms',
      href: '#',
      label: {
        en: 'Terms & conditions',
        ru: 'Условия использования',
        he: 'תנאים והגבלות',
      },
    },
    {
      id: 'accessibility',
      href: '#',
      label: { en: 'Accessibility', ru: 'Доступность', he: 'נגישות' },
    },
  ],
}

// 8. Let's Talk Section translations
export const letsTalk = {
  heading: {
    en: 'Your business works more efficiently when processes run automatically',
    ru: 'Ваш бизнес работает эффективнее, когда процессы выполняются автоматически',
    he: 'העסק שלך עובד בצורה יעילה יותר כאשר תהליכים רצים אוטומטית',
  },
  subheadingPrefix: {
    en: 'We implement AI agents and automation based on',
    ru: 'Мы внедряем ИИ-агентов и автоматизацию на базе',
    he: 'אנו מיישמים סוכני AI ואוטומציה המבוססים על',
  },
}
