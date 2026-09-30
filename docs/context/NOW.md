# Latest changes

Обновлено: 2026-09-30  
Модель: Cursor  
Ветка: `feat/ai-consultant`

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- Общий контекст для смены моделей: `docs/context/HANDOFF.md` (протокол) и этот файл.
- Входы: `AGENTS.md` и `.cursorrules` требуют читать этот файл до работы; `CLAUDE.md` и `GEMINI.md` — короткие указатели; Cursor-правило `.cursor/rules/session-handoff.mdc`.
- Строки в `README.md` и `docs/RAG_INDEX.md`.

## Сейчас не назначено

Следующего шага нет, пока пользователь не назовёт задачу. Очередь «когда будет время» — [`docs/PLAN-deferred.md`](../PLAN-deferred.md), это не текущая работа.

## Незакоммиченное дерево (не продолжать без просьбы)

На `feat/ai-consultant` уже лежат чужие незавершённые правки прошлых сессий. Это не одна задача и не поручение следующей модели.

- QA_Auditor: `AuditCollector.java`, отчёты A4, HTML-шаблоны, `AGENTS.md` / `README.md` аудитора. Правка одной копии требует ту же относительную правку в `C:\agents\website-auditor\erythro-ai\QA_Auditor`.
- WhatsApp translator: `docs/infrastructure/whatsapp-translator.md`, `whatsapp-tech-provider.md`, `infra/caddy/Caddyfile`, `scripts/ensure-wa-dns.mjs`, `scripts/deploy_whatsapp_translator.py`.
- Документы и правила: Supabase Data API grants, `docs/architecture/ai-token-spend.md`, правки VPS/n8n/firewall, `PLAN-deferred`, `RAG_INDEX`, `DEPLOYMENT`.
- Сайт: `src/lib/pageFaq.ts`, `src/lib/servicePages.ts`, `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js`.
- Прочее неотслеживаемое: `docs/sales/`, OG-картинки в `public/images/`, `scripts/inspect-*-locale.ts`, `scripts/_scan_l10n_v2.mjs`, `scripts/_verify_l10n_v2.ts`.

## Не делать

- Не считать пункты `PLAN-deferred.md` текущей задачей.
- Не зеркалировать этот файл в Obsidian.
- Не запускать тесты и не обращаться к GitHub без прямой просьбы.
- Не коммитить это дерево пакетом «заодно».

## Последняя эстафета

2026-09-30 — Cursor — заведены `docs/context/NOW.md` и `HANDOFF.md`. Рабочее дерево до этого уже было грязным; его состав перечислен выше.
