# Locale URL routing (EN unprefixed + `/ru` / `/he`)

План поэтапной миграции: **отдельные индексируемые URL** для RU/HE при сохранении всех текущих EN-путей, рекламных Final URL и ads LP.

Связано: [`audit-ads-landing.md`](audit-ads-landing.md), PIT-056 (CDN / no locale cookie in middleware), PIT-007 / PIT-036 (client locale maps / fonts), first-visit browser locale in `src/lib/sitePrefs.ts`.

**Статус:** план утверждён к поэтапному выполнению. Код по фазам — только после явного старта фазы.

### Ветка, мерж, деплой

- Вся работа (фазы 0–8) — в **отдельной feature-ветке** (например `feat/locale-url-routing`). Каждый этап: commit + push в эту ветку.
- В `main` **не мержить** и **не деплоить на прод**, пока перенос не будет полностью готов.
- Перед мержем: повторный полный smoke (матрица §6 + Ads LP + воронка order/audit) на preview/staging; только после явного OK — merge → deploy.
- Цель: не сломать действующий сайт (EN URL, кампании, LP).

---

## 1. Цель

| Цель | Как |
|------|-----|
| Google индексирует RU и HE | Отдельные URL + SSR HTML на языке URL + hreflang + sitemap |
| Не ломать ссылки и Ads | EN остаётся на `/`, `/audit`, `/services/...` |
| UX | Переключатель ведёт на URL локали; cookie/first-visit остаются вспомогательными |

**Не цель v1:** авторедирект всего трафика `/` → `/ru` по браузеру (ломает ожидания Ads и старых ссылок). First-visit browser locale на EN-URL уже есть.

---

## 2. Целевая модель URL

| Locale | Публичный path | Роль в SEO |
|--------|----------------|------------|
| `en` | `/…` (без префикса) | `hreflang=en` и `x-default` |
| `ru` | `/ru/…` | `hreflang=ru` |
| `he` | `/he/…` | `hreflang=he` |

Примеры:

| EN (без изменений) | RU | HE |
|--------------------|----|----|
| `/` | `/ru` или `/ru/` | `/he` или `/he/` |
| `/audit` | `/ru/audit` | `/he/audit` |
| `/services/foo` | `/ru/services/foo` | `/he/services/foo` |
| `/portfolio/bar` | `/ru/portfolio/bar` | `/he/portfolio/bar` |
| `/privacy` | `/ru/privacy` | `/he/privacy` |

**Вне скоупа префиксов (осознанно):**

- Ads LP: `audit-{en\|ru\|he}.erythro.ai` → `/lp/audit/{locale}` — **оставить** как есть (`noindex`). Органика — на `/audit` + `/ru/audit` + `/he/audit`.
- Служебные: `/api/*`, `/admin`, `/unsubscribe`, payment return — без обязательного префикса; язык через cookie / `?lang=` как сейчас.
- `/audit/report/[id]` — можно в поздней фазе (`/ru/audit/report/...`) или оставить `?lang=` (персональные ссылки, не главная органика).

**Каноникал:** каждая языковая страница канонична сама на себя. Не каноникалить `/ru/audit` на `/audit`.

**hreflang** (на каждой странице набора):

```text
en:        https://erythro.ai{path}
ru:        https://erythro.ai/ru{path}
he:        https://erythro.ai/he{path}
x-default: https://erythro.ai{path}   # EN
```

Для home: `path` = `''` → `/`, `/ru`, `/he`.

---

## 3. Архитектурные решения (зафиксировать до кода)

### 3.1 Routing

**Рекомендация:** App Router с optional locale segment:

- Маркетинговые страницы живут под `(frontend)/[[...]]` так, что:
  - без префикса → `locale = en`;
  - `/ru/...` и `/he/...` → `locale` из сегмента.
- Практичный вариант Next 15: группа `(frontend)` + параллельные деревья **или** один layout с `src/app/(frontend)/[locale]/...` **только для `ru`|`he`**, а EN остаётся в текущих `page.tsx` **с общим shared page module** (чтобы не дублировать UI).

