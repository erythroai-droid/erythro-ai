# Translater service (consultant backend)

HTTP front for the Erythro Translater pipeline. Used **only** by
`POST /api/consult` on Vercel — never by the browser, so neither the URL nor
the secret may become `NEXT_PUBLIC_*`.

| | |
|---|---|
| Endpoint | `POST /api/translate` |
| Health | `GET /health` |
| Auth | `X-Erythro-Signature: sha256=<hmac-sha256(body, CONSULT_TRANSLATE_SECRET)>` |
| Direction | RU → EN or HE |
| Styles | `UI/Microcopy` (chat terms), `Documentation/RFC` (whole brief) |

Request:

```json
{ "text": "ручка", "source": "ru", "target": "en", "style": "UI/Microcopy" }
```

Response:

```json
{ "text": "endpoint", "status": "translated" }
```

`status: "skipped"` means the pipeline was unavailable and only the fallback
glossary ran. The consultant then keeps the original wording and marks the
brief `translaterStatus=skipped` in the admin — a wrong Hebrew term in a brief
is worse than a Russian one.

## Vendoring the agent

The agent source is not in this repo. Before building:

```powershell
# from services/translater
Copy-Item -Recurse C:\agents\Translater .\agent
```

`agent/` is gitignored. Without it the service starts in glossary-only mode,
which is fine locally but **not** acceptable for production EN/HE briefs.

## Deploy (only on explicit request)

Port is never published on the host — Caddy terminates TLS and reaches the
container over `proxy_network` (see `docs/infrastructure/vps-docker-ports.md`,
PIT-053).

```bash
cd /srv/translater
cp .env.example .env    # GEMINI_API_KEY, CONSULT_TRANSLATE_SECRET
docker compose up -d --build
docker compose exec translater python -c "import urllib.request;print(urllib.request.urlopen('http://127.0.0.1:8090/health').read())"
```

DNS: `translate` A record pointing at the VPS, **DNS only** (grey cloud), same
as `agent-api`. Caddy block lives in `infra/caddy/Caddyfile`.

Then on Vercel:

```
CONSULT_TRANSLATE_URL=https://translate.erythro.ai/api/translate
CONSULT_TRANSLATE_SECRET=<same value as the container>
```

Leaving `CONSULT_TRANSLATE_URL` empty disables the call entirely (glossary-only
path in `src/lib/consultant/translate.ts`).
