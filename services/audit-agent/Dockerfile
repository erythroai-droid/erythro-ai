FROM maven:3.9.9-eclipse-temurin-17

# Node 22 for the HTTP trigger / R2 / mail worker
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/QA_Auditor
COPY QA_Auditor/pom.xml ./
COPY QA_Auditor/src ./src
COPY QA_Auditor/config ./config
COPY QA_Auditor/templates ./templates
COPY QA_Auditor/AGENTS.md QA_Auditor/README.md ./

# Resolve deps + compile once at image build
RUN mvn -q -DskipTests dependency:resolve compile \
  && mvn -q exec:java -Dexec.mainClass="com.microsoft.playwright.CLI" -Dexec.args="install-deps" \
  && mvn -q exec:java -Dexec.mainClass="com.microsoft.playwright.CLI" -Dexec.args="install chromium"

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src

ENV PORT=8080 \
    QA_AUDITOR_DIR=/app/QA_Auditor \
    PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright

EXPOSE 8080
CMD ["node", "src/server.js"]
