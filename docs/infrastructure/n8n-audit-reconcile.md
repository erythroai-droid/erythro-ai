# n8n: AI Audit reconcile cron

Re-queues stuck Free audit submissions (`auditStatus` = `new` | `in_progress`, stale `updatedAt`) by calling the Next.js reconcile API.

## Endpoint

```http
POST https://erythro.ai/api/audit/reconcile
X-Agent-Secret-Key: <AGENT_SECRET_TOKEN>
Content-Type: application/json

{"staleMinutes": 10}
```

Auth: same `AGENT_SECRET_TOKEN` as the VPS worker / Vercel.

Behavior:

- Scans up to 25 stuck `source=audit` rows older than `staleMinutes` (default 10, max 120)
- `retryCount >= 3` → mark `failed`
- else bump `retryCount` and `POST` worker `/api/run-audit` (with email/name from CMS)

## Import workflow

### Авто (предпочтительно)

```bash
# VPS_PASSWORD + AGENT_SECRET_TOKEN в локальном env
py -3 scripts/deploy_n8n_audit_reconcile.py
```

Скрипт на VPS: импортирует credential `Agent Secret` (`X-Agent-Secret-Key`) + workflow `AI Audit reconcile`, пытается включить Active.

### Вручную

1. Open `https://n8n.erythro.ai` (owner account after reset).
2. **Workflows → Import from File** → `infra/n8n/workflows/audit-reconcile.json`
3. Open the **HTTP Request** node → Header Auth credential:
   - Name: `Agent Secret`
   - Header Name: `X-Agent-Secret-Key`
   - Header Value: production `AGENT_SECRET_TOKEN` (from Vercel / VPS `/home/audit-agent/.env`)
4. Activate the workflow (Schedule every 10 minutes).

## Manual smoke

```bash
curl -sS -X POST https://erythro.ai/api/audit/reconcile \
  -H "Content-Type: application/json" \
  -H "X-Agent-Secret-Key: $AGENT_SECRET_TOKEN" \
  -d '{"staleMinutes":10}'
```

## Ops notes

- n8n lives on Hostinger VPS behind Caddy (`infra/n8n/docker-compose.yml`).
- Do not put the secret in the workflow JSON in git — only in n8n credentials.
- After rotating `AGENT_SECRET_TOKEN`, update Vercel, worker `.env`, and this n8n credential together.
