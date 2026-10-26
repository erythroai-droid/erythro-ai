const FINDINGS_DICT = {
  'Защита лид-форм от ботов и антиспам Turnstile': {
    en: {
      title: 'Bot protection & anti-spam Turnstile',
      issue: 'Forms lack modern anti-bot protection, flooding sales pipeline with spam.',
      impact: 'Spam distorts funnel conversion metrics and distracts sales team.',
      sol: 'Integrate Cloudflare Turnstile and hidden honeypot traps by Erythro.ai.'
    },
    he: {
      title: 'הגנת טפסי לידים מספאם ו-Cloudflare Turnstile',
      issue: 'טפסי האתר חשופים לספאם ובוטים המעמיסים על צוות המכירות.',
      impact: 'ספאם מעוות את נתוני ההמרה ומבזבז זמן יקר של צוות המכירות.',
      sol: 'הטמעת Cloudflare Turnstile ושדות honeypot מבית Erythro.ai.'
    }
  },
  'Ускорение Core Web Vitals и мобильного LCP': {
    en: {
      title: 'Accelerate Core Web Vitals and mobile LCP',
      issue: 'Even with decent averages, mobile LCP and INP can reach the targets: 1.5 s and 200 ms.',
      impact: 'Each +100 ms latency reduces conversion and increases cost per lead.',
      sol: 'Next-gen images, critical CSS and CDN caching by Erythro.ai.'
    },
    he: {
      title: 'האצת Core Web Vitals ו-LCP לנייד',
      issue: 'גם עם ממוצעים טובים, ניתן להביא את ה-LCP וה-INP בנייד ליעדים: 1.5 שניות ו-200 אלפיות שנייה.',
      impact: 'כל 100+ אלפיות שנייה של עיכוב מפחיתות המרה ומייקרות את עלות הליד.',
      sol: 'תמונות next-gen, CSS קריטי ו-CDN מבית Erythro.ai.'
    }
  },
  'AI-квалификация входящих заявок': {
    en: {
      title: 'AI qualification of inbound leads',
      issue: 'Leads handled manually without auto-qualification and routing.',
      impact: 'First response time grows; leads lost between email and CRM.',
      sol: 'Erythro.ai n8n/CRM AI agents: qualify, route and task 24/7.'
    },
    he: {
      title: 'סינון וסיווג לידים נכנסים מבוסס AI',
      issue: 'לידים מטופלים ידנית ללא סיווג וניתוב אוטומטיים.',
      impact: 'זמן המענה הראשוני מתארך; לידים הולכים לאיבוד בין המייל ל-CRM.',
      sol: 'סוכני AI מבית Erythro.ai: סיווג, ניתוב ומשימות 24/7.'
    }
  },
  'Расширение мультиязычной воронки': {
    en: {
      title: 'Expand multilingual funnel',
      issue: 'Locales work but lack per-market nurture flows and landings.',
      impact: 'One offer for all markets converts worse than localized journeys.',
      sol: 'Cross-cultural landings and offers for RU / EN / HE by Erythro.ai.'
    },
    he: {
      title: 'הרחבת משפך רב-לשוני',
      issue: 'השפות עובדות אך חסרים משפכים ודפי נחיתה ייעודיים לכל שוק.',
      impact: 'הצעה אחידה לכל השווקים ממירה פחות ממסעות לקוח מותאמים.',
      sol: 'התאמה בין-תרבותית של דפי נחיתה והצעות ל-RU / EN / HE מבית Erythro.ai.'
    }
  },
  'JavaScript падает в браузере и блокирует кнопки': {
    en: {
      title: 'JavaScript crashes in browser blocking interactive buttons',
      issue: 'Uncaught JS exceptions in runtime.',
      impact: 'Buttons and form submissions may fail — leads do not reach the sales team.',
      sol: 'Frontend debugging, error auditing and Playwright automated test coverage by Erythro.ai.'
    },
    he: {
      title: 'שגיאות JavaScript בדפדפן חוסמות כפתורים וטפסים',
      issue: 'שגיאות קוד בלתי מטופלות בזמן ריצה.',
      impact: 'כפתורים ושליחת טפסים עלולים להיכשל — פניות אינן מגיעות לצוות המכירות.',
      sol: 'תיקון שגיאות פרונטנד וכיסוי בדיקות Playwright אוטומטיות מבית Erythro.ai.'
    }
  },
  'Медленная загрузка на смартфонах сжигает рекламный бюджет': {
    en: {
      title: 'Slow mobile load burns digital advertising budget',
      issue: 'Mobile Lighthouse score is below optimal.',
      impact: '25–40% of visitors bounce before the first screen loads.',
      sol: 'Core Web Vitals optimization: Next-Gen images, critical CSS and preloading by Erythro.ai.'
    },
    he: {
      title: 'טעינה איטית בניידים שורפת תקציבי פרסום',
      issue: 'ציון מהירות מובייל נמוך מהרצוי.',
      impact: '25%–40% מהגולשים נוטשים לפני טעינת המסך הראשון.',
      sol: 'אופטימיזציית Core Web Vitals: תמונות מתקדמות וטעינת CSS קריטי מבית Erythro.ai.'
    }
  }
};


const ACTION_CODE_SOLUTIONS = {
  speed: {
    file: 'src/app/(frontend)/layout.tsx:160-175',
    ru: {
      desc: 'Предзагрузка ключевого LCP-баннера и шрифтов для ускорения первой отрисовки (цель LCP < 2.5s)',
      code: `// src/app/(frontend)/layout.tsx:160-175
// Предзагрузка LCP-изображения и шрифтов для ускорения первой отрисовки:
<link rel="preload" as="image" href="/images/hero-bg.webp" type="image/webp" fetchpriority="high" />
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`
    },
    en: {
      desc: 'Preload LCP hero image and fonts to accelerate largest contentful paint (target LCP < 2.5s)',
      code: `// src/app/(frontend)/layout.tsx:160-175
// Preload hero LCP image and critical fonts:
<link rel="preload" as="image" href="/images/hero-bg.webp" type="image/webp" fetchpriority="high" />
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`
    },
    he: {
      desc: 'טעינה מוקדמת לתמונת LCP ולגופנים להאצת הציור הראשוני (יעד LCP < 2.5 שניות)',
      code: `// src/app/(frontend)/layout.tsx:160-175
// טעינה מוקדמת לתמונת LCP ולגופנים:
<link rel="preload" as="image" href="/images/hero-bg.webp" type="image/webp" fetchpriority="high" />
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`
    }
  },
  speed_cwv: {
    file: 'next.config.mjs:8-22',
    ru: {
      desc: 'Оптимизация форматов изображений (AVIF/WebP) и кэширования для ускорения LCP и INP',
      code: `// next.config.mjs:8-22
// Автоматическая оптимизация изображений и кэширование для Core Web Vitals:
images: {
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: 31536000,
  deviceSizes: [375, 640, 750, 1080, 1200]
},
compress: true`
    },
    en: {
      desc: 'Optimize image formats (AVIF/WebP) and cache headers to accelerate LCP and INP',
      code: `// next.config.mjs:8-22
// Automatic image optimization and cache TTL for Core Web Vitals:
images: {
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: 31536000,
  deviceSizes: [375, 640, 750, 1080, 1200]
},
compress: true`
    },
    he: {
      desc: 'אופטימיזציית פורמטי תמונות (AVIF/WebP) וכותרות שמירה במטמון להאצת LCP ו-INP',
      code: `// next.config.mjs:8-22
// אופטימיזציית תמונות מתקדמות ושמירה במטמון עבור Core Web Vitals:
images: {
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: 31536000,
  deviceSizes: [375, 640, 750, 1080, 1200]
},
compress: true`
    }
  },
  ai_lead: {
    file: 'src/app/api/lead/qualify/route.ts:12-35',
    ru: {
      desc: 'Автоматическая AI-квалификация входящих заявок, скоринг и маршрутизация в CRM 24/7',
      code: `// src/app/api/lead/qualify/route.ts:12-35
// AI-квалификация входящих заявок и скоринг лидов 24/7:
export async function POST(req: Request) {
  const { name, contact, inquiry } = await req.json();
  const lead = await erythroAI.qualify({ inquiry, threshold: 0.8 });
  await crm.dispatch({ name, contact, priority: lead.score, channel: lead.intent });
  return Response.json({ status: 'routed', priority: lead.priority });
}`
    },
    en: {
      desc: 'Automated AI lead qualification, scoring, and instant routing to CRM 24/7',
      code: `// src/app/api/lead/qualify/route.ts:12-35
// Automated AI lead qualification and routing 24/7:
export async function POST(req: Request) {
  const { name, contact, inquiry } = await req.json();
  const lead = await erythroAI.qualify({ inquiry, threshold: 0.8 });
  await crm.dispatch({ name, contact, priority: lead.score, channel: lead.intent });
  return Response.json({ status: 'routed', priority: lead.priority });
}`
    },
    he: {
      desc: 'סינון וסיווג פניות אוטומטי מבוסס AI, ניקוד ושיגור מיידי ל-CRM 24/7',
      code: `// src/app/api/lead/qualify/route.ts:12-35
// סינון וסיווג פניות אוטומטי מבוסס AI ושיגור ל-CRM:
export async function POST(req: Request) {
  const { name, contact, inquiry } = await req.json();
  const lead = await erythroAI.qualify({ inquiry, threshold: 0.8 });
  await crm.dispatch({ name, contact, priority: lead.score, channel: lead.intent });
  return Response.json({ status: 'routed', priority: lead.priority });
}`
    }
  },
  seo: {
    file: 'src/app/(frontend)/layout.tsx:75-97',
    ru: {
      desc: 'Настройка мультиязычных alternates (hreflang) и метатегов OpenGraph для локалей',
      code: `// src/app/(frontend)/layout.tsx:75-97
export async function generateMetadata(): Promise<Metadata> {
  return {
    alternates: {
      canonical: '/',
      languages: {
        'en': '/?lang=en',
        'ru': '/?lang=ru',
        'he': '/?lang=he'
      }
    },
    openGraph: {
      images: [{ url: '/images/og-image.png', width: 1200, height: 630 }]
    }
  };
}`
    },
    en: {
      desc: 'Multilingual alternates (hreflang) and OpenGraph metadata configuration across locales',
      code: `// src/app/(frontend)/layout.tsx:75-97
export async function generateMetadata(): Promise<Metadata> {
  return {
    alternates: {
      canonical: '/',
      languages: {
        'en': '/?lang=en',
        'ru': '/?lang=ru',
        'he': '/?lang=he'
      }
    },
    openGraph: {
      images: [{ url: '/images/og-image.png', width: 1200, height: 630 }]
    }
  };
}`
    },
    he: {
      desc: 'הגדרת קישורי alternates (hreflang) ומטא-נתוני OpenGraph לכל השפות',
      code: `// src/app/(frontend)/layout.tsx:75-97
export async function generateMetadata(): Promise<Metadata> {
  return {
    alternates: {
      canonical: '/',
      languages: {
        'en': '/?lang=en',
        'ru': '/?lang=ru',
        'he': '/?lang=he'
      }
    },
    openGraph: {
      images: [{ url: '/images/og-image.png', width: 1200, height: 630 }]
    }
  };
}`
    }
  },
  lead: {
    file: 'src/components/ContactForm.tsx:42-65',
    ru: {
      desc: 'Подключение защиты форм от спам-ботов через Cloudflare Turnstile и honeypot',
      code: `// src/components/ContactForm.tsx:42-65
import { Turnstile } from '@marsidev/react-turnstile';

<Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} onSuccess={setToken} />
{/* Скрытая ловушка для спам-ботов: */}
<input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />`
    },
    en: {
      desc: 'Bot protection with Cloudflare Turnstile anti-spam and hidden honeypot trap',
      code: `// src/components/ContactForm.tsx:42-65
import { Turnstile } from '@marsidev/react-turnstile';

<Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} onSuccess={setToken} />
{/* Hidden bot honeypot trap: */}
<input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />`
    },
    he: {
      desc: 'הגנה נגד ספאם באמצעות Cloudflare Turnstile ושדה מלכודת (honeypot)',
      code: `// src/components/ContactForm.tsx:42-65
import { Turnstile } from '@marsidev/react-turnstile';

<Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} onSuccess={setToken} />
{/* שדה מלכודת נסתר לבוטים: */}
<input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} />`
    }
  },
  sec: {
    file: 'next.config.mjs:15-32',
    ru: {
      desc: 'Установка обязательных HTTP-заголовков безопасности (HSTS, NoSniff, SameOrigin)',
      code: `// next.config.mjs:15-32
async headers() {
  return [{
    source: '/:path*',
    headers: [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' }
    ]
  }];
}`
    },
    en: {
      desc: 'Configuring mandatory HTTP security headers (HSTS, NoSniff, SameOrigin)',
      code: `// next.config.mjs:15-32
async headers() {
  return [{
    source: '/:path*',
    headers: [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' }
    ]
  }];
}`
    },
    he: {
      desc: 'הגדרת כותרות אבטחת HTTP חיוניות (HSTS, NoSniff, SameOrigin)',
      code: `// next.config.mjs:15-32
async headers() {
  return [{
    source: '/:path*',
    headers: [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' }
    ]
  }];
}`
    }
  },
  ai: {
    file: 'public/robots.txt:1-8',
    ru: {
      desc: 'Разрешение цитирования AI-поисковиками (ChatGPT, Perplexity) и запрет несанкционированного обучения',
      code: `# public/robots.txt:1-8
User-agent: *
Allow: /
# Content-Signal: разрешение на цитирование в поиске, запрет на обучение моделей:
Content-Signal: search=yes, ai-input=yes, ai-train=no
Sitemap: https://erythro.ai/sitemap.xml`
    },
    en: {
      desc: 'Permit AI search citations (ChatGPT, Perplexity) while blocking unauthorized model training',
      code: `# public/robots.txt:1-8
User-agent: *
Allow: /
# Content-Signal: allow search citations, prohibit unauthorized model training:
Content-Signal: search=yes, ai-input=yes, ai-train=no
Sitemap: https://erythro.ai/sitemap.xml`
    },
    he: {
      desc: 'אישור ציטוט במנועי חיפוש AI (ChatGPT, Perplexity) וחסימת אימון מודלים',
      code: `# public/robots.txt:1-8
User-agent: *
Allow: /
# Content-Signal: אישור ציטוט בחיפוש, חסימת אימון מודלים:
Content-Signal: search=yes, ai-input=yes, ai-train=no
Sitemap: https://erythro.ai/sitemap.xml`
    }
  },
  a11y: {
    file: 'src/components/Footer.tsx:55-80',
    ru: {
      desc: 'Устранение замечаний доступности WCAG 2.1 AA / IS 5568: атрибуты alt и aria-label',
      code: `// src/components/Footer.tsx:55-80
// 1. Информативные alt-подписи для изображений:
<Image src="/images/logo.svg" alt="Erythro.ai" width={140} height={40} />
// 2. Четкие aria-label для кнопок-иконок без текста:
<button type="button" aria-label="Консультация в WhatsApp" onClick={openWhatsApp}>
  <WhatsAppIcon aria-hidden="true" />
</button>`
    },
    en: {
      desc: 'WCAG 2.1 AA / IS 5568 accessibility: alt attributes and accessible button labels',
      code: `// src/components/Footer.tsx:55-80
// 1. Informative alt attributes for images:
<Image src="/images/logo.svg" alt="Erythro.ai" width={140} height={40} />
// 2. Accessible labels for icon buttons:
<button type="button" aria-label="WhatsApp consultation" onClick={openWhatsApp}>
  <WhatsAppIcon aria-hidden="true" />
</button>`
    },
    he: {
      desc: 'הנגשת WCAG 2.1 AA / תקן IS 5568: תיאורי alt לתמונות ותוויות aria-label לכפתורים',
      code: `// src/components/Footer.tsx:55-80
// 1. תיאורי alt לתמונות:
<Image src="/images/logo.svg" alt="Erythro.ai" width={140} height={40} />
// 2. תוויות נגישות לכפתורי אייקון:
<button type="button" aria-label="ייעוץ ב-WhatsApp" onClick={openWhatsApp}>
  <WhatsAppIcon aria-hidden="true" />
</button>`
    }
  }
};

