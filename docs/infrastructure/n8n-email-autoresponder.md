# n8n: Email Autoresponder (`order@erythro.ai` & `team@erythro.ai`)

Автоматический обработчик и автоответчик входящих писем для корпоративных ящиков Erythro.ai на базе n8n.

---

## 1. Обзор работы воркфлоу

1. **IMAP Triggers**: Опрашивает почтовые ящики `order@erythro.ai` и `team@erythro.ai` (Hostinger: `imap.hostinger.com:993` SSL/TLS).
2. **Anti-Loop & Spam Filter (RFC 3834)**:
   - Игнорирует письма от отправителей `@erythro.ai` (защита от зацикливания).
   - Игнорирует `mailer-daemon`, `no-reply`, `postmaster`, `bounce`.
   - Игнорирует письма с заголовками `Auto-Submitted: auto-replied`, `Precedence: bulk/junk/list`, `X-Autoreply`.
3. **Thread Detection (Защита от спама в диалогах)**:
   - Игнорирует входящие ответы в рамках существующей переписки (проверка заголовков `In-Reply-To`, `References`, а также тем с префиксами `Re:`, `Fwd:`, `Отв:`, `На:`).
4. **24h Cooldown Rate-Limiting**:
   - Использует `$getWorkflowStaticData('global')` для хранения временных меток ответов.
   - Не отправляет автоответ одному и тому же адресату чаще одного раза в 24 часа при повторных входящих письмах.
5. **Фирменная подпись и чистое форматирование**:
   - Вставляется в каждое исходящее письмо в форматах HTML и Plain text с явным цветом текста `#000000` на белом фоне.
   - Опция **Append n8n Attribution** в узлах SMTP выключена (`OFF`), предотвращая появление строки *"This email was sent automatically with n8n"*.
6. **SMTP Reply**:
   - Отправляет ответ с соответствующего адреса с корректными заголовками трединга (`In-Reply-To`, `References`, `Auto-Submitted: auto-replied`).
7. **Не покрывает заявки с сайта.** `POST /api/contact` шлёт notify From `order@erythro.ai` (n8n это пропускает). Подтверждение клиенту «заявка принята» — отдельный SMTP из приложения (`sendClientAcknowledgement`, PIT-044), не IMAP Reply-To.

---

## 2. Подписи для ящиков

### Ящик `order@erythro.ai`
```text
Best regards, 
Customer Service Orders 
Tel. +972505308305
Email: order@erythro.ai
URL: https://erythro.ai
----------------------------
Hi-Load Web Development & Ai Agents Automation
```

### Ящик `team@erythro.ai`
```text
Best regards, 
Customer Support & Operations Team
Tel. +972505308305
Email: team@erythro.ai
URL: https://erythro.ai
----------------------------
Hi-Load Web Development & Ai Agents Automation
```

---

## 3. Настройка и учетные данные в n8n (`https://n8n.erythro.ai`)

### Параметры подключения к Hostinger Email:

| Тип | Host | Port | SSL/TLS | User | Password |
|---|---|---|---|---|---|
| **IMAP (Order)** | `imap.hostinger.com` | `993` | Yes | `order@erythro.ai` | `[MAIL_PASS]` |
| **IMAP (Team)** | `imap.hostinger.com` | `993` | Yes | `team@erythro.ai` | `[MAIL_PASS]` |
| **SMTP (Order)** | `smtp.hostinger.com` | `465` | Yes | `order@erythro.ai` | `[MAIL_PASS]` |
| **SMTP (Team)** | `smtp.hostinger.com` | `465` | Yes | `team@erythro.ai` | `[MAIL_PASS]` |

---

## 4. Развертывание воркфлоу

### Вариант 1. Автоматически через скрипт:
```bash
set VPS_PASSWORD=...
py -3 scripts/deploy_n8n_email_autoresponder.py
```

### Вариант 2. Вручную через интерфейс n8n:
1. Открыть `https://n8n.erythro.ai`
2. **Workflows → Import from File** → `infra/n8n/workflows/email-autoresponder.json`
3. Привязать учетные данные IMAP и SMTP к соответствующим узлам.
4. Включить переключатель **Active**.
5. **Обязательно выключить Hostinger Autoreply** на тех же ящиках (иначе клиент получит два письма — см. PIT-040):
   - [Hostinger Mail](https://mail.hostinger.com/) → Settings → **Auto-reply / Vacation** → Off (`order@` и `team@`).
   - Или hPanel → Emails → Autoresponder → disable.

Подпись Hostinger webmail (*High-Performance Web & Scalable AI Infrastructure*) — это не n8n. Её можно оставить/обновить для ручных писем из webmail; автоответ должен быть только в n8n.
