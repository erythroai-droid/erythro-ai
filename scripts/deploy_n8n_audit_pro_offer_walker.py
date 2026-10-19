"""
Import AI Audit Pro Offer Walker workflow + Agent Secret credential into VPS n8n.

Leaves the workflow inactive (active=false). Activate only after:
  - merge/deploy of Pro funnel code + nudge migrate
  - explicit AUDIT_PRO_OFFER_ENABLED=1
  - explicit user go to turn mailing on

Usage:
  set VPS_PASSWORD=...
  set AGENT_SECRET_TOKEN=...   # or services/audit-agent/.env.deployed.secret
  py -3 scripts/deploy_n8n_audit_pro_offer_walker.py

Does not print secret values. Does not auto-activate the workflow.
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
WORKFLOW_SRC = ROOT / "infra/n8n/workflows/audit-pro-offer-walker.json"
CRED_NAME = "Agent Secret"
WF_NAME = "AI Audit Pro Offer Walker"
WF_ID = "erythro-ai-audit-pro-offer-walker"


def load_agent_secret() -> str:
    secret = (os.environ.get("AGENT_SECRET_TOKEN") or "").strip()
    if secret:
        return secret
    path = ROOT / "services/audit-agent/.env.deployed.secret"
    if path.is_file():
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("AGENT_SECRET_TOKEN="):
                return line.split("=", 1)[1].strip()
            if line and not line.startswith("#") and "=" not in line:
                return line
    raise SystemExit("Missing AGENT_SECRET_TOKEN (env or .env.deployed.secret)")


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

    agent_secret = load_agent_secret()
    print(f"[n8n] AGENT_SECRET_TOKEN length={len(agent_secret)}")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()

    remote_dir = "/tmp/erythro-n8n-import-walker"
    exec_checked(client, f"mkdir -p {remote_dir} && chmod 700 {remote_dir}")

    cred_id_new = str(uuid.uuid4())
    cred_payload = [
        {
            "id": cred_id_new,
            "name": CRED_NAME,
            "type": "httpHeaderAuth",
            "data": {
                "name": "X-Agent-Secret-Key",
                "value": agent_secret,
            },
        }
    ]
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, suffix=".json") as f:
        json.dump(cred_payload, f, ensure_ascii=False)
        cred_local = Path(f.name)

    try:
        sftp.put(str(cred_local), f"{remote_dir}/credentials.json")
    finally:
        cred_local.unlink(missing_ok=True)

    print("[n8n] import credentials (Agent Secret)")
    exec_checked(
        client,
        "docker cp /tmp/erythro-n8n-import-walker/credentials.json n8n:/tmp/credentials-walker.json && "
        "docker exec -u node n8n n8n import:credentials --input=/tmp/credentials-walker.json",
    )
    exec_checked(client, "docker exec n8n rm -f /tmp/credentials-walker.json || true")

    print("[n8n] resolve credential id")
    exec_checked(
        client,
        "docker exec -u node n8n n8n export:credentials --all --decrypted "
        "--output=/tmp/creds-export-walker.json",
    )
    exec_checked(
        client,
        "docker cp n8n:/tmp/creds-export-walker.json "
        "/tmp/erythro-n8n-import-walker/creds-export.json",
    )
    with sftp.open(f"{remote_dir}/creds-export.json", "r") as rf:
        exported = json.loads(rf.read().decode("utf-8"))
    if not isinstance(exported, list):
        exported = [exported]

    cred_id = None
    for item in exported:
        if item.get("name") == CRED_NAME and item.get("type") == "httpHeaderAuth":
            cred_id = str(item.get("id") or "")
            break
    if not cred_id:
        cred_id = cred_id_new
        print("[n8n] WARN: using newly generated credential id (not found in export)")

    print(f"[n8n] credential id={cred_id}")

    workflow = json.loads(WORKFLOW_SRC.read_text(encoding="utf-8"))
    wf_id = str(workflow.get("id") or WF_ID)
    for node in workflow.get("nodes", []):
        creds = node.get("credentials", {})
        header = creds.get("httpHeaderAuth")
        if header:
            header["id"] = cred_id
            header["name"] = CRED_NAME
    workflow["id"] = wf_id
    workflow["name"] = WF_NAME
    # Never auto-activate — mailing stays off until explicit go
    workflow["active"] = False

    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, suffix=".json") as f:
        json.dump([workflow], f, ensure_ascii=False, indent=2)
        wf_local = Path(f.name)
    try:
        sftp.put(str(wf_local), f"{remote_dir}/workflow.json")
    finally:
        wf_local.unlink(missing_ok=True)

    print("[n8n] import workflow (active=false)")
    exec_checked(
        client,
        "docker cp /tmp/erythro-n8n-import-walker/workflow.json n8n:/tmp/workflow-walker.json && "
        "docker exec -u node n8n n8n import:workflow --input=/tmp/workflow-walker.json",
    )
    exec_checked(client, "docker exec n8n rm -f /tmp/workflow-walker.json || true")

    print("[n8n] list workflows")
    listing = exec_checked(client, "docker exec -u node n8n n8n list:workflow")
    print(listing.strip() or "(empty list output)")

    exec_checked(client, f"rm -rf {remote_dir}")
    exec_checked(
        client,
        "docker exec n8n rm -f /tmp/creds-export-walker.json || true",
    )

    sftp.close()
    client.close()
    print(
        f"[n8n] done — '{WF_NAME}' imported inactive. "
        "Activate in UI only after AUDIT_PRO_OFFER_ENABLED=1 and explicit go. "
        "https://n8n.erythro.ai"
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"[n8n] FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
