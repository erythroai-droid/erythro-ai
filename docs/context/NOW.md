# Latest changes

Обновлено: 2026-11-13 (portfolio hero: stronger overlay)  
Статус: локально; нужен визуальный check + коммит/деплой

## 0. Портфолио — Hero: сильнее затемнение фона (2026-11-13)
- **Сделано:** поверх фото сплошная вуаль `bg-coal-900/55` на всё изображение + градиент снизу `from-coal-900 via-coal-900/50 to-transparent` (не только градиент). Мобайл-плашка текста: `via-coal-900/90`.
- **Следующий шаг:** визуально кейс → коммит/деплой по команде.

## −1. Портфолио — La Scala (2026-11-13)
- **Сделано:** `pnpm import:project -- content/imports/la-scala --create` → CMS `portfolio-projects` **#9**, slug `la-scala`, категория `websites`. Live https://la-scala-one.vercel.app/. Медиа #182–#188.
- Схема как ORA / Rosso: `brief.yaml` + `body.ts` (6 секций EN/RU/HE), highlights (языки **только RU/EN**, Lenis без ScrollSmoother, static ≤900px), без выдуманных PSI (API 429). `solutionPlan` → `ai-smart-card` (#2). Кэш `portfolio-projects-v27-la-scala`.
- Учтены правки сегодняшних кейсов: честный счёт языков, честные метрики, плашка пакета, списки с жирными лидами, demo-stub брони без claim конверсии.
- **Следующий шаг:** визуально `/portfolio/la-scala` (локально или после деплоя) → коммит/деплой по команде. Revalidate prod 401 (нет `REVALIDATION_TOKEN`).

## −1. Портфолио — Rosso Garage описание как ORA 60A (2026-11-12)
- **Сделано:** `body.ts` / `brief.yaml` — 6 секций + highlights + PSI; **#7**; `solutionPlan` → `ai-smart-card`. **2026-11-13:** везде EN/RU/HE/AR (иврит + арабский RTL) в body, summary, highlights; кэш `portfolio-projects-v26-rosso-ar`.
- **Следующий шаг:** визуально `/portfolio/rosso-garage` → коммит/деплой по команде.

## −1. Портфолио — низ кейса: Visit ↗ + WhatsApp (2026-11-12)
- **Сделано:** столбец по центру: «Открыть проект» ↗ → ряд Назад / «Все проекты» / Далее → зелёная «Обсудить в WhatsApp» (`#25D366`, EN/RU/HE); вертикальные отступы `gap-6`/`sm:gap-8`. Prefill с названием; номер из `siteSettings.phone`. Только portfolio (`discussWhatsApp`); order без WA.
- **Следующий шаг:** визуально light/dark + мобайл → коммит/деплой по команде.

## −1. Портфолио — плашка пакета рядом с H1 (2026-11-12)
- **Сделано:** у Portfolio Projects поле `solutionPlan` → Plans (`kind=solution`). На `/portfolio/[slug]` H1 слева (start), плашка пакета справа (end), `justify-between`; светлая тема — обводка/текст `coal-900`, тёмная — `gold-500`; ссылка на `/order/[slug]`.
- Миграция `20261112_210000_portfolio_project_solution_plan` применена (+ сид `ora-60a` → `ai-smart-card`).
- **Фикс 404 на DevServer (PIT-166):** до migrate страница закэшировала seed-fallback без `ora-60a`; ключ кэша → `portfolio-projects-v23-package-badge`. Локально `/portfolio/ora-60a` → 200.
- UI: `ProjectBody.tsx`. Маппинг: `cmsPages.mapPortfolioDoc` → `packageLabel` / `packageHref`.
- Док: `docs/cases/CMS_FIELD_MAP.md` (+ копия в Obsidian `cases/`); PIT-166 доп. кейс в `docs/PITFALLS.md`.
- **Следующий шаг:** визуально плашка → коммит/деплой по команде.

## −1. Calc + Audit LP — meta / index / JSON-LD (2026-11-12)
- **Calc (`leak-*`):** `noindex` снят → `index,follow`. Title: «Аудит потерь сайта» / Website Loss Audit / ביקורת אובדן הכנסות מהאתר. Отдельные `metaDescription` + длинный `aiDescription` в `auditCalcCopy`; H1 sr-only = metaTitle. OG/Twitter на тех же текстах. hreflang через `auditLpLanguageAlternates('calc')`. `WebApplication` JSON-LD с featureList под leak-калькулятор.
- **Free audit (`audit-*`):** тоже `index,follow`; title «Бесплатный AI-аудит сайта» (EN/HE аналоги); description: CMS `metaDescription` → fallback `metaDescription`/`subhead` в `auditLpCopy`; `aiDescription` + JSON-LD. UI H1 (`sectionTitle` «AI Аудит Free») не трогали.
- **Pro/Diagnostic LP:** `noindex` оставлен.
- Файлы: `auditCalcCopy.ts`, `auditLp.ts`, `brandSchema.ts`, `WebApplicationJsonLd.tsx`, `lp/audit/calc/[locale]/page.tsx`, `lp/audit/[locale]/page.tsx`, `AuditCalcClient.tsx`.
- **Следующий шаг:** коммит/PR/деплой по команде → проверить `curl` head на leak-ru / audit-ru (title, description, robots, ld+json, hreflang).

## −1. Портфолио — ORA 60A highlights (2026-11-11)
- **Сделано:** под H1 на `/portfolio/ora-60a` — таблица в 2 колонки (вид см. «Переделано» ниже). Короткие пункты (языки, стек) — мелкие теги с иконками (`HighlightIcon.tsx`: языки — флаги RU/UK/IL, арабский — флаг ОАЭ; стек — inline SVG Next.js/React/GSAP/TS, сопоставление по тексту); у языков и технологий обводки нет (иконка + текст); длинные — главная фраза + приглушённое уточнение через «—». Строки: мультиязычность (RU/AR/EN/HE), адаптивность, производительность, стек `Next.js · React · GSAP · TypeScript`, CI, ИИ-консультант.
- В строке производительности — цифры Lighthouse 12 по живому `ora60a.erythro.ai` (замер 2026-11-11, локальный CLI; PSI API дал 429): mobile 96, desktop 89, FCP 1.0 s, LCP mobile 2.6 s (desktop 1.5 s), TBT 10 ms, CLS 0. Поля `metrics` / `metricsNote` у `PortfolioHighlight`.
- Источник: `PROJECT_HIGHLIGHTS` в `portfolioProjects.ts`; `<dl>` в `ProjectBody.tsx`; кэш `portfolio-projects-v15-highlight-ci-copy` (строка CI переписана простыми словами: «Готовый шаблон для следующего товара — меняются бренд, тексты и кадры, выкладка на поддомен erythro.ai»).
- CMS-поле пока нет. Subtitle под списком остаётся.
- **Переделано (2026-11-11, по выбору пользователя — «редакционная таблица»):** плашки убраны. Строки разделены тонкими линиями; subgrid; без обводок у языков/стека; цифры без рамок, `border-s`, `<bdi>`. Пробовали и отклонили: плашки, сетку карточек.
- **Построчно (2026-11-12):** как «Пакеты и цены» / референс Stack: `border-t/b`, мелкий label слева + описание крупнее справа. Без номеров/иконок. Subtitle под списком — на всю ширину (`max-w-none`). Языки: иврит и арабский оба с RTL. CI: GitHub · автотесты · деплой на Vercel. Метрики Lighthouse как раньше. Кэш `v18-highlight-ci-rtl`. В hero «Visit project» — кнопка gold-outline (EN/RU/HE), не текстовая ссылка. Локально.
- **Highlights в CMS (2026-11-12):** поле `highlights` у Portfolio Projects (label, detail, metrics[value, label], metricsNote; всё кроме value — по локалям). Миграция `20261112_180000_portfolio_project_highlights` **уже применена к общей Supabase (прод-БД)**: 4 таблицы + сид 6 строк ORA 60A (#8). Сид в коде (`PROJECT_HIGHLIGHTS`) и `wide` удалены; `cmsPages` читает только CMS. Кэш `v20-highlights-cms` (PIT-166). Страница локально рендерит строки из БД; админку не смотрел (локальный логин). У «Visit project» в hero — стрелка ↗ + sr-only «(откроется в новой вкладке)».
- Прод-сайт пока на старом коде (сид в коде) — новые таблицы ему не мешают. После деплоя правки строк — только в админке.
- **Описание по образцу pro-interior (2026-11-12, записано в общую БД):** body ORA 60A заменён на 6 секций: Обзор проекта · Вызовы и задачи · Инженерное решение и архитектура (картинки #155/#156 сюда) · Ключевые возможности · Результаты аудита и метрики (таблица Lighthouse mobile/desktop от 2026-11-11 + инженерные заметки) · Результаты и бизнес-эффект. Списки с жирными лидами, `code`, таблица. Источник: `content/imports/ora-60a/body.ts`, скрипт `scripts/import-project/apply-rich-body.ts` (EN/RU/HE, одинаковая структура, id строк общие). Бэкап старого body: `content/imports/ora-60a/body-backup-2026-11-12.json`. Кэш `v21-ora-body`. Противоречие «балл не приводится» ушло вместе со старыми секциями.
- **Внимание:** в репо Watch и templates нет GitHub workflows и тестов. Строка CI в highlights («автотесты») этим не подтверждается; в body написано только «GitHub → Vercel, сборка на каждый push».
- **Import script → та же схема (2026-11-12):** `import:project` пишет 6 rich Lexical секций (overview→results), списки с `**лидом**`, опц. таблицу метрик, `highlights` только если заданы в brief (иначе CMS не трогает). `body.ts` в папке импорта подхватывается автоматически. Общие билдеры: `lib/rich-lexical.ts`. Пример/README/case-study-template/CMS_FIELD_MAP обновлены; копии в Obsidian `cases/`. Dry-run example + ora-60a (body.ts) OK.
- **Следующий шаг:** коммит/PR/деплой по команде; визуально EN/RU/HE.

## −1. Портфолио — ORA 60A (2026-11-10)
- **Сделано:** `pnpm import:project -- content/imports/ora-60a --create`. CMS `portfolio-projects` **#8**, slug `ora-60a`, категория `websites`. EN/RU/HE. Ссылка https://ora60a.erythro.ai. Медиа #152–#156.
- Кэш пользователь сбросил сам. Страница открывается (проверено: иврит, заголовок и пять секций на месте).
- Заодно: в `scripts/import-project/lib/load-env.ts` снова подставляются секреты из `.env` вместо `[SENSITIVE]` (PIT-111). На проде `REVALIDATION_TOKEN` нет, поэтому локальный `/api/revalidate` отвечает 401.

---

Обновлено ранее: 2026-11-09 (Header nav Href per locale)  
Статус: Stage 1–3 на VPS; ротация токенов отложена

---

## −11. Header nav — Href по локалям (2026-11-09, локально)
- **Проблема:** в админке Href пункта меню / субменю был общий на все языки; Аудит → технический / коммерческий дублировал первую ссылку (PIT-161).
- **Сделано:** `href` у `navItems` и `children` → `localized: true`; миграция `20261109_180000_header_nav_href_localized` (колонки в `*_locales`, бэкап значений на EN/RU/HE); `getSiteContent` / Navbar / seed / copyHygiene читают `{en,ru,he}`.
- **Не сделано:** миграция на проде / деплой; в админке ещё нужно проставить разные URL для RU/HE у субменю Аудит.
- **Следующий шаг:** коммит/PR → migrate на prod → в Header переключить локаль EN/RU/HE и задать Href для technical/commercial; проверить бургер-меню.

## −10. Calc LP — шаг 2 моб: отступ submit от «клиентов в месяц» (2026-11-09, локально)
- **Ниже `sm`:** когда открыт доход (`!skipToPercent`), у блока submit `pt-5`, чтобы кнопка не липла к chips клиентов.
- Плюс ранее: ползунки скрыты до opt-in. Файл: `AuditCalcFlow.tsx`. Не собрано / не проверено.
- **Следующий шаг:** коммит/PR/деплой по команде.

## −10c. Calc LP — шаг 3 на мобе как 1–2 (2026-11-09)
- **Мобайл:** трекер и три бейджа скрыты; большой заголовок остаётся.

## −10b. Calc LP — шаг 2 как шаг 1 + доход выкл. по умолчанию (2026-11-09, прод: PR #394, `dpl_8akonxd…`)
- **Мобайл:** трекер и бейджи скрыты; короче тексты в карточке; «Пропустить» только с `sm`.
- **Все ширины:** `skipToPercent=true` по умолчанию; switch → opt-in «Указать доход…».
- **Прод:** `1e64622`; aliases через `request_promote` на `dpl_8akonxd…`.

## −10b. Calc LP — шаг 2 откачен (2026-11-09, прод: PR #393, `dpl_7Ki3cS…`)
- **Было:** #392 откатили; aliases сначала залипли на #392, после `request_promote` домены на откате.
- **Проверено на проде (#391, до #392):** откат GA4 работает; кнопка шага 1 на 375×812 выше cookie-баннера. На 320×640 кнопка ниже первого экрана (773 px).

## −9. Calc LP — откат теста GA4 и текст под кнопкой (2026-11-09, PR #391 в main)
- **Откат:** тест воронки в GA4 до согласия из PR #390 удалён по решению пользователя (`calcFunnelTest.ts`, вызовы, `onSubmitFailed`). **Пока откат не выложен, на проде тест работает и ставит `_ga` до согласия.**
- **Форма, шаг 1 (все ширины, EN/RU/HE):** политика и «Обязательное поле» перенесены под кнопку (`legalTargetId` в `AuditLpForm`), текст с галочками убран.
- Не собрано и не проверено в браузере. **Следующий шаг:** ветка `fix/calc-lp-legal-note-remove-ga4-test`: GitHub PR, merge, Vercel site deploy по команде; затем проверить на leak-* отсутствие `calc_*` и `_ga` до согласия.

## −8. Calc LP — первый экран на телефоне (2026-11-09, прод: PR #390; leak-ru 375×812 проверен, кнопку перекрывает cookie-баннер)
- **Сделано (только ниже `sm`, EN/RU/HE):** на шаге 1 скрыты три пункта под текстом и блок «Шаг 1 из 4»; короче подзаголовок, заголовок и описание формы, кнопка «Проверить сайт бесплатно» (`copy.mobile`). `sm` и шире не менялись.
- **Заодно (PIT-160):** экран «Не удалось завершить аудит» возвращался раньше двух хуков и ронял React; `return` перенесён ниже всех хуков. Ошибка найдена по коду, вживую не воспроизводилась.
- Файлы: `AuditCalcFlow.tsx`, `AuditLpForm.tsx` (`submitLabelMobile`), `auditCalcCopy.ts`. Не собрано и не проверено в браузере (проверки только по команде).
- **Осталось проверить:** 320 px и EN/HE.

## −7. n8n Stage 3 — IF/HTTP typeVersion (2026-11-08)
- **Сделано:** HTTP Request `4.2→4.3`; IF legacy `1→2.2` (миграции schema). Скрипт `deploy_n8n_stage3_typeversions.py`. Бэкапы `/root/n8n/backups/*stage3*`.
- Active: Meta CAPI, Marketing Digest, Telegram Bot, Email Autoresponder. Inactive reconcile/walker — только import.
- Repo: `infra/n8n/workflows/email-autoresponder.json` IF тоже 2.2.
- **Smoke:** CAPI #403 success; digest #404 success; TG `/start` #405 success; order@/team@ автоответы (`SMOKE-*-20261108-1238`) executions #406/#407 success.
- **Следующий шаг:** ротация Meta/Gemini/Telegram credentials (по желанию). UI warnings typeVersion закрыты.

## −6. n8n Stage 2 — secrets → Credentials (2026-11-08)
- **Сделано:** Meta Graph + Gemini → `httpQueryAuth`; Telegram → native `telegram` + `telegramApi` (HTTP URL/`$env`/`$credentials` → 404, PIT-159).
- Active: Marketing Digest, Telegram Bot, Meta CAPI — plaintext токенов в node params нет.
- **Smoke:** digest execution **success** (#400); meta-lead **success** (#401).
- Скрипты: `deploy_n8n_marketing_credentials.py`, `repair_n8n_stage2h2.py`. Бэкапы `/root/n8n/backups/*stage2*`.
- **Ротация токенов не сделана** (значения перенесены as-is; пользователь оставил as-is).

## −5. Calc LP — разная сумма на экране и в письме (2026-11-08, не задеплоено)
- **Симптом:** отчёт 264: в базе выручка 18 000 ₪, в письме 1 000 ₪/мес, на экране сразу после проверки 56 000 ₪ (это результат для 1 000 000 ₪, максимум ползунка). PIT-158.
- **Причина:** экран брал живое значение ползунка, письмо — сохранённое. Как именно сдвинулся ползунок, не установлено.
- **Сделано:** `AuditLpForm` возвращает отправленные значения в `onSubmitted`, `AuditCalcFlow` считает отчёт по ним. Не собрано и не проверено в браузере: здесь нет `node_modules`, проверка на проде создала бы заявку.
- **Следующий шаг:** запушено в `hotfix/calc-report-saved-revenue` (`c1a103b`). Осталось: GitHub PR, merge, Vercel site deploy, затем тестовая заявка.

## −4. Calc LP — страница «застревала» на форме (2026-11-08, прод: PR #387, проверено на leak-ru: `overflow: clip`, скрытой прокрутки нет)
- **Симптом:** переход из Facebook на мобильном — страница начинается с полей формы, вверх не скроллится (PIT-157).
- **Причина:** пятно `.calc-loss-a` давало `<main overflow-hidden>` скрытые 630 px прокрутки; браузер мог прокрутить их сам, пользователь обратно — нет.
- **Сделано:** `overflow-clip` на панели + `overflow-hidden` на слое пятен: `AuditCalcFlow.tsx` и два блока в `CalcReport.tsx`.
- **Проверено:** баг воспроизведён на проде (375×812); те же CSS-значения, применённые к живой странице, его убирают. Сборка не запускалась; в настоящем браузере Facebook не проверено; что именно запускает автоскролл в FB, не установлено.
- **Следующий шаг:** открыть объявление на телефоне. Запись PIT-157 в `docs/PITFALLS.md` пока только локально, в main не закоммичена.

## −3. n8n warnings — Stage 1 Email Autoresponder (2026-11-08)
- **Сделано:** бэкап `/root/n8n/backups/20261108T083053Z` (+ scrubbed local under `infra/n8n/backups/`, gitignored). Live vs repo: SMTP-цепочка идентична; на live висела мёртвая ветка `Process out[1] → Is Audit Lead? → Meta CAPI` (Code имеет 1 выход — PIT-156).
- Задеплоен repo JSON через `deploy_n8n_email_autoresponder.py` (credentials сохранены). Убраны мёртвые CAPI-ноды. `active=true`, `publish` + `docker compose restart n8n`, healthz 200. Marketing / Meta CAPI webhook / reconcile не трогали.
- Скрипт обновлён: `publish:workflow` вместо deprecated `update:workflow --active`.
- **Smoke (2026-11-08):** с `webmechanik@gmail.com` → `order@` и `team@` (маркер `SMOKE-*-20261108-1055`). Оба автоответа за ~1 мин: `Erythro.ai Orders <order@…>` / `Erythro.ai Support <team@…>`, subject `Re: …`, branded body OK.
- Stage 2 credentials — см. −6.

## −2. Calc LP — og:image (2026-11-07, не задеплоено)
- `leak-{en,ru,he}` отдавали OG без картинки (PIT-079, повтор). Теперь `openGraph.images` + `twitter.images` через `ogImageForLeakCalc(locale)` → `public/images/og/leak-calc-{en,ru,he}.jpg` (1200×630, ~62 КБ).
- Файлы апскейлены из присланных 1024×537 (чат пережал). Если есть оригиналы 1200×630 — просто перезаписать те же файлы, код не трогать.
- **Следующий шаг:** деплой по команде → Meta Sharing Debugger / LinkedIn Post Inspector, «Scrape again» для всех трёх `leak-*`.

## −1. Calc LP — «Бесплатно» на первом экране (2026-11-07, не задеплоено)
- Шаг 1 hero: зелёный бейдж `heroFreeBadge` («Бесплатно · 0 ₪» / Free / חינם) перед кикером; заголовок формы `step1Heading` → «Бесплатный расчёт финансовых утечек» (EN/HE тоже).
- Файлы: `src/lib/auditCalcCopy.ts`, `src/components/audit/AuditCalcFlow.tsx`. Проверки не запускались.
- **Следующий шаг:** визуально проверить leak-{ru,en,he} (RTL, мобайл), затем коммит/деплой по команде.

## 0. Калькулятор отдельно от аудита + Meta CAPI (2026-11-06, прод: PR #383, dpl_21aR…)
- **Статус: CAPI работает.** Заявка 263 (leak-he, 00:41): Test Events — Lead браузер + Lead сервер, оба `event_id=263`, `content_name: leak_calc`; сервер: email, IP, UA. (262 не видна — вкладка Test Events была закрыта.)
- **Закрыто:** `META_CAPI_TEST_EVENT_CODE` удалён; логирование в main (PR #384), прод redeploy `dpl_BUTj…` (2026-11-07 00:46).
- **Осталось:** через сутки — Обзор пикселя: «Лид» без удвоения. Опционально: передавать `_fbp` с клиента (EMQ); выяснить внешний серверный источник Lead до #383.
- В пикселе «Лид» уже был «Браузер • Сервер» до PR #383 (70 событий, EMQ 0.0) — внешний источник серверных событий не из этого репо (Make / интеграция Meta?), выяснить.
- **Split:** `AuditCalcFlow` → `AuditLpForm leadChannel="leak_calc"` → `trackFreeAuditLead(id, 'leak_calc')`: Meta `content_name: leak_calc`, GA4 `qualify_lead.lead_source: leak_calc`. Аудит без изменений (`free_audit` / `audit`). Google Ads conversion общая.
- **CAPI:** `src/lib/metaCapi.ts` + `/api/contact` (`after()`), `event_id` = submissionId (dedup с Pixel), общий `metaLeadContentName` (`src/lib/metaLead.ts`). Пропуск при `cookie_consent=declined` или без `META_CAPI_ACCESS_TOKEN`.
- `generate_lead` сознательно не добавлен (Ads уже считает через AW send_to; риск двойного счёта).
- **Следующий шаг:** токен в Vercel Production (`META_CAPI_ACCESS_TOKEN`, временно `META_CAPI_TEST_EVENT_CODE`) → деплой → тестовая заявка → Test Events «Браузер и сервер» → убрать test code. Док: `docs/architecture/meta-pixel.md`.

## 1. Calc LP — сумма исправлений (из main / #380)
- **Прод:** #380 задеплоен; фикс ₪2200 ушёл.
- **Баг:** `computeLeak` брал сырой `leakBreakdown` (visibility 0.3% считалась зоной) → ₪1800 при двух пунктах в «Что исправим».
- **Фикс:** `sprintPrice` / окупаемость от integer `losses` (те же зоны, что на экране). Для report=258 → 2×₪600 = ₪1200.
- **Следующий шаг:** закоммитить/смержить follow-up.

## 2. Vercel misconfigured domains — закрыто
- Письмо Vercel: `audit-calc-{en,ru,he}.erythro.ai` misconfigured.
- Старые имена; канон — `leak-{en,ru,he}.erythro.ai` (DNS + Vercel OK). У `audit-calc-*` NXDOMAIN.
- **Сделано:** 3 домена удалены из Vercel Project Domains. `leak-*` / audit / diag / pro на месте.

## 3. og:image audit LP — PIT-079
- После деплоя: scrape again / `?v=2` для мессенджеров.
