# 🤖 Erythro.ai Commercial Website QA & Lead-Closing Auditor

Автоматизированный B2B-аудитор веб-сайтов с генерацией коммерческого **Executive Scorecard**, расчетом потерь бизнеса, анализом мобильного UX/RTL, тестированием лид-форм, SEO, безопасности и продающим отчетом с Call-to-Action.

---

## ⚡ Ключевые возможности

1. **Executive Scorecard & Светофор конверсии**:
   - Оценка сайта от 0 до 100 и грейд (A+, A, B, C, D, F).
   - 5 шкал здоровья: Скорость & Мобильный UX, Лидогенерация и Формы, SEO & Маркетинг, Безопасность & Стабильность, **AI Visibility & Brand Discovery**.
   - Автоматический расчет **Топ-3 уязвимостей конверсии** на языке денег и потерь рекламного бюджета.

2. **Мобильная верстка и кросс-культурный аудит (RTL)**:
   - Автоматическая проверка паразитного бокового скролла (`overflow-x`) на экранах смартфонов (iPhone SE / Android).
   - Проверка RTL-зеркалирования (`he` / иврит), выравнивания заголовков и направления элементов.
   - Соответствие закону о доступности сайтов (IS 5568 / WCAG 2.1 AA).

3. **Тест форм захвата и сценариев лидогенерации (UX & LeadGen)**:
   - Обнаружение всех форм захвата, полей Email/Phone и кнопок отправки.
   - Проверка защиты от спама (Cloudflare Turnstile / reCAPTCHA / Honeypot).
   - Обнаружение онлайн-чатов и кастомных AI-консультантов: SaaS-виджеты (Crisp, Tawk, Intercom, Jivo, Zendesk) и самописные React/Next.js модули (`.chat-launcher`, `.consultant`, `aria-label` ассистентов на EN, RU, HE).
   - Маркер AI-автоматизации и мгновенного автоответа (мостик к продаже n8n / AI-агентов).

4. **SEO & Маркетинговые превью**:
   - Проверка OpenGraph (`og:image`, `og:title`) для WhatsApp, Telegram, LinkedIn.
   - Проверка наличия `sitemap.xml`, `robots.txt`, `canonical`, фавиконок.

5. **AI Visibility & Brand Discovery**:
   - `llms.txt`, MCP manifest (`/.well-known/mcp`), JSON-LD Organization/FAQ, `/about`.
   - Правила robots.txt для AI-ботов (GPTBot, ClaudeBot, ChatGPT-User, PerplexityBot и др.), GA4 `dataLayer` + consent stub.
   - Agent Readiness Level 1 (отчёт, без веса в scorecard): Content Signals, Markdown Negotiation, sitemap для агентов, AI crawler rules.

6. **Безопасность и Инфраструктура**:
   - HTTPS шифрование, HTTP Security Headers (HSTS, CSP, X-Frame-Options), замер TTFB (медиана 3 тёплых проб после warmup).
   - Перехват рантайм-сбоев JavaScript (`PageError`) и ошибок Dev Console.
   - PageSpeed Insights: первый lab-прогон — прогрев; в отчёт идёт второй. `PSI_SKIP_WARMUP=1` отключает.

7. **Агентный просмотр ключевых страниц**:
   - Сбор кандидатов из `sitemap.xml` и навигации, обход до N коммерчески важных URL.
   - Проверка статуса, форм (включая модалку после клика по CTA), CTA, чат/WhatsApp и soft-404; Gemini-вердикт по воронке в Pro HTML (`GEMINI_API_KEY`, `AUDIT_TIER=PRO`).
   - Лимит страниц: `AGENT_BROWSE_MAX_PAGES` (по умолчанию 5, до 10 в Pro).

8. **Умный орфографический фильтр**:
   - Интеграция LanguageTool с расширенным словарем `config/audit_exceptions.json` без ложных срабатываний на IT/B2B термины (`n8n`, `AI-агенты`, `SLA`, `CRM` и др.).

---

## 🚀 Быстрый запуск

### 1. Установка браузеров Playwright (при первом запуске)
```bash
mvn exec:java -Dexec.mainClass="com.microsoft.playwright.CLI" -Dexec.args="install"
```

### 2. Запуск аудитора
```bash
mvn compile exec:java
```

---

## 📊 Результаты проверки

После завершения работы скрипта формируются файлы в папке `reports/`:
- **`reports/free/`**, **`reports/diagnostic/`**, **`reports/pro/`** — классические пакеты Free / Diagnostic / Pro (v1 A4-4, HTML+PDF, языки `ru`, `en`, `he`).
- **`reports/pro-v2/`** — отчёты в новом стиле v2 (RU, EN, HE + PDF с `@media print`).
- **`reports/audit-report.md`** — детальный структурированный Markdown-отчет.
- **`reports/audit_data.json`** — полный машиночитаемый JSON со всеми метриками.

### Пересборка классических пакетов (v1) без повторного обхода:
```bash
mvn compile exec:java -Dexec.mainClass="ai.erythro.RegenerateA44ReportsFromData"
```

### Сборка и экспорт отчетов в новом стиле (v2):
```bash
# 1. Генерация HTML v2 для RU, EN, HE
node scripts/render-v2-reports.mjs

# 2. Рендеринг PDF v2 через Playwright
mvn compile exec:java -Dexec.mainClass="ai.erythro.RenderV2Pdf"
```
