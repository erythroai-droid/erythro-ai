# Playbook: Многоязычный сайт на Next.js + Payload CMS

Документ-сценарий для базы знаний. Описывает, **что было сделано** в проекте Erythro.ai и
**как повторить** тот же путь в новых проектах. Подходит для маркетинговых сайтов / лендингов,
где весь контент редактируется из админки и есть несколько языков, а деплой идёт на Vercel.

---

## 1. Стек

| Слой | Технология |
|---|---|
| Фреймворк | Next.js 15 (App Router) |
| CMS | Payload CMS 3.x (встроена в Next, общая кодовая база) |
| БД | PostgreSQL (`@payloadcms/db-postgres`) |
| Стили | Tailwind CSS 4 + точечный кастомный CSS |
| Анимации | GSAP + ScrollTrigger |
| i18n | Локализация Payload (`en`/`ru`/`he`, RTL) + cookie `NEXT_LOCALE` |
| Тесты | Vitest (integration), Playwright (e2e) |
| Линт | ESLint 9 (flat config) + `eslint-config-next` |
| Деплой | Vercel |
| Локальная инфра | Docker Compose (Postgres) |

Структура маршрутов: группы `src/app/(frontend)` и `src/app/(payload)` — публичный сайт и админка
в одном проекте.

---

## 2. Что было сделано (хронология этапов)

### Этап 1. UI и адаптив
- Сверстаны секции: Hero, Case Studies, Services, Solutions (тарифы), Footer, Let's Talk.
- Редизайн мобильной шапки под макет Figma (подложка, центрированное лого, бургер-иконка).
- Десктоп: плавающий виджет (контакты, соцсети, тема, язык, наверх).
- Светлая/тёмная тема (класс `dark` на `<html>`, состояние в React).

### Этап 2. Интернационализация (i18n)
- `src/middleware.ts` определяет язык по `Accept-Language` и cookie `NEXT_LOCALE`.
- Все строки вынесены в `src/translations/index.ts` (объекты `{ en, ru, he }`).
- Переключение языка на клиенте мгновенное (без перезагрузки), выбор пишется в cookie.
- Синхронизация `<html lang>` и `dir` (RTL для `he`).

### Этап 3. Cookie consent
- Баннер согласия в стиле navbar (тема-зависимый), cookie `cookie_consent`.

### Этап 4. Переиспользуемый модуль доступности (a11y)
- `src/components/accessibility/` — самодостаточный модуль (крупный текст, контраст,
  дислексия-режим, пауза анимаций и т.д.).
- Развязан с проектом: темизация через CSS-переменные `--a11y-*`, тексты и цели через props.

### Этап 5. SEO-ассеты
- Скрипты генерации из SVG: `scripts/generate-favicons.mjs` (полный набор favicon + `.ico` без
  внешних зависимостей, через `sharp`) и `scripts/generate-og.mjs` (OG-баннер 1200×630).
- `generateMetadata` в `layout.tsx`: title, локализованный description, OG, Twitter Card, robots,
  иконки, manifest.

### Этап 6. Контент из админки (ядро) — Payload CMS
- **Аудит**: коллекции существовали, но фронтенд их не использовал (всё было захардкожено).
- Спроектирована схема (Globals для секций-одиночек + Collections для списков), все текстовые поля
  локализованы.
- Серверный загрузчик контента + React-контекст с фолбэком на статические переводы.
- Все компоненты переведены на чтение из контекста (без изменения рендера).
- Сид начального контента из переводов на 3 языках.
- SEO подключён к глобалу Site Settings.

### Этап 7. Качество и деплой
- Полный прогон: lint / build / integration / e2e.
- Починен ESLint (flat config, см. §6).
- Коммит + пуш, проверка `.gitignore` под Vercel.

---

## 3. Переиспользуемый сценарий (пошагово)

> Цель: «весь текст и изображения редактируются из админки + несколько языков + деплой на Vercel».

1. **Инициализация**: проект Payload + Next (postgres-шаблон). Поднять Postgres (`docker compose up -d postgres`).
2. **Локализация в `payload.config.ts`**: задать `localization.locales` и `defaultLocale`, `fallback: true`.
3. **Аудит контента**: выписать все секции и поля сайта; решить, что — Global (одиночка), что — Collection (список).
4. **Схема Payload**:
   - Хелпер локализованных полей (`src/fields/localized.ts`).
   - Globals: Header, Hero, *-Section (intro), Footer, SiteSettings.
   - Collections: списки (услуги, тарифы, партнёры, **portfolio-projects**) + Media + Users.
   - Страницы `/portfolio`, `/portfolio/[slug]`, `/services/[slug]`, `/order/[slug]` читают CMS
     через `src/lib/cmsPages.ts` (фолбэк на статику в `portfolioProjects` / `servicePages` / `orderPlans`).
   - Зарегистрировать в `payload.config.ts`.