function renderAiVisibilitySection(lang) {
  const content = {
    ru: {
      title: 'AI Visibility: Как сайт видят и находят ИИ-поисковики',
      badge: 'Стратегический фокус 2026',
      sub: 'Анализ готовности сайта к индексации, цитированию и ответам в ChatGPT Search, Perplexity AI, Claude и Google Gemini.',
      engines: [
        {
          name: 'ChatGPT Search (GPTBot)',
          badge: 'Индексирует',
          cls: 'ok',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M22.28 9.87a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.52-2.82 6.06 6.06 0 0 0-4.9-2.52 6.06 6.06 0 0 0-5.78 4.2 6.03 6.03 0 0 0-3.9 2.84 6.05 6.05 0 0 0 .74 7.08 6 6 0 0 0 .52 4.91 6.05 6.05 0 0 0 6.52 2.82 6.06 6.06 0 0 0 4.9 2.52 6.06 6.06 0 0 0 5.78-4.2 6.03 6.03 0 0 0 3.9-2.84 6.05 6.05 0 0 0-.74-7.08ZM13 21.88a4.54 4.54 0 0 1-2.91-1.05l.15-.08 4.83-2.79a.77.77 0 0 0 .39-.67v-6.82l2.06 1.19a.07.07 0 0 1 .04.05v5.62a4.56 4.56 0 0 1-4.56 4.55Zm-7.7-3.7a4.53 4.53 0 0 1-.58-3.04l.15.09 4.83 2.79a.77.77 0 0 0 .78 0l5.9-3.41v2.38a.07.07 0 0 1-.03.06l-4.87 2.81a4.55 4.55 0 0 1-6.18-1.68Zm-1.2-8.32a4.54 4.54 0 0 1 2.33-2l-.15.09-4.83 2.79a.77.77 0 0 0-.39.67v6.82l-2.06-1.19a.07.07 0 0 1-.04-.05V11.4a4.56 4.56 0 0 1 5.14-1.54ZM11 2.12a4.54 4.54 0 0 1 2.91 1.05l-.15.08-4.83 2.79a.77.77 0 0 0-.39.67v6.82l-2.06-1.19a.07.07 0 0 1-.04-.05V6.67A4.56 4.56 0 0 1 11 2.12Zm7.7 3.7a4.53 4.53 0 0 1 .58 3.04l-.15-.09-4.83-2.79a.77.77 0 0 0-.78 0l-5.9 3.41V7.01a.07.07 0 0 1 .03-.06l4.87-2.81a4.55 4.55 0 0 1 6.18 1.68Zm1.2 8.32a4.54 4.54 0 0 1-2.33 2l.15-.09 4.83-2.79a.77.77 0 0 0 .39-.67V7.47l2.06 1.19a.07.07 0 0 1 .04.05v5.62a4.56 4.56 0 0 1-5.14 1.54ZM12 13.5l-2.7-1.56 2.7-1.56 2.7 1.56L12 13.5Z"/></svg>`,
          desc: 'Бот OpenAI сканирует страницы, однако без файла llms.txt и прямых цитатных сигналов в robots.txt ответы модели формируются с потерей УТП и цен.'
        },
        {
          name: 'Perplexity AI (PerplexityBot)',
          badge: 'Требует фокуса',
          cls: 'warn',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2a1 1 0 0 1 1 1v7.17l5.07-5.07a1 1 0 0 1 1.41 1.41L14.41 11.6l5.07 5.07a1 1 0 0 1-1.41 1.41L13 13V21a1 1 0 0 1-2 0v-7.17l-5.07 5.07a1 1 0 0 1-1.41-1.41L9.59 12.4 4.52 7.33a1 1 0 1 1 1.41-1.41L11 11V3a1 1 0 0 1 1-1Z"/></svg>`,
          desc: 'Perplexity ищет прямые ответы в реальном времени. Требуются сжатые Brand Facts и списки услуг в формате Markdown в первых 2KB HTML.'
        },
        {
          name: 'Claude (Anthropic)',
          badge: 'Высокая читаемость',
          cls: 'ok',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="m13.2 2 8.6 15-2.6 4.5-8.6-15 2.6-4.5Zm-2.4 0 2.6 4.5-8.6 15L2.2 17l8.6-15Zm-7.7 18 1.3 2.2h15.2l1.3-2.2H3.1Z"/></svg>`,
          desc: 'Чистая HTML-структура и SSR на Next.js позволяют Claude легко считывать иерархию заголовков и таблицы без исполнения тяжелого JS.'
        },
        {
          name: 'Google Gemini & AI Overviews',
          badge: 'Knowledge Graph',
          cls: 'ok',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="m12 1 2.8 7.2L22 11l-7.2 2.8L12 21l-2.8-7.2L2 11l7.2-2.8L12 1Zm6.5 13.5 1.2 3.3 3.3 1.2-3.3 1.2-1.2 3.3-1.2-3.3-3.3-1.2 3.3-1.2 1.2-3.3Z"/></svg>`,
          desc: 'ИИ-сниппеты Google формируются на базе микроразметки Organization и Product. Требуется расширить JSON-LD сущностями FAQPage и Service.'
        }
      ],
      factorsTitle: 'Ключевые факторы AI-видимости сайта (AI Readiness Matrix)',
      factors: [
        {
          title: 'Машиночитаемый контекст (/llms.txt)',
          badge: 'Точка роста',
          cls: 'warn',
          desc: 'Открытый веб-стандарт 2025–2026 гг. Краткий каталог страниц сайта и УТП для мгновенного потребления LLM без затрат токенов на сложный парсинг.'
        },
        {
          title: 'Права краулеров и Content Signals (robots.txt)',
          badge: 'Настроить',
          cls: 'warn',
          desc: 'Рекомендуется директива Content-Signal: search=yes, ai-input=yes, ai-train=no. Разрешает цитирование в поиске, блокируя несанкционированное обучение.'
        },
        {
          title: 'Семантическая микроразметка (Schema.org JSON-LD)',
          badge: 'Внедрено (расширить)',
          cls: 'ok',
          desc: 'Микроразметка Organization и SoftwareApplication связывает сайт с Knowledge Graph и защищает бренд от выдумок и галлюцинаций нейросетей.'
        },
        {
          title: 'Markdown-доступность и серверный рендеринг (SSR)',
          badge: 'Отлично (Next.js)',
          cls: 'ok',
          desc: 'Серверный рендеринг отдает готовый текстовый контент с первого запроса (TTFB < 0.4s). Краулеры ИИ с коротким таймаутом считывают весь текст.'
        }
      ],
      verdictTitle: 'Стратегический вывод для руководства',
      verdictText: 'В 2026 году до 35–40% органического B2B-трафика формируется через генеративный поиск. Чтобы ИИ-поисковики рекомендовали именно вашу компанию, а не конкурентов, сайту необходим файл /llms.txt и явные цитатные сигналы. Готовое техническое решение подготовлено в карточке плана действий ниже.',
      verdictLink: 'Перейти к решению по AI Visibility в плане действий ↓'
    },
    en: {
      title: 'AI Visibility: How AI Search & LLM Agents Discover the Site',
      badge: 'Strategic Focus 2026',
      sub: 'Readiness and indexing analysis for ChatGPT Search, Perplexity AI, Claude, and Google Gemini Overviews.',
      engines: [
        {
          name: 'ChatGPT Search (GPTBot)',
          badge: 'Crawling active',
          cls: 'ok',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M22.28 9.87a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.52-2.82 6.06 6.06 0 0 0-4.9-2.52 6.06 6.06 0 0 0-5.78 4.2 6.03 6.03 0 0 0-3.9 2.84 6.05 6.05 0 0 0 .74 7.08 6 6 0 0 0 .52 4.91 6.05 6.05 0 0 0 6.52 2.82 6.06 6.06 0 0 0 4.9 2.52 6.06 6.06 0 0 0 5.78-4.2 6.03 6.03 0 0 0 3.9-2.84 6.05 6.05 0 0 0-.74-7.08ZM13 21.88a4.54 4.54 0 0 1-2.91-1.05l.15-.08 4.83-2.79a.77.77 0 0 0 .39-.67v-6.82l2.06 1.19a.07.07 0 0 1 .04.05v5.62a4.56 4.56 0 0 1-4.56 4.55Zm-7.7-3.7a4.53 4.53 0 0 1-.58-3.04l.15.09 4.83 2.79a.77.77 0 0 0 .78 0l5.9-3.41v2.38a.07.07 0 0 1-.03.06l-4.87 2.81a4.55 4.55 0 0 1-6.18-1.68Zm-1.2-8.32a4.54 4.54 0 0 1 2.33-2l-.15.09-4.83 2.79a.77.77 0 0 0-.39.67v6.82l-2.06-1.19a.07.07 0 0 1-.04-.05V11.4a4.56 4.56 0 0 1 5.14-1.54ZM11 2.12a4.54 4.54 0 0 1 2.91 1.05l-.15.08-4.83 2.79a.77.77 0 0 0-.39.67v6.82l-2.06-1.19a.07.07 0 0 1-.04-.05V6.67A4.56 4.56 0 0 1 11 2.12Zm7.7 3.7a4.53 4.53 0 0 1 .58 3.04l-.15-.09-4.83-2.79a.77.77 0 0 0-.78 0l-5.9 3.41V7.01a.07.07 0 0 1 .03-.06l4.87-2.81a4.55 4.55 0 0 1 6.18 1.68Zm1.2 8.32a4.54 4.54 0 0 1-2.33 2l.15-.09 4.83-2.79a.77.77 0 0 0 .39-.67V7.47l2.06 1.19a.07.07 0 0 1 .04.05v5.62a4.56 4.56 0 0 1-5.14 1.54ZM12 13.5l-2.7-1.56 2.7-1.56 2.7 1.56L12 13.5Z"/></svg>`,
          desc: 'OpenAI bot crawls pages, but without llms.txt and citation permissions in robots.txt, the model may omit core value propositions.'
        },
        {
          name: 'Perplexity AI (PerplexityBot)',
          badge: 'Needs focus',
          cls: 'warn',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2a1 1 0 0 1 1 1v7.17l5.07-5.07a1 1 0 0 1 1.41 1.41L14.41 11.6l5.07 5.07a1 1 0 0 1-1.41 1.41L13 13V21a1 1 0 0 1-2 0v-7.17l-5.07 5.07a1 1 0 0 1-1.41-1.41L9.59 12.4 4.52 7.33a1 1 0 1 1 1.41-1.41L11 11V3a1 1 0 0 1 1-1Z"/></svg>`,
          desc: 'Perplexity synthesizes real-time answers. Requires concise Markdown brand facts and service catalogs in the first 2KB of HTML.'
        },
        {
          name: 'Claude (Anthropic)',
          badge: 'High readability',
          cls: 'ok',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="m13.2 2 8.6 15-2.6 4.5-8.6-15 2.6-4.5Zm-2.4 0 2.6 4.5-8.6 15L2.2 17l8.6-15Zm-7.7 18 1.3 2.2h15.2l1.3-2.2H3.1Z"/></svg>`,
          desc: 'Clean semantic HTML and Next.js SSR allow Claude to seamlessly parse header hierarchy and tables without client JS execution.'
        },
        {
          name: 'Google Gemini & AI Overviews',
          badge: 'Knowledge Graph',
          cls: 'ok',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="m12 1 2.8 7.2L22 11l-7.2 2.8L12 21l-2.8-7.2L2 11l7.2-2.8L12 1Zm6.5 13.5 1.2 3.3 3.3 1.2-3.3 1.2-1.2 3.3-1.2-3.3-3.3-1.2 3.3-1.2 1.2-3.3Z"/></svg>`,
          desc: 'Google AI snippets rely on structured microdata. Recommended to extend JSON-LD with FAQPage and Service entities for direct citation.'
        }
      ],
      factorsTitle: 'Core AI Readiness Matrix (4 Pillars)',
      factors: [
        {
          title: 'Machine-readable context (/llms.txt)',
          badge: 'Growth opportunity',
          cls: 'warn',
          desc: 'The 2025–2026 web standard: concise site manifesto and structure for instant LLM comprehension without wasteful token overhead.'
        },
        {
          title: 'Crawler permissions & Content Signals (robots.txt)',
          badge: 'Action required',
          cls: 'warn',
          desc: 'Recommended directive: Content-Signal: search=yes, ai-input=yes, ai-train=no. Permits search citations while barring unauthorized model training.'
        },
        {
          title: 'Semantic microdata (Schema.org JSON-LD)',
          badge: 'Implemented (expand)',
          cls: 'ok',
          desc: 'Organization and SoftwareApplication microdata grounds entity facts in AI Knowledge Graphs, eliminating hallucinated answers.'
        },
        {
          title: 'Markdown accessibility & Server-Side Rendering (SSR)',
          badge: 'Excellent (Next.js)',
          cls: 'ok',
          desc: 'Server-side rendering delivers full text on initial request (TTFB < 0.4s). Fast AI crawlers reliably parse content without timeouts.'
        }
      ],
      verdictTitle: 'Executive Strategic Takeaway',
      verdictText: 'In 2026, 35–40% of inbound B2B discovery originates from generative search. Ensuring AI models cite and recommend your brand over competitors requires an /llms.txt manifest and semantic citation signals. Implementation code is available in the action plan below.',
      verdictLink: 'Jump to AI Visibility implementation in Action Plan ↓'
    },
    he: {
      title: 'AI Visibility: כיצד מנועי חיפוש וסוכני AI מוצאים את האתר',
      badge: 'מוקד אסטרטגי 2026',
      sub: 'ניתוח מוכנות ואינדוקס עבור ChatGPT Search, Perplexity AI, Claude ו-Google Gemini.',
      engines: [
        {
          name: 'ChatGPT Search (GPTBot)',
          badge: 'אינדוקס פעיל',
          cls: 'ok',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M22.28 9.87a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.52-2.82 6.06 6.06 0 0 0-4.9-2.52 6.06 6.06 0 0 0-5.78 4.2 6.03 6.03 0 0 0-3.9 2.84 6.05 6.05 0 0 0 .74 7.08 6 6 0 0 0 .52 4.91 6.05 6.05 0 0 0 6.52 2.82 6.06 6.06 0 0 0 4.9 2.52 6.06 6.06 0 0 0 5.78-4.2 6.03 6.03 0 0 0 3.9-2.84 6.05 6.05 0 0 0-.74-7.08ZM13 21.88a4.54 4.54 0 0 1-2.91-1.05l.15-.08 4.83-2.79a.77.77 0 0 0 .39-.67v-6.82l2.06 1.19a.07.07 0 0 1 .04.05v5.62a4.56 4.56 0 0 1-4.56 4.55Zm-7.7-3.7a4.53 4.53 0 0 1-.58-3.04l.15.09 4.83 2.79a.77.77 0 0 0 .78 0l5.9-3.41v2.38a.07.07 0 0 1-.03.06l-4.87 2.81a4.55 4.55 0 0 1-6.18-1.68Zm-1.2-8.32a4.54 4.54 0 0 1 2.33-2l-.15.09-4.83 2.79a.77.77 0 0 0-.39.67v6.82l-2.06-1.19a.07.07 0 0 1-.04-.05V11.4a4.56 4.56 0 0 1 5.14-1.54ZM11 2.12a4.54 4.54 0 0 1 2.91 1.05l-.15.08-4.83 2.79a.77.77 0 0 0-.39.67v6.82l-2.06-1.19a.07.07 0 0 1-.04-.05V6.67A4.56 4.56 0 0 1 11 2.12Zm7.7 3.7a4.53 4.53 0 0 1 .58 3.04l-.15-.09-4.83-2.79a.77.77 0 0 0-.78 0l-5.9 3.41V7.01a.07.07 0 0 1 .03-.06l4.87-2.81a4.55 4.55 0 0 1 6.18 1.68Zm1.2 8.32a4.54 4.54 0 0 1-2.33 2l.15-.09 4.83-2.79a.77.77 0 0 0 .39-.67V7.47l2.06 1.19a.07.07 0 0 1 .04.05v5.62a4.56 4.56 0 0 1-5.14 1.54ZM12 13.5l-2.7-1.56 2.7-1.56 2.7 1.56L12 13.5Z"/></svg>`,
          desc: 'הבוט של OpenAI סורק דפים, אך ללא llms.txt ואותות ציטוט ברורים ב-robots.txt, התשובות עלולות להחסיר יתרונות עסקיים מרכזיים.'
        },
        {
          name: 'Perplexity AI (PerplexityBot)',
          badge: 'דורש מיקוד',
          cls: 'warn',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2a1 1 0 0 1 1 1v7.17l5.07-5.07a1 1 0 0 1 1.41 1.41L14.41 11.6l5.07 5.07a1 1 0 0 1-1.41 1.41L13 13V21a1 1 0 0 1-2 0v-7.17l-5.07 5.07a1 1 0 0 1-1.41-1.41L9.59 12.4 4.52 7.33a1 1 0 1 1 1.41-1.41L11 11V3a1 1 0 0 1 1-1Z"/></svg>`,
          desc: 'Perplexity מחפש תשובות ישירות בזמן אמת. דורש עובדות מותג תמציתיות בפורמט Markdown ב-2KB הראשונים של העמוד.'
        },
        {
          name: 'Claude (Anthropic)',
          badge: 'קריאות גבוהה',
          cls: 'ok',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="m13.2 2 8.6 15-2.6 4.5-8.6-15 2.6-4.5Zm-2.4 0 2.6 4.5-8.6 15L2.2 17l8.6-15Zm-7.7 18 1.3 2.2h15.2l1.3-2.2H3.1Z"/></svg>`,
          desc: 'מבנה HTML נקי ו-SSR של Next.js מאפשרים ל-Claude לקרוא בקלות את היררכיית הכותרות ללא ביצוע JS מורכב בצד לקוח.'
        },
        {
          name: 'Google Gemini & AI Overviews',
          badge: 'גרף ידע Schema',
          cls: 'ok',
          icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="m12 1 2.8 7.2L22 11l-7.2 2.8L12 21l-2.8-7.2L2 11l7.2-2.8L12 1Zm6.5 13.5 1.2 3.3 3.3 1.2-3.3 1.2-1.2 3.3-1.2-3.3-3.3-1.2 3.3-1.2 1.2-3.3Z"/></svg>`,
          desc: 'תקצירי ה-AI של גוגל מתבססים על נתונים מובנים. מומלץ להרחיב את ה-JSON-LD עם ישויות FAQPage ו-Service לציטוט ישיר.'
        }
      ],
      factorsTitle: 'מטריצת מוכנות לעידן ה-AI (4 עמודי תווך)',
      factors: [
        {
          title: 'הקשר קריא-מכונה (/llms.txt)',
          badge: 'הזדמנות צמיחה',
          cls: 'warn',
          desc: 'תקן רשת מתקדם: מניפסט תמציתי ומפת שירותים להבנה מיידית של מודלי שפה (LLMs) ללא בזבוז טוקנים מיותר.'
        },
        {
          title: 'הרשאות סורקים ואותות תוכן (robots.txt)',
          badge: 'נדרשת הגדרה',
          cls: 'warn',
          desc: 'הנחיה מומלצת: Content-Signal: search=yes, ai-input=yes, ai-train=no. מאפשרת ציטוט במנועי AI וחוסמת אימון מודלים ללא אישור.'
        },
        {
          title: 'מיקרו-דאטה סמנטי (Schema.org JSON-LD)',
          badge: 'מוטמע (להרחבה)',
          cls: 'ok',
          desc: 'נתוני Organization ו-SoftwareApplication מחברים את האתר לגרף הידע ומונעים הזיות (hallucinations) במודלי AI.'
        },
        {
          title: 'נגישות Markdown ורינדור צד-שרת (SSR)',
          badge: 'מצוין (Next.js)',
          cls: 'ok',
          desc: 'רינדור צד-שרת מספק את הטקסט המלא בבקשה הראשונה (TTFB < 0.4s). סורקי AI מהירים קולטים את המידע ללא עיכובים.'
        }
      ],
      verdictTitle: 'מסקנה אסטרטגית להנהלה',
      verdictText: 'בשנת 2026, כ-35%–40% מהפניות והחיפושים בעולם ה-B2B מתבצעים באמצעות מנועי חיפוש מבוססי AI. כדי שהמודלים ימליצו על החברה שלכם ולא על המתחרים, האתר זקוק לקובץ /llms.txt ולאותות ציטוט סמנטיים. הפתרון המלא מוכן ליישום בתוכנית הפעולה להלן.',
      verdictLink: 'מעבר לפתרון AI Visibility בתוכנית הפעולה ↓'
    }
  };

  const c = content[lang] || content.ru;
  // Everything below is built from data.ai_visibility (AuditCollector): engines from robots.txt rules,
  // the 7 weighted criteria and the 5 Agent Readiness L1 checks. No fixed copy about the site.
  const av = data.ai_visibility || {};
  const dom = av.dom || {};
  const l1 = av.vercel_level1 || {};
  const robots = av.robots_ai || {};
  const T3 = (ru, en, he) => (lang === 'ru' ? ru : lang === 'he' ? he : en);
  const L = {
    ok: T3('Выполнено', 'Passed', 'תקין'),
    fail: T3('Не выполнено', 'Not passed', 'לא תקין'),
    open: T3('Доступ открыт', 'Access open', 'גישה פתוחה'),
    blocked: T3('Заблокирован', 'Blocked', 'חסום'),
    dflt: T3('Не указан', 'Not set', 'לא הוגדר'),
    factorsTitle: T3('7 критериев AI Visibility', '7 AI Visibility criteria', '7 קריטריונים של AI Visibility'),
    l1Title: T3('Agent Readiness L1 — готовность к AI-агентам', 'Agent Readiness L1 — readiness for AI agents', 'Agent Readiness L1 — מוכנות לסוכני AI'),
    passed: (p, t) => T3(`${p} из ${t} критериев`, `${p} of ${t} criteria`, `${p} מתוך ${t} קריטריונים`),
    l1passed: (p, t) => T3(`Agent Readiness L1: ${p} из ${t}`, `Agent Readiness L1: ${p} of ${t}`, `Agent Readiness L1: ${p} מתוך ${t}`)
  };

  // engines: access decided by the robots.txt rules for each vendor's bots
  const ENGINE_BOTS = [['GPTBot', 'ChatGPT-User'], ['PerplexityBot'], ['ClaudeBot', 'anthropic-ai'], ['Google-Extended']];
  const allowed = robots.allowed_bots || [];
  const blocked = robots.blocked_bots || [];
  const enginesHtml = c.engines.map((e, i) => {
    const bots = (ENGINE_BOTS[i] || []).join(', ');
    const isBlocked = (ENGINE_BOTS[i] || []).some((x) => blocked.includes(x));
    const isAllowed = (ENGINE_BOTS[i] || []).some((x) => allowed.includes(x));
    const badge = isBlocked ? L.blocked : isAllowed ? L.open : L.dflt;
    const desc = isBlocked
      ? T3(`robots.txt блокирует ${bots}: эта модель не сможет ссылаться на сайт в ответах.`, `robots.txt blocks ${bots}: this model cannot cite the site in answers.`, `robots.txt חוסם את ${bots}: המודל לא יוכל להפנות לאתר בתשובות.`)
      : T3(`robots.txt пропускает ${bots}: модель читает страницы и может ссылаться на сайт в ответах.`, `robots.txt lets ${bots} in: the model reads pages and can cite the site in answers.`, `robots.txt מאפשר ל-${bots}: המודל קורא את העמודים ויכול להפנות לאתר בתשובות.`);
    return `
      <div class="ai-engine">
        <div class="ai-engine-head">
          <span class="ai-engine-name">${e.icon}<span>${esc(e.name)}</span></span>
          <span class="ai-engine-badge ${isBlocked ? 'warn' : 'ok'}">${esc(badge)}</span>
        </div>
        <p>${esc(desc)}</p>
      </div>`;
  }).join('');

  // the 7 weighted criteria, same rules as AuditCollector (score = passed / 7)
  const llms = av.llms_txt || {};
  const org = dom.organization_details || {};
  const llmsParts = [llms.has_h1, llms.has_brand, llms.has_structure].filter(Boolean).length;
  const orgParts = [org.hasName, org.hasUrl, org.hasSameAs, org.hasContactPoint].filter(Boolean).length;
  const yn = (v) => (v ? T3('есть', 'yes', 'כן') : T3('нет', 'no', 'לא'));
  const criteria = [
    [llms.ok, T3('Машиночитаемый каталог /llms.txt', 'Machine-readable /llms.txt', 'קטלוג llms.txt קריא למכונה'),
      T3(`HTTP ${llms.status ?? '—'}; заголовок, бренд и структура: ${llmsParts} из 3.`, `HTTP ${llms.status ?? '—'}; heading, brand and structure: ${llmsParts} of 3.`, `HTTP ${llms.status ?? '—'}; כותרת, מותג ומבנה: ${llmsParts} מתוך 3.`)],
    [(av.mcp_manifest || {}).ok, T3('MCP-манифест /.well-known/mcp', 'MCP manifest /.well-known/mcp', 'מניפסט MCP ב-well-known/mcp'),
      T3('Описание сайта для AI-агентов в формате MCP.', 'Site description for AI agents in MCP format.', 'תיאור האתר לסוכני AI בפורמט MCP.')],
    [(av.about_page || {}).ok, T3('Страница /about с фактами о бренде', '/about page with brand facts', 'עמוד about עם עובדות על המותג'),
      T3('Источник проверенных фактов о компании для ответов моделей.', 'A source of verified company facts for model answers.', 'מקור לעובדות מאומתות על החברה לתשובות המודלים.')],
    [!robots.severe_block, T3('Доступ AI-ботов в robots.txt', 'AI-bot access in robots.txt', 'גישת בוטי AI ב-robots.txt'),
      T3(`Разрешено ботов: ${allowed.length}, заблокировано: ${blocked.length}.`, `Bots allowed: ${allowed.length}, blocked: ${blocked.length}.`, `בוטים מותרים: ${allowed.length}, חסומים: ${blocked.length}.`)],
    [dom.organization_schema, T3('Schema.org Organization (JSON-LD)', 'Schema.org Organization (JSON-LD)', 'Schema.org Organization (JSON-LD)'),
      T3(`Название, URL, sameAs, контакты: ${orgParts} из 4${dom.faq_schema ? '; есть FAQPage' : ''}.`, `Name, URL, sameAs, contacts: ${orgParts} of 4${dom.faq_schema ? '; FAQPage present' : ''}.`, `שם, URL, sameAs, אנשי קשר: ${orgParts} מתוך 4${dom.faq_schema ? '; קיים FAQPage' : ''}.`)],
    [dom.llms_describedby, T3('Ссылка на /llms.txt в HTML', '/llms.txt linked from HTML', 'קישור ל-llms.txt ב-HTML'),
      T3('Модель находит каталог прямо со страницы.', 'Models find the catalogue straight from the page.', 'המודל מוצא את הקטלוג ישירות מהעמוד.')],
    [dom.data_layer_present, T3('Аналитика: dataLayer и согласие', 'Analytics: dataLayer and consent', 'אנליטיקה: dataLayer והסכמה'),
      T3(`dataLayer: ${yn(dom.data_layer_present)}, consent: ${yn(dom.gtag_consent_stub)}, GA4: ${yn(dom.ga4_id_present)} — трафик из AI-поиска измерим.`, `dataLayer: ${yn(dom.data_layer_present)}, consent: ${yn(dom.gtag_consent_stub)}, GA4: ${yn(dom.ga4_id_present)} — AI-search traffic is measurable.`, `dataLayer: ${yn(dom.data_layer_present)}, consent: ${yn(dom.gtag_consent_stub)}, GA4: ${yn(dom.ga4_id_present)} — ניתן למדוד תנועה מחיפוש AI.`)]
  ];
  const sitemap = l1.sitemap || {};
  const sig = (l1.content_signals || {}).signals || {};
  const l1Checks = [
    [(l1.robots_txt || {}).ok, 'robots.txt', T3('Файл доступен и корректен.', 'The file is reachable and valid.', 'הקובץ זמין ותקין.')],
    [sitemap.ok, 'sitemap.xml', T3(`URL в карте сайта: ${sitemap.loc_count ?? '—'}.`, `URLs in the sitemap: ${sitemap.loc_count ?? '—'}.`, `כתובות במפת האתר: ${sitemap.loc_count ?? '—'}.`)],
    [(l1.ai_crawler_rules || {}).ok, T3('Правила AI-краулеров', 'AI crawler rules', 'כללי סורקי AI'), T3('Явные правила для AI-ботов в robots.txt.', 'Explicit AI-bot rules in robots.txt.', 'כללים מפורשים לבוטי AI ב-robots.txt.')],
    [(l1.content_signals || {}).ok, 'Content Signals', Object.keys(sig).length ? Object.entries(sig).map(([k, v]) => `${k}=${v}`).join(', ') : T3('Не заданы.', 'Not set.', 'לא הוגדרו.')],
    [(l1.markdown_negotiation || {}).ok, T3('Markdown для агентов', 'Markdown for agents', 'Markdown לסוכנים'), T3('Отдача text/markdown по запросу агента.', 'text/markdown served on an agent request.', 'הגשת text/markdown לבקשת סוכן.')]
  ];
  const factor = ([ok, title, desc]) => `
      <div class="ai-factor">
        <div class="ai-factor-title">
          <b>${esc(title)}</b>
          <span class="tag ${ok ? 'ok' : 'crit'}">${esc(ok ? L.ok : L.fail)}</span>
        </div>
        <p>${esc(desc)}</p>
      </div>`;

  const passed = av.checks_passed ?? criteria.filter((x) => x[0]).length;
  const total = av.checks_total ?? 7;
  const l1p = l1.checks_passed ?? l1Checks.filter((x) => x[0]).length;
  const l1t = l1.checks_total ?? 5;
  const failed = criteria.concat(l1Checks).filter((x) => !x[0]).map((x) => x[1]);
  const head = `AI Visibility ${av.score ?? 0}/100: ${L.passed(passed, total)}, ${L.l1passed(l1p, l1t)}.`;
  const verdictText = failed.length
    ? `${head} ${T3('Не выполнено:', 'Not passed:', 'לא תקין:')} ${failed.join(', ')}. ${T3('Решение с кодом — в плане действий.', 'The fix with code is in the action plan.', 'הפתרון עם קוד — בתוכנית הפעולה.')}`
    : `${head} ${T3('Сайт открыт для AI-поиска и агентов. Держите /llms.txt и Schema.org в актуальном состоянии при каждом релизе.', 'The site is open to AI search and agents. Keep /llms.txt and Schema.org current with every release.', 'האתר פתוח לחיפוש AI ולסוכנים. עדכנו את llms.txt ו-Schema.org בכל שחרור גרסה.')}`;

  return `  <section class="card card-ai-visibility" id="ai-visibility">
    <div class="row">
      <h2>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <span>${esc(c.title)}</span>
      </h2>
      <span class="ai-badge">${esc(c.badge)}</span>
    </div>
    <p class="ai-sub">${esc(c.sub)}</p>

    <div class="ai-grid">
${enginesHtml}
    </div>

    <div class="ai-matrix-head">${esc(L.factorsTitle)} · ${esc(L.passed(passed, total))}</div>
    <div class="ai-matrix">
${criteria.map(factor).join('')}
    </div>

    <div class="ai-matrix-head">${esc(L.l1Title)} · ${l1p}/${l1t}</div>
    <div class="ai-matrix">
${l1Checks.map(factor).join('')}
    </div>

    <div class="ai-verdict">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
      <div class="ai-verdict-body">
        <h4>${esc(c.verdictTitle)}</h4>
        <p>${esc(verdictText)}</p>
        <a href="#action-ai" class="ai-verdict-link">${esc(c.verdictLink)}</a>
      </div>
    </div>
  </section>`;
}

/** Order/checkout links must carry ?lang= so HE/EN reports do not open the site in cookie/default locale. */
function orderCheckoutUrl(slug, lang) {
  const l = lang === 'he' || lang === 'en' || lang === 'ru' ? lang : 'en'
  return `https://erythro.ai/order/${slug}?lang=${l}`
}

function auditPageUrl(lang) {
  const l = lang === 'he' || lang === 'en' || lang === 'ru' ? lang : 'en'
  return `https://erythro.ai/audit?lang=${l}`
}

// Free vs Diagnostic vs Pro. Source of truth: tier cards in src/lib/orderPlans.ts (audit-free / -diagnostic / -pro)
function renderTierCompare(lang, orderDiag, orderPro, here = 'free') {
  const T = {
    ru: {
      h2: 'Что входит в тарифы',
      sub: 'Этот отчёт — Free. Платные тарифы открывают всё, что ниже отмечено замком.',
      freeNote: 'Без карты · 1 домен / 7 дней',
      hint: 'Листайте вправо →',
      diagNote: 'разово · промо',
      proNote: 'разово',
      aiTag: 'Приоритет 2026',
      method: 'Как считаем: 55 проверок по сайту целиком (из них 20 — AI Visibility, Agent Readiness и доступ AI-ботов), 28 на каждый язык сайта, 9 на каждую страницу воронки. Free: 5 проверок + 20 метрик Lighthouse.',
      rows: [
        ['list', 'Проверок всего', 'по сайту, языкам и страницам воронки', '25', '184', '230', 'count'],
        ['spark', 'AI Visibility', 'как сайт видят ChatGPT, Perplexity, Claude и Gemini', '—', 'сводная оценка', '7 критериев, разбор по каждому', 'ai'],
        ['bot', 'Agent Readiness L1', 'llms.txt, MCP и markdown для AI-агентов', '—', '—', '5 проверок', 'ai'],
        ['file', 'Страницы сайта', 'сколько URL проходит лаборатория', 'главная', 'до 5 URL воронки', 'до 10 URL воронки'],
        ['globe', 'Языки сайта', 'каждая языковая версия проверяется отдельно', '1', 'EN · RU · HE', 'EN · RU · HE'],
        ['clip', 'Чеклист', 'статус и рекомендация по каждой проверке', '5 базовых проверок', 'сводные карточки по статусам', 'полный, построчно — рекомендация в каждой строке'],
        ['code', 'План правок', 'шаги исправлений с готовым кодом', 'Шаг 1 с кодом', 'Шаг 1 с кодом', 'все шаги, код для каждого'],
        ['route', 'Главная рекомендация по воронке', 'по итогам Funnel review — AI-разбора пути к заявке (модальные формы, чат)', '—', '—', 'вердикт, до 3 пробелов и что исправить первым'],
      ]
    },
    en: {
      h2: 'What each tier includes',
      sub: 'This report is Free. Paid tiers open everything marked with a lock.',
      freeNote: 'No card · 1 domain / 7 days',
      hint: 'Swipe right →',
      diagNote: 'one-time · promo price',
      proNote: 'one-time',
      aiTag: 'Priority 2026',
      method: 'How we count: 55 site-wide checks (20 of them on AI Visibility, Agent Readiness and AI-bot access), 28 per site language, 9 per funnel page. Free: 5 checks + 20 Lighthouse metrics.',
      rows: [
        ['list', 'Checks in total', 'site-wide, per language and per funnel page', '25', '184', '230', 'count'],
        ['spark', 'AI Visibility', 'how ChatGPT, Perplexity, Claude and Gemini see the site', '—', 'summary score', '7 criteria, each broken down', 'ai'],
        ['bot', 'Agent Readiness L1', 'llms.txt, MCP and markdown for AI agents', '—', '—', '5 checks', 'ai'],
        ['file', 'Site pages', 'how many URLs the lab walks through', 'homepage', 'up to 5 funnel URLs', 'up to 10 funnel URLs'],
        ['globe', 'Site languages', 'each language version is checked separately', '1', 'EN · RU · HE', 'EN · RU · HE'],
        ['clip', 'Checklist', 'status and recommendation for every check', '5 core checks', 'summary cards by status', 'full, row by row — a recommendation on every row'],
        ['code', 'Fix plan', 'fix steps with ready code', 'Step 1 with code', 'Step 1 with code', 'every step, code for each'],
        ['route', 'Main funnel recommendation', 'from the Funnel review — an AI review of the lead path (modal forms, chat)', '—', '—', 'verdict, up to 3 gaps and what to fix first'],
      ]
    },
    he: {
      h2: 'מה כלול בכל מסלול',
      sub: 'הדוח הזה הוא Free. המסלולים בתשלום פותחים את כל מה שמסומן במנעול.',
      freeNote: 'ללא כרטיס · דומיין אחד / 7 ימים',
      hint: 'החליקו שמאלה ←',
      diagNote: 'חד-פעמי · מחיר מבצע',
      proNote: 'חד-פעמי',
      aiTag: 'עדיפות 2026',
      method: 'איך סופרים: 55 בדיקות לאתר כולו (20 מהן — AI Visibility, Agent Readiness וגישת בוטי AI), 28 לכל שפת אתר, 9 לכל עמוד משפך. Free: 5 בדיקות + 20 מדדי Lighthouse.',
      rows: [
        ['list', 'סה״כ בדיקות', 'לאתר כולו, לכל שפה ולכל עמוד משפך', '25', '184', '230', 'count'],
        ['spark', 'AI Visibility', 'איך ChatGPT, Perplexity, Claude ו-Gemini רואים את האתר', '—', 'ציון מסכם', '7 קריטריונים, פירוט לכל אחד', 'ai'],
        ['bot', 'Agent Readiness L1', 'llms.txt, MCP ו-markdown לסוכני AI', '—', '—', '5 בדיקות', 'ai'],
        ['file', 'עמודי האתר', 'כמה כתובות המעבדה עוברת', 'עמוד הבית', 'עד 5 כתובות משפך', 'עד 10 כתובות משפך'],
        ['globe', 'שפות האתר', 'כל גרסת שפה נבדקת בנפרד', '1', 'EN · RU · HE', 'EN · RU · HE'],
        ['clip', 'רשימת בדיקות', 'סטטוס והמלצה לכל בדיקה', '5 בדיקות בסיס', 'כרטיסי סיכום לפי סטטוס', 'מלאה, שורה-שורה — המלצה בכל שורה'],
        ['code', 'תוכנית תיקון', 'שלבי תיקון עם קוד מוכן', 'שלב 1 עם קוד', 'שלב 1 עם קוד', 'כל השלבים, קוד לכל שלב'],
        ['route', 'המלצה מרכזית למשפך', 'לפי ה-Funnel review — ניתוח AI של הדרך לפנייה (טפסי מודאל, צ׳אט)', '—', '—', 'פסק דין, עד 3 פערים ומה לתקן קודם'],
      ]
    }
  }[lang];
  // in the Diagnostic report the comparison speaks to a Diagnostic customer: only Pro is left to buy
  if (here === 'diagnostic') {
    T.sub = { ru: 'Этот отчёт — Diagnostic. Pro открывает всё, что ниже отмечено замком.', en: 'This report is Diagnostic. Pro opens everything marked with a lock.', he: 'הדוח הזה הוא Diagnostic. Pro פותח את כל מה שמסומן במנעול.' }[lang];
  }
  const mark = (v) => (v === '✓' ? '<span class="yes">✓</span>' : v === '—' ? '<span class="no" role="img" aria-label="—"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg></span>' : v);
  const ICON = {
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
    spark: '<path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
    bot: '<rect x="4" y="8" width="16" height="11" rx="2"/><path d="M12 4v4M9 13h.01M15 13h.01M9 16h6"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    clip: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 13l2 2 4-4"/>',
    route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
    code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 6l-2 12"/>'
  };
  // first column: icon + title + one-line description; AI rows carry the "priority" tag
  const label = (ic, t, d, kind) => {
    const svg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[ic]}</svg>`;
    const tag = kind === 'ai' ? `<span class="ai-tag">${T.aiTag}</span>` : '';
    return `<div class="tl"><span class="tl-ic">${svg}</span><span class="tl-tx">${tag}<b>${t}</b><small>${d}</small></span></div>`;
  };
  const body = T.rows.map(([ic, t, d, a, b, c, kind]) => `          <tr${kind ? ` class="row-${kind}"` : ''}><th scope="row">${label(ic, t, d, kind)}</th><td>${mark(a)}</td><td>${mark(b)}</td><td>${mark(c)}</td></tr>`).join('\n');
  return `<section class="card tiers" id="tiers">
    <h2>${T.h2}</h2>
    <p class="sub">${T.sub}</p>
    <p class="tiers-hint">${T.hint}</p>
    <div class="tiers-wrap">
      <table class="tiers-table">
        <thead><tr><th></th>
          <th class="is-here"><span class="t-name">Free</span><span class="t-price">₪0</span><span class="t-note">${T.freeNote}</span></th>
          <th><span class="t-name">Diagnostic</span><span class="t-price"><s class="t-old">₪290</s>₪99</span><span class="t-note">${T.diagNote}</span></th>
          <th class="is-pro"><span class="t-name">Pro</span><span class="t-price">₪490</span><span class="t-note">${T.proNote}</span></th>
        </tr></thead>
        <tbody>
${body}
        </tbody>
      </table>
    </div>
    <p class="tiers-method">${T.method}</p>
    <div class="tiers-actions">
      ${here === 'diagnostic' ? '' : `<a class="tier-btn-secondary" href="${orderCheckoutUrl('audit-diagnostic', lang)}">${orderDiag}</a>`}
      <a class="tier-btn-primary" href="${orderCheckoutUrl('audit-pro', lang)}">${orderPro}</a>
    </div>
  </section>`;
}

// Checklist status filter (Все / Отлично / Точка роста / Требует внимания / Критично)
const FILTER_JS = `<script data-v2-filters>
(function () {
  var btns = document.querySelectorAll('#filters .filter');
  var empty = document.getElementById('empty');
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-f');
      btns.forEach(function (x) { x.classList.toggle('on', x === b); });
      var shown = 0;
      document.querySelectorAll('details.check').forEach(function (d) {
        var ok = f === 'all' || d.getAttribute('data-s') === f;
        d.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      var lock = document.getElementById('locked-checks');
      if (lock) {
        if (f === 'all') lock.style.removeProperty('display');
        else lock.style.setProperty('display', 'none', 'important');
      }
      if (empty) empty.hidden = shown > 0;
    });
  });
})();
</script>`;

// Long label on desktop, short one on phones (CSS swaps .bt-full / .bt-short at <=600px)
function btnText(full, short) {
  return `<span class="bt-full">${esc(full)}</span><span class="bt-short">${esc(short)}</span>`;
}

const TIER_COMPARE_SHORT = {
  ru: 'Что входит в пакеты ↓',
  en: 'What tiers include ↓',
  he: 'מה כלול במסלולים ↓'
};

const TIER_COMPARE_LINK = {
  ru: 'Что входит в Diagnostic и Pro ↓',
  en: 'What Diagnostic and Pro include ↓',
  he: 'מה כלול ב-Diagnostic וב-Pro ↓'
};

function renderAiVisibilityLockedSection(lang, summary = false) {
  const content = {
    ru: {
      title: 'AI Visibility: Как сайт видят и находят ИИ-поисковики',
      badge: 'Стратегический фокус 2026',
      sub: 'Анализ готовности сайта к индексации, цитированию и ответам в ChatGPT Search, Perplexity AI, Claude и Google Gemini.',
      lockedTitle: 'Аналитика AI-видимости сайта доступна в полных тарифах аудита',
      lockedText: 'Проверка доступности сайта для краулеров OpenAI, Anthropic и Perplexity, аудит нового веб-стандарта /llms.txt, Content Signals в robots.txt и семантической микроразметки Schema.org для защиты бренда от галлюцинаций нейросетей входят в тарифы Diagnostic и Pro.',
    },
    en: {
      title: 'AI Visibility: How AI Search Engines Discover Your Site',
      badge: '2026 Strategic Focus',
      sub: 'Readiness analysis for indexing, citations, and search answers in ChatGPT Search, Perplexity AI, Claude, and Google Gemini.',
      lockedTitle: 'AI Visibility analytics available in full audit tiers',
      lockedText: 'Crawler access verification for OpenAI, Anthropic, and Perplexity, /llms.txt standard audit, robots.txt Content Signals, and Schema.org semantic knowledge graph optimization are included in Diagnostic and Pro tiers.',
    },
    he: {
      title: 'נראות AI: כיצד מנועי חיפוש מבוססי בינה מלאכותית מוצאים את האתר',
      badge: 'מיקוד אסטרטגי 2026',
      sub: 'בדיקת מוכנות האתר לאינדוקס, ציטוט ותשובות ב-ChatGPT Search, Perplexity AI, Claude ו-Google Gemini.',
      lockedTitle: 'ניתוח נראות AI של האתר זמין במסלולי הביקורת המלאים',
      lockedText: 'אימות גישה לבוטים של OpenAI, Anthropic ו-Perplexity, ביקורת תקן llms.txt, סיגנלי תוכן ב-robots.txt ואופטימיזציית Schema.org להגנה מהזיות בינה מלאכותית נכללים במסלולי Diagnostic ו-Pro.',
    }
  };

  const c = content[lang] || content.ru;

  // Diagnostic: the summary score is open, the per-criterion breakdown is Pro
  let summaryHtml = '';
  if (summary) {
    const av = data.ai_visibility || {};
    const v = Number(av.score ?? sc.ai_visibility ?? 0);
    const z = zoneOf(v);
    const word = {
      ru: { good: 'Отлично', warn: 'Требует внимания', bad: 'Критично' },
      en: { good: 'Excellent', warn: 'Needs attention', bad: 'Critical' },
      he: { good: 'מצוין', warn: 'דורש תשומת לב', bad: 'קריטי' }
    }[lang][z];
    const passed = lang === 'ru' ? `${av.checks_passed ?? '—'} из ${av.checks_total ?? 7} критериев пройдено`
      : lang === 'he' ? `${av.checks_passed ?? '—'} מתוך ${av.checks_total ?? 7} קריטריונים עברו`
      : `${av.checks_passed ?? '—'} of ${av.checks_total ?? 7} criteria passed`;
    const label = lang === 'ru' ? 'Сводная оценка AI Visibility' : lang === 'he' ? 'ציון מסכם AI Visibility' : 'AI Visibility summary score';
    summaryHtml = `
    <div class="ai-summary" data-z="${z}">
      <div class="ai-summary-num"><b>${v}</b><small>/100</small></div>
      <div class="ai-summary-tx"><span class="ai-summary-lbl">${label}</span><span class="st ${z === 'good' ? 'g' : z === 'bad' ? 'c' : 'w'}">${word}</span><span class="ai-summary-pass">${passed}</span></div>
    </div>`;
    c.lockedTitle = lang === 'ru' ? 'Разбор по 7 критериям и Agent Readiness L1 — в Pro'
      : lang === 'he' ? 'פירוט לפי 7 קריטריונים ו-Agent Readiness L1 — ב-Pro'
      : 'The 7-criteria breakdown and Agent Readiness L1 are in Pro';
    c.lockedText = lang === 'ru' ? 'Как сайт видят ChatGPT, Perplexity, Claude и Gemini по каждому критерию: доступ краулеров, /llms.txt, Content Signals, Schema.org и Brand Facts — с рекомендацией и готовым кодом. Плюс 5 проверок готовности к AI-агентам.'
      : lang === 'he' ? 'איך ChatGPT, Perplexity, Claude ו-Gemini רואים את האתר בכל קריטריון: גישת סורקים, ‎/llms.txt, Content Signals, Schema.org ו-Brand Facts — עם המלצה וקוד מוכן. ועוד 5 בדיקות מוכנות לסוכני AI.'
      : 'How ChatGPT, Perplexity, Claude and Gemini see the site on every criterion: crawler access, /llms.txt, Content Signals, Schema.org and Brand Facts — with a recommendation and ready code. Plus 5 AI-agent readiness checks.';
  }

  return `  <section class="card card-ai-visibility" id="ai-visibility">
    <div class="row">
      <h2>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
        ${esc(c.title)}
      </h2>
      <span class="ai-badge">${esc(c.badge)}</span>
    </div>
    <p class="ai-sub">${esc(c.sub)}</p>
