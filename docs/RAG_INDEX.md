# RAG index — Erythro.ai knowledge base

Manifest for building a retrieval corpus from `docs/`. Use this file as the **ingest map**:
what to chunk, how to tag, and which questions each source answers.

Last updated: 2026-08-14.

---

## Goals

1. Answer ops questions: deploy, CI, Blob, migrations, SSL, Vercel hangs.
2. Answer product/CMS questions: portfolio fields, i18n, Lexical, heroes, images.
3. Answer “don’t repeat this bug” via `PITFALLS.md` (preferred for incident retrieval).
4. Support future agents (Cursor / n8n / import scripts) with stable, self-contained chunks.

---

## Corpus files (ingest these)

| File | Role | Chunk strategy | Primary tags |
|---|---|---|---|
| `docs/PITFALLS.md` | Failure catalog | **One chunk per `## PIT-NNN`** | `pitfall`, plus entry tags |
| `docs/PORTFOLIO_CMS.md` | Portfolio domain | One chunk per `##` heading | `portfolio`, `cms`, `i18n` |
| `docs/DEPLOYMENT.md` | Infra journal | One chunk per numbered `##` section | `deploy`, `vercel`, `supabase`, `ci` |
| `docs/PLAYBOOK.md` | Product playbook + chronology | `##` / `###` under §9+ as separate chunks | `playbook`, `i18n`, `gsap`, `cms` |
| `docs/HERO_MOTION.md` | Hero motion specifics | Per frame / rule heading | `hero`, `motion`, `gsap` |
| `docs/RAG_INDEX.md` | This map | Single small chunk or skip | `meta`, `rag` |
| `docs/IMPORT_PROJECT.md` | Pointer to import tool | Skip or one chunk | `portfolio`, `cms`, `import` |
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
| “Build failed / not deploying / hang” | `DEPLOYMENT.md` §4, §8–§11; `PIT-002`, `PIT-006`, `PIT-012`, `PIT-013` |
| “Admin empty / tables missing” | `PIT-001`, `DEPLOYMENT.md` §8.1 |
| “Video won’t play” | `PIT-003`, `DEPLOYMENT.md` §8.2 |
| “Column does not exist” | `PIT-004`, `PIT-005`, `PORTFOLIO_CMS.md` schema playbook |
| “Language doesn’t switch” | `PIT-007`, `PORTFOLIO_CMS.md` i18n |
| “Image cropped / PNG background / radius” | `PIT-008`, `PIT-009`, `PORTFOLIO_CMS.md` body images |
| “Mobile hero wrong” | `PIT-010`, `PIT-011`, `PORTFOLIO_CMS.md` hero |
| “How to add a CMS field” | `PORTFOLIO_CMS.md` schema playbook; `PLAYBOOK.md` §3 |
| “How we built X historically” | `PLAYBOOK.md` §9.* chronology |
| “Automate filling projects” | `scripts/import-project/README.md`; `PLAYBOOK.md` §9.12 |
| “Contact form / Hostinger / no email / MX” | `PIT-020`; `DEPLOYMENT.md` §13; `PLAYBOOK.md` §9.11 |

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
- [ ] `docs/ORDER_CMS.md` mirroring portfolio for Solution Plans / order page.
- [ ] `docs/I18N_RTL.md` consolidating BiDi / HE scrub / phone LTR fixes from commits.
- [ ] Embed `PITFALLS` + `PORTFOLIO_CMS` first (highest ROI); add full PLAYBOOK chronology second.
