# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## Desktop splash brand beat (не задеплоено)

- **Desktop:** короткий splash снова на organic inner (переходы + cold load). Mobile inner по-прежнему skip.
- **Desktop quick timing:** ~1.3 с (appear 0.5 + hold 0.35 + fade 0.4) — бренд читается на главной.
- **Mobile quick:** без изменений (ранний fade для LCP).
- Conversion/ads (`/audit`, `/order/*`, LP, `fbclid`…) всегда skip.

### Очередь
1. Задеплоить → глазами desktop home + переход на /portfolio.
2. Chunk `8261` без OWNER не трогать.
