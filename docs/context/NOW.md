# Latest changes

Обновлено: 2026-10-27  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## PHP alert stacked 3× (regex `\b` + polluted templates)

- **Причина:** strip старых `<p class="tech-php-alert">` использовал `\b` после кавычки класса — перед `>` границы слова нет, regex никогда не матчил. Плюс render перезаписывал `audit_template_*` уже готовым HTML → алерты копились в базе шаблона (на VPS free_ru было 3 body-алерта).
- **Fix:** глобальный strip всех `tech-php-alert` перед вставкой одного; больше не пишем rendered HTML поверх `audit_template_*`. На VPS восстановлены чистые templates + новый script.

### Очередь
- Commit/push; re-queue аудита чтобы клиентский R2 HTML обновился.