5. **Типы**: `pnpm run generate:types`.
6. **Загрузчик** (`src/lib/getSiteContent.ts`): тянет globals/collections с `locale: 'all'`, мёрджит
   поверх статических дефолтов, в `try/catch` фолбэк на дефолты.
7. **Контекст** (`src/components/SiteContentProvider.tsx`): клиентский провайдер, дефолт = статика.
8. **Проводка**: `page.tsx` (server) → `getSiteContent()` → `HomeClient` оборачивает в провайдер →
   компоненты читают через `useSiteContent()` (рендер не меняется, т.к. форма данных совпадает).
9. **Сид** (`scripts/seed.ts`): залить начальный контент на все локали.
10. **SEO**: подключить поля SiteSettings (title/description/OG) в `generateMetadata` с фолбэком.
11. **Тесты**: lint → build → `test:int` → `test:e2e`.
12. **Деплой**: см. §7 (env-переменные + storage для Media).

---

## 4. Ключевые паттерны (с кодом)

### 4.1. Хелпер локализованного поля
```ts
// src/fields/localized.ts
import type { Field } from 'payload'
export const locText = (name: string, o: Partial<Field> = {}): Field => ({
  name, type: 'text', localized: true, ...(o as object),
})
```

### 4.2. Globals vs Collections
- **Global** — одна сущность на сайт: шапка, hero, заголовки секций, футер, настройки.
- **Collection** — повторяемые элементы: карточки услуг, тарифы, партнёры, медиа.

### 4.3. Загрузка всех локалей сразу (`locale: 'all'`)
Ключевой приём: Payload с `locale: 'all'` возвращает локализованные поля как `{ en, ru, he }` —
ровно та форма, что и в статических переводах. Это позволяет сохранить мгновенное переключение
языка на клиенте и НЕ переписывать рендер компонентов.

```ts
const hero = await payload.findGlobal({ slug: 'hero', locale: 'all', depth: 1 })
// hero.subtext === { en: '...', ru: '...', he: '...' }
```

### 4.4. Загрузчик с фолбэком
- Старт от глубокого клона статических дефолтов.
- Перезаписываем поле, только если в Payload есть непустое значение.
- Любая ошибка/недоступность БД → возврат дефолтов (сайт никогда не пустой).

### 4.5. Контекст вместо прямых импортов
Замена в каждом компоненте одной строки:
`import { hero as translations } from '../translations'`
→ `const translations = useSiteContent().hero`.
Форма данных идентична → тело компонента не трогаем.

### 4.6. Сид локализованных массивов (важная грабля)
Массивы с локализованными под-полями нельзя просто писать по локалям — Payload пересоздаёт строки и
теряет значения. Решение: записать сначала `en` (создаются строки с `id`), затем **перенести `id`
по индексу** в данные `ru`/`he` и обновить.

```ts
function applyIds(target, source) {
  if (Array.isArray(target) && Array.isArray(source)) {
    target.forEach((row, i) => {
      if (source[i]?.id != null && row) { row.id = source[i].id; applyIds(row, source[i]) }
    })
  } else if (target && source && typeof target === 'object') {
    for (const k of Object.keys(target)) if (k in source) applyIds(target[k], source[k])
  }
}
```

### 4.7. Контакты/SEO как редактируемые данные
Захардкоженные email/телефон/соцсети вынесены в `SiteSettings` и читаются из контекста во всех
точках (navbar, footer, floating widget, CTA-ссылки).

---

## 5. Тестирование

| Уровень | Инструмент | Запуск | Заметки |
|---|---|---|---|
| Линт/стиль | ESLint | `pnpm run lint` | flat config, см. §6 |
| Типы | TS (в редакторе) | — | `tsc` напрямую ругается на CSS-импорты — это норм |
| Integration | Vitest | `pnpm run test:int` | нужен запущенный Postgres |
| E2E | Playwright | `pnpm run test:e2e` | нужен свободный порт 3000 |

Грабли тестов (Windows):
- Перед `build` остановить dev-сервер (Windows блокирует `.next`).
- Playwright ищет браузеры — задать `PLAYWRIGHT_BROWSERS_PATH` = `%USERPROFILE%\AppData\Local\ms-playwright`.
- `webServer` Playwright ждёт `http://localhost:3000` — порт должен быть свободен (зависшие dev-серверы убивают порт).
- Шаблонные e2e-тесты проверяют дефолтный title — обновить под свой.

