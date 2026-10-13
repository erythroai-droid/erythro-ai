# AI Free Audit Rate Limiting & Cooldown Architecture

## Обзор и назначение

Для защиты от спама, злоупотребления вычислительными ресурсами и перерасхода токенов LLM при генерации бесплатных AI-аудитов (`source=audit`, `planSlug=audit-free`) внедрено ограничение: **1 домен на пользователя раз в 7 дней**.

---

## Принцип работы

1. **Идентификация и нормализация домена (`extractAuditDomain`):**
   * Все URL и строки сайтов преобразуются к каноническому имени хоста в нижнем регистре:
     - `https://www.example.com/page?query=1` → `example.com`
     - `http://sub.domain.co.il:8080` → `sub.domain.co.il`
     - `WWW.My-Site.Com/` → `my-site.com`

2. **Фиксация IP и времени запроса:**
   * В таблице базы данных `contact_submissions` добавлена колонка `ip` (`varchar`).
   * Колонка `created_at` (стандартная для Payload CMS) фиксирует точное время и дату каждого входящего запроса.
   * IP клиента извлекается через заголовки прокси (`cf-connecting-ip` от Cloudflare, `x-forwarded-for`, `x-real-ip`).

3. **Проверка Cooldown (7 дней = 604 800 000 мс):**
   При поступлении заявки на бесплатный аудит на `/api/contact` перед записью и запуском воркера выполняется запрос в базу данных (`contact-submissions`):
   * **Domain Cooldown:** Проверяется, анализировался ли данный канонический домен за последние 7 дней (статусы `new`, `in_progress` или `report_sent`).
   * **User Cooldown (IP / Email):** Проверяется, отправлял ли этот пользователь (по IP или Email) заявку на бесплатный аудит за последние 7 дней.
   * Если лимит превышен, возвращается ответ `429 Too Many Requests` с заголовками `Retry-After`, полями `retryAfterSec` / `retryAfterLabel` (дни, часы, минуты) и локализованным сообщением (EN, RU, HE).
   * Фронт (`/audit`, order modal) показывает модалку с точным остатком до обнуления.
   * Ошибочные/упавшие попытки (`auditStatus=failed`) не блокируют пользователя.
   * Платные тарифы (`audit-diagnostic`, `audit-pro`) и прямые заказы услуг не подпадают под ограничение бесплатного аудита. Manual идёт через contact form, не через Free cooldown.

4. **Флаг QA:** `AUDIT_INTAKE_LIMITS_OPEN_FOR_QA` в `src/lib/auditRateLimit.ts` (сейчас `false`). Override: `AUDIT_SKIP_COOLDOWN=0|1` на Vercel.

---

## Схема интеграции

```
[Пользователь] 
      │ (POST /api/contact)
      ▼
[Next.js /api/contact]
      │
      ├─► 1. getRequestIp(request)
      ├─► 2. isFreeAudit ? checkFreeAuditCooldown()
      │         │
      │         ├─► [DB: contact_submissions (7d window)]
      │         └─► Если лимит превышен ──► 429 + retryAfterLabel (RU/EN/HE) → модалка
      │
      ├─► 3. payload.create({ ..., ip, createdAt })
      └─► 4. triggerAuditAgent()
```