Предпочтительный компромисс против дублирования:

1. Вынести тело страницы в shared component / `loadXPage(locale)`.
2. EN: текущие пути вызывают `loadXPage('en')`.
3. RU/HE: `app/(frontend)/ru/...` и `he/...` **или** один `[locale]` с `generateStaticParams = ['ru','he']` и middleware, который **не** трогает EN-пути.

Альтернатива middleware rewrite (`/ru/audit` → `/audit` + header `x-locale: ru`) — быстрее стартовать, но легче ошибиться с canonical/CDN. Допустима, если аккуратно проставить metadata из header/path.

### 3.2 Источник языка на сервере

Порядок для **маркетинговых** страниц:

1. Prefixed path → `ru` / `he`
2. Unprefixed → `en` (для SSR/SEO), **не** cookie
3. Cookie / browser — только клиентский UX на EN-URL (уже есть), не для HTML, который видит Googlebot на `/audit`

Итог: Googlebot на `/ru/audit` получает RU HTML без cookie.

### 3.3 ISR / CDN (PIT-056)

- Prefixed и unprefixed маркетинговые страницы: `force-static` / ISR **без** `cookies()` / `getRequestPrefs` для выбора языка.
- Locale из path → можно добить deferred «ISR remaining» для services/order/audit.
- Middleware по-прежнему **не** делает `Set-Cookie` locale.

### 3.4 Клиентский переключатель

- `setLocale('ru')` на `/audit` → `router.push('/ru/audit')` (+ persist cookie для согласования).
- `setLocale('en')` на `/ru/audit` → `router.push('/audit')`.
- Ads LP: без изменений (host navigation).

### 3.5 Ссылки

Единый helper, например `localePath(locale, path)`:

- `localePath('en', '/audit')` → `/audit`
- `localePath('ru', '/audit')` → `/ru/audit`
- `localePath('he', '/')` → `/he`

Все `next/link`, Navbar, CTA, footer — через helper или обёртку `LocaleLink`.

### 3.6 CMS

- На prefixed SSR можно `locale: 'ru'|'he'|'en'` (меньший HTML) **или** временно оставить `locale: 'all'` + resolve на сервере по path-locale.
- Цель к концу миграции: серверный pick по URL-локали; client maps — только если нужен switch без навигации (после URL-switch не обязательны на маркетинге).

### 3.7 Что не ломаем

| Актив | Правило |
|-------|---------|
| Final URL Ads на `erythro.ai/audit` и т.п. | Без 301 на `/ru/...` |
| `audit-*.erythro.ai` | Без изменений в v1 |
| Письма с `?lang=` | Работать; опционально позже заменить на prefix |
| Старые внешние EN-ссылки | 200 на тех же path |

---

## 4. Фазы выполнения

Каждая фаза = отдельный PR (или чёткий коммит-набор), smoke, только потом следующая.  
**Не начинать фазу N+1, пока N не принята.**

### Фаза 0 — Контракт и хелперы (без смены публичных URL)

**Сделать:**

- [ ] Документ (этот файл) — источник правды; ссылка из `PLAN-deferred.md` / `NOW.md`.
- [ ] `src/lib/localePath.ts` (или расширить `sitePrefs.ts`):
  - `SUPPORTED_LOCALES`, `isLocalePrefix`, `stripLocalePrefix`, `localePath`, `parsePathLocale(pathname)`.
- [ ] `buildLocaleAlternates(pathWithoutLocale)` → объект для `alternates.languages` + canonical helpers.
- [ ] Unit-тесты на path math (home, nested, strip, reject `/en/...` если EN unprefixed).
- [ ] Решить и записать: trailing slash policy (как у сайта сейчас).

**Готово когда:** хелперы покрыты тестами; на прод-поведение URL ещё не влияет.

**Риск:** низкий.

