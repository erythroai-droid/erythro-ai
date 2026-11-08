"""
Stage 3: bump outdated IF / HTTP Request typeVersions on live n8n (2.45.x).

- HTTP Request 4.2 -> 4.3 (same V3 schema)
- IF 1 (legacy string/boolean conditions) -> 2.2 (filter schema)
One workflow at a time: backup -> patch -> import -> publish --versionId -> restart -> smoke.
Does not print secrets. Does not rotate credentials.
"""
from __future__ import annotations

import json
import os
import time
import uuid
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import paramiko
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

HOST = os.environ.get("VPS_HOST", "46.202.155.56").strip()
USER = os.environ.get("VPS_USER", "root").strip()
PASSWORD = os.environ.get("VPS_PASSWORD")

HTTP_TARGET = 4.3
IF_TARGET = 2.2

# Deploy order: low-risk HTTP-only first, then IF migrations, inactive last.
ORDER = [
    "meta-conversions-api-lead",
    "ai-marketing-copilot",
    "ai-marketing-telegram-bot",
    "erythro-ai-email-autoresponder",
    "erythro-ai-audit-reconcile",
    "erythro-ai-audit-pro-offer-walker",
]

ACTIVE_SMOKE = {
    "meta-conversions-api-lead",
    "ai-marketing-copilot",
    "ai-marketing-telegram-bot",
    "erythro-ai-email-autoresponder",
}


def must(client: paramiko.SSHClient, cmd: str, timeout: int = 240) -> str:
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if code != 0:
        raise RuntimeError(f"{code}: {cmd}\n{err or out}")
    return out


def wait_health(client: paramiko.SSHClient) -> None:
    for attempt in range(24):
        time.sleep(5)
        _, stdout, _ = client.exec_command(
            'curl -fsS -o /dev/null -w "%{http_code}" https://n8n.erythro.ai/healthz || true'
        )
        if stdout.read().decode().strip() in {"200", "204"}:
            print(f"healthz ok try={attempt + 1}")
            return
    raise RuntimeError("healthz failed")


def hit(url: str, method: str = "GET", data: bytes | None = None) -> tuple[int, bytes]:
    req = Request(
        url,
        data=data,
        method=method,
        headers={"Content-Type": "application/json"} if data else {},
    )
    try:
        with urlopen(req, timeout=180) as resp:
            return resp.status, resp.read()[:200]
    except HTTPError as err:
        return err.code, err.read()[:300]


def hit_retry(
    url: str,
    method: str = "GET",
    data: bytes | None = None,
    *,
    attempts: int = 8,
    delay_s: float = 5.0,
) -> tuple[int, bytes]:
    """Webhook registration can lag a few seconds after publish+restart."""
    last = (0, b"")
    for attempt in range(1, attempts + 1):
        last = hit(url, method, data)
        if last[0] < 400:
            if attempt > 1:
                print(f"smoke retry ok on try={attempt}")
            return last
        print(f"smoke try={attempt} status={last[0]} body={last[1][:80]!r}")
        time.sleep(delay_s)
    return last


def migrate_if_params(params: dict) -> dict:
    cond = params.get("conditions")
    if not isinstance(cond, dict):
        return params
    # Already new schema
    if isinstance(cond.get("conditions"), list) and "combinator" in cond:
        return params

    new_conditions: list[dict] = []
    for kind, rows in cond.items():
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            left = row.get("value1", "")
            right = row.get("value2", "")
            op = row.get("operation")  # often absent = equals
            if kind == "boolean":
                if right is True or right == "true":
                    operator = {"type": "boolean", "operation": "true", "singleValue": True}
                    right_out: object = ""
                elif right is False or right == "false":
                    operator = {"type": "boolean", "operation": "false", "singleValue": True}
                    right_out = ""
                else:
                    operator = {"type": "boolean", "operation": "equals"}
                    right_out = right
            elif kind == "string":
                operation = "equals" if not op or op == "equal" else str(op)
                operator = {"type": "string", "operation": operation}
                right_out = right
            elif kind == "number":
                operation = "equals" if not op or op == "equal" else str(op)
                operator = {"type": "number", "operation": operation}
                right_out = right
            else:
                operator = {"type": str(kind), "operation": "equals"}
                right_out = right
            new_conditions.append(
                {
                    "id": str(uuid.uuid4()),
                    "leftValue": left,
                    "rightValue": right_out,
                    "operator": operator,
                }
            )

    if not new_conditions:
        return params

    out = dict(params)
    out["conditions"] = {
        "options": {
            "caseSensitive": True,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2,
        },
        "conditions": new_conditions,
        "combinator": "and",
    }
    out.setdefault("options", {})
    return out


