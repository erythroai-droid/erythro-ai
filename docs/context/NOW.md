# Latest changes

Обновлено: 2026-10-20  
Модель: Cursor  

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Worktree: `c:\dev\erythro-ai-locale` → ветка `feat/locale-url-routing` (изолировано от `c:\dev\erythro-ai` на `main`).
- План: [`docs/architecture/locale-url-routing.md`](../architecture/locale-url-routing.md).

## Сейчас

- Рабочая копия для локалей: **`c:\dev\erythro-ai-locale`**. Сюда коммитить/пушить фазы 0–8.
- `c:\dev\erythro-ai` — другие задачи (`main` + прочий WIP). Не мешать с locale URL.
- Ждём старта **Фазы 0** — по команде.
- В `main` / прод — не мержить, пока полный smoke OK.

## Не делать

- Не печатать SMTP / AGENT / VPS `.env`.
- Не зеркалировать этот файл в Obsidian.
- Не начинать фазу N+1, пока N не принята.
- Не merge/deploy locale URL до полной готовности и явного OK.

## Последняя эстафета

2026-10-20 — Cursor — locale worktree at c:\dev\erythro-ai-locale; await Phase 0.
