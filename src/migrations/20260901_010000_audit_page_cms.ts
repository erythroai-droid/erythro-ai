import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Two changes in one migration:
 *
 * A) solution_plans — add `kind` varchar column ('solution' | 'audit').
 *    Back-fills existing audit-slug rows to 'audit', rest to 'solution'.
 *
 * B) audit-page global — creates the tables Payload expects for the
 *    audit-page global (slug: 'audit-page').
 *
 * Table layout mirrors the legal-page pattern (legal_privacy et al.):
 *
 *   audit_page                              root row
 *   audit_page_locales                      all localized scalars
 *
 *   audit_page_how_stats                    array rows
 *   audit_page_how_stats_locales
 *   audit_page_how_steps
 *   audit_page_how_steps_locales
 *   audit_page_how_pillars                  non-loc: weight
 *   audit_page_how_pillars_locales
 *   audit_page_how_categories
 *   audit_page_how_categories_locales
 *   audit_page_how_principles
 *   audit_page_how_principles_locales
 *
 *   audit_page_pricing_plans               non-loc: plan_id, featured, cta_href
 *   audit_page_pricing_plans_locales
 *   audit_page_pricing_plans_features      nested array
 *   audit_page_pricing_plans_features_locales
 *
 * Column naming follows Payload's snake_case conventions:
 *   groups flatten as `<group>_<field>`, camelCase → snake_case.
 */

// ── helpers ──────────────────────────────────────────────────────────────────

async function createArrayTable(
  db: MigrateUpArgs['db'],
  table: string,
  parentTable: string,
  extraCols: string = '',
): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ${sql.raw(`"${table}"`)} (
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id"         varchar PRIMARY KEY
      ${sql.raw(extraCols ? `, ${extraCols}` : '')}
    );
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS ${sql.raw(`"${table}_order_idx"`)} ON ${sql.raw(`"${table}"`)} ("_order");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS ${sql.raw(`"${table}_parent_id_idx"`)} ON ${sql.raw(`"${table}"`)} ("_parent_id");`)
}

async function createNestedArrayTable(
  db: MigrateUpArgs['db'],
  table: string,
  parentTable: string,
  extraCols: string = '',
): Promise<void> {
  // Nested arrays (features inside plans): _parent_id is varchar (refs parent array's varchar PK)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ${sql.raw(`"${table}"`)} (
      "_order"     integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id"         varchar PRIMARY KEY
      ${sql.raw(extraCols ? `, ${extraCols}` : '')}
    );
  `)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS ${sql.raw(`"${table}_order_idx"`)} ON ${sql.raw(`"${table}"`)} ("_order");`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS ${sql.raw(`"${table}_parent_id_idx"`)} ON ${sql.raw(`"${table}"`)} ("_parent_id");`)
}

