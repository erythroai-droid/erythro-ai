# RAG index — Erythro.ai knowledge base

Manifest for building a retrieval corpus from `docs/`. Use this file as the **ingest map**:
what to chunk, how to tag, and which questions each source answers.

Last updated: 2026-09-04.

---

## Goals

1. Answer ops questions: deploy, CI, Blob, migrations, SSL, Vercel hangs, n8n workflows.
2. Answer product/CMS questions: portfolio fields, i18n, Lexical, heroes, images, audit pipeline.
3. Answer “don’t repeat this bug” via `PITFALLS.md` (preferred for incident retrieval).
4. Answer “how to build a similar site” via `PLAYBOOK.md` §3 (phases A–F) + chronology §2/§9.
5. Support future agents (Cursor / n8n / import scripts) with stable, self-contained chunks.

---

## Corpus files (ingest these)

| File | Role | Chunk strategy | Primary tags |
|---|---|---|---|
| `docs/PITFALLS.md` | Failure catalog | **One chunk per `## PIT-NNN`** | `pitfall`, plus entry tags |
| `docs/PORTFOLIO_CMS.md` | Portfolio domain | One chunk per `##` heading | `portfolio`, `cms`, `i18n` |
| `docs/DEPLOYMENT.md` | Infra journal | One chunk per numbered `##` section | `deploy`, `vercel`, `supabase`, `ci` |
| `docs/PLAYBOOK.md` | Product playbook + chronology | `##` / `###` under §9+ as separate chunks | `playbook`, `i18n`, `gsap`, `cms` |
| `docs/HERO_MOTION.md` | Hero motion specifics | Per frame / rule heading | `hero`, `motion`, `gsap` |
| `docs/AI_VISIBILITY.md` | AI visibility pack (llms.txt, MCP, schema) | One chunk per `##` heading | `ai`, `seo`, `schema`, `robots` |
| `docs/RAG_INDEX.md` | This map | Single small chunk or skip | `meta`, `rag` |
| `docs/IMPORT_PROJECT.md` | Pointer to import tool | Skip or one chunk | `portfolio`, `cms`, `import` |
| `docs/architecture/ai-audit-architecture.md` | AI Audit MVP (R2, worker, no payment) | One chunk per `##` | `audit`, `r2`, `n8n`, `infra` |
| `docs/architecture/r2-audit-storage.md` | R2 bucket + env for audit reports | One chunk | `r2`, `audit`, `storage` |
| `docs/architecture/audit-rate-limiting.md` | 5-day audit rate limit & IP tracking | One chunk per `##` | `audit`, `rate-limit`, `anti-spam`, `ip` |
| `docs/infrastructure/n8n-audit-reconcile.md` | n8n cron reconcile for stuck audits | One chunk | `n8n`, `audit`, `reconcile`, `vps` |
| `docs/infrastructure/n8n-email-autoresponder.md` | n8n email autoresponder for order@ & team@ | One chunk per `##` | `n8n`, `email`, `autoresponder`, `imap`, `smtp` |
| `scripts/import-project/README.md` | Portfolio folder → CMS import | One chunk per `##` | `portfolio`, `cms`, `import` |

**Optional later (not docs yet):** `scripts/seed.ts` header comments, `payload.config.ts` plugin block, `.github/workflows/test.yml` — only if docs lag behind code.

---

## Recommended chunk metadata

```json
{
  "id": "pit-009",
  "source": "docs/PITFALLS.md",
  "title": "Body images cropped left/right",
  "tags": ["portfolio", "images", "css", "richtext"],
  "related_files": [
    "src/components/portfolio/ProjectBody.tsx",
    "src/lib/lexical.ts"
  ],
  "updated": "2026-08-11"
}
```

Rules:

- **Self-contained:** each chunk should state symptom/cause/fix or field contract without needing the previous chunk.
- **Stable IDs:** keep `PIT-NNN`; do not renumber — add new IDs at the end.
- **Code paths:** include repo-relative paths in the chunk body (already present).
- **Language:** Russian + English terms mixed as in repo (admin labels EN, narrative RU OK). Prefer keeping **identifiers** (`heroMediaMobile`, `generate:importmap`) exact.

---

## Query routing hints

