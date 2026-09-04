# Pitfalls catalog (Erythro.ai)

RAG-oriented knowledge base of recurring failures. Each entry is a **self-contained chunk**:
symptom → cause → fix → prevent. Prefer this file when answering “why did X break?” or “how do we avoid Y?”.

**Related docs:** `PLAYBOOK.md` (product chronology), `DEPLOYMENT.md` (infra), `PORTFOLIO_CMS.md` (portfolio domain), `RAG_INDEX.md` (ingest map).

---

## PIT-001 — Empty Payload admin after adding a storage / Lexical plugin

**Tags:** `admin`, `importmap`, `payload`, `vercel-blob`, `lexical-tables`  
**Seen:** Blob adapter; Lexical `EXPERIMENTAL_TableFeature`

**Symptom:** `/admin` loads shell/title but no login form or feature UI (table toolbar missing). Console may show `getFromImportMap: PayloadComponent not found`.

**Cause:** Client components registered by plugins are missing from `src/app/(payload)/admin/importMap.js`.

**Fix:**
```bash
pnpm generate:importmap
```
Commit the regenerated `importMap.js`. Hard-refresh admin.

**Prevent:** After any change to `payload.config.ts` features/plugins that register **client** components, always regenerate and commit import map before merge.

---

## PIT-002 — Admin build fails with `node:console` / UnhandledSchemeError

**Tags:** `admin`, `webpack`, `vercel-blob`, `next-config`

**Symptom:** Client bundle fails on `node:*` builtins after Blob import map is fixed.

**Cause:** `@payloadcms/plugin-cloud-storage` barrel re-exports server-only `resolveSignedURLKey` into the client upload handler.

**Fix:** `NormalModuleReplacementPlugin` in `next.config.ts` → stub `src/stubs/resolve-signed-url-key.client.js`.

**Prevent:** Keep the stub when upgrading `@payloadcms/*`; re-test `pnpm build && pnpm start` + `/admin/login`.

---

## PIT-003 — Video from Media does not play / seek

**Tags:** `media`, `video`, `range`, `vercel-blob`

**Symptom:** MP4 uploaded in Media does not play; direct Blob URL may work.

**Cause:** Payload proxy `/api/media/file/...` + CDN returns Range as `200` instead of `206`.

**Fix:** `disablePayloadAccessControl: true` on `media` in `vercelBlobStorage` so `url` is the public Blob URL.

**Prevent:** Never serve seekable video through Payload file proxy on Vercel. Verify with:
```bash
curl -D - -o NUL -H "Range: bytes=0-1023" "<media-url>"
# expect HTTP/1.1 206
```

---

## PIT-004 — Production missing DB column (`subtitle`, `heroMediaMobile`, richtext jsonb, …)

**Tags:** `migrations`, `postgres`, `ci`, `portfolio`, `vercel`

**Symptom:** Runtime or API tests: `column … does not exist`. Preview/prod after schema change.

**Cause:** Dev used Payload `push`; prod migrations lagged or race; CI DB out of sync.

**Fix pattern (used in repo):**
1. Formal migration under `src/migrations/`.
2. Idempotent fix script, e.g. `pnpm db:fix-portfolio-subtitle`, `pnpm db:fix-portfolio-richtext`, `pnpm db:fix-portfolio-hero-mobile`.
3. Run fix scripts in CI **before** API tests when schema is required for smoke.

**Prevent:**
- Do not rely on interactive `push` in CI/prod (`push: false` when `CI=true` / `NODE_ENV=test` / `PAYLOAD_DISABLE_PUSH=1`). Import/seed scripts set `PAYLOAD_DISABLE_PUSH` so they never prompt against Supabase.
- Ship migration + fix script together with the field change.
- Prefer `varchar` casts for migration-name params in SQL scripts (`$1::varchar`) — PIT-005.

---

## PIT-005 — SQL fix script fails: `character varying = text` / `$1` type mismatch

**Tags:** `postgres`, `migrations`, `scripts`

**Symptom:** Fix script errors comparing migration name param to `varchar` column.

**Cause:** Postgres treats unbound `$1` as `text`; column is `varchar`.

**Fix:** Cast: `$1::varchar` (see `scripts/fix-portfolio-subtitle.ts`).

**Prevent:** Always cast bind params to the column type in raw SQL scripts.

---

## PIT-006 — Vercel build hangs on Payload migrate / interactive drizzle prompt

**Tags:** `vercel`, `migrations`, `payload`, `batch`

**Symptom:** Build stuck; eventually timeout. Interactive “rename or create column?” prompts.

**Cause:** Payload/drizzle trying to push/migrate interactively; concurrent migrate races; leftover `batch=-1`.

**Fix / prevent:**
- Clear Payload migrate `batch=-1` before builds when needed.
- Serialize portfolio-category (and similar) migrations to avoid race failures.
- `push: false` in CI/test; use `prodMigrations` only.
- Prefer explicit SQL migrations over relying on push in prod.

---

## PIT-007 — Portfolio language switch only after full reload

**Tags:** `i18n`, `portfolio`, `cms`, `locale`

**Symptom:** Changing language on `/portfolio/[slug]` does not update copy until refresh.

**Cause:** Server flattened CMS strings with `pickStr` to one locale; client had no `LocaleMap` left to resolve via `tLocale` (unlike Services).

**Fix:** Keep multi-locale maps from CMS (`locale: 'all'`), resolve on client with `tLocale` / `tLocaleList`. Prefer `paragraphsRich` + `RichText` when present.

**Prevent:** Any CMS page that switches language **without** navigation must keep `LocaleMap` / Lexical maps on the client. Never pick a single locale in the server mapper for client-switched pages.

---

## PIT-008 — Transparent PNG shows solid gray/coal plate

**Tags:** `portfolio`, `css`, `images`

**Symptom:** Transparent areas look filled with dark gray.

**Cause:** Image wrappers used `bg-coal-800`.

**Fix:** Remove opaque backdrop from portfolio image containers (`ProjectBody`, `PortfolioSection`).

**Prevent:** Do not put solid backgrounds under assets that may be transparent PNGs.

---

## PIT-009 — Body images cropped left/right (e.g. 1920×1080)

**Tags:** `portfolio`, `images`, `css`, `richtext`

