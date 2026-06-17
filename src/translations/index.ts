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
  }
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
  }
}

// 3. Services translations
export interface ServiceItem {
  id: string
  title: Record<string, string>
  description: Record<string, string>
  price: number
  category: Record<string, string>
}

export const services = {
  sectionTitle: {
    en: 'OUR PREMIUM SERVICES',
    ru: 'НАШИ ПРЕМИАЛЬНЫЕ УСЛУГИ',
    he: 'השירותים היוקרתיים שלנו',
  },
  sectionSubtitle: {
    en: 'Crafting premium digital architectures with pixel precision and absolute performance.',
    ru: 'Создаем цифровые архитектуры премиум-класса с пиксельной точностью и абсолютной производительностью.',
    he: 'יצירת ארכיטקטורות דיגיטליות יוקרתיות בדיוק פיקסלים וביצועים מוחלטים.',
  },
  startCTA: {
    en: 'GET STARTED',
    ru: 'НАЧАТЬ РАБОТУ',
    he: 'בואו נתחיל',
  },
  priceLabel: {
    en: 'Starting from',
    ru: 'Начиная от',
    he: 'החל м-',
  },
  items: [
    {
      id: '1',
      title: {
        en: 'AI Strategy & Architecture',
        ru: 'ИИ-Стратегия и Архитектура',
        he: 'אסטרטגיה וארכיטקטורת בינה מלאכותית',
      },
      description: {
        en: 'Tailored enterprise strategy incorporating neural models, custom pipelines, and operational orchestration.',
        ru: 'Индивидуальная корпоративная стратегия, включающая нейронные модели, пользовательские конвейеры и операционную оркестровку.',
        he: 'אסטרטגיה ארגונית מותאמת אישית המשלבת מודלים עצביים, צינורות נתונים מותאמים אישית ותזמור תפעולי.',
      },
      price: 3500,
      category: {
        en: 'Consulting',
        ru: 'Консалтинг',
        he: 'ייעוץ',
      },
    },
    {
      id: '2',
      title: {
        en: 'Agentic Automations via n8n',
        ru: 'Агентные Автоматизации через n8n',
        he: 'אוטומציות סוכנים באמצעות n8n',
      },
      description: {
        en: 'High-end integration of autonomous AI agents utilizing webhooks, secure REST APIs, and instant revalidation triggers.',
        ru: 'Высококлассная интеграция автономных ИИ-агентов с использованием вебхуков, безопасных REST API и триггеров мгновенной ревалидации.',
        he: 'אינטגרציה מתקדמת של סוכני בינה מלאכותית אוטונומיים תוך שימוש בווב-הוקס, ממשקי API מאובטחים וטריгגרים לאиמות מיידי.',
      },
      price: 5000,
      category: {
        en: 'Automation',
        ru: 'Автоматизация',
        he: 'אוטומציה',
      },
    },
    {
      id: '3',
      title: {
        en: 'High-Fidelity App Ecosystems',
        ru: 'Премиальные Прикладные Системы',
        he: 'מערכות יישומים ברמת דיוק גבוהה',
      },
      description: {
        en: 'Dynamic, premium Next.js systems featuring strict layout scales, micro-animations, and full localized RTL mirroring.',
        ru: 'Динамические, премиальные системы на Next.js со строгими масштабами разметки, микроанимациями и локализованным RTL-зеркалированием.',
        he: 'מערכות Next.js דינמיות ויוקרתיות הכוללות מדדי פריסה קפדניים, מיקרו-אניมציות ושיקוף RTL מקומי מלא.',
      },
      price: 7800,
      category: {
        en: 'Frontend System',
        ru: 'Фронтенд-системы',
        he: 'מערכות פרונטנד',
      },
    },
  ] as ServiceItem[]
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
    en: 'MORE',
    ru: 'ПОДРОБНЕЕ',
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
  }
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
  }
}