async function createLocalesTable(
  db: MigrateUpArgs['db'],
  table: string,          // e.g. "audit_page_how_stats_locales"
  parentTable: string,    // e.g. "audit_page_how_stats"
  parentPkIsVarchar: boolean,
  cols: string,           // column definitions without id/_locale/_parent_id
): Promise<void> {
  const parentType = parentPkIsVarchar ? 'varchar' : 'integer'
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ${sql.raw(`"${table}"`)} (
      ${sql.raw(cols)}
      "id"         serial  PRIMARY KEY,
      "_locale"    "_locales" NOT NULL,
      "_parent_id" ${sql.raw(parentType)} NOT NULL,
      CONSTRAINT ${sql.raw(`"${table}_locale_parent_id_unique"`)} UNIQUE ("_locale", "_parent_id"),
      CONSTRAINT ${sql.raw(`"${table}_parent_id_fk"`)}
        FOREIGN KEY ("_parent_id") REFERENCES ${sql.raw(`"${parentTable}"`)}("id") ON DELETE cascade
    );
  `)
}

// ── up ────────────────────────────────────────────────────────────────────────

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ════════════════════════════════════════════════════════════════
  // A) solution_plans → add kind column
  // ════════════════════════════════════════════════════════════════
  await db.execute(sql`
    ALTER TABLE "solution_plans"
    ADD COLUMN IF NOT EXISTS "kind" varchar DEFAULT 'solution';
  `)
  // Back-fill audit slugs
  await db.execute(sql`
    UPDATE "solution_plans" SET "kind" = 'audit' WHERE "slug" LIKE 'audit-%';
  `)
  // Ensure everything non-audit defaults to 'solution'
  await db.execute(sql`
    UPDATE "solution_plans" SET "kind" = 'solution' WHERE "kind" IS NULL OR "kind" = '';
  `)

  // ════════════════════════════════════════════════════════════════
  // B) audit_page global root table
  // ════════════════════════════════════════════════════════════════
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "audit_page" (
      "id"         serial       PRIMARY KEY,
      "updated_at" varchar,
      "created_at" timestamp(3) with time zone
    );
  `)

  // ── audit_page_locales (all localized scalar fields) ─────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "audit_page_locales" (
      -- meta
      "title"                                    varchar NOT NULL DEFAULT '',
      "meta_description"                         varchar,

      -- tab labels (group: tabs)
      "tabs_audit"                               varchar,
      "tabs_how"                                 varchar,
      "tabs_pricing"                             varchar,

      -- form group scalars
      "form_heading"                             varchar,
      "form_intro"                               varchar,
      "form_intro_note"                          varchar,
      "form_required_note"                       varchar,
      "form_website"                             varchar,
      "form_website_placeholder"                 varchar,
      "form_website_invalid"                     varchar,
      "form_audit_language"                      varchar,
      "form_audit_language_options_en"           varchar,
      "form_audit_language_options_ru"           varchar,
      "form_audit_language_options_he"           varchar,
      "form_submit"                              varchar,
      "form_success"                             varchar,

      -- how group scalars
      "how_kicker"                               varchar,
      "how_hero_title"                           varchar,
      "how_hero_intro"                           varchar,
      "how_steps_heading"                        varchar,
      "how_methodology_title"                    varchar,
      "how_weight_note"                          varchar,
      "how_methodology_intro"                    varchar,
      "how_categories_title"                     varchar,
      "how_categories_intro"                     varchar,
      "how_principles_title"                     varchar,

      -- pricing group scalars
      "pricing_kicker"                           varchar,
      "pricing_title"                            varchar,
      "pricing_intro"                            varchar,
      "pricing_footnote"                         varchar,
      "pricing_agency"                           varchar,
      "pricing_agency_cta"                       varchar,

      "id"          serial  PRIMARY KEY,
      "_locale"     "_locales" NOT NULL,
      "_parent_id"  integer NOT NULL,
      CONSTRAINT "audit_page_locales_locale_parent_id_unique" UNIQUE ("_locale", "_parent_id"),
      CONSTRAINT "audit_page_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "audit_page"("id") ON DELETE cascade
    );
  `)

  // ════════════════════════════════════════════════════════════════
  // how.stats
  // ════════════════════════════════════════════════════════════════
  await createArrayTable(db, 'audit_page_how_stats', 'audit_page')
  await createLocalesTable(
    db,
    'audit_page_how_stats_locales',
    'audit_page_how_stats',
    true,
    '"label" varchar,\n      ',
  )

  // ════════════════════════════════════════════════════════════════
  // how.steps
  // ════════════════════════════════════════════════════════════════
  await createArrayTable(db, 'audit_page_how_steps', 'audit_page')
  await createLocalesTable(
    db,
    'audit_page_how_steps_locales',
    'audit_page_how_steps',
    true,
    '"label" varchar,\n      "title" varchar,\n      "body"  varchar,\n      ',
  )

  // ════════════════════════════════════════════════════════════════
  // how.pillars  (non-loc: weight)
  // ════════════════════════════════════════════════════════════════
  await createArrayTable(db, 'audit_page_how_pillars', 'audit_page', '"weight" varchar')
  await createLocalesTable(
    db,
    'audit_page_how_pillars_locales',
    'audit_page_how_pillars',
    true,
    '"title" varchar,\n      "body"  varchar,\n      ',
  )

  // ════════════════════════════════════════════════════════════════
  // how.categories
  // ════════════════════════════════════════════════════════════════
  await createArrayTable(db, 'audit_page_how_categories', 'audit_page')
  await createLocalesTable(
    db,
    'audit_page_how_categories_locales',
    'audit_page_how_categories',
    true,
    '"title" varchar,\n      "body"  varchar,\n      ',
  )

  // ════════════════════════════════════════════════════════════════
  // how.principles
  // ════════════════════════════════════════════════════════════════
  await createArrayTable(db, 'audit_page_how_principles', 'audit_page')
  await createLocalesTable(
    db,
    'audit_page_how_principles_locales',
    'audit_page_how_principles',
    true,
    '"title" varchar,\n      "body"  varchar,\n      ',
  )

  // ════════════════════════════════════════════════════════════════
  // pricing.plans  (non-loc: plan_id, featured, cta_href)
  // ════════════════════════════════════════════════════════════════
  await createArrayTable(
    db,
    'audit_page_pricing_plans',
    'audit_page',
    '"plan_id" varchar, "featured" boolean DEFAULT false, "cta_href" varchar',
  )
  await createLocalesTable(
    db,
    'audit_page_pricing_plans_locales',
    'audit_page_pricing_plans',
    true,
    '"name"          varchar,\n      "price"         varchar,\n      "price_compare" varchar,\n      "price_note"    varchar,\n      "description"   varchar,\n      "cta"           varchar,\n      ',
  )

  // ════════════════════════════════════════════════════════════════
  // pricing.plans[].features  (nested array — parent_id is varchar)
  // ════════════════════════════════════════════════════════════════
  await createNestedArrayTable(db, 'audit_page_pricing_plans_features', 'audit_page_pricing_plans')
  await createLocalesTable(
    db,
    'audit_page_pricing_plans_features_locales',
    'audit_page_pricing_plans_features',
    true,
    '"feature" varchar,\n      ',
  )

  // ════════════════════════════════════════════════════════════════
  // payload_locked_documents_rels — register audit_page FK
  // ════════════════════════════════════════════════════════════════
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN IF NOT EXISTS "audit_page_id" integer;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_audit_page_fk"
      FOREIGN KEY ("audit_page_id") REFERENCES "audit_page"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_audit_page_id_idx"
    ON "payload_locked_documents_rels" ("audit_page_id");
  `)
}

// ── down ──────────────────────────────────────────────────────────────────────

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Remove locked_docs FK
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    DROP COLUMN IF EXISTS "audit_page_id";
  `)

  // Drop audit_page tables in reverse dependency order
  const tables = [
    'audit_page_pricing_plans_features_locales',
    'audit_page_pricing_plans_features',
    'audit_page_pricing_plans_locales',
    'audit_page_pricing_plans',
    'audit_page_how_principles_locales',
    'audit_page_how_principles',
    'audit_page_how_categories_locales',
    'audit_page_how_categories',
    'audit_page_how_pillars_locales',
    'audit_page_how_pillars',
    'audit_page_how_steps_locales',
    'audit_page_how_steps',
    'audit_page_how_stats_locales',
    'audit_page_how_stats',
    'audit_page_locales',
    'audit_page',
  ]
  for (const t of tables) {
    await db.execute(sql`DROP TABLE IF EXISTS ${sql.raw(`"${t}"`)};`)
  }

  // Remove kind column from solution_plans
  await db.execute(sql`
    ALTER TABLE "solution_plans" DROP COLUMN IF EXISTS "kind";
  `)
}
