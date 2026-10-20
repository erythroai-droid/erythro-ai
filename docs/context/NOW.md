# Latest changes

Обновлено: 2026-10-20  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- План SEO URL-локалей: [`docs/architecture/locale-url-routing.md`](../architecture/locale-url-routing.md) (EN на корне, `/ru` `/he`, hreflang, фазы 0–8). Ссылка в `PLAN-deferred.md`.
- Ранее (др. сессия): GA4 Key Events / UTM / PIT-116; first-visit browser locale.

## Сейчас

- Ветка `feat/locale-url-routing`: весь перенос URL-локалей. Commit/push только туда.
- В `main` / прод — **не мержить и не деплоить**, пока фазы 0–8 готовы и повторный smoke OK.
- Ждём старта **Фазы 0** — по команде.

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.
- Не начинать фазу N+1 locale URL, пока N не принята.
- Не merge/deploy locale URL до полной готовности и явного OK.

## Последняя эстафета

2026-10-20 — Cursor — locale-url-routing plan on feat branch; merge only when complete.
