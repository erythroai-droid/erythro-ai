# AI Audit Worker (Node)

Skeleton service for MVP: accepts `POST /api/run-audit`, uploads a stub HTML report to Cloudflare R2, updates CMS via `/api/audit/internal/[id]`, emails the client from `order@erythro.ai`.

## Endpoints

| Method | Path | Auth |
|---|---|---|
| GET | `/health` | none |
| POST | `/api/run-audit` | `X-Agent-Secret-Key` |

Body:

```json
{
  "submissionId": 123,
  "targetUrl": "https://example.com",
  "locale": "en",
  "planSlug": "audit-free",
  "clientEmail": "client@example.com",
  "clientName": "Ada"
}
```

Responds `202` immediately; work continues in background. If `clientEmail` is omitted, the worker loads it from CMS (`GET /api/audit/internal/[id]`).

Delivery order: R2 → CMS `report_sent` → SMTP to client.

## Env

See `.env.example`. Secrets never go in git. Required for mail: `SMTP_PASS` (same Hostinger mailbox password as Vercel).

## Docker

```bash
docker compose up -d --build
```

Must join external network `proxy_network` (Caddy).
