import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add three legal-page globals: legal-privacy, legal-terms, legal-accessibility.
 * Each global follows the same table pattern Payload generates for globals with
 * a localized array field:
 *
 *   <slug>                  — global root row (id, updated_at, created_at)
 *   <slug>_locales          — localized scalar fields per locale
 *   <slug>_sections         — array rows (order + parent FK)
 *   <slug>_sections_locales — localized fields per section row per locale
 *
 * Also registers the three slugs in payload_locked_documents_rels so the
 * admin lock mechanism works correctly.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ── legal_privacy ─────────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "legal_privacy" (
      "id"          serial       PRIMARY KEY,
      "updated_at"  varchar,
      "created_at"  timestamp(3) with time zone
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "legal_privacy_locales" (
      "title"            varchar NOT NULL DEFAULT '',
      "meta_description" varchar,
      "intro"            varchar,
      "closing"          varchar,
      "id"               serial  PRIMARY KEY,
      "_locale"          "_locales" NOT NULL,
      "_parent_id"       integer NOT NULL,
      CONSTRAINT "legal_privacy_locales_locale_parent_id_unique" UNIQUE ("_locale", "_parent_id"),
      CONSTRAINT "legal_privacy_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "legal_privacy"("id") ON DELETE cascade
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "legal_privacy_sections" (
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id"         varchar PRIMARY KEY,
      CONSTRAINT "legal_privacy_sections_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "legal_privacy"("id") ON DELETE cascade
    );
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "legal_privacy_sections_order_idx"     ON "legal_privacy_sections" ("_order");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "legal_privacy_sections_parent_id_idx" ON "legal_privacy_sections" ("_parent_id");`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "legal_privacy_sections_locales" (
      "heading"    varchar NOT NULL DEFAULT '',
      "paragraphs" varchar,
      "bullets"    varchar,
      "id"         serial  PRIMARY KEY,
      "_locale"    "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL,
      CONSTRAINT "legal_privacy_sections_locales_locale_parent_id_unique" UNIQUE ("_locale", "_parent_id"),
      CONSTRAINT "legal_privacy_sections_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "legal_privacy_sections"("id") ON DELETE cascade
    );
  `)

  // ── legal_terms ───────────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "legal_terms" (
      "id"          serial       PRIMARY KEY,
      "updated_at"  varchar,
      "created_at"  timestamp(3) with time zone
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "legal_terms_locales" (
      "title"            varchar NOT NULL DEFAULT '',
      "meta_description" varchar,
      "intro"            varchar,
      "closing"          varchar,
      "id"               serial  PRIMARY KEY,
      "_locale"          "_locales" NOT NULL,
      "_parent_id"       integer NOT NULL,
      CONSTRAINT "legal_terms_locales_locale_parent_id_unique" UNIQUE ("_locale", "_parent_id"),
      CONSTRAINT "legal_terms_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "legal_terms"("id") ON DELETE cascade
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "legal_terms_sections" (
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id"         varchar PRIMARY KEY,
      CONSTRAINT "legal_terms_sections_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "legal_terms"("id") ON DELETE cascade
    );
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "legal_terms_sections_order_idx"     ON "legal_terms_sections" ("_order");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "legal_terms_sections_parent_id_idx" ON "legal_terms_sections" ("_parent_id");`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "legal_terms_sections_locales" (
      "heading"    varchar NOT NULL DEFAULT '',
      "paragraphs" varchar,
      "bullets"    varchar,
      "id"         serial  PRIMARY KEY,
      "_locale"    "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL,
      CONSTRAINT "legal_terms_sections_locales_locale_parent_id_unique" UNIQUE ("_locale", "_parent_id"),
      CONSTRAINT "legal_terms_sections_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "legal_terms_sections"("id") ON DELETE cascade
    );
  `)

  // ── legal_accessibility ───────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "legal_accessibility" (
      "id"          serial       PRIMARY KEY,
      "updated_at"  varchar,
      "created_at"  timestamp(3) with time zone
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "legal_accessibility_locales" (
      "title"            varchar NOT NULL DEFAULT '',
      "meta_description" varchar,
      "intro"            varchar,
      "closing"          varchar,
      "id"               serial  PRIMARY KEY,
      "_locale"          "_locales" NOT NULL,
      "_parent_id"       integer NOT NULL,
      CONSTRAINT "legal_accessibility_locales_locale_parent_id_unique" UNIQUE ("_locale", "_parent_id"),
      CONSTRAINT "legal_accessibility_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "legal_accessibility"("id") ON DELETE cascade
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "legal_accessibility_sections" (
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id"         varchar PRIMARY KEY,
      CONSTRAINT "legal_accessibility_sections_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "legal_accessibility"("id") ON DELETE cascade
    );
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "legal_accessibility_sections_order_idx"     ON "legal_accessibility_sections" ("_order");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "legal_accessibility_sections_parent_id_idx" ON "legal_accessibility_sections" ("_parent_id");`)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "legal_accessibility_sections_locales" (
      "heading"    varchar NOT NULL DEFAULT '',
      "paragraphs" varchar,
      "bullets"    varchar,
      "id"         serial  PRIMARY KEY,
      "_locale"    "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL,
      CONSTRAINT "legal_accessibility_sections_locales_locale_parent_id_unique" UNIQUE ("_locale", "_parent_id"),
      CONSTRAINT "legal_accessibility_sections_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "legal_accessibility_sections"("id") ON DELETE cascade
    );
  `)

  // ── payload_locked_documents_rels FK columns ──────────────────────────────
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN IF NOT EXISTS "legal_privacy_id" integer;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_legal_privacy_fk"
      FOREIGN KEY ("legal_privacy_id") REFERENCES "legal_privacy"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_legal_privacy_id_idx" ON "payload_locked_documents_rels" ("legal_privacy_id");`)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN IF NOT EXISTS "legal_terms_id" integer;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_legal_terms_fk"
      FOREIGN KEY ("legal_terms_id") REFERENCES "legal_terms"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_legal_terms_id_idx" ON "payload_locked_documents_rels" ("legal_terms_id");`)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN IF NOT EXISTS "legal_accessibility_id" integer;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_legal_accessibility_fk"
      FOREIGN KEY ("legal_accessibility_id") REFERENCES "legal_accessibility"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_legal_accessibility_id_idx" ON "payload_locked_documents_rels" ("legal_accessibility_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Remove locked_docs FK columns
  for (const col of ['legal_privacy_id', 'legal_terms_id', 'legal_accessibility_id']) {
    await db.execute(sql`ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS ${sql.raw(`"${col}"`)};`)
  }

  // Drop tables in reverse dependency order
  const tables = [
    'legal_accessibility_sections_locales',
    'legal_accessibility_sections',
    'legal_accessibility_locales',
    'legal_accessibility',
    'legal_terms_sections_locales',
    'legal_terms_sections',
    'legal_terms_locales',
    'legal_terms',
    'legal_privacy_sections_locales',
    'legal_privacy_sections',
    'legal_privacy_locales',
    'legal_privacy',
  ]
  for (const t of tables) {
    await db.execute(sql`DROP TABLE IF EXISTS ${sql.raw(`"${t}"`)};`)
  }
}