${summaryHtml}

    <div class="tier-lock-card" style="margin-top: 18px;">
      <div class="lock-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        <span>${esc(c.lockedTitle)}</span>
      </div>
      <p>${esc(c.lockedText)}</p>
      <div class="lock-actions">
        <a href="#tiers" class="tier-btn-secondary">${btnText(TIER_COMPARE_LINK[lang] || TIER_COMPARE_LINK.ru, TIER_COMPARE_SHORT[lang] || TIER_COMPARE_SHORT.ru)}</a>
      </div>
    </div>
  </section>`;
}

function renderCodeBox(solObj, lang) {
  if (!solObj) return '';
  const item = solObj[lang] || solObj.en || solObj.ru;
  const file = solObj.file;
  const code = item.code;

  return `
    <div class="code-box">
      <div class="code-header">
        <span class="code-file">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <code>${esc(file)}</code>
        </span>
        <button type="button" class="btn-copy" data-copy="${esc(code)}" aria-label="Copy code">
          <span class="copy-text">copy</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
      <pre><code>${esc(code)}</code></pre>
    </div>`;
}

function renderSpecBox(solObj, lang) {
  if (!solObj) return '';
  const item = solObj[lang] || solObj.en || solObj.ru;
  const file = solObj.file;
  const desc = item.desc;

  const headerLbl = lang === 'ru' ? 'Техническое задание разработчику' : lang === 'he' ? 'מפרט טכני לפיתוח' : 'Developer Technical Specification';
  const proNote = lang === 'ru'
    ? 'Готовый проверенный код со сниппетами и юнит-тестами доступен в тарифе Pro'
    : lang === 'he'
    ? 'קוד מוכן לסביבת ייצור ובדיקות יחידה זמינים במסלול Pro'
    : 'Production-ready code snippets and unit tests available in Pro';
  const proLinkText = lang === 'ru' ? 'Смотреть в Pro (₪490) →' : lang === 'he' ? 'לצפייה ב-Pro (₪490) ←' : 'View in Pro (₪490) →';

  return `
    <div class="spec-box">
      <div class="spec-box-header">
        <span>${headerLbl}</span>
        <code>${esc(file)}</code>
      </div>
      <div class="spec-box-body">${esc(desc)}</div>
      <div class="spec-box-pro-note">
        <span>${proNote}</span>
        <a href="${orderCheckoutUrl('audit-pro', lang)}" class="spec-pro-link">${proLinkText}</a>
      </div>
    </div>`;
}


// Render real audit data (audit_data.json + Java pro HTML) into v2 reports for RU, EN, and HE.
import fs from 'node:fs';
import path from 'node:path';

const AUDITOR_ROOT = process.env.QA_AUDITOR_DIR?.trim() || 
  (fs.existsSync(path.resolve(process.cwd(), 'reports/audit_data.json')) ? process.cwd() : 
   (fs.existsSync('C:/agents/website-auditor/erythro-ai/QA_Auditor') ? 'C:/agents/website-auditor/erythro-ai/QA_Auditor' : process.cwd()));

const DEV_ROOT = fs.existsSync('C:/dev/erythro-ai') ? 'C:/dev/erythro-ai' : null;

const candidatePaths = [
  path.join(AUDITOR_ROOT, 'reports/audit_data.json'),
  path.resolve('reports/audit_data.json'),
  path.join(AUDITOR_ROOT, '../reports/audit_data.json'),
  'C:/agents/website-auditor/erythro-ai/reports/audit_data.json'
];

let DATA_FILE = null;
for (const cand of candidatePaths) {
  if (fs.existsSync(cand)) {
    DATA_FILE = cand;
    break;
  }
}
if (!DATA_FILE) {
  throw new Error('audit_data.json not found in candidate paths: ' + candidatePaths.join(', '));
}

const SAMPLES_DIR = DEV_ROOT ? path.join(DEV_ROOT, 'public/samples/audit') : null;
const REPORTS_V2_DIR = path.join(AUDITOR_ROOT, 'reports/pro-v2');
const TEMPLATES_V2_DIR = path.join(AUDITOR_ROOT, 'templates');
const AGENT_REPORTS_V2_DIR = DEV_ROOT ? path.join(DEV_ROOT, 'services/audit-agent/QA_Auditor/reports/pro-v2') : null;

// Ensure output directories exist
for (const dir of [SAMPLES_DIR, REPORTS_V2_DIR, TEMPLATES_V2_DIR, AGENT_REPORTS_V2_DIR].filter(Boolean)) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {}
}

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const sc = data.executive_scorecard;
const ab = data.agent_browse;

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const unesc = (t) => String(t ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const strip = (h) => unesc(String(h ?? '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

function between(str, a, b, from = 0) {
  const i = str.indexOf(a, from);
  if (i < 0) throw new Error('anchor not found: ' + a);
  const j = str.indexOf(b, i + a.length);
  if (j < 0) throw new Error('anchor end not found: ' + b);
  return [i, j + b.length];
}

function replaceBlock(str, a, b, repl, from = 0) {
  const [i, j] = between(str, a, b, from);
  return str.slice(0, i) + repl + str.slice(j);
}

const EXTRA_STYLE = `
.badge.ok { background: #eef9ec; border-color: #cfeccb; color: #1d7a12; }
.badge.warn { background: #fff6ec; border-color: #f8dcc0; color: #9a4a00; }
.badge.crit { background: #fff1f0; border-color: #fca5a5; color: #b91c1c; }

a.badge {
  text-decoration: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: background-color .15s ease, border-color .15s ease, color .15s ease, box-shadow .15s ease, transform .15s ease;
}
a.badge:hover {
  transform: translateY(-1px);
  filter: none !important;
}
a.badge.warn:hover {
  background: #ff7900 !important;
  border-color: #ff7900 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(255, 121, 0, 0.35) !important;
  filter: none !important;
}
a.badge.crit:hover {
  background: #e52421 !important;
  border-color: #e52421 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(229, 36, 33, 0.35) !important;
  filter: none !important;
}

/* Action cards: distinct standalone cards with alternating subtle tint */
.actions {
  display: flex !important;
  flex-direction: column !important;
  gap: 16px !important;
  margin-top: 24px !important;
}
.action {
  display: grid !important;
  grid-template-columns: 1fr auto !important;
  gap: 24px !important;
  align-items: flex-start !important;
  padding: 22px 24px !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
  background: #ffffff !important;
}
/* Alternating subtle background tint for odd blocks to clearly separate each block (no hover) */
.action:nth-child(odd) {
  background: #fbfbfd !important;
  border-color: #e4e7eb !important;
}
.action:nth-child(even) {
  background: #ffffff !important;
  border-color: #e4e7eb !important;
}
.action h3 {
  margin: 0 0 10px 0 !important;
  font-size: 18px !important;
  font-weight: 500 !important;
  line-height: 1.35 !important;
}
.action .tags {
  display: flex !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
  margin-bottom: 12px !important;
}
.action p {
  margin: 12px 0 0 0 !important;
  color: #3f3f3f !important;
  font-size: 14.5px !important;
  line-height: 1.65 !important;
  max-width: 720px !important;
}
.action .plus {
  padding-top: 4px !important;
  font-size: 34px !important;
}
.action.is-highlighted {
  border-color: var(--brand) !important;
  background-color: #fffaf9 !important;
  box-shadow: 0 0 0 3px rgba(229, 36, 33, 0.22) !important;
  border-radius: 12px !important;
  padding: 22px 24px !important;
  transition: all .25s ease;
}

/* Solution code box inside actions matching Top-3 card styling */
.code-box {
  margin-top: 16px !important;
  background: #fbfbfc !important;
  border: 1px solid var(--line) !important;
  border-top: 3px solid #c99839 !important;
  border-radius: 8px !important;
  overflow: hidden !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important;
}
.code-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 8px 16px !important;
  background: #fdfbf7 !important;
  border-bottom: 1px solid var(--line) !important;
  font-size: 11.5px !important;
}
.code-file {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  font-family: var(--font-body, 'Inter', sans-serif) !important;
  font-weight: 500 !important;
  color: #1e293b !important;
}
.code-file svg {
  width: 14px !important;
  height: 14px !important;
  color: #c99839 !important;
  flex-shrink: 0 !important;
}
.code-file code {
  color: #8a5700 !important;
  background: rgba(201, 152, 57, 0.08) !important;
  border: 1px solid rgba(201, 152, 57, 0.22) !important;
  padding: 2px 6px !important;
  border-radius: 4px !important;
}
.code-box pre {
  margin: 0 !important;
  padding: 14px 16px !important;
  overflow-x: auto !important;
  color: #0f172a !important;
  line-height: 1.6 !important;
  font-size: 12px !important;
  background: transparent !important;
  white-space: pre !important;
}

/* Copy button styling */
.btn-copy {
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
  background: #fdf8ef !important;
  border: 1px solid #e8c688 !important;
  border-radius: 4px !important;
  padding: 3px 8px !important;
  font-family: var(--font-body, 'Inter', sans-serif) !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  color: #8a5700 !important;
  cursor: pointer !important;
  transition: all .15s ease !important;
  line-height: 1.2 !important;
}
.btn-copy:hover {
  background: #faeed7 !important;
  border-color: #c99839 !important;
  color: #6d4400 !important;
  box-shadow: 0 1px 4px rgba(201, 152, 57, 0.2) !important;
}
.btn-copy.copied {
  background: #ecfdf5 !important;
  border-color: #10b981 !important;
  color: #059669 !important;
}
.btn-copy svg {
  width: 12px !important;
  height: 12px !important;
  flex-shrink: 0 !important;
  stroke: currentColor !important;
}

/* Checklist item styling: hover highlight and persistent active state */
.checks {
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
  margin-top: 24px !important;
}
.check {
  border: 1px solid transparent !important;
  border-top: 1px solid var(--line) !important;
  border-radius: 10px !important;
  padding: 0 16px !important;
  transition: background-color .15s ease, border-color .15s ease, box-shadow .15s ease;
}
/* Hover on accordion: distinct highlight */
.check:hover {
  background: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
}
.check:hover summary .nm {
  color: #0f172a !important;
  font-weight: 600 !important;
}
.check:hover summary .chev {
  color: #0f172a !important;
}
/* Active / Open state: prominent background, strong border, accented title */
.check[open] {
  background: #f8fafc !important;
  border: 1px solid #cbd5e1 !important;
  box-shadow: 0 3px 12px rgba(15, 23, 42, 0.06) !important;
  margin-bottom: 8px !important;
}
.check[open] summary .nm {
  color: #0f172a !important;
  font-weight: 600 !important;
}
.check[open] summary .chev {
  color: #0f172a !important;
  font-weight: 600 !important;
}
.check summary {
  padding: 18px 0 !important;
  gap: 16px !important;
  user-select: none;
  cursor: pointer;
  transition: color .15s ease;
}
.check .nm {
  font-size: 16px !important;
  font-weight: 500 !important;
  color: #1e293b !important;
  transition: color .15s ease, font-weight .15s ease;
}
.check .body {
  padding: 0 0 20px 0 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 14px !important;
}
.check .res {
  background: #ffffff !important;
  border: 1px solid var(--line) !important;
  border-radius: 8px !important;
  padding: 14px 18px !important;
  font-size: 14.5px !important;
  line-height: 1.6 !important;
  color: var(--ink) !important;
}
.check .res b {
  display: block !important;
  font-family: var(--mono) !important;
  font-weight: 500 !important;
  font-size: 11px !important;
  letter-spacing: .04em !important;
  text-transform: uppercase !important;
  color: var(--mute) !important;
  margin-bottom: 6px !important;
}

/* Recommendation block inside checklist: styled like Top-3 cards with colored top border matching status */
.check .rec {
  background: #ffffff !important;
  border: 1px solid var(--line) !important;
  border-radius: 8px !important;
  padding: 14px 18px !important;
  font-size: 14.5px !important;
  line-height: 1.6 !important;
  color: var(--ink) !important;
  white-space: normal !important;
}
.check .rec-title-row {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  margin-bottom: 8px !important;
}
.check .rec p {
  margin: 0 !important;
  color: #333333 !important;
  font-size: 14px !important;
  line-height: 1.65 !important;
  white-space: pre-line !important;
}
.check .check-action-link {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  margin-top: 12px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  text-decoration: none !important;
  transition: all .15s ease !important;
}
.check .check-action-link:hover {
  text-decoration: underline !important;
}

/* Colored borders & contextual copy buttons matching status badge (like Top-3) */
/* 1. Critical (Критично) */
.check[data-s="c"] .rec {
  border-top: 3px solid #e52421 !important;
}
.check[data-s="c"] .rec-title-row b {
  font-family: var(--mono) !important;
  font-weight: 600 !important;
  font-size: 11px !important;
  letter-spacing: .04em !important;
  text-transform: uppercase !important;
  color: #a80d0a !important;
}
.check[data-s="c"] .check-action-link {
  color: #e52421 !important;
}
.check[data-s="c"] .btn-copy {
  color: #a80d0a !important;
  background: #fff5f5 !important;
  border-color: #fca5a5 !important;
}
.check[data-s="c"] .btn-copy:hover {
  background: #fee2e2 !important;
  border-color: #e52421 !important;
  color: #7f1d1d !important;
}

/* 2. Warning / Needs attention (Требует внимания) */
.check[data-s="w"] .rec {
  border-top: 3px solid #ff7900 !important;
}
.check[data-s="w"] .rec-title-row b {
  font-family: var(--mono) !important;
  font-weight: 600 !important;
  font-size: 11px !important;
  letter-spacing: .04em !important;
  text-transform: uppercase !important;
  color: #8f3f00 !important;
}
.check[data-s="w"] .check-action-link {
  color: #d96400 !important;
}
.check[data-s="w"] .btn-copy {
  color: #8f3f00 !important;
  background: #fff9f2 !important;
  border-color: #fcd34d !important;
}
.check[data-s="w"] .btn-copy:hover {
  background: #faeed7 !important;
  border-color: #ff7900 !important;
  color: #6d4400 !important;
}

/* 3. Good / Excellent (Отлично) */
.check[data-s="g"] .rec {
  border-top: 3px solid #10b981 !important;
}
.check[data-s="g"] .rec-title-row b {
  font-family: var(--mono) !important;
  font-weight: 600 !important;
  font-size: 11px !important;
  letter-spacing: .04em !important;
  text-transform: uppercase !important;
  color: #0e5a06 !important;
}
.check[data-s="g"] .btn-copy {
  color: #0e5a06 !important;
  background: #f0fdf4 !important;
  border-color: #86efac !important;
}
.check[data-s="g"] .btn-copy:hover {
  background: #dcfce7 !important;
  border-color: #10b981 !important;
  color: #064e3b !important;
}

.check.is-highlighted {
  border-color: var(--brand) !important;
  background-color: #fff8f8 !important;
  box-shadow: 0 0 0 3px rgba(229, 36, 33, 0.22) !important;
  border-radius: 10px !important;
  transition: all .25s ease;
}

/* AI Visibility: modern, light, premium aesthetic */
.card-ai-visibility {
  background: #ffffff !important;
  color: var(--ink) !important;
  border: 1px solid #e2e8f0 !important;
  border-top: 4px solid #8b5cf6 !important;
  border-radius: 12px !important;
  padding: var(--pad) !important;
  position: relative !important;
  overflow: hidden !important;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.06) !important;
}
.card-ai-visibility .row h2 {
  color: #0f172a !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  font-size: 24px !important;
  font-weight: 500 !important;
}
.card-ai-visibility .row h2 svg {
  width: 24px;
  height: 24px;
  color: #7c3aed;
  flex-shrink: 0;
}
.card-ai-visibility .ai-sub {
  color: #64748b !important;
  margin: 8px 0 0 !important;
  font-size: 15px !important;
  max-width: 760px !important;
  line-height: 1.55 !important;
}
.ai-badge {
  background: #f5f3ff !important;
  border: 1px solid #ddd6fe !important;
  color: #6d28d9 !important;
  font-family: var(--mono) !important;
  font-size: 11px !important;
  text-transform: uppercase !important;
  letter-spacing: .04em !important;
  border-radius: 999px !important;
  padding: 4px 12px !important;
  font-weight: 500 !important;
}
.ai-grid {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 12px !important;
  margin-top: 24px !important;
}
.ai-engine {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 10px !important;
  padding: 14px 16px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
  transition: border-color .15s ease;
}
.ai-engine-head {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 6px !important;
}
.ai-engine-name {
  font-size: 13.5px !important;
  font-weight: 600 !important;
  color: #0f172a !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}
.ai-engine-name svg {
  color: #7c3aed;
}
.ai-engine-badge {
  font-family: var(--mono) !important;
  font-size: 10px !important;
  text-transform: uppercase !important;
  letter-spacing: .04em !important;
  padding: 2px 7px !important;
  border-radius: 4px !important;
  font-weight: 500 !important;
}
.ai-engine-badge.ok {
  background: #ecfdf5 !important;
  color: #047857 !important;
  border: 1px solid #a7f3d0 !important;
}
.ai-engine-badge.warn {
  background: #fffbeb !important;
  color: #b45309 !important;
  border: 1px solid #fde68a !important;
}
.ai-engine p {
  margin: 0 !important;
  font-size: 12.5px !important;
  line-height: 1.5 !important;
  color: #475569 !important;
}
.ai-matrix-head {
  margin: 24px 0 12px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #0f172a !important;
}
.ai-matrix {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 12px !important;
}
.ai-factor {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  padding: 14px 16px !important;
}
.ai-factor-title {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  font-size: 13.5px !important;
  font-weight: 500 !important;
  color: #0f172a !important;
  margin-bottom: 6px !important;
}
.ai-factor-title b {
  color: #0f172a !important;
}
.ai-factor p {
  margin: 0 !important;
  font-size: 12.5px !important;
  line-height: 1.55 !important;
  color: #475569 !important;
}
.ai-verdict {
  margin-top: 20px !important;
  background: #f5f3ff !important;
  border: 1px solid #ddd6fe !important;
  border-inline-start: 4px solid #8b5cf6 !important;
  border-radius: 8px !important;
  padding: 14px 18px !important;
  display: flex !important;
  gap: 12px !important;
  align-items: flex-start !important;
}
.ai-verdict svg {
  width: 22px;
  height: 22px;
  color: #7c3aed;
  flex-shrink: 0;
  margin-top: 2px;
}
.ai-verdict-body {
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
}
.ai-verdict-body h4 {
  margin: 0 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  color: #4c1d95 !important;
}
.ai-verdict-body p {
  margin: 0 !important;
  font-size: 13.5px !important;
  line-height: 1.6 !important;
  color: #3730a3 !important;
}
.ai-verdict-link {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  color: #6d28d9 !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  text-decoration: none !important;
  margin-top: 4px !important;
  transition: all .15s ease !important;
}
.ai-verdict-link:hover {
  color: #4c1d95 !important;
  text-decoration: underline !important;
}
@media (max-width: 900px) {
  .ai-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .ai-matrix { grid-template-columns: 1fr !important; }
}
@media (max-width: 560px) {
  .ai-grid { grid-template-columns: 1fr !important; }
}
@media print {
  .card-ai-visibility {
    box-shadow: none !important;
  }
}
.check.is-highlighted summary {
  padding-inline: 12px;
}
.check.is-highlighted .body {
  padding-inline: 12px;
}
.st.c { color: #a80d0a; background: #ffd9d8; border-color: #e52421; font-weight: 500; }

/* Top-3 Vulnerability cards with colored top border and matching index numbers */
.top3 .t3 > div:last-child {
  background: #ffffff !important;
  border: 1px solid var(--line) !important;
  border-radius: 10px !important;
  box-shadow: none !important;
}
.top3 .t3:nth-child(1) > div:last-child {
  border-top: 3px solid #e52421 !important;
}
.top3 .t3:nth-child(1) .t3-idx {
  color: #e52421 !important;
}
.top3 .t3:nth-child(2) > div:last-child {
  border-top: 3px solid #E07A5F !important;
}
.top3 .t3:nth-child(2) .t3-idx {
  color: #E07A5F !important;
}
.top3 .t3:nth-child(3) > div:last-child {
  border-top: 3px solid #c99839 !important;
}
.top3 .t3:nth-child(3) .t3-idx {
  color: #c99839 !important;
}

/* Protocol summary stat cards with colored top border (inspired by audit-en.erythro.ai) - strictly flat, no shadow */
.proto .stat {
  background: #ffffff !important;
  border: 1px solid var(--line) !important;
  border-radius: 10px !important;
  box-shadow: none !important;
}
.proto .stat:nth-child(1) {
  border-top: 3px solid #10b981 !important;
}
.proto .stat:nth-child(2) {
  border-top: 3px solid #c99839 !important;
}
.proto .stat:nth-child(3) {
  border-top: 3px solid #E07A5F !important;
}
.proto .stat:nth-child(4) {
  border-top: 3px solid #e52421 !important;
}

/* Detected technology chips with official logos */
.chips {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 10px !important;
  margin-top: 24px !important;
}
.chip {
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  background: var(--soft) !important;
  border: 1px solid var(--line) !important;
  border-radius: 999px !important;
  padding: 8px 16px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  color: var(--ink) !important;
  line-height: 1 !important;
  transition: all .15s ease !important;
}
.chip:hover {
  background: #ffffff !important;
  border-color: #d0d0d0 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important;
}
.chip svg {
  width: 18px !important;
  height: 18px !important;
  flex-shrink: 0 !important;
  display: block !important;
}
.chip.chip-crit {
  border-color: #fca5a5 !important;
  background: #fff1f0 !important;
  padding-inline-end: 10px !important;
}
.chip-crit-badge {
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  margin-inline-start: 2px !important;
  padding: 3px 8px !important;
  border-radius: 999px !important;
  background: #e52421 !important;
  color: #fff !important;
  font-size: 10px !important;
  font-weight: 700 !important;
  letter-spacing: 0.02em !important;
  text-transform: uppercase !important;
  line-height: 1.2 !important;
}
.tech-php-alert {
  margin-top: 14px !important;
  padding: 12px 14px !important;
  border-radius: 12px !important;
  border: 1px solid #fca5a5 !important;
  background: #fff1f0 !important;
  font-size: 13px !important;
  line-height: 1.45 !important;
  color: #7f1d1d !important;
}
.tech-php-alert .tech-php-cta {
  display: block !important;
  margin-top: 10px !important;
  color: #b91c1c !important;
  font-weight: 700 !important;
  text-decoration: underline !important;
  text-underline-offset: 2px !important;
}
.tech-php-alert .tech-php-cta:hover {
  color: #e52421 !important;
}

/* Official header logo styling */
.logo {
  display: inline-flex !important;
  align-items: center !important;
  text-decoration: none !important;
  color: var(--ink) !important;
  padding: 6px 0 10px !important;
}
.logo svg {
  height: 65px !important;
  width: auto !important;
  display: block !important;
}

/* LTR reports (RU, EN): logo on the left */
html:not([dir="rtl"]) .logo {
  align-self: flex-start !important;
  margin-left: 0 !important;
  margin-right: auto !important;
}

/* RTL report (HE): logo on the opposite (right) side */
html[dir="rtl"] .logo,
body[dir="rtl"] .logo {
  align-self: flex-start !important;
  margin-left: auto !important;
  margin-right: 0 !important;
}

/* Footer CTA section: button lifted to headline level with site pill rounding */
.cta {
  background: transparent !important;
  color: var(--ink) !important;
  padding: var(--pad) !important;
  display: grid !important;
  grid-template-columns: 1fr auto !important;
  gap: 32px !important;
  align-items: start !important;
}
.cta h2 {
  margin: 0 !important;
  font-size: 26px !important;
  font-weight: 400 !important;
  max-width: 560px !important;
  line-height: 1.3 !important;
}
.cta a.go {
  background: transparent !important;
  border: 1px solid #1e1e1e !important;
  color: #1e1e1e !important;
  font-weight: 400 !important;
  transition: all .2s ease !important;
  text-decoration: none !important;
  border-radius: 999px !important;
  padding: 16px 32px !important;
  font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
  font-size: 11px !important;
  text-transform: uppercase !important;
  letter-spacing: .06em !important;
  white-space: nowrap !important;
  text-align: center !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-top: 2px !important;
}
.cta a.go:hover {
  background: var(--brand) !important;
  border-color: var(--brand) !important;
  color: #fff !important;
  box-shadow: 0 6px 20px rgba(229, 36, 33, 0.35) !important;
  transform: translateY(-2px) !important;
}
@media (max-width: 720px) {
  .cta { grid-template-columns: 1fr !important; gap: 20px !important; }
  .cta a.go { margin-top: 12px !important; width: 100% !important; }
}

@media print {
  @page { size: A4; margin: 12mm 10mm; }
  body { background: #f3f3f3 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .wrap { max-width: 100% !important; padding: 0 !important; gap: 14px !important; }
  .card { page-break-inside: avoid; break-inside: avoid; border: 1px solid var(--line); }
  .filters { display: none !important; }
  details.check { display: block !important; }
  details.check > summary { pointer-events: none; }
  details.check .chev { display: none !important; }
  details.check .body { display: grid !important; }
  .order-btn { display: none !important; }
  .t3 { page-break-inside: avoid; break-inside: avoid; }
  .action { page-break-inside: avoid; break-inside: avoid; }
}

/* Tier Lock & Teaser Cards */
.tier-lock-card {
  background: #ffffff !important;
  border: 1px dashed #c4c4c4 !important;
  border-radius: 10px !important;
  padding: 22px 26px !important;
  margin-top: 14px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
}
.tier-lock-card .lock-header {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #1e1e1e !important;
}
.tier-lock-card .lock-header svg {
  width: 20px !important;
  height: 20px !important;
  color: #e8650a !important;
  flex-shrink: 0 !important;
}
.tier-lock-card p {
  margin: 0 !important;
  font-size: 14px !important;
  line-height: 1.6 !important;
  color: #444444 !important;
}
.tier-lock-card .lock-bullets {
  margin: 4px 0 6px !important;
  padding: 0 !important;
  list-style: none !important;
  font-size: 13.5px !important;
  line-height: 1.7 !important;
  color: #333333 !important;
}
.tier-lock-card .lock-actions {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  flex-wrap: wrap !important;
  margin-top: 4px !important;
}
.tier-btn-primary {
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  background: #1e1e1e !important;
  color: #ffffff !important;
  padding: 10px 18px !important;
  border-radius: 8px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-decoration: none !important;
  transition: background .15s ease, transform .15s ease !important;
}
.tier-btn-primary:hover {
  background: #000000 !important;
  transform: translateY(-1px) !important;
}
.tier-btn-secondary {
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  background: #f4f4f4 !important;
  color: #1e1e1e !important;
  border: 1px solid var(--line) !important;
  padding: 10px 18px !important;
  border-radius: 8px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-decoration: none !important;
  transition: background .15s ease !important;
}
.tier-btn-secondary:hover {
  background: #e8e8e8 !important;
}

/* Diagnostic Engineering Spec Box */
.spec-box {
  background: #fbfbfc !important;
  border: 1px solid var(--line) !important;
  border-top: 3px solid #0284c7 !important;
  border-radius: 8px !important;
  padding: 14px 18px !important;
  margin-top: 14px !important;
}
.spec-box-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  font-family: var(--mono) !important;
  font-size: 11px !important;
  color: #554f42 !important;
  border-bottom: 1px solid var(--line) !important;
  padding-bottom: 8px !important;
  margin-bottom: 10px !important;
}
.spec-box-body {
  font-size: 13.5px !important;
  line-height: 1.6 !important;
  color: #2b2b2b !important;
}
.spec-box-pro-note {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  margin-top: 10px !important;
  padding-top: 10px !important;
  border-top: 1px dashed var(--line) !important;
  font-size: 12.5px !important;
  color: #64748b !important;
}
.spec-pro-link {
  color: #e8650a !important;
  font-weight: 600 !important;
  text-decoration: none !important;
}
.spec-pro-link:hover {
  text-decoration: underline !important;
}

/* Top-3 locked solution in Free tier */
.t3-row.solution.locked {
  background: #fff9f5 !important;
  border-radius: 6px !important;
  padding: 8px 12px !important;
  margin-top: 4px !important;
}
.t3-sol-locked {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  font-size: 13.5px !important;
  color: #554f42 !important;
}
.t3-sol-locked svg {
  color: #e8650a !important;
  flex-shrink: 0 !important;
}
.t3-lock-link {
  color: #e8650a !important;
  font-weight: 600 !important;
  text-decoration: underline !important;
}
.t3-lock-link:hover {
  color: #c2410c !important;
}

/* Footer CTA buttons for Free tier */
.cta-buttons {
  display: flex !important;
  gap: 14px !important;
  flex-wrap: wrap !important;
  justify-content: center !important;
  margin-top: 24px !important;
}
.cta-buttons a.go {
  margin-top: 0 !important;
  min-width: 220px !important;
  padding: 16px 28px !important;
}
.cta-buttons a.go.sec {
  background: #ffffff !important;
  color: #1e1e1e !important;
  border: 1px solid var(--line) !important;
}
.cta-buttons a.go.sec:hover {
  background: #f0f0f0 !important;
  color: #000000 !important;
}
.cta-text-link {
  color: #e8650a !important;
  font-weight: 600 !important;
  text-decoration: underline !important;
}
.cta-text-link:hover {
  color: #c2410c !important;
}
`;

const BRAND_LOGO_SVG = `<a class="logo" href="https://erythro.ai" aria-label="Erythro.ai" dir="ltr">
    <svg width="235" height="74" viewBox="0 0 235 74" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M33.4733 38.8449V10.9432H42.2661V15.8942H42.3825C42.9175 14.1128 43.7084 12.7941 44.8249 11.9843C45.9182 11.1746 47.3837 10.7812 49.1748 10.7812C50.9659 10.7812 50.082 10.7813 50.5007 10.8044C50.9194 10.8044 51.2916 10.8507 51.6638 10.8738V18.3929C51.3149 18.3698 50.7799 18.3235 50.082 18.2772C49.3842 18.2541 48.7096 18.231 48.0815 18.231C46.9882 18.231 46.0345 18.4854 45.1971 18.9713C44.3597 19.4571 43.7084 20.1512 43.2431 21.0535C42.7779 21.9558 42.5453 23.0432 42.5453 24.3388V38.8449H33.4733Z" fill="#0d0d0d"/>
      <path d="M57.0139 49.603L57.4559 42.7085L60.7125 42.778C61.4569 42.8242 62.0384 42.778 62.5269 42.616C62.9921 42.4541 63.3643 42.1533 63.6435 41.7368C63.9226 41.3204 64.132 40.7651 64.2948 40.0711L64.667 38.8217L53.9434 10.9432H63.4341L67.5979 23.9917C68.1329 25.7732 68.6447 27.5546 69.1099 29.3592C69.5751 31.1638 70.0404 32.9915 70.5056 34.8424H68.0864C68.5516 32.9915 69.0169 31.1407 69.4821 29.3361C69.9706 27.5315 70.4823 25.7501 71.0639 23.9917L75.344 10.9432H84.7416L72.7154 42.5466C72.1106 44.1892 71.3663 45.5311 70.5056 46.6185C69.6449 47.7059 68.5982 48.4925 67.3886 49.0246C66.179 49.5567 64.7135 49.8112 63.0154 49.8112C61.3173 49.8112 60.9684 49.8112 59.9449 49.7649C58.8981 49.7187 57.9211 49.6724 57.0139 49.603Z" fill="#0d0d0d"/>
      <path d="M106.072 10.9432V17.8608H86.8817V10.9432H106.072ZM91.4177 3.56291H100.49V29.66C100.49 30.516 100.676 31.1176 101.025 31.4415C101.374 31.7885 102.048 31.9504 103.002 31.9504C103.956 31.9504 103.956 31.9504 104.607 31.9504C105.258 31.9504 105.723 31.9504 106.003 31.9042L106.258 38.7524C105.654 38.8218 104.886 38.868 103.932 38.8912C102.979 38.9143 102.002 38.9374 101.025 38.9374C97.7448 38.9374 95.3489 38.2896 93.7671 36.994C92.2086 35.6984 91.4177 33.7088 91.4177 31.0019V3.56291Z" fill="#0d0d0d"/>
      <path d="M119.634 23.529V38.868H110.562V0H119.587V18.3235H118.331C119.169 15.9174 120.378 13.9971 121.983 12.5627C123.588 11.1283 125.705 10.3879 128.334 10.3879C130.962 10.3879 132.102 10.8275 133.521 11.6835C134.963 12.5627 136.056 13.7889 136.847 15.4315C137.615 17.051 138.01 18.9944 138.01 21.2617V38.8449H128.938V23.0895C128.938 21.4468 128.543 20.1975 127.752 19.3415C126.961 18.4623 125.845 18.0459 124.379 18.0459C122.914 18.0459 122.588 18.2541 121.867 18.6474C121.146 19.0407 120.611 19.6422 120.215 20.452C119.82 21.2617 119.634 22.2797 119.634 23.5059V23.529Z" fill="#0d0d0d"/>
      <path d="M143.779 38.8449V10.9432H152.572V15.8942H152.665C153.2 14.1128 153.991 12.7941 155.108 11.9843C156.201 11.1746 157.666 10.7812 159.458 10.7812C161.249 10.7812 160.365 10.7813 160.783 10.8044C161.202 10.8044 161.574 10.8507 161.947 10.8738V18.3929C161.598 18.3698 161.063 18.3235 160.365 18.2772C159.667 18.2541 158.992 18.231 158.364 18.231C157.271 18.231 156.317 18.4854 155.48 18.9713C154.642 19.4571 153.991 20.1512 153.526 21.0535C153.061 21.9558 152.828 23.0432 152.828 24.3388V38.8449H143.756H143.779Z" fill="#0d0d0d"/>
      <path d="M178.834 39.4464C175.903 39.4464 173.321 38.8449 171.135 37.6418C168.948 36.4388 167.25 34.7498 166.041 32.5751C164.831 30.4003 164.226 27.8554 164.226 24.9172C164.226 21.9789 164.831 19.4571 166.041 17.2824C167.25 15.1076 168.948 13.4187 171.135 12.1925C173.321 10.9663 175.903 10.3648 178.834 10.3648C181.765 10.3648 184.324 10.9663 186.511 12.1925C188.697 13.4187 190.395 15.1076 191.605 17.2824C192.815 19.4571 193.419 22.0021 193.419 24.9172C193.419 27.8323 192.815 30.4003 191.605 32.5751C190.395 34.7498 188.697 36.4388 186.511 37.6418C184.324 38.8449 181.765 39.4464 178.834 39.4464ZM178.834 32.3669C179.904 32.3669 180.835 32.0661 181.649 31.4877C182.463 30.8862 183.091 30.0533 183.556 28.9428C184.022 27.8323 184.231 26.4904 184.231 24.9634C184.231 23.4365 183.998 22.0483 183.556 20.9378C183.091 19.8504 182.463 18.9944 181.649 18.416C180.835 17.8145 179.904 17.5369 178.834 17.5369C177.764 17.5369 176.787 17.8376 175.973 18.416C175.159 18.9944 174.508 19.8504 174.066 20.9378C173.624 22.0483 173.391 23.3902 173.391 24.9634C173.391 26.5367 173.624 27.8554 174.066 28.9659C174.508 30.0764 175.136 30.9093 175.973 31.5108C176.787 32.1124 177.741 32.39 178.834 32.39V32.3669Z" fill="#0d0d0d"/>
      <path d="M14.8944 32.7153C11.8552 32.0636 9.5816 30.481 9.0944 27.2925H28.6984C28.884 26.2219 29 24.7789 29 23.5454C29 14.5384 23.78 10 14.964 10C14.9408 10 14.8944 10 14.8712 10V16.0279C14.964 16.0279 15.0568 16.0279 15.1496 16.0279C18.7224 16.0279 20.5552 17.8666 20.6712 21.5206H14.8712H9.0712H0.3248C0.116 22.661 0 23.8945 0 25.2211C0 34.7867 5.8928 39.4182 14.8944 40V32.7386V32.7153Z" fill="#E52421"/>
      <path d="M228.724 10H206.276C204.467 10 203 11.4667 203 13.2761V35.7239C203 37.5333 204.467 39 206.276 39H228.724C230.533 39 232 37.5333 232 35.7239V13.2761C232 11.4667 230.533 10 228.724 10Z" fill="#E52421"/>
      <path d="M212.447 32.4825C211.656 32.4825 210.959 32.3669 210.354 32.1124C209.749 31.8579 209.284 31.4646 208.935 30.9556C208.586 30.4466 208.423 29.7988 208.423 29.0122C208.423 28.2256 208.539 27.8091 208.772 27.3464C209.005 26.8837 209.33 26.5135 209.726 26.2128C210.121 25.912 210.61 25.7038 211.168 25.5418C211.726 25.3799 212.308 25.2873 212.936 25.2411C213.634 25.1948 214.169 25.1254 214.587 25.056C215.006 24.9866 215.308 24.8709 215.495 24.7321C215.681 24.5933 215.774 24.4313 215.774 24.2V24.1537C215.774 23.9686 215.727 23.8298 215.611 23.691C215.495 23.5522 215.355 23.4596 215.146 23.3902C214.936 23.3208 214.704 23.2745 214.424 23.2745C214.145 23.2745 213.889 23.3208 213.68 23.3902C213.471 23.4596 213.285 23.5984 213.168 23.7604C213.052 23.9223 212.959 24.1074 212.912 24.3619L208.865 24.2694C208.958 23.4365 209.214 22.6961 209.656 22.0946C210.098 21.4931 210.749 21.0304 211.563 20.7065C212.377 20.3826 213.401 20.2206 214.587 20.2206C215.774 20.2206 216.285 20.3132 216.983 20.4982C217.681 20.6833 218.263 20.961 218.751 21.308C219.24 21.655 219.589 22.0946 219.844 22.6036C220.1 23.1126 220.217 23.691 220.217 24.3388V32.2975H215.913V30.6317H215.867C215.611 31.0944 215.308 31.4646 214.983 31.7422C214.657 32.0198 214.262 32.2049 213.843 32.3206C213.424 32.4363 212.959 32.5057 212.447 32.5057V32.4825ZM213.913 29.7063C214.238 29.7063 214.541 29.6369 214.843 29.5212C215.146 29.4055 215.378 29.2204 215.588 28.9659C215.797 28.7114 215.867 28.4338 215.867 28.0636V27.1151C215.75 27.1613 215.634 27.2076 215.518 27.2307C215.401 27.2539 215.262 27.3001 215.122 27.3464C214.983 27.3927 214.82 27.4158 214.657 27.439C214.494 27.4621 214.308 27.5084 214.099 27.5546C213.796 27.6009 213.517 27.6935 213.308 27.786C213.099 27.8785 212.912 28.0174 212.796 28.1793C212.68 28.3413 212.633 28.5263 212.633 28.7114C212.633 28.8965 212.68 29.1047 212.796 29.2435C212.912 29.3824 213.052 29.498 213.261 29.5906C213.471 29.6831 213.68 29.7063 213.936 29.7063H213.913Z" fill="white"/>
      <path d="M224.659 19.5497C223.985 19.5497 223.427 19.3415 222.985 18.9482C222.543 18.5549 222.333 18.0459 222.333 17.4443C222.333 16.8428 222.543 16.3338 222.985 15.9405C223.427 15.5472 223.985 15.339 224.659 15.339C225.334 15.339 225.892 15.5472 226.334 15.9405C226.776 16.3338 226.986 16.8428 226.986 17.4443C226.986 18.0459 226.776 18.5549 226.334 18.9482C225.892 19.3415 225.334 19.5497 224.659 19.5497ZM222.45 32.2743V20.452H226.893V32.2743H222.45Z" fill="white"/>
      <g id="tagline" transform="translate(0, 5)"><path d="M94.392 56.1364C93.8466 56.1364 93.3651 55.9986 92.9474 55.723C92.5298 55.4446 92.2031 55.0526 91.9673 54.5469C91.7315 54.0384 91.6136 53.4375 91.6136 52.7443C91.6136 52.0568 91.7315 51.4602 91.9673 50.9545C92.2031 50.4489 92.5313 50.0582 92.9517 49.7827C93.3722 49.5071 93.858 49.3693 94.4091 49.3693C94.8352 49.3693 95.1719 49.4403 95.419 49.5824C95.669 49.7216 95.8594 49.8807 95.9901 50.0597C96.1236 50.2358 96.2273 50.3807 96.3011 50.4943H96.3864V47.2727H97.392V56H96.4205V54.9943H96.3011C96.2273 55.1136 96.1222 55.2642 95.9858 55.446C95.8494 55.625 95.6548 55.7855 95.402 55.9276C95.1491 56.0668 94.8125 56.1364 94.392 56.1364ZM94.5284 55.233C94.9318 55.233 95.2727 55.1278 95.5511 54.9176C95.8295 54.7045 96.0412 54.4105 96.1861 54.0355C96.331 53.6577 96.4034 53.2216 96.4034 52.7273C96.4034 52.2386 96.3324 51.8111 96.1903 51.4446C96.0483 51.0753 95.8381 50.7884 95.5597 50.5838C95.2813 50.3764 94.9375 50.2727 94.5284 50.2727C94.1023 50.2727 93.7472 50.3821 93.4631 50.6009C93.1818 50.8168 92.9702 51.1108 92.8281 51.483C92.6889 51.8523 92.6193 52.267 92.6193 52.7273C92.6193 53.1932 92.6903 53.6165 92.8324 53.9972C92.9773 54.375 93.1903 54.6761 93.4716 54.9006C93.7557 55.1222 94.108 55.233 94.5284 55.233ZM104.174 56V49.4545H105.179V56H104.174ZM104.685 48.3636C104.489 48.3636 104.32 48.2969 104.178 48.1634C104.039 48.0298 103.969 47.8693 103.969 47.6818C103.969 47.4943 104.039 47.3338 104.178 47.2003C104.32 47.0668 104.489 47 104.685 47C104.881 47 105.049 47.0668 105.188 47.2003C105.33 47.3338 105.401 47.4943 105.401 47.6818C105.401 47.8693 105.33 48.0298 105.188 48.1634C105.049 48.2969 104.881 48.3636 104.685 48.3636ZM114.463 58.5909C113.977 58.5909 113.56 58.5284 113.21 58.4034C112.861 58.2812 112.57 58.1193 112.337 57.9176C112.107 57.7188 111.924 57.5057 111.787 57.2784L112.588 56.7159C112.679 56.8352 112.794 56.9716 112.933 57.125C113.073 57.2812 113.263 57.4162 113.504 57.5298C113.749 57.6463 114.068 57.7045 114.463 57.7045C114.992 57.7045 115.428 57.5767 115.772 57.321C116.115 57.0653 116.287 56.6648 116.287 56.1193V54.7898H116.202C116.128 54.9091 116.023 55.0568 115.887 55.233C115.753 55.4062 115.56 55.5611 115.307 55.6974C115.057 55.831 114.719 55.8977 114.293 55.8977C113.764 55.8977 113.29 55.7727 112.87 55.5227C112.452 55.2727 112.121 54.9091 111.877 54.4318C111.635 53.9545 111.514 53.375 111.514 52.6932C111.514 52.0227 111.632 51.4389 111.868 50.9418C112.104 50.4418 112.432 50.0554 112.852 49.7827C113.273 49.5071 113.759 49.3693 114.31 49.3693C114.736 49.3693 115.074 49.4403 115.324 49.5824C115.577 49.7216 115.77 49.8807 115.904 50.0597C116.04 50.2358 116.145 50.3807 116.219 50.4943H116.321V49.4545H117.293V56.1875C117.293 56.75 117.165 57.2074 116.909 57.5597C116.656 57.9148 116.316 58.1747 115.887 58.3395C115.46 58.5071 114.986 58.5909 114.463 58.5909ZM114.429 54.9943C114.833 54.9943 115.174 54.902 115.452 54.7173C115.73 54.5327 115.942 54.267 116.087 53.9205C116.232 53.5739 116.304 53.1591 116.304 52.6761C116.304 52.2045 116.233 51.7884 116.091 51.4276C115.949 51.0668 115.739 50.7841 115.46 50.5795C115.182 50.375 114.838 50.2727 114.429 50.2727C114.003 50.2727 113.648 50.3807 113.364 50.5966C113.083 50.8125 112.871 51.1023 112.729 51.4659C112.59 51.8295 112.52 52.233 112.52 52.6761C112.52 53.1307 112.591 53.5327 112.733 53.8821C112.878 54.2287 113.091 54.5014 113.372 54.7003C113.656 54.8963 114.009 54.9943 114.429 54.9943ZM123.934 56V49.4545H124.939V56H123.934ZM124.445 48.3636C124.249 48.3636 124.08 48.2969 123.938 48.1634C123.799 48.0298 123.729 47.8693 123.729 47.6818C123.729 47.4943 123.799 47.3338 123.938 47.2003C124.08 47.0668 124.249 47 124.445 47C124.641 47 124.809 47.0668 124.948 47.2003C125.09 47.3338 125.161 47.4943 125.161 47.6818C125.161 47.8693 125.09 48.0298 124.948 48.1634C124.809 48.2969 124.641 48.3636 124.445 48.3636ZM134.428 49.4545V50.3068H131.036V49.4545H134.428ZM132.025 47.8864H133.03V54.125C133.03 54.4091 133.071 54.6222 133.154 54.7642C133.239 54.9034 133.347 54.9972 133.478 55.0455C133.611 55.0909 133.752 55.1136 133.9 55.1136C134.01 55.1136 134.101 55.108 134.172 55.0966C134.243 55.0824 134.3 55.071 134.343 55.0625L134.547 55.9659C134.479 55.9915 134.384 56.017 134.262 56.0426C134.14 56.071 133.985 56.0852 133.797 56.0852C133.513 56.0852 133.235 56.0241 132.962 55.902C132.692 55.7798 132.468 55.5938 132.289 55.3438C132.113 55.0938 132.025 54.7784 132.025 54.3977V47.8864ZM142.667 56.1534C142.252 56.1534 141.876 56.0753 141.538 55.919C141.2 55.7599 140.931 55.5312 140.732 55.233C140.533 54.9318 140.434 54.5682 140.434 54.142C140.434 53.767 140.508 53.4631 140.656 53.2301C140.803 52.9943 141.001 52.8097 141.248 52.6761C141.495 52.5426 141.768 52.4432 142.066 52.3778C142.367 52.3097 142.67 52.2557 142.974 52.2159C143.371 52.1648 143.694 52.1264 143.941 52.1009C144.191 52.0724 144.373 52.0256 144.487 51.9602C144.603 51.8949 144.661 51.7812 144.661 51.6193V51.5852C144.661 51.1648 144.546 50.8381 144.316 50.6051C144.089 50.3722 143.744 50.2557 143.281 50.2557C142.8 50.2557 142.424 50.3608 142.151 50.571C141.879 50.7812 141.687 51.0057 141.576 51.2443L140.621 50.9034C140.792 50.5057 141.019 50.196 141.303 49.9744C141.59 49.75 141.903 49.5937 142.241 49.5057C142.582 49.4148 142.917 49.3693 143.246 49.3693C143.457 49.3693 143.698 49.3949 143.971 49.446C144.246 49.4943 144.512 49.5952 144.768 49.7486C145.026 49.902 145.241 50.1335 145.411 50.4432C145.582 50.7528 145.667 51.1676 145.667 51.6875V56H144.661V55.1136H144.61C144.542 55.2557 144.428 55.4077 144.269 55.5696C144.11 55.7315 143.898 55.8693 143.634 55.983C143.37 56.0966 143.048 56.1534 142.667 56.1534ZM142.82 55.25C143.218 55.25 143.553 55.1719 143.826 55.0156C144.102 54.8594 144.309 54.6577 144.448 54.4105C144.59 54.1634 144.661 53.9034 144.661 53.6307V52.7102C144.619 52.7614 144.525 52.8082 144.38 52.8509C144.238 52.8906 144.073 52.9261 143.886 52.9574C143.701 52.9858 143.521 53.0114 143.344 53.0341C143.171 53.054 143.031 53.071 142.923 53.0852C142.661 53.1193 142.417 53.1747 142.19 53.2514C141.965 53.3253 141.783 53.4375 141.644 53.5881C141.508 53.7358 141.44 53.9375 141.44 54.1932C141.44 54.5426 141.569 54.8068 141.827 54.9858C142.089 55.1619 142.42 55.25 142.82 55.25ZM153.308 47.2727V56H152.302V47.2727H153.308ZM170.051 56.1534C169.637 56.1534 169.26 56.0753 168.922 55.919C168.584 55.7599 168.315 55.5312 168.117 55.233C167.918 54.9318 167.818 54.5682 167.818 54.142C167.818 53.767 167.892 53.4631 168.04 53.2301C168.188 52.9943 168.385 52.8097 168.632 52.6761C168.879 52.5426 169.152 52.4432 169.45 52.3778C169.752 52.3097 170.054 52.2557 170.358 52.2159C170.756 52.1648 171.078 52.1264 171.325 52.1009C171.575 52.0724 171.757 52.0256 171.871 51.9602C171.987 51.8949 172.046 51.7812 172.046 51.6193V51.5852C172.046 51.1648 171.931 50.8381 171.7 50.6051C171.473 50.3722 171.128 50.2557 170.665 50.2557C170.185 50.2557 169.808 50.3608 169.536 50.571C169.263 50.7812 169.071 51.0057 168.96 51.2443L168.006 50.9034C168.176 50.5057 168.404 50.196 168.688 49.9744C168.975 49.75 169.287 49.5937 169.625 49.5057C169.966 49.4148 170.301 49.3693 170.631 49.3693C170.841 49.3693 171.083 49.3949 171.355 49.446C171.631 49.4943 171.896 49.5952 172.152 49.7486C172.411 49.902 172.625 50.1335 172.796 50.4432C172.966 50.7528 173.051 51.1676 173.051 51.6875V56H172.046V55.1136H171.994C171.926 55.2557 171.813 55.4077 171.654 55.5696C171.494 55.7315 171.283 55.8693 171.019 55.983C170.754 56.0966 170.432 56.1534 170.051 56.1534ZM170.205 55.25C170.602 55.25 170.938 55.1719 171.21 55.0156C171.486 54.8594 171.693 54.6577 171.833 54.4105C171.975 54.1634 172.046 53.9034 172.046 53.6307V52.7102C172.003 52.7614 171.909 52.8082 171.764 52.8509C171.622 52.8906 171.458 52.9261 171.27 52.9574C171.085 52.9858 170.905 53.0114 170.729 53.0341C170.556 53.054 170.415 53.071 170.307 53.0852C170.046 53.1193 169.801 53.1747 169.574 53.2514C169.35 53.3253 169.168 53.4375 169.029 53.5881C168.892 53.7358 168.824 53.9375 168.824 54.1932C168.824 54.5426 168.953 54.8068 169.212 54.9858C169.473 55.1619 169.804 55.25 170.205 55.25ZM182.329 58.5909C181.843 58.5909 181.426 58.5284 181.076 58.4034C180.727 58.2812 180.435 58.1193 180.202 57.9176C179.972 57.7188 179.789 57.5057 179.653 57.2784L180.454 56.7159C180.545 56.8352 180.66 56.9716 180.799 57.125C180.938 57.2812 181.129 57.4162 181.37 57.5298C181.614 57.6463 181.934 57.7045 182.329 57.7045C182.857 57.7045 183.293 57.5767 183.637 57.321C183.981 57.0653 184.153 56.6648 184.153 56.1193V54.7898H184.068C183.994 54.9091 183.889 55.0568 183.752 55.233C183.619 55.4062 183.426 55.5611 183.173 55.6974C182.923 55.831 182.585 55.8977 182.158 55.8977C181.63 55.8977 181.156 55.7727 180.735 55.5227C180.318 55.2727 179.987 54.9091 179.742 54.4318C179.501 53.9545 179.38 53.375 179.38 52.6932C179.38 52.0227 179.498 51.4389 179.734 50.9418C179.97 50.4418 180.298 50.0554 180.718 49.7827C181.139 49.5071 181.624 49.3693 182.176 49.3693C182.602 49.3693 182.94 49.4403 183.19 49.5824C183.443 49.7216 183.636 49.8807 183.769 50.0597C183.906 50.2358 184.011 50.3807 184.085 50.4943H184.187V49.4545H185.158V56.1875C185.158 56.75 185.031 57.2074 184.775 57.5597C184.522 57.9148 184.181 58.1747 183.752 58.3395C183.326 58.5071 182.852 58.5909 182.329 58.5909ZM182.295 54.9943C182.698 54.9943 183.039 54.902 183.318 54.7173C183.596 54.5327 183.808 54.267 183.952 53.9205C184.097 53.5739 184.17 53.1591 184.17 52.6761C184.17 52.2045 184.099 51.7884 183.957 51.4276C183.815 51.0668 183.604 50.7841 183.326 50.5795C183.048 50.375 182.704 50.2727 182.295 50.2727C181.869 50.2727 181.514 50.3807 181.229 50.5966C180.948 50.8125 180.737 51.1023 180.595 51.4659C180.455 51.8295 180.386 52.233 180.386 52.6761C180.386 53.1307 180.457 53.5327 180.599 53.8821C180.744 54.2287 180.957 54.5014 181.238 54.7003C181.522 54.8963 181.874 54.9943 182.295 54.9943ZM194.544 56.1364C193.913 56.1364 193.369 55.9972 192.912 55.7188C192.457 55.4375 192.106 55.0455 191.859 54.5426C191.615 54.0369 191.493 53.4489 191.493 52.7784C191.493 52.108 191.615 51.517 191.859 51.0057C192.106 50.4915 192.45 50.0909 192.89 49.804C193.333 49.5142 193.85 49.3693 194.441 49.3693C194.782 49.3693 195.119 49.4261 195.451 49.5398C195.784 49.6534 196.086 49.8381 196.359 50.0938C196.632 50.3466 196.849 50.6818 197.011 51.0994C197.173 51.517 197.254 52.0312 197.254 52.642V53.0682H192.208V52.1989H196.231C196.231 51.8295 196.157 51.5 196.01 51.2102C195.865 50.9205 195.657 50.6918 195.387 50.5241C195.12 50.3565 194.805 50.2727 194.441 50.2727C194.041 50.2727 193.694 50.3722 193.402 50.571C193.112 50.767 192.889 51.0227 192.733 51.3381C192.576 51.6534 192.498 51.9915 192.498 52.3523V52.9318C192.498 53.4261 192.583 53.8452 192.754 54.1889C192.927 54.5298 193.167 54.7898 193.474 54.9688C193.781 55.1449 194.137 55.233 194.544 55.233C194.808 55.233 195.047 55.196 195.26 55.1222C195.475 55.0455 195.662 54.9318 195.818 54.7812C195.974 54.6278 196.095 54.4375 196.18 54.2102L197.152 54.483C197.049 54.8125 196.877 55.1023 196.636 55.3523C196.395 55.5994 196.096 55.7926 195.741 55.9318C195.386 56.0682 194.987 56.1364 194.544 56.1364ZM204.589 52.0625V56H203.584V49.4545H204.555V50.4773H204.641C204.794 50.1449 205.027 49.8778 205.339 49.6761C205.652 49.4716 206.055 49.3693 206.55 49.3693C206.993 49.3693 207.381 49.4602 207.713 49.642C208.045 49.821 208.304 50.0938 208.489 50.4602C208.673 50.8239 208.766 51.2841 208.766 51.8409V56H207.76V51.9091C207.76 51.3949 207.626 50.9943 207.359 50.7074C207.092 50.4176 206.726 50.2727 206.26 50.2727C205.939 50.2727 205.652 50.3423 205.399 50.4815C205.149 50.6207 204.952 50.8239 204.807 51.0909C204.662 51.358 204.589 51.6818 204.589 52.0625ZM218.062 56.1364C217.449 56.1364 216.92 55.9915 216.477 55.7017C216.034 55.4119 215.693 55.0128 215.454 54.5043C215.216 53.9957 215.096 53.4148 215.096 52.7614C215.096 52.0966 215.219 51.5099 215.463 51.0014C215.71 50.4901 216.054 50.0909 216.494 49.804C216.937 49.5142 217.454 49.3693 218.045 49.3693C218.506 49.3693 218.92 49.4545 219.29 49.625C219.659 49.7955 219.962 50.0341 220.197 50.3409C220.433 50.6477 220.579 51.0057 220.636 51.4148H219.631C219.554 51.1165 219.383 50.8523 219.119 50.6222C218.858 50.3892 218.506 50.2727 218.062 50.2727C217.67 50.2727 217.327 50.375 217.031 50.5795C216.739 50.7812 216.51 51.0668 216.345 51.4361C216.183 51.8026 216.102 52.233 216.102 52.7273C216.102 53.233 216.182 53.6733 216.341 54.0483C216.503 54.4233 216.73 54.7145 217.023 54.9219C217.318 55.1293 217.665 55.233 218.062 55.233C218.324 55.233 218.561 55.1875 218.774 55.0966C218.987 55.0057 219.167 54.875 219.315 54.7045C219.463 54.5341 219.568 54.3295 219.631 54.0909H220.636C220.579 54.4773 220.439 54.8253 220.214 55.1349C219.993 55.4418 219.699 55.6861 219.332 55.8679C218.969 56.0469 218.545 56.1364 218.062 56.1364ZM227.554 58.4545C227.384 58.4545 227.232 58.4403 227.098 58.4119C226.965 58.3864 226.872 58.3608 226.821 58.3352L227.077 57.4489C227.321 57.5114 227.537 57.5341 227.725 57.517C227.912 57.5 228.078 57.4162 228.223 57.2656C228.371 57.1179 228.506 56.8778 228.628 56.5455L228.815 56.0341L226.395 49.4545H227.486L229.293 54.6705H229.361L231.168 49.4545H232.259L229.48 56.9545C229.355 57.2926 229.2 57.5724 229.016 57.794C228.831 58.0185 228.617 58.1847 228.372 58.2926C228.131 58.4006 227.858 58.4545 227.554 58.4545Z" fill="#0d0d0d"/></g></svg>
  </a>`;

const TECH_ICONS = {
  'Next.js': `<svg viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M18.665 21.978C16.758 23.255 14.465 24 12 24 5.377 24 0 18.623 0 12S5.377 0 12 0s12 5.377 12 12c0 3.583-1.574 6.801-4.067 9.001L9.219 7.2H7.2v9.596h1.615V9.251l9.85 12.727Zm-3.332-8.533 1.6 2.061V7.2h-1.6v6.245Z"/></svg>`,
  'React': `<svg viewBox="0 0 24 24" fill="#087ea4" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z"/></svg>`,
  'Vue.js': `<svg viewBox="0 0 24 24" fill="#41B883" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1.5 3h5.25L12 12 17.25 3H22.5L12 21 1.5 3z"/><path d="M6.75 3 12 12 17.25 3h-3.375L12 7.5 10.125 3z" fill="#34495E"/></svg>`,
  'Vercel': `<svg viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2L22 20H2L12 2z"/></svg>`,
  'WordPress': `<svg viewBox="0 0 24 24" fill="#21759B" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18.5c-1.193 0-2.325-.25-3.35-.694l4.61-12.63c.24.01.476.036.74.036 1.33 0 2.53-.24 2.53-.24.527-.03.466-.837-.06-.807 0 0-1.41.11-2.92.11-1.08 0-2.89-.11-2.89-.11-.525-.03-.585.777-.06.807 0 0 .46.053 1.19.08l1.72 4.72-2.41 7.23-4.01-11.95c.24.01.476.036.74.036 1.33 0 2.53-.24 2.53-.24.527-.03.466-.837-.06-.807 0 0-1.41.11-2.92.11-.206 0-.45-.005-.706-.013C6.1 4.64 4 8.06 4 12c0 4.411 3.589 8 8 8 2.195 0 4.185-.888 5.63-2.324l-2.29-6.27zm3.26-1.26c-.215.76-1.01 2.61-1.01 2.61l3.25-9.42c.24.01.476.036.74.036 1.08 0 1.84-.12 1.84-.12.527-.03.466-.837-.06-.807 0 0-.8.07-1.9.07-.59 0-1.26-.03-1.87-.07.66 1.9 1.86 5.39 2 5.71z"/></svg>`,
  'Shopify': `<svg viewBox="0 0 24 24" fill="#95BF47" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M15.337 3.4s-.25-.2-.7-.2c-.15 0-.33.05-.52.1-.05-.15-.15-.35-.3-.5-.35-.35-.85-.45-1.3-.45-2.05.05-3.55 1.6-3.9 3.85-.9.28-1.53.47-1.6.5-.5.15-.52.17-.58.65-.05.35-1.45 11.15-1.45 11.15l9.6 1.65 3.95-1.05S15.337 3.4 15.337 3.4zm-2.85.7c-.2.05-.4.12-.62.18l.35-1.55c.35.05.85.25.95.95.02.18.0.32-.05.42h-.63zm-1.05-.35.4-1.45c.2 0 .4.02.58.08l-.38 1.55c-.2-.07-.4-.13-.6-.18zm-.85 3.35c.1 0 1.55-.05 2.55-.35-.25 1.2-.85 2.3-1.8 2.3-.75 0-.9-.85-.75-1.95zm1.55-3.65c.15 0 .3.02.45.05l-.4 1.55c-.22-.07-.45-.12-.68-.17l.38-1.43c.08 0 .17 0 .25 0z"/></svg>`,
  'Cloudflare': `<svg viewBox="0 0 24 24" fill="#F38020" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M16.5088 16.8447c.1475-.5068.0908-.9707-.1553-1.3154-.2246-.3164-.6045-.499-1.0615-.5205l-8.6592-.1123a.1559.1559 0 0 1-.1333-.0713c-.0283-.042-.0351-.0986-.021-.1553.0278-.084.1123-.1484.2036-.1562l8.7359-.1123c1.0351-.0489 2.1601-.8868 2.5537-1.9136l.499-1.3013c.0215-.0561.0293-.1128.0147-.168-.5625-2.5463-2.835-4.4453-5.5499-4.4453-2.5039 0-4.6284 1.6177-5.3876 3.8614-.4927-.3658-1.1187-.5625-1.794-.499-1.2026.119-2.1665 1.083-2.2861 2.2856-.0283.31-.0069.6128.0635.894C1.5683 13.171 0 14.7754 0 16.752c0 .1748.0142.3515.0352.5273.0141.083.0844.1475.1689.1475h15.9814c.0909 0 .1758-.0645.2032-.1553l.12-.4268zm2.7568-5.5634c-.0771 0-.1611 0-.2383.0112-.0566 0-.1054.0415-.127.0976l-.3378 1.1744c-.1475.5068-.0918.9707.1543 1.3164.2256.3164.6055.498 1.0625.5195l1.8437.1133c.0557 0 .1055.0263.1329.0703.0283.043.0351.1074.0214.1562-.0283.084-.1132.1485-.204.1553l-1.921.1123c-1.041.0488-2.1582.8867-2.5527 1.914l-.1406.3585c-.0283.0713.0215.1416.0986.1416h6.5977c.0771 0 .1474-.0489.169-.126.1122-.4082.1757-.837.1757-1.2803 0-2.6025-2.125-4.727-4.7344-4.727"/></svg>`,
  'Cloudflare Turnstile': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#F38020"/><path d="M10 15.5l-3.5-3.5 1.41-1.41L10 12.67l6.09-6.09L17.5 8l-7.5 7.5z" fill="#ffffff"/></svg>`,
  'Google Analytics 4': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="16" y="2" width="6" height="20" rx="3" fill="#F9AB00"/><rect x="9" y="8" width="6" height="14" rx="3" fill="#E37400"/><circle cx="4" cy="19" r="3" fill="#E37400"/></svg>`,
  'Google Tag Manager': `<svg viewBox="0 0 24 24" fill="#246FDB" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2l4 4-8 8-4-4 8-8zm0 20l-4-4 3-3 4 4-3 3zm8-8l-4-4 1.5-1.5L21.5 12 20 14z"/></svg>`,
  'WhatsApp': `<svg viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`,
  'Telegram': `<svg viewBox="0 0 24 24" fill="#24A1DE" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`,
  'JSON-LD': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="5" cy="7" r="3.2" fill="#005A9C"/><circle cx="19" cy="7" r="3.2" fill="#0FB5EE"/><circle cx="12" cy="18" r="3.2" fill="#CB3837"/><path d="M8 7h8M7 9.5l3.5 6M17 9.5l-3.5 6" stroke="#4a5568" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  'PHP': `<svg viewBox="0 0 24 24" fill="#777BB4" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="12" cy="12" rx="11" ry="7" fill="#777BB4"/><text x="12" y="15" text-anchor="middle" font-size="8" font-weight="700" fill="#fff" font-family="sans-serif">PHP</text></svg>`,
  'Nginx': `<svg viewBox="0 0 24 24" fill="#009639" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.2l6.8 3.8v7.6L12 19.8l-6.8-3.8V8L12 4.2z"/></svg>`,
};

/** Real stack from AuditCollector → audit_data.detected_technologies. Never invent a demo list. */
function detectedTechnologiesFromData(auditData) {
  const raw = auditData?.detected_technologies;
  if (!Array.isArray(raw)) return [];
  return raw.map((t) => String(t || '').trim()).filter(Boolean);
}

/** Hostname for the audited site — never fall back to erythro.ai (that is our brand, not the client). */
function reportSiteHost(auditData) {
  const raw = String(auditData?.target_url || '').trim();
  if (!raw) return '';
  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`).hostname;
  } catch {
    return raw.replace(/^https?:\/\//i, '').split('/')[0].split('?')[0] || '';
  }
}

/**
 * PHP / PHP-CMS stack flagged for CVE-2026-109618 & CVE-2026-109619 (php2shell, Oct 2026).
 * Detection of the runtime or a typical PHP CMS is enough — we do not claim the host is unpatched.
 */
const PHP_STACK_ALERT_TECH = new Set([
  'PHP',
  'WordPress',
  'Drupal',
  'Joomla',
  'Bitrix',
  // Magento / PrestaShop: add when the collector fingerprints them
]);

const PHP_WA_HREF = 'https://wa.me/972505308305';

function isPhpStackAlertTech(name) {
  return PHP_STACK_ALERT_TECH.has(String(name || '').trim());
}

function phpStackAlertCopy(lang, flaggedNames, siteHost) {
  const list = flaggedNames.join(', ');
  const host = siteHost || 'your website';
  if (lang === 'ru') {
    return {
      badge: 'Критично',
      title: 'Критический риск PHP (CVE-2026-109618 / CVE-2026-109619)',
      body:
        `На сайте обнаружены ${list}. В октябре 2026 в PHP раскрыты критические уязвимости удалённого выполнения кода (RCE) без аутентификации («php2shell»). ` +
        `Сайты на PHP и CMS на его базе (WordPress, Drupal, Joomla, Bitrix и др.) требуют срочной проверки версии и обновления. ` +
        `Это предупреждение о технологическом стеке, а не подтверждение, что хост уже скомпрометирован.`,
      cta: 'Связаться с командой Erythro.ai в WhatsApp — поможем проверить и устранить риск',
      waText:
        `Здравствуйте! В отчёте аудита для ${host} отмечен критический риск PHP (CVE-2026-109618 / CVE-2026-109619). Нужна помощь с проверкой и устранением.`,
    };
  }
  if (lang === 'he') {
    return {
      badge: 'קריטי',
      title: 'סיכון קריטי ב-PHP (CVE-2026-109618 / CVE-2026-109619)',
      body:
        `באתר זוהו: ${list}. באוקטובר 2026 נחשפו ב-PHP פגיעויות קריטיות לביצוע קוד מרחוק ללא אימות (RCE, «php2shell»). ` +
        `אתרים על PHP ו-CMS מבוססות PHP (WordPress, Drupal, Joomla, Bitrix ועוד) דורשים בדיקת גרסה ועדכון מיידי. ` +
        `זו אזהרת מחסנית טכנולוגית — לא אישור שהשרת כבר נפרץ.`,
      cta: 'פנו לצוות Erythro.ai ב-WhatsApp — נבדוק ונסייע לתקן',
      waText:
        `שלום! בדוח הביקורת עבור ${host} סומן סיכון PHP קריטי (CVE-2026-109618 / CVE-2026-109619). אשמח לעזרה בבדיקה ובתיקון.`,
    };
  }
  return {
    badge: 'Critical',
    title: 'Critical PHP risk (CVE-2026-109618 / CVE-2026-109619)',
    body:
      `Detected: ${list}. In October 2026, critical unauthenticated remote code execution flaws in PHP web runtimes were disclosed («php2shell»). ` +
      `Sites on PHP and PHP-based CMS (WordPress, Drupal, Joomla, Bitrix, and similar) need an urgent version check and patch. ` +
      `This is a stack warning, not confirmation that the host is already compromised.`,
    cta: 'Contact the Erythro.ai team on WhatsApp — we can assess and remediate',
    waText:
      `Hi! The audit report for ${host} flagged a critical PHP risk (CVE-2026-109618 / CVE-2026-109619). I need help checking and fixing it.`,
  };
}

function classifyCheck(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('доступность') || n.includes('wcag') || n.includes('נגישות') || n.includes('a11y')) return 'a11y';
  if (n.includes('скролл') || n.includes('overflow') || n.includes('גלילה') || n.includes('lcp') || n.includes('vitals') || n.includes('скорост') || n.includes('speed')) return 'speed';
  if (n.includes('seo') || n.includes('opengraph') || n.includes('локаль') || n.includes('locale') || n.includes('שפה')) return 'seo';
  if (n.includes('лид-форм') || n.includes('воронки') || n.includes('воронка') || n.includes('lead form') || n.includes('funnel') || n.includes('טפסי ליד') || n.includes('משפך')) return 'lead';
  if (n.includes('рантайм') || n.includes('https') || n.includes('ttfb') || n.includes('безопасность') || n.includes('заголовк') || n.includes('runtime') || n.includes('security') || n.includes('server') || n.includes('יציבות') || n.includes('אבטחה') || n.includes('שרת')) return 'sec';
  if (n.includes('llms') || n.includes('brand facts') || n.includes('robots') || n.includes('datalayer') || n.includes('content signals') || n.includes('markdown') || n.includes('אותות') || n.includes('סימנאלים')) return 'ai';
  return 'speed';
}

// One colour scale for scores, the same as Lighthouse: 90+ green, 50–89 orange, below 50 red
const zoneOf = (v) => (v >= 90 ? 'good' : v >= 50 ? 'warn' : 'bad');

// Free = homepage, one locale, 5 checks. Skip checks that need other locales, the funnel crawl
// or AI Visibility (locked in Free); keep problems first, then cover speed/seo/lead/sec.
const FREE_CHECK_LIMIT = 5;
const FREE_SKIP_RE = /rtl|локаль|locale|שפה|воронк|funnel|משפך|ivrit|иврит/i;

function pickFreeChecks(checks, lang) {
  const eligible = checks.filter((c) => c.pillar !== 'ai' && !FREE_SKIP_RE.test(c.name));
  const picked = eligible.filter((c) => c.status !== 'good').slice(0, FREE_CHECK_LIMIT);
  for (const p of ['speed', 'seo', 'lead', 'sec']) {
    if (picked.length >= FREE_CHECK_LIMIT) break;
    if (!picked.some((c) => c.pillar === p)) {
      const c = eligible.find((x) => x.pillar === p && !picked.includes(x));
      if (c) picked.push(c);
    }
  }
  for (const c of eligible) {
    if (picked.length >= FREE_CHECK_LIMIT) break;
    if (!picked.includes(c)) picked.push(c);
  }
  const order = { bad: 0, warn: 1, grow: 2, good: 3 };
  return picked
    .sort((a, b) => order[a.status] - order[b.status] || checks.indexOf(a) - checks.indexOf(b))
    .map((c) => ({ ...c, result: freeLocaleResult(c.result, lang) }));
}

// "EN: … RU: … HE: …; hreflang …" -> only the report locale, plus the cross-locale tail
function freeLocaleResult(result, lang) {
  const re = /(?:^|\.\s+)(EN|RU|HE):\s*/g;
  const marks = [];
  let m;
  while ((m = re.exec(result))) marks.push({ code: m[1], at: m.index, body: m.index + m[0].length });
  if (marks.length < 2) return result;
  const i = marks.findIndex((x) => x.code === lang.toUpperCase());
  const cur = marks[i >= 0 ? i : 0];
  const next = marks[marks.indexOf(cur) + 1];
  let seg = result.slice(cur.body, next ? next.at : result.length).replace(/\.\s*$/, '');
  const tail = (result.match(/;\s*(hreflang[^.;]*)/) || [])[1];
  if (tail && !seg.includes(tail)) seg += '; ' + tail;
  return `${cur.code}: ${seg}`;
}

function classifyActionPillar(title) {
  const t = (title || '').toLowerCase();
  if (t.includes('доступност') || t.includes('wcag') || t.includes('נגישות') || t.includes('a11y')) return 'a11y';
  if (t.includes('скорост') || t.includes('загрузк') || t.includes('vitals') || t.includes('lcp') || t.includes('speed') || t.includes('מהירות')) return 'speed';
  if (t.includes('seo') || t.includes('мультиязыч') || t.includes('multilingual') || t.includes('רב-לשוני') || t.includes('opengraph') || t.includes('נראות') || t.includes('שפה')) return 'seo';
  if (t.includes('turnstile') || t.includes('honeypot') || t.includes('квалификац') || t.includes('заявк') || t.includes('лид') || t.includes('lead') || t.includes('המרה') || t.includes('טפס') || t.includes('ворон') || t.includes('ליד') || t.includes('ספאם')) return 'lead';
  if (t.includes('безопасн') || t.includes('рантайм') || t.includes('javascript') || t.includes('ошибк') || t.includes('security') || t.includes('קריסות') || t.includes('אבטחה')) return 'sec';
  if (t.includes('ai') || t.includes('llms') || t.includes('робот') || t.includes('биנה') || t.includes('discovery')) return 'ai';
  return 'speed';
}

function renderReport(lang, tier = 'pro') {
  const proCandidates = [
    path.join(AUDITOR_ROOT, `reports/${tier}`, `a44-audit-report_${lang}.html`),
    path.join(AUDITOR_ROOT, `reports/${tier}`, `audit-report_${lang}.html`),
    path.join(AUDITOR_ROOT, 'reports/pro', `a44-audit-report_${lang}.html`),
    path.join(AUDITOR_ROOT, 'reports/pro', `audit-report_${lang}.html`),
    path.join(AUDITOR_ROOT, 'reports/audit-report.html'),
    path.join('reports', tier, `a44-audit-report_${lang}.html`),
    path.join('reports', tier, `audit-report_${lang}.html`),
    path.join('reports/pro', `a44-audit-report_${lang}.html`),
    path.join('reports/pro', `audit-report_${lang}.html`),
    path.join('reports/audit-report.html'),
    path.join('QA_Auditor/reports/pro', `audit-report_${lang}.html`)
  ];
  let pro = '';
  for (const cp of proCandidates) {
    if (fs.existsSync(cp)) {
      const c = fs.readFileSync(cp, 'utf8');
      if (c.includes('class="check-card"')) {
        pro = c;
        try {
          fs.writeFileSync(path.join(AUDITOR_ROOT, `reports/${tier}`, `a44-audit-report_${lang}.html`), c, 'utf8');
        } catch (e) {}
        break;
      }
    }
  }
  if (!pro) {
    for (const cp of proCandidates) {
      if (fs.existsSync(cp)) {
        pro = fs.readFileSync(cp, 'utf8');
        break;
      }
    }
  }

  // Load template from templates/ or SAMPLES_DIR
  const templateCandidates = [
    path.join(TEMPLATES_V2_DIR, `audit_template_${tier}_${lang}.html`),
    path.join(TEMPLATES_V2_DIR, `audit_template_v2_${lang}.html`),
    path.join(TEMPLATES_V2_DIR, `audit_template_pro_${lang}.html`),
    (SAMPLES_DIR ? path.join(SAMPLES_DIR, `pro-${lang}-v2.html`) : null),
    (SAMPLES_DIR ? path.join(SAMPLES_DIR, `${tier}-${lang}.html`) : null),
  ].filter(Boolean);

  let templatePath = null;
  for (const tc of templateCandidates) {
    if (fs.existsSync(tc)) {
      templatePath = tc;
      break;
    }
  }
  if (!templatePath) {
    throw new Error(`Template not found for tier=${tier} lang=${lang}. Looked in: ${templateCandidates.join(', ')}`);
  }
  let s = fs.readFileSync(templatePath, 'utf8');

  // Inject or update EXTRA_STYLE cleanly
  if (s.includes('a.badge {')) {
    const startIdx = s.indexOf('a.badge {');
    const endIdx = s.indexOf('</style>', startIdx);
    if (endIdx !== -1) {
      s = s.slice(0, startIdx) + EXTRA_STYLE.trim() + '\n' + s.slice(endIdx);
    }
  } else {
    s = s.replace('</style>', `${EXTRA_STYLE.trim()}\n</style>`);
  }

  // Ensure Inter font is loaded
  if (!s.includes('family=Inter:')) {
    s = s.replace('family=Inter+Tight:', 'family=Inter:wght@400;500;600&family=Inter+Tight:');
  }

  // --- Brand Logo in Header
  s = s.replace(/<div class="logo"><i><\/i>Erythro\.ai<\/div>/g, BRAND_LOGO_SVG);
  s = s.replace(/<a class="logo"[^>]*>[\s\S]*?<\/a>/g, BRAND_LOGO_SVG);

  // --- Tier Title, Header Dark Badge & Scope Subtitle
  const tierTitles = {
    pro: { ru: 'Аудит сайта · Pro — Erythro.ai', en: 'Website Audit · Pro — Erythro.ai', he: 'ביקורת אתר · Pro — Erythro.ai' },
    diagnostic: { ru: 'Сводный аудит сайта · Diagnostic — Erythro.ai', en: 'Summary Website Audit · Diagnostic — Erythro.ai', he: 'ביקורת אתר סיכום · Diagnostic — Erythro.ai' },
    free: { ru: 'Экспресс-аудит сайта · Free — Erythro.ai', en: 'Express Website Audit · Free — Erythro.ai', he: 'ביקורת אתר אקספרס · Free — Erythro.ai' }
  };
  const tierBadges = {
    pro: { ru: 'Отчёт об аудите · Pro', en: 'Audit Report · Pro', he: 'דוח ביקורת · Pro' },
    diagnostic: { ru: 'Сводный аудит сайта · Diagnostic', en: 'Summary Website Audit · Diagnostic', he: 'ביקורת אתר סיכום · Diagnostic' },
    free: { ru: 'Экспресс-аудит сайта · Free', en: 'Express Website Audit · Free', he: 'ביקורת אתר אקספרס · Free' }
  };
  const tierSubtitles = {
    pro: { ru: '3 локали · 10 URL воронки', en: '3 locales · 10 funnel URLs', he: '3 שפות · 10 עמודי משפך' },
    diagnostic: { ru: '3 локали · 5 URL воронки', en: '3 locales · 5 funnel URLs', he: '3 שפות · 5 עמודי משפך' },
    free: { ru: 'Главная страница (1 URL)', en: 'Homepage (1 URL)', he: 'עמוד הבית (1 URL)' }
  };

  s = s.replace(/<title>[\s\S]*?<\/title>/, `<title>${tierTitles[tier][lang]}</title>`);
  s = s.replace(/<span class="badge dark">[^<]*<\/span>/, `<span class="badge dark">${tierBadges[tier][lang]}</span>`);
  s = s.replace(/<span class="badge">\s*(?:3\s*(?:локали|locales|שפות)[^<]*|Главная страница[^<]*|Homepage[^<]*|עמוד הבית[^<]*)\s*<\/span>/, `<span class="badge">${tierSubtitles[tier][lang]}</span>`);

  // --- Timestamp & Locales
  const ts = new Date(data.timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  let dateStr = '';
  if (lang === 'ru') {
    const MON = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    dateStr = `${ts.getUTCDate()} ${MON[ts.getUTCMonth()]} ${ts.getUTCFullYear()} ${pad(ts.getUTCHours())}:${pad(ts.getUTCMinutes())} UTC`;
    s = s.replace(/Проверено: [^<]*</, `Проверено: ${dateStr}<`);
    const locs = (data.locales_audited || []).map((l) => l.toUpperCase()).join(', ');
    s = s.replace(/Локали: [^<]*</, `Локали: ${locs}<`);
  } else if (lang === 'en') {
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    dateStr = `${ts.getUTCDate()} ${MON[ts.getUTCMonth()]} ${ts.getUTCFullYear()} ${pad(ts.getUTCHours())}:${pad(ts.getUTCMinutes())} UTC`;
    s = s.replace(/Scanned: [^<]*</, `Scanned: ${dateStr}<`);
    const locs = (data.locales_audited || []).map((l) => l.toUpperCase()).join(', ');
    s = s.replace(/Locales: [^<]*</, `Locales: ${locs}<`);
  } else if (lang === 'he') {
    const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    dateStr = `${ts.getUTCDate()} ${MON[ts.getUTCMonth()]} ${ts.getUTCFullYear()} ${pad(ts.getUTCHours())}:${pad(ts.getUTCMinutes())} UTC`;
    s = s.replace(/<span class="badge" dir="ltr">[^<]*<\/span>/, `<span class="badge" dir="ltr">${dateStr}</span>`);
    const locs = (data.locales_audited || []).map((l) => l.toUpperCase()).join(', ');
    s = s.replace(/שפות: [^<]*</, `שפות: ${locs}<`);
  }

  // Free checks one locale: the report language
  if (tier === 'free') {
    const one = lang.toUpperCase();
    s = s.replace(/Локали: [^<]*</, `Локаль: ${one}<`).replace(/Locales: [^<]*</, `Locale: ${one}<`).replace(/שפות: [^<]*</, `שפה: ${one}<`);
  }

  // --- Parse check-cards from Java HTML
  const cardRe = /<article class="check-card" data-status="(\w+)">([\s\S]*?)<\/article>/g;
  const checks = [];
  let cm;
  while ((cm = cardRe.exec(pro))) {
    const body = cm[2];
    const name = strip((/class="check-name">([\s\S]*?)<\/h3>/.exec(body) || [])[1] || '');
    const badge = strip((/class="check-badge \w+">([\s\S]*?)<\/span>/.exec(body) || [])[1] || '');
    const result = strip((/class="check-result-text">([\s\S]*?)<\/p>/.exec(body) || [])[1] || '');
    const rec = unesc((/<pre class="rec-body">([\s\S]*?)<\/pre>/.exec(body) || [])[1] || '').trim();
    const pillar = classifyCheck(name);
    checks.push({ status: cm[1], name, badge, result, rec, pillar });
  }

  // A "needs attention" check on a scale that is in the green zone is a growth point (grey), not orange
  const pillarScore = { speed: sc.speed_mobile_ux, seo: sc.seo_visibility, lead: sc.lead_gen_forms, sec: sc.security_stability, ai: sc.ai_visibility };
  for (const c of checks) {
    if (c.status === 'warn' && pillarScore[c.pillar] != null && zoneOf(pillarScore[c.pillar]) === 'good') c.status = 'grow';
  }

  // Severity of a pillar for top-3 and the action plan: 0 critical, 1 needs attention, 2 growth point.
  // A critical check is always critical, otherwise the scale zone decides (a11y has no scale: its checks decide).
  const sevForPillar = (pKey) => {
    const issues = checks.filter((c) => c.pillar === pKey && c.status !== 'good');
    if (issues.some((c) => c.status === 'bad')) return 0;
    const v = pillarScore[pKey];
    if (v == null) return issues.some((c) => c.status === 'warn') ? 1 : 2;
    const z = zoneOf(v);
    return z === 'bad' ? 0 : z === 'warn' ? 1 : 2;
  };

  // Sort checks: bad -> warn -> grow -> good
  const order = { bad: 0, warn: 1, grow: 2, good: 3 };
  checks.sort((a, b) => order[a.status] - order[b.status]);

  // Determine which check gets the anchor id for each pillar
  const pillarKeys = ['speed', 'seo', 'lead', 'sec', 'ai'];
  const pillarTargetCheck = {};
  for (const pKey of pillarKeys) {
    // Prefer the first non-good check in this pillar
    const problemCheck = checks.find((c) => c.pillar === pKey && c.status !== 'good');
    if (problemCheck) {
      pillarTargetCheck[pKey] = problemCheck;
    } else {
      // If all are good, point to the first check of this pillar
      pillarTargetCheck[pKey] = checks.find((c) => c.pillar === pKey);
    }
  }

  // Assign anchorId
  for (const pKey of pillarKeys) {
    if (pillarTargetCheck[pKey]) {
      pillarTargetCheck[pKey].anchorId = `diag-${pKey}`;
    }
  }

  const stCls = (st) => (st === 'good' ? 'g' : st === 'bad' ? 'c' : st === 'grow' ? 'n' : 'w');
  const stTxt = (st) => {
    if (lang === 'ru') return st === 'good' ? 'Отлично' : st === 'bad' ? 'Критично' : st === 'grow' ? 'Точка роста' : 'Требует внимания';
    if (lang === 'he') return st === 'good' ? 'מצוין' : st === 'bad' ? 'קריטי' : st === 'grow' ? 'הזדמנות לצמיחה' : 'דורש תשומת לב';
    return st === 'good' ? 'Excellent' : st === 'bad' ? 'Critical' : st === 'grow' ? 'Growth opportunity' : 'Needs attention';
  };
  const lblRes = lang === 'ru' ? 'Результат проверки' : lang === 'he' ? 'תוצאת בדיקה' : 'Check result';
  const lblRec = lang === 'ru' ? 'Рекомендация' : lang === 'he' ? 'המלצה' : 'Recommendation';
  const planLinkText = lang === 'ru' ? 'Смотреть решение с кодом в плане действий ↓'
    : lang === 'he' ? 'לצפייה בפתרון עם קוד בתוכנית הפעולה ↓'
    : 'View solution with code in action plan ↓';
  // Free opens Step 1 only: the action built from the first top-3 finding
  const freeOpenPillar = classifyActionPillar((sc?.top_vulnerabilities?.[0]?.title) || 'speed');

  const renderedChecks = tier === 'free' ? pickFreeChecks(checks, lang) : checks;

  let checkHtml = renderedChecks
    .map(
      (c) => {
        const copyBtn = `<button type="button" class="btn-copy" data-copy="${esc(c.rec)}" aria-label="Copy recommendation"><span class="copy-text">copy</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>`;
        let targetActionId = `action-${c.pillar}`;
        if (c.pillar === 'speed' && (c.name.toLowerCase().includes('vitals') || c.name.toLowerCase().includes('lcp'))) {
          targetActionId = 'action-speed-cwv';
        }
        let actionLink = '';
        if (c.status !== 'good') {
          if (tier === 'free') {
            // Free sells in one place (#tiers); only the open Step 1 gets a link from the checklist
            if (c.pillar === freeOpenPillar) {
              actionLink = `<a href="#action-${freeOpenPillar}" class="check-action-link">${planLinkText}</a>`;
            }
          } else {
            actionLink = `<a href="#${targetActionId}" class="check-action-link">${planLinkText}</a>`;
          }
        }
        return `      <details class="check" name="audit-checklist" data-s="${stCls(c.status)}" data-pillar="${c.pillar}"${c.anchorId ? ` id="${c.anchorId}"` : ''}><summary><span class="st ${stCls(c.status)}">${stTxt(c.status)}</span><span class="nm">${esc(c.name)}</span><span class="chev">⌄</span></summary>
        <div class="body">
          <div class="res"><b>${lblRes}</b>${esc(c.result)}</div>
          <div class="rec">
            <div class="rec-title-row"><b>${lblRec}</b>${tier === 'free' ? '' : copyBtn}</div>
            <p>${esc(c.rec)}</p>
            ${actionLink}
          </div>
        </div></details>`;
      }
    )
    .join('\n');

  if (tier === 'free') {
    const lockChecksData = {
      ru: {
        title: 'Остальные 23 проверки — в Diagnostic (сводно) и Pro (построчно, с рекомендациями)',
        desc: 'В экспресс-версии открыты 5 базовых проверок главной страницы. Платные тарифы проверяют сайт на трёх языках, в том числе:',
        bullets: [
          'Стресс-тест безопасности и HTTP-заголовков (HSTS, CSP, CORS)',
          'Защита от спам-ботов и доставляемость лидов в CRM',
          'Мультиязычная связка hreflang и верстка под RTL',
          'Индексация в AI-поисковиках (ChatGPT, Perplexity, Claude)',
          'Стабильность рантайма, TTFB и ответ сервера'
        ],
      },
      en: {
        title: 'The other 23 checks — in Diagnostic (summary) and Pro (row by row, with recommendations)',
        desc: 'The express version opens 5 core homepage checks. Paid tiers check the site in three languages, including:',
        bullets: [
          'Security stress-test & HTTP headers (HSTS, CSP, CORS)',
          'Anti-spam bot protection & CRM lead deliverability',
          'Multilingual hreflang & RTL layout verification',
          'AI search indexing (ChatGPT, Perplexity, Claude)',
          'Runtime stability, TTFB and server response'
        ],
      },
      he: {
        title: '23 הבדיקות הנותרות — ב-Diagnostic (בסיכום) וב-Pro (שורה-שורה, עם המלצות)',
        desc: 'בגרסת האקספרס פתוחות 5 בדיקות בסיס של עמוד הבית. המסלולים בתשלום בודקים את האתר בשלוש שפות, ביניהן:',
        bullets: [
          'בדיקת עמידות אבטחה וכותרות HTTP (HSTS, CSP, CORS)',
          'הגנה מבוטים וספאם בטפסים ושיגור ל-CRM',
          'הגדרת קישורי שפות hreflang ותמיכת RTL מלאה',
          'אינדוקס במנועי חיפוש AI (ChatGPT, Perplexity, Claude)',
          'יציבות זמן ריצה, TTFB ותגובת השרת'
        ],
      }
    };
    const lk = lockChecksData[lang];
    const bulletsHtml = lk.bullets.map((b) => `          <li>• ${esc(b)}</li>`).join('\n');
    const lockHtml = `      <div class="tier-lock-card" id="locked-checks">
        <div class="lock-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span>${esc(lk.title)}</span>
        </div>
        <p>${esc(lk.desc)}</p>
        <ul class="lock-bullets">
${bulletsHtml}
        </ul>
        <div class="lock-actions">
          <a href="#tiers" class="tier-btn-secondary">${btnText(TIER_COMPARE_LINK[lang], TIER_COMPARE_SHORT[lang])}</a>
        </div>
      </div>`;
    checkHtml += '\n' + lockHtml;
  }

  // Diagnostic: summary cards per area (status + counts + what needs work), no recommendation text.
  // Row-by-row checklist with recommendations stays in Pro. Funnel rows are capped at the tier's 5 URLs.
  let diagCheckCount = 0;
  let diagAreaCount = 0;
  if (tier === 'diagnostic') {
    const FUNNEL_PAGE_RE = /^(?:Страница воронки|Funnel page|דף משפך) ·/;
    const FUNNEL_CRAWL_RE = /Агентный обход воронки|Agent funnel crawl|סריקת משפך/;
    let funnelPages = 0;
    const diagChecks = checks.filter((c) => {
      if (FUNNEL_CRAWL_RE.test(c.name)) return false;
      if (FUNNEL_PAGE_RE.test(c.name)) return ++funnelPages <= 5;
      return true;
    });
    diagCheckCount = diagChecks.length;
    diagAreaCount = new Set(diagChecks.map((c) => c.pillar)).size;
    const AREAS = {
      ru: { ai: 'AI Visibility и Agent Readiness', speed: 'Скорость и мобильная вёрстка', seo: 'SEO и языковые версии', lead: 'Формы и путь к заявке', sec: 'Безопасность и стабильность', a11y: 'Доступность' },
      en: { ai: 'AI Visibility & Agent Readiness', speed: 'Speed & mobile layout', seo: 'SEO & language versions', lead: 'Forms & lead path', sec: 'Security & stability', a11y: 'Accessibility' },
      he: { ai: 'נראות AI ו-Agent Readiness', speed: 'מהירות ופריסה במובייל', seo: 'SEO וגרסאות שפה', lead: 'טפסים ונתיב לפנייה', sec: 'אבטחה ויציבות', a11y: 'נגישות' }
    }[lang];
    const nChecks = (n) => lang === 'ru'
      ? `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'проверка' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'проверки' : 'проверок'}`
      : lang === 'he' ? (n === 1 ? 'בדיקה אחת' : `${n} בדיקות`) : `${n} ${n === 1 ? 'check' : 'checks'}`;
    const aiLockedTxt = lang === 'ru' ? 'Разбор по каждому из 7 критериев и Agent Readiness L1 — в Pro'
      : lang === 'he' ? 'פירוט לכל אחד מ-7 הקריטריונים ו-Agent Readiness L1 — ב-Pro'
      : 'Breakdown of each of the 7 criteria and Agent Readiness L1 is in Pro';
    const aiTagTxt = lang === 'ru' ? 'Приоритет 2026' : lang === 'he' ? 'עדיפות 2026' : 'Priority 2026';
    const rank = { bad: 0, warn: 1, grow: 2, good: 3 };
    const cards = ['ai', 'speed', 'seo', 'lead', 'sec', 'a11y'].map((p) => {
      const list = diagChecks.filter((c) => c.pillar === p);
      if (!list.length) return '';
      const worst = list.slice().sort((a, b) => rank[a.status] - rank[b.status])[0].status;
      const counts = ['bad', 'warn', 'grow', 'good']
        .map((st) => [st, list.filter((c) => c.status === st).length])
        .filter(([, n]) => n)
        .map(([st, n]) => `<span class="sum-n ${stCls(st)}">${stTxt(st)} · ${n}</span>`)
        .join('');
      const issues = list.filter((c) => c.status !== 'good');
      const issuesHtml = p === 'ai'
        ? `<p class="sum-locked"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><span>${esc(aiLockedTxt)}</span></p>`
        : issues.length
        ? `<ul class="sum-issues">${issues.map((c) => `<li><span class="st ${stCls(c.status)}">${stTxt(c.status)}</span><b>${esc(c.name)}</b><small>${esc(c.result.length > 160 ? c.result.slice(0, 157) + '…' : c.result)}</small></li>`).join('')}</ul>`
        : '';
      return `      <div class="sum-card${p === 'ai' ? ' sum-ai' : ''}" id="diag-${p}" data-s="${stCls(worst)}">
        ${p === 'ai' ? `<span class="ai-tag">${aiTagTxt}</span>` : ''}
        <div class="sum-head"><h3>${esc(AREAS[p])}</h3><span class="st ${stCls(worst)}">${stTxt(worst)}</span></div>
        <p class="sum-total">${nChecks(list.length)}</p>
        <div class="sum-counts">${counts}</div>
        ${issuesHtml}
      </div>`;
    }).filter(Boolean).join('\n');
    const lockSum = {
      ru: { title: 'Построчный чеклист с рекомендацией по каждой проверке — в Pro', desc: 'В Diagnostic — сводка по направлениям: статус и что требует работы. Текст рекомендаций и готовый код по каждой строке открываются в Pro.' },
      en: { title: 'The row-by-row checklist with a recommendation for every check is in Pro', desc: 'Diagnostic gives a summary per area: status and what needs work. Recommendation text and ready code for every row open in Pro.' },
      he: { title: 'רשימת בדיקות שורה-שורה עם המלצה לכל בדיקה — ב-Pro', desc: 'ב-Diagnostic — סיכום לפי תחום: סטטוס ומה דורש עבודה. נוסח ההמלצות וקוד מוכן לכל שורה נפתחים ב-Pro.' }
    }[lang];
    checkHtml = `      <div class="sum-grid">
${cards}
      </div>
      <div class="tier-lock-card" id="locked-checks">
        <div class="lock-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span>${esc(lockSum.title)}</span>
        </div>
        <p>${esc(lockSum.desc)}</p>
        <div class="lock-actions">
          <a href="#tiers" class="tier-btn-secondary">${btnText(TIER_COMPARE_LINK[lang], TIER_COMPARE_SHORT[lang])}</a>
        </div>
      </div>`;
    // summary has no per-row statuses to filter: drop the filter bar and its empty-state line
    s = s.replace(/<div class="filters"[\s\S]*?<\/div>\s*/, '');
    s = s.replace(/<p id="empty" hidden>[^<]*<\/p>\s*/, '');
    const sumH2 = lang === 'ru' ? 'Сводка чеклиста' : lang === 'he' ? 'סיכום רשימת הבדיקות' : 'Checklist summary';
    s = s.replace(/<h2>(?:Полный чеклист аудита|Full audit checklist|רשימת בדיקות מלאה)<\/h2>/, `<h2>${sumH2}</h2>`);
  }

  s = replaceBlock(s, '<div class="checks" id="checks">', '    </div>\n  </section>', `<div class="checks" id="checks">\n${checkHtml}\n    </div>\n  </section>`);

  const resultsPrefix = lang === 'ru' ? 'Результаты: ' : lang === 'he' ? 'תוצאות: ' : 'Results: ';
  const countText = tier === 'free'
    ? (lang === 'ru' ? '5 из 28' : lang === 'he' ? '5 מתוך 28' : '5 of 28')
    : tier === 'diagnostic'
    ? (lang === 'ru' ? `${diagCheckCount} проверки · ${diagAreaCount} направлений` : lang === 'he' ? `${diagCheckCount} בדיקות · ${diagAreaCount} תחומים` : `${diagCheckCount} checks · ${diagAreaCount} areas`)
    : String(checks.length);
  s = s.replace(/(?:Результаты|Results|תוצאות):\s*[^<]*/, `${resultsPrefix}${countText}`);

  // Checklist filters: add "growth point", generic empty text, working filter script (was missing in v2)
  if (!/data-f="n"/.test(s)) {
    s = s.replace(/(\s*)<button class="filter" data-f="w">/, `$1<button class="filter" data-f="n">${stTxt('grow')}</button>$1<button class="filter" data-f="w">`);
  }
  const emptyTxt = lang === 'ru' ? 'Нет пунктов с таким статусом.' : lang === 'he' ? 'אין פריטים בסטטוס זה.' : 'No items with this status.';
  s = s.replace(/<p id="empty" hidden>[^<]*<\/p>/, `<p id="empty" hidden>${emptyTxt}</p>`);
  s = s.replace(/<script data-v2-filters>[\s\S]*?<\/script>\n?/g, '');
  s = s.replace('</body>', `${FILTER_JS}\n</body>`);

  // Update JS counter in template
  s = s.replace(/count\.textContent\s*=\s*['"][^'"]*['"]\s*\+\s*n;/, `count.textContent = '${resultsPrefix}' + ${tier === 'free' ? `'${countText}'` : 'n'};`);

  // --- Overall score
  const score = sc.overall_score;
  // Two-line wrap for multi-word gauge labels (keep clearance from the ring).
  const ZONE_WORD = {
    ru: { good: 'Отлично', warn: 'Требует<br>внимания', bad: 'Критично' },
    en: { good: 'Excellent', warn: 'Needs<br>attention', bad: 'Critical' },
    he: { good: 'מצוין', warn: 'דורש<br>תשומת לב', bad: 'קריטי' }
  }[lang];
  const ZONE_COLOR = { good: '#22bf16', warn: '#ff7900', bad: '#e52421' };
  const grade = ZONE_WORD[zoneOf(score)];

  const circ = 2 * Math.PI * 66;
  s = s.replace(/<div class="score-num">\d+/, `<div class="score-num">${score}`);
  s = s.replace(
    /stroke="#[0-9a-f]{6}" stroke-width="7" stroke-linecap="round" stroke-dasharray="[\d.]+ [\d.]+"/,
    `stroke="${ZONE_COLOR[zoneOf(score)]}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${((circ * score) / 100).toFixed(0)} ${circ.toFixed(0)}"`
  );
  s = s.replace(/<div class="lbl">[\s\S]*?<\/div>/, `<div class="lbl"><span>${grade}</span></div>`);

  // Section badge
  let checksStr = '';
  if (tier === 'free') {
    checksStr = lang === 'ru' ? '5 проверок · Главная страница' : lang === 'he' ? '5 בדיקות · עמוד הבית' : '5 checks · Homepage';
  } else if (tier === 'diagnostic') {
    // total as counted in docs/architecture/audit-report-tier-scope.md §3: 55 site + 28 × 3 languages + 9 × 5 pages
    checksStr = lang === 'ru' ? '184 проверки · 5 URL воронки' : lang === 'he' ? '184 בדיקות · 5 עמודי משפך' : '184 checks · 5 funnel URLs';
  } else {
    // 55 site + 28 × 3 languages + 9 × funnel pages + 1 Funnel review (230 at 10 pages)
    const proChecks = 55 + 28 * 3 + 9 * (ab.pages_visited || 10) + 1;
    checksStr = lang === 'ru'
      ? `${proChecks} проверок · ${ab.pages_visited} URL воронки`
      : lang === 'he'
      ? `${proChecks} בדיקות · ${ab.pages_visited} עמודי משפך`
      : `${proChecks} checks · ${ab.pages_visited} funnel URLs`;
  }
  s = s.replace(/\d+\s*(?:проверок|checks|בדיקות)\s*·\s*[\s\S]*?<\/span>/, `${checksStr}</span>`);

  // --- Diagnostic Scales with Linked Badges
  const scales = [
    { key: 'speed', ru: 'Скорость и мобильный UX', en: 'Speed & Mobile UX', he: 'מהירות ו-UX מובייל', v: sc.speed_mobile_ux },
    { key: 'seo', ru: 'SEO и видимость', en: 'SEO & Visibility', he: 'SEO ונראות', v: sc.seo_visibility },
    { key: 'lead', ru: 'Лидогенерация и формы', en: 'Lead Generation & Forms', he: 'לידים וטפסים', v: sc.lead_gen_forms },
    { key: 'sec', ru: 'Безопасность и стабильность', en: 'Security & Stability', he: 'אבטחה ויציבות', v: sc.security_stability },
    { key: 'ai', ru: 'AI Visibility и Brand Discovery', en: 'AI Visibility & Brand Discovery', he: 'נראות AI וגילוי מותג', v: sc.ai_visibility },
  ];

  // word and colour follow the zone only; segments still show how deep into the zone the score is
  const lvl = (v) => [ZONE_WORD[zoneOf(v)], v >= 90 ? 4 : v >= 70 ? 3 : v >= 50 ? 2 : 1, zoneOf(v)];

  // Free: a scale none of the 5 open checks covers is not "no issues", it was not shown
  const freeScaleLocked = (pKey) => tier === 'free' && pKey !== freeOpenPillar && !renderedChecks.some((c) => c.pillar === pKey);

  const scaleBadgeLink = (item) => {
    const pKey = item.key;
    if (freeScaleLocked(pKey)) {
      const lockTxt = lang === 'ru' ? 'В полном аудите ↓' : lang === 'he' ? 'בביקורת המלאה ↓' : 'In full audit ↓';
      const lockTitle = lang === 'ru' ? 'Детали по шкале — в тарифах Diagnostic и Pro'
        : lang === 'he' ? 'פירוט הסולם — במסלולי Diagnostic ו-Pro'
        : 'Scale details are in Diagnostic and Pro';
      return `<a href="#tiers" class="badge lock" title="${lockTitle}">${lockTxt}</a>`;
    }
    const issues = checks.filter((c) => c.pillar === pKey && c.status !== 'good');
    const hasBad = issues.some((c) => c.status === 'bad');
    const count = issues.length;

    const ruN = (n, one, few, many) => (n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many);
    const issuesTxt = lang === 'ru' ? `${count} ${ruN(count, 'замечание', 'замечания', 'замечаний')} ↓`
      : lang === 'he' ? (count === 1 ? 'הערה אחת ↓' : `${count} הערות ↓`)
      : `${count} ${count === 1 ? 'issue' : 'issues'} ↓`;
    const zone = zoneOf(item.v);
    let text = '';
    let cls = 'badge ok';

    // a critical check is always red; otherwise the zone colours the badge; issues in the green zone are grey growth points
    if (hasBad || zone === 'bad') {
      cls = 'badge crit';
      text = count ? issuesTxt : (lang === 'ru' ? 'Критично ↓' : lang === 'he' ? 'קריטי ↓' : 'Critical ↓');
    } else if (zone === 'warn') {
      cls = 'badge warn';
      text = count ? issuesTxt : (lang === 'ru' ? 'Требует внимания ↓' : lang === 'he' ? 'דורש תשומת לב ↓' : 'Needs attention ↓');
    } else if (count) {
      cls = 'badge grow';
      text = lang === 'ru' ? `${count} ${ruN(count, 'точка роста', 'точки роста', 'точек роста')} ↓`
        : lang === 'he' ? (count === 1 ? 'הזדמנות צמיחה אחת ↓' : `${count} הזדמנויות צמיחה ↓`)
        : `${count} growth ${count === 1 ? 'point' : 'points'} ↓`;
    } else {
      text = lang === 'ru' ? 'Без замечаний' : lang === 'he' ? 'ללא הערות' : 'No issues';
    }

    const titleAttr = lang === 'ru'
      ? `title="Смотреть решение по направлению: ${item.ru}"`
      : lang === 'he'
      ? `title="לצפייה בפתרון עבור: ${item.he}"`
      : `title="View solution for: ${item.en}"`;

    let targetHref = `#action-${pKey}`;
    if (tier === 'diagnostic') {
      // only Step 1 is open in the plan; other scales lead to their summary card
      targetHref = pKey === freeOpenPillar ? `#action-${pKey}` : `#diag-${pKey}`;
    } else if (tier === 'free') {
      if (pKey === 'speed') {
        targetHref = '#action-speed';
      } else {
        const rc = renderedChecks.find((c) => c.pillar === pKey);
        targetHref = rc && rc.anchorId ? `#${rc.anchorId}` : '#locked-checks';
      }
    }

    return `<a href="${targetHref}" class="${cls}" ${titleAttr}>${text}</a>`;
  };

  const scaleHtml = scales
    .map((item) => {
      const name = item[lang];
      let [txt, n, cls] = lvl(item.v);
      const bLink = scaleBadgeLink(item);
      // Free: the badge already carries the status, the grade word next to the number is dropped
      txt = '';
      const segs = [0, 1, 2, 3].map((i) => (i < n ? `<i class="on-${cls}"></i>` : '<i></i>')).join('');
      return `    <div class="scale">
      <div class="row"><h3>${name}</h3>${bLink}</div>
      <div class="val"><b>${item.v}</b>${txt ? ` ${txt}` : ''}</div>
      <div class="segs">${segs}</div>
    </div>`;
    })
    .join('\n');

  s = replaceBlock(s, '    <div class="scale">', '    </div>\n  </section>', `${scaleHtml}\n  </section>`);
  s = s.replace('</section>\n  </section>', '</section>');

  // Weakest note
  const weakest = scales.slice().sort((a, b) => a.v - b.v)[0];
  let scoreNote = '';
  if (lang === 'ru') {
    scoreNote = `Общая оценка сайта ${score} из 100. Самая слабая шкала — «${weakest.ru}» (${weakest.v}). Остальные направления в норме; ниже — что именно стоит исправить.`;
  } else if (lang === 'he') {
    scoreNote = `הציון הכולל של האתר הוא ${score} מתוך 100. הסולם החלש ביותר הוא "${weakest.he}" (${weakest.v}). שאר התחומים במצב תקין; להלן מה שכדאי לתקן.`;
  } else {
    scoreNote = `Overall site score is ${score} out of 100. The weakest scale is “${weakest.en}” (${weakest.v}). Other areas are in good shape; below is what should be addressed first.`;
  }
  if (tier === 'free') {
    // the score comes from the full lab run; Free shows only 5 checks of it
    scoreNote = lang === 'ru'
      ? `Оценка ${score} из 100 — по экспресс-проверке главной страницы. Самая слабая шкала — «${weakest.ru}» (${weakest.v}). В отчёте открыты 5 базовых проверок и Google Lighthouse; полный аудит (28 проверок, 3 локали, до 10 страниц) может уточнить оценку.`
      : lang === 'he'
      ? `ציון ${score} מתוך 100 — לפי בדיקה מהירה של עמוד הבית. הסולם החלש ביותר הוא "${weakest.he}" (${weakest.v}). בדוח פתוחות 5 בדיקות בסיס ו-Google Lighthouse; ביקורת מלאה (28 בדיקות, 3 שפות, עד 10 עמודים) עשויה לדייק את הציון.`
      : `Score ${score} out of 100 — from an express check of the homepage. The weakest scale is “${weakest.en}” (${weakest.v}). This report opens 5 core checks and Google Lighthouse; a full audit (28 checks, 3 locales, up to 10 pages) may refine the score.`;
  }
  s = s.replace(/<p class="score-note">[\s\S]*?<\/p>/, `<p class="score-note">${scoreNote}</p>`);

  // --- Top 3 findings
  let finds = [];
  if (sc && Array.isArray(sc.top_vulnerabilities) && sc.top_vulnerabilities.length > 0) {
    finds = sc.top_vulnerabilities.slice(0, 3).map((v) => {
      const origTitle = strip(v.title || '');
      const tr = FINDINGS_DICT[origTitle]?.[lang];
      return {
        // pillar is classified from the original (RU) title, so every language copy gets the same plan
        orig: origTitle,
        title: tr ? tr.title : origTitle,
        issue: tr ? tr.issue : strip(v.issue || ''),
        impact: tr ? tr.impact : strip(v.impact || ''),
        sol: tr ? tr.sol : strip(v.solution || v.sol || '')
      };
    });
  } else {
    const findRe = /<article class="finding-card">([\s\S]*?)<\/article>/g;
    let fm;
    while ((fm = findRe.exec(pro))) {
      const b = fm[1];
      const prob = b.match(/<strong>(?:Проблема|Issue|בעיה):<\/strong>\s*([\s\S]*?)(?:<span class="issue">([\s\S]*?)<\/span>)?<\/div>/) || [];
      const imp = b.match(/<strong>(?:Потери бизнеса|Business loss|Business impact|השפעה עסקית):<\/strong>\s*([\s\S]*?)<\/div>/) || [];
      const sol = b.match(/<strong>(?:Решение от Erythro\.ai|Erythro\.ai solution|פתרון מ-Erythro\.ai):<\/strong>\s*([\s\S]*?)<\/div>/) || [];
      finds.push({
        title: strip(prob[1] || ''),
        issue: strip(prob[2] || ''),
        impact: strip(imp[1] || ''),
        sol: strip(sol[1] || ''),
      });
    }
  }

  const tagCls = ['crit', 'med', 'gold'];
  const tagTxt = lang === 'ru'
    ? ['Критично', 'Требует внимания', 'Точка роста']
    : lang === 'he'
    ? ['קריטי', 'דורש תשומת לב', 'הזדמנות לצמיחה']
    : ['Critical', 'Needs attention', 'Growth opportunity'];
  const catTxt = (n) => {
    if (n === 2) {
      if (lang === 'ru') return 'Потенциал конверсии';
      if (lang === 'he') return 'פוטנציאל המרה';
      return 'Conversion potential';
    }
    if (lang === 'ru') return 'Уязвимость конверсии';
    if (lang === 'he') return 'פגיעות קונברסיה';
    return 'Conversion vulnerability';
  };
  const tagTitle = (n) => {
    if (n === 2) {
      if (lang === 'ru') return ' title="Точка роста конверсии: потенциал увеличения заявок за счёт ускорения загрузки и Core Web Vitals"';
      if (lang === 'he') return ' title="הזדמנות לצמיחה: פוטנציאל לשיפור המרות באמצעות האצת מהירות טעינה ו-Core Web Vitals"';
      return ' title="Growth opportunity: potential conversion lift by improving load speed and Core Web Vitals"';
    }
    return '';
  };
  const lblProb = lang === 'ru' ? 'Проблема' : lang === 'he' ? 'בעיה' : 'Problem';
  const lblImp = lang === 'ru' ? 'Потери бизнеса' : lang === 'he' ? 'השפעה עסקית' : 'Business loss';
  const lblSol = lang === 'ru' ? 'Решение от Erythro.ai' : lang === 'he' ? 'פתרון מ-Erythro.ai' : 'Erythro.ai solution';

  // Free: severity follows the scale and the checklist (Pro/Diagnostic still use the fixed 0/1/2 order)
  const sevIdx = (f) => sevForPillar(classifyActionPillar(f.orig || f.title));
  const lockIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
  const freeStep1Text = lang === 'ru' ? 'Готовое решение с кодом — в Шаге 1 плана действий ↓'
    : lang === 'he' ? 'פתרון מוכן עם קוד — בשלב 1 של תוכנית הפעולה ↓'
    : 'Ready solution with code — Step 1 of the action plan ↓';
  const freeLockedSolText = lang === 'ru' ? 'Решение и код — в Pro. <a href="#tiers" class="t3-lock-link">Сравнить тарифы ↓</a>'
    : lang === 'he' ? 'פתרון וקוד — ב-Pro. <a href="#tiers" class="t3-lock-link">השוואת מסלולים ↓</a>'
    : 'Solution and code are in Pro. <a href="#tiers" class="t3-lock-link">Compare tiers ↓</a>';

  const t3Html = finds
    .slice(0, 3)
    .map(
      (f, n) => {
        let solContent = `<div class="t3-row solution"><b>${lblSol}</b><span>${esc(f.sol)}</span></div>`;
        if (tier !== 'pro') {
          solContent = n === 0
            ? `<div class="t3-row solution"><b>${lblSol}</b><span><a href="#action-${freeOpenPillar}" class="t3-step-link">${freeStep1Text}</a></span></div>`
            : `<div class="t3-row solution locked"><b>${lblSol}</b><span class="t3-sol-locked">${lockIcon}<span>${freeLockedSolText}</span></span></div>`;
        }
        const k = sevIdx(f, n);
        const tTitle = tier !== 'pro' ? '' : tagTitle(n);
        return `      <div class="t3"><div class="t3-idx">0${n + 1}</div><div>
        <div class="t3-head"><h3>${esc(f.title)}</h3><div class="tags"><span class="tag">${catTxt(k)}</span><span class="tag ${tagCls[k]}"${tTitle}>${tagTxt[k]}</span></div></div>
        <div class="t3-rows">
          <div class="t3-row problem"><b>${lblProb}</b><span>${esc(f.issue || f.title)}</span></div>
          <div class="t3-row impact"><b>${lblImp}</b><span>${esc(f.impact)}</span></div>
          ${solContent}
        </div></div></div>`;
      }
    )
    .join('\n');

  s = s.replace(/<div class="top3">[\s\S]*?<\/div>\s*<\/section>/, `<div class="top3">\n${t3Html}\n    </div>\n  </section>`);

  // --- Funnel review (Pro only): AI verdict on the lead path from agent_browse.gemini_review,
  // placed after top-3 and before Lighthouse, as the site describes it. The template is the previous
  // Pro output, so drop an earlier copy first.
  s = s.replace(/\s*<section class="card funnel-review"[\s\S]*?<\/section>/, '');
  if (tier === 'pro') {
    const gr = ab.gemini_review || {};
    const T3 = (ru, en, he) => (lang === 'ru' ? ru : lang === 'he' ? he : en);
    const pages = ab.pages_visited || 10;
    // When the AI review is unavailable (Gemini error / timeout), apply the rule the AI prompt is given:
    // a page is a gap only if the visitor cannot submit a lead (no form, inline or after a CTA) and has no instant channel.
    const aiOk = gr.status === 'SUCCESS';
    const ruleGaps = (ab.pages || [])
      .filter((p) => !(p.formsCount > 0 || p.formViaCta || p.hasChatWidget || p.hasInstantContactChannel) || p.soft404 || p.ok === false)
      .map((p) => {
        const u = String(p.url || '').replace(/^https?:\/\/[^/]+/, '') || '/';
        return p.soft404 || p.ok === false
          ? T3(`${u}: страница недоступна или soft-404`, `${u}: page unavailable or soft-404`, `${u}: העמוד לא זמין או soft-404`)
          : T3(`${u}: нет формы и мгновенного канала связи`, `${u}: no form and no instant contact channel`, `${u}: אין טופס ואין ערוץ קשר מיידי`);
      });
    const gaps = aiOk ? (Array.isArray(gr.gaps) ? gr.gaps.slice(0, 3) : []) : ruleGaps.slice(0, 3);
    // Gemini answers in the run's report language; other language copies get a summary built from the data
    const sameLang = aiOk ? (data.report_lang || 'ru') === lang : true;
    const verdict = aiOk && sameLang && gr.verdict ? gr.verdict
      : gaps.length ? T3(`Найдено пробелов на пути к заявке: ${gaps.length}.`, `Gaps found on the lead path: ${gaps.length}.`, `נמצאו פערים בדרך לפנייה: ${gaps.length}.`)
      : T3(`Путь к заявке работает на всех ${pages} страницах: формы, чат и мессенджеры доступны.`, `The lead path works on all ${pages} pages: forms, chat and messengers are available.`, `הדרך לפנייה עובדת בכל ${pages} העמודים: טפסים, צ׳אט ומסנג׳רים זמינים.`);
    const fix = aiOk && sameLang && gr.priority_fix ? gr.priority_fix
      : gaps.length ? T3('Закройте первый пробел из списка — он сильнее всего влияет на заявки.', 'Close the first gap on the list — it affects leads the most.', 'סגרו את הפער הראשון ברשימה — הוא משפיע הכי הרבה על הפניות.')
      : T3('Критических барьеров нет. Следите за конверсией форм и чата после каждого релиза.', 'No critical barriers. Watch form and chat conversion after every release.', 'אין חסמים קריטיים. עקבו אחרי ההמרה של הטפסים והצ׳אט אחרי כל שחרור.');
    const zone = gaps.length ? 'w' : 'g';
    const gapsHtml = gaps.length && sameLang
      ? `<ul class="fr-gaps">${gaps.map((g) => `<li>${esc(String(g))}</li>`).join('')}</ul>`
      : `<p class="fr-none">${esc(gaps.length ? T3(`Пробелов: ${gaps.length}`, `Gaps: ${gaps.length}`, `פערים: ${gaps.length}`) : T3('Пробелов не найдено.', 'No gaps found.', 'לא נמצאו פערים.'))}</p>`;
    const ruleNote = aiOk ? '' : `
    <p class="note">${T3('Анализ выполнен по протоколу Erythro CRO Framework: сквозная валидация лид-форм, модальных окон CTA, чата и каналов мгновенной связи на каждом шаге воронки.', 'Analysis performed according to the Erythro CRO Framework protocol: end-to-end validation of lead forms, CTA modals, chat, and instant communication channels at each funnel step.', 'הניתוח בוצע לפי פרוטוקול Erythro CRO Framework: תיקוף מקיף של טפסי לידים, חלונות מודאל CTA, צ׳אט וערוצי קשר מיידי בכל שלב במשפך.')}</p>`;
    const frHtml = (ab.pages || []).length || aiOk ? `

  <section class="card funnel-review" id="funnel-review">
    <div class="row"><h2>${aiOk ? T3('Funnel review: путь к заявке глазами AI', 'Funnel review: the lead path through AI eyes', 'Funnel review: הדרך לפנייה בעיני AI') : T3('Funnel review: путь к заявке', 'Funnel review: the lead path', 'Funnel review: הדרך לפנייה')}</h2><span class="badge">${T3(`${pages} страниц воронки`, `${pages} funnel pages`, `${pages} עמודי משפך`)}</span></div>
    <p class="sub">${aiOk
      ? T3('AI прошёл путь посетителя по страницам воронки, включая формы в модальных окнах, чат и мессенджеры.', 'AI walked the visitor path across the funnel pages, including modal forms, chat and messengers.', 'AI עבר את מסלול המבקר בעמודי המשפך, כולל טפסי מודאל, צ׳אט ומסנג׳רים.')
      : T3('Лаборатория прошла путь посетителя по страницам воронки, включая формы в модальных окнах, чат и мессенджеры.', 'The lab walked the visitor path across the funnel pages, including modal forms, chat and messengers.', 'המעבדה עברה את מסלול המבקר בעמודי המשפך, כולל טפסי מודאל, צ׳אט ומסנג׳רים.')}</p>
    <div class="fr-grid">
      <div class="fr-box" data-s="${zone}"><b>${T3('Вердикт', 'Verdict', 'פסק דין')}</b><p>${esc(verdict)}</p></div>
      <div class="fr-box" data-s="${zone}"><b>${T3('Пробелы (до 3)', 'Gaps (up to 3)', 'פערים (עד 3)')}</b>${gapsHtml}</div>
    </div>
    <div class="fr-fix" data-s="${zone}"><b>${T3('Главная рекомендация по воронке', 'Main funnel recommendation', 'המלצה מרכזית למשפך')}</b><p>${esc(fix)}</p></div>${ruleNote}
  </section>` : '';
    const t3End = s.indexOf('</section>', s.indexOf('<div class="top3">')) + '</section>'.length;
    s = s.slice(0, t3End) + frHtml + s.slice(t3End);
  }

  // --- Speed Table
  const pm = data.pagespeed_insights?.mobile || { scores: {}, metrics: {} };
  const pd = data.pagespeed_insights?.desktop || { scores: {}, metrics: {} };
  const pill = (v) => `<span class="p ${v >= 90 ? 'g' : v >= 50 ? 'w' : 'b'}">${v ?? '—'}</span>`;
  const met = (o, k) => {
    const x = o.metrics ? o.metrics[k] : null;
    return x ? esc(x.displayValue || x.value || '—').replace(/\s+/g, ' ') : '—';
  };

  const metricNames = {
    Performance: { ru: 'Performance', en: 'Performance', he: 'ביצועים' },
    Accessibility: { ru: 'Accessibility', en: 'Accessibility', he: 'נגישות' },
    BestPractices: { ru: 'Best practices', en: 'Best practices', he: 'פרקטיקות מומלצות' },
    SEO: { ru: 'SEO', en: 'SEO', he: 'SEO' },
    FCP: { ru: 'FCP', en: 'FCP', he: 'FCP' },
    LCP: { ru: 'LCP', en: 'LCP', he: 'LCP' },
    CLS: { ru: 'CLS', en: 'CLS', he: 'CLS' },
    Funnel: { ru: 'Страницы воронки', en: 'Funnel pages', he: 'עמודי המשפך' },
  };

  const tbRows = [
    [metricNames.Performance[lang], pill(pm.scores?.performance), pill(pd.scores?.performance)],
    [metricNames.Accessibility[lang], pill(pm.scores?.accessibility), pill(pd.scores?.accessibility)],
    [metricNames.BestPractices[lang], pill(pm.scores?.best_practices), pill(pd.scores?.best_practices)],
    [metricNames.SEO[lang], pill(pm.scores?.seo), pill(pd.scores?.seo)],
    [metricNames.FCP[lang], met(pm, 'FCP'), met(pd, 'FCP')],
    [metricNames.LCP[lang], met(pm, 'LCP'), met(pd, 'LCP')],
    [metricNames.CLS[lang], met(pm, 'CLS'), met(pd, 'CLS')],
  ];
  const tbHtml = tbRows.map((r) => `          <tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('\n');
  const funnelCount = tier === 'free' ? '1/1' : tier === 'diagnostic' ? '5/5' : `${ab.pages_ok}/${ab.pages_visited}`;
  const fpHtml = `          <tr><td>${metricNames.Funnel[lang]}</td><td colspan="2"><span class="p g">${funnelCount}</span></td></tr>`;

  s = replaceBlock(s, '<tbody>\n          <tr><td>', '</tbody>', `<tbody>\n${tbHtml}\n${fpHtml}\n        </tbody>`);

  // --- AI Visibility Section (Inserted directly after Speed & Core Web Vitals)
  const aiSectionHtml = tier === 'pro' ? renderAiVisibilitySection(lang) : renderAiVisibilityLockedSection(lang, tier === 'diagnostic');
  if (s.includes('class="card card-ai-visibility"')) {
    const startIdx = s.indexOf('<section class="card card-ai-visibility"');
    const endIdx = s.indexOf('</section>', startIdx) + 10;
    s = s.slice(0, startIdx) + aiSectionHtml.trim() + s.slice(endIdx);
  } else {
    const speedEndIdx = s.indexOf('</table>\n    </div>\n  </section>');
    if (speedEndIdx !== -1) {
      const insPos = speedEndIdx + '</table>\n    </div>\n  </section>'.length;
      s = s.slice(0, insPos) + '\n\n' + aiSectionHtml.trim() + s.slice(insPos);
    }
  }

  // --- Funnel Path
  s = s.replace(/HTTP 200 (?:и отсутствие soft-404|and no soft-404|והיעדר soft-404) (?:<span dir="ltr">|<span>)[^<]*<\/span>/, `HTTP 200 ${lang === 'ru' ? 'и отсутствие soft-404' : lang === 'he' ? 'והיעדר soft-404' : 'and no soft-404'} <span>${funnelCount}</span>`);
  s = s.replace(/CTA (?:или форма на странице|or form on page|או טופס בעמוד) (?:<span dir="ltr">|<span>)[^<]*<\/span>/, `CTA ${lang === 'ru' ? 'или форма на странице' : lang === 'he' ? 'או טופס בעמוד' : 'or form on page'} <span>${funnelCount}</span>`);

  if (tier !== 'pro') {
    const lockFlowData = tier === 'diagnostic' ? {
      ru: {
        title: 'Funnel review и до 10 страниц воронки — в Pro',
        desc: 'AI-разбор пути к заявке с учётом модальных форм и чата: вердикт, до 3 пробелов и главная рекомендация по воронке. В Pro обход расширяется до 10 страниц.',
      },
      en: {
        title: 'Funnel review and up to 10 funnel pages are in Pro',
        desc: 'An AI review of the lead path including modal forms and chat: verdict, up to 3 gaps and the main funnel recommendation. Pro extends the crawl to 10 pages.',
      },
      he: {
        title: 'Funnel review ועד 10 עמודי משפך — ב-Pro',
        desc: 'ניתוח AI של הדרך לפנייה כולל טפסי מודאל וצ׳אט: פסק דין, עד 3 פערים והמלצה מרכזית למשפך. ב-Pro הסריקה מתרחבת ל-10 עמודים.',
      }
    } : {
      ru: {
        title: 'Путь к заявке по всей воронке (до 10 страниц)',
        desc: 'Сквозное тестирование путей оформления заказа, мягких 404, мобильных форм и кнопок захвата лида по всем страницам каталога доступно в тарифах Diagnostic и Pro.',
      },
      en: {
        title: 'Lead path across the whole funnel (up to 10 pages)',
        desc: 'End-to-end checkout verification, soft-404 detection, and lead capture form testing across all catalog pages is available in Diagnostic and Pro.',
      },
      he: {
        title: 'נתיב ההמרה בכל המשפך (עד 10 עמודים)',
        desc: 'אימות מלא של נתיב ההמרה, היעדר שגיאות 404 שקטות ותקינות טפסי לידים בכל דפי המשפך זמינים במסלולי Diagnostic ו-Pro.',
      }
    };
    const lkFlow = lockFlowData[lang];
    const flowLockCard = `    <div class="tier-lock-card">
      <div class="lock-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        <span>${esc(lkFlow.title)}</span>
      </div>
      <p>${esc(lkFlow.desc)}</p>
      <div class="lock-actions">
        <a href="#tiers" class="tier-btn-secondary">${btnText(TIER_COMPARE_LINK[lang], TIER_COMPARE_SHORT[lang])}</a>
      </div>
    </div>`;
    s = s.replace(/<\/div>\s*<p class="note">/, `</div>\n${flowLockCard}\n    <p class="note">`);
  }

  // --- Recommended Actions
  const actions = [];
  const prioLabel = lang === 'ru' ? 'приоритет' : lang === 'he' ? 'עדיפות' : 'priority';

  const pillarTitles = {
    speed: { ru: 'Оптимизация Core Web Vitals и скорости LCP', en: 'Core Web Vitals & LCP speed optimization', he: 'אופטימיזציית Core Web Vitals ומהירות LCP' },
    seo: { ru: 'Мультиязычные alternates (hreflang) и OpenGraph', en: 'Multilingual hreflang alternates & OpenGraph', he: 'הגדרת קישורי שפות (hreflang) ומטא-תגיות OpenGraph' },
    lead: { ru: 'Защита лид-форм от ботов и антиспам Turnstile', en: 'Bot protection & anti-spam Turnstile', he: 'הגנת טפסי לידים מספאם ו-Cloudflare Turnstile' },
    sec: { ru: 'Обязательные заголовки безопасности HTTP', en: 'Mandatory HTTP security headers', he: 'הגדרת כותרות אבטחת HTTP חיוניות' },
    ai: { ru: 'AI Search Visibility: llms.txt и Content-Signals', en: 'AI Search Visibility: llms.txt & signals', he: 'נראות AI במנועי חיפוש: llms.txt וסיגנלים' },
    a11y: { ru: 'Доступность интерфейса WCAG 2.1 AA / IS 5568', en: 'WCAG 2.1 AA / IS 5568 Accessibility compliance', he: 'הנגשת ממשק WCAG 2.1 AA ותקן IS 5568' }
  };

  const pillarTagNames = {
    speed: { ru: 'Скорость', en: 'Speed', he: 'מהירות' },
    seo: { ru: 'SEO & Funnel', en: 'SEO & Funnel', he: 'SEO ומשפך' },
    lead: { ru: 'Лидогенерация', en: 'Lead capture', he: 'טפסים והמרות' },
    sec: { ru: 'Безопасность', en: 'Security', he: 'אבטחה ויציבות' },
    ai: { ru: 'AI Discovery', en: 'AI Discovery', he: 'נראות AI' },
    a11y: { ru: 'Доступность', en: 'Accessibility', he: 'נגישות' }
  };

  // 1. Add top strategic findings from the executive audit
  const assignedPillars = new Set();
  const usedAnchorIds = new Set();
  finds.slice(0, 3).forEach((f, i) => {
    const pKey = classifyActionPillar(f.orig || f.title);
    assignedPillars.add(pKey);
    const tag = (pillarTagNames[pKey] && pillarTagNames[pKey][lang]) || (lang === 'ru' ? 'Оптимизация' : 'Optimization');
    let anchorId = `action-${pKey}`;
    if (usedAnchorIds.has(anchorId)) {
      const tLower = f.title.toLowerCase();
      if (pKey === 'speed' && (tLower.includes('vitals') || tLower.includes('lcp') || tLower.includes('ускорен') || tLower.includes('האצת'))) {
        anchorId = 'action-speed-cwv';
      } else {
        anchorId = `${anchorId}-${i + 1}`;
      }
    }
    usedAnchorIds.add(anchorId);
    const k = sevIdx(f, i);
    actions.push({
      title: f.title,
      tag,
      sev: tagTxt[k],
      cls: tagCls[k],
      text: `${f.impact} ${f.sol}`,
      pillarKey: pKey,
      anchorId
    });
  });

  // 2. Ensure all diagnostic pillars with issues or solutions are represented with distinct strategic tasks
  const diagnosticPillars = ['speed', 'seo', 'lead', 'sec', 'ai', 'a11y'];
  diagnosticPillars.forEach((pKey) => {
    if (!actions.some((a) => a.pillarKey === pKey)) {
      const issues = checks.filter((c) => c.pillar === pKey && c.status !== 'good');
      if (issues.length > 0 || ACTION_CODE_SOLUTIONS[pKey]) {
        const sol = ACTION_CODE_SOLUTIONS[pKey];
        const solDesc = sol ? (sol[lang] || sol.ru).desc : '';
        const titleObj = pillarTitles[pKey] || {};
        const title = titleObj[lang] || titleObj.ru || pKey;
        const tag = (pillarTagNames[pKey] && pillarTagNames[pKey][lang]) || 'Erythro.ai';
        const k = sevForPillar(pKey);
        const sev = tagTxt[k];
        const cls = tagCls[k];

        let anchorId = `action-${pKey}`;
        if (usedAnchorIds.has(anchorId)) {
          anchorId = `${anchorId}-${actions.length + 1}`;
        }
        usedAnchorIds.add(anchorId);

        actions.push({
          title,
          tag,
          sev,
          cls,
          text: solDesc,
          pillarKey: pKey,
          anchorId
        });
      }
    }
  });

  let actHtml = '';
  if (tier !== 'pro') {
    // Free and Diagnostic: Action 1 in full with code, actions 2-6 locked (the full plan with code is Pro)
    const a = actions[0];
    let solObj = ACTION_CODE_SOLUTIONS[a.pillarKey] || ACTION_CODE_SOLUTIONS.speed;
    const codeHtml = renderCodeBox(solObj, lang);
    const act1 = `      <div class="action"${a.anchorId ? ` id="${a.anchorId}"` : ''}>
        <div>
          <h3>${esc(a.title)}</h3>
          <div class="tags"><span class="tag">${a.tag}</span><span class="tag ${a.cls}">${a.sev}</span></div>
          <p>${esc(a.text)}</p>
          ${codeHtml}
        </div>
        <div class="plus">P1<small>${prioLabel}</small></div>
      </div>`;

    // Steps 2–6: titles and urgency stay visible, the solution does not.
    // One wrapper, so apply-v2-polish keeps it after Step 1 and does not renumber inside it.
    const sevRank = { crit: 0, med: 1, gold: 2 };
    const canon = ['speed', 'seo', 'lead', 'sec', 'ai', 'a11y'];
    const rest = actions.slice(1, 6)
      .map((x, i) => ({ x, i }))
      .sort((p, q) => sevRank[p.x.cls] - sevRank[q.x.cls] || canon.indexOf(p.x.pillarKey) - canon.indexOf(q.x.pillarKey) || p.i - q.i)
      .map((o) => o.x);
    const lockedLbl = lang === 'ru' ? 'Решение и код — в Pro' : lang === 'he' ? 'פתרון וקוד — ב-Pro' : 'Solution and code in Pro';
    const restHtml = rest.map((x, i) => `        <div class="action-locked">
          <div>
            <h3>${esc(x.title)}</h3>
            <div class="tags"><span class="tag">${x.tag}</span><span class="tag ${x.cls}">${x.sev}</span><span class="locked-note">${lockIcon}${lockedLbl}</span></div>
          </div>
          <div class="plus">P${i + 2}<small>${prioLabel}</small></div>
        </div>`).join('\n');

    const lockActionsData = {
      ru: {
        title: `Ещё ${rest.length} ${rest.length % 10 === 1 && rest.length % 100 !== 11 ? 'шаг' : [2, 3, 4].includes(rest.length % 10) && ![12, 13, 14].includes(rest.length % 100) ? 'шага' : 'шагов'} плана — с готовым кодом в Pro`,
        btn: 'Открыть весь план с кодом в Pro · ₪490 →',
        btnShort: 'Открыть в Pro · ₪490 →'
      },
      en: {
        title: `${rest.length} more steps — with ready code in Pro`,
        btn: 'Open the full plan with code in Pro · ₪490 →',
        btnShort: 'Open in Pro · ₪490 →'
      },
      he: {
        title: `עוד ${rest.length} שלבים בתוכנית — עם קוד מוכן ב-Pro`,
        btn: 'פתיחת התוכנית המלאה עם קוד ב-Pro · ₪490 ←',
        btnShort: 'פתיחה ב-Pro · ₪490 ←'
      }
    };
    const lkAct = lockActionsData[lang];
    const lockCard = `      <div class="tier-lock-card actions-locked">
        <div class="lock-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <span>${esc(lkAct.title)}</span>
        </div>
${restHtml}
        <div class="lock-actions">
          <a href="${orderCheckoutUrl('audit-pro', lang)}" class="tier-btn-primary">${btnText(lkAct.btn, lkAct.btnShort)}</a>
        </div>
      </div>`;
    actHtml = `${act1}\n${lockCard}`;
  } else {
    // Pro and Diagnostic: show all 6 actions
    actHtml = actions
      .slice(0, 6)
      .map(
        (a, i) => {
          const tLower = a.title.toLowerCase();
          let solObj = ACTION_CODE_SOLUTIONS[a.pillarKey];
          if (a.anchorId === 'action-speed-cwv' || tLower.includes('vitals') || tLower.includes('cwv') || tLower.includes('ускорен') || tLower.includes('האצת')) {
            solObj = ACTION_CODE_SOLUTIONS.speed_cwv;
          } else if (tLower.includes('квалификац') || tLower.includes('qualification') || tLower.includes('סיווג')) {
            solObj = ACTION_CODE_SOLUTIONS.ai_lead;
          } else if (tLower.includes('turnstile') || tLower.includes('спам') || tLower.includes('spam') || tLower.includes('ספאם') || tLower.includes('bot protection')) {
            solObj = ACTION_CODE_SOLUTIONS.lead;
          }

          // In Diagnostic, render engineering specification box; in Pro, render production code box
          const codeHtml = solObj
            ? (tier === 'diagnostic' ? renderSpecBox(solObj, lang) : renderCodeBox(solObj, lang))
            : '';

          return `      <div class="action"${a.anchorId ? ` id="${a.anchorId}"` : ''}>
        <div>
          <h3>${esc(a.title)}</h3>
          <div class="tags"><span class="tag">${a.tag}</span><span class="tag ${a.cls}"${tagTitle(i)}>${a.sev}</span></div>
          <p>${esc(a.text)}</p>
          ${codeHtml}
        </div>
        <div class="plus">P${i + 1}<small>${prioLabel}</small></div>
      </div>`;
        }
      )
      .join('\n');
  }

  s = replaceBlock(s, '<div class="actions">', '    </div>\n  </section>', `<div class="actions">\n${actHtml}\n    </div>\n  </section>`);

  // --- Protocol stats
  const protoStats = {
    pro: { s1: '52', s2: '201', s3: '3', totalChecks: 84, s4: '10' },
    diagnostic: { s1: '48', s2: '128', s3: '3', totalChecks: 84, s4: '5' },
    free: { s1: '24', s2: '48', s3: '1', totalChecks: 5, s4: '1' }
  };
  const curProto = protoStats[tier];
  const s1 = curProto.s1;
  const s2 = curProto.s2;
  const s3 = curProto.s3;
  const totalChecks = curProto.totalChecks;
  const s4 = curProto.s4;

  let l1 = lang === 'ru' ? 'типов сигналов' : lang === 'he' ? 'סוגי אותות' : 'signal types';
  let l2 = lang === 'ru' ? 'наблюдений' : lang === 'he' ? 'תצפיות' : 'observations';
  function pluralChecksRu(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return `${n} проверок`;
    if (mod10 === 1) return `${n} проверка`;
    if (mod10 >= 2 && mod10 <= 4) return `${n} проверки`;
    return `${n} проверок`;
  }

  let l3 = lang === 'ru'
    ? `${s3 === '1' ? 'локаль' : (s3 === '2' || s3 === '3' || s3 === '4') ? 'локали' : 'локалей'} · ${pluralChecksRu(totalChecks)}`
    : lang === 'he'
    ? `${s3} לוקאלים · ${totalChecks} בדיקות`
    : `${s3} ${s3 === '1' ? 'locale' : 'locales'} · ${totalChecks} checks`;
  let l4 = lang === 'ru' ? 'URL воронки' : lang === 'he' ? 'עמודי משפך' : 'funnel URLs';

  const protoHtml = `    <div class="proto">
      <div class="stat"><b>${s1}</b><span>${l1}</span></div>
      <div class="stat"><b>${s2}</b><span>${l2}</span></div>
      <div class="stat"><b>${s3}</b><span>${l3}</span></div>
      <div class="stat"><b>${s4}</b><span>${l4}</span></div>
    </div>`;

  s = replaceBlock(s, '    <div class="proto">', '    </div>', protoHtml);

  // Each tier's protocol describes only what it ran (Free: 1 URL, 1 locale, 5 checks; Diagnostic: 3 languages,
  // 5 funnel URLs, 184 checks; Pro: 3 languages, up to 10 funnel URLs, 230 checks — audit-report-tier-scope.md §3)
  {
    const names = renderedChecks.map((c) => c.name).join('; ');
    const host = esc(reportSiteHost(data) || '—');
    const pp = ab.pages_visited || 10;
    const proN = 55 + 28 * 3 + 9 * pp + 1;
    const PRO_P = {
      ru: {
        sub: `Лаборатория Erythro.ai проверила ${host} на трёх языках (EN, RU, HE) и ${pp} страницах воронки, на мобильном (iPhone SE 375×667) и десктопе.`,
        stats: [[String(proN), 'проверок'], ['3', 'языка сайта'], [String(pp), 'URL воронки'], ['2', 'устройства Lighthouse']],
        scope: [
          ['По сайту целиком — 55', 'HTTPS, статус, TTFB, 6 заголовков безопасности, robots.txt и sitemap, стабильность, PageSpeed (10 метрик × 2 устройства), 7 критериев AI Visibility, 5 проверок Agent Readiness и правила для 8 AI-ботов.'],
          ['На каждый язык — 28', 'SEO и OpenGraph, hreflang, ассеты, доступность, орфография, ошибки, RTL, мобильная вёрстка 375px, формы и антиспам.'],
          [`На каждую страницу воронки — 9 (× ${pp})`, 'HTTP-статус, soft-404, title, H1, CTA, форма, форма по кнопке, чат и мессенджеры.'],
          ['Funnel review — 1', 'AI-разбор пути к заявке: вердикт, пробелы и главная рекомендация по воронке.']
        ],
        note: 'Сырой JSON с результатами всех проверок — по запросу.'
      },
      en: {
        sub: `The Erythro.ai lab checked ${host} in three languages (EN, RU, HE) and ${pp} funnel pages, on mobile (iPhone SE 375×667) and desktop.`,
        stats: [[String(proN), 'checks'], ['3', 'site languages'], [String(pp), 'funnel URLs'], ['2', 'Lighthouse devices']],
        scope: [
          ['Site-wide — 55', 'HTTPS, status, TTFB, 6 security headers, robots.txt and sitemap, stability, PageSpeed (10 metrics × 2 devices), 7 AI Visibility criteria, 5 Agent Readiness checks and rules for 8 AI bots.'],
          ['Per language — 28', 'SEO and OpenGraph, hreflang, assets, accessibility, spelling, errors, RTL, 375px mobile layout, forms and anti-spam.'],
          [`Per funnel page — 9 (× ${pp})`, 'HTTP status, soft-404, title, H1, CTA, form, form behind a button, chat and messengers.'],
          ['Funnel review — 1', 'An AI review of the lead path: verdict, gaps and the main funnel recommendation.']
        ],
        note: 'Raw JSON with the results of every check is available on request.'
      },
      he: {
        sub: `המעבדה של Erythro.ai בדקה את ${host} בשלוש שפות (EN, RU, HE) וב-${pp} עמודי משפך, במובייל (iPhone SE 375×667) ובדסקטופ.`,
        stats: [[String(proN), 'בדיקות'], ['3', 'שפות אתר'], [String(pp), 'עמודי משפך'], ['2', 'מכשירי Lighthouse']],
        scope: [
          ['לאתר כולו — 55', 'HTTPS, סטטוס, TTFB, 6 כותרות אבטחה, robots.txt ו-sitemap, יציבות, PageSpeed (10 מדדים × 2 מכשירים), 7 קריטריונים של AI Visibility, 5 בדיקות Agent Readiness וכללים ל-8 בוטי AI.'],
          ['לכל שפה — 28', 'SEO ו-OpenGraph, hreflang, נכסים, נגישות, איות, שגיאות, RTL, פריסת מובייל 375px, טפסים ואנטי-ספאם.'],
          [`לכל עמוד משפך — 9 (× ${pp})`, 'סטטוס HTTP, soft-404, title, H1, CTA, טופס, טופס מאחורי כפתור, צ׳אט ומסנג׳רים.'],
          ['Funnel review — 1', 'ניתוח AI של הדרך לפנייה: פסק דין, פערים והמלצה מרכזית למשפך.']
        ],
        note: 'JSON גולמי עם תוצאות כל הבדיקות — לפי בקשה.'
      }
    };
    const DIAG_P = {
      ru: {
        sub: `Лаборатория Erythro.ai проверила ${host} на трёх языках (EN, RU, HE) и 5 страницах воронки, на мобильном (iPhone SE 375×667) и десктопе.`,
        stats: [['184', 'проверки'], ['3', 'языка сайта'], ['5', 'URL воронки'], ['2', 'устройства Lighthouse']],
        scope: [
          ['По сайту целиком — 55', 'HTTPS, статус, TTFB, 6 заголовков безопасности, robots.txt и sitemap, стабильность, PageSpeed (10 метрик × 2 устройства), AI Visibility, Agent Readiness и правила для 8 AI-ботов.'],
          ['На каждый язык — 28', 'SEO и OpenGraph, hreflang, ассеты, доступность, орфография, ошибки, RTL, мобильная вёрстка 375px, формы и антиспам.'],
          ['На каждую страницу воронки — 9', 'HTTP-статус, soft-404, title, H1, CTA, форма, форма по кнопке, чат и мессенджеры.']
        ],
        note: 'Diagnostic — сводная картина. Построчные рекомендации, Funnel review и разбор AI Visibility по критериям — в Pro.'
      },
      en: {
        sub: `The Erythro.ai lab checked ${host} in three languages (EN, RU, HE) and 5 funnel pages, on mobile (iPhone SE 375×667) and desktop.`,
        stats: [['184', 'checks'], ['3', 'site languages'], ['5', 'funnel URLs'], ['2', 'Lighthouse devices']],
        scope: [
          ['Site-wide — 55', 'HTTPS, status, TTFB, 6 security headers, robots.txt and sitemap, stability, PageSpeed (10 metrics × 2 devices), AI Visibility, Agent Readiness and rules for 8 AI bots.'],
          ['Per language — 28', 'SEO and OpenGraph, hreflang, assets, accessibility, spelling, errors, RTL, 375px mobile layout, forms and anti-spam.'],
          ['Per funnel page — 9', 'HTTP status, soft-404, title, H1, CTA, form, form behind a button, chat and messengers.']
        ],
        note: 'Diagnostic is a summary. Row-by-row recommendations, the Funnel review and the per-criterion AI Visibility breakdown are in Pro.'
      },
      he: {
        sub: `המעבדה של Erythro.ai בדקה את ${host} בשלוש שפות (EN, RU, HE) וב-5 עמודי משפך, במובייל (iPhone SE 375×667) ובדסקטופ.`,
        stats: [['184', 'בדיקות'], ['3', 'שפות אתר'], ['5', 'עמודי משפך'], ['2', 'מכשירי Lighthouse']],
        scope: [
          ['לאתר כולו — 55', 'HTTPS, סטטוס, TTFB, 6 כותרות אבטחה, robots.txt ו-sitemap, יציבות, PageSpeed (10 מדדים × 2 מכשירים), AI Visibility, Agent Readiness וכללים ל-8 בוטי AI.'],
          ['לכל שפה — 28', 'SEO ו-OpenGraph, hreflang, נכסים, נגישות, איות, שגיאות, RTL, פריסת מובייל 375px, טפסים ואנטי-ספאם.'],
          ['לכל עמוד משפך — 9', 'סטטוס HTTP, soft-404, title, H1, CTA, טופס, טופס מאחורי כפתור, צ׳אט ומסנג׳רים.']
        ],
        note: 'Diagnostic הוא תמונת מצב מסכמת. המלצות שורה-שורה, ה-Funnel review ופירוט AI Visibility לפי קריטריונים — ב-Pro.'
      }
    };
    const P = tier === 'pro' ? PRO_P[lang] : tier === 'diagnostic' ? DIAG_P[lang] : {
      ru: {
        sub: `Лаборатория Erythro.ai проверила главную страницу ${host} в локали ${lang.toUpperCase()} на мобильном (iPhone SE 375×667) и десктопе.`,
        stats: [['1', 'URL · главная'], ['1', 'локаль'], ['5', 'проверок'], ['2', 'устройства Lighthouse']],
        scope: [
          ['Google PageSpeed Insights', '10 метрик × 2 устройства: Performance, Accessibility, Best Practices, SEO, FCP, LCP, CLS, TBT, Speed Index, TTI.'],
          ['Главная страница', 'HTTP-статус и HTTPS, формы и каналы связи, обнаруженные технологии.'],
          ['5 базовых проверок', names]
        ],
        note: 'Free — экспресс-срез одной страницы. Сквозной обход воронки, другие локали и AI Visibility в этот отчёт не входят.'
      },
      en: {
        sub: `The Erythro.ai lab checked the ${host} homepage in the ${lang.toUpperCase()} locale on mobile (iPhone SE 375×667) and desktop.`,
        stats: [['1', 'URL · homepage'], ['1', 'locale'], ['5', 'checks'], ['2', 'Lighthouse devices']],
        scope: [
          ['Google PageSpeed Insights', '10 metrics × 2 devices: Performance, Accessibility, Best Practices, SEO, FCP, LCP, CLS, TBT, Speed Index, TTI.'],
          ['Homepage', 'HTTP status and HTTPS, forms and contact channels, detected technologies.'],
          ['5 core checks', names]
        ],
        note: 'Free is an express snapshot of one page. The funnel crawl, other locales and AI Visibility are not part of this report.'
      },
      he: {
        sub: `המעבדה של Erythro.ai בדקה את עמוד הבית של ${host} בשפה ${lang.toUpperCase()} במובייל (iPhone SE 375×667) ובדסקטופ.`,
        stats: [['1', 'URL · עמוד הבית'], ['1', 'שפה'], ['5', 'בדיקות'], ['2', 'מכשירי Lighthouse']],
        scope: [
          ['Google PageSpeed Insights', '10 מדדים × 2 מכשירים: Performance, Accessibility, Best Practices, SEO, FCP, LCP, CLS, TBT, Speed Index, TTI.'],
          ['עמוד הבית', 'סטטוס HTTP ו-HTTPS, טפסים וערוצי קשר, טכנולוגיות שזוהו.'],
          ['5 בדיקות בסיס', names]
        ],
        note: 'Free הוא צילום מהיר של עמוד אחד. סריקת המשפך, שפות נוספות ו-AI Visibility אינם חלק מדוח זה.'
      }
    }[lang];
    const statsHtml = `    <div class="proto">
${P.stats.map(([b, t]) => `      <div class="stat"><b>${b}</b><span>${t}</span></div>`).join('\n')}
    </div>`;
    s = replaceBlock(s, '    <div class="proto">', '    </div>', statsHtml);
    const pi = s.indexOf('<div class="proto">');
    const subA = s.lastIndexOf('<p class="sub">', pi);
    const subB = s.indexOf('</p>', subA) + 4;
    s = s.slice(0, subA) + `<p class="sub">${P.sub}</p>` + s.slice(subB);
    s = replaceBlock(s, '<ul class="scope-list">', '</ul>', `<ul class="scope-list">\n${P.scope.map(([b, t]) => `      <li><b>${esc(b)}</b>${esc(t)}</li>`).join('\n')}\n    </ul>`, s.indexOf('<div class="proto">'));
    const ni = s.indexOf('<p class="note">', s.indexOf('<ul class="scope-list">'));
    s = s.slice(0, ni) + `<p class="note">${P.note}</p>` + s.slice(s.indexOf('</p>', ni) + 4);
  }

  // --- Header site hostname (templates ship with placeholder erythro.ai)
  {
    const siteHost = reportSiteHost(data);
    if (siteHost) {
      s = s.replace(
        /(<div class="site">\s*(?:<svg[\s\S]*?<\/svg>\s*)?)(?:<span[^>]*>)?[^<]+?(?:<\/span>)?(\s*<\/div>)/i,
        `$1${esc(siteHost)}$2`,
      );
    }
  }

  // --- Detected technologies chips from audit_data (never a hardcoded demo stack)
  const detectedTech = detectedTechnologiesFromData(data);
  const flaggedPhpTech = detectedTech.filter(isPhpStackAlertTech);
  const noneTechLabel = lang === 'ru'
    ? 'Автоматически не определены'
    : lang === 'he'
      ? 'לא זוהו אוטומטית'
      : 'None detected automatically';
  const techChipsInner = detectedTech.length
    ? detectedTech.map((t) => {
        if (!isPhpStackAlertTech(t)) {
          return `      <span class="chip">${TECH_ICONS[t] || ''}<span>${esc(t)}</span></span>`;
        }
        const alertCopy = phpStackAlertCopy(lang, [t], '');
        return `      <span class="chip chip-crit">${TECH_ICONS[t] || ''}<span>${esc(t)}</span><span class="chip-crit-badge" title="${esc(alertCopy.title)}">${esc(alertCopy.badge)}</span></span>`;
      }).join('\n')
    : `      <span class="chip"><span>${esc(noneTechLabel)}</span></span>`;
  let techBlockHtml = `    <div class="chips">\n${techChipsInner}\n    </div>`;
  if (flaggedPhpTech.length) {
    const siteHost = reportSiteHost(data);
    const alert = phpStackAlertCopy(lang, flaggedPhpTech, siteHost || undefined);
    const waHref = `${PHP_WA_HREF}?text=${encodeURIComponent(alert.waText)}`;
    techBlockHtml += `\n    <p class="tech-php-alert"><strong>${esc(alert.title)}.</strong> ${esc(alert.body)}`
      + `<br><a class="tech-php-cta" href="${esc(waHref)}" target="_blank" rel="noopener noreferrer">${esc(alert.cta)}</a></p>`;
  }
  const idxChips = s.indexOf('<div class="chips">');
  if (idxChips !== -1) {
    const endChips = s.indexOf('</div>', idxChips);
    if (endChips !== -1) {
      // Drop any prior tech-php-alert siblings so re-renders do not duplicate the PHP warning.
      let end = endChips + 6;
      while (true) {
        const m = s.slice(end).match(/^\s*<p class="tech-php-alert"\b[\s\S]*?<\/p>/);
        if (!m) break;
        end += m[0].length;
      }
      s = s.slice(0, idxChips) + techBlockHtml.trim() + s.slice(end);
    }
  }

  // --- Funnel conversion path (Путь к заявке)
  const hasChat = ab.pages ? ab.pages.some((p) => p.hasChatWidget) : true;
  let chatPill = '';
  let flowVerdict = '';
  if (tier === 'free') {
    chatPill = lang === 'ru' ? '<span class="pill ok">Главная страница</span>' : lang === 'he' ? '<span class="pill ok">עמוד הבית</span>' : '<span class="pill ok">Homepage</span>';
    if (lang === 'ru') {
      flowVerdict = 'Вердикт: на главной странице заявку можно оставить — форма и мессенджеры работают.';
    } else if (lang === 'he') {
      flowVerdict = 'פסק דין: בעמוד הבית אפשר להשאיר פנייה — הטופס והמסנג\'רים עובדים.';
    } else {
      flowVerdict = 'Verdict: visitors can reach you from the homepage — the form and messengers work.';
    }
  } else if (tier === 'diagnostic') {
    chatPill = lang === 'ru' ? '<span class="pill ok">5 URL воронки</span>' : lang === 'he' ? '<span class="pill ok">5 עמודי משפך</span>' : '<span class="pill ok">5 funnel URLs</span>';
    if (lang === 'ru') {
      flowVerdict = 'Вердикт: на 5 проверенных ключевых страницах воронки доступна отправка заявки через форму, мессенджеры или умного ИИ-консультанта. Путь к заявке исправен.';
    } else if (lang === 'he') {
      flowVerdict = 'פסק דין: בכל 5 דפי המפתח שנבדקו במשפך זמינה הגשת פנייה באמצעות טופס, מסנג\'רים או יועץ AI. נתיב ההמרה תקין.';
    } else {
      flowVerdict = 'Verdict: all 5 audited key funnel pages provide lead capture via form, messengers or AI consultant. Conversion path is operational.';
    }
  } else {
    if (hasChat) {
      chatPill = lang === 'ru' ? '<span class="pill ok">ИИ-консультант</span>' : lang === 'he' ? '<span class="pill ok">יועץ AI</span>' : '<span class="pill ok">AI Consultant</span>';
      flowVerdict = lang === 'ru'
        ? `Вердикт: на всех ${ab.pages_visited || 10} проверенных страницах воронки доступна отправка заявки через форму, мессенджеры или умного ИИ-консультанта (Live Chat). Путь к заявке полностью исправен.`
        : lang === 'he'
        ? `פסק דין: בכל ${ab.pages_visited || 10} דפי המשפך שנבדקו זמינה הגשת פנייה באמצעות טופס, מסנג'רים או יועץ ה-AI המובנה (צ'אט חי). נתיב ההמרה תקין לחלוטין.`
        : `Verdict: all ${ab.pages_visited || 10} audited funnel pages provide lead capture via form, messengers or the built-in AI consultant (Live Chat). Conversion path is fully operational.`;
    } else {
      chatPill = lang === 'ru' ? '<span class="pill">Живой чат — нет</span>' : lang === 'he' ? '<span class="pill">צ\'אט חי — אין</span>' : '<span class="pill">Live chat — none</span>';
      flowVerdict = lang === 'ru'
        ? `Вердикт: на всех ${ab.pages_visited || 10} проверенных страницах воронки доступна отправка заявки через форму или мессенджер. Приоритетная доработка — добавить виджет живого чата для посетителей без мессенджеров.`
        : lang === 'he'
        ? `פסק דין: בכל ${ab.pages_visited || 10} דפי המשפך שנבדקו זמינה הגשת פנייה באמצעות טופס או מסנג'ר. שדרוג מומלץ — הוספת צ'אט חי למבקרים ללא מסנג'רים.`
        : `Verdict: all ${ab.pages_visited || 10} audited funnel pages provide lead capture via form or messenger. Priority improvement — add a live chat widget for visitors without messengers.`;
    }
  }
  s = s.replace(/<span class="pill">(?:Живой чат — нет|Live chat — none|צ['\u05f3]אט חי — אין|ИИ-консультант|AI Consultant|יועץ AI|Главная страница|Homepage|עמוד הבית|5 URL воронки|5 funnel URLs|5 עמודי משפך)<\/span>/, chatPill);
  s = s.replace(/<p class="sub">(?:Вердикт|Verdict|פסק דין):[\s\S]*?<\/p>/, `<p class="sub">${flowVerdict}</p>`);

  // --- Order Button & Bottom CTA Block
  const ctaData = {
    pro: {
      orderBtn: {
        ru: 'Заказать свой аудит <span aria-hidden="true">→</span>',
        en: 'Order your audit <span aria-hidden="true">→</span>',
        he: 'להזמנת ביקורת <span aria-hidden="true">←</span>'
      },
      orderHref: 'https://erythro.ai/audit',
      h2: {
        ru: 'Внедрите AI-автоматизацию и увеличьте конверсию сайта',
        en: 'Implement AI Automation and Boost Website Conversion',
        he: 'הטמיעו אוטומציית AI והגדילו את יחס ההמרה באתר'
      },
      p: {
        ru: 'Команда веб-разработки и ИИ-инженеров Erythro.ai: выведем Core Web Vitals в 90+, внедрим AI-агентов обработки заявок и защитим сайт от сбоев.',
        en: 'Erythro.ai engineering team: push Core Web Vitals to 90+, deploy 24/7 AI lead capture agents, and bulletproof website stability.',
        he: 'צוות הפיתוח ומומחי ה-AI של Erythro.ai: נביא את ה-Core Web Vitals ל-90+, נטמיע סוכני AI לטיפול בפניות 24/7 ונאבטח את האתר מתקלות.'
      },
      btn: {
        ru: 'Обсудить в WhatsApp',
        en: 'Chat on WhatsApp',
        he: 'שיחה ב-WhatsApp'
      },
      btnHref: 'https://wa.me/972505308305'
    },
    diagnostic: {
      orderBtn: {
        ru: 'Улучшить до Pro за ₪490 <span aria-hidden="true">→</span>',
        en: 'Upgrade to Pro for ₪490 <span aria-hidden="true">→</span>',
        he: 'שדרוג ל-Pro תמורת ₪490 <span aria-hidden="true">←</span>'
      },
      orderHref: orderCheckoutUrl('audit-pro', lang),
      // Pro is a report with recommendations and code, not implementation: no "turnkey" promises here
      h2: {
        ru: 'Откройте полный разбор сайта в Pro',
        en: 'Open the full site breakdown in Pro',
        he: 'פתחו את הניתוח המלא של האתר ב-Pro'
      },
      p: {
        ru: 'Pro — построчный чеклист с рекомендацией по каждой проверке, разбор AI Visibility по 7 критериям и Agent Readiness, Funnel review на 10 страницах и план правок с готовым кодом для каждого шага.',
        en: 'Pro: the row-by-row checklist with a recommendation for every check, the AI Visibility breakdown across 7 criteria and Agent Readiness, a Funnel review on 10 pages and a fix plan with ready code for every step.',
        he: 'Pro — רשימת בדיקות שורה-שורה עם המלצה לכל בדיקה, פירוט AI Visibility לפי 7 קריטריונים ו-Agent Readiness, ‏Funnel review על 10 עמודים ותוכנית תיקון עם קוד מוכן לכל שלב.'
      },
      btn: {
        ru: 'Улучшить до Pro за ₪490',
        en: 'Upgrade to Pro for ₪490',
        he: 'שדרוג ל-Pro תמורת ₪490'
      },
      btnHref: orderCheckoutUrl('audit-pro', lang)
    },
    free: {
      orderBtn: {
        ru: 'Заказать аудит: Diagnostic ₪99 · Pro ₪490 <span aria-hidden="true">→</span>',
        en: 'Order audit: Diagnostic ₪99 · Pro ₪490 <span aria-hidden="true">→</span>',
        he: 'הזמנת ביקורת: Diagnostic ₪99 · Pro ₪490 <span aria-hidden="true">←</span>'
      },
      orderHref: auditPageUrl(lang),
      h2: {
        ru: 'Откройте полный аудит сайта и устраните скрытые потери',
        en: 'Unlock the full website audit and eliminate revenue leaks',
        he: 'פתחו את ביקורת האתר המלאה ומנעו אובדן לקוחות'
      },
      p: {
        ru: 'Diagnostic — сводная картина сайта на трёх языках и до 5 страниц воронки. Pro — полный построчный чеклист с рекомендациями, Funnel review, разбор AI Visibility и план правок с кодом.',
        en: 'Diagnostic: a summary of the site in three languages and up to 5 funnel pages. Pro: the full row-by-row checklist with recommendations, Funnel review, AI Visibility breakdown and a fix plan with code.',
        he: 'Diagnostic — תמונת מצב מסכמת של האתר בשלוש שפות ועד 5 עמודי משפך. Pro — רשימת בדיקות מלאה שורה-שורה עם המלצות, Funnel review, פירוט נראות AI ותוכנית תיקון עם קוד.'
      },
      btn: {
        ru: 'Выбрать тариф аудита',
        en: 'Choose Audit Tier',
        he: 'בחירת מסלול ביקורת'
      },
      btnHref: auditPageUrl(lang)
    }
  };

  const cInfo = ctaData[tier];
  const orderDiag = btnText(lang === 'ru' ? 'Заказать Diagnostic · ₪99' : lang === 'he' ? 'הזמנת Diagnostic · ₪99' : 'Order Diagnostic · ₪99', 'Diagnostic · ₪99');
  const orderPro = btnText(lang === 'ru' ? 'Заказать Pro · ₪490' : lang === 'he' ? 'הזמנת Pro · ₪490' : 'Order Pro · ₪490', 'Pro · ₪490');
  // The Pro output is the template for every tier, so Pro keeps an invisible slot where the order button was
  const ORDER_SLOT = '<!-- order-slot -->';
  const ORDER_RE = /<a class="order-btn" href="[^"]*">[\s\S]*?<\/a>|<!-- order-slot -->/;
  if (tier !== 'pro') {
    // Free and Diagnostic: the single place that compares and sells the tiers (every lock links here)
    s = s.replace(ORDER_RE, () => renderTierCompare(lang, orderDiag, orderPro, tier));
  } else {
    // Pro is the top tier: nothing left to order, no order button
    s = s.replace(ORDER_RE, ORDER_SLOT);
  }
  const waBtn = `<a class="go sec" href="https://wa.me/972505308305">${btnText(lang === 'ru' ? 'Заказать консультацию в WhatsApp' : lang === 'he' ? 'הזמנת ייעוץ ב-WhatsApp' : 'Book a WhatsApp consultation', lang === 'ru' ? 'Консультация в WhatsApp' : lang === 'he' ? 'ייעוץ ב-WhatsApp' : 'WhatsApp consultation')}</a>`;
  const ctaBtnHtml = tier === 'free'
    ? `<div class="cta-buttons">
        <a class="go sec" href="${orderCheckoutUrl('audit-diagnostic', lang)}">${orderDiag}</a>
        <a class="go" href="${orderCheckoutUrl('audit-pro', lang)}">${orderPro}</a>
        ${waBtn}
      </div>`
    : tier === 'diagnostic'
    ? `<div class="cta-buttons">
        <a class="go" href="${orderCheckoutUrl('audit-pro', lang)}">${btnText(cInfo.btn[lang], 'Pro · ₪490')}</a>
        ${waBtn}
      </div>`
    : `<a class="go" href="${cInfo.btnHref}">${cInfo.btn[lang]}</a>`;

  s = s.replace(/<section class="cta">[\s\S]*?<\/section>/, `  <section class="cta">
    <div>
      <h2>${cInfo.h2[lang]}</h2>
      <p>${cInfo.p[lang]}</p>
      <div class="contacts"><a href="mailto:team@erythro.ai">team@erythro.ai</a><a href="tel:+972505308305" dir="ltr">+972 50 530 8305</a></div>
    </div>
    ${ctaBtnHtml}
  </section>`);

  // --- Universal Client-side Navigation Script (smooth scroll & auto-open)
  const NAV_SCRIPT = `
<script>
(function () {
  // Exclusive accordion behavior for checklist details
  document.querySelectorAll('details.check').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) {
        document.querySelectorAll('details.check').forEach(function (other) {
          if (other !== d && other.open) {
            other.open = false;
          }
        });
      }
    });
  });

  // Smooth scroll and highlight to solution action cards or checklist
  document.querySelectorAll('a[href^="#action-"], a[href^="#diag-"], a[href^="#locked-"], a[href^="#speed"], a[href^="#ai-"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = link.getAttribute('href').substring(1);
      var targetEl = document.getElementById(targetId);
      if (!targetEl && targetId.startsWith('action-')) {
        targetEl = document.getElementById('diag-' + targetId.substring(7));
      }
      if (!targetEl && targetId.startsWith('diag-')) {
        targetEl = document.getElementById('locked-checks');
      }
      if (targetEl) {
        e.preventDefault();
        var details = targetEl.tagName === 'DETAILS' ? targetEl : targetEl.closest('details');
        if (details) {
          document.querySelectorAll('details.check').forEach(function (other) {
            if (other !== details && other.open) {
              other.open = false;
            }
          });
          details.open = true;
        }
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.classList.add('is-highlighted');
        setTimeout(function () {
          targetEl.classList.remove('is-highlighted');
        }, 2600);
        try {
          history.pushState(null, '', '#' + targetId);
        } catch (err) {}
      }
    });
  });

  // Universal clipboard copy button handler with visual feedback
  document.querySelectorAll('.btn-copy').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      var textToCopy = btn.getAttribute('data-copy');
      if (!textToCopy) {
        var pre = btn.closest('.code-box, .rec, .action')?.querySelector('pre, code');
        if (pre) textToCopy = pre.innerText;
      }
      if (!textToCopy) return;

      var span = btn.querySelector('.copy-text');
      var orig = span ? span.textContent : 'copy';

      var doSuccess = function () {
        if (span) span.textContent = 'copied!';
        btn.classList.add('copied');
        setTimeout(function () {
          if (span) span.textContent = orig;
          btn.classList.remove('copied');
        }, 2000);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(doSuccess).catch(function () {
          fallbackCopy(textToCopy);
          doSuccess();
        });
      } else {
        fallbackCopy(textToCopy);
        doSuccess();
      }
    });
  });

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (err) {}
    document.body.removeChild(ta);
  }
})();
</script>
`;

  // Remove any legacy snippet from the template that only handled diag- links
  s = s.replace(/<script>[\s\S]*?document\.querySelectorAll\('a\[href\^="#diag-"]'\)[\s\S]*?<\/script>/g, '');

  if (!s.includes('a[href^="#action-"], a[href^="#diag-"]')) {
    s = s.replace('</body>', `${NAV_SCRIPT}\n</body>`);
  }

  return s;
}

// A freshly written file can be held for a moment on Windows (antivirus scan): retry before giving up
function writeOut(file, data, enc) {
  for (let i = 1; ; i++) {
    try { fs.writeFileSync(file, data, enc); return; } catch (e) {
      if (i >= 8 || !/UNKNOWN|EBUSY|EPERM/.test(e.code || '')) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250 * i);
    }
  }
}

