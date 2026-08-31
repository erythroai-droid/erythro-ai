"""
Import AI Audit reconcile workflow + Agent Secret credential into VPS n8n.

Usage:
  set VPS_PASSWORD=...
  set AGENT_SECRET_TOKEN=...   # or services/audit-agent/.env.deployed.secret
  py -3 scripts/deploy_n8n_audit_reconcile.py

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
WORKFLOW_SRC = ROOT / "infra/n8n/workflows/audit-reconcile.json"
CRED_NAME = "Agent Secret"
WF_NAME = "AI Audit reconcile"


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

    remote_dir = "/tmp/erythro-n8n-import"
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
        "docker cp /tmp/erythro-n8n-import/credentials.json n8n:/tmp/credentials.json && "
        "docker exec -u node n8n n8n import:credentials --input=/tmp/credentials.json",
    )
    exec_checked(client, "docker exec n8n rm -f /tmp/credentials.json || true")

    # Resolve credential id from decrypted export
    print("[n8n] resolve credential id")
    exec_checked(
        client,
        "docker exec -u node n8n n8n export:credentials --all --decrypted "
        "--output=/tmp/creds-export.json",
    )
    exec_checked(
        client,
        "docker cp n8n:/tmp/creds-export.json /tmp/erythro-n8n-import/creds-export.json",
    )
    with sftp.open("/tmp/erythro-n8n-import/creds-export.json", "r") as rf:
        exported = json.loads(rf.read().decode("utf-8"))
    if not isinstance(exported, list):
        exported = [exported]

    cred_id = None
    for item in exported:
        if item.get("name") == CRED_NAME and item.get("type") == "httpHeaderAuth":
            cred_id = str(item.get("id") or "")
            break
    if not cred_id:
        # fallback to the id we just generated
        cred_id = cred_id_new
        print("[n8n] WARN: using newly generated credential id (not found in export)")

    print(f"[n8n] credential id={cred_id}")

    workflow = json.loads(WORKFLOW_SRC.read_text(encoding="utf-8"))
    # stable workflow id so re-runs update instead of duplicating blindly
    wf_id = str(workflow.get("id") or "erythro-ai-audit-reconcile")
    for node in workflow.get("nodes", []):
        creds = node.get("credentials", {})
        header = creds.get("httpHeaderAuth")
        if header:
            header["id"] = cred_id
            header["name"] = CRED_NAME
    workflow["id"] = wf_id
    workflow["name"] = WF_NAME
    workflow["active"] = False

    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, suffix=".json") as f:
        json.dump([workflow], f, ensure_ascii=False, indent=2)
        wf_local = Path(f.name)
    try:
        sftp.put(str(wf_local), f"{remote_dir}/workflow.json")
    finally:
        wf_local.unlink(missing_ok=True)

    print("[n8n] import workflow")
    exec_checked(
        client,
        "docker cp /tmp/erythro-n8n-import/workflow.json n8n:/tmp/workflow.json && "
        "docker exec -u node n8n n8n import:workflow --input=/tmp/workflow.json",
    )
    exec_checked(client, "docker exec n8n rm -f /tmp/workflow.json || true")

    # Activate by name via sqlite / API is version-dependent — try CLI publish if available
    print("[n8n] list workflows")
    listing = exec_checked(client, "docker exec -u node n8n n8n list:workflow")
    print(listing.strip() or "(empty list output)")

    # Best-effort activate: update active flag in DB through n8n update if supported
    activate_out = ""
    try:
        # export all, find id, re-import with active=true
        exec_checked(
            client,
            "docker exec -u node n8n n8n export:workflow --all "
            "--output=/tmp/wf-all.json",
        )
        exec_checked(
            client,
            "docker cp n8n:/tmp/wf-all.json /tmp/erythro-n8n-import/wf-all.json",
        )
        with sftp.open("/tmp/erythro-n8n-import/wf-all.json", "r") as rf:
            all_wf = json.loads(rf.read().decode("utf-8"))
        if not isinstance(all_wf, list):
            all_wf = [all_wf]
        target = None
        for item in all_wf:
            if item.get("name") == WF_NAME or str(item.get("id")) == wf_id:
                target = item
        if target and target.get("id"):
            target["active"] = True
            for node in target.get("nodes", []):
                creds = node.get("credentials", {})
                header = creds.get("httpHeaderAuth")
                if header:
                    header["id"] = cred_id
                    header["name"] = CRED_NAME
            with tempfile.NamedTemporaryFile(
                "w", encoding="utf-8", delete=False, suffix=".json"
            ) as f:
                json.dump([target], f, ensure_ascii=False, indent=2)
                act_local = Path(f.name)
            try:
                sftp.put(str(act_local), f"{remote_dir}/workflow-active.json")
            finally:
                act_local.unlink(missing_ok=True)
            activate_out = exec_checked(
                client,
                "docker cp /tmp/erythro-n8n-import/workflow-active.json n8n:/tmp/workflow-active.json && "
                "docker exec -u node n8n n8n import:workflow --input=/tmp/workflow-active.json",
            )
            exec_checked(client, "docker exec n8n rm -f /tmp/workflow-active.json || true")
            print(f"[n8n] re-imported active=true id={target.get('id')}")
        else:
            print("[n8n] WARN: could not find workflow id to activate — turn on in UI")
    except Exception as err:  # noqa: BLE001
        print(f"[n8n] WARN: activate step skipped: {err}")

    # scrub temp secrets on VPS
    exec_checked(client, f"rm -rf {remote_dir}")
    exec_checked(
        client,
        "docker exec n8n rm -f /tmp/creds-export.json /tmp/wf-all.json || true",
    )

    sftp.close()
    client.close()
    print("[n8n] done — open https://n8n.erythro.ai and confirm 'AI Audit reconcile' is Active")
    if activate_out:
        print("[n8n] activate import ok")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"[n8n] FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
