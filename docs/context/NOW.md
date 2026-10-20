# Latest changes

Обновлено: 2026-10-20  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Free report UX: unique finding H3 titles; drop `Preview ·` from free `<title>` (badge PREVIEW on page stays). Solution teaser for free unchanged.
- HE Cyrillic gap fix (`tr()` for AI-bots disallow).
- Platform blocklist on audit website (YouTube/FB/IG/TikTok/LinkedIn/…).

## Сейчас

1. Commit + push → Vercel picks up site blocklist.
2. Redeploy `audit-agent` on VPS (Java report fixes).

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.
- Не открывать solution в free (тизер «в полном отчёте» — by design).

## Последняя эстафета

2026-10-20 — Cursor — free report title/H3 + platform block + Cyrillic gap (commit/push/worker).
