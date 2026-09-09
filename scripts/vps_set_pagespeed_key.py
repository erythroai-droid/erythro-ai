"""
Upsert PAGESPEED_API_KEY on the audit-agent VPS and recreate the worker.

Does not print secret values. Reads:
  .env.pagespeed.secret or PAGESPEED_API_KEY
  VPS_PASSWORD / VPS_HOST / VPS_USER from .env.local / .env

Usage:
  py -3 scripts/vps_set_pagespeed_key.py
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
load_dotenv(ROOT / ".env.pagespeed.secret")

HOST = os.environ.get("VPS_HOST", "46.202.155.56").strip()
USER = os.environ.get("VPS_USER", "root").strip()
PASSWORD = os.environ.get("VPS_PASSWORD")
REMOTE_ENV = "/home/audit-agent/.env"
COMPOSE_DIR = "/home/audit-agent"


def load_pagespeed_key() -> str:
    key = (os.environ.get("PAGESPEED_API_KEY") or "").strip()
    if key:
        return key
    secret = ROOT / ".env.pagespeed.secret"
    if secret.is_file():
        for line in secret.read_text(encoding="utf-8").splitlines():
            if line.startswith("PAGESPEED_API_KEY="):
                return line.split("=", 1)[1].strip()
    raise SystemExit("Missing PAGESPEED_API_KEY (env or .env.pagespeed.secret)")


def upsert_env(text: str, key: str) -> str:
    escaped = key.replace("$", "$$")
    line = f"PAGESPEED_API_KEY={escaped}"
    rows = text.splitlines()
    found = False
    out: list[str] = []
    for row in rows:
        if row.startswith("PAGESPEED_API_KEY="):
            out.append(line)
            found = True
        else:
            out.append(row)
    if not found:
        if out and out[-1] != "":
            out.append("")
        out.append(line)
    return "\n".join(out) + "\n"


def exec_checked(client: paramiko.SSHClient, cmd: str) -> str:
    stdin, stdout, stderr = client.exec_command(cmd)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode()
    err = stderr.read().decode()
    if code != 0:
        raise RuntimeError(f"cmd failed ({code}): {cmd}\n{err or out}")
    return out


def main() -> None:
    if not PASSWORD:
        raise SystemExit("Set VPS_PASSWORD in .env.local")
    key = load_pagespeed_key()
    print(f"[vps] PAGESPEED_API_KEY length={len(key)}")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()
    with sftp.file(REMOTE_ENV, "r") as f:
        current = f.read().decode("utf-8")
    had = any(r.startswith("PAGESPEED_API_KEY=") for r in current.splitlines())
    next_text = upsert_env(current, key)
    with sftp.file(REMOTE_ENV, "w") as f:
        f.write(next_text)
    print(f"[vps] wrote {REMOTE_ENV} ({'replaced' if had else 'appended'} PAGESPEED_API_KEY)")

    print("[vps] recreate audit-agent (no rebuild)")
    print(exec_checked(client, f"cd {COMPOSE_DIR} && docker compose up -d --force-recreate"))

    verify = exec_checked(
        client,
        "docker exec audit_agent_worker node -e "
        "\"const k=process.env.PAGESPEED_API_KEY||''; "
        "console.log(k?'pagespeed_key_set len='+k.length:'pagespeed_key_missing')\"",
    )
    print("[vps]", verify.strip())
    if "pagespeed_key_missing" in verify:
        raise SystemExit("Container did not receive PAGESPEED_API_KEY")

    health = exec_checked(
        client,
        "curl -fsS --max-time 10 https://agent-api.erythro.ai/health || "
        "docker exec audit_agent_worker curl -fsS --max-time 5 http://127.0.0.1:8080/health",
    )
    print("[vps] health", health.strip())

    requeue_js = """\
import http from 'node:http'
import { createHmac } from 'node:crypto'

const secret = process.env.AGENT_SECRET_TOKEN || ''
const body = JSON.stringify({
  submissionId: 108,
  targetUrl: 'https://erythro.ai/',
  locale: 'en',
  planSlug: 'audit-pro',
})
const sig = createHmac('sha256', secret).update(body).digest('hex')
const req = http.request(
  {
    hostname: '127.0.0.1',
    port: 8080,
    path: '/api/run-audit',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'X-Agent-Secret-Key': secret,
      'X-Agent-Signature': sig,
    },
  },
  (res) => {
    let d = ''
    res.on('data', (c) => {
      d += c
    })
    res.on('end', () => {
      console.log('requeue_status=' + res.statusCode + ' body=' + d.slice(0, 200))
      if (res.statusCode >= 400) process.exit(1)
    })
  },
)
req.on('error', (e) => {
  console.error(e.message)
  process.exit(1)
})
req.end(body)
"""
    with sftp.file("/tmp/requeue-108.mjs", "w") as f:
        f.write(requeue_js)
    exec_checked(client, "docker cp /tmp/requeue-108.mjs audit_agent_worker:/tmp/requeue-108.mjs")
    print("[vps] requeue AUD-108 (audit-pro)")
    requeue = exec_checked(client, "docker exec audit_agent_worker node /tmp/requeue-108.mjs")
    print("[vps]", requeue.strip())
    exec_checked(client, "rm -f /tmp/requeue-108.mjs")

    sftp.close()
    client.close()
    print("[vps] done")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
