# Latest changes

Обновлено: 2026-10-21  
Модель: Composer  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- **PIT-120 — n8n отвечал на DMARC-отчёты Microsoft → NDR `550 5.4.1`:**
  - Skip: `dmarcreport@`, local-part `dmarc`/`rua`/`ruf`, тема `Report Domain:` / `DMARC … report`.
  - Repo: `infra/n8n/workflows/email-autoresponder.json` + docs + PIT-120.
  - Live n8n задеплоен и проверен (`report_sender` / `dmarc_report_mail` в Code node, `active=True`).

- **PIT-121 — пропал логотип в Pro-письме:** SVG не рендерится в Gmail/Outlook → `letterhead-full-email.png` + `email-header-plate.png` в `auditProOffer.ts`. Нужен деплой (PNG в `public/`), потом тест-отправка.

## Сейчас

- PIT-119: нужен деплой сайта (или Save solution-plan / `POST /api/revalidate`) для сброса Data Cache order-plans.
- **Этап 3 аудита (отложен):** SEO-маршрутизация языковых версий (EN/RU/HE URL, `hreflang`, `sitemap.xml`).

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-21 — Composer — PIT-120: n8n не отвечает на DMARC aggregate reports; workflow обновлён на VPS.
