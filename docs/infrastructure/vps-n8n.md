# VPS & n8n Infrastructure Access

## 1. VPS Server Details
- **Host / IP:** `46.202.155.56`
- **SSH User:** `root`
- **SSH Command:** `ssh root@46.202.155.56`
- **OS:** Ubuntu 24.04.4 LTS (Noble Numbat)
- **Specs:** 8 GB RAM, 96 GB SSD

> Secrets (SSH / n8n admin passwords) — только в локальном secrets store / password manager, **не** в git. Исторические plaintext в старых копиях удалить при ротации.

---

## 2. Public services (behind Caddy)

| Service | URL | Notes |
|---|---|---|
| n8n | `https://n8n.erythro.ai` | Image pinned `2.39.6`; DNS A (DNS only) → VPS |
| Audit worker | `https://agent-api.erythro.ai` | `GET /health`, `POST /api/run-audit` |

Until DNS exists, hit via IP + Host header for smoke tests.

Docker network: `proxy_network` — containers `caddy_proxy`, `n8n`, `audit_agent_worker`.

---

## 3. Paths on VPS

| Path | Role |
|---|---|
| `/home/caddy/` | Caddyfile + compose |
| `/root/n8n/compose.yaml` | n8n (no host port 5678; via Caddy) |
| `/home/audit-agent/` | Worker image + `.env` |
| Volume `n8n_data` | n8n persistence |

Deploy from repo: `py -3 scripts/deploy_vps_audit_stack.py` (needs `VPS_PASSWORD` + local `R2_*`; preferably `SMTP_PASS` + stable `AGENT_SECRET_TOKEN`).

**Новые контейнеры:** не публиковать порты на `0.0.0.0` — см. [`vps-docker-ports.md`](./vps-docker-ports.md) (PIT-053).

**Image:** `docker.n8n.io/n8nio/n8n:2.39.6` in [`infra/n8n/docker-compose.yml`](../../infra/n8n/docker-compose.yml) (live: `/root/n8n/compose.yaml`). Do **not** use `:latest` — it is not auto-pulled. Security floor from n8n advisories (2026-09-02): `2.37.7` (stable) / `2.38.2` (beta) / `1.123.76` (v1).

See also: [`caddy-dns-audit-worker.md`](./caddy-dns-audit-worker.md), [`n8n-audit-reconcile.md`](./n8n-audit-reconcile.md).

### n8n workflow (audit reconcile)

Primary: Vercel Cron `GET /api/audit/reconcile` every 2 min (`vercel.json`, set `CRON_SECRET`).  
Optional VPS backup: `py -3 scripts/deploy_n8n_audit_reconcile.py` (must be **Active**).  
Details: [`n8n-audit-reconcile.md`](./n8n-audit-reconcile.md).

---

## 4. Maintenance

```bash
docker logs -f caddy_proxy
docker logs -f n8n
docker logs -f audit_agent_worker

cd /home/caddy && docker compose restart
cd /root/n8n && docker compose restart
cd /home/audit-agent && docker compose up -d --build
```

### n8n security upgrade (pin + pull)

Bump the tag in `infra/n8n/docker-compose.yml`, copy to `/root/n8n/compose.yaml`, then:

```bash
cd /root/n8n
docker compose pull
docker compose up -d
docker exec n8n n8n --version
docker exec n8n n8n list:workflow --active=true
curl -fsS https://n8n.erythro.ai/healthz
```

Volume `n8n_data` must stay. Port 5678 must stay unpublished (PIT-053). After 2.36.8 → 2.39.6 (2026-09-16) the Email Autoresponder stayed Active; optional Audit reconcile stayed inactive (Vercel Cron is primary).
