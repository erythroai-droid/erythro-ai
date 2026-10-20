# Latest changes

Обновлено: 2026-10-20  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Gemini Funnel: explicit `thinkingLevel: medium` (PIT-106).
- Prior: HE lang lock + retry; robots checklist i18n; free H3/title; platform blocklist.

## Сейчас

1. Redeploy audit-agent so `thinkingLevel` is live.
2. Merge branch → production for site platform blocklist.

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-20 — Cursor — `1f12ca1` Gemini HE lang guard + robots i18n; worker live.
