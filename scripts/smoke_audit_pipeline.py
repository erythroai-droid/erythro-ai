"""Post-deploy smoke for audit worker + Next APIs. Never prints secrets."""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")


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
    raise SystemExit("Missing AGENT_SECRET_TOKEN")


def http(method: str, url: str, headers: dict | None = None, body: dict | None = None, timeout: int = 30):
    data = None
    hdrs = dict(headers or {})
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        hdrs.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            raw = res.read().decode("utf-8", errors="replace")
            try:
                parsed = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                parsed = {"_raw": raw[:300]}
            return res.status, parsed
    except urllib.error.HTTPError as err:
        raw = err.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {"_raw": raw[:300]}
        return err.code, parsed


def main() -> None:
    secret = load_agent_secret()
    print(f"[smoke] AGENT_SECRET_TOKEN length={len(secret)}")

    status, body = http("GET", "https://agent-api.erythro.ai/health")
    print(f"[smoke] worker health={status} {body}")
    if status != 200:
        raise SystemExit("worker health failed")

    status, body = http(
        "POST",
        "https://erythro.ai/api/audit/reconcile",
        headers={"X-Agent-Secret-Key": secret},
        body={"staleMinutes": 10},
    )
    print(f"[smoke] reconcile={status} scanned={body.get('scanned')} ok={body.get('ok')} results={len(body.get('results') or [])}")
    if status != 200:
        print(f"[smoke] reconcile body={body}")
        raise SystemExit("reconcile failed")

    # Create a real audit lead (triggers worker)
    stamp = int(time.time())
    contact_body = {
        "name": "Smoke Test",
        "email": f"smoke+audit-{stamp}@erythro.ai",
        "message": "Automated smoke test — ignore",
        "locale": "en",
        "source": "audit",
        "website": "https://example.com",
        "auditLanguage": "en",
        "planSlug": "audit-free",
    }
    status, body = http("POST", "https://erythro.ai/api/contact", body=contact_body, timeout=45)
    print(f"[smoke] contact={status} submissionId={body.get('submissionId')} auditQueued={body.get('auditQueued')} ok={body.get('ok')}")
    if status != 200 or not body.get("submissionId"):
        print(f"[smoke] contact body={body}")
        raise SystemExit("contact create failed")

    submission_id = body["submissionId"]
    report_url = f"https://erythro.ai/api/audit/report/{submission_id}"

    final = None
    for i in range(24):
        time.sleep(2)
        st, payload = http("GET", report_url)
        status_name = payload.get("status")
        print(f"[smoke] poll#{i+1} http={st} status={status_name} reportUrl={'yes' if payload.get('reportUrl') else 'no'}")
        if st == 200 and status_name in ("report_sent", "failed"):
            final = payload
            break

    if not final:
        raise SystemExit("timed out waiting for report status")

    print(f"[smoke] final status={final.get('status')} score={final.get('auditScore')} hasHtml={bool(final.get('htmlPreview'))}")
    if final.get("status") != "report_sent":
        raise SystemExit("audit did not reach report_sent")

    print("[smoke] PASS core pipeline (R2 + CMS). Check worker logs for email sent/skipped.")


if __name__ == "__main__":
    main()
