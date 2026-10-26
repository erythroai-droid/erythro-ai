# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Audit sample reports v2 → прод (блокер для клиентов)

- **Факт:** воркер на VPS уже отдаёт клиентам v2. Сайт/LP/письма ссылаются на `/samples/audit/{tier}-{lang}.html` — пути верные, **контент на erythro.ai ещё старый A4-4**.
- **Локально готово:** все 9 HTML + PDF в `public/samples/audit/` = v2 (`v2-polish`), `pro-*.html` ≡ `pro-*-v2.html`.
- **Код:** `auditSampleReports.ts` + `audit-pro-ads` → pro sample; тест обновлён под v2.
- **Smoke прод (без реальной оплаты):** free/diagnostic/pro order + LP diagnostic/pro — формы и CTA оплаты живые (₪99 / ₪490 / free submit).

### Очередь
1. **Commit + deploy** `public/samples/audit/*` (+ мелкий diff `auditSampleReports.ts` / тест / arch doc) → после деплоя примеры на сайте = v2.
2. Desktop splash brand beat (не задеплоено ранее) — отдельно, не блокер аудита.