---

## 6. ESLint (flat config под ESLint 9)

Проблема: `FlatCompat` (`@eslint/eslintrc`) под ESLint 9 падает с `Converting circular structure to JSON`.

Решение: использовать **нативные flat-конфиги** из `eslint-config-next` 16 и убрать `FlatCompat`:
```js
// eslint.config.mjs
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
export default [
  { ignores: ['.next/', 'node_modules/', 'src/payload-types.ts'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  { rules: { 'react-hooks/set-state-in-effect': 'warn', /* ... */ } },
]
```
`eslint-plugin-react-hooks` v7 делает `set-state-in-effect` ошибкой — для валидных паттернов
(чтение localStorage/cookie, async-подгрузка) понижаем до `warn`.

---

## 7. Деплой на Vercel — чеклист

`.gitignore` должен скрывать: `node_modules`, `.next/`, `.env*`, `.vercel`, `/media`, отчёты тестов.

Переменные окружения в Vercel (Settings → Environment Variables):
- `DATABASE_URL` — внешний Postgres (Vercel Postgres / Neon), не docker.
- `PAYLOAD_SECRET` — реальный секрет (не фолбэк).
- `NEXT_PUBLIC_SITE_URL` — продакшн-домен (canonical/OG).

⚠️ **Media на Vercel**: файловая система эфемерна — локальные загрузки (`/media`) не переживут
редеплой. Для прода подключить storage-адаптер Payload (Vercel Blob или S3).

Прочее:
- Миграции схемы: в dev Payload делает `push` автоматически; для прода настроить миграции
  (`payload migrate`), а не push.
- `pnpm run build` локально перед деплоем — быстрый сигнал, что всё компилируется.

---

## 8. Главные уроки / грабли

1. **`locale: 'all'`** — главный приём: форма данных Payload совпадает со статическими переводами,
   миграция фронтенда сводится к замене импорта на чтение из контекста.
2. **Всегда делать фолбэк** на статику в загрузчике — сайт не ломается при пустой/недоступной БД.
3. **Сид локализованных массивов** требует переноса `id` строк между локалями (`applyIds`).
4. **Реструктуризация коллекции** в dev (`push`) вызывает интерактивный вопрос drizzle о
   rename/create колонок — для чистой миграции проще удалить старую таблицу с тестовыми данными.
5. **Windows-специфика**: дев-сервер держит `.next`; порты 3000/3001 занимают зависшие процессы;
   PowerShell не поддерживает bash-heredoc (коммит-сообщение писать через файл + `git commit -F`).
6. **ESLint 9**: только нативный flat config, без `FlatCompat`.
7. **Разделять клиентский и серверный код**: дефолты контента в client-safe модуле
   (`defaultContent.ts`), загрузчик с `getPayload` — отдельно (`getSiteContent.ts`).

---

## 9. Хроника после базового деплоя (июнь–июль 2026)

Ниже — что сделано **после** этапов 1–7 и журнала в `DEPLOYMENT.md` (Supabase, Vercel Blob,
фикс Range/`206` для видео). Инфра и Blob подробно в `DEPLOYMENT.md` §8; здесь — продуктовые
и UI-изменения сайта.

### 9.1. Контактный UX и splash
- Модалка обратной связи (contact feedback): успех без заголовка, зелёная галочка.
- Brand splash: на mobile (`max-width: 1023px`) cold load всегда **quick**; full draw — только
  клик по лого. Desktop: full **один раз за session** на cold home (~3s, без `body` fixed lock),
  дальше / mid-page / inner — quick. `markSplashDone` на старте fade (LCP).
- Hero desktop: poster (mobile still) + video после splash; footer chip-frames — после splash + IO.
- CWV: `experimental.inlineCss` — Tailwind/a11y CSS в `<style>` вместо render-blocking `<link>` (~1 s на Slow 4G).
- CWV images: hero mobile/desktop stills через `next/image` + preload `/_next/image?w=…`; service posters — Image + tighter WebP.
- Мелкие UI-фиксы: скрытие скроллбара, центрирование glyph splash, RTL close у модалки.

### 9.2. Админка Media
- Превью изображений и видео в list view и edit view Media (не только иконка файла).

### 9.3. SEO и a11y
- Google Search Console: meta-тег в `head` (`layout.tsx` → `verification.google`) +
  файл `public/googlea9b1e6ba6a1fc012.html`.
