"""
Deploy Caddy + n8n (HTTPS) + audit-agent to VPS.

Usage:
  set VPS_PASSWORD=...
  py -3 scripts/deploy_vps_audit_stack.py

Reads R2_* from .env / .env.local. Does not print secret values.
"""
from __future__ import annotations

import os
import secrets
import sys
from pathlib import Path

import paramiko
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

HOST = os.environ.get("VPS_HOST", "46.202.155.56").strip()
USER = os.environ.get("VPS_USER", "root").strip()
PASSWORD = os.environ.get("VPS_PASSWORD")


def must_env(name: str) -> str:
    v = (os.environ.get(name) or "").strip()
    if not v:
        raise SystemExit(f"Missing {name} in local env")
    return v


def exec_checked(client: paramiko.SSHClient, cmd: str) -> str:
    stdin, stdout, stderr = client.exec_command(cmd)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode()
    err = stderr.read().decode()
    if code != 0:
        raise RuntimeError(f"cmd failed ({code}): {cmd}\n{err or out}")
    return out


def sftp_put(sftp: paramiko.SFTPClient, local: Path, remote: str) -> None:
    sftp.put(str(local), remote)


def sftp_write(sftp: paramiko.SFTPClient, remote: str, content: str) -> None:
    with sftp.file(remote, "w") as f:
        f.write(content)


def main() -> None:
    if not PASSWORD:
        raise SystemExit("Set VPS_PASSWORD")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()

    print("[deploy] ensure proxy_network")
    exec_checked(client, "docker network create proxy_network 2>/dev/null || true")

    print("[deploy] upload Caddy")
    exec_checked(client, "mkdir -p /home/caddy")
    sftp_put(sftp, ROOT / "infra/caddy/Caddyfile", "/home/caddy/Caddyfile")
    sftp_put(sftp, ROOT / "infra/caddy/docker-compose.yml", "/home/caddy/docker-compose.yml")

    print("[deploy] update n8n compose (preserve n8n_data)")
    sftp_put(sftp, ROOT / "infra/n8n/docker-compose.yml", "/root/n8n/compose.yaml")

    print("[deploy] upload audit-agent")
    exec_checked(client, "mkdir -p /home/audit-agent/src")
    agent = ROOT / "services/audit-agent"
    sftp_put(sftp, agent / "package.json", "/home/audit-agent/package.json")
    sftp_put(sftp, agent / "Dockerfile", "/home/audit-agent/Dockerfile")
    sftp_put(sftp, agent / "docker-compose.yml", "/home/audit-agent/docker-compose.yml")
    for path in (agent / "src").iterdir():
        if path.is_file():
            sftp_put(sftp, path, f"/home/audit-agent/src/{path.name}")

    agent_secret = (os.environ.get("AGENT_SECRET_TOKEN") or "").strip() or secrets.token_hex(32)
    env_lines = [
        "PORT=8080",
        f"AGENT_SECRET_TOKEN={agent_secret}",
        f"R2_ACCOUNT_ID={must_env('R2_ACCOUNT_ID')}",
        f"R2_ACCESS_KEY_ID={must_env('R2_ACCESS_KEY_ID')}",
        f"R2_SECRET_ACCESS_KEY={must_env('R2_SECRET_ACCESS_KEY')}",
        f"R2_BUCKET={(os.environ.get('R2_BUCKET') or 'erythro-audit-reports').strip()}",
        "PAYLOAD_API_URL=https://erythro.ai",
    ]
    public_base = (os.environ.get("R2_PUBLIC_BASE_URL") or "").strip()
    if public_base:
        env_lines.append(f"R2_PUBLIC_BASE_URL={public_base}")
    payload_key = (os.environ.get("PAYLOAD_API_KEY") or "").strip()
    if payload_key:
        env_lines.append(f"PAYLOAD_API_KEY={payload_key}")
    else:
        env_lines.append("# PAYLOAD_API_KEY=")

    sftp_write(sftp, "/home/audit-agent/.env", "\n".join(env_lines) + "\n")
    secret_path = agent / ".env.deployed.secret"
    secret_path.write_text(agent_secret, encoding="utf-8")
    print(f"[deploy] wrote worker .env; AGENT_SECRET_TOKEN length={len(agent_secret)}")
    print(f"[deploy] secret also saved locally to {secret_path.name} (gitignored)")

    print("[deploy] start Caddy")
    exec_checked(client, "cd /home/caddy && docker compose up -d")

    print("[deploy] recreate n8n on proxy_network")
    exec_checked(client, "cd /root/n8n && docker compose up -d --force-recreate")

    print("[deploy] build + start audit-agent (may take a few minutes)")
    out = exec_checked(client, "cd /home/audit-agent && docker compose up -d --build")
    print(out)

    status = exec_checked(
        client,
        'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"; '
        'docker network inspect proxy_network --format "{{range .Containers}}{{.Name}} {{end}}"',
    )
    print(status)

    sftp.close()
    client.close()
    print("[deploy] done")
    print("Next: Cloudflare DNS A records (DNS only / grey cloud):")
    print("  n8n.erythro.ai      -> 46.202.155.56")
    print("  agent-api.erythro.ai -> 46.202.155.56")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(e, file=sys.stderr)
        sys.exit(1)