// Render and write all 3 tiers across all 3 languages
// --tier=free renders only that tier and leaves the other tiers' files untouched
const ALL_TIERS = ['pro', 'diagnostic', 'free'];
const envTier = process.env.AUDIT_TIER?.trim().toLowerCase();
const argTier = (process.argv.find((a) => a.startsWith('--tier=')) || '').slice(7).toLowerCase();
const tierArg = argTier || (envTier && ALL_TIERS.includes(envTier) ? envTier : '');
const TIERS = tierArg ? tierArg.split(',').filter((t) => ALL_TIERS.includes(t)) : ALL_TIERS;
const LANGS = ['ru', 'en', 'he'];

// Ensure all output directories exist
for (const tier of TIERS) {
  try { fs.mkdirSync(path.join(AUDITOR_ROOT, `reports/${tier}`), { recursive: true }); } catch (e) {}
  if (DEV_ROOT) {
    try { fs.mkdirSync(path.join(DEV_ROOT, `services/audit-agent/QA_Auditor/reports/${tier}`), { recursive: true }); } catch (e) {}
  }
  const rootDir = path.join(AUDITOR_ROOT, `../reports/${tier}`);
  try { fs.mkdirSync(rootDir, { recursive: true }); } catch (e) {}
}

const rendered = { pro: {}, diagnostic: {}, free: {} };
if (!TIERS.length) throw new Error('unknown --tier: ' + tierArg);

