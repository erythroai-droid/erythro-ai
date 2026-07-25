export interface TranslationDict {
  [locale: string]: string
}

// 1. Navbar translations
export const navbar = {
  navItems: [
    {
      label: { en: 'CASE STUDIES', ru: 'КЕЙСЫ', he: 'מקרי מבחן' },
      description: {
        en: 'View our selected works',
        ru: 'Смотреть избранные работы',
        he: 'צפו בעבודות נבחרות',
      },
      href: '#cases',
    },
    {
      label: { en: 'SERVICES', ru: 'УСЛУГИ', he: 'שירותים' },
      description: {
        en: 'What we can build for you',
        ru: 'Что мы можем сделать для вас',
        he: 'מה נוכל לבנות בשבילכם',
      },
      href: '#services',
    },
    {
      label: { en: 'SOLUTIONS', ru: 'РЕШЕНИЯ', he: 'פתרונות' },
      description: {
        en: 'Ready-made packages',
        ru: 'Готовые пакеты решений',
        he: 'חבילות מוכנות',
      },
      href: '#solutions',
    },
    {
      label: { en: 'CONTACTS', ru: 'КОНТАКТЫ', he: 'יצירת קשר' },
      description: {
        en: 'Get in touch and find us',
        ru: 'Связаться с нами',
        he: 'צרו קשר ומצאו אותנו',
      },
      href: '#contacts',
    },
  ],
  ctaLabel: {
    en: "LET'S TALK...",
    ru: 'ОБСУДИТЬ...',
    he: 'בואו נדבר...',
  },
  /** Primary CTA target — #contact-modal opens the contact form. */
  ctaHref: '#contact-modal',
}

// 1b. Cookie consent banner translations
export const cookieConsent = {
  message: {
    en: 'We use cookies on our website to remember your language preference and improve your experience.',
    ru: 'На нашем сайте используются cookies, чтобы запомнить выбранный язык и улучшить ваш опыт.',
    he: 'אנו משתמשים בעוגיות באתר שלנו כדי לזכור את העדפת השפה שלך ולשפר את החוויה.',
  },
  accept: {
    en: 'Accept',
    ru: 'Принять',
    he: 'אישור',
  },
  decline: {
    en: 'Decline',
    ru: 'Отклонить',
    he: 'דחייה',
  },
}

// 2. Hero translations
export const hero = {
  preHeading: {
    en: 'Precision AI Engineering',
    ru: 'ВЫСОКОТОЧНАЯ ИИ-ИНЖЕНЕРИЯ',
    he: 'הנדסת בינה מלאכותית מדויקת',
  },
  mainHeading: {
    en: 'ENGINEERING FUTURE',
    ru: 'ИНЖЕНЕРИЯ БУДУЩЕГО',
    he: 'הנדסת העתיד',
  },
  /** Rotating hero headline phrases (motion text). */
  motionHeadings: [
    {
      text: {
        en: 'ENGINEERING FUTURE',
        ru: 'ИНЖЕНЕРИЯ БУДУЩЕГО',
        he: 'הנדסת העתיד',
      },
      outline: {
        en: 'ENGINEERING FUTURE',
        ru: 'ИНЖЕНЕРИЯ БУДУЩЕГО',
        he: 'הנדסת העתיד',
      },
    },
    {
      text: {
        en: 'AI AUTOMATION',
        ru: 'AI-АВТОМАТИЗАЦИЯ',
        he: 'אוטומציית AI',
      },
      outline: {
        en: 'AI AUTOMATION',
        ru: 'AI-АВТОМАТИЗАЦИЯ',
        he: 'אוטומציית AI',
      },
    },
    {
      text: {
        en: 'SCALABLE SYSTEMS',
        ru: 'МАСШТАБИРУЕМЫЕ СИСТЕМЫ',
        he: 'מערכות מדרגיות',
      },
      outline: {
        en: 'SCALABLE SYSTEMS',
        ru: 'МАСШТАБИРУЕМЫЕ СИСТЕМЫ',
        he: 'מערכות מדרגיות',
      },
    },
    {
      text: {
        en: 'INTELLIGENT CODE',
        ru: 'ИНТЕЛЛЕКТУАЛЬНЫЙ КОД',
        he: 'קוד חכם',
      },
      outline: {
        en: 'INTELLIGENT CODE',
        ru: 'ИНТЕЛЛЕКТУАЛЬНЫЙ КОД',
        he: 'קוד חכם',
      },
    },
  ],
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
  /** Hero CTA — #contacts keeps legacy mobile/desktop scroll behaviour. */
  ctaHref: '#contacts',
}

