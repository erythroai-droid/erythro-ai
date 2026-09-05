# Deferred hardening / perf (2026-09-05)

Отложено по запросу после R2 cutover + фокуса на UFW. Напомни агенту в следующем сеансе про безопасность/perf.

## Security (отложено)

| Item | Priority | Notes |
|---|---|---|
| Cloudflare Access на `/admin*` | medium | Zero Trust PIN/SSO; см. `docs/infrastructure/vps-firewall-cloudflare-access.md` §2 |
| `AGENT_REQUIRE_HMAC=1` на worker | low | Только после подписи тел в n8n; иначе сломает reconcile/triggers |
| UFW «только Cloudflare IP» на 80/443 | blocked → later | Сейчас `n8n`/`agent-api` = **DNS only** → трафик идёт на origin IP. CF-only UFW их убьёт. Сначала Origin Cert + orange cloud, потом CF CIDR. |

## Performance (отложено)

| Item | Notes |
|---|---|
| Edge HTML cache / ISR | Сейчас `getRequestPrefs()` → cookies → `private, no-store` |
| Re-measure CLS/LCP на prod | После деплоя hero/preload правок |
| Custom domain `media.erythro.ai` | r2.dev rate-limited; для prod лучше custom |

## Done / in progress

- [x] R2 media migrate 90/90
- [x] UFW baseline on VPS (2026-09-05): deny incoming except 22/80/443
- [x] Docker bypass fix: DROP tcp/8080 in DOCKER-USER (`montblanc_api`); persist with netfilter-persistent

