# Cloudflare R2 — AI Audit reports

Bucket created **2026-08-31**: `erythro-audit-reports` (location **WEUR**, Standard).

Used for PDF/HTML audit reports (`reportUrl` on `contact-submissions`). Media Payload may stay on Vercel Blob until a later cutover; see [`ai-audit-architecture.md`](./ai-audit-architecture.md) §4.

## Env (Vercel + VPS worker)

| Variable | Required | Notes |
|---|---|---|
| `R2_ACCOUNT_ID` | yes | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | yes | From R2 API Token |
| `R2_SECRET_ACCESS_KEY` | yes | From R2 API Token |
| `R2_BUCKET` | no | Defaults to `erythro-audit-reports` |
| `R2_PUBLIC_BASE_URL` | no | Custom domain or r2.dev public URL for `reportUrl` |

S3 endpoint: `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`

Helpers: `src/lib/r2.ts`.

## Create API token (manual)

MCP creates the **bucket** only; keys are created in the dashboard:

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → **Manage R2 API Tokens**
2. Create token: Object Read & Write, scope bucket `erythro-audit-reports`
3. Copy Access Key ID + Secret → Vercel env (Production/Preview) and worker `.env`
4. Optional: R2 → bucket → **Settings** → Public access / custom domain → set `R2_PUBLIC_BASE_URL`

Do **not** commit secrets to git or docs.
