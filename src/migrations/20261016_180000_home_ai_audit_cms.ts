import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { homeAiAudit } from '../translations'

const LOCALES = ['en', 'ru', 'he'] as const

/**
 * Home AI Audit global (slug: home-ai-audit) — section under Hero.
 *
 *   home_ai_audit                         root (cta_href)
 *   home_ai_audit_locales                 localized scalars
 *   home_ai_audit_proof_slides            array (value)
 *   home_ai_audit_proof_slides_locales    slide copy
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "home_ai_audit" (
      "id"         serial PRIMARY KEY,
      "cta_href"   varchar,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "home_ai_audit_locales" (
      "section_title"    varchar,
      "section_subtitle" varchar,
      "headline_muted"   varchar,
      "headline_emph"    varchar,
      "body"             varchar,
      "body_accent"      varchar,
      "cta_label"        varchar,
      "cta_micro"        varchar,
      "proof_label"      varchar,
      "pricing_kicker"   varchar,
      "pricing_all"      varchar,
      "id"               serial PRIMARY KEY,
      "_locale"          "_locales" NOT NULL,
      "_parent_id"       integer NOT NULL,
      CONSTRAINT "home_ai_audit_locales_locale_parent_id_unique" UNIQUE ("_locale", "_parent_id"),
      CONSTRAINT "home_ai_audit_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "home_ai_audit"("id") ON DELETE cascade
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "home_ai_audit_proof_slides" (
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id"         varchar PRIMARY KEY,
      "value"      numeric,
      CONSTRAINT "home_ai_audit_proof_slides_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "home_ai_audit"("id") ON DELETE cascade
    );
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "home_ai_audit_proof_slides_order_idx"
    ON "home_ai_audit_proof_slides" ("_order");
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "home_ai_audit_proof_slides_parent_id_idx"
    ON "home_ai_audit_proof_slides" ("_parent_id");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "home_ai_audit_proof_slides_locales" (
      "suffix"     varchar,
      "support"    varchar,
      "impact"     varchar,
      "ask"        varchar,
      "id"         serial PRIMARY KEY,
      "_locale"    "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL,
      CONSTRAINT "home_ai_audit_proof_slides_locales_locale_parent_id_unique"
        UNIQUE ("_locale", "_parent_id"),
      CONSTRAINT "home_ai_audit_proof_slides_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "home_ai_audit_proof_slides"("id") ON DELETE cascade
    );
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN IF NOT EXISTS "home_ai_audit_id" integer;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_home_ai_audit_fk"
      FOREIGN KEY ("home_ai_audit_id") REFERENCES "home_ai_audit"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_home_ai_audit_id_idx"
    ON "payload_locked_documents_rels" ("home_ai_audit_id");
  `)

  // Seed defaults only when the global is empty.
  const existing = await db.execute(sql`SELECT "id" FROM "home_ai_audit" LIMIT 1`)
  const rows = (existing as { rows?: unknown[] }).rows ?? []
  if (rows.length > 0) return

  await db.execute(sql`
    INSERT INTO "home_ai_audit" ("id", "cta_href", "updated_at", "created_at")
    VALUES (1, ${homeAiAudit.ctaHref}, NOW(), NOW())
  `)

  for (const locale of LOCALES) {
    await db.execute(sql`
      INSERT INTO "home_ai_audit_locales" (
        "section_title", "section_subtitle", "headline_muted", "headline_emph",
        "body", "body_accent", "cta_label", "cta_micro", "proof_label",
        "pricing_kicker", "pricing_all", "_locale", "_parent_id"
      ) VALUES (
        ${homeAiAudit.sectionTitle[locale]},
        ${homeAiAudit.sectionSubtitle[locale]},
        ${homeAiAudit.headlineMuted[locale]},
        ${homeAiAudit.headlineEmph[locale]},
        ${homeAiAudit.body[locale]},
        ${homeAiAudit.bodyAccent[locale]},
        ${homeAiAudit.ctaLabel[locale]},
        ${homeAiAudit.ctaMicro[locale]},
        ${homeAiAudit.proofLabel[locale]},
        ${homeAiAudit.pricingKicker[locale]},
        ${homeAiAudit.pricingAll[locale]},
        ${locale}::"_locales",
        1
      )
    `)
  }

  for (let i = 0; i < homeAiAudit.proofSlides.length; i++) {
    const slide = homeAiAudit.proofSlides[i]
    const slideId = `seed-slide-${i + 1}`
    await db.execute(sql`
      INSERT INTO "home_ai_audit_proof_slides" ("_order", "_parent_id", "id", "value")
      VALUES (${i + 1}, 1, ${slideId}, ${slide.value})
    `)
    for (const locale of LOCALES) {
      await db.execute(sql`
        INSERT INTO "home_ai_audit_proof_slides_locales" (
          "suffix", "support", "impact", "ask", "_locale", "_parent_id"
        ) VALUES (
          ${slide.suffix[locale] ?? ''},
          ${slide.support[locale]},
          ${slide.impact[locale]},
          ${slide.ask[locale]},
          ${locale}::"_locales",
          ${slideId}
        )
      `)
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    DROP COLUMN IF EXISTS "home_ai_audit_id";
  `)

  for (const table of [
    'home_ai_audit_proof_slides_locales',
    'home_ai_audit_proof_slides',
    'home_ai_audit_locales',
    'home_ai_audit',
  ]) {
    await db.execute(sql`DROP TABLE IF EXISTS ${sql.raw(`"${table}"`)};`)
  }
}
