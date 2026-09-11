"""
Surgical redeploy of audit-agent only (keep VPS .env, do not touch n8n/Caddy).

Usage:
  py -3 scripts/deploy_audit_agent_only.py
Needs VPS_PASSWORD in .env.local
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
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

HOST = os.environ.get("VPS_HOST", "46.202.155.56").strip()
USER = os.environ.get("VPS_USER", "root").strip()
PASSWORD = os.environ.get("VPS_PASSWORD")


def exec_checked(client: paramiko.SSHClient, cmd: str, timeout: int = 1800) -> str:
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if code != 0:
        raise RuntimeError(f"cmd failed ({code}): {cmd}\n{err or out}")
    return out


def safe_print(text: str) -> None:
    payload = (text if text.endswith("\n") else text + "\n").encode("utf-8", errors="replace")
    sys.stdout.buffer.write(payload)
    sys.stdout.buffer.flush()


def tar_filter(ti: tarfile.TarInfo) -> tarfile.TarInfo | None:
    name = ti.name.replace("\\", "/")
    lowered = name.lower()
    if "/target/" in f"/{lowered}/" or lowered.endswith("/target"):
        return None
    base = name.rsplit("/", 1)[-1]
    if base in {".env", ".env.local"} or base.endswith(".secret"):
        return None
    return ti


def main() -> None:
    if not PASSWORD:
        raise SystemExit("Set VPS_PASSWORD")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()

    agent = ROOT / "services/audit-agent"
    tar_local = Path(tempfile.gettempdir()) / "erythro-audit-agent.tgz"
    safe_print("[deploy] packing audit-agent")
    with tarfile.open(tar_local, "w:gz") as tar:
        for name in ("package.json", "Dockerfile", "docker-compose.yml", "src", "QA_Auditor"):
            path = agent / name
            if path.exists():
                tar.add(path, arcname=name, filter=tar_filter)
    safe_print(f"[deploy] tarball size={tar_local.stat().st_size} bytes")

    safe_print("[deploy] upload + extract (preserve /home/audit-agent/.env)")
    sftp.put(str(tar_local), "/tmp/erythro-audit-agent.tgz")
    exec_checked(
        client,
        "rm -rf /home/audit-agent/src /home/audit-agent/QA_Auditor && "
        "tar -xzf /tmp/erythro-audit-agent.tgz -C /home/audit-agent && "
        "rm -f /tmp/erythro-audit-agent.tgz && "
        "test -f /home/audit-agent/.env && echo env_ok",
    )
    tar_local.unlink(missing_ok=True)

    safe_print("[deploy] docker compose up -d --build (may take 10-20 min)")
    out = exec_checked(
        client,
        "cd /home/audit-agent && docker compose up -d --build",
        timeout=2400,
    )
    safe_print(out[-4000:] if len(out) > 4000 else out)

    status = exec_checked(
        client,
        'docker ps --filter name=audit --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
    )
    safe_print(status)

    css_check = exec_checked(
        client,
        "docker compose -f /home/audit-agent/docker-compose.yml exec -T audit-agent "
        "sh -c \"grep -n 'iPhone 17' /app/QA_Auditor/src/main/java/ai/erythro/A44ReportGenerator.java | head -3\"",
    )
    safe_print("[deploy] mobile CSS check:\n" + (css_check or "(no match in container sources)"))
    if "iPhone 17" not in css_check:
        raise RuntimeError("Rebuilt image is missing iPhone 17 mobile CSS")

    he_check = exec_checked(
        client,
        "docker compose -f /home/audit-agent/docker-compose.yml exec -T audit-agent "
        "sh -c \"grep -n 'Physical left = bar edge' /app/QA_Auditor/src/main/java/ai/erythro/A44ReportGenerator.java | head -3\"",
    )
    safe_print("[deploy] HE chart-label check:\n" + (he_check or "(no match in container sources)"))
    if "Physical left = bar edge" not in he_check:
        raise RuntimeError("Rebuilt image is missing HE scorecard bar-edge alignment")

    sftp.close()
    client.close()
    safe_print("[deploy] done - new audits pick up iPhone 17 mobile CSS + HE bar-edge labels")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        sys.stderr.buffer.write(f"[deploy] FAILED: {e}\n".encode("utf-8", errors="replace"))
        sys.exit(1)