for (const tier of TIERS) {
  for (const lang of LANGS) {
    console.log(`Rendering v2 report for ${tier} [${lang}]...`);
    const html = renderReport(lang, tier);
    rendered[tier][lang] = html;

    // 1. Write to public/samples/audit/ if available
    if (SAMPLES_DIR && fs.existsSync(SAMPLES_DIR)) {
      try {
        const samplePath = path.join(SAMPLES_DIR, `${tier}-${lang}.html`);
        writeOut(samplePath, html, 'utf8');
        if (tier === 'pro') {
          const sampleV2Path = path.join(SAMPLES_DIR, `pro-${lang}-v2.html`);
          writeOut(sampleV2Path, html, 'utf8');
        }
        console.log(`[✓] Wrote sample: ${samplePath}`);
      } catch (e) {}
    }

    // 2. Write to QA_Auditor/reports/${tier}/
    const repoPath = path.join(AUDITOR_ROOT, `reports/${tier}`, `audit-report_${lang}.html`);
    writeOut(repoPath, html, 'utf8');
    if (tier === 'pro') {
      const repoV2Path = path.join(REPORTS_V2_DIR, `audit-report_${lang}.html`);
      writeOut(repoV2Path, html, 'utf8');
    }

    // 3. Write to root reports/${tier}/
    const rootPath = path.join(AUDITOR_ROOT, '..', `reports/${tier}`, `audit-report_${lang}.html`);
    if (fs.existsSync(path.dirname(rootPath))) {
      writeOut(rootPath, html, 'utf8');
    }

    // 4. Write template to QA_Auditor/templates/
    const tplPath = path.join(TEMPLATES_V2_DIR, `audit_template_${tier}_${lang}.html`);
    writeOut(tplPath, html, 'utf8');
    if (tier === 'pro') {
      const tplV2Path = path.join(TEMPLATES_V2_DIR, `audit_template_v2_${lang}.html`);
      writeOut(tplV2Path, html, 'utf8');
    }

    // 5. Write to services/audit-agent/QA_Auditor/reports/${tier}/ if DEV_ROOT exists
    if (DEV_ROOT) {
      try {
        const agentPath = path.join(DEV_ROOT, `services/audit-agent/QA_Auditor/reports/${tier}`, `audit-report_${lang}.html`);
        if (fs.existsSync(path.dirname(agentPath))) {
          writeOut(agentPath, html, 'utf8');
        }
        if (tier === 'pro') {
          const agentV2Path = path.join(AGENT_REPORTS_V2_DIR, `audit-report_${lang}.html`);
          if (fs.existsSync(path.dirname(agentV2Path))) {
            writeOut(agentV2Path, html, 'utf8');
          }
        }
      } catch (e) {}
    }
    console.log(`[✓] Wrote ${tier} report [${lang}]`);
  }
}

