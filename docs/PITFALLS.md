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

## Checklist before merging CMS / schema PRs

- [ ] Migration file under `src/migrations/` + registered in `index.ts`
- [ ] Fix script if prod/CI may lag (`pnpm db:fix-*`)
- [ ] CI runs fix script before API tests when needed
- [ ] `pnpm generate:importmap` if admin client features changed
- [ ] Cache key bump if content shape changed
- [ ] Client locale maps preserved for non-reload i18n pages
- [ ] Local `pnpm build` green; smoke `/admin` after plugin changes
- [ ] Contact/API changes: guard tests + do not skip SMTP vs CMS split (PIT-020)
- [ ] UI copy/CTA: update Playwright asserts; Next `<Link>` waits use `commit` (PIT-023)
- [ ] Local e2e with `PAYLOAD_DISABLE_PUSH=1` (PIT-022)
- [ ] Middleware imports: Edge-safe only — no Payload/CMS (PIT-024)
- [ ] Markdown/order int tests: static slug or skipIf no DB (PIT-025)
- [ ] Unit CI without DATABASE_URL must not dial Payload (PIT-026, `vitest.setup.ts`)
