# Latest changes

Обновлено: 2026-10-25  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии (2026-10-25)

- **Ads LP Pro + Diagnostic:** free-шелл + Grow-форма (2×2 + Pay full width). Phone country dropdown: без `clip` на pill. «Все пакеты» → `erythro.ai/audit?lang=` — middleware больше не редиректит на free LP из‑за одного `lang` (только при `utm_campaign`).

- **PIT-126 — Facebook `?fbclid=` → вечный красный splash:** фикс в коде (SplashHost + bootstrap + orphan sweep). На проде без деплоя ещё красный экран.

## Осталось / следующий шаг

- **Задеплоить** код LP Pro/Diag (+ PIT-126) на Vercel — без деплоя субдомены откроют старый билд.
- Проверка после деплоя: `https://audit-pro-ru.erythro.ai/`, `https://audit-diag-en.erythro.ai/`.
- Опционально: Turnstile Widget Domains ×6; Ads Final URL.