**Symptom:** Wide images look cropped by width in project body.

**Causes:**
1. Section gallery: fixed `aspect-[16/10]` or `aspect-[4/3]` + `object-cover`.
2. Lexical Upload in rich text: `<img width="1920" height="1080">` without `max-width:100%`, clipped by page `overflow-x: clip`.

**Fix:**
- Gallery: `w-full h-auto`, no forced cover crop.
- Rich text: `[&_img]:max-w-full [&_img]:h-auto` (+ radius/shadow as designed).
- Keep paragraphs that contain only uploads (`lexicalHasContent`, not only `lexicalToPlain`).

**Prevent:** Prefer natural aspect for case-study imagery; always constrain rich-text media to container width.

---

## PIT-010 — Mobile hero shows desktop video / wrong crop

**Tags:** `portfolio`, `hero`, `mobile`, `media`

**Symptom:** Phones play desktop landscape video or crop stills badly.

**Cause:** Single hero media reused; `<video>` path forced even when mobile should be image; cover framing wrong.

**Fix:** Separate `heroMediaMobile`; render by **per-slot type** (`type` / `typeMobile`); mobile stills `object-top`; layout `100dvh` flex so image + meta fit one screen.

**Prevent:** Always provide mobile-specific media guidance in admin (prefer 1080×1920). Never assume desktop type equals mobile type.

---

## PIT-011 — Mobile hero copy unreadable over photo

**Tags:** `portfolio`, `hero`, `mobile`, `gradient`

**Symptom:** Text on mobile hero hard to read.

**Cause:** Opaque black plate or too-weak gradient.

**Fix:** Full-bleed media + gradient copy plate (`from-coal-900` via stronger opacity → transparent). Tune `via-/80` as needed.

**Prevent:** Prefer gradient over solid plates; verify on real device photos, not only solid colors.

---

## PIT-012 — CI API tests: Supabase IPv6 / SSL / pooler / push hang

**Tags:** `ci`, `supabase`, `github-actions`

**Symptoms:** `ENETUNREACH`, cert chain errors, `tenant/user not found`, 90s hang on `getPayload`.

**Fixes (already in workflow):**
- Resolve Direct → Session pooler (`scripts/ci-resolve-supabase-url.mjs`, try `aws-0`…`aws-2`).
- `DATABASE_SSL_INSECURE=1` / `sslmode=no-verify` **only in CI**.
- `push: false` when `CI=true` or `NODE_ENV=test`.

**Prevent:** Do not point GHA at Direct IPv6-only hosts. Keep resolver + SSL flags documented in `DEPLOYMENT.md` §11.

---

## PIT-013 — Vercel rejects Next.js (CVE) / engines.node mismatch

**Tags:** `vercel`, `next`, `engines`, `security`

**Symptom:** Build failed for vulnerable Next, or instant fail before install.

**Cause:** CVE hard-block; or `engines.node: ">=24.15.0"` while image is `24.11.x`.

**Fix:** `engines.node: "24.x"`; Next in Payload peer window (e.g. `~15.4.11`).

**Prevent:** One lockfile (`pnpm-lock.yaml` only); keep Next patched inside Payload peer range.

---

## PIT-014 — Seed loses localized array row values

**Tags:** `seed`, `i18n`, `payload`

**Symptom:** After seeding `ru`/`he`, array rows empty or reset.

**Cause:** Payload recreates array rows per locale without shared ids.

**Fix:** Create `en` first, `applyIds` from en rows into other locales, then update.

**Prevent:** Always use the `applyIds` pattern in `scripts/seed.ts` for localized arrays.

---

## PIT-015 — Stale CMS cache after content change

**Tags:** `cache`, `revalidate`, `portfolio`

**Symptom:** Admin updated but site shows old portfolio/services copy.

**Cause:** `unstable_cache` keys/tags not invalidated, or cache key not bumped after shape change.

**Fix:** Collection hooks call revalidate (`src/lib/revalidate.ts`); bump portfolio cache key when document shape changes (e.g. `portfolio-projects-v6` after rich text).

**Prevent:** Any new CMS field shape that changes mapper output → bump cache key string in the same PR.

---

## PIT-016 — PowerShell breaks bash heredoc git commits

**Tags:** `windows`, `git`, `powershell`

**Symptom:** Parser errors around `<<'EOF'` when committing from agent/shell on Windows.

**Fix:** `git commit -m "..."` or `git commit -F message.txt`.

**Prevent:** Do not use bash heredoc in PowerShell automation.

---

## PIT-017 — Pin + overflow-hidden = black gap / broken scroll stack

**Tags:** `gsap`, `scroll`, `layout`

**Symptom:** Black empty region after Let's Talk / portfolio; pin does not work.

**Cause:** Wrapping pinned sections in `overflow-hidden` on desktop.

**Fix:** `lg:contents` on wrappers; `overflow-hidden` only for mobile rounded overlap.

**Prevent:** Never put desktop `overflow-hidden` on GSAP-pinned section ancestors.

---

## PIT-018 — Menu contrast wrong on light sections

**Tags:** `navbar`, `theme`, `contrast`

**Symptom:** White Menu on light Case Studies / portfolio body.

**Cause:** Missing/incorrect `data-menu-contrast` or theme hydration.

**Fix:** Sections set `data-menu-contrast="light"|"dark"`; navbar reacts accordingly.

**Prevent:** Every full-bleed light section must declare contrast for the burger/Menu.

---

## PIT-019 — Lexical tables clipped / squashed on mobile (RU worse)

**Tags:** `portfolio`, `richtext`, `tables`, `mobile`, `css`

**Symptom:** Wide tables in project body shrink; long RU cell text looks cut off; no horizontal scroll.

**Cause:**
1. No overflow styles on Payload’s `.lexical-table-container`.
2. Flex ancestors default `min-width: auto` → grow to table min-content → parent `overflow-hidden` / page `overflow-x: clip` clips without an inner scrollport.

**Fix:** CSS on `.lexical-table-container` (`overflow-x: auto`, table `width: max-content`, cells `white-space: nowrap`) + `min-w-0` on ProjectBody flex wrappers. Thin scrollbar restored on the table scroller (global scrollbar hide otherwise).

**Prevent:** Any rich-text table surface needs a width-constrained scroll wrapper and `min-w-0` in flex layouts.