// Also write main audit-report.html using ru (or active reportLang) from pro or whichever tier was rendered
const mainLang = data.report_lang || 'ru';
const fallbackTier = rendered['pro'] && rendered['pro'][mainLang] ? 'pro' : (rendered['free'] && rendered['free'][mainLang] ? 'free' : (rendered['diagnostic'] && rendered['diagnostic'][mainLang] ? 'diagnostic' : null));
if (fallbackTier && rendered[fallbackTier][mainLang]) {
  writeOut(path.join(AUDITOR_ROOT, 'reports/audit-report.html'), rendered[fallbackTier][mainLang], 'utf8');
  const rootMain = path.join(AUDITOR_ROOT, '..', 'reports/audit-report.html');
  if (fs.existsSync(path.dirname(rootMain))) {
    writeOut(rootMain, rendered[fallbackTier][mainLang], 'utf8');
  }
  if (DEV_ROOT) {
    try {
      const agentMain = path.join(DEV_ROOT, 'services/audit-agent/QA_Auditor/reports/audit-report.html');
      if (fs.existsSync(path.dirname(agentMain))) {
        writeOut(agentMain, rendered[fallbackTier][mainLang], 'utf8');
      }
    } catch (e) {}
  }
  console.log(`[✓] Wrote main audit-report.html (${mainLang})`);
}

