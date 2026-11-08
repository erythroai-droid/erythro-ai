"""
Stage 2: move Meta / Gemini / Telegram secrets from n8n workflow JSON
into n8n Credentials, then republish Marketing + Meta CAPI workflows.

Does not print secret values. Processes decrypted export only on the VPS
temp dir (chmod 700); local machine never writes plaintext tokens to disk.

Usage:
  set VPS_PASSWORD=...
  py -3 scripts/deploy_n8n_marketing_credentials.py
  py -3 scripts/deploy_n8n_marketing_credentials.py --smoke

--smoke: after publish, GET marketing-digest webhook (sends a real Telegram digest).
"""
from __future__ import annotations

import json
import os
import re
import sys
import tempfile
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import paramiko
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")

HOST = os.environ.get("VPS_HOST", "46.202.155.56").strip()
USER = os.environ.get("VPS_USER", "root").strip()
PASSWORD = os.environ.get("VPS_PASSWORD")
DO_SMOKE = "--smoke" in sys.argv

META_CRED_NAME = "Meta Graph Access Token (Marketing/CAPI)"
GEMINI_CRED_NAME = "Google Gemini API Key (Marketing)"
TELEGRAM_CRED_NAME = "Erythro Marketing Telegram Bot"

WF_DIGEST = "AI Marketing Copilot - Meta Ads & Telegram Digest"
WF_BOT = "AI Marketing Copilot - Interactive Telegram Bot (24/7)"
WF_CAPI = "Meta Conversions API (CAPI) - Server-Side Lead Tracker"

SECRET_RE = re.compile(
    r"(EAA[A-Za-z0-9]+|AQ\.[A-Za-z0-9_-]+|AIza[0-9A-Za-z_-]+|bot\d+:[A-Za-z0-9_-]+)"
)


def exec_checked(client: paramiko.SSHClient, cmd: str, timeout: int = 180) -> str:
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if code != 0:
        raise RuntimeError(f"cmd failed ({code}): {cmd}\n{err or out}")
    return out


def as_list(payload: object) -> list:
    if isinstance(payload, list):
        return payload
    return [payload]


def put_json(sftp: paramiko.SFTPClient, remote_path: str, payload: object) -> None:
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, suffix=".json") as tf:
        json.dump(payload, tf, ensure_ascii=False, indent=2)
        local = Path(tf.name)
    try:
        sftp.put(str(local), remote_path)
    finally:
        local.unlink(missing_ok=True)


def find_query_param(node: dict, name: str) -> str | None:
    params = ((node.get("parameters") or {}).get("queryParameters") or {}).get("parameters") or []
    for item in params:
        if isinstance(item, dict) and item.get("name") == name:
            val = item.get("value")
            return str(val) if val is not None else None
    return None


def strip_query_param(node: dict, name: str) -> None:
    q = (node.get("parameters") or {}).get("queryParameters") or {}
    params = q.get("parameters") or []
    q["parameters"] = [p for p in params if not (isinstance(p, dict) and p.get("name") == name)]
    node.setdefault("parameters", {})["queryParameters"] = q


def extract_telegram_token(url: str) -> str | None:
    m = re.search(r"api\.telegram\.org/bot([^/]+)/", url or "")
    return m.group(1) if m else None


def attach_query_auth(node: dict, cred_id: str, cred_name: str) -> None:
    node.setdefault("parameters", {})
    node["parameters"]["authentication"] = "genericCredentialType"
    node["parameters"]["genericAuthType"] = "httpQueryAuth"
    node["credentials"] = {
        "httpQueryAuth": {"id": cred_id, "name": cred_name},
    }


def attach_telegram_url(node: dict, cred_id: str, cred_name: str) -> None:
    node.setdefault("parameters", {})
    node["parameters"]["url"] = (
        "=https://api.telegram.org/bot{{$credentials.telegramApi.accessToken}}/sendMessage"
    )
    node["credentials"] = {
        "telegramApi": {"id": cred_id, "name": cred_name},
    }


def resolve_cred_id(exported: list, name: str, cred_type: str) -> str | None:
    for item in exported:
        if isinstance(item, dict) and item.get("name") == name and item.get("type") == cred_type:
            cid = str(item.get("id") or "")
            if cid:
                return cid
    return None


