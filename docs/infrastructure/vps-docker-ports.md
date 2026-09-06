# VPS Docker — публикация портов

Правило для **любого нового** сервиса на Hostinger VPS (`46.202.155.56`).

Связано: [`vps-firewall-cloudflare-access.md`](./vps-firewall-cloudflare-access.md) · [`vps-n8n.md`](./vps-n8n.md) · [`caddy-dns-audit-worker.md`](./caddy-dns-audit-worker.md)

## Коротко

**UFW (22 / 80 / 443) не закрывает Docker `ports:`.**  
`docker-proxy` пишет iptables в обход UFW. Новый `0.0.0.0:PORT` снова торчит в интернет.

Эталон: **n8n / audit-agent** — без host publish, только Docker-сеть + **Caddy** на 80/443.

## Обязательный чеклист при добавлении контейнера

1. Нужен ли сервис с интернета?
   - **Да (HTTP)** → только через Caddy (`reverse_proxy` + DNS A). **Не** публиковать порт приложения на хост.
   - **Нет / только админ с SSH** → `127.0.0.1:PORT:PORT` или без `ports:` вообще.
2. В `docker-compose.yml` **запрещено** по умолчанию:
   ```yaml
   ports:
     - "8080:8080"      # BAD — 0.0.0.0
     - "0.0.0.0:9000:9000"
   ```
3. Допустимо:
   ```yaml
   # только внутренняя сеть (как n8n)
   expose:
     - "5678"
   # или localhost-only
   ports:
     - "127.0.0.1:8080:8080"
   ```
4. После `compose up`: с своей машины проверить
   ```bash
   curl -I --max-time 5 http://46.202.155.56:<PORT>
   # ожидаем timeout / connection refused, НЕ 200
   ```
5. Если временно нужен прямой порт — сразу DROP в `DOCKER-USER` + `netfilter-persistent save` (см. ниже), и завести задачу убрать publish.

## Текущее состояние (2026-09-06)

| Контейнер | Host ports | Статус |
|---|---|---|
| `caddy_proxy` | 80, 443 (и udp/443) | OK — единственный публичный edge |
| `n8n` | нет | OK — через Caddy |
| `audit_agent_worker` | нет | OK — через Caddy |
| `montblanc_db` | `127.0.0.1:3306` | OK |
| `montblanc_api` | `0.0.0.0:8080` | **ОТКРЫТ И ОБЯЗАТЕЛЕН** (см. предупреждение ниже) |

UFW baseline: allow **22 / 80 / 443**, deny rest (на уровне хоста, не Docker DNAT).

> [!CAUTION]
> ### КРИТИЧЕСКОЕ ИСКЛЮЧЕНИЕ: `montblanc_api` (порт 8080, PIT-060)
> **ЗАПРЕЩЕНО дропать порт 8080 в `DOCKER-USER`!**
> Фронтенды Montblanc (`https://pizza-na-dom.mk.ua` и Vercel `montblanc-frontend.vercel.app`) проксируют API-запросы (каталог товаров `/products`, авторизация `/login`, админка) **напрямую** на `http://46.202.155.56:8080`.
> Блокировка порта 8080 в iptables приводит к таймауту прокси и полному падению магазина Montblanc с ошибкой `502 Bad Gateway`.
> 
> **Порт 8080 должен оставаться доступным снаружи до тех пор, пока:**
> 1. В `Caddyfile` не будет поднят HTTPS-домен для Montblanc API (например, `api.pizza-na-dom.mk.ua`) с проксированием в `montblanc_api:8080`.
> 2. Конфигурация фронтенда (Next.js rewrites / Nginx на `pizza-na-dom.mk.ua`) не будет переключена на новый HTTPS-домен Caddy и полностью протестирована.

## Если уже опубликовали лишний порт

```bash
# на VPS — блокирует внешний DNAT в обход UFW (ТОЛЬКО для портов, не используемых внешними сервисами!)
iptables -I DOCKER-USER 1 -p tcp --dport <PORT> -j DROP
netfilter-persistent save
```

> [!WARNING]
> Перед выполнением `DROP` убедитесь, что порт не является точкой входа для других проектов (как 8080 для Montblanc)!

Долгосрочно: убрать publish из compose и перезапустить контейнер; правило iptables можно удалить после проверки.

Скрипты: `scripts/apply_vps_ufw_baseline.py`, `scripts/persist_vps_docker_ufw.py`.

## Для агентов / ревью

При любом PR или задаче с `docker-compose`, `ports:`, новым сервисом на VPS:

- требовать путь через Caddy или `127.0.0.1`;
- не считать UFW достаточным;
- ссылаться на этот документ и PIT-053.
