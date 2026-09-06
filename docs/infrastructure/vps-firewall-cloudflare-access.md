# VPS firewall + Cloudflare Access for `/admin`

Hardening for Hostinger VPS (`n8n` + `agent-api` behind Caddy) and Payload admin.

> **Важно (2026-09-05):** `n8n.erythro.ai` и `agent-api.erythro.ai` сейчас **DNS only** (серое облако) → трафик идёт прямо на `46.202.155.56`. UFW «разрешить 80/443 только с IP Cloudflare» **сломает** эти сервисы и Let's Encrypt HTTP-01. Сначала Origin Certificate + Proxied, потом CF-only. Пока — baseline UFW ниже. Отложенное: [`PLAN-deferred.md`](../PLAN-deferred.md).

## 1. Baseline UFW (сейчас) — только 22 / 80 / 443

Цель: закрыть любой случайно опубликованный Docker-порт; оставить SSH и Caddy.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status verbose
```

Applied **2026-09-05** via `scripts/apply_vps_ufw_baseline.py` on `46.202.155.56`.

**Docker caveat:** UFW does not stop `docker-proxy` publishes. `montblanc_api` had `0.0.0.0:8080`. Fixed with:

```bash
iptables -I DOCKER-USER 1 -p tcp --dport 8080 -j DROP
# then: netfilter-persistent save
```

Verify: `curl -I http://46.202.155.56:8080` times out; `https://n8n.erythro.ai` still 200.

**Новые сервисы:** см. обязательный чеклист [`vps-docker-ports.md`](./vps-docker-ports.md) — UFW сам по себе порты Docker не закрывает.

Опционально сузить SSH: `ufw delete allow OpenSSH` затем `ufw allow from <your-ip>/32 to any port 22 proto tcp`.

## 1b. Cloudflare-only 80/443 (позже, после orange cloud)

Goal: block direct hits to the VPS public IP that bypass Cloudflare proxy.

Prerequisites: `n8n` + `agent-api` Proxied + valid Origin Cert (или Cloudflare SSL Full Strict).

1. Collect Cloudflare IP ranges: https://www.cloudflare.com/ips/
2. On the VPS:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH

# IPv4 — repeat for each Cloudflare CIDR
sudo ufw allow from 173.245.48.0/20 to any port 80,443 proto tcp
# … (full list from Cloudflare)

# IPv6 similarly if the host has AAAA

# Remove the wide allow 80/443 if previously set:
# sudo ufw delete allow 80/tcp
# sudo ufw delete allow 443/tcp

sudo ufw enable
sudo ufw status numbered
```

Keep SSH allowlisted to your IP if possible (`ufw allow from <you>/32 to any port 22`).

Caddy still binds `80/443` on the host; UFW drops non-Cloudflare sources before Docker.

## 2. Cloudflare Access for `/admin`

Goal: Payload login is not on the open internet.

1. Zero Trust → **Access** → **Applications** → Add application → Self-hosted
2. Application domain: `erythro.ai` (or `www`) with path `/admin*`
3. Policy: allow your email / Google SSO / one-time PIN
4. Optional: also protect `/api` admin endpoints if exposed

No app code change required — Access sits in front of Vercel/Cloudflare. Document the Access app name in the team password manager.

**Status (2026-09-06):** **Enabled.** Live check: `curl.exe -sI https://erythro.ai/admin` → **HTTP 302** to `*.cloudflareaccess.com/cdn-cgi/access/login/…` with `Www-Authenticate: Cloudflare-Access`. Public site `/` remains **200** (not gated).

**Pitfall:** Subdomain field must be **empty**. Putting `erythro-admin` there would protect `erythro-admin.erythro.ai/admin*` instead of Payload on `erythro.ai/admin*`. App name is a label only.

**API note:** Wrangler OAuth could *list* apps but `POST …/access/apps` returned `auth.forbidden`. Optional script if you later have an Access Edit token: `node scripts/create-cloudflare-access-admin.mjs`.

**Dashboard (done):** Self-hosted app → hostname `erythro.ai` + `/admin*` (empty subdomain) → Allow policy for operator email.

## 2b. DMARC quarantine (Cloudflare DNS)

Live (2026-09-06): `_dmarc.erythro.ai` → `v=DMARC1; p=quarantine; rua=mailto:order@erythro.ai; pct=100;` (was `p=none`).

**Do not raise to `p=reject` before ~2026-09-13.** Quarantine window must collect aggregate reports first.

### Checklist ~2026-09-13 (goal remaining)

1. Inbox `order@erythro.ai`: open DMARC aggregate XML (often subject like `Report domain: erythro.ai`). Confirm no unexpected fail sources for legitimate mail (forms / transactional).
2. If clean → Cloudflare DNS → edit TXT `_dmarc` to:

```text
v=DMARC1; p=reject; rua=mailto:order@erythro.ai; pct=100;
```

3. Verify: `curl.exe -s "https://cloudflare-dns.com/dns-query?name=_dmarc.erythro.ai&type=TXT" -H "accept: application/dns-json"` shows `p=reject`.
4. Re-smoke Access: `curl.exe -sI https://erythro.ai/admin` still **302** Cloudflare Access (not bare 200).
5. Mark done in `docs/PLAN-deferred.md` + Obsidian sync.

**API helper (needs Zone DNS Edit token in `CLOUDFLARE_API_TOKEN`):**

```bash
# after reading order@ reports
node --env-file=.env.local scripts/set-dmarc-reject.mjs --dry-run
node --env-file=.env.local scripts/set-dmarc-reject.mjs
```

Or edit TXT in Cloudflare DNS UI. Nameservers are Cloudflare (`alice`/`chris`), not Hostinger.

## 3. Inter-service auth (already in code)

| Hop | Mechanism |
|---|---|
| Next → worker | `x-agent-secret-key` + HMAC `x-agent-signature` (SHA-256 of body) |
| Worker → Next `/api/audit/internal` | `x-agent-secret-key` (timing-safe) |
| n8n → Next `/api/audit/reconcile` | `x-agent-secret-key` |
| Worker Playwright target | DNS + private-IP SSRF guard before navigate |

Optional strict mode on the worker: `AGENT_REQUIRE_HMAC=1` rejects requests without a valid signature (break n8n until it signs bodies).

## 4. Smoke checks

```bash
# Should fail from a non-CF IP once UFW is on:
curl -I https://<vps-ip>/

# Admin without Access cookie → Cloudflare Access login
curl -I https://erythro.ai/admin
```