---

### Фаза 1 — Каркас маршрутов + одна страница (home)

**Сделать:**

- [ ] Маршруты `/ru` и `/he` (и при необходимости `/ru/`, redirect consistent).
- [ ] Shared home loader: SSR locale from path; EN home без изменений URL.
- [ ] Layout/`<html lang dir>`: для prefixed — правильный SSR `lang`/`dir`/font vars (не только bootstrap).
- [ ] `generateMetadata` для home: title/description по локали + `alternates.languages` + `x-default`.
- [ ] Переключатель на home: navigation по URL.
- [ ] Cookie persist при смене URL — сохранить для остальных страниц на EN.

**Не делать в фазе 1:** весь sitemap ×3; остальные разделы.

**Smoke:**

- [ ] `/` — EN HTML (view-source / curl без cookie).
- [ ] `/ru` — RU в HTML; `/he` — HE + `dir=rtl`.
- [ ] Переключатель EN↔RU↔HE меняет path.
- [ ] Старый `/` из закладки — 200.

**Риск:** средний (layout fonts, hero CLS — PIT-057 mindset).

---

### Фаза 2 — SEO-сигналы (home + каркас)

**Сделать:**

- [ ] Sitemap: для каждой core page в наборе — EN + `/ru` + `/he` с `alternates` (MetadataRoute поддерживает).
- [ ] Убедиться, что ads LP **не** попадают в sitemap (как сейчас).
- [ ] `robots.txt` — без блокировки `/ru` `/he`.
- [ ] JSON-LD Organization/WebSite: проверить `inLanguage` / url; FAQ на home — язык страницы URL.

**Smoke:**

- [ ] `/sitemap.xml` содержит `/ru` и `/he` варианты home.
- [ ] В HTML home есть link alternates (или metadata equivalents Next отдаёт).

**Риск:** низкий.

---

### Фаза 3 — Marketing static: about, contacts, legal

**Страницы:** `/about`, `/contacts`, `/privacy`, `/terms`, `/accessibility` (+ `/ru/...`, `/he/...`).

**Сделать:**

- [ ] Shared page modules + prefixed routes.
- [ ] Metadata + hreflang на каждую.
- [ ] Sitemap расширить.
- [ ] LocaleLink в footer/legal cross-links.
- [ ] Убрать зависимость от `getRequestPrefs` для языка на этих страницах (ISR).

**Smoke:** curl трёх локалей; внутренние ссылки сохраняют префикс.

**Риск:** низкий–средний.

---

### Фаза 4 — Portfolio + services

**Сделать:**

- [ ] `/portfolio`, `/portfolio/[slug]`, `/services/[slug]` + `/ru|he/...`.
- [ ] `generateStaticParams` × локали (или EN params + locale params).
- [ ] CMS load по URL-locale (или `all` + pick).
- [ ] Metadata / hreflang / sitemap.
- [ ] Карточки и CTA через `localePath`.

**Учесть:** PIT-007 — после URL-switch можно упростить client LocaleMaps на этих страницах (опционально в этой же фазе или follow-up).

**Smoke:** несколько slug × 3 локали; 404 для несуществующего slug одинаково.

**Риск:** средний (много ссылок, CMS).

---

### Фаза 5 — Audit + order (воронка)

**Сделать:**

- [ ] `/audit`, `/order/[slug]`, success/cancel по политике ниже.
- [ ] SSR copy/plans по URL-locale.
- [ ] Формы: в payload `locale` = URL-locale.
- [ ] Post-submit / report links: предпочтительно prefix; `?lang=` оставить совместимым.
- [ ] hreflang + sitemap для публичных order/audit URL (не для report id, если noindex/private).

**Success/cancel:** либо prefixed, либо EN-only + `?lang=` — зафиксировать в PR (рекомендация: prefix для consistency).

**Smoke:**

