# Latest changes

Обновлено: 2026-10-20  
Модель: Composer  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- **PIT-119 — «Далее» на `/order/ai-smart-card` вело на Бесплатный старт:**
  - Причина: CMS slug `"ai-smart-card "` (хвостовой пробел) → дубликат плана в конце nav-списка → циклический wrap на `free-start`.
  - Код: trim slug в `mapOrderFromPlanDoc` / `getOrderPlanBySlug`, cache `order-plans-v9-trim-slug`, `beforeValidate` на `solution-plans`.
  - Prod DB: проставлены `free-start` / `ai-smart-card` / `business-automation` / `enterprise-custom`.
  - До деплоя или Save в прод-админке Vercel Data Cache может ещё отдавать старый список.

## Сейчас

- Нужен деплой (или Save любого solution-plan в prod admin / `POST /api/revalidate`) чтобы сбросить кэш на живом сайте.
- **Этап 3 аудита (отложен):** SEO-маршрутизация языковых версий (EN/RU/HE URL, `hreflang`, `sitemap.xml`).

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.

## Последняя эстафета

2026-10-20 — Composer — PIT-119: trim order-plan slugs + DB fix; «Далее» на AI-визитке больше не должно прыгать на Free Start после деплоя/revalidate.