// 3. Services translations
export interface ServiceItem {
  id: string
  /** URL slug for /services/[slug]; preferred over id → slug map when set via CMS. */
  slug?: string
  number: string
  title: Record<string, string>
  features: Record<string, string[]>
  image: string
  /** First-frame poster shown under video while it loads or if playback fails. */
  videoPoster?: string
  /** Optional video URL. When set, the card plays this video instead of `image`. */
  video?: string
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
  startCtaHref: '#contact-modal',
  priceLabel: {
    en: 'Starting from',
    ru: 'От',
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
          'Banners',
          'Web design',
          'Motion design',
          'Graphic design',
        ],
        ru: [
          'Бренд-айдентика / Презентации',
          'Баннеры',
          'Веб-дизайн',
          'Моушн-дизайн',
          'Графический дизайн',
        ],
        he: [
          'זהות מותג / מצגות',
          'באנרים',
          'עיצוב אתרים',
          'עיצוב בתנועה',
          'עיצוב גרפי',
        ],
      },
      image: '/images/service_design_branding.webp',
      videoPoster: '/images/service_design_branding_poster.webp',
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
          'אנימציית ממשק משתמש ומושן',
          'הגדרת SEO',
          'פרסום קל',
        ],
      },
      image: '/images/service_development.webp',
      videoPoster: '/images/service_development_poster.webp',
    },
    {
      id: '3',
      number: '03',
      title: {
        en: 'Management',
        ru: 'Управление',
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
          'מבנה בעל יכולת הרחבה',
          'אינטגרציית API',
          'מערכות ניהול תוכן CMS',
        ],
      },
      image: '/images/service_management.webp',
      videoPoster: '/images/service_management_poster.webp',
    },
    {
      id: '4',
      number: '04',
      title: {
        en: 'AI & Automation',
        ru: 'ИИ и автоматизация',
        he: 'בינה מלאכותית ואוטומציה',
      },
      features: {
        en: ['AI agents', 'Automation process', 'Chat bot', 'Voice assistance'],
        ru: ['ИИ-агенты', 'Автоматизация процессов', 'Чат-боты', 'Голосовые ассистенты'],
        he: ['סוכני AI', 'תהליכי אוטומציה', "צ'אטבוט", 'סיוע קולי'],
      },
      image: '/images/service_ai_automation.webp',
      videoPoster: '/images/service_ai_automation_poster.webp',
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
    en: 'GET STARTED',
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
    ru: 'Мы создаем цифровую идентичность',
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
    he: 'אנו מפתחים ארכיטקטורות בעלות ביצועים גבוהים, צינורות נתונים עצביים ומערכות דיגיטליות יוקרתיות שנועדו לייעל ולהרחיב את התהליכים העסקיים שלך.',
  },
  cardCTA: {
    en: 'GET STARTED',
    ru: 'НАЧАТЬ РАБОТУ',
    he: 'להתחיל עכשיו',
  },
  cardCtaHref: '/portfolio',
  viewAllProjects: {
    en: 'View All Projects',
    ru: 'Смотреть все проекты',
    he: 'כל הפרויקטים',
  },
  viewAllHref: '/portfolio',
  // Prefer CMS/Blob uploads. Local paths and stale blob URLs break on Vercel.
  video: '',
  videoMobile: '',
}

// 6. Solution Section translations
export interface SolutionFeature {
  label?: Record<string, string>
  value?: Record<string, string>
  full?: Record<string, string>
}