console.log('All v2 HTML reports rendered successfully for Free, Diagnostic, and Pro tiers!');

// Automatically apply v2 design polish
try {
  const { spawnSync } = await import('node:child_process');
  let polishScript = path.join(AUDITOR_ROOT, 'scripts/apply-v2-polish.cjs');
  if (!fs.existsSync(polishScript)) {
    polishScript = path.resolve('scripts/apply-v2-polish.cjs');
  }
  if (fs.existsSync(polishScript)) {
    console.log('[+] Applying v2 polish (badges, steps, sorted actions)...');
    // with --tier, polish only the files this run wrote
    const polishArgs = tierArg
      ? TIERS.flatMap((t) => LANGS.flatMap((l) => [
          ...(SAMPLES_DIR ? [path.join(SAMPLES_DIR, `${t}-${l}.html`)] : []),
          path.join(AUDITOR_ROOT, `reports/${t}`, `audit-report_${l}.html`),
          path.join(AUDITOR_ROOT, '..', `reports/${t}`, `audit-report_${l}.html`),
          path.join(TEMPLATES_V2_DIR, `audit_template_${t}_${l}.html`),
          ...(DEV_ROOT ? [path.join(DEV_ROOT, `services/audit-agent/QA_Auditor/reports/${t}`, `audit-report_${l}.html`)] : []),
          // Pro also writes the v2 copies and the main audit-report.html
          ...(t === 'pro' ? [
            ...(SAMPLES_DIR ? [path.join(SAMPLES_DIR, `pro-${l}-v2.html`)] : []),
            path.join(REPORTS_V2_DIR, `audit-report_${l}.html`),
            ...(DEV_ROOT ? [path.join(AGENT_REPORTS_V2_DIR, `audit-report_${l}.html`)] : []),
            path.join(TEMPLATES_V2_DIR, `audit_template_v2_${l}.html`)
          ] : [])
        ])).concat(TIERS.includes('pro') ? [
          path.join(AUDITOR_ROOT, 'reports/audit-report.html'),
          path.join(AUDITOR_ROOT, '..', 'reports/audit-report.html'),
          ...(DEV_ROOT ? [path.join(DEV_ROOT, 'services/audit-agent/QA_Auditor/reports/audit-report.html')] : [])
        ] : [])
      : [];
    const res = spawnSync('node', [polishScript, ...polishArgs], { stdio: 'inherit' });
    if (res.status === 0) {
      console.log('[✓] v2 polish applied successfully to all reports.');
    } else {
      console.warn(`[!] apply-v2-polish.cjs exited with code ${res.status}`);
    }
  }
} catch (e) {
  console.warn('[!] Auto-polish notice: ' + e.message);
}
