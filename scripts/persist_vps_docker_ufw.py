"""Persist DOCKER-USER 8080 DROP across reboot. Requires VPS_PASSWORD."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import paramiko
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

SCRIPT = r"""
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
export LANG=C
killall apt-get apt dpkg 2>/dev/null || true
sleep 1
rm -f /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/cache/apt/archives/lock /var/cache/debconf/config.dat.lock 2>/dev/null || true
dpkg --configure -a || true
echo iptables-persistent iptables-persistent/autosave_v4 boolean true | debconf-set-selections
echo iptables-persistent iptables-persistent/autosave_v6 boolean true | debconf-set-selections
# CRITICAL: DO NOT DROP port 8080!
# Port 8080 is used by montblanc_api and accessed directly by Montblanc frontend (Vercel & pizza-na-dom.mk.ua).
# Dropping 8080 causes 502 Bad Gateway across the entire Montblanc store (see PIT-060).
# Remove any accidental 8080 DROP:
iptables -D DOCKER-USER -p tcp --dport 8080 -j DROP 2>/dev/null || true
netfilter-persistent save
echo SAVED
iptables -L DOCKER-USER -n
"""


def main() -> None:
    password = os.environ.get("VPS_PASSWORD")
    if not password:
        raise SystemExit("Set VPS_PASSWORD")
    host = os.environ.get("VPS_HOST", "46.202.155.56")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username="root", password=password, timeout=30)
    stdin, stdout, stderr = client.exec_command(SCRIPT, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    client.close()
    sys.stdout.buffer.write(out.encode("utf-8", errors="replace"))
    if err.strip():
        sys.stderr.buffer.write(err.encode("utf-8", errors="replace"))
    raise SystemExit(code)


if __name__ == "__main__":
    main()
