"""Stage2h2: native Telegram nodes only; keep Meta/Gemini HTTP+queryAuth."""
from __future__ import annotations

import json
import os
import time
import uuid

import paramiko
from dotenv import load_dotenv
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(ROOT, ".env.local"))
load_dotenv(os.path.join(ROOT, ".env"))

HOST = os.environ.get("VPS_HOST", "46.202.155.56").strip()
USER = os.environ.get("VPS_USER", "root").strip()
PASSWORD = os.environ.get("VPS_PASSWORD")
TG_CRED_NAME = "Erythro Marketing Telegram Bot"
CHAT_ID = "8719098916"
NAMES = {
    "ai-marketing-copilot": "AI Marketing Copilot - Meta Ads & Telegram Digest",
    "ai-marketing-telegram-bot": "AI Marketing Copilot - Interactive Telegram Bot (24/7)",
}


def must(client: paramiko.SSHClient, cmd: str, timeout: int = 180) -> str:
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


def main() -> None:
    if not PASSWORD:
        raise SystemExit("Set VPS_PASSWORD")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()
    work = "/tmp/erythro-n8n-2h2"
    must(client, f"mkdir -p {work} && chmod 700 {work}")
    must(client, "cd /root/n8n && docker compose up -d")
    wait_health(client)

    print("status before", must(client, "docker exec -u node n8n n8n list:workflow --active=true"))

    must(
        client,
        "docker exec -u node n8n n8n export:credentials --all --decrypted --output=/tmp/creds-2h2.json",
    )
    must(client, f"docker cp n8n:/tmp/creds-2h2.json {work}/creds.json")
    with sftp.open(f"{work}/creds.json", "r") as rf:
        creds = json.loads(rf.read().decode("utf-8"))
    if not isinstance(creds, list):
        creds = [creds]
    tg_id = next(
        str(c["id"])
        for c in creds
        if c.get("name") == TG_CRED_NAME and c.get("type") == "telegramApi"
    )

    dump = r'''
import sqlite3, subprocess, os, json
for name in ["database.sqlite","database.sqlite-wal","database.sqlite-shm"]:
    subprocess.call(["docker","cp", f"n8n:/home/node/.n8n/{name}", f"/tmp/{name}"])
src=sqlite3.connect("/tmp/database.sqlite"); dst=sqlite3.connect("/tmp/merged.sqlite"); src.backup(dst); dst.close(); src.close()
con=sqlite3.connect("/tmp/merged.sqlite"); cur=con.cursor()
wanted={
 "ai-marketing-copilot":"d37d5c8b-4440-4ab9-bff3-31f2a0b3587a",
 "ai-marketing-telegram-bot":"3456d09a-77a4-44bc-a263-1dd5bb15842e",
}
out={}
for wid, vid in wanted.items():
    row=cur.execute("SELECT nodes, connections, name, description, nodeGroups FROM workflow_history WHERE versionId=?", (vid,)).fetchone()
    out[wid]={"nodes":json.loads(row[0]),"connections":json.loads(row[1]),"name":row[2],"description":row[3],"nodeGroups":json.loads(row[4]) if row[4] else []}
open("/tmp/bases2h2.json","w",encoding="utf-8").write(json.dumps(out, ensure_ascii=False))
print("ok")
con.close()
'''
    with sftp.file(f"{work}/dump.py", "w") as rf:
        rf.write(dump)
    must(client, f"python3 {work}/dump.py")
    must(client, f"cp /tmp/bases2h2.json {work}/bases.json")
    with sftp.open(f"{work}/bases.json", "r") as rf:
        bases = json.loads(rf.read().decode("utf-8"))

    workflows = []
    for wid, base in bases.items():
        nodes = []
        for node in base["nodes"]:
            url = str((node.get("parameters") or {}).get("url") or "")
            name = node.get("name") or ""
            is_tg_http = node.get("type") == "n8n-nodes-base.httpRequest" and (
                "api.telegram.org/bot" in url or name.startswith("Отправка") and "Telegram" in name
            )
            if is_tg_http:
                if wid == "ai-marketing-copilot":
                    text_expr = "={{ $json.candidates[0].content.parts[0].text }}"
                elif "меню" in name.lower() or "привет" in name.lower():
                    text_expr = "={{ '👋 *AI Marketing Copilot*\\nНапишите /digest или вопрос по метрикам.' }}"
                else:
                    text_expr = "={{ $json.text }}"
                node = {
                    "parameters": {
                        "operation": "sendMessage",
                        "chatId": CHAT_ID,
                        "text": text_expr,
                        "additionalFields": {"parse_mode": "Markdown"},
                    },
                    "id": node.get("id") or str(uuid.uuid4()),
                    "name": name,
                    "type": "n8n-nodes-base.telegram",
                    "typeVersion": 1.2,
                    "position": node.get("position") or [0, 0],
                    "credentials": {"telegramApi": {"id": tg_id, "name": TG_CRED_NAME}},
                }
                print("converted", wid, name)
            nodes.append(node)
        workflows.append(
            {
                "id": wid,
                "name": NAMES[wid],
                "nodes": nodes,
                "connections": base["connections"],
                "settings": {"executionOrder": "v1"},
                "active": True,
            }
        )

    with sftp.file(f"{work}/workflows.json", "w") as rf:
        rf.write(json.dumps(workflows, ensure_ascii=False, indent=2))
    print(
        must(
            client,
            f"docker cp {work}/workflows.json n8n:/tmp/wf-2h2.json && "
            "docker exec -u node n8n n8n import:workflow --input=/tmp/wf-2h2.json",
        )
    )

    for wid in NAMES:
        must(client, f"docker exec -u node n8n n8n export:workflow --id={wid} --output=/tmp/{wid}.json")
        must(client, f"docker cp n8n:/tmp/{wid}.json {work}/{wid}.json")
        with sftp.open(f"{work}/{wid}.json", "r") as rf:
            data = json.loads(rf.read().decode("utf-8"))
        wf = data[0] if isinstance(data, list) else data
        print(wid, "version", wf.get("versionId"), "name", wf.get("name"))
        print("types", sorted({n["type"] for n in wf["nodes"]}))
        assert "n8n-nodes-base.telegram" in {n["type"] for n in wf["nodes"]}
        assert "n8n-nodes-base.httpRequest" in {n["type"] for n in wf["nodes"]}
        print(must(client, f"docker exec -u node n8n n8n publish:workflow --id={wid} --versionId={wf['versionId']}"))

    must(client, "cd /root/n8n && docker compose restart n8n")
    wait_health(client)
    print(must(client, "docker exec -u node n8n n8n list:workflow --active=true"))

    def hit(url: str, method: str = "GET", data: bytes | None = None):
        req = Request(
            url,
            data=data,
            method=method,
            headers={"Content-Type": "application/json"} if data else {},
        )
        try:
            with urlopen(req, timeout=180) as resp:
                return resp.status, resp.read()[:100]
        except HTTPError as err:
            return err.code, err.read()[:200]

    print("digest", hit("https://n8n.erythro.ai/webhook/marketing-digest"))
    print(
        "capi",
        hit(
            "https://n8n.erythro.ai/webhook/meta-lead",
            "POST",
            b'{"email":"n8n-stage2h2@example.com","name":"stage2h2","plan":"smoke-test","event_source_url":"https://erythro.ai/stage2h2"}',
        ),
    )
    time.sleep(110)
    check = r'''
import sqlite3, subprocess, os
for name in ["database.sqlite","database.sqlite-wal","database.sqlite-shm"]:
    subprocess.call(["docker","cp", f"n8n:/home/node/.n8n/{name}", f"/tmp/{name}"])
src=sqlite3.connect("/tmp/database.sqlite"); dst=sqlite3.connect("/tmp/merged.sqlite"); src.backup(dst); dst.close(); src.close()
con=sqlite3.connect("/tmp/merged.sqlite"); cur=con.cursor()
print("ENTITY")
for r in cur.execute("SELECT id, active, activeVersionId FROM workflow_entity"):
    print("|".join("" if x is None else str(x) for x in r))
print("PUB")
for r in cur.execute("SELECT workflowId, publishedVersionId FROM workflow_published_version"):
    print("|".join(str(x) for x in r))
print("EXECS")
for r in cur.execute("SELECT id, workflowId, status, workflowVersionId, startedAt FROM execution_entity ORDER BY id DESC LIMIT 8"):
    print("|".join("" if x is None else str(x) for x in r))
con.close()
'''
    with sftp.file(f"{work}/check.py", "w") as rf:
        rf.write(check)
    print(must(client, f"python3 {work}/check.py"))
    print(must(client, "docker logs n8n --since 3m 2>&1 | tail -n 20")[-1200:])
    must(client, f"rm -rf {work} /tmp/bases2h2.json /tmp/merged.sqlite /tmp/database.sqlite*")
    sftp.close()
    client.close()
    print("DONE")


if __name__ == "__main__":
    main()
