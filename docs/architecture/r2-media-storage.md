# Cloudflare R2 — Payload media

Bucket created **2026-09-05**: `erythro-media` (location **WEUR**, Standard).

Public development URL (enabled 2026-09-05):  
`https://pub-bca1ac764c56451890e973c90029a977.r2.dev`  
(rate-limited; prefer custom domain `media.erythro.ai` for production later.)

Replaces Vercel Blob for the Payload `media` collection when a **public** base URL is configured. Audit reports stay in `erythro-audit-reports` (see [`r2-audit-storage.md`](./r2-audit-storage.md)).

## Env (Vercel + local)

| Variable | Required | Notes |
|---|---|---|
| `R2_ACCOUNT_ID` | yes | Shared with audit R2 |
| `R2_ACCESS_KEY_ID` | yes | Prefer a token scoped to both buckets |
| `R2_SECRET_ACCESS_KEY` | yes | |
| `R2_MEDIA_BUCKET` | no | Defaults to `erythro-media` |
| `R2_MEDIA_PUBLIC_BASE_URL` | **yes to enable** | Public r2.dev or custom domain — without this, Payload keeps Vercel Blob |
| `NEXT_PUBLIC_R2_MEDIA_BASE_URL` | recommended | Same as public base (client rewrites / admin preview) |
| `NEXT_PUBLIC_R2_MEDIA_HOST` | recommended | Hostname only for `next/image` `remotePatterns` |

S3 endpoint (uploads only): `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`

Code: `src/lib/r2Media.ts`, `src/payload.config.ts` (`@payloadcms/storage-s3`).

## Enable public access (manual)

MCP creates the bucket only. Public serve URL is dashboard work:

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → `erythro-media`
2. **Settings** → Public access → allow `r2.dev` subdomain **or** attach `media.erythro.ai`
3. Set `R2_MEDIA_PUBLIC_BASE_URL` / `NEXT_PUBLIC_R2_MEDIA_*` on Vercel (Production + Preview)
4. Expand the R2 API token to include `erythro-media` Object Read & Write  
   (если миграция падает с `Access Denied` — токен создан только для `erythro-audit-reports`)
5. CORS on the bucket: allow `PUT` / `GET` from `https://erythro.ai` and admin origins (needed for `clientUploads`)

## Migrate existing Blob objects

```bash
# Dry-run
node scripts/migrate-blob-media-to-r2.mjs

# Upload + rewrite media.url in Postgres
node scripts/migrate-blob-media-to-r2.mjs --apply
```

Then:

```bash
pnpm generate:importmap
```

**Important:** SQL migration does **not** fire Payload `afterChange` hooks, so Next.js `unstable_cache` may keep serving old Blob URLs until you bust the tag:

```bash
curl -X POST "https://erythro.ai/api/revalidate?secret=$REVALIDATION_TOKEN"
```

Or edit/save any media doc in `/admin` once. Commit the regenerated `importMap.js` (S3 client upload handler). Redeploy. Remove `BLOB_READ_WRITE_TOKEN` only after verifying uploads + video Range on R2.

## Cutover checklist

- [x] Public base URL reachable (`https://pub-bca1ac764c56451890e973c90029a977.r2.dev`)
- [x] Env on Vercel (Production + Preview): `R2_MEDIA_*` + `NEXT_PUBLIC_R2_MEDIA_*` + new `erythro-r2` keys
- [x] Migration `--apply`: 90/90 copied + `media.url` rewritten (2026-09-05)
- [ ] New admin upload lands on R2 URL (not Blob)
- [ ] `<video>` seek works (206 Partial Content) on production
- [ ] `next/image` serves R2 host without 400
- [ ] CORS for client uploads from `https://erythro.ai` / admin origin
- [ ] Remove `BLOB_READ_WRITE_TOKEN` after verification