- Sitemap: `src/app/sitemap.ts` + `src/lib/sitemapEntries.ts` — URL из CMS,
  **lastmod** = Payload `updatedAt` (services / portfolio / order plans) и
  legal `statementDate`/`updatedAt`; также `/contacts` и legal pages.
  Revalidate на смене контента (`payload-content` → `/sitemap.xml`).
- После смены NS на Cloudflare: в GSC проверить ownership, sitemap
  `https://erythro.ai/sitemap.xml`, при необходимости запросить индексирование.
- Self-host шрифтов; `aria-label` на лого-ссылках для скринридеров.

### 9.4. Картинки и перф
- Конвертация hero frames, lets-talk-bg и service images в WebP.
- Mobile: lazy-load нижеfold-секций; desktop: откат next/dynamic lazy-loading в `HomeClient`
  (вернулись к стабильному layout без регрессий пина).

### 9.5. Видео в секциях (Case Studies / Services / Hero)
- Case Studies: баннерное видео из CMS (Vercel Blob URL), мобильный portrait 9:16, prefetch
  при приближении, надёжный loop, копирайт RU/HE/EN.
- Services: ролики карточек из CMS + first-frame posters; баст кэша контента; loop.
- Hero: фон из видео (вместо прежней анимации кадров); медиа фона **динамическое из Payload**.
- Анимация «chip» перенесена из Hero в Footer.
- Solutions: merge plan disclaimers с дефолтами + revalidate layout.

### 9.6. Полировка главной (Services / Solutions / Footer / mobile stack)
- Typographic polish Services/Solutions/Footer; bold prefix перед двоеточием в фичах планов.
- Responsive layout Services & Solutions.
- **Mobile stacking** (наезд секций друг на друга с rounded top + shadow), по аналогии с
  «листками» над sticky hero:
  - Let's Talk наезжает на Services;
  - Solutions наезжает на Let's Talk (увеличен overlap; фикс bleed углов в light theme);
  - CSS-фон Let's Talk; Solutions pin на полный viewport;
  - clip section glows; Services top cut на mobile.
- Splash noise; выравнивание spacing логотипов партнёров в Case Studies.
- Navbar: восстановлен корректный `lg:z-0` на главной, чтобы шапка не перекрывала
  скролл-стек секций (регресс после portfolio-работы).

### 9.7. Страница Portfolio (`/portfolio`)
Новая внутренняя страница. Маршрут: `src/app/(frontend)/portfolio/`.
Контент кейсов редактируется в админке: коллекция **Portfolio Projects** (группа Pages).
Загрузчик: `getCachedPortfolioProjects` / `getPortfolioProjectBySlug` в `src/lib/cmsPages.ts`.

**Состав**
- `PortfolioClient.tsx` — оболочка (theme/locale, providers, без FloatingWidget/WhatsApp).
- `PortfolioSection.tsx` — сетка кейсов, фильтры категорий, light/dark.
- `LetsTalkSection` с `variant="simple"` (fade-in + pin без clipPath-reveal как на главной).
- `FooterSection` — общий футер; `id="footer"`.
- `ScrollSideButton` — боковой hint «Scroll» с счётчиком `01 | 03`.
- Ассеты: `public/images/portfolio/case-*.png`, `public/images/icons/burger_menu.svg`.

**Navbar в режиме `forceBurger`**
- Всегда лого + Menu (без desktop pill).
- Desktop: отступ шапки 50px; лого скрывается после скролла от верха.
- Mobile: подложка как на главной (`bg-coal-900/50` / `bg-gold-100` + blur), отступы
  лого/Menu **30px**; лого **не** скрывается при скролле.
- Open menu: шапка `z-[70]` над оверлеем; подложка снимается при открытом меню, чтобы
  Close и лого были белыми и кликабельными (раньше Close «пропадал» из-за stacking context).
- Пункты меню в стиле Emily Nolan (title + subtext, hover erythro + красный штрих).
- CTA в бургере — «Доступность» (открывает a11y panel), не «Обсудим».

**Скролл-стек и GSAP (desktop)**
- Portfolio пинится в конце (`start: 'bottom bottom'`, `pinSpacing: false`) → Let's Talk
  наезжает на последнюю «страницу» портфолио.
- Let's Talk simple: pin + `pinSpacing: false` → Footer наезжает (как Solutions → Footer
  на главной); у Footer остаётся `h-screen` spacer на главной (`pinSpacer`, по умолчанию
  `true`).
- Обёртки секций с `lg:contents` / `max-lg:overflow-hidden`, чтобы на desktop пин работал
  как на home, а на mobile сохранялся rounded overlap.
