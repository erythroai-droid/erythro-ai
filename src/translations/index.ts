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
