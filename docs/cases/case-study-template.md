# Кейс: {{ PROJECT_NAME }} — {{ SHORT_TAGLINE }}

{{ HIGH_LEVEL_SUMMARY }}

---

## 🌐 Обзор проекта

- **Клиент:** {{ CLIENT_NAME }}
- **Отрасль / Ниша:** {{ INDUSTRY }}
- **Услуги Erythro.ai:** {{ SERVICES_PROVIDED }}
- **Демо-версия / Сайт:** [{{ DEMO_URL }}]({{ DEMO_URL_FULL }})
- **Разработчик / Команда:** {{ DEVELOPER_TEAM }}
- **Технологический стек:** {{ TECH_STACK_LIST }}

---

## 🎯 Вызовы и Задачи Проекта

{{ PROJECT_CONTEXT_AND_PAIN_POINTS }}

### Ключевые цели разработки:
1. **Архитектура и производительность:** {{ ARCHITECTURE_GOAL }}
2. **UI/UX & Бренд:** {{ DESIGN_GOAL }}
3. **Бизнес-конверсия:** {{ BUSINESS_GOAL }}
4. **Безопасность и автоматизация:** {{ AUTOMATION_GOAL }}

---

## 🛠️ Архитектурные и Технические Решения

### 1. Фронтенд & UX/UI
- **Стек UI:** {{ FRONTEND_STACK }}
- **Компонентная сборка:** {{ FRONTEND_DETAILS }}
- **Интерактив и анимации:** {{ ANIMATION_DETAILS }}
- **Мультиязычность & RTL (если есть):** {{ I18N_DETAILS }}

### 2. Бэкенд, БД & Данные
- **Инфраструктура:** {{ BACKEND_DETAILS }}
- **Управление контентом / данными:** {{ CMS_DETAILS }}
- **Интеграции:** {{ INTEGRATIONS_LIST }}

### 3. Автоматизация, CI/CD & AI-Ops
- **Контроль качества / пайплайн:** {{ CICD_DETAILS }}
- **AI-агенты, безопасность, защита:** {{ AI_SECURITY_DETAILS }}

---

## 📊 Результаты и Бизнес-Эффект

1. **Скорость / Core Web Vitals:** {{ SPEED_METRIC_RESULT }}
2. **Отказоустойчивость:** {{ RELIABILITY_RESULT }}
3. **Рост конверсии / бизнес-эффект:** {{ CONVERSION_RESULT }}
4. **SEO-фундамент:** {{ SEO_RESULT }}

---

## ⚙️ SEO-Метаданные страницы

### 1. Русскоязычная локаль (RU)
- **Title:** {{ SEO_TITLE_RU }}
- **Description:** {{ SEO_DESC_RU }}

### 2. Англоязычная локаль (EN)
- **Title:** {{ SEO_TITLE_EN }}
- **Description:** {{ SEO_DESC_EN }}

### 3. Локаль на иврите (HE)
- **Title:** {{ SEO_TITLE_HE }}
- **Description:** {{ SEO_DESC_HE }}

---

## Как использовать

1. Скопируйте этот шаблон → `docs/cases/<slug>.md` **или** перенесите плейсхолдеры в `content/imports/<slug>/brief.yaml` (`facts.en` / `facts.ru` / `facts.he`)
2. Заполните плейсхолдеры `{{ … }}` по фактам проекта (без выдуманных метрик)
3. Разложите текст по полям CMS вручную (`docs/cases/CMS_FIELD_MAP.md`) **или** запустите `pnpm import:project -- content/imports/<slug>` (см. `scripts/import-project/README.md`)
4. В Cursor: «Заполни кейс по `docs/cases/case-study-template.md` для <url или брифа>»
