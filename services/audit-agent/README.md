# AI Audit Worker (Node + Java QA_Auditor)

Accepts `POST /api/run-audit`, runs **QA_Auditor** (Playwright/Java), uploads HTML to Cloudflare R2, updates CMS via `/api/audit/internal/[id]`, emails the client from `order@erythro.ai` with a link to `/audit/report/[id]`.

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

Responds `202` immediately; QA run continues in background (often several minutes).

Plan → tier / page cap:

| planSlug | AUDIT_TIER | AGENT_BROWSE_MAX_PAGES |
|---|---|---|
| `audit-free` | FREE | 1 |
| `audit-diagnostic` | DIAGNOSTIC | 5 |
| `audit-pro` | PRO | 10 |

## Env

See `.env.example`. Required: `AGENT_SECRET_TOKEN`, R2_*, `SMTP_PASS`, `PAYLOAD_API_URL`.  
Optional: `GEMINI_API_KEY`, `PAGESPEED_API_KEY`, `QA_AUDITOR_TIMEOUT_MS` (default 900000).

## Docker

Image includes Maven, JDK 17, Node 22, Chromium for Playwright Java, and `QA_Auditor/` sources.

```bash
docker compose up -d --build
```

Must join external network `proxy_network` (Caddy). Memory limit ~4.5GB.
