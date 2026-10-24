# Latest changes

Обновлено: 2026-10-24  
Модель: Composer  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- LP субзаголовок: Express Audit in 5 minutes / Экспресс-аудит за 5 минут / אודיט אקספרס תוך 5 דקות; cookie Accept снова gold (`nav-talk` / `gold-outline`).
- Audit LP форма: без privacy-checkbox; email + сайт + CTA в ряд на `lg+`, на мобилке столбиком; notice + implied consent под ними (`AuditLpForm.tsx`).
- Cookie-баннер: компактная одна строка снизу экрана + короткий `messageCompact` на мобиле (`CookieConsent.tsx`, `translations`). WhatsApp FAB поднят над баром (`bottom-14`, z-70).

- Pro-offer письмо: футер `erythro.ai` — серая ссылка (Gmail автолинкал его синим). Тест с `team@` → Gmail: SPF/DKIM/DMARC pass. Темы писем смягчены (без «спецпредложения» и email в теме). Пиксель открытий: `/api/mail/open` → таблица `mail_opens` (миграция `20261024_120000_mail_opens` ещё НЕ применена на prod; до неё вставка падает в лог, картинка всё равно отдаётся). Не сделано: `List-Unsubscribe-Post`.

## Сейчас

- Коммит/PR: PIT-123 + LP conversion UX — по запросу.
- После деплоя: проверить fold на `audit-he` (кнопка без чекбокса, cookie не перекрывает CTA) и что Pro-offer не дублируется.

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.
- Не слать повторно письма заявке 202.

## Последняя эстафета

2026-10-24 — Composer — LP: implied consent, компактный cookie, HE `אודיט אקספרס`.