---

## PIT-020 — Contact form in admin, no email in the mailbox

**Tags:** `contact`, `email`, `smtp`, `hostinger`, `dns`, `vercel`  
**Seen:** 2026-08-14. Mailbox `order@erythro.ai`. Verified working after DNS + SMTP ship.

**Symptom:** Form on `erythro.ai` returns success. Row appears in `/admin` → Contact Submissions. No message in Hostinger. Gmail → `order@erythro.ai` may already work (inbound OK) while site orders still do not.

**Cause (two independent layers):**
1. **Inbound DNS.** Mail records must live on **whatever nameservers the domain uses**.
   Erythro: NS were Vercel, then moved to **Cloudflare**. Hostinger Email “connect automatically”
   does nothing unless NS are Hostinger. Without MX/SPF/DKIM at the **current** DNS host,
   Hostinger shows “mailbox cannot receive / MX missing”.
2. **Outbound from the site.** Production `POST /api/contact` used to only `payload.create({ collection: 'contact-submissions' })`. Payload then logs `No email adapter provided. Email will be written to console.` Saving in CMS is not sending mail. Send path is nodemailer SMTP (`smtp.hostinger.com:465`, user/from `order@erythro.ai`), env `SMTP_PASS` on Vercel Production/Preview.

**Fix:**
1. DNS host of the domain (now **Cloudflare** → DNS → Records; previously Vercel Domains → DNS). Leave Name empty for apex; do not add records in Hostinger’s DNS zone:
   - MX `mx1.hostinger.com` priority 5; MX `mx2.hostinger.com` priority 10
   - TXT `v=spf1 include:_spf.mail.hostinger.com ~all`
   - CNAME `hostingermail-a._domainkey` → `hostingermail-a.dkim.mail.hostinger.com` (and `-b`, `-c`)
   - TXT `_dmarc` → `v=DMARC1; p=none; rua=mailto:order@erythro.ai`
2. Code: `src/lib/contactNotification.ts` + `src/app/api/contact/route.ts`. Recipients = Site Settings notify (contact / order). Set `SMTP_PASS` (mailbox password, never commit). Merge to `main`.
3. Confirm Hostinger Domain settings green, then submit the live form. Logs: `[api/contact]`, `[contactNotification]`.

**Prevent:** After **any** NS move, re-add mail records at the new DNS. Treat CMS save and SMTP as separate steps. Do not assume Payload’s email adapter is configured.

---

## PIT-021 — Contact form mail lands in Hostinger Spam (Gmail forward still works)

**Tags:** `contact`, `email`, `smtp`, `hostinger`, `spam`  
**Seen:** 2026-08-16. Mailbox `order@erythro.ai`; forward to Gmail OK.

**Symptom:** Form succeeds; row in Contact Submissions; message appears in Hostinger **Spam**, not Inbox. Forwarding rule to Gmail still delivers.

**Cause:** Not broken DNS (MX/SPF/DKIM/DMARC already green). Hostinger’s local filter often scores **self-SMTP** poorly: From `order@erythro.ai` → To `order@erythro.ai` with Reply-To = visitor’s external address (classic contact-form pattern). Gmail receive via forward uses different scoring.

**Fix (ops — do this first):**
1. In Hostinger webmail: open one spam message → **Not spam** / whitelist.
2. Emails → Filters (or webmail Settings → Filters): if From contains `order@erythro.ai` **or** Subject contains `Erythro.ai contact` / `Erythro.ai order` → move to Inbox / never spam.
3. Optional: Site Settings → Form notifications → set inbox to Gmail (`erythro.ai@gmail.com`); keep `order@erythro.ai` only as SMTP From. Then Hostinger is not the primary read target.

**Fix (code):** `contactNotification` sends From as `"Erythro.ai" <order@…>`, named Reply-To, aligned envelope, `Auto-Submitted` headers (reduces some false positives; does not replace the filter).

**Prevent:** Prefer reading form alerts in Gmail (or a dedicated notify address) rather than the same Hostinger mailbox used as SMTP From.

---

## PIT-022 — Local e2e / `getPayload` hangs on Drizzle «Accept warnings and push schema?»

**Tags:** `e2e`, `payload`, `push`, `windows`, `playwright`  
**Seen:** 2026-08-18 full `pnpm test`. Warning mentioned deleting `full` / `home_only` columns.

**Symptom:** Playwright `webServer` times out 60s waiting for `:3000`, or tests hang with no output. Dev terminal stuck on `Pulling schema from database...` then interactive `y/N`.

**Cause:** Payload postgres adapter `push` is on in `next dev`. Schema drift vs DB → Drizzle prompts. `getPayload` in e2e `seedTestUser` hits the same prompt. CI already sets `push: false`; local `pnpm dev` does not.

**Fix:**
- `PAYLOAD_DISABLE_PUSH=1` for `pnpm dev` and `pnpm test:e2e` (`playwright.config.ts` sets it).
- Never answer `y` to a DATA LOSS push during tests. Formal migration if the column change is real.

**Prevent:** Keep `push: false` when `CI=true` / `NODE_ENV=test` / `PAYLOAD_DISABLE_PUSH=1`. Do not run e2e against a `next dev` that is already blocked on a prompt. Kill leftover processes on port 3000.

---

## PIT-023 — Playwright e2e false failures (Next.js Link, browsers, timeouts, stale copy)

**Tags:** `e2e`, `playwright`, `next`, `windows`  
**Seen:** 2026-08-18 full local suite.

**Symptoms / fixes:**

| Symptom | Cause | Fix |
|---|---|---|
| `Executable doesn't exist` … `chromium-####/chrome.exe` | Browsers not installed in this env | `pnpm exec playwright install chromium` |
| `waitForURL` timeout after CTA click; URL may already be `/portfolio` | Default `waitUntil: 'load'` does not fire again on App Router client navigation | `{ waitUntil: 'commit' }`; click `#service-body a[href*="/portfolio"]` |
| Admin `beforeAll` timeout 30s; later admin tests skipped | First compile of `/admin` + `seedTestUser` | `test.describe.configure({ timeout: 120000 })` + `testInfo.setTimeout(120000)` |
| Homepage expects `Engineering the future`, page has `ENGINEERING FUTURE` | Template/e2e copy not updated after Hero Motion / CMS | Assert current copy (`HERO_MOTION.md` кадр 1) |
| `webServer` 60s timeout | Cold `next dev` + Payload | `timeout: 180 * 1000`; `reuseExistingServer: true`; free port 3000 |

