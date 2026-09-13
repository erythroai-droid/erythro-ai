"""
Import Email Autoresponder workflow into VPS n8n.

Usage:
  set VPS_PASSWORD=...
  py -3 scripts/deploy_n8n_email_autoresponder.py

Keeps the live workflow id and IMAP/SMTP credential bindings.
Does not print secret values.
"""
from __future__ import annotations

import json
import os
import sys
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
WORKFLOW_SRC = ROOT / "infra/n8n/workflows/email-autoresponder.json"
WF_NAME = "Erythro.ai Email Autoresponder"
PLACEHOLDER_CRED_IDS = {
    "IMAP_ORDER_CRED_ID",
    "IMAP_TEAM_CRED_ID",
    "SMTP_ORDER_CRED_ID",
    "SMTP_TEAM_CRED_ID",
}


def exec_checked(client: paramiko.SSHClient, cmd: str) -> str:
    stdin, stdout, stderr = client.exec_command(cmd)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode()
    err = stderr.read().decode()
    if code != 0:
        raise RuntimeError(f"cmd failed ({code}): {cmd}\n{err or out}")
    return out


def as_list(payload: object) -> list:
    if isinstance(payload, list):
        return payload
    return [payload]


def node_credentials(node: dict) -> dict:
    creds = node.get("credentials")
    return creds if isinstance(creds, dict) else {}


def copy_live_credentials(repo_wf: dict, live_wf: dict) -> None:
    live_by_name = {str(n.get("name")): n for n in live_wf.get("nodes") or [] if isinstance(n, dict)}
    for node in repo_wf.get("nodes") or []:
        if not isinstance(node, dict):
            continue
        live_node = live_by_name.get(str(node.get("name")))
        if not live_node:
            continue
        live_creds = node_credentials(live_node)
        if live_creds:
            node["credentials"] = live_creds


def remaining_placeholders(workflow: dict) -> list[str]:
    found: list[str] = []
    for node in workflow.get("nodes") or []:
        if not isinstance(node, dict):
            continue
        for kind, spec in node_credentials(node).items():
            cred_id = str((spec or {}).get("id") or "")
            if cred_id in PLACEHOLDER_CRED_IDS:
                found.append(f"{node.get('name')}:{kind}")
    return found


def put_json(sftp: paramiko.SFTPClient, remote_path: str, payload: object) -> None:
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, suffix=".json") as tf:
        json.dump(payload, tf, ensure_ascii=False, indent=2)
        local = Path(tf.name)
    try:
        sftp.put(str(local), remote_path)
    finally:
        local.unlink(missing_ok=True)


def main() -> None:
    if not PASSWORD:
        raise SystemExit("Set VPS_PASSWORD")
    if not WORKFLOW_SRC.is_file():
        raise SystemExit(f"Missing {WORKFLOW_SRC}")

    workflow = json.loads(WORKFLOW_SRC.read_text(encoding="utf-8"))
    if not isinstance(workflow, dict):
        raise SystemExit("Workflow JSON must be an object")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()

    remote_dir = "/tmp/erythro-n8n-import"
    exec_checked(client, f"mkdir -p {remote_dir} && chmod 700 {remote_dir}")

    print("[n8n] exporting live workflows")
    exec_checked(
        client,
        "docker exec -u node n8n n8n export:workflow --all --output=/tmp/wf-all.json",
    )
    exec_checked(client, f"docker cp n8n:/tmp/wf-all.json {remote_dir}/wf-all.json")
    with sftp.open(f"{remote_dir}/wf-all.json", "r") as rf:
        live_all = as_list(json.loads(rf.read().decode("utf-8")))

    live = next((item for item in live_all if isinstance(item, dict) and item.get("name") == WF_NAME), None)
    if not live or not live.get("id"):
        raise SystemExit(
            f"Live workflow {WF_NAME!r} not found. Import once from the n8n UI, bind IMAP/SMTP, then re-run."
        )

    copy_live_credentials(workflow, live)
    placeholders = remaining_placeholders(workflow)
    if placeholders:
        raise SystemExit(f"Placeholder credential ids still present: {placeholders}")

    workflow["id"] = live["id"]
    workflow["name"] = WF_NAME
    workflow["active"] = True
    if live.get("settings"):
        workflow.setdefault("settings", live["settings"])

    print(f"[n8n] importing over live id={live['id']} (credentials preserved)")
    put_json(sftp, f"{remote_dir}/email_autoresponder.json", [workflow])
    exec_checked(
        client,
        f"docker cp {remote_dir}/email_autoresponder.json n8n:/tmp/email_autoresponder.json && "
        "docker exec -u node n8n n8n import:workflow --input=/tmp/email_autoresponder.json",
    )

    listing = exec_checked(client, "docker exec -u node n8n n8n list:workflow")
    print("[n8n] list:workflow")
    print(listing.strip() or "(empty)")

    try:
        activate_out = exec_checked(
            client,
            "docker exec -u node n8n n8n update:workflow "
            f"--id={live['id']} --active=true",
        )
        print("[n8n] update:workflow --active=true")
        print((activate_out or "").encode("ascii", "replace").decode() or "(no output)")
    except RuntimeError as err:
        print(f"[n8n] WARN: CLI activate failed, workflow may stay inactive: {err}")

    exec_checked(client, "docker exec -u node n8n n8n export:workflow --all --output=/tmp/wf-verify.json")
    exec_checked(client, f"docker cp n8n:/tmp/wf-verify.json {remote_dir}/wf-verify.json")
    with sftp.open(f"{remote_dir}/wf-verify.json", "r") as rf:
        verified_all = as_list(json.loads(rf.read().decode("utf-8")))
    verified = next((item for item in verified_all if isinstance(item, dict) and item.get("id") == live["id"]), None)
    if not verified:
        raise SystemExit("Import did not leave the expected workflow id")

    js_code = ""
    for node in verified.get("nodes") or []:
        if isinstance(node, dict) and node.get("id") == "code-process-autoresponder":
            js_code = str((node.get("parameters") or {}).get("jsCode") or "")
            break
    if "escapeHtml" not in js_code or "greetingHtml" not in js_code:
        raise SystemExit("Imported Code node is missing escapeHtml / greetingHtml")

    print(
        f"[n8n] verified: name={verified.get('name')} active={verified.get('active')} "
        f"escapeHtml={'yes' if 'escapeHtml' in js_code else 'no'}"
    )

    exec_checked(client, f"rm -rf {remote_dir}")
    exec_checked(
        client,
        "docker exec n8n rm -f /tmp/email_autoresponder.json /tmp/wf-all.json /tmp/wf-verify.json || true",
    )
    sftp.close()
    client.close()
    print(f"[n8n] done — {WF_NAME} updated at https://n8n.erythro.ai")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"[n8n] FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
