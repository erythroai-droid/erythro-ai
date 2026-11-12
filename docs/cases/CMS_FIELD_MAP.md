# CMS field map — Portfolio Projects

Как раскладывать заполненный кейс (`docs/cases/<slug>.md`) в админку **Pages → Portfolio Projects**. Схема совпадает с **pro-interior / ORA 60A**.

| Блок шаблона | Поле CMS | Тип |
|---|---|---|
| `PROJECT_NAME` | `title` | loc text |
| `SHORT_TAGLINE` / card blurb | `description` | loc textarea |
| `HIGH_LEVEL_SUMMARY` | `summary` | loc richText (hero only) |
| Optional under body title | `subtitle` | loc richText |
| Highlights table under title | `highlights[]` | array (label, detail, metrics[], metricsNote) |
| URL segment | `slug` | text |
| Filter category | `category` | relationship → Portfolio Categories |
| Optional chip override | `categoryLabel` | loc text |
| Pricing package badge next to body H1 | `solutionPlan` | relationship → Plans (`kind=solution`); title → badge, links to `/order/[slug]` |
| `CLIENT_NAME` | `client` | text |
| Period | `date` | text |
| Demo URL | `link` | text |
| Tech stack list | `stack[]` → `item` | array |
| Extra chips (website, react…) | `tags[]` → `tag` | array |
| Card / hero media | `cardImage`, `heroMedia`, `heroMediaMobile` | upload |
| Six body sections below | `body[]` | sections (rich Lexical paragraphs) |
| SEO titles/descriptions | SEO fields (per locale) | loc |

### Структура `body[]` (обязательная схема)

1. **Обзор проекта** (`overview`) — лид + список (клиент, отрасль, услуга, команда, стек, live URL)
2. **Вызовы и задачи** (`challenges`) — контекст + «Ключевые цели» списком
3. **Инженерное решение и архитектура** (`engineering`) — подзаголовки 1/2/3 + списки (frontend, backend, delivery)
4. **Ключевые возможности** (`features`) — список с жирными лидами
5. **Результаты аудита и метрики** (`metrics`) — вводный абзац, таблица (если есть замер), инженерные заметки
6. **Результаты и бизнес-эффект** (`results`) — список исходов

В rich text: жирные лиды пунктов, `` `code` `` для имён файлов/API, таблицы только с реальными цифрами.

Картинки секции — в `body[].images[]` (папки `body/engineering`, `body/metrics`; legacy `body/frontend` → engineering).

Автоимпорт: `scripts/import-project/README.md` (`pnpm import:project`). Ручной rich body: `body.ts` в папке импорта.
