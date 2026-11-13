"""
Upgrade VPS n8n Docker image to the pin in infra/n8n/docker-compose.yml.

Usage:
  set VPS_PASSWORD=...
  py -3 scripts/upgrade_n8n_image.py

Keeps volume n8n_data. Does not print secrets.
"""
from __future__ import annotations

import os
import re
import time
from pathlib import Path

import paramiko
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

HOST = os.environ.get("VPS_HOST", "46.202.155.56").strip()
USER = os.environ.get("VPS_USER", "root").strip()
PASSWORD = os.environ.get("VPS_PASSWORD")
COMPOSE_SRC = ROOT / "infra/n8n/docker-compose.yml"
REMOTE_COMPOSE = "/root/n8n/compose.yaml"
IMAGE_RE = re.compile(r"image:\s*docker\.n8n\.io/n8nio/n8n:([^\s]+)")


def must(client: paramiko.SSHClient, cmd: str, timeout: int = 600) -> str:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode()
    err = stderr.read().decode()
    if code != 0:
        raise RuntimeError(f"cmd failed ({code}): {cmd}\n{err or out}")
    return out


def wait_health(client: paramiko.SSHClient) -> None:
    for _ in range(36):
        try:
            out = must(client, "curl -fsS -o /dev/null -w '%{http_code}' https://n8n.erythro.ai/healthz", timeout=30)
            if out.strip() == "200":
                return
        except RuntimeError:
            pass
        time.sleep(5)
    raise RuntimeError("n8n healthz did not return 200")


def pinned_tag() -> str:
    text = COMPOSE_SRC.read_text(encoding="utf-8")
    match = IMAGE_RE.search(text)
    if not match:
        raise SystemExit(f"No n8n image pin in {COMPOSE_SRC}")
    return match.group(1)


def main() -> None:
    if not PASSWORD:
        raise SystemExit("Set VPS_PASSWORD")
    if not COMPOSE_SRC.is_file():
        raise SystemExit(f"Missing {COMPOSE_SRC}")

    tag = pinned_tag()
    print(f"[n8n] target image tag: {tag}")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()

    try:
        before = must(client, "docker exec n8n n8n --version || true").strip()
        print(f"[n8n] before: {before or '(unavailable)'}")

        stamp = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
        backup = f"/root/n8n/backups/{stamp}-image-{tag}"
        print(f"[n8n] backup -> {backup}")
        must(client, f"mkdir -p {backup} && chmod 700 /root/n8n/backups {backup}")
        must(client, f"cp -a {REMOTE_COMPOSE} {backup}/compose.yaml")
        must(
            client,
            "docker exec -u node n8n n8n export:workflow --all --output=/tmp/wf-all.json "
            f"&& docker cp n8n:/tmp/wf-all.json {backup}/wf-all.json "
            "&& docker exec n8n rm -f /tmp/wf-all.json",
        )

        print("[n8n] upload compose pin")
        sftp.put(str(COMPOSE_SRC), REMOTE_COMPOSE)

        print("[n8n] pull + recreate")
        must(client, "cd /root/n8n && docker compose pull && docker compose up -d", timeout=900)

        wait_health(client)
        after = must(client, "docker exec n8n n8n --version").strip()
        print(f"[n8n] after: {after}")
        if tag not in after:
            raise RuntimeError(f"Version mismatch: expected {tag} in {after!r}")

        ports = must(client, "docker inspect -f '{{json .HostConfig.PortBindings}}' n8n").strip()
        if ports not in ("{}", "null", "map[]", ""):
            # Empty bindings are fine; published 0.0.0.0:5678 is not (PIT-053).
            if "5678" in ports and ("0.0.0.0" in ports or "::" in ports):
                raise RuntimeError(f"n8n port 5678 published publicly: {ports}")

        active = must(client, "docker exec -u node n8n n8n list:workflow --active=true").strip()
        print("[n8n] active workflows:")
        print(active or "(none)")
        print("[n8n] upgrade OK")
    finally:
        sftp.close()
        client.close()


if __name__ == "__main__":
    main()