**Prevent:** After copy or CTA changes, update e2e in the same PR. Local full run: `pnpm test` (int) then `pnpm test:e2e` with Chromium installed. E2E still **not** on GHA — do not assume CI covers UI.

---

## PIT-024 — Vercel build fails: middleware → Payload → `node:console` UnhandledSchemeError

**Tags:** `vercel`, `middleware`, `edge`, `payload`, `markdown`, `agent-readiness`  
**Seen:** 2026-08-28 PR `fix/order-page-solutions` (agent readiness / markdown negotiation).

**Symptom:** Vercel `pnpm run build` fails with webpack `UnhandledSchemeError: Reading from "node:console"` (also `node:crypto`, `node:diagnostics_channel`). Import trace ends at `./src/middleware.ts`.

**Cause:** Middleware (Edge bundle) imported `@/lib/markdownNegotiation`, which pulls `legalPages.server` → `payload` → `undici` Node builtins. Edge/webpack cannot resolve `node:` schemes the same way as the Node server bundle. Related to PIT-002 (admin client), but here the leak is via **middleware**, not the admin import map.

**Fix:**
- Edge-safe Accept parser only: `src/lib/markdownAccept.ts` (`shouldServeMarkdown`).
- Middleware imports `markdownAccept` + `agentDiscovery` — never `markdownNegotiation` / Payload / CMS.
- Server route `src/app/api/markdown-negotiate/` keeps the heavy `generateMarkdownForRoute`.

**Prevent:** Treat middleware as Edge-only. Any new helper used from `middleware.ts` must be free of Payload, `pg`, `undici`, and other Node-only deps. If in doubt, split “parse headers” from “fetch CMS”.

---

## PIT-025 — Unit CI: markdown `/order/:slug` returns 404 (wrong static slug)

**Tags:** `ci`, `vitest`, `order-plans`, `markdown`  
**Seen:** 2026-08-28 Unit Tests job after agent-readiness merge.

**Symptom:** `generates markdown for /order/:slug` expects 200, gets 404. Logs may show `ECONNREFUSED …:5432` — easy to misread as “need Postgres in Unit job”.

**Cause:** Test hard-coded slug `audit-diagnostic`, which existed only in **uncommitted** local `orderPlans` WIP. On CI, Unit job has no `DATABASE_URL`; CMS fetch fails and falls back to committed `ORDER_PLANS` (`free-start`, `ai-business-card`, …) — no `audit-diagnostic` → 404. Empty Postgres service would not help without seed data.

**Fix:** Resolve slug from `getAllOrderSlugs()[0]` (static committed plans). Keep Unit job DB-free.

**Prevent:** Int tests that assert CMS-backed routes must use slugs present in static fallbacks, or `describe.skipIf(!DATABASE_URL)` and run under API Tests. Do not add Postgres to Unit solely for one slug.

---

## PIT-026 — Unit CI: all tests pass, Vitest exits 1 with 14 unhandled rejections

**Tags:** `ci`, `vitest`, `payload`, `database`  
**Seen:** 2026-08-28 Unit Tests (`68 passed`, `14 errors`, exit code 1).

**Symptom:** Suite green, then `Vitest caught N unhandled errors` / `Unhandled Rejection` with empty `{ message: undefined, stacks: [] }`.

**Cause:** Without `DATABASE_URL`, helpers still call `getPayload()`. Payload/pg opens a pool to `localhost:5432`; connection failures surface as **unhandled** rejected promises after the test’s try/catch already returned static fallbacks. Vitest treats unhandled rejections as run failure.

**Fix:** In `vitest.setup.ts`, when `DATABASE_URL` is missing, mock `payload.getPayload` to throw immediately (no dial). CMS helpers catch and use static data. When `DATABASE_URL` is set (API job / local), use real Payload.

**Prevent:** Unit job stays “no DB”. Don’t “fix” by adding a blank Postgres service. Reproduce locally: unset `DATABASE_URL` and run `pnpm exec vitest run --exclude tests/int/api.int.spec.ts`.

---

## PIT-027 — Production `/admin` Cloudflare 524 / Vercel 300s timeout

**Tags:** `admin`, `cloudflare`, `524`, `payload`, `prodMigrations`, `batch=-1`, `vercel`  
**Seen:** 2026-08-30 `https://erythro.ai/admin` — Cloudflare “A timeout occurred Error code 524” at 00:46:33 UTC.

**Symptom:** Public pages work (cached). `/admin` hangs, then Cloudflare 524. Vercel runtime: `Task timed out after 300 seconds`. Logs show the interactive prompt:

```
It looks like you've run Payload in dev mode, meaning you've dynamically pushed
changes to your database. Would you like to proceed? (y/N)
```

**Cause:** Local `next dev` against the **production** `DATABASE_URL` (same Supabase as Vercel) writes `payload_migrations` (`name=dev`, `batch=-1`). Serverless `getPayload()` then runs `prodMigrations`, hits that row, and `prompts()` waits on stdin that does not exist. Public routes often miss this because `getSiteContent` is cached.

**Fix (ops, immediate):**
```sql
DELETE FROM payload_migrations WHERE batch = -1;
```
Wait for hung Fluid isolates to die (up to 300s) or redeploy so new instances skip the prompt. `pnpm db:clear-dev-push` does the same SQL.

**Fix (code):** Do not pass `prodMigrations` at Vercel request runtime — migrations already run in `pnpm build` via `payload migrate`. Keep `push: false` in production / `VERCEL=1`. Local `pnpm dev` sets `PAYLOAD_DISABLE_PUSH=1` so it cannot rewrite `batch=-1` on prod.

**Prevent:** Never point local `next dev` at prod without `PAYLOAD_DISABLE_PUSH=1`. Schema changes go through `src/migrations/` + build `payload migrate`, not Drizzle push against Supabase.

---

## PIT-028 — CI API test: missing `solution_plans_features.home_only` (and `features_locales.full`)

**Tags:** `ci`, `postgres`, `migrations`, `drizzle-push`, `solution-plans`  
**Seen:** 2026-08-30 API Tests after local `next:dev` against prod Supabase (same incident as PIT-027).

