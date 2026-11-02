# Latest changes

Обновлено: 2026-11-02 (og:image audit LP — картинка с erythro.ai, не r2.dev)  
Статус: В работе (нужен редеплой + сброс кэша мессенджера)

---

## 1. og:image на audit-en.erythro.ai — PIT-079 follow-up
- **Проверка после деплоя:** в HTML уже есть полный блок `og:image` / `twitter:image` (Microlink видит 1200×630 JPEG).
- **Почему в чатах пусто:** (1) кэш WhatsApp/Telegram/Facebook держит старый scrape без картинки; (2) `og:image` указывал на `pub-*.r2.dev` (rate-limit, хуже тянется краулерами, чем ассеты с `erythro.ai`).
- **Фикс:** карточка лежит в `public/images/og/ai-audit.jpg`, URL `https://erythro.ai/images/og/ai-audit.jpg` через `ogImages.ts` (`audit-free|diagnostic|pro`).
- **После деплоя сбросить превью:**
  - Facebook: [Sharing Debugger](https://developers.facebook.com/tools/debug/) → Scrape Again для `https://audit-en.erythro.ai/`
  - WhatsApp/Telegram: новая ссылка с `?v=2` (или `@webpagebot` в Telegram)
- **Следующий шаг:** задеплоить этот коммит, затем scrape again / `?v=2`.

---

## 2. ЛП калькулятора v2 / Hero RTL / 244 / paid LP
- Без изменений в этой сессии.
