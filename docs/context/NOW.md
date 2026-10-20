# Latest changes

Обновлено: 2026-10-20  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- First-visit locale from browser: `navigator.languages` when no `?lang=` / cookie / `localStorage` (`sitePrefs` bootstrap + `useSitePrefs` + 404). Ads LP locks unchanged. No middleware Set-Cookie (CDN).
- Ранее: Pro / Diagnostic → development offer (`paid_dev`); audit-agent live.

## Сейчас

- Проверить локально: инкогнито + браузер RU/HE → UI на том языке; повторный визит помнит выбор; переключатель вручную важнее браузера.
- URL-локали (`/ru/...`) — позже, не в этом шаге.

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-20 — Cursor — browser locale on first visit (no URL split yet).