**Symptom:** `has required Postgres columns for critical tables` fails:
`missing column "solution_plans_features.home_only"` (and/or `solution_plans_features_locales.full`).

**Cause:** Migration rows still exist in `payload_migrations`, but a local Drizzle **push** dropped the real columns. `payload migrate` then skips them as "already applied".

**Fix:**
```bash
pnpm db:fix-solution-feature-columns
```
Or SQL:
```sql
ALTER TABLE "solution_plans_features"
  ADD COLUMN IF NOT EXISTS "home_only" boolean DEFAULT false;
ALTER TABLE "solution_plans_features_locales"
  ADD COLUMN IF NOT EXISTS "full" jsonb;
```
CI runs the fix script before API tests.

**Prevent:** Same as PIT-027 — never push schema against prod. Prefer `PAYLOAD_DISABLE_PUSH=1` / localhost DB for local work.

---

## PIT-029 — Audit landing copy vs QA_Auditor report tiers

**Tags:** `audit`, `copy`, `qa-auditor`  
**Seen:** 2026-08-30 `/audit` vs `C:\agents\website-auditor\erythro-ai`

**Symptom:** Marketing claimed ~55–60 checks, “homepage + 5 funnel pages” on Free, and Diagnostic as a full 60+ checklist with a fix plan.

**Cause:** Copy described the lab in the abstract, not `A44Tier` disclosure: Free 1 URL (scorecard, top-3, Lighthouse); Diagnostic 5 URLs + summary cards; Pro full 60+ checklist + recommendations **and up to 10 funnel URLs** (`A44Tier.pageCap`: Free=1, Diagnostic=5, Pro=10). Scale names in PDFs are Speed & Mobile UX, SEO & Visibility, Lead gen & Forms, Security & Stability, AI Visibility & Brand Discovery.

**Fix:** Align `src/lib/auditPage.ts` (including `/audit` «How it works»), `src/lib/orderPlans.ts` (`AUDIT_ORDER_PLANS` + `AUDIT_CHECK_CATEGORIES`), and order UI with `QA_Auditor` `A44Copy` / `ReportScopeOfWork` / `AGENTS.md`. Client PDFs say “60+”, not “55–60”. Do not brand Agent Readiness as Vercel. Scorecard weights in `AuditCollector` are Speed 27% · Lead 22% · SEO 22% · Security 18% · AI Visibility 11%; L1 is reported, not weighted. The How-it-works categories **and** Order «What we check» cards must follow `ReportScopeOfWork` itemsCore (network, indexing, PSI, per-locale, AI Visibility, Agent Readiness L1, funnel crawl) — not scorecard-only marketing lists. Pro Order features must disclose `pageCap=10`, not only “everything in Diagnostic”.

**Prevent:** When auditor checks or tier unlocks change, update landing + order copy in the same change. Diff against `QA_Auditor/AGENTS.md`, `ReportScopeOfWork.java`, and `A44Tier.pageCap`.

---

## PIT-030 — Audit order checkout must persist structured client fields

**Tags:** `audit`, `order`, `contact-submissions`  
**Seen:** 2026-08-31

**Symptom:** Order audit checkout collected name/email/phone/website, but website, report language, and plan lived only inside freeform `message`. Staff could not query leads for post-audit report delivery.

**Cause:** `/api/contact` + `contact-submissions` stored only name/email/phone/message/source/locale.

**Fix:** Structured columns `website`, `audit_language`, `plan_slug`, `plan_total`, `audit_status`. Guard requires website + auditLanguage when `source=audit`. `/audit` and `/order/audit-*` POST via `buildAuditContactPayload`. Migration `20260831_010000_contact_submissions_audit_fields` + `pnpm db:fix-contact-submissions-audit-fields`.

**Prevent:** Do not pack audit metadata only into `message`. Keep Order modal validation on `validateAuditForm`.

---

## PIT-031 — Docker Compose eats `$` inside `SMTP_PASS` on the audit worker

**Symptom:** Worker logs `email skipped: SMTP_PASS not set` or SMTP auth fails after deploy; `docker compose` warns `The "R" variable is not set` (or another letter from the password).

**Cause:** Compose interpolates `$VAR` / `$R` in `/home/audit-agent/.env` when recreating the container, so a Hostinger password containing `$` is truncated or emptied.

**Fix:** Escape literal dollars as `$$` when writing worker `.env` (`scripts/deploy_vps_audit_stack.py`). Verify with `docker exec audit_agent_worker node -e "console.log(String((process.env.SMTP_PASS||'').length))"` — length must match local `SMTP_PASS`.

**Prevent:** Never paste raw `$…` secrets into Compose env files without `$$` escaping. Prefer `env_file` values that are pre-escaped by the deploy script.

---

## PIT-032 — Audit email / “Open full report” returns R2 `InvalidArgument` Authorization XML

**Symptom:** Client opens the link from the audit email (or “Open full report”) and sees `<Error><Code>InvalidArgument</Code><Message>Authorization</Message></Error>` instead of HTML.

**Cause:** Worker stored/emailed the private S3 API URL (`*.r2.cloudflarestorage.com/...`) because `R2_PUBLIC_BASE_URL` was unset. That endpoint requires signed auth — browsers cannot open it.

**Fix:** Email and client-facing `reportUrl` use `https://erythro.ai/audit/report/[id]`, which redirects to `/api/audit/report/[id]/html` (standalone A44 document, not an iframe). Private storage URL stays only in `auditSummary.storageUrl`. Optionally set a public R2 custom domain / r2.dev as `R2_PUBLIC_BASE_URL` later.

**Prevent:** Never put `r2.cloudflarestorage.com` URLs in customer emails or external CTAs. Gate UI with `isPublicReportUrl()`.

---

## PIT-033 — CMS `htmlResult` PATCH returns 500 for full A44 HTML

**Symptom:** QA_Auditor finishes (score + R2 upload OK) but `PATCH /api/audit/internal/[id]` with `htmlResult` (~50KB+) returns 500; retry without `htmlResult` succeeds.

**Cause:** Likely request/WAF or Payload update path choking on large HTML body (column itself is `text` / unlimited).

