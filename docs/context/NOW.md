# Latest changes

Обновлено: 2026-11-06 (calc lead split + Meta CAPI)  
Статус: код готов, не задеплоен; CAPI ждёт токен в Vercel

---

## 0. Калькулятор отдельно от аудита + Meta CAPI (2026-11-06, не закоммичено)
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