def patch_nodes(nodes: list) -> tuple[list, list[str]]:
    changes: list[str] = []
    patched = []
    for node in nodes:
        if not isinstance(node, dict):
            patched.append(node)
            continue
        n = dict(node)
        t = str(n.get("type") or "")
        v = float(n.get("typeVersion") or 0)
        if t.endswith(".httpRequest") and v < HTTP_TARGET:
            n["typeVersion"] = HTTP_TARGET
            changes.append(f"{n.get('name')}: httpRequest {v}->{HTTP_TARGET}")
        elif t.endswith(".if") and v < IF_TARGET:
            n["parameters"] = migrate_if_params(dict(n.get("parameters") or {}))
            n["typeVersion"] = IF_TARGET
            changes.append(f"{n.get('name')}: if {v}->{IF_TARGET}")
        patched.append(n)
    return patched, changes


def latest_execs(client: paramiko.SSHClient, work: str, sftp: paramiko.SFTPClient) -> str:
    check = r"""
import sqlite3, subprocess
for name in ["database.sqlite","database.sqlite-wal","database.sqlite-shm"]:
    subprocess.call(["docker","cp", f"n8n:/home/node/.n8n/{name}", f"/tmp/{name}"])
src=sqlite3.connect("/tmp/database.sqlite"); dst=sqlite3.connect("/tmp/merged.sqlite"); src.backup(dst); dst.close(); src.close()
con=sqlite3.connect("/tmp/merged.sqlite"); cur=con.cursor()
print("EXECS")
for r in cur.execute("SELECT id, workflowId, status, startedAt FROM execution_entity ORDER BY id DESC LIMIT 10"):
    print("|".join("" if x is None else str(x) for x in r))
print("PUB")
for r in cur.execute("SELECT workflowId, publishedVersionId FROM workflow_published_version"):
    print("|".join(str(x) for x in r))
con.close()
"""
    with sftp.file(f"{work}/check_execs.py", "w") as rf:
        rf.write(check)
    return must(client, f"python3 {work}/check_execs.py")


def smoke(wid: str) -> None:
    if wid == "meta-conversions-api-lead":
        status, body = hit_retry(
            "https://n8n.erythro.ai/webhook/meta-lead",
            "POST",
            b'{"email":"n8n-stage3b@example.com","name":"stage3b","plan":"smoke-test","event_source_url":"https://erythro.ai/stage3"}',
        )
        print("smoke capi", status, body[:120])
        if status >= 400:
            raise RuntimeError(f"CAPI smoke HTTP {status}")
    elif wid == "ai-marketing-copilot":
        status, body = hit_retry("https://n8n.erythro.ai/webhook/marketing-digest")
        print("smoke digest", status, body[:120])
        if status >= 400:
            raise RuntimeError(f"digest smoke HTTP {status}")
    elif wid == "ai-marketing-telegram-bot":
        # Telegram webhook expects Update JSON
        payload = json.dumps(
            {
                "update_id": int(time.time()),
                "message": {
                    "message_id": int(time.time()) % 100000,
                    "from": {"id": 8719098916, "is_bot": False, "first_name": "Stage3"},
                    "chat": {"id": 8719098916, "type": "private"},
                    "date": int(time.time()),
                    "text": "/start",
                },
            }
        ).encode()
        status, body = hit_retry(
            "https://n8n.erythro.ai/webhook/telegram-marketing-bot",
            "POST",
            payload,
        )
        print("smoke tg /start", status, body[:120])
        if status >= 400:
            raise RuntimeError(f"telegram bot smoke HTTP {status}")
    elif wid == "erythro-ai-email-autoresponder":
        print("smoke autoresponder: node-version verify only (no auto email); optional manual IMAP check")