- [ ] `/ru/audit` форма → contact с `locale=ru`.
- [ ] Checkout links из `/he/order/...` не сбрасывают на EN без `lang`.
- [ ] Ads Final URL `/audit` без изменений.

**Риск:** высокий (деньги, Turnstile, PayPlus). Тщательный regression.

---

### Фаза 6 — Переключатель и глобальная навигация

**Сделать:**

- [ ] Navbar / mobile / FloatingWidget: только URL navigation на маркетинге.
- [ ] Аудит всех hardcoded `href="/..."` (grep) → `localePath` / `LocaleLink`.
- [ ] `not-found`: учитывать prefix в path при hydrate.
- [ ] Bootstrap script: если path `/ru/...` — lock/prefer path locale (как LP path lock).

**Smoke:** обход главных шаблонов на `/he/...` — все внутренние ссылки остаются в `/he`.

**Риск:** средний (пропущенные ссылки → выпадение с локали).

---

### Фаза 7 — Письма, handoff, ads (опционально)

**Сделать по необходимости:**

- [ ] Pro offer / report / unsubscribe ссылки: `https://erythro.ai/ru/audit/...` вместо только `?lang=ru`.
- [ ] `mainSiteUrlWithLang` → path-aware helper (query fallback).
- [ ] Docs: обновить `audit-ads-landing.md` — органика на `/ru/audit`, LP по-прежнему noindex.
- [ ] **Не** менять Google Ads Final URL без отдельного решения медиабайера.

**Риск:** средний (если менять Ads — высокий; поэтому по умолчанию не менять).

---

### Фаза 8 — Зачистка и мониторинг

**Сделать:**

- [ ] Убрать мёртвый код «SSR всегда en + только hydrate», где path уже задаёт locale.
- [ ] Search Console: добавить sitemap; проверить Coverage / hreflang отчёт (через 1–2 недели).
- [ ] Выборочный `site:` / URL Inspection для `/ru/audit`, `/he/about`.
- [ ] Обновить `AI_VISIBILITY.md` / audit copy если обещаем hreflang «на сайте» — теперь правда для основного сайта.
- [ ] Запись в `PITFALLS.md`, если всплывут факапы миграции.

**Готово когда:** GSC видит alternates без критичных ошибок; RU/HE URL в индексе или «Discovered/Crawled».

---

## 5. Вне скоупа / явные non-goals

- Префикс `/en/...` и редирект EN → `/en` (ломает все текущие URL).
- Поддомены `ru.erythro.ai` для всего сайта (конфликт ментальной модели с `audit-ru`).
- Индексация ads LP.
- Автоматический geo-redirect корневых URL.
- Consultant wizard / прочий deferred.

---

## 6. Тест-матрица (минимум на релиз фаз 1–5)

| Проверка | EN | RU | HE |
|----------|----|----|-----|
| curl HTML language | lang/content EN | RU | HE |
| `dir` | ltr | ltr | rtl |
| canonical | self | self | self |
| hreflang set | полный | полный | полный |
| sitemap URL | да | да | да |
| language switch | path меняется | path | path |
| Ads `/audit` | 200 EN SSR | — | — |
| `audit-ru.erythro.ai` | — | LP без регрессии | — |

---

## 7. Откат

- Prefixed routes можно отключить feature-flag / revert PR фазы — EN paths не зависят от `/ru`.
- Sitemap: при откате убрать ru/he entries в том же revert.
- Не делать деструктивных 301 с EN на RU в v1 — откат проще.

---

## 8. Порядок старта

1. Фаза 0 (хелперы + тесты).  
2. Фаза 1 (home) → ручной OK.  
3. Фаза 2 (sitemap/hreflang home).  
4. Фазы 3 → 4 → 5.  
5. Фаза 6 (глобальные ссылки) можно частично параллелить с 3–4, но complete — после 5.  
6. Фазы 7–8 — после стабилизации воронки.

**Следующий конкретный шаг при старте работ:** начать **Фазу 0** — `localePath` + тесты + фиксация trailing-slash.
