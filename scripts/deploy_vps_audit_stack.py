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
import tarfile
import tempfile
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

    print("[deploy] upload audit-agent (incl. QA_Auditor)")
    exec_checked(client, "mkdir -p /home/audit-agent/src")
    agent = ROOT / "services/audit-agent"
    # Pack locally → upload tarball → extract (QA_Auditor is many files)
    tar_local = Path(tempfile.gettempdir()) / "erythro-audit-agent.tgz"
    with tarfile.open(tar_local, "w:gz") as tar:
        for name in ("package.json", "Dockerfile", "docker-compose.yml", "src", "QA_Auditor"):
            path = agent / name
            if path.exists():
                tar.add(path, arcname=name)
    print(f"[deploy] tarball size={tar_local.stat().st_size} bytes")
    sftp_put(sftp, tar_local, "/tmp/erythro-audit-agent.tgz")
    exec_checked(
        client,
        "rm -rf /home/audit-agent/src /home/audit-agent/QA_Auditor && "
        "tar -xzf /tmp/erythro-audit-agent.tgz -C /home/audit-agent && "
        "rm -f /tmp/erythro-audit-agent.tgz",
    )
    tar_local.unlink(missing_ok=True)

    secret_path = agent / ".env.deployed.secret"
    agent_secret = (os.environ.get("AGENT_SECRET_TOKEN") or "").strip()
    if not agent_secret and secret_path.is_file():
        for line in secret_path.read_text(encoding="utf-8").splitlines():
            if line.startswith("AGENT_SECRET_TOKEN="):
                agent_secret = line.split("=", 1)[1].strip()
                break
            if line and not line.startswith("#") and "=" not in line:
                # legacy file: raw token only
                agent_secret = line.strip()
                break
    if not agent_secret:
        agent_secret = secrets.token_hex(32)
    smtp_pass = (os.environ.get("SMTP_PASS") or "").strip()
    env_lines = [
        "PORT=8080",
        f"AGENT_SECRET_TOKEN={agent_secret}",
        f"R2_ACCOUNT_ID={must_env('R2_ACCOUNT_ID')}",
        f"R2_ACCESS_KEY_ID={must_env('R2_ACCESS_KEY_ID')}",
        f"R2_SECRET_ACCESS_KEY={must_env('R2_SECRET_ACCESS_KEY')}",
        f"R2_BUCKET={(os.environ.get('R2_BUCKET') or 'erythro-audit-reports').strip()}",
        "PAYLOAD_API_URL=https://erythro.ai",
        "SMTP_HOST=smtp.hostinger.com",
        "SMTP_PORT=465",
        "SMTP_USER=order@erythro.ai",
    ]
    if smtp_pass:
        # docker compose interpolates $VAR in env files — escape literal dollars
        env_lines.append(f"SMTP_PASS={smtp_pass.replace('$', '$$')}")
    else:
        print("[deploy] WARN: SMTP_PASS missing locally — client audit emails will be skipped until set on VPS")
    public_base = (os.environ.get("R2_PUBLIC_BASE_URL") or "").strip()
    if public_base:
        env_lines.append(f"R2_PUBLIC_BASE_URL={public_base}")
    payload_key = (os.environ.get("PAYLOAD_API_KEY") or "").strip()
    if payload_key:
        env_lines.append(f"PAYLOAD_API_KEY={payload_key}")
    else:
        env_lines.append("# PAYLOAD_API_KEY=")
    for opt in ("GEMINI_API_KEY", "PAGESPEED_API_KEY", "QA_AUDITOR_TIMEOUT_MS"):
        val = (os.environ.get(opt) or "").strip()
        if val:
            env_lines.append(f"{opt}={val.replace('$', '$$')}")
    env_lines.append("QA_AUDITOR_DIR=/app/QA_Auditor")

    sftp_write(sftp, "/home/audit-agent/.env", "\n".join(env_lines) + "\n")
    secret_path.write_text(
        "\n".join(
            [
                f"AGENT_SECRET_TOKEN={agent_secret}",
                f"AUDIT_AGENT_URL=https://agent-api.erythro.ai",
                "# Copy AGENT_SECRET_TOKEN to Vercel Production/Preview",
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"[deploy] wrote worker .env; AGENT_SECRET_TOKEN length={len(agent_secret)}")
    print(f"[deploy] secret also saved locally to {secret_path.name} (gitignored)")
    if smtp_pass:
        print("[deploy] SMTP_PASS included for client report emails")

    print("[deploy] start Caddy")
    exec_checked(client, "cd /home/caddy && docker compose up -d")

    print("[deploy] recreate n8n on proxy_network")
    exec_checked(client, "cd /root/n8n && docker compose up -d --force-recreate")

    print("[deploy] build + start audit-agent (Maven + Playwright browsers — may take 10–20 min)")
    out = exec_checked(
        client,
        "cd /home/audit-agent && docker compose up -d --build",
    )
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
