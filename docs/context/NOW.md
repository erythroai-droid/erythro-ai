# Latest changes

Обновлено: 2026-10-01  
Модель: Cursor  
Ветка: `feat/ai-consultant`

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Сделано в этой сессии

- **Инцидент 2026-10-07 (PIT-104):** после PR #223 (Payload 3.90.2) на проде пропали картинки и весь CMS-контент, админка не грузила данные. Причина: `plugin-cloud-storage` 3.90 читает `media._objectkey`, а колонки не было. На проде колонка добавлена вручную (`ADD COLUMN IF NOT EXISTS`, 92 записи целы), `/api/media` снова отдаёт данные. В репо: миграция `20261007_031500_media_object_key` в `index.ts` и колонка в `payload-generated-schema.ts` (закоммичено и запушено в `feat/ai-consultant`). **Осталось:** сбросить `unstable_cache` (тег `site-content`): сохранить любой global в админке или вызвать `POST /api/revalidate?secret=…`. Без этого страницы держат закешированный fallback. Затем PR в `main` и деплой миграции. Миграция `20261007_021500_users_…` использует `pg_advisory_lock` + `finally`, что противоречит PIT-086. Не исправлено.

- Обновлен типовой договор на разработку ПО (`docs/templates/software-development-agreement-israel-ru.md` и в Obsidian `04-Templates`): реквизиты Исполнителя заполнены (ИП Вадим Коваленко, т.з. 345506752, г. Эйлат, שד ששת הימים 160/43), учтен налоговый статус *Осек Патур / Осек Заир* (освобождение от НДС по ст. 31(3) Закона об НДС Израиля), подсудность — суд г. Эйлат / Южного округа.
- Анонимные вопросы консультанта пишутся в коллекцию `consult-question-log` (админка: Consultant → Chat questions): текст, язык, код посетителя. Полная переписка по-прежнему только после OTP и телефона. Файл на Vercel не используется. Миграция `20261001_021000_consult_question_log` применится на следующем деплое. В `/privacy` добавлено, что текст вопроса сохраняется.

## Проверено

До этой записи анонимный чат в базу не попадал. В `consult_sessions` одна запись от 2026-09-16. За 24 ч на проде было 8 вызовов `POST /api/consult` без текста.

## Сейчас не назначено

Лимит 10 не менял. Следующего шага нет, пока пользователь не попросит снизить его. Очередь «когда будет время» — [`docs/PLAN-deferred.md`](../PLAN-deferred.md).

## Незакоммиченное дерево (не продолжать без просьбы)

На `feat/ai-consultant` уже лежат чужие незавершённые правки прошлых сессий. Это не одна задача и не поручение следующей модели.

- QA_Auditor: `AuditCollector.java`, отчёты A4, HTML-шаблоны, `AGENTS.md` / `README.md` аудитора. Правка одной копии требует ту же относительную правку в `C:\agents\website-auditor\erythro-ai\QA_Auditor`.
- WhatsApp translator: `docs/infrastructure/whatsapp-translator.md`, `whatsapp-tech-provider.md`, `infra/caddy/Caddyfile`, `scripts/ensure-wa-dns.mjs`, `scripts/deploy_whatsapp_translator.py`.
- Документы и правила: Supabase Data API grants, `docs/architecture/ai-token-spend.md`, правки VPS/n8n/firewall, `PLAN-deferred`, `RAG_INDEX`, `DEPLOYMENT`.
- Сайт: `src/lib/pageFaq.ts`, `src/lib/servicePages.ts`, `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js`.
- Прочее неотслеживаемое: `docs/sales/`, OG-картинки в `public/images/`, `scripts/inspect-*-locale.ts`, `scripts/_scan_l10n_v2.mjs`, `scripts/_verify_l10n_v2.ts`.
- Консультант (эта сессия): `src/lib/consultant/pageLink.ts`, `handler.ts`, `prompt.ts`, `stream.ts`, `types.ts`, виджет, `docs/architecture/gemini-consultant.md`.

## Не делать

- Не считать пункты `PLAN-deferred.md` текущей задачей.
- Не зеркалировать этот файл в Obsidian.
- Не запускать тесты и не обращаться к GitHub без прямой просьбы.
- Не коммитить это дерево пакетом «заодно».

## Последняя эстафета

2026-10-01 — Cursor — консультант пишет ссылку на страницу услуги в чат и не закрывается. На проде появится после деплоя.
