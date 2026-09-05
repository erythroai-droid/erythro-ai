"""Apply baseline UFW on Hostinger VPS: deny incoming except 22/80/443.

Requires VPS_PASSWORD in .env / .env.local (same as other deploy_* scripts).
"""
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

SCRIPT = r"""
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
if ! command -v ufw >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq ufw
fi
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo '--- ufw status verbose ---'
ufw status verbose
echo '--- listening (ss) ---'
ss -tulpn | head -n 40 || true
"""


def main() -> None:
    if not PASSWORD:
        raise SystemExit("Set VPS_PASSWORD in .env / .env.local")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting {USER}@{HOST} …")
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    stdin, stdout, stderr = client.exec_command(SCRIPT, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    client.close()

    sys.stdout.write(out)
    if err.strip():
        sys.stderr.write(err)
    if code != 0:
        raise SystemExit(f"Remote script failed with exit {code}")
    print("UFW baseline applied OK")


if __name__ == "__main__":
    main()