export type SolutionCurrency = 'ILS' | 'USD' | 'EUR'

export interface SolutionCardItem {
  id: string
  /** Currency code for price display. Default ILS (₪). */
  currency?: SolutionCurrency
  price: string
  pricePrefix?: Record<string, string>
  priceNote?: boolean
  originalPrice?: string
  title: Record<string, string>
  features: SolutionFeature[]
  disclaimer?: Record<string, string>
  featured?: boolean
  /** Optional plan CTA override; empty → /order/{id}. */
  ctaHref?: string
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
    he: 'מודלי תמחור ברורים לסוגים שונים של שיתוף פעולה',
  },
  ctaLabel: {
    en: 'Get started',
    ru: 'Начать сейчас',
    he: 'להתחיל עכשיו',
  },
  /** Empty = each plan uses its own ctaHref or /order/{id}. */
  ctaHref: '',
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
          label: { en: 'Hosting:', ru: 'Хостинг:', he: 'אחסון:' },
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
            en: 'AI: Integration of a ready-made chatbot for booking and answering FAQs',
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
          value: { en: '650₪/mth', ru: '650₪/мес', he: '650₪/חודש' },
        },
      ],
      disclaimer: {
        en: '* split into up to 12 payments',
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
          value: { en: '2500₪/mth', ru: '2500₪/мес', he: '2500₪/חודש' },
        },
      ],
      disclaimer: {
        en: '* split into up to 12 payments',
        ru: '* возможна оплата в 12 платежей',
        he: '* אפשרות לתשלום ב-12 תשלומים',
      },
    },
  ] as SolutionCardItem[],
}

// 7. FAQ Section translations
export interface FAQItem {
  question: Record<string, string>
  /** Plain-text fallback / SEO; CMS rich answers live in `answerRich`. */
  answer: Record<string, string>
  /** Lexical JSON per locale from Payload (optional until CMS is populated). */
  answerRich?: Record<string, unknown>
}

export const faq = {
  sectionTitle: {
    en: 'FAQ',
    ru: 'FAQ',
    he: 'FAQ',
  },
  sectionSubtitle: {
    en: 'Quick answers to the questions we get most often before a project starts.',
    ru: 'Коротко отвечаем на частые вопросы перед стартом проекта.',
    he: 'תשובות קצרות לשאלות הנפוצות לפני תחילת פרויקט.',
  },
  items: [
    {
      question: {
        en: 'How long does it take to launch a project?',
        ru: 'Сколько времени занимает запуск проекта?',
        he: 'כמה זמן לוקח להשיק פרויקט?',
      },
      answer: {
        en: 'Timeline depends on scope: a landing page usually takes a few weeks, while a CMS site with integrations and motion needs more time. After the brief, we provide a clear roadmap and milestones.',
        ru: 'Срок зависит от задачи: лендинг обычно занимает несколько недель, а сайт с CMS, интеграциями и анимацией требует больше времени. После брифа мы даем понятный план и этапы.',
        he: 'משך העבודה תלוי בהיקף: דף נחיתה לוקח בדרך כלל כמה שבועות, ואתר עם CMS, אינטגרציות ואנימציות דורש יותר זמן. אחרי הבריף אנחנו נותנים תוכנית עבודה ברורה ושלבים מסודרים.',
      },
    },
    {
      question: {
        en: 'Do you only handle design, or can you deliver everything end-to-end?',
        ru: 'Работаете ли вы только с дизайном, или можете сделать все под ключ?',
        he: 'אתם עובדים רק על עיצוב או גם על ביצוע מלא?',
      },
      answer: {
        en: 'We can cover the full cycle: strategy, design, development, CMS, baseline SEO, motion, and launch. When needed, we also add branding, AI automation, and ongoing support.',
        ru: 'Мы можем закрыть весь цикл: стратегия, дизайн, разработка, CMS, базовое SEO, анимации и запуск. При необходимости подключаем брендинг, AI-автоматизацию и дальнейшую поддержку.',
        he: 'אנחנו יכולים ללוות את כל התהליך: אסטרטגיה, עיצוב, פיתוח, CMS, SEO בסיסי, אנימציות והשקה. לפי הצורך נוסיף גם מיתוג, אוטומציה מבוססת AI ותמיכה בהמשך.',
      },
    },
    {
      question: {
        en: 'Will we be able to edit the content ourselves later?',
        ru: 'Можно ли потом самостоятельно редактировать контент?',
        he: 'אפשר לערוך את התוכן לבד אחר כך?',
      },
      answer: {
        en: 'Yes. We build editor-friendly structure and admin tooling so your team can update copy, imagery, case studies, services, and SEO fields without a developer.',
        ru: 'Да. Мы закладываем editor-friendly структуру и админку, чтобы вы могли менять тексты, изображения, кейсы, услуги и SEO-поля без разработчика.',
        he: 'כן. אנחנו בונים מבנה אדיטורי נוח וממשק ניהול שמאפשר לעדכן טקסטים, תמונות, עבודות, שירותים ושדות SEO בלי לפנות למפתח.',
      },
    },
    {
      question: {
        en: 'Do you take AI and automation projects too?',
        ru: 'Берете ли вы проекты с AI и автоматизацией?',
        he: 'אתם עושים גם פרויקטים עם AI ואוטומציה?',
      },
      answer: {
        en: 'Yes. In addition to websites, we build AI agents, n8n automations, CRM-connected flows, chat, and voice experiences when they create real business value.',
        ru: 'Да. Мы делаем не только сайты, но и AI-агентов, n8n-автоматизацию, формы, CRM-связки, чат- и voice-сценарии, если это полезно для бизнеса.',
        he: 'כן. מעבר לאתרים, אנחנו בונים סוכני AI, אוטומציות n8n, חיבורים ל-CRM, תהליכי צ׳אט ו-voice כאשר זה תורם ישירות לעסק.',
      },
    },
  ] as FAQItem[],
}

