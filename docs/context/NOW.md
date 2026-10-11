# Latest changes

Обновлено: 2026-10-11  
Модель: Cursor  
Прод сейчас отдаёт `feat/audit-header-cta` `3bfc005` (`dpl_FohCW9mgFmWkEhAzkivFcfwZBrW6`, alias erythro.ai). База — `origin/main` `a530f0c` плюс кнопка в шапке. `fix/payment-turnstile-action` `2ea1ec5` в этот деплой не входит.

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Тариф **Manual** ₪2 490 на `/audit` (вместо Delegate). **Без** `/order/audit-manual` и Grow.
- CTA «Написать инженеру» → `#contact-modal` (обычный contact + префилл про Manual). Поток: форма → созвон → оплата → затем аудит. Не `source=audit`, чтобы не дергать Free-пайплайн.
- Воркер по-прежнему мапит `audit-manual` → PRO на случай ручного запуска после оплаты.

## Сейчас

Manual уже в CMS (`pnpm db:fix-audit-pricing` на prod DB, en/ru/he). Локальный `REVALIDATION_TOKEN` ≠ Vercel → кэш `/audit` не сбросился (401). В коде: `mapPlans` дописывает отсутствующие планы + cache key `audit-page-v8-manual` — нужен деплой (или Save в admin Audit Page). Intake-лимиты не возвращать до живого списания.

## Не делать

- Не печатать `MAKE_PAYMENT_SECRET`.
- Не возвращать intake-лимиты, пока нет живого списания.
- Не зеркалировать этот файл в Obsidian.
- Не возвращать Delegate и не вешать Manual на Grow checkout.

## Последняя эстафета

2026-10-12 — Cursor — карточки не было: в CMS не было Manual, код не дописывал. Патч БД сделан; ждём деплой merge-фикса / Save в admin.
