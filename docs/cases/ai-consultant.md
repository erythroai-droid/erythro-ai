# Кейс: ИИ-консультант — Gemini-чат на erythro.ai

Публичный консультант стримит ответы Gemini 3.6 Flash через `POST /api/consult`. Цены и пакеты — из живой CMS; markdown в репо только fallback.

---

## Обзор проекта

- **Клиент:** Erythro.ai (собственный продукт)
- **Услуги:** AI-агент, sales/support chat
- **Демо:** виджет на [https://erythro.ai](https://erythro.ai)
- **Стек:** Next.js 15, Gemini 3.6 Flash, Vercel AI SDK, Payload CMS, Turnstile, Translater (VPS), SMTP, Monday.com

---

## Возможности

1. **Три режима:** анонимный FAQ (лог вопросов без контактов) · hand_off в каталог/аудит (ссылка, чат не закрывается) · кастомное ТЗ (OTP + телефон → `project-briefs`) и техтикет (OTP → email).
2. **Живая KB:** Solutions / Services / Audit Plans + Extra knowledge + «How we work»; язык ответа по последнему сообщению посетителя (EN / RU / HE).
3. **Tools:** `get_knowledge_base`, `translate_terms`, `hand_off`, OTP, `draft_brief` / `submit_brief`, `escalate_tech`.
4. **Антиспам:** Turnstile `consult`, IP-лимит, анонимная квота сообщений, OTP cookie после верификации.
5. **Границы:** чат не оформляет заказ и не принимает оплату; ключ Gemini только server-side (`GEMINI_API_KEY_AI_CHAT`, отдельно от аудитора).

---

## Как работает

```text
ChatButton → POST /api/consult (Turnstile)
  → system = CMS KB + consultant-settings
  → Gemini 3.6 Flash (streamText)
  → Translater (опц.) / SMTP order@ / Monday.com / tech inbox
```

`Consultant enabled = off` прячет лаунчер через `/api/consult/copy` (`no-store`).

Канон: `docs/architecture/gemini-consultant.md`. Импорт в CMS: `content/imports/ai-consultant/`.
