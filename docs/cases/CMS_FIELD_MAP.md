# CMS field map — Portfolio Projects

Как раскладывать заполненный кейс (`docs/cases/<slug>.md`) в админку **Pages → Portfolio Projects**.

| Блок шаблона | Поле CMS | Тип |
|---|---|---|
| `PROJECT_NAME` | `title` | loc text |
| `SHORT_TAGLINE` / card blurb | `description` | loc textarea |
| `HIGH_LEVEL_SUMMARY` | `summary` | loc richText (hero only) |
| Optional under body title | `subtitle` | loc richText |
| URL segment | `slug` | text |
| Filter category | `category` | relationship → Portfolio Categories |
| Optional chip override | `categoryLabel` | loc text |
| `CLIENT_NAME` | `client` | text |
| Period | `date` | text |
| Demo URL | `link` | text |
| Tech stack list | `stack[]` → `item` | array |
| Extra chips (website, react…) | `tags[]` → `tag` | array |
| Card / hero media | `cardImage`, `heroMedia`, `heroMediaMobile` | upload |
| Challenges / Solutions / Results sections | `body[]` | sections |
| SEO titles/descriptions | SEO fields (per locale) | loc |

### Рекомендуемая структура `body[]`

1. **Challenges** — контекст + цели (можно списком / таблицей)
2. **Frontend & UX** — UI-стек и решения
3. **Backend & Data** — инфраструктура, БД, интеграции
4. **Automation & Security** — CI/CD, auth, AI-ops
5. **Results** — бизнес-эффект (без выдуманных цифр, если нет данных)

Картинки секции — в `body[].images[]` или inline Upload в rich text.

Автоимпорт из папки: `scripts/import-project/README.md` (`pnpm import:project`).