| User intent | Prefer chunks from |
|---|---|
| “How do we build a site like this / implementation plan” | `PLAYBOOK.md` §3 (phases A–F); then §4 patterns |
| “Build failed / not deploying / hang” | `DEPLOYMENT.md` §4, §8–§11; `PIT-002`, `PIT-006`, `PIT-012`, `PIT-013` |
| “Admin empty / tables missing” | `PIT-001`, `DEPLOYMENT.md` §8.1 |
| “Video won’t play” | `PIT-003`, `DEPLOYMENT.md` §8.2 |
| “Column does not exist” | `PIT-004`, `PIT-005`, `PORTFOLIO_CMS.md` schema playbook |
| “Language doesn’t switch” | `PIT-007`, `PORTFOLIO_CMS.md` i18n |
| “Image cropped / PNG background / radius” | `PIT-008`, `PIT-009`, `PORTFOLIO_CMS.md` body images |
| “Mobile hero wrong” | `PIT-010`, `PIT-011`, `PORTFOLIO_CMS.md` hero |
| “How to add a CMS field” | `PORTFOLIO_CMS.md` schema playbook; `PLAYBOOK.md` §3 фаза B |
| “How we built X historically” | `PLAYBOOK.md` §2 + §9.* chronology; v1 close = §9.17 |
| “Automate filling projects” | `scripts/import-project/README.md`; `PLAYBOOK.md` §9.12 |
| “Contact form / Hostinger / no email / MX / spam” | `PIT-020`, `PIT-021`; `DEPLOYMENT.md` §13; `PLAYBOOK.md` §9.14–9.16 |
| “E2E hang / Playwright / drizzle y/N” | `PIT-022`, `PIT-023`; `PLAYBOOK.md` §5 |
| “Legal / contacts / page heroes” | `PLAYBOOK.md` §9.15 |
| “AI visibility / llms.txt / MCP / Organization schema” | `AI_VISIBILITY.md`; `DEPLOYMENT.md` §15; `PLAYBOOK.md` §9.18–9.20 |
| “Middleware Edge / node:console / markdown negotiation build” | `PIT-024`; `PLAYBOOK.md` §9.20 |
| “Unit CI green tests but exit 1 / unhandled rejection / order slug 404” | `PIT-025`, `PIT-026`; `vitest.setup.ts` |
| “Free AI Audit rate limiting / 1 domain per user / 5 days / IP tracking” | `docs/architecture/audit-rate-limiting.md`; `src/lib/auditRateLimit.ts` |
| “Email autoresponder / order@ & team@ / n8n / IMAP & SMTP Hostinger / RFC 3834 / duplicate Hostinger Autoreply / form client ack” | `docs/infrastructure/n8n-email-autoresponder.md`; `infra/n8n/workflows/email-autoresponder.json`; `PIT-037`; `PIT-038`; `PIT-040`; `PIT-044`; `src/lib/contactNotification.ts` |
| “Audit form website check / DNS / SSRF / no n8n workflow” | `docs/architecture/ai-audit-architecture.md` §3.1; `src/lib/checkWebsite.ts`; `PIT-041` |
| “n8n audit cron reconciliation / stuck jobs” | `docs/infrastructure/n8n-audit-reconcile.md`; `infra/n8n/workflows/audit-reconcile.json` |
| “CSP / Cloudflare Insights / beacon.min.js / PageSpeed console” | `next.config.ts` `CONTENT_SECURITY_POLICY`; `PIT-045`; `PIT-043` |

---

## Ingest checklist (when refreshing RAG)

1. Re-read `PITFALLS.md` — new incidents → new `PIT-NNN` only.
2. Sync `PORTFOLIO_CMS.md` if schema/UI contracts changed.
3. Append to `DEPLOYMENT.md` / `PLAYBOOK.md` chronology; do not delete old pitfall history.
4. Update “Last updated” in this file.
5. Re-embed changed files; keep ID-stable chunks for unchanged PIT entries.

---

## Out of scope for this corpus

- Secrets, real `DATABASE_URL`, Blob tokens.
- One-off chat transcripts (use commits + these docs instead).
- Generated `payload-types.ts` / lockfiles as narrative sources.

---

## Suggested future additions

- [x] `scripts/import-project/` (README + example brief + GHA template).
- [x] Playbook §3 as full v1 implementation plan (2026-08-18); chronology through §9.18.
- [x] Contact hardening + Cloudflare DNS + e2e pitfalls (PIT-020 update, PIT-022, PIT-023).
- [x] `docs/AI_VISIBILITY.md` — llms.txt, MCP, schema, security headers (2026-08-22).
- [ ] `docs/ORDER_CMS.md` mirroring portfolio for Solution Plans / order page.
- [ ] `docs/I18N_RTL.md` consolidating BiDi / HE scrub / phone LTR fixes from commits.
- [ ] Scalability track (new playbook section when that work starts — not v1).
