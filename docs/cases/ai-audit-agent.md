# Кейс: ИИ-аудитор сайта — боевой QA-агент на erythro.ai

Живой пайплайн AI-аудита: заявка с URL на `/audit` → Docker-воркер (Playwright / PageSpeed) → Gemini → HTML-отчёт по токену. Тарифы Free / Diagnostic / Pro — один протокол.

---

## Обзор проекта

- **Клиент:** Erythro.ai (собственный продукт)
- **Услуги:** AI-агент, коммерческий QA сайта
- **Демо:** [https://erythro.ai/audit](https://erythro.ai/audit)
- **Стек:** Next.js 15, Payload CMS, Java QA_Auditor, Playwright, PageSpeed Insights, Cloudflare R2, Hostinger VPS, Gemini, Hostinger SMTP

---

## Возможности

1. **Пять шкал scorecard (0–100, грейд A+–F):** Speed & Mobile UX · Lead gen & Forms · SEO & Visibility · Security & Stability · AI Visibility & Brand Discovery.
2. **60+ типов сигналов** — site-level один раз; страницы/локали по тарифу (Free: главная; Diagnostic: до 5 URL + EN/RU/HE; Pro: до 10 URL).
3. **Протокол:** PageSpeed mobile+desktop, формы (inline и после CTA), SEO, security headers, AI Visibility (llms.txt, MCP, Organization schema…), Agent Readiness L1 (вне веса), LanguageTool EN/RU, Funnel review (Pro, Gemini).
4. **Выдача:** брендированный HTML A44 (desktop + mobile), PDF по плану, письмо с `order@erythro.ai`, страница `/audit/report/[id]?k=…` (без `k` → 404).
5. **Оплата:** Free с лимитом 1 домен / 7 дней; Diagnostic / Pro через Grow → тот же trigger воркера.

---

## Как работает

```text
/audit или /order/audit-*
  → POST /api/contact (source=audit)
  → agent-api.erythro.ai /api/run-audit
  → QA_Auditor (Playwright) + LLM
  → R2 + report_sent → email
  → /audit/report/[id]?k=…
```

Reconcile: Vercel Cron `/api/audit/reconcile` каждые 2 мин. Live-check сайта — только DNS на публичный IP (без SSRF).

Канон: `docs/architecture/ai-audit-architecture.md`. Импорт в CMS: `content/imports/ai-audit-agent/`.