**Fix:** Worker retries PATCH without `htmlResult` after failure; stores `auditSummary.storageKey`. Report API loads HTML from R2 via `getR2ObjectText(storageKey)` when `htmlResult` is empty.

**Prevent:** Do not rely on CMS as the only store for full report HTML. Always upload to R2 first; keep CMS preview optional.

---

## PIT-034 — A44 report logos 404 under `/api/audit/templates/figma-assets/`

**Symptom:** Standalone report page loads, but header/footer logos and icons are missing; network shows `Route not found "/api/audit/templates/figma-assets/logo-digital.svg"`.

**Cause:** QA_Auditor HTML uses filesystem-relative paths (`../../templates/figma-assets/...`). Served from `/api/audit/report/[id]/html`, the browser resolves them under `/api/audit/...`.

**Fix:** Ship assets in `public/templates/figma-assets/` (primary) and optionally R2 `assets/figma-assets/`. Rewrite HTML to `/templates/figma-assets/...`. `/api/audit/assets/figma-assets/...` falls back to local files when R2 credentials fail. Re-upload R2 copy with `npx tsx scripts/upload_audit_figma_assets_r2.mjs` when icons change.

**Prevent:** Never leave package HTML with `../templates/figma-assets` paths for web delivery. Do not rely only on R2 GetObject for logos — Vercel secret mismatches return opaque 404s.

---

## PIT-035 — Vercel `R2_ACCESS_KEY_ID` truncated (length 13) breaks report HTML

**Symptom:** Email says report ready; `/api/audit/report/[id]/html` returns `Report HTML not available yet`. Logs: `[r2] getObject failed: Credential access key has length 13, should be 32`.

**Cause:** Wrong/truncated Access Key ID in Vercel Project Env (local key is 32 hex chars). Combined with Payload rejecting large `htmlResult` (`The following field is invalid: Html Result`), CMS stays empty and R2 fallback fails.

**Fix:** Set correct `R2_ACCESS_KEY_ID` (32 chars) on Production+Preview and redeploy. Persist audit pipeline fields (including `htmlResult`) via SQL in `/api/audit/internal/[id]` — Payload re-validates existing `html_result` on later updates and keeps status stuck at `in_progress`. Backfill stuck rows from R2/HTML when needed.

**Prevent:** After adding R2 secrets, verify lengths (Access Key 32, Secret 64). Smoke `GetObject` from a Vercel function, not only from the VPS worker. Never use `payload.update` for large audit HTML.

---

## PIT-036 — Hebrew font wrong until full reload after language switch

**Tags:** `i18n`, `fonts`, `heebo`, `rtl`, `client-locale`

**Symptom:** Switching to Hebrew without reload shows system/fallback glyphs; after refresh Heebo looks correct. Russian Cyrillic Inter can lag the same way.

**Cause:** `layout.tsx` adds `heebo.variable` / `interCyrillic.variable` and `--font-inter-latin` only for the SSR cookie locale. `useSitePrefs` updated `lang`/`dir` on switch (so `html[dir=rtl]` CSS ran) but left `--font-heebo` unset until navigation remounted the layout.

**Fix:** `applyDocumentLocale` in `useSitePrefs` toggles the next/font variable classes and `--font-inter-latin` together with `lang`/`dir`.

**Prevent:** Any client-only locale switch must mirror layout font wiring, not only `lang`/`dir`. Keep checklist item “Client locale maps…” plus font CSS variables in mind for non-reload i18n.

---

## PIT-037 — n8n Code node expression `$node.name` breaks execution & light email signature styles

**Tags:** `n8n`, `email`, `autoresponder`, `imap`, `smtp`, `css`

**Symptom:** In n8n Code node, execution throws `Referenced node doesn't exist: The node 'name' doesn't exist`. In addition, autoresponder emails sent with dark theme CSS (e.g. `#cbd5e1`) are unreadable / invisible in standard email clients with white background.

**Cause:**
1. In n8n JavaScript Code nodes, `$node` is a function `$node["Node Name"]`, not an object with `.name`. Attempting `$node.name` triggers n8n's expression parser looking for a node named `"name"`.
2. Email HTML signatures without explicit solid black `#000000` text color inherit browser/client defaults or faint slate shades on white canvas.

**Fix:**
1. Extract recipient and routing metadata directly from incoming IMAP item headers (`delivered-to`, `to`, `return-path`) across `$input.all()`.
2. Set explicit `color: #000000; background-color: #ffffff;` inline styles on all container, paragraph, label, and link elements.
3. After editing code in n8n, always click **Publish** (or Save) to update the active background workflow.

**Prevent:** Never use `$node.name` in n8n Code nodes. Always test email HTML signatures against white email clients (Gmail / Apple Mail).

---

## PIT-038 — n8n email autoresponder: repeated replies in active client threads & default n8n attribution

**Tags:** `n8n`, `email`, `autoresponder`, `smtp`, `cooldown`, `threading`, `attribution`  
**Seen:** 2026-09-02 `Erythro.ai Email Autoresponder` (`order@erythro.ai` & `team@erythro.ai`).

**Symptom:**
1. Clients receive auto-replies on every single reply in an ongoing email conversation.
2. Multiple new emails sent within a short period trigger multiple duplicate auto-replies out-of-order.
3. Emails contain the footer string *"This email was sent automatically with n8n"*.

**Cause:**
1. IMAP trigger fires on every incoming message. Without checking `In-Reply-To`, `References`, or `Re:` / `Fwd:` / `Отв:` prefixes, the workflow treats conversational replies as new requests.
2. Without rate limiting, sequential emails trigger parallel executions that race and send duplicate responses.
3. n8n `emailSend` (SMTP) node has default attribution enabled unless explicitly toggled off in node Options.

**Fix:**
1. **Remove Attribution:** In `emailSend` nodes → **Options** → **Add Option** → `Append n8n Attribution` → toggle **OFF**.
2. **Thread Detection:** In JavaScript Code node (`Process & Sign Autoresponder`), check headers `in-reply-to`, `references`, and `subject` regex `/^(re:|fwd:|отв:|на:)/i` → push `ongoing_thread_reply` to `skipReasons`.
3. **24h Cooldown:** Use n8n persistent state `$getWorkflowStaticData('global')` to store `lastReplied[fromAddress] = timestamp` and enforce a 24-hour silence window (`rate_limited_24h`).
4. Commit updated workflow JSON in `infra/n8n/workflows/email-autoresponder.json` and deploy.

