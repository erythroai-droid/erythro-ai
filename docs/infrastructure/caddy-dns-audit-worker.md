# Caddy + DNS + Audit Worker (VPS)

Статус: целевой деплой для AI Audit MVP. DNS — Cloudflare Free; reverse proxy — Caddy; worker — Node skeleton.

Связано: [`vps-n8n.md`](./vps-n8n.md) · [`caddy-dns-audit-worker.md`](./caddy-dns-audit-worker.md) · [`vps-docker-ports.md`](./vps-docker-ports.md)


---

## 1. DNS (Cloudflare Dashboard)

Создать **две A-записи** (зона `erythro.ai`):

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `n8n` | `46.202.155.56` | **DNS only** (серое облако) |
| A | `agent-api` | `46.202.155.56` | **DNS only** (серое облако) |

Почему DNS only: Caddy получает Let's Encrypt по HTTP-01. Orange cloud ломает challenge, пока нет Origin Certificate.

Итог: `https://n8n.erythro.ai`, `https://agent-api.erythro.ai`.

SSL/TLS в Cloudflare для зоны: **Full** (после валидных сертификатов Caddy можно Full Strict).

---

## 2. VPS layout

```text
/home/caddy/          Caddyfile + docker-compose.yml
/root/n8n/            n8n (уже есть) — перевести на proxy_network + HTTPS env
/home/audit-agent/    Node worker (код из services/audit-agent)
```

Сеть Docker:

```bash
docker network create proxy_network
```

---

## 3. Файлы в репозитории

| Путь | Назначение |
|---|---|
| `infra/caddy/Caddyfile` | reverse_proxy n8n + agent-api |
| `infra/caddy/docker-compose.yml` | Caddy container |
| `infra/n8n/docker-compose.yml` | n8n за Caddy (HTTPS) |
| `services/audit-agent/` | Worker `/api/run-audit` + R2 upload |

Деплой на VPS: скопировать compose/Caddyfile, положить `.env` worker (секреты), `docker compose up -d`.

---

## 4. Проверка

```bash
curl -fsS https://n8n.erythro.ai/healthz || curl -I https://n8n.erythro.ai
curl -fsS https://agent-api.erythro.ai/health
curl -fsS -X POST https://agent-api.erythro.ai/api/run-audit \
  -H "Content-Type: application/json" \
  -H "X-Agent-Secret-Key: $AGENT_SECRET_TOKEN" \
  -d '{"submissionId":1,"targetUrl":"https://example.com","locale":"en","planSlug":"audit-free"}'
```
