# Import portfolio projects

Self-contained tool: compose case copy from a brief and upsert **Pages → Portfolio Projects** via Payload Local API (no admin UI clicks).

```
scripts/import-project/
  README.md                 ← this file
  import-project.ts         ← CLI
  revalidate-site.ts        ← optional cache bust
  lib/                      ← brief parser, yaml, env, revalidate ping
  example/brief.yaml        ← copy to a working folder
  github-action.example.yml ← template for later GHA (not wired)
```

Working copies (images + filled briefs) live in `content/imports/<slug>/` and are gitignored. The example in this folder **is** committed.

Related CMS docs: [`docs/cases/case-study-template.md`](../../docs/cases/case-study-template.md), [`docs/cases/CMS_FIELD_MAP.md`](../../docs/cases/CMS_FIELD_MAP.md), [`docs/PORTFOLIO_CMS.md`](../../docs/PORTFOLIO_CMS.md).

---

## How to use (manual)

1. In `/admin` create the project and set **Slug** (other required fields can be stubs). Category `value` must already exist (**Portfolio Categories**, e.g. `websites`).
2. Copy `example/brief.yaml` → `content/imports/<slug>/brief.yaml`.
3. Fill `facts.en` / `facts.ru` / `facts.he` (same keys as `{{ PLACEHOLDER }}` in the case template). No invented metrics.
4. Optional images next to the brief: `card.*`, `hero.*`, `hero-mobile.*`, `body/frontend/*.png`.
5. Run:

```bash
npx vercel env pull .env.production.local --environment=production
pnpm import:project -- content/imports/<slug> --dry-run
pnpm import:project -- content/imports/<slug>
```

6. Review the admin URL the script prints. The public page may stay stale until cache bust (see below).

The script fills `title`, `description`, `summary`, five `body` sections, SEO; uploads media to Blob; **updates the document by slug**.

### Flags

| Flag | Meaning |
|---|---|
| `--dry-run` | Preview only, no DB write |
| `--create` | Create the CMS row if slug is missing (`category` required in the brief) |
| `--skip-media` | Text only; keep existing uploads |
| `--env-file=.env.production.local` | Override env file |

Default: slug **must already exist**. Missing doc → error unless `--create`.

---

## Working folder layout

```
content/imports/<slug>/
  brief.yaml
  card.jpg
  hero.jpg
  hero-mobile.jpg
  body/frontend/*.png
```

```yaml
slug: montblanc
category: websites
date: "2024 — 2025"
client: Demo
link: https://example.com
stack: [Figma, React]
tags: [website, react]
media:
  card: card.jpg
  hero: hero.jpg
  heroMobile: hero-mobile.jpg
bodyImages:
  frontend:
    - shots/catalog.png
```

Empty values, leftover `{{ KEY }}`, and `n/a` / `not used` are dropped. Missing RU/HE falls back to English.

| Facts / meta | CMS field |
|---|---|
| `slug`, `category`, `date`, `client`, `link`, `stack`, `tags` | same |
| `PROJECT_NAME` | `title` |
| `SHORT_TAGLINE` | `description` |
| `HIGH_LEVEL_SUMMARY` | `summary` (hero rich text) |
| `SUBTITLE` | `subtitle` |
| challenges + goals | `body` Challenges |
| frontend keys | `body` Frontend & UX |
| backend / CMS / integrations | `body` Backend |
| CI/CD + security | `body` Automation |
| results keys | `body` Results |
| `SEO_TITLE` / `SEO_DESC` | `seo.*` |

Ready-made copy instead of facts: `copy:` in YAML (`lib/import-project-brief.ts`).

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
