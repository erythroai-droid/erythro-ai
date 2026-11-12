# Import portfolio projects

Self-contained tool: compose case copy from a brief and upsert **Pages → Portfolio Projects** via Payload Local API (no admin UI clicks).

Body scheme matches **pro-interior / ORA 60A**: six rich Lexical sections (lists with bold leads, optional metrics table), plus optional **Highlights** under the title.

```
scripts/import-project/
  README.md                 ← this file
  import-project.ts         ← CLI (brief + optional body.ts)
  apply-rich-body.ts        ← body-only update from body.ts
  revalidate-site.ts        ← optional cache bust
  lib/                      ← brief parser, rich Lexical, yaml, env, revalidate ping
  example/brief.yaml        ← copy to a working folder
  github-action.example.yml ← template for later GHA (not wired)
```

Working copies (images + filled briefs) live in `content/imports/<slug>/` and are gitignored. The example in this folder **is** committed.

Related CMS docs: [`docs/cases/case-study-template.md`](../../docs/cases/case-study-template.md), [`docs/cases/CMS_FIELD_MAP.md`](../../docs/cases/CMS_FIELD_MAP.md), [`docs/PORTFOLIO_CMS.md`](../../docs/PORTFOLIO_CMS.md).

---

## How to use (manual)

1. In `/admin` create the project and set **Slug** (other required fields can be stubs), **or** pass `--create` with `category` in the brief. Category `value` must already exist (**Portfolio Categories**, e.g. `websites`).
2. Copy `example/brief.yaml` → `content/imports/<slug>/brief.yaml`.
3. Fill `facts.en` / `facts.ru` / `facts.he`. Optional: `highlights`, `features`, `metrics`. No invented metrics.
4. Optional hand-authored rich body: `content/imports/<slug>/body.ts` (same shape EN/RU/HE). If present, it replaces the composed body.
5. Optional images: `card.*`, `hero.*`, `hero-mobile.*`, `body/engineering/*`, `body/metrics/*`.
6. Run:

```bash
npx vercel env pull .env.production.local --environment=production
pnpm import:project -- content/imports/<slug> --dry-run
pnpm import:project -- content/imports/<slug>
```

7. Review the admin URL the script prints. The public page may stay stale until cache bust (see below).

The script fills `title`, `description`, `summary`, `subtitle`, **six** `body` sections as rich Lexical, optional `highlights`, SEO; uploads media; **updates the document by slug**.

Body-only (keep media/highlights as-is):

```bash
pnpm tsx scripts/import-project/apply-rich-body.ts content/imports/<slug>/body.ts --dry-run
```

### Flags

| Flag | Meaning |
|---|---|
| `--dry-run` | Preview only, no DB write |
| `--create` | Create the CMS row if slug is missing (`category` required in the brief) |
| `--skip-media` | Text only; keep existing uploads |
| `--env-file=.env.production.local` | Override env file |

Default: slug **must already exist**. Missing doc → error unless `--create`.

---

## Body scheme (six sections)

| `#` | id | Heading (EN) | Typical content |
|---|---|---|---|
| 1 | `overview` | Project overview | Lead + bullet list (client, industry, service, developer, stack, live) |
| 2 | `challenges` | Challenges and goals | Context paragraph + bold “Key goals” + bullets |
| 3 | `engineering` | Engineering solution and architecture | Numbered subsections (frontend / backend / delivery) with bullets |
| 4 | `features` | Key features | Bullet list (`features:` in YAML or `KEY_FEATURES` lines) |
| 5 | `metrics` | Audit results and engineering metrics | Intro + optional table + engineering notes |
| 6 | `results` | Results and business impact | Bullet list of outcomes |

Inline markup in composed / `body.ts` strings: `**bold**`, `` `code` ``.

Empty facts, leftover `{{ KEY }}`, and `n/a` / `not used` are dropped. Missing RU/HE falls back to English for meta fields. Body shape must match across EN/RU/HE when using `body.ts`.