// 8. Footer translations
export const footer = {
  ctaHeadingLine1: {
    en: 'You have a project idea?',
    ru: 'Есть идея для проекта?',
    he: 'יש לך רעיון לפרויקט?',
  },
  ctaHeadingLine2: {
    en: "Let's talk about it!",
    ru: 'Давайте обсудим!',
    he: 'בואו נדבר על זה!',
  },
  ctaButton: {
    en: 'Get started',
    ru: 'Начать сейчас',
    he: 'להתחיל עכשיו',
  },
  ctaHref: '#contact-modal',
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
      href: '/privacy',
      label: { en: 'Privacy', ru: 'Конфиденциальность', he: 'פרטיות' },
    },
    {
      id: 'terms',
      href: '/terms',
      label: {
        en: 'Terms & conditions',
        ru: 'Условия использования',
        he: 'תנאים והגבלות',
      },
    },
    {
      id: 'accessibility',
      href: '/accessibility',
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
    he: 'אנו מטמיעים סוכני AI ואוטומציה המבוססים על',
  },
}

export const contactForm = {
  title: {
    en: "Leave a message and we'll get in touch",
    ru: 'Оставьте сообщение и мы свяжемся с вами',
    he: 'השאירו הודעה ואנו ניצור איתכם קשר',
  },
  name: {
    en: 'Name',
    ru: 'Имя',
    he: 'שם',
  },
  email: {
    en: 'Email',
    ru: 'Email',
    he: 'אימייל',
  },
  phone: {
    en: 'Phone',
    ru: 'Телефон',
    he: 'טלפון',
  },
  message: {
    en: 'Message',
    ru: 'Сообщение',
    he: 'הודעה',
  },
  submit: {
    en: 'Send',
    ru: 'Отправить',
    he: 'שליחה',
  },
  sending: {
    en: 'Sending…',
    ru: 'Отправка…',
    he: 'שולח…',
  },
  success: {
    en: "Thank you! We'll get back to you shortly.",
    ru: 'Спасибо! Мы свяжемся с вами в ближайшее время.',
    he: 'תודה! ניצור איתכם קשר בהקדם.',
  },
  error: {
    en: 'Something went wrong. Please try again.',
    ru: 'Не удалось отправить. Попробуйте ещё раз.',
    he: 'אירעה שגיאה. אנא נסו שוב.',
  },
  close: {
    en: 'Close',
    ru: 'Закрыть',
    he: 'סגירה',
  },
}

