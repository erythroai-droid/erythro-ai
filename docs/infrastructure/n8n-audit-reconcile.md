# Audit stuck-job reconcile

Primary path is **Vercel Cron** every 2 minutes. n8n remains an optional VPS backup.

Stuck meaning: `source=audit` and `auditStatus` is `new` (worker never started) or `in_progress` (stalled mid-job).

## Endpoint

```http
GET  https://erythro.ai/api/audit/reconcile
POST https://erythro.ai/api/audit/reconcile
Authorization: Bearer <CRON_SECRET or AGENT_SECRET_TOKEN>
# or
X-Agent-Secret-Key: <AGENT_SECRET_TOKEN>
Content-Type: application/json

{"newStaleMinutes": 2, "inProgressStaleMinutes": 20}
```

Auth (any one):

- `X-Agent-Secret-Key` = `AGENT_SECRET_TOKEN` (n8n / worker)
- `Authorization: Bearer` = `CRON_SECRET` or `AGENT_SECRET_TOKEN` (Vercel Cron)

Behavior:

- `new` older than 2 minutes → re-queue worker (missed `/api/run-audit`)
- `in_progress` older than 20 minutes → re-queue (hung job, not a healthy Pro run)
- `retryCount >= 3` → mark `failed`
- Trigger retries twice on timeout/5xx

Also: `/api/contact` retries the worker in `after()` if the inline 8s trigger times out, so most misses never wait for cron.

## Vercel Cron (primary)

`vercel.json`:

```json
{
  "crons": [{ "path": "/api/audit/reconcile", "schedule": "*/2 * * * *" }]
}
```

Set Production env **`CRON_SECRET`** to the same value as `AGENT_SECRET_TOKEN` (Vercel injects `Authorization: Bearer $CRON_SECRET` on cron GET). Two-minute schedules need a Pro team.

## n8n backup (optional)

```bash
py -3 scripts/deploy_n8n_audit_reconcile.py
```

Manual: import `infra/n8n/workflows/audit-reconcile.json`, attach Header Auth `Agent Secret`, **Activate**.

## Manual smoke

```bash
curl -sS -X POST https://erythro.ai/api/audit/reconcile \
  -H "Content-Type: application/json" \
  -H "X-Agent-Secret-Key: $AGENT_SECRET_TOKEN" \
  -d '{"newStaleMinutes":2,"inProgressStaleMinutes":20}'
```

## Ops notes

- Do not put secrets in the workflow JSON in git.
- After rotating `AGENT_SECRET_TOKEN`, update Vercel (`AGENT_SECRET_TOKEN` + `CRON_SECRET`), worker `.env`, and the n8n credential together.
- Waiting-page poll uses a dedicated limiter (30/min), not the contact form 5/min bucket.
