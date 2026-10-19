# Latest changes

Обновлено: 2026-10-20  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- HE «отчёт готов» RTL — audit-agent **задеплоен**.
- RTL audit всех клиентских писем:
  - OK: Pro/nudge/reminder (`auditProOffer` shellHtml)
  - Fixed: report-ready (`mail.js`) — live
  - Fixed (local): contact ack + consult OTP — нужен **Vercel** deploy
  - N/A: n8n autoresponder (только EN), внутренние staff-письма

## Сейчас

1. Commit/push RTL fixes (mail.js + contactNotification + request-otp) — по команде.
2. Vercel deploy для ack/OTP.

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-20 — Cursor — HE RTL: agent live; site ack+OTP fixed locally, need deploy.
