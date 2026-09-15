"""Thin HTTP wrapper around the Erythro Translater pipeline.

The consultant on Vercel calls this service for two things: single disputed IT
terms (style ``UI/Microcopy``) and whole technical briefs in EN / HE (style
``Documentation/RFC``). Direction is always RU -> EN | HE.

Deliberately stdlib-only: the image stays small, and the heavy dependency is
the agent itself (mounted at ``/app/agent``), not a web framework. When the
agent is absent the service degrades to glossary-only substitution so a local
setup still answers instead of timing out.

Never published on a host port — reachable through Caddy on ``proxy_network``
(see docs/infrastructure/vps-docker-ports.md, PIT-053).
"""

from __future__ import annotations

import hmac
import json
import logging
import os
import sys
from hashlib import sha256
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

LOG = logging.getLogger("translater")

PORT = int(os.environ.get("PORT", "8090"))
SECRET = os.environ.get("CONSULT_TRANSLATE_SECRET", "").strip()
AGENT_DIR = os.environ.get("TRANSLATER_AGENT_DIR", "/app/agent")
MAX_BODY_BYTES = 256 * 1024

SUPPORTED_TARGETS = {"en", "he"}
SUPPORTED_STYLES = {"UI/Microcopy", "Documentation/RFC"}

# Fallback only. The real glossary lives in the agent (core/glossary.py); this
# copy keeps the worst literal translations out of a brief when the agent is
# unavailable.
FALLBACK_GLOSSARY = {
    "ручка": {"en": "endpoint", "he": "endpoint"},
    "накатить": {"en": "deploy", "he": "לפרוס"},
    "костыль": {"en": "workaround", "he": "פתרון עקיף"},
    "заглушка": {"en": "stub", "he": "stub"},
    "прод": {"en": "production", "he": "פרודקשן"},
    "выкатка": {"en": "rollout", "he": "הטמעה"},
    "откат": {"en": "rollback", "he": "rollback"},
    "личный кабинет": {"en": "customer portal", "he": "אזור אישי"},
    "админка": {"en": "admin panel", "he": "ממשק ניהול"},
    "тз": {"en": "technical brief", "he": "מסמך אפיון"},
}


def load_pipeline():
    """Import ``core.pipeline`` from the mounted agent, or return None."""
    if AGENT_DIR not in sys.path:
        sys.path.insert(0, AGENT_DIR)
    try:
        from core.pipeline import translate as agent_translate  # type: ignore

        LOG.info("translater agent loaded from %s", AGENT_DIR)
        return agent_translate
    except Exception as exc:  # noqa: BLE001 - any import failure means degrade
        LOG.warning("translater agent unavailable (%s); glossary-only mode", exc)
        return None


PIPELINE = load_pipeline()


def glossary_only(text: str, target: str) -> str:
    out = text
    for source, targets in FALLBACK_GLOSSARY.items():
        replacement = targets.get(target)
        if not replacement:
            continue
        for variant in (source, source.capitalize()):
            out = out.replace(variant, replacement)
    return out


def translate(text: str, target: str, style: str) -> tuple[str, str]:
    """Returns ``(text, status)`` where status is ``translated`` or ``skipped``."""
    if PIPELINE is None:
        return glossary_only(text, target), "skipped"
    try:
        result = PIPELINE(text=text, source="ru", target=target, style=style)
        translated = result if isinstance(result, str) else str(result.get("text", "")).strip()
        if not translated:
            raise ValueError("pipeline returned empty text")
        return translated, "translated"
    except Exception as exc:  # noqa: BLE001 - a bad term must not 500 the chat
        LOG.error("pipeline failed: %s", exc)
        return glossary_only(text, target), "skipped"


def signature_ok(raw_body: bytes, header: str | None) -> bool:
    if not SECRET:
        # Unsigned mode is for a localhost compose only; on the VPS the secret
        # is always set and a missing signature is rejected.
        return True
    if not header:
        return False
    provided = header.split("=", 1)[-1].strip()
    expected = hmac.new(SECRET.encode("utf-8"), raw_body, sha256).hexdigest()
    return hmac.compare_digest(expected, provided)


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = "erythro-translater"

    def log_message(self, fmt: str, *args) -> None:  # noqa: A003
        LOG.info("%s - %s", self.address_string(), fmt % args)

    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802 - stdlib naming
        if self.path.rstrip("/") in ("/health", "/api/health"):
            self._send_json(200, {"ok": True, "pipeline": PIPELINE is not None})
            return
        self._send_json(404, {"error": "not_found"})

    def do_POST(self) -> None:  # noqa: N802 - stdlib naming
        if self.path.rstrip("/") != "/api/translate":
            self._send_json(404, {"error": "not_found"})
            return

        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_BODY_BYTES:
            self._send_json(413, {"error": "bad_length"})
            return

        raw = self.rfile.read(length)
        if not signature_ok(raw, self.headers.get("X-Erythro-Signature")):
            self._send_json(401, {"error": "bad_signature"})
            return

        try:
            payload = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._send_json(400, {"error": "bad_json"})
            return

        text = str(payload.get("text") or "").strip()
        target = str(payload.get("target") or "").lower()
        style = str(payload.get("style") or "UI/Microcopy")

        if not text:
            self._send_json(400, {"error": "empty_text"})
            return
        if target not in SUPPORTED_TARGETS:
            self._send_json(400, {"error": "unsupported_target"})
            return
        if style not in SUPPORTED_STYLES:
            style = "UI/Microcopy"

        translated, status = translate(text, target, style)
        self._send_json(200, {"text": translated, "status": status})


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    if not SECRET:
        LOG.warning("CONSULT_TRANSLATE_SECRET is empty — requests are not authenticated")
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    LOG.info("translater listening on %s", PORT)
    server.serve_forever()


if __name__ == "__main__":
    main()