**Prevent:** Always implement conversation threading detection, a 24h per-sender cooldown, and explicit attribution disabling in all transactional autoresponder workflows.

---

## PIT-039 — GitHub Secret Scanning: hardcoded Google API key (public leak)

**Tags:** `security`, `secrets`, `github`, `pagespeed`, `google-api`  
**Seen:** 2026-09-02 GitHub Secret scanning alert #1 — `AuditCollector.java` fallback `PAGESPEED_API_KEY`.

**Symptom:** GitHub Security → Secret scanning alerts shows **Google API Key** with **Public leak**. Key prefix `AIzaSy…` in `services/audit-agent/QA_Auditor/src/main/java/ai/erythro/AuditCollector.java`.

**Cause:** Last-resort hardcoded Google API key in `getPageSpeedApiKey()` instead of env / `.env` only. Public repo = anyone can call PageSpeed Insights (or whatever APIs the key allows) on your quota/billing.

**Fix (order matters):**
1. **Revoke/rotate first** in [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials): delete or restrict the leaked key, create a new one.
2. Put the new key only in env (`PAGESPEED_API_KEY` / `GEMINI_API_KEY`) or local `.env` (gitignored) — never in source.
3. Remove hardcoded fallback from code (return `null` → anonymous PageSpeed mode).
4. Commit, push, then in the GitHub alert: **Revoke** (if GitHub can) → **Close as remediated**.

**Prevent:** No `AIza…` / tokens in Java/TS source. Pre-commit secret scan (gitleaks / GitHub push protection). Do not rewrite public git history unless coordinated — rotation is the real kill switch.

---

## PIT-040 — Duplicate auto-replies: Hostinger Mail Autoreply + n8n

**Tags:** `n8n`, `email`, `autoresponder`, `hostinger`, `duplicate`  
**Seen:** 2026-09-03 `order@erythro.ai` — two different confirmation emails on one inbound message.

**Symptom:** Client receives **two** auto-replies:
1. Generic Hostinger Mail text: *“Thank you for reaching out…”* / *“technical specialist will get back to you within one business day”* / signature *“Erythro.ai Team”* + *“High-Performance Web & Scalable AI Infrastructure”*.
2. Branded n8n text from `Process & Sign Autoresponder` (Hello {name}, Customer Service Orders, Tel / Email / URL, *Hi-Load Web Development…*).

The generic body is **not** in `infra/n8n/workflows/email-autoresponder.json`.

**Cause:** Two independent senders on the same mailbox.
1. **Hostinger Mail Autoreply / Vacation** on `order@erythro.ai` (and possibly `team@`) fires on inbound SMTP *before* IMAP. It appends the Hostinger webmail signature (`hmail-signature`, tagline *High-Performance Web & Scalable AI Infrastructure*). These messages are not saved to `INBOX.Sent`.
2. **n8n IMAP → SMTP** then sends the JS template.

