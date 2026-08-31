# AI Audit Worker (Node)

Skeleton service for MVP: accepts `POST /api/run-audit`, uploads a stub HTML report to Cloudflare R2, optionally updates Payload `contact-submissions`.

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
  "planSlug": "audit-free"
}
```

Responds `202` immediately; work continues in background.

## Env

See `.env.example`. Secrets never go in git.

## Docker

```bash
docker compose up -d --build
```

Must join external network `proxy_network` (Caddy).
