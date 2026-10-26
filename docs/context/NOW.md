# Latest changes

Обновлено: 2026-10-26  
Модель: Composer (Cursor)

Этот файл — оперативная память сессии. Читать его первым. Закрытые пункты удалять, не копить журнал.

## В работе: mobile perf

### Сделано (ждёт деплоя)
- **Splash только на `/`**: внутренние страницы без заставки (`shouldSkipSplashSurface` + bootstrap). Тесты `splash.int` / `adsConversion.int` зелёные.

### Очередь (согласовано)
1. **Deploy** skip-splash → перемерить PSI mobile на `/portfolio` и `/services/*`.
2. **Сжать / привести в порядок картинки на services** (PSI: `header_14.jpg` ~180 KiB лишнего на mobile).
3. Позже: ISR `/services/*` (сейчас `getRequestPrefs`, TTFB выше).
4. **Не трогать пока:** аналитика (GTM/Meta), тяжёлый main-thread / chunk `8261` — после картинок.

### Baseline PSI mobile (prod, до деплоя skip-splash)
- `/` ~63, LCP ~8.3s · `/portfolio` ~53, LCP ~7.7s · `/services/ai-automation` ~73, LCP ~4.2s
