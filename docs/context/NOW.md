# Latest changes

Обновлено: 2026-11-04 (Vercel: сняты obsolete audit-calc-*)  
Статус: ops закрыт

---

## 1. Vercel misconfigured domains — закрыто
- Письмо Vercel: `audit-calc-{en,ru,he}.erythro.ai` misconfigured на проекте erythro-ai.
- Причина: старые имена калькулятора; канон теперь `leak-{en,ru,he}.erythro.ai` (DNS + Vercel OK). У `audit-calc-*` в CF DNS нет записей (NXDOMAIN).
- **Сделано:** удалены 3 домена из Vercel Project Domains. `leak-*` / audit / diag / pro на месте (14 доменов).

## 2. og:image на audit-en.erythro.ai — PIT-079 follow-up
- Без изменений: после деплоя — scrape again / `?v=2` для мессенджеров (см. предыдущую эстафету).