- Явный нижний спейсер ~150px под карточками в Portfolio.
- Чёрный «пустой» блок после Let's Talk: появлялся из-за пустого footer-spacer при сломанном
  пине/`overflow-hidden`; чинится корректным пином + `lg:contents`, без отключения наезда.

**Фильтры и карточки**
- Crossfade при смене категории (opacity GSAP; Flip отключён из-за дёрганья).
- Hover фильтров: быстрый вход, медленный ease-out при уходе курсора
  (класс `.portfolio-filter-btn` в `styles.css`).
- Light theme filters: белый фон, обводка = цвет текста; hover — обводка и текст
  `erythro/500`, фон белый.
- Dark theme filters: hover gold fill.
- Бейдж категории на карточке: dark — `#f7bbba` на `erythro/15`; light — `coal/500` +
  `gold/100`.

**Scroll hint**
- Вертикально по центру экрана; формат `01` | линия | `03`.
- Light theme: левое число и элементы hint — `coal/500` (белый не читался на `gold-100`).

**Ключевые коммиты**
- `8893c0e` — feat: portfolio page + burger.
- `6d65a58` — fix: home navbar stacking.
- `11af54c` — polish: scroll stack, filters, burger layout.
- `068e027` — fix: mobile header plate + scroll contrast.

### 9.8. CMS-редактируемые внутренние страницы
После утверждения вёрстки контент вынесен в Payload:

| Страница | Коллекция в `/admin` | Загрузчик |
|---|---|---|
| `/portfolio`, `/portfolio/[slug]` | **Portfolio Projects** (Pages) | `cmsPages.ts` |
| `/services/[slug]` | **Services** (+ slug, hero, summary, description, offerings) | `cmsPages.ts` |
| `/order/[slug]` | **Solution Plans** (+ slug, subtitle, promo, periods, addons) | `cmsPages.ts` |

Главная по-прежнему через `getSiteContent`. Пустая/недоступная CMS → статический фолбэк.
После добавления полей: перезапуск `npm run dev` (Postgres `push`), затем при необходимости
`pnpm exec tsx scripts/seed.ts` — зальёт slug/описания/кейсы.

### 9.9. Практические правила из этой фазы
1. **Пин + наезд**: предыдущая секция `pinSpacing: false`, следующая выше по `z-index`;
   scroll-room даёт spacer следующей секции (Footer `h-screen`) или собственный pin end.
2. **Не оборачивать pinned-секции в `overflow-hidden` на desktop** — ломает pin / даёт
   «чёрную дыру»; на home уже есть `lg:contents`.
3. **Кнопка поверх full-screen меню** должна жить в stacking context с `z-index` выше
   оверлея (родитель с `z-[70]`), иначе `z-index` на ребёнке не выигрывает у sibling-оверлея.
4. **PowerShell**: коммит-сообщения через файл + `git commit -F` (без bash heredoc).
5. **Письма с формы ≠ запись в админке.** CMS save и SMTP — разные шаги. DNS почты при NS Vercel
   живёт в Vercel DNS, не в Hostinger (PIT-020, `DEPLOYMENT.md` §13).

### 9.10. Hero Motion (кинематографические заголовки)
Утверждены 4 кадра вращающихся headline в Hero (`HeroMotionText`). Полное описание кадров,
outline SVG, адаптива, z-index меню и правил выхода из красных плашек:

→ **[docs/HERO_MOTION.md](./HERO_MOTION.md)**

### 9.11. Почта заказов с сайта (Hostinger)

Контактная форма всегда писала в коллекцию `contact-submissions` (видно в `/admin`). Письмо на
`order@erythro.ai` появилось после двух шагов (2026-08-14):

1. MX/SPF/DKIM/DMARC в **Cloudflare DNS** (ранее Vercel; nameservers не Hostinger —
   автоконнект в hPanel бесполезен).
2. SMTP из `POST /api/contact` через `src/lib/contactNotification.ts` + `SMTP_PASS` на Vercel.
   From: `"Erythro.ai" <order@erythro.ai>`. To: Site Settings notify (contact / order).
3. Защита: app rate limit 5/60s + Cloudflare Rate Limiting на `/api/contact`
   (Free: **5/10s** edge Block; `DEPLOYMENT.md` §13.3, `pnpm cf:contact-rate-limit`).
4. Если Hostinger → Spam, а forward на Gmail ок — PIT-021.

Проверено на проде: письма с сайта доходят. Журнал и таблица DNS: `DEPLOYMENT.md` §13. Грабли: PIT-020, PIT-021.
