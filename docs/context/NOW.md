# Latest changes

Обновлено: 2026-11-04 (handoff: Vercel audit-calc + calc sprint price)  
Статус: calc follow-up — цена от округлённых зон; Vercel ops закрыт

---

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