def workflow_has_plaintext_secrets(wf: dict) -> list[str]:
    hits: list[str] = []
    blob = json.dumps(wf, ensure_ascii=False)
    if SECRET_RE.search(blob):
        for node in wf.get("nodes") or []:
            if not isinstance(node, dict):
                continue
            nb = json.dumps(node.get("parameters") or {}, ensure_ascii=False)
            if SECRET_RE.search(nb):
                hits.append(str(node.get("name")))
    return hits


def wait_n8n_health(client: paramiko.SSHClient) -> None:
    for attempt in range(24):
        time.sleep(5)
        probe = (
            'curl -fsS -o /dev/null -w "%{http_code}" https://n8n.erythro.ai/healthz '
            '|| curl -fsS -o /dev/null -w "%{http_code}" https://n8n.erythro.ai/ || true'
        )
        _, stdout, _ = client.exec_command(probe)
        status = stdout.read().decode("utf-8", errors="replace").strip()
        if status in {"200", "204"}:
            print(f"[n8n] healthz ok (try {attempt + 1})")
            return
    raise RuntimeError("n8n healthz not ready after restart")


def publish_workflow(client: paramiko.SSHClient, wf_id: str) -> None:
    try:
        out = exec_checked(client, f"docker exec -u node n8n n8n publish:workflow --id={wf_id}")
        print(f"[n8n] publish {wf_id}: {(out or '').strip()[:200] or 'ok'}")
    except RuntimeError as err:
        # fallback for older CLI wording
        print(f"[n8n] publish failed ({err}); trying update:workflow --active=true")
        exec_checked(
            client,
            f"docker exec -u node n8n n8n update:workflow --id={wf_id} --active=true",
        )


