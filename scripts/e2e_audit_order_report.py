"""
Full E2E: audit order → worker → report API/page → client email.
Runs from VPS to avoid Cloudflare 1010. Never prints secrets.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import paramiko
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env.local", override=True)
load_dotenv(ROOT / ".env")

HOST = os.environ.get("VPS_HOST", "46.202.155.56").strip()
USER = os.environ.get("VPS_USER", "root").strip()
PASSWORD = os.environ.get("VPS_PASSWORD")


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


def main() -> None:
    if not PASSWORD:
        raise SystemExit("Missing VPS_PASSWORD")

    secret = load_agent_secret()
    stamp = int(__import__("time").time())
    email = f"e2e+audit-{stamp}@erythro.ai"
    payload = {
        "name": "E2E Audit Order",
        "email": email,
        "phone": "+972500000000",
        "message": (
            f"E2E full test {stamp}\n"
            "Website: https://example.com\n"
            "Report language: English\n"
            "Plan: Free AI Audit (audit-free)"
        ),
        "locale": "en",
        "source": "audit",
        "website": "https://example.com",
        "auditLanguage": "en",
        "planSlug": "audit-free",
        "privacyConsent": True,
        "hp_erythro_trap": "",
        "company_website": "",
    }

    remote = r"""
set -euo pipefail
SECRET=__SECRET__
cat >/tmp/e2e-payload.json <<'JSON'
__PAYLOAD__
JSON

echo "=== 1) health ==="
curl -sS https://agent-api.erythro.ai/health; echo

echo "=== 2) order POST /api/contact (audit-free) ==="
CONTACT=$(curl -sS -X POST https://erythro.ai/api/contact \
  -H "Content-Type: application/json" \
  --data-binary @/tmp/e2e-payload.json)
echo "$CONTACT"
SID=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("submissionId",""))' <<<"$CONTACT")
QUEUED=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("auditQueued",False))' <<<"$CONTACT")
test -n "$SID"
test "$QUEUED" = "True" -o "$QUEUED" = "true"
echo "submissionId=$SID auditQueued=$QUEUED"

echo "=== 3) poll report API ==="
STATUS=""
REPORT=""
for i in $(seq 1 30); do
  sleep 2
  curl -sS "https://erythro.ai/api/audit/report/$SID" >/tmp/e2e-report.json
  STATUS=$(python3 -c 'import json; print(json.load(open("/tmp/e2e-report.json")).get("status",""))')
  REPORT=$(python3 -c 'import json; print(json.load(open("/tmp/e2e-report.json")).get("reportUrl") or "")')
  HTML=$(python3 -c 'import json; print("yes" if json.load(open("/tmp/e2e-report.json")).get("htmlPreview") else "no")')
  if [ -n "$REPORT" ]; then RU=yes; else RU=no; fi
  echo "poll#$i status=$STATUS reportUrl=$RU html=$HTML"
  if [ "$STATUS" = "report_sent" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
done
test "$STATUS" = "report_sent"
python3 - <<'PY'
import json
d=json.load(open("/tmp/e2e-report.json"))
assert d.get("status")=="report_sent"
assert d.get("website")
assert d.get("htmlPreview") and "example.com" in d["htmlPreview"]
assert d.get("reportUrl")
print("api_ok website=", d.get("website"), "html_bytes=", len(d.get("htmlPreview") or ""), "score=", d.get("auditScore"))
open("/tmp/e2e-report-url.txt","w").write(d["reportUrl"])
PY

echo "=== 4) public report page /audit/report/$SID ==="
PAGE_CODE=$(curl -sS -o /tmp/audit-report-page.html -w "%{http_code}" "https://erythro.ai/audit/report/$SID")
echo "page_http=$PAGE_CODE"
test "$PAGE_CODE" = "200"
python3 - <<'PY'
from pathlib import Path
html=Path("/tmp/audit-report-page.html").read_text(encoding="utf-8", errors="replace")
assert len(html)>500
# client bundle / copy markers
ok = ("audit" in html.lower()) or ("report" in html.lower())
print("page_bytes", len(html), "looks_like_report_ui", ok)
assert ok
PY

echo "=== 5) R2 URL probe (optional public) ==="
REPORT_URL=$(cat /tmp/e2e-report-url.txt)
R2_CODE=$(curl -sS -o /tmp/audit-r2.html -w "%{http_code}" -L "$REPORT_URL" || true)
echo "r2_http=$R2_CODE"
python3 - <<'PY'
from pathlib import Path
code=int(open("/tmp/e2e-r2-code.txt").read()) if False else None
PY
# soft-check: private S3-style URL may be 400/403; delivery path is htmlPreview + page
if [ "$R2_CODE" = "200" ]; then
  python3 -c "from pathlib import Path; html=Path('/tmp/audit-r2.html').read_text(encoding='utf-8', errors='replace'); print('r2_public_ok bytes', len(html)); assert 'example.com' in html"
else
  echo "r2_not_public (expected without R2_PUBLIC_BASE_URL) — OK, using htmlPreview path"
fi

echo "=== 6) worker email logs ==="
docker logs --tail 200 audit_agent_worker 2>&1 | sed -E 's/[A-Za-z0-9+/=_-]{24,}/[redacted]/g' | grep -E "submission=$SID|email sent|email skipped|failed" || true
MAIL_OK=$(docker logs --tail 200 audit_agent_worker 2>&1 | grep -c "submission=$SID email sent to client" || true)
echo "email_sent_lines=$MAIL_OK"
test "$MAIL_OK" -ge 1

echo "=== 7) CMS internal GET (agent secret) ==="
curl -sS "https://erythro.ai/api/audit/internal/$SID" \
  -H "X-Agent-Secret-Key: $SECRET" >/tmp/e2e-internal.json
python3 - <<'PY'
import json
d=json.load(open("/tmp/e2e-internal.json"))
assert d.get("auditStatus")=="report_sent"
assert d.get("email")
assert d.get("website")=="https://example.com"
print("internal_ok email_domain=", d["email"].split("@")[-1], "plan=", d.get("planSlug"), "status=", d.get("auditStatus"))
PY

echo "=== 8) reconcile ==="
curl -sS -X POST https://erythro.ai/api/audit/reconcile \
  -H "Content-Type: application/json" \
  -H "X-Agent-Secret-Key: $SECRET" \
  -d '{"staleMinutes":10}'; echo

echo "=== E2E PASS ==="
echo "submissionId=$SID"
echo "clientEmail=__EMAIL__"
echo "reportPage=https://erythro.ai/audit/report/$SID"
echo "reportApi=https://erythro.ai/api/audit/report/$SID"
""".replace("__SECRET__", json.dumps(secret)).replace(
        "__PAYLOAD__", json.dumps(payload, ensure_ascii=False, indent=2)
    ).replace("__EMAIL__", email)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()
    with sftp.file("/tmp/erythro-e2e-audit.sh", "w") as f:
        f.write(remote)
    sftp.chmod("/tmp/erythro-e2e-audit.sh", 0o700)
    sftp.close()

    _stdin, stdout, stderr = client.exec_command("bash /tmp/erythro-e2e-audit.sh", timeout=240)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    print(out)
    if err.strip():
        print("[stderr]", err[-1200:])
    client.exec_command("rm -f /tmp/erythro-e2e-audit.sh /tmp/e2e-payload.json /tmp/e2e-report.json /tmp/audit-report-page.html /tmp/audit-r2.html /tmp/e2e-internal.json /tmp/e2e-report-url.txt")
    client.close()
    if code != 0:
        raise SystemExit(f"E2E failed exit={code}")


if __name__ == "__main__":
    main()
