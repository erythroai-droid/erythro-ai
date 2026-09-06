"""Inspect and harden Docker-published ports vs UFW on the VPS."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import paramiko
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

HOST = os.environ.get("VPS_HOST", "46.202.155.56")
USER = os.environ.get("VPS_USER", "root")
PASSWORD = os.environ.get("VPS_PASSWORD")

INSPECT = r"""
set -euo pipefail
echo '=== docker ps ==='
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Image}}'
echo '=== who has 8080 ==='
docker ps --filter publish=8080 --format '{{.Names}} {{.Ports}} {{.Image}}'
echo '=== compose projects ==='
docker ps -q | while read id; do
  name=$(docker inspect -f '{{.Name}}' "$id")
  ports=$(docker inspect -f '{{range $p, $conf := .NetworkSettings.Ports}}{{$p}}->{{if $conf}}{{(index $conf 0).HostIp}}:{{(index $conf 0).HostPort}}{{end}} {{end}}' "$id")
  echo "$name | $ports"
done
echo '=== DOCKER-USER chain ==='
iptables -L DOCKER-USER -n -v || true
"""

# Drop external traffic to published Docker ports except 80/443.
# UFW alone does not cover docker-proxy DNAT.
HARDEN = r"""
set -euo pipefail
# Ensure DOCKER-USER exists (Docker creates it)
iptables -N DOCKER-USER 2>/dev/null || true
# Idempotent: flush our previous markers by recreating conservative policy
# Allow established, allow 80/443 to docker, drop other new forwards to docker bridge publishing
iptables -F DOCKER-USER
iptables -A DOCKER-USER -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN
# Allow HTTP/S to host (Caddy)
iptables -A DOCKER-USER -p tcp --dport 80 -j RETURN
iptables -A DOCKER-USER -p tcp --dport 443 -j RETURN
iptables -A DOCKER-USER -p udp --dport 443 -j RETURN
# CRITICAL: Allow Montblanc API on port 8080 (Vercel & pizza-na-dom.mk.ua proxy target)
# Do NOT drop 8080 until Montblanc is migrated behind Caddy with HTTPS (PIT-060)
iptables -A DOCKER-USER -p tcp --dport 8080 -j RETURN
# Drop everything else destined to docker-published ports from outside
iptables -A DOCKER-USER -j DROP
echo '=== DOCKER-USER after ==='
iptables -L DOCKER-USER -n -v
echo '=== ufw status ==='
ufw status verbose
"""


def run(client: paramiko.SSHClient, script: str) -> int:
    stdin, stdout, stderr = client.exec_command(script, get_pty=True)
    sys.stdout.write(stdout.read().decode("utf-8", errors="replace"))
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        sys.stderr.write(err)
    return stdout.channel.recv_exit_status()


def main() -> None:
    if not PASSWORD:
        raise SystemExit("Set VPS_PASSWORD")
    mode = sys.argv[1] if len(sys.argv) > 1 else "inspect"
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    code = run(client, INSPECT if mode == "inspect" else HARDEN)
    client.close()
    raise SystemExit(code)


if __name__ == "__main__":
    main()