def main() -> None:
    if not PASSWORD:
        raise SystemExit("Set VPS_PASSWORD")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup_remote = f"/root/n8n/backups/{stamp}-stage2"
    work = f"/tmp/erythro-n8n-stage2-{stamp}"
    exec_checked(client, f"mkdir -p {backup_remote} {work} && chmod 700 /root/n8n/backups {backup_remote} {work}")

    print("[n8n] backup workflows")
    exec_checked(
        client,
        "docker exec -u node n8n n8n export:workflow --all --pretty --output=/tmp/wf-stage2-bak.json",
    )
    exec_checked(client, f"docker cp n8n:/tmp/wf-stage2-bak.json {backup_remote}/workflows-all.json")
    exec_checked(client, "docker exec n8n rm -f /tmp/wf-stage2-bak.json || true")

    print("[n8n] load live workflows into memory (SSH only)")
    exec_checked(client, f"cp {backup_remote}/workflows-all.json {work}/workflows-all.json")
    with sftp.open(f"{work}/workflows-all.json", "r") as rf:
        live_all = as_list(json.loads(rf.read().decode("utf-8")))

    by_name = {
        str(w.get("name")): w
        for w in live_all
        if isinstance(w, dict) and w.get("name")
    }
    for required in (WF_DIGEST, WF_BOT, WF_CAPI):
        if required not in by_name:
            raise SystemExit(f"Missing workflow: {required}")

    digest = by_name[WF_DIGEST]
    bot = by_name[WF_BOT]
    capi = by_name[WF_CAPI]

    def node_map(wf: dict) -> dict[str, dict]:
        return {
            str(n.get("name")): n
            for n in (wf.get("nodes") or [])
            if isinstance(n, dict) and n.get("name")
        }

    d_nodes = node_map(digest)
    b_nodes = node_map(bot)
    c_nodes = node_map(capi)

    meta_token = find_query_param(d_nodes["Запрос Insights из Meta Ads API"], "access_token")
    if not meta_token:
        meta_token = find_query_param(c_nodes["POST to Meta Conversions API"], "access_token")
    gemini_key = find_query_param(d_nodes["AI Анализ (Google Gemini)"], "key")
    tg_url = str((d_nodes["Отправка в Telegram через Bot API"].get("parameters") or {}).get("url") or "")
    telegram_token = extract_telegram_token(tg_url)

    if not meta_token or not gemini_key or not telegram_token:
        raise SystemExit(
            "Could not extract one or more tokens from live nodes "
            f"(meta={bool(meta_token)} gemini={bool(gemini_key)} tg={bool(telegram_token)})"
        )

    print(
        "[n8n] extracted token lengths "
        f"meta={len(meta_token)} gemini={len(gemini_key)} telegram={len(telegram_token)}"
    )

    # Prefer existing credential ids if names already present
    exec_checked(
        client,
        "docker exec -u node n8n n8n export:credentials --all --decrypted "
        "--output=/tmp/creds-stage2.json",
    )
    exec_checked(client, f"docker cp n8n:/tmp/creds-stage2.json {work}/creds-export.json")
    with sftp.open(f"{work}/creds-export.json", "r") as rf:
        creds_exported = as_list(json.loads(rf.read().decode("utf-8")))

    meta_id = resolve_cred_id(creds_exported, META_CRED_NAME, "httpQueryAuth") or str(uuid.uuid4())
    gemini_id = resolve_cred_id(creds_exported, GEMINI_CRED_NAME, "httpQueryAuth") or str(uuid.uuid4())
    tg_id = resolve_cred_id(creds_exported, TELEGRAM_CRED_NAME, "telegramApi") or str(uuid.uuid4())

    cred_payload = [
        {
            "id": meta_id,
            "name": META_CRED_NAME,
            "type": "httpQueryAuth",
            "data": {"name": "access_token", "value": meta_token},
        },
        {
            "id": gemini_id,
            "name": GEMINI_CRED_NAME,
            "type": "httpQueryAuth",
            "data": {"name": "key", "value": gemini_key},
        },
        {
            "id": tg_id,
            "name": TELEGRAM_CRED_NAME,
            "type": "telegramApi",
            "data": {"accessToken": telegram_token},
        },
    ]
    put_json(sftp, f"{work}/credentials.json", cred_payload)
    print("[n8n] import credentials (3)")
    exec_checked(
        client,
        f"docker cp {work}/credentials.json n8n:/tmp/credentials-stage2.json && "
        "docker exec -u node n8n n8n import:credentials --input=/tmp/credentials-stage2.json",
    )
    exec_checked(client, "docker exec n8n rm -f /tmp/credentials-stage2.json || true")

    # Re-resolve ids after import (n8n may keep name match)
    exec_checked(
        client,
        "docker exec -u node n8n n8n export:credentials --all --decrypted "
        "--output=/tmp/creds-stage2b.json",
    )
    exec_checked(client, f"docker cp n8n:/tmp/creds-stage2b.json {work}/creds-export2.json")
    with sftp.open(f"{work}/creds-export2.json", "r") as rf:
        creds2 = as_list(json.loads(rf.read().decode("utf-8")))
    meta_id = resolve_cred_id(creds2, META_CRED_NAME, "httpQueryAuth") or meta_id
    gemini_id = resolve_cred_id(creds2, GEMINI_CRED_NAME, "httpQueryAuth") or gemini_id
    tg_id = resolve_cred_id(creds2, TELEGRAM_CRED_NAME, "telegramApi") or tg_id
    print(f"[n8n] credential ids resolved meta={meta_id[:8]}… gemini={gemini_id[:8]}… tg={tg_id[:8]}…")

    # --- patch digest ---
    attach_query_auth(d_nodes["Запрос Insights из Meta Ads API"], meta_id, META_CRED_NAME)
    strip_query_param(d_nodes["Запрос Insights из Meta Ads API"], "access_token")
    attach_query_auth(d_nodes["AI Анализ (Google Gemini)"], gemini_id, GEMINI_CRED_NAME)
    strip_query_param(d_nodes["AI Анализ (Google Gemini)"], "key")
    attach_telegram_url(d_nodes["Отправка в Telegram через Bot API"], tg_id, TELEGRAM_CRED_NAME)

    # --- patch bot ---
    attach_telegram_url(b_nodes["Отправка меню приветствия"], tg_id, TELEGRAM_CRED_NAME)
    attach_query_auth(b_nodes["Запрос свежих метрик из Meta Ads"], meta_id, META_CRED_NAME)
    strip_query_param(b_nodes["Запрос свежих метрик из Meta Ads"], "access_token")
    attach_query_auth(b_nodes["AI Анализ (Google Gemini)"], gemini_id, GEMINI_CRED_NAME)
    strip_query_param(b_nodes["AI Анализ (Google Gemini)"], "key")
    attach_telegram_url(b_nodes["Отправка ответа в Telegram"], tg_id, TELEGRAM_CRED_NAME)

    # --- patch CAPI ---
    attach_query_auth(c_nodes["POST to Meta Conversions API"], meta_id, META_CRED_NAME)
    strip_query_param(c_nodes["POST to Meta Conversions API"], "access_token")

    for label, wf in ((WF_DIGEST, digest), (WF_BOT, bot), (WF_CAPI, capi)):
        leaks = workflow_has_plaintext_secrets(wf)
        if leaks:
            raise SystemExit(f"Refusing import: plaintext secrets still in {label}: {leaks}")

    # Keep active flags as they were
    for wf in (digest, bot, capi):
        wf["active"] = True

    put_json(sftp, f"{work}/workflows-patched.json", [digest, bot, capi])
    print("[n8n] import patched workflows")
    exec_checked(
        client,
        f"docker cp {work}/workflows-patched.json n8n:/tmp/workflows-stage2.json && "
        "docker exec -u node n8n n8n import:workflow --input=/tmp/workflows-stage2.json",
    )
    exec_checked(client, "docker exec n8n rm -f /tmp/workflows-stage2.json || true")

    for wf in (digest, bot, capi):
        publish_workflow(client, str(wf["id"]))

    print("[n8n] restart so published versions + credentials load")
    exec_checked(client, "cd /root/n8n && docker compose restart n8n")
    wait_n8n_health(client)

    print("[n8n] verify export has no plaintext secrets")
    exec_checked(
        client,
        "docker exec -u node n8n n8n export:workflow --all --output=/tmp/wf-stage2-verify.json",
    )
    exec_checked(client, f"docker cp n8n:/tmp/wf-stage2-verify.json {work}/verify.json")
    with sftp.open(f"{work}/verify.json", "r") as rf:
        verified = as_list(json.loads(rf.read().decode("utf-8")))
    v_by_name = {str(w.get("name")): w for w in verified if isinstance(w, dict)}
    for name in (WF_DIGEST, WF_BOT, WF_CAPI):
        wf = v_by_name[name]
        if not wf.get("active"):
            raise SystemExit(f"{name} is not active after publish")
        leaks = workflow_has_plaintext_secrets(wf)
        if leaks:
            raise SystemExit(f"{name} still has plaintext secrets in nodes: {leaks}")
        # credential refs present
        cred_nodes = 0
        for node in wf.get("nodes") or []:
            if isinstance(node, dict) and node.get("credentials"):
                cred_nodes += 1
        if cred_nodes < 1:
            raise SystemExit(f"{name}: expected credential bindings")
        print(f"[n8n] OK {name} active={wf.get('active')} cred_bound_nodes={cred_nodes}")

    # wipe work dir (contains decrypted tokens)
    exec_checked(client, f"rm -rf {work}")
    exec_checked(
        client,
        "docker exec n8n rm -f /tmp/creds-stage2.json /tmp/creds-stage2b.json "
        "/tmp/wf-stage2-verify.json || true",
    )
    sftp.close()
    client.close()

    print(f"[n8n] backup kept at {backup_remote}")
    print("[n8n] Stage 2 migrate done — rotate tokens in Meta/Google/BotFather when ready, then edit the 3 credentials in n8n UI")

    if DO_SMOKE:
        print("[smoke] GET https://n8n.erythro.ai/webhook/marketing-digest")
        req = Request("https://n8n.erythro.ai/webhook/marketing-digest", method="GET")
        try:
            with urlopen(req, timeout=120) as resp:
                body = resp.read()[:200]
                print(f"[smoke] HTTP {resp.status} body_prefix={body!r}")
        except HTTPError as err:
            print(f"[smoke] HTTPError {err.code}: {err.read()[:300]!r}")
            raise SystemExit(1)
        except URLError as err:
            print(f"[smoke] URLError: {err}")
            raise SystemExit(1)
        print("[smoke] check Telegram for digest; CAPI/Bot left for manual ping")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"[n8n] FAILED: {exc}", file=sys.stderr)
        raise SystemExit(1)