**Fix:** Keep n8n only. Disable Hostinger Autoreply:
1. [Hostinger Mail](https://mail.hostinger.com/) → `order@erythro.ai` → **Settings → Auto-reply** (or **Vacation**) → **Off**. Repeat for `team@erythro.ai` if set.
2. Alternative: hPanel → **Emails** → account menu → **Autoresponder** → disable.
3. Optional: update the Hostinger **Signature** to the n8n branded block so *manual* webmail replies match; Autoreply must still stay off.

**Prevent:** Before activating an n8n IMAP autoresponder, confirm Hostinger Autoreply/Vacation is off for every watched mailbox. Do not run two auto-reply layers on one inbox.

---

## PIT-041 — Do not HTTP-fetch a user-supplied website URL (SSRF)

**Tags:** `ssrf`, `audit`, `dns`, `forms`  
**Seen:** 2026-09-03 — website live-check on `/audit` (replaced a proposed n8n workflow)

**Symptom:** “Verify the site exists” by `fetch(userUrl)` from Vercel/n8n can hit `127.0.0.1`, RFC1918, link-local, or cloud metadata.

**Cause:** The URL is attacker-controlled. Server-side HTTP to that URL is classic SSRF.

**Fix:** Format-check the hostname, block localhost / `*.local` / raw IPs, `dns.lookup` only, then require at least one **public** A/AAAA. No HTTP to the target. Implementation: `src/lib/checkWebsite.ts`, `POST /api/audit/check-website`.

**Prevent:** Never proxy or GET a client-supplied URL from app/n8n for “is this site real?”. DNS to a public IP is enough for the form; the audit worker already fetches the site later in its own sandbox.

---

## PIT-042 — Chrome autofill squares the audit pill inputs

**Tags:** `audit`, `forms`, `css`, `autofill`, `chrome`  
**Seen:** 2026-09-03 — `/audit` name / email / website / phone pills

**Symptom:** After browser autofill, pill fields lose rounded corners (rectangular yellow/gray overlay).

**Cause:** Chrome paints `:-webkit-autofill` as a rectangle. The pill used `overflow-visible` (so language/country dropdowns can escape), so the overlay ignored the pill `border-radius`.

**Fix:** `overflow-hidden` on pills without dropdowns; phone input keeps its own end radius; inset `box-shadow` + `-webkit-text-fill-color` on `:-webkit-autofill` to match dark/light field colors (`src/app/(frontend)/styles.css`, `AuditPillShell`).

**Prevent:** Do not leave rounded form shells at `overflow-visible` without either clipping or giving autofilled inputs their own radius + autofill override.

---

## PIT-043 — Turnstile widget blocked or siteverify skipped

**Tags:** `turnstile`, `csp`, `forms`, `env`  
**Seen:** 2026-09-03 — contact / audit / order intake

**Symptom:** Widget iframe empty; console CSP `frame-src` / `script-src` / `worker-src` violation. Widget chrome shows «Невозможно подключиться к веб-сайту» (error 600010). Or forms submit without a challenge locally, then `403` on production.

**Cause:** CSP omitted `https://challenges.cloudflare.com` in `frame-src` (script-only is not enough), or blocked Turnstile's `blob:` Web Worker (`worker-src` inherits `default-src 'self'`). Next.js inlines only `NEXT_PUBLIC_*` sitekeys; Cloudflare dashboard names (`TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`) need the `next.config` env map + secret alias. Production `TURNSTILE_HOSTNAMES` must not include `localhost`. Widget domains in the Cloudflare dashboard *must* include `localhost` for local testing. Opening via a LAN IP (`172.x`) also fails — that hostname is not on the widget.

**Fix:** CSP needs `script-src` / `connect-src` / `frame-src` → `https://challenges.cloudflare.com`, plus `worker-src 'self' blob:` and `blob:` on `script-src`. Accept `TURNSTILE_SITE_KEY` → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` → `TURNSTILE_SECRET`. Siteverify only on the server (`src/lib/turnstile.ts`). Restart `next dev` after changing public env or CSP. Open local as `http://localhost:3000` (or 3001), not the Hyper-V/WSL LAN IP.

**Prevent:** Never call siteverify from the browser. Reset the widget in `finally` after every submit (tokens are single-use). Mirror Vercel env for Production + Preview.

---

## PIT-044 — Form “thank you” is API SMTP, not n8n IMAP

**Tags:** `email`, `forms`, `n8n`, `autoresponder`, `smtp`  
**Seen:** 2026-09-04 — contact / order / audit forms

**Symptom:** After a site form submit, staff get the notify mail on `order@erythro.ai`, but the client never receives «спасибо, заявка принята». n8n IMAP autoresponder works for mail sent *from Gmail/other* to `order@`.

**Cause:** Site notify is From `"Erythro.ai" <order@erythro.ai>` To the CMS notify inbox (often the same mailbox), Reply-To = visitor, `Auto-Submitted: auto-generated`. n8n `Process & Sign Autoresponder` skips `From @erythro.ai` and `Auto-Submitted` ≠ `no`. Hostinger Autoreply must stay Off (PIT-040). Teaching n8n to reply to that Reply-To would risk mail loops.

**Fix:** Send a separate confirmation with `sendClientAcknowledgement` in `src/lib/contactNotification.ts` after CMS persist: To = visitor email, From = `order@erythro.ai`, Reply-To = `order@erythro.ai`, `Auto-Submitted: auto-replied`. Do not fail `/api/contact` if ack SMTP fails. n8n stays for inbound mail from **external** mailboxes only.

**Prevent:** Do not re-enable Hostinger Autoreply. Do not make n8n answer internal notify mail. Keep form ack and IMAP autoresponder as two different paths.

---

## PIT-045 — Cloudflare Insights beacon blocked by CSP

**Tags:** `csp`, `cloudflare`, `web-analytics`, `psi`  
**Seen:** 2026-09-04 `erythro.ai` — PageSpeed / Chrome Issues: `beacon.min.js` CSP violation

**Symptom:** Console / PSI: Loading `https://static.cloudflareinsights.com/beacon.min.js/...` violates `script-src`. Chrome Issues panel: Content security policy on `/beacon.min.js`.

**Cause:** Cloudflare Web Analytics auto-injects the Insights beacon on proxied zones. CSP in `next.config.ts` listed Turnstile (`challenges.cloudflare.com`) but not the Insights hosts.

**Fix:** Allow `https://static.cloudflareinsights.com` on `script-src` and `https://cloudflareinsights.com` on `connect-src` (manual beacons). Auto-injected RUM also posts to `'self'` `/cdn-cgi/rum`, which was already allowed. Do not pin the hashed `/beacon.min.js/v…` path — Cloudflare rotates it.

**Prevent:** When enabling a Cloudflare/Vercel/GA script, add both the script origin and its report endpoint to CSP in the same change. Re-check PSI console after deploy.

---

## Checklist before merging CMS / schema PRs

- [ ] Migration file under `src/migrations/` + registered in `index.ts`
- [ ] Fix script if prod/CI may lag (`pnpm db:fix-*`)
- [ ] CI runs fix script before API tests when needed
- [ ] `pnpm generate:importmap` if admin client features changed
- [ ] Cache key bump if content shape changed
- [ ] Client locale maps preserved for non-reload i18n pages; font CSS vars (`heebo` / cyrillic / `--font-inter-latin`) synced with `lang`/`dir` (PIT-036)
- [ ] Local `pnpm build` green; smoke `/admin` after plugin changes
- [ ] Contact/API changes: guard tests + do not skip SMTP vs CMS split (PIT-020)
- [ ] UI copy/CTA: update Playwright asserts; Next `<Link>` waits use `commit` (PIT-023)
- [ ] Local e2e with `PAYLOAD_DISABLE_PUSH=1` (PIT-022)
- [ ] Middleware imports: Edge-safe only — no Payload/CMS (PIT-024)
- [ ] Markdown/order int tests: static slug or skipIf no DB (PIT-025)
- [ ] Unit CI without DATABASE_URL must not dial Payload (PIT-026, `vitest.setup.ts`)
- [ ] Do not run local `next dev` against prod DATABASE_URL without `PAYLOAD_DISABLE_PUSH=1` (PIT-027)
- [ ] If CI reports missing CMS columns that migrations already list — restore with `pnpm db:fix-*` (PIT-028)
- [ ] Audit landing/order copy must match QA_Auditor report tiers (PIT-029)
- [ ] Audit order/form intake must POST structured website / auditLanguage / planSlug (PIT-030)
- [ ] No hardcoded API keys / `AIza…` in source; secrets only via env (PIT-039)
- [ ] n8n IMAP autoresponder: Hostinger Autoreply/Vacation must be Off (PIT-040)
- [ ] User-supplied website check: DNS + public IP only, never HTTP-fetch the URL (PIT-041)
- [ ] Rounded pill inputs: clip autofill or set input radius + `:-webkit-autofill` override (PIT-042)
- [ ] Turnstile: CSP `frame-src` + `worker-src blob:` + sitekey `NEXT_PUBLIC_` (or `TURNSTILE_SITE_KEY` map); prod hostnames without localhost (PIT-043)
- [ ] Form client ack is API SMTP to the visitor; n8n IMAP only answers inbound from external mailboxes (PIT-044)
- [ ] Cloudflare Insights/Web Analytics: CSP `script-src` `static.cloudflareinsights.com` + `connect-src` `cloudflareinsights.com` (PIT-045)
