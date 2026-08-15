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
1. **Inbound DNS.** Nameservers are Vercel (`ns1.vercel-dns.com` / `ns2.vercel-dns.com`). Hostinger Email “connect automatically” does nothing. Without MX/SPF/DKIM in **Vercel DNS**, Hostinger shows “mailbox cannot receive / MX missing”.
2. **Outbound from the site.** Production `POST /api/contact` used to only `payload.create({ collection: 'contact-submissions' })`. Payload then logs `No email adapter provided. Email will be written to console.` Saving in CMS is not sending mail. Send path is nodemailer SMTP (`smtp.hostinger.com:465`, user/from `order@erythro.ai`), env `SMTP_PASS` on Vercel Production/Preview.

**Fix:**
1. Vercel → Domains → `erythro.ai` → DNS (leave Name empty for apex; do not add records in Hostinger’s DNS zone):
   - MX `mx1.hostinger.com` priority 5; MX `mx2.hostinger.com` priority 10
   - TXT `v=spf1 include:_spf.mail.hostinger.com ~all`
   - CNAME `hostingermail-a._domainkey` → `hostingermail-a.dkim.mail.hostinger.com` (and `-b`, `-c`)
   - TXT `_dmarc` → `v=DMARC1; p=none; rua=mailto:order@erythro.ai`
2. Code: `src/lib/contactNotification.ts` + `src/app/api/contact/route.ts`. Recipients = Site Settings → Contacts → Email **and** `order@erythro.ai`. Set `SMTP_PASS` (mailbox password, never commit). Merge to `main`.
3. Confirm Hostinger Domain settings green, then submit the live form. Logs: `[api/contact]`, `[contactNotification]`.

**Prevent:** After moving NS to Vercel, re-add mail records there. Treat CMS save and SMTP as separate steps. Do not assume Payload’s email adapter is configured.

---

## PIT-021 — Contact form mail lands in Hostinger Spam (Gmail forward still works)

**Tags:** `contact`, `email`, `smtp`, `hostinger`, `spam`  
**Seen:** 2026-08-16. Mailbox `order@erythro.ai`; forward to Gmail OK.

**Symptom:** Form succeeds; row in Contact Submissions; message in Hostinger **Spam**, not Inbox. Forwarding to Gmail still delivers.

**Cause:** Not broken DNS (MX/SPF/DKIM/DMARC green). Hostinger’s local filter often scores **self-SMTP** poorly: From `order@erythro.ai` → To same mailbox with Reply-To = visitor’s external address. Gmail via forward uses different scoring.

**Fix (ops — do this first):**
1. Hostinger webmail: open spam → **Not spam** / whitelist.
2. Filter: From contains `order@erythro.ai` or Subject contains `Erythro.ai contact` / `Erythro.ai order` → Inbox / never spam.
3. Optional: Site Settings notify → Gmail; keep `order@erythro.ai` as SMTP From only.

**Fix (code):** From header is `"Erythro.ai" <order@…>` (display name + mailbox), named Reply-To, aligned envelope, `Auto-Submitted` headers.

**Prevent:** Prefer reading form alerts in Gmail (or a dedicated notify address), not the same Hostinger mailbox used as SMTP From.

---

## Checklist before merging CMS / schema PRs

- [ ] Migration file under `src/migrations/` + registered in `index.ts`
- [ ] Fix script if prod/CI may lag (`pnpm db:fix-*`)
- [ ] CI runs fix script before API tests when needed
- [ ] `pnpm generate:importmap` if admin client features changed
- [ ] Cache key bump if content shape changed
- [ ] Client locale maps preserved for non-reload i18n pages
- [ ] Local `pnpm build` green; smoke `/admin` after plugin changes
