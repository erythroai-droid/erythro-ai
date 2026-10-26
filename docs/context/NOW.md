# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## PIT-135 + PHP critical alert в отчёте

- **Сделано:** реальные `detected_technologies`; на PHP / WordPress / Drupal / Joomla / Bitrix — бейдж Critical + сноска CVE-2026-109618/109619 → WhatsApp Erythro.
- **Осталось:** commit/push (если ещё не); redeploy audit-agent; прогон аудита для samples.

### Очередь
1. Redeploy worker + smoke на сайте с PHP/WordPress.