def main() -> None:
    if not PASSWORD:
        raise SystemExit("Set VPS_PASSWORD")

    only = os.environ.get("STAGE3_ONLY", "").strip()
    targets = [only] if only else ORDER

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()
    stamp = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
    work = f"/tmp/erythro-n8n-stage3-{stamp}"
    backup = f"/root/n8n/backups/{stamp}-stage3"
    must(client, f"mkdir -p {work} {backup} && chmod 700 {work}")
    must(client, "cd /root/n8n && docker compose up -d")
    wait_health(client)

    print("active before:\n", must(client, "docker exec -u node n8n n8n list:workflow --active=true"))
    must(client, "docker exec -u node n8n n8n export:workflow --all --output=/tmp/wf-stage3-all.json")
    must(client, f"docker cp n8n:/tmp/wf-stage3-all.json {backup}/wf-all-before.json")
    must(client, f"cp {backup}/wf-all-before.json {work}/wf-all.json")

    with sftp.open(f"{work}/wf-all.json", "r") as rf:
        all_wf = json.loads(rf.read().decode("utf-8"))
    if not isinstance(all_wf, list):
        all_wf = [all_wf]
    by_id = {str(w.get("id")): w for w in all_wf if isinstance(w, dict) and w.get("id")}

    for wid in targets:
        wf = by_id.get(wid)
        if not wf:
            print(f"SKIP missing {wid}")
            continue
        nodes, changes = patch_nodes(list(wf.get("nodes") or []))
        if not changes:
            print(f"OK {wid}: already current")
            continue
        print(f"\n=== PATCH {wid} ({wf.get('name')}) ===")
        for line in changes:
            print(" ", line)

        patched = dict(wf)
        patched["nodes"] = nodes
        # Keep active flag from live for active workflows; do not activate inactive ones
        was_active = bool(wf.get("active"))
        patched["active"] = was_active

        remote_json = f"{work}/{wid}.json"
        with sftp.file(remote_json, "w") as rf:
            rf.write(json.dumps([patched], ensure_ascii=False, indent=2))
        must(client, f"cp {remote_json} {backup}/{wid}-patched.json")
        print(
            must(
                client,
                f"docker cp {remote_json} n8n:/tmp/stage3-{wid}.json && "
                f"docker exec -u node n8n n8n import:workflow --input=/tmp/stage3-{wid}.json",
            )
        )

        must(client, f"docker exec -u node n8n n8n export:workflow --id={wid} --output=/tmp/{wid}-after.json")
        must(client, f"docker cp n8n:/tmp/{wid}-after.json {work}/{wid}-after.json")
        with sftp.open(f"{work}/{wid}-after.json", "r") as rf:
            after = json.loads(rf.read().decode("utf-8"))
        after_wf = after[0] if isinstance(after, list) else after
        version_id = after_wf.get("versionId")
        if not version_id:
            raise RuntimeError(f"No versionId after import for {wid}")

        # Verify versions on exported nodes
        for n in after_wf.get("nodes") or []:
            t = str(n.get("type") or "")
            v = float(n.get("typeVersion") or 0)
            if t.endswith(".httpRequest") and v < HTTP_TARGET:
                raise RuntimeError(f"{wid} still has HTTP v{v}")
            if t.endswith(".if") and v < IF_TARGET:
                raise RuntimeError(f"{wid} still has IF v{v}")
            if t.endswith(".if") and v >= IF_TARGET:
                cond = (n.get("parameters") or {}).get("conditions") or {}
                if "boolean" in cond or "string" in cond:
                    raise RuntimeError(f"{wid} IF still legacy schema: {n.get('name')}")

        if was_active:
            print(
                must(
                    client,
                    f"docker exec -u node n8n n8n publish:workflow --id={wid} --versionId={version_id}",
                )
            )
            must(client, "cd /root/n8n && docker compose restart n8n")
            wait_health(client)
            if wid in ACTIVE_SMOKE:
                smoke(wid)
                if wid in {"meta-conversions-api-lead", "ai-marketing-copilot", "ai-marketing-telegram-bot"}:
                    print("waiting executions…")
                    time.sleep(90 if wid != "ai-marketing-copilot" else 110)
                    print(latest_execs(client, work, sftp))
        else:
            print(f"(inactive) imported only, not published/activated")

        # refresh by_id from latest export for next loops? not needed — independent workflows
        print(f"DONE {wid} versionId={version_id}")

    # Sync repo autoresponder IF if we patched it
    repo = ROOT / "infra/n8n/workflows/email-autoresponder.json"
    if repo.is_file() and (not only or only == "erythro-ai-email-autoresponder"):
        data = json.loads(repo.read_text(encoding="utf-8"))
        nodes, changes = patch_nodes(list(data.get("nodes") or []))
        if changes:
            data["nodes"] = nodes
            repo.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print("updated repo", repo, changes)

    print("\nactive after:\n", must(client, "docker exec -u node n8n n8n list:workflow --active=true"))
    print("backup", backup)
    must(client, f"rm -rf {work}")
    sftp.close()
    client.close()
    print("STAGE3 COMPLETE")


if __name__ == "__main__":
    main()
