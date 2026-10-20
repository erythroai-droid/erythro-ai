# n8n AI Audit Pro Offer Walker

Durable **cron Walker** for the free-audit Pro ₪390 funnel (ads LP + organic). Does **not** hold 72h Wait per lead and does **not** send SMTP itself.

Primary send path is still the site: Postgres due timestamps + [`/api/audit/reconcile`](../../src/app/api/audit/reconcile) (also Vercel Cron `*/2`). Funnel overview: [`docs/architecture/audit-pro-offer-funnel.md`](../architecture/audit-pro-offer-funnel.md).

## What it does

Every **5 minutes**:

```http
POST https://erythro.ai/api/audit/reconcile
X-Agent-Secret-Key: <AGENT_SECRET_TOKEN>
Content-Type: application/json

{"newStaleMinutes": 2, "inProgressStaleMinutes": 20}
```

That endpoint sweeps:

- stuck free-audit jobs
- due Pro offer (+15m)
- due −24h nudge
- due +72h development reminder

Sends happen only when `AUDIT_PRO_OFFER_ENABLED=1` **and** Pro/Diagnostic unpaid **and** email not unsubscribed.

## Import (inactive)

```bash
set VPS_PASSWORD=...
set AGENT_SECRET_TOKEN=...   # or services/audit-agent/.env.deployed.secret
py -3 scripts/deploy_n8n_audit_pro_offer_walker.py
# after AUDIT_PRO_OFFER_ENABLED=1:
py -3 scripts/deploy_n8n_audit_pro_offer_walker.py --activate
```

Default import: credential `Agent Secret` + workflow `AI Audit Pro Offer Walker` with **`active: false`**.  
`--activate` re-imports with `active: true`.

Manual: import [`infra/n8n/workflows/audit-pro-offer-walker.json`](../../infra/n8n/workflows/audit-pro-offer-walker.json), attach Header Auth `Agent Secret` (`X-Agent-Secret-Key`).

## Go-live checklist

1. Merge/deploy Pro funnel code + nudge migrate.
2. `AUDIT_PRO_OFFER_ENABLED=1` on Vercel Production (+ redeploy).
3. Import Walker, then `--activate` (or Activate in https://n8n.erythro.ai).

With the flag off, reconcile/Walker do not send commercial mail even if Active.

## Manual smoke

```bash
curl -sS -X POST https://erythro.ai/api/audit/reconcile \
  -H "Content-Type: application/json" \
  -H "X-Agent-Secret-Key: $AGENT_SECRET_TOKEN" \
  -d '{"newStaleMinutes":2,"inProgressStaleMinutes":20}'
```

Expect JSON with reconcile counts; with flag off, Pro offer fields stay `skipped` / no SMTP.

## Ops notes

- Do not put secrets in the workflow JSON in git.
- After rotating `AGENT_SECRET_TOKEN`, update Vercel, worker `.env`, and the n8n credential together.
- Companion stuck-job backup (10 min): [`n8n-audit-reconcile.md`](./n8n-audit-reconcile.md).
