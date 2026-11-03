# Latest changes

Обновлено: 2026-11-03 (хосты calc LP → leak-{en,ru,he}; Vercel domains; DNS ещё нет)  
Статус: В работе (нужен деплой кода + 3 CNAME в Cloudflare)

---

## 1. Calc LP hosts → `leak-{en,ru,he}.erythro.ai`
- **Решение:** вместо `audit-calc-*` — `leak-en|ru|he.erythro.ai`.
- **Код (эта ветка):** `src/lib/auditLp.ts`, `revenueLeak.ts` comment, `tests/int/auditLp.int.spec.ts`, `docs/architecture/audit-ads-landing.md`.
- **Vercel Domains:** `leak-en|ru|he.erythro.ai` — verified. Старые `audit-calc-*` ещё на проекте.
- **Cloudflare DNS:** ждёт `dns.write` — 3× CNAME → `cname.vercel-dns.com` (Proxied).
- **Следующий шаг:** commit → merge/deploy → DNS → smoke `https://leak-ru.erythro.ai/`.
