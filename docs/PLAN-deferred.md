# Deferred follow-ups (updated 2026-09-06)

Напомнить в следующем сеансе, когда пользователь спросит про безопасность / perf / R2 / admin.

**Критичных blocker сейчас нет** — cutover R2 + UFW baseline + home/portfolio ISR сделаны.

## Next when there is time

| Priority | Item | Notes |
|---|---|---|
| medium | Cloudflare Access на `/admin*` | Zero Trust PIN/SSO — `docs/infrastructure/vps-firewall-cloudflare-access.md` §2 |
| medium | Desktop CLS (~1.1) | HeroMotionText layout reserve / SSR first paint — CWV |
| low | Purge Vercel Blob copies | After admin upload→R2 verified; then drop `BLOB_READ_WRITE_TOKEN` |
| low | Leftover ~4 Blob URL mentions in HTML | Rewrite/cache already mostly on R2 |
| low | `AGENT_REQUIRE_HMAC=1` | Only after n8n signs bodies |
| later | CF-only UFW 80/443 | Needs orange cloud + Origin Cert for n8n/agent-api |
| later | ISR remaining frontend pages | about/contacts/services/order/legal/audit still use `getRequestPrefs` (PIT-056) |
| later | Custom domain `media.erythro.ai` | r2.dev is rate-limited |

## Done

- [x] R2 media migrate 90/90 + site serving `pub-…r2.dev`
- [x] Blob→R2 rewrite in `publicMediaUrl` + cache key bump
- [x] UFW baseline 22/80/443 + DOCKER-USER DROP :8080
- [x] Audit worker SSRF + HMAC-ready deploy
- [x] Home + `/portfolio` ISR: no layout/`getRequestPrefs` cookies; shell content on portfolio; `revalidate=60`