---

## Working folder layout

```
content/imports/<slug>/
  brief.yaml
  body.ts                 # optional rich body override
  card.jpg
  hero.jpg
  hero-mobile.jpg
  body/engineering/*.png
  body/metrics/*.png
```

Legacy folders `body/frontend` and `body/results` still map to `engineering` / `metrics` images.

---

## Facts → CMS

| Facts / brief | CMS field |
|---|---|
| `slug`, `category`, `date`, `client`, `link`, `stack`, `tags` | same |
| `PROJECT_NAME` | `title` |
| `SHORT_TAGLINE` | `description` |
| `HIGH_LEVEL_SUMMARY` | `summary` (hero rich text) |
| `OVERVIEW_LEAD` (else summary) | body overview lead |
| `SUBTITLE` | `subtitle` |
| `CLIENT_NAME`, `INDUSTRY`, `SERVICES_PROVIDED`, `DEVELOPER_TEAM`, `TECH_STACK_LIST`, `DEMO_URL*` | overview bullets |
| challenges + goals keys | body challenges |
| frontend / backend / CI / security keys | body engineering |
| `features:` or `KEY_FEATURES` | body features |
| `metrics:` or `METRICS_INTRO` / `ENGINEERING_NOTES` | body metrics |
| results keys or `RESULTS_LIST` | body results |
| `highlights:` | `highlights[]` (label, detail, metrics, metricsNote) |
| `SEO_TITLE` / `SEO_DESC` | `seo.*` |

Ready-made plain body instead of facts: `copy.body` in YAML (legacy paragraphs). Prefer `body.ts` for rich lists/tables.

---

## Env

| Variable | Required | Why |
|---|---|---|
| `DATABASE_URL` | yes | Payload Postgres (prod after `vercel env pull`) |
| `PAYLOAD_SECRET` | yes | Payload |
| `BLOB_READ_WRITE_TOKEN` | for images | Vercel Blob |
| `REVALIDATION_TOKEN` | for live page | `POST /api/revalidate` |
| `NEXT_PUBLIC_SITE_URL` | recommended | Admin/public URLs + revalidate origin |

`PAYLOAD_DISABLE_PUSH=1` is set by `lib/load-env.ts` so Drizzle never prompts «Accept warnings and push schema?» against prod.

Local `revalidateTag` does **not** reach Vercel. After a write the CLI calls `/api/revalidate`. If the token mismatches, **Save once in production admin** — that is enough. Manual: `pnpm revalidate:site -- /portfolio/<slug>`.

Do not commit `.env*`. Re-running without `--skip-media` uploads **new** media rows (old files are not deleted).

---

## n8n + GitHub Actions (planned)

Do **not** drive `/admin` with browser clicks. Same contract as this CLI.

**n8n**

1. Create (or confirm) the CMS row + slug — human, or Payload REST with a service user.
2. LLM / form → `brief.yaml` (+ optional image URLs saved into `content/imports/<slug>/`).
3. Commit the folder to a branch **or** `repository_dispatch` / `workflow_dispatch` to GitHub Actions with `slug`.
4. Human review in admin; Save if the public page is stale.

**GitHub Action**

- Copy `github-action.example.yml` → `.github/workflows/import-project.yml` when you are ready (not enabled by default).
- Secrets on the repo: `DATABASE_URL`, `PAYLOAD_SECRET`, `BLOB_READ_WRITE_TOKEN`, `REVALIDATION_TOKEN`, `NEXT_PUBLIC_SITE_URL`.
- Job: checkout → `pnpm install` → `pnpm import:project -- content/imports/${SLUG}`.
- `CI=true` already disables schema push; keep `PAYLOAD_DISABLE_PUSH=1` anyway.
- Never pass `--create` from automation unless category and required fields are guaranteed.

Exit codes: `0` success, `1` validation/CMS error (safe to fail the workflow).
