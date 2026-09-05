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
