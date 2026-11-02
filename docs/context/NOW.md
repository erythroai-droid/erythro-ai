# Latest changes

Обновлено: 2026-11-02 (og:image на audit LP / `/audit` — PIT-079)  
Статус: В работе (ожидает деплоя / ревью)

---

## 1. og:image на audit-en.erythro.ai (и соседних LP) — PIT-079
- **Проблема:** `generateMetadata` на `/lp/audit/{locale}` задавал свой `openGraph` без `images` → Next затирал layout OG, в HTML не было `og:image`.
- **Фикс:** `openGraph.images` + `twitter.images` через `ogImageForPlan` / `ogImageFields` (`src/lib/ogImages.ts`).
  - Free LP (`audit-en|ru|he`): `audit-free` → `Ai-Audit-1200-630-2.jpg` на R2
  - Pro / Diagnostic LP: те же карты
  - `/audit`: то же (тот же баг)
- **Файлы:** `lp/audit/[locale]/page.tsx`, `lp/audit/pro|diagnostic/[locale]/page.tsx`, `audit/page.tsx`
- **Следующий шаг:** Деплой; после — проверка view-source / LinkedIn Post Inspector на `https://audit-en.erythro.ai/`.

---

## 2. ЛП калькулятора v2 (/lp/audit/calc/{ru,en,he}) — ШАГ 4
- Worktree `C:/dev/erythro-ai-calc2`, ветка `feat/audit-calc-lp-v2`. Ожидает ревью.

---

## 3. Hero RTL outline / отчёт 244 / платные ЛП / minor-issues
- Без изменений в этой сессии; см. предыдущую эстафету.
