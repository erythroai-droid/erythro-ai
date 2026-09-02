"""
Import Email Autoresponder workflow into VPS n8n.

Usage:
  set VPS_PASSWORD=...
  py -3 scripts/deploy_n8n_email_autoresponder.py

Does not print secret values.
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
import uuid
from pathlib import Path

import paramiko
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

HOST = os.environ.get("VPS_HOST", "46.202.155.56").strip()
USER = os.environ.get("VPS_USER", "root").strip()
PASSWORD = os.environ.get("VPS_PASSWORD")
WORKFLOW_SRC = ROOT / "infra/n8n/workflows/email-autoresponder.json"
WF_NAME = "Erythro.ai Email Autoresponder"


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
        raise SystemExit("Set VPS_PASSWORD")
    if not WORKFLOW_SRC.is_file():
        raise SystemExit(f"Missing {WORKFLOW_SRC}")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()

    remote_dir = "/tmp/erythro-n8n-import"
    exec_checked(client, f"mkdir -p {remote_dir} && chmod 700 {remote_dir}")

    workflow_json_text = WORKFLOW_SRC.read_text(encoding="utf-8")
    workflow = json.loads(workflow_json_text)
    wf_id = str(workflow.get("id") or "erythro-ai-email-autoresponder")

    remote_wf = f"{remote_dir}/email_autoresponder.json"
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, suffix=".json") as tf:
        json.dump([workflow], tf, indent=2)
        tf_path = Path(tf.name)
    try:
        sftp.put(str(tf_path), remote_wf)
    finally:
        tf_path.unlink(missing_ok=True)

    print("[n8n] copying into container and importing workflow...")
    exec_checked(
        client,
        f"docker cp {remote_wf} n8n:/tmp/email_autoresponder.json && "
        "docker exec -u node n8n n8n import:workflow --input=/tmp/email_autoresponder.json && "
        "docker exec n8n rm -f /tmp/email_autoresponder.json || true",
    )

    print(f"[n8n] workflow imported successfully: {WF_NAME} ({wf_id})")
    print("[n8n] Note: In https://n8n.erythro.ai, configure IMAP/SMTP credentials for order@ and team@ and activate.")
    sftp.close()
    client.close()


if __name__ == "__main__":
    main()
