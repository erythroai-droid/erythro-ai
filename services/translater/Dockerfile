# Thin HTTP front for the Translater pipeline.
#
# Intentionally NOT built on the QA_Auditor image: that one carries Playwright
# and a JDK (~4.5 GB) and has nothing to do with translation.
#
# The agent itself is not vendored in this repo. Clone or copy
# `C:\agents\Translater` into `services/translater/agent/` before building, or
# bind-mount it via docker-compose.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8090 \
    TRANSLATER_AGENT_DIR=/app/agent

WORKDIR /app

COPY app.py /app/app.py

# Agent dependencies, when the agent is vendored alongside.
COPY agent/requirements.txt /tmp/agent-requirements.txt
RUN if [ -s /tmp/agent-requirements.txt ]; then \
      pip install --no-cache-dir -r /tmp/agent-requirements.txt; \
    fi && rm -f /tmp/agent-requirements.txt

COPY agent /app/agent

RUN useradd --create-home --uid 10001 translater && chown -R translater /app
USER translater

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8090/health',timeout=3)"

CMD ["python", "/app/app.py"]
