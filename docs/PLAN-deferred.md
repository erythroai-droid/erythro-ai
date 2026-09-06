# Deferred follow-ups (updated 2026-09-06)

Напомнить в следующем сеансе, когда пользователь спросит про безопасность / perf / R2 / admin.

**Критичных blocker сейчас нет** — cutover R2 + UFW baseline + home/portfolio ISR сделаны.

## Next when there is time

| Priority | Item | Notes |
|---|---|---|
| high | Cloudflare Access на `/admin*` | Zero Trust PIN/SSO — `docs/infrastructure/vps-firewall-cloudflare-access.md` §2. **Still open:** `/admin` returns 200 without Access gate. |
| high | DMARC `p=reject` | After ~7 days of clean aggregate reports at `order@erythro.ai`. Live now: `p=quarantine; rua=mailto:order@erythro.ai; pct=100;`. Raise TXT `_dmarc` to `v=DMARC1; p=reject; rua=mailto:order@erythro.ai; pct=100;` |
| medium | CSP nonce (drop `'unsafe-inline'`) | Public CSP already dropped `'unsafe-eval'`; admin keeps eval for Payload. Full nonce needs middleware + Script wiring. |
| medium | Desktop CLS (~1.1) | Partially addressed: poster LCP without isLg gate, heading min-height + cross-locale slot, useLayoutEffect locale — re-measure after deploy |
| low | Purge Vercel Blob copies | After admin upload→R2 verified; then drop `BLOB_READ_WRITE_TOKEN` |
| low | Leftover ~4 Blob URL mentions in HTML | Rewrite/cache already mostly on R2 |
| low | `AGENT_REQUIRE_HMAC=1` | Only after n8n signs bodies |
| later | CF-only UFW 80/443 | Needs orange cloud + Origin Cert for n8n/agent-api |
| later | ISR remaining frontend pages | services/order/audit still use `getRequestPrefs` / dynamic params (PIT-056) |
| later | Custom domain `media.erythro.ai` | r2.dev is rate-limited |

## Done

- [x] ISR for `/about`, `/contacts`, `/accessibility`, `/privacy`, `/terms`: `force-static` + `revalidate=60` + `clientHydratePrefs` (PIT-056)
- [x] Fix Desktop CLS in Hero motion: replace `fontSize` tween with GPU `scale` transform (PIT-063)
- [x] R2 media migrate 90/90 + site serving `pub-…r2.dev`
- [x] Blob→R2 rewrite in `publicMediaUrl` + cache key bump
- [x] UFW baseline 22/80/443 + DOCKER-USER DROP :8080
- [x] Audit worker SSRF + HMAC-ready deploy
- [x] Home + `/portfolio` ISR path: `force-static` + `revalidate=60`, no layout/`not-found` cookies, middleware without Set-Cookie, `getPayloadLocal` + shell content
- [x] `poweredByHeader: false` + middleware strip `x-powered-by`
- [x] Public CSP without `'unsafe-eval'` (admin path keeps looser policy)
- [x] DMARC `p=quarantine` + `rua=mailto:order@erythro.ai` (2026-09-06)