export const accessibility = {
  title: {
    en: 'Accessibility Controls',
    ru: 'Настройки доступности',
    he: 'הגדרות נגישות',
  },
  reset: {
    en: 'Reset Settings',
    ru: 'Сбросить настройки',
    he: 'איפוס הגדרות',
  },
  poweredBy: {
    en: 'Powered by Erythro.ai',
    ru: 'Создано на Erythro.ai',
    he: 'מופעל על ידי Erythro.ai',
  },
  closeLabel: {
    en: 'Close accessibility panel',
    ru: 'Закрыть панель доступности',
    he: 'סגירת חלונית הנגישות',
  },
  biggerText: {
    en: 'Bigger Text',
    ru: 'Крупный шрифт',
    he: 'גופן גדול',
  },
  dyslexia: {
    en: 'Dyslexia Friendly',
    ru: 'Для дислексиков',
    he: 'מותאם לדיסלקציה',
  },
  contrast: {
    en: 'High Contrast',
    ru: 'Высокий контраст',
    he: 'ניגודיות גבוהה',
  },
  monochrome: {
    en: 'Monochrome',
    ru: 'Монохромный режим',
    he: 'מונוכרום',
  },
  highlightLinks: {
    en: 'Highlight Links',
    ru: 'Подсветка ссылок',
    he: 'הדגשת קישורים',
  },
  pauseAnimations: {
    en: 'Pause Animations',
    ru: 'Отключить анимации',
    he: 'חסימת אנימציות',
  },
  spacing: {
    en: 'Text Spacing',
    ru: 'Интервал текста',
    he: 'מרווח טקסט',
  },
  cursor: {
    en: 'Big Cursor',
    ru: 'Крупный курсор',
    he: 'סמן גדול',
  },
  keyboardNavigation: {
    en: 'Keyboard Navigation',
    ru: 'Навигация с клавиатуры',
    he: 'ניווט במקלדת',
  },
  screenReader: {
    en: 'Screen Reader',
    ru: 'Экранный диктор',
    he: 'קורא מסך',
  },
  screenReaderEnabled: {
    en: 'Screen reader mode enabled',
    ru: 'Режим экранного диктора включён',
    he: 'מצב קורא מסך הופעל',
  },
  screenReaderServices: {
    en: 'Services section',
    ru: 'Раздел услуг',
    he: 'מדור שירותים',
  },
  screenReaderSolutions: {
    en: 'Solutions section',
    ru: 'Раздел решений',
    he: 'מדור פתרונות',
  },
  screenReaderContacts: {
    en: 'Contact section',
    ru: 'Раздел контактов',
    he: 'מדור יצירת קשר',
  },
  screenReaderFooter: {
    en: 'Footer',
    ru: 'Подвал сайта',
    he: 'כותרת תחתונה',
  },
  screenReaderPortfolio: {
    en: 'Portfolio section',
    ru: 'Раздел портфолио',
    he: 'מדור תיק עבודות',
  },
  screenReaderProjects: {
    en: 'Projects list',
    ru: 'Список проектов',
    he: 'רשימת פרויקטים',
  },
  screenReaderDetails: {
    en: 'Details section',
    ru: 'Раздел деталей',
    he: 'מדור פרטים',
  },
  screenReaderDescription: {
    en: 'Description section',
    ru: 'Раздел описания',
    he: 'מדור תיאור',
  },
  screenReaderOrder: {
    en: 'Order section',
    ru: 'Раздел заказа',
    he: 'מדור הזמנה',
  },
  screenReaderSummary: {
    en: 'Summary section',
    ru: 'Раздел итогов',
    he: 'מדור סיכום',
  },
}
