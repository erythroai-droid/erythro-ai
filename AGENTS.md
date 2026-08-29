# Erythro.ai AI Agent Rules

## Правило двухсторонней синхронизации базы знаний (Knowledge Base Sync):
1. Если в ходе задачи создается новый архитектурный документ, шаблон, описание интеграции или отчет об ошибке:
   - Сохраняй файл в проект: `docs/[категория]/[имя].md`
   - ОБЯЗАТЕЛЬНО параллельно записывай его копию в Obsidian: `D:\Obsidian\Knowledge-Base\[категория]\[имя].md`
2. Если исправлен баг или обнаружен новый факап:
   - Обнови `docs/PITFALLS.md` в проекте И `D:\Obsidian\Knowledge-Base\05-Glossary-FAQ\pitfalls-troubleshooting.md`.

---

## Архитектурные стандарты проекта
- **Стек:** Next.js 15 App Router, React 19, TypeScript strict, Tailwind CSS, Payload CMS 3.0, PostgreSQL (Drizzle adapter).
- **RTL & Мультиязычность:** Полная поддержка EN, RU, HE. Использовать только логические классы Tailwind (`ps-`, `pe-`, `start-`, `end-`, `rtl:rotate-180`). Фиксированная ширина интерактивных элементов запрещена (стресс-тест +40% для кириллицы).
- **База знаний:** Основной репозиторий знаний и стандартов находится в `D:\Obsidian\Knowledge-Base` (доступен также через MCP-сервер `knowledge-base`).
