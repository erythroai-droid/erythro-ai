"""
Upsert GEMINI_API_KEY on the audit-agent VPS, upload QA_Auditor, rebuild worker.

Does not print secret values. Does not rewrite the whole remote .env
(PAGESPEED_API_KEY and the rest stay as-is).

Reads:
  GEMINI_API_KEY from env, .env.gemini.secret, or QA_Auditor/.env
  VPS_PASSWORD / VPS_HOST / VPS_USER from .env.local / .env

Usage:
  py -3 scripts/vps_set_gemini_and_rebuild.py
"""
from __future__ import annotations

import os
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
AGENT = ROOT / "services/audit-agent"
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / ".env.gemini.secret")
load_dotenv(AGENT / "QA_Auditor" / ".env")

HOST = os.environ.get("VPS_HOST", "46.202.155.56").strip()
USER = os.environ.get("VPS_USER", "root").strip()
PASSWORD = os.environ.get("VPS_PASSWORD")
REMOTE_ENV = "/home/audit-agent/.env"
COMPOSE_DIR = "/home/audit-agent"


def load_gemini_key() -> str:
    key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    if key:
        return key
    for secret in (ROOT / ".env.gemini.secret", AGENT / "QA_Auditor" / ".env"):
        if not secret.is_file():
            continue
        for line in secret.read_text(encoding="utf-8").splitlines():
            if line.startswith("GEMINI_API_KEY="):
                val = line.split("=", 1)[1].strip()
                if val:
                    return val
    raise SystemExit("Missing GEMINI_API_KEY (env, .env.gemini.secret, or QA_Auditor/.env)")


def upsert_env(text: str, name: str, value: str) -> str:
    escaped = value.replace("$", "$$")
    line = f"{name}={escaped}"
    rows = text.splitlines()
    found = False
    out: list[str] = []
    for row in rows:
        if row.startswith(f"{name}="):
            out.append(line)
            found = True
        else:
            out.append(row)
    if not found:
        if out and out[-1] != "":
            out.append("")
        out.append(line)
    return "\n".join(out) + "\n"


def tar_filter(ti: tarfile.TarInfo) -> tarfile.TarInfo | None:
    name = ti.name.replace("\\", "/")
    lowered = name.lower()
    if "/target/" in f"/{lowered}/" or lowered.endswith("/target"):
        return None
    base = name.rsplit("/", 1)[-1]
    if base in {".env", ".env.local"} or base.endswith(".secret"):
        return None
    return ti


def exec_checked(client: paramiko.SSHClient, cmd: str, timeout: int = 120) -> str:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode()
    err = stderr.read().decode()
    if code != 0:
        raise RuntimeError(f"cmd failed ({code}): {cmd}\n{err or out}")
    return out


def main() -> None:
    if not PASSWORD:
        raise SystemExit("Set VPS_PASSWORD in .env.local")
    key = load_gemini_key()
    print(f"[vps] GEMINI_API_KEY length={len(key)}")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()

    with sftp.file(REMOTE_ENV, "r") as f:
        current = f.read().decode("utf-8")
    had = any(r.startswith("GEMINI_API_KEY=") for r in current.splitlines())
    next_text = upsert_env(current, "GEMINI_API_KEY", key)
    with sftp.file(REMOTE_ENV, "w") as f:
        f.write(next_text)
    print(f"[vps] wrote {REMOTE_ENV} ({'replaced' if had else 'appended'} GEMINI_API_KEY)")

    tar_local = Path(tempfile.gettempdir()) / "erythro-audit-agent.tgz"
    print("[vps] pack audit-agent (no .env / target)")
    with tarfile.open(tar_local, "w:gz") as tar:
        for name in ("package.json", "Dockerfile", "docker-compose.yml", "src", "QA_Auditor"):
            path = AGENT / name
            if path.exists():
                tar.add(path, arcname=name, filter=tar_filter)
    print(f"[vps] tarball size={tar_local.stat().st_size} bytes")
    sftp.put(str(tar_local), "/tmp/erythro-audit-agent.tgz")
    exec_checked(
        client,
        "rm -rf /home/audit-agent/src /home/audit-agent/QA_Auditor && "
        "tar -xzf /tmp/erythro-audit-agent.tgz -C /home/audit-agent && "
        "rm -f /tmp/erythro-audit-agent.tgz",
        timeout=120,
    )
    tar_local.unlink(missing_ok=True)

    print("[vps] docker compose up -d --build (Maven + image, may take 10-20 min)")
    build_out = exec_checked(
        client,
        f"cd {COMPOSE_DIR} && docker compose up -d --build",
        timeout=1500,
    )
    sys.stdout.buffer.write((build_out.strip() or "[vps] compose finished").encode("utf-8", errors="replace") + b"\n")

    verify = exec_checked(
        client,
        "docker exec audit_agent_worker node -e "
        "\"const g=process.env.GEMINI_API_KEY||''; "
        "const p=process.env.PAGESPEED_API_KEY||''; "
        "console.log(g?'gemini_key_set len='+g.length:'gemini_key_missing'); "
        "console.log(p?'pagespeed_key_set len='+p.length:'pagespeed_key_missing')\"",
        timeout=60,
    )
    print("[vps]", verify.strip())
    if "gemini_key_missing" in verify:
        raise SystemExit("Container did not receive GEMINI_API_KEY")
    if "pagespeed_key_missing" in verify:
        raise SystemExit("PAGESPEED_API_KEY disappeared from container env")

    health = exec_checked(
        client,
        "curl -fsS --max-time 10 https://agent-api.erythro.ai/health || "
        "docker exec audit_agent_worker curl -fsS --max-time 5 http://127.0.0.1:8080/health",
        timeout=30,
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
    exec_checked(client, "docker cp /tmp/requeue-108.mjs audit_agent_worker:/tmp/requeue-108.mjs", timeout=30)
    print("[vps] requeue AUD-108 (audit-pro)")
    requeue = exec_checked(client, "docker exec audit_agent_worker node /tmp/requeue-108.mjs", timeout=30)
    print("[vps]", requeue.strip())
    exec_checked(client, "rm -f /tmp/requeue-108.mjs", timeout=30)

    sftp.close()
    client.close()
    print("[vps] done")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
