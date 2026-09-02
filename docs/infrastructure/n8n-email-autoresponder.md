# n8n: Email Autoresponder (`order@erythro.ai` & `team@erythro.ai`)

Автоматический обработчик и автоответчик входящих писем для корпоративных ящиков Erythro.ai на базе n8n.

---

## 1. Обзор работы воркфлоу

1. **IMAP Triggers**: Опрашивает почтовые ящики `order@erythro.ai` и `team@erythro.ai` (Hostinger: `imap.hostinger.com:993` SSL/TLS).
2. **Anti-Loop & Spam Filter (RFC 3834)**:
   - Игнорирует письма от отправителей `@erythro.ai` (защита от зацикливания).
   - Игнорирует `mailer-daemon`, `no-reply`, `postmaster`, `bounce`.
   - Игнорирует письма с заголовками `Auto-Submitted: auto-replied`, `Precedence: bulk/junk/list`, `X-Autoreply`.
3. **Фирменная подпись (Email Signature)**:
   - Вставляется в каждое исходящее письмо в форматах HTML и Plain text.
4. **SMTP Reply**:
   - Отправляет ответ с соответствующего адреса с корректными заголовками трединга (`In-Reply-To`, `References`, `Auto-Submitted: auto-replied`).

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
