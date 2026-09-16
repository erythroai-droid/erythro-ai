import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * AI consultant storage:
 *
 *   consult_sessions                            identified chat transcripts
 *   project_briefs                              TZ-{id}, FK → consult_sessions
 *   tech_consult_tickets                        TC-{id}, FK → consult_sessions
 *
 *   consultant_settings                         global (editor-owned behaviour)
 *   consultant_settings_locales
 *   consultant_settings_brief_slots             interview checklist
 *   consultant_settings_brief_slots_locales
 *
 * DDL mirrors what `payload migrate:create` emits for these collections, made
 * idempotent so a partially applied run can be replayed.
 *
 * `next build` boots Payload in several workers at once, so the lock is
 * transaction-scoped: a session-scoped `pg_advisory_lock` releases before the
 * commit, which lets the next worker run `CREATE TABLE IF NOT EXISTS` against
 * tables it cannot see yet and then fail on the unique index over `pg_type`.
 */

const LOCK_ID = 202609150100

async function createEnum(
  db: MigrateUpArgs['db'],
  name: string,
  values: readonly string[],
): Promise<void> {
  const literals = values.map((v) => `'${v}'`).join(', ')
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE ${sql.raw(`"public"."${name}"`)} AS ENUM(${sql.raw(literals)});
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
}

async function addConstraint(
  db: MigrateUpArgs['db'],
  table: string,
  name: string,
  definition: string,
): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE ${sql.raw(`"${table}"`)}
      ADD CONSTRAINT ${sql.raw(`"${name}"`)} ${sql.raw(definition)};
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
}

async function createIndex(
  db: MigrateUpArgs['db'],
  name: string,
  table: string,
  columns: string,
  unique = false,
): Promise<void> {
  const kind = unique ? 'UNIQUE INDEX' : 'INDEX'
  await db.execute(
    sql`${sql.raw(`CREATE ${kind} IF NOT EXISTS "${name}" ON "${table}" USING btree (${columns});`)}`,
  )
}

// ── up ────────────────────────────────────────────────────────────────────────

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  // ── enums ──────────────────────────────────────────────────────────────────
  await createEnum(db, 'enum_consult_sessions_handoff', ['bot', 'queued', 'human'])
  await createEnum(db, 'enum_project_briefs_status', ['draft', 'sent'])
  await createEnum(db, 'enum_project_briefs_crm_status', ['pending', 'created'])
  await createEnum(db, 'enum_project_briefs_translater_status', ['translated', 'skipped'])
  await createEnum(db, 'enum_tech_consult_tickets_status', ['open', 'answered'])

  // ── consult_sessions ───────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "consult_sessions" (
      "id"                serial PRIMARY KEY NOT NULL,
      "email"             varchar NOT NULL,
      "phone"             varchar,
      "name"              varchar,
      "company"           varchar,
      "locale"            varchar,
      "messages"          jsonb,
      "handoff"           "enum_consult_sessions_handoff" DEFAULT 'bot',
      "email_verified_at" timestamp(3) with time zone,
      "identified_at"     timestamp(3) with time zone,
      "ip"                varchar,
      "updated_at"        timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at"        timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)
  await createIndex(db, 'consult_sessions_updated_at_idx', 'consult_sessions', '"updated_at"')
  await createIndex(db, 'consult_sessions_created_at_idx', 'consult_sessions', '"created_at"')

  // ── project_briefs ─────────────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "project_briefs" (
      "id"                serial PRIMARY KEY NOT NULL,
      "project_number"    varchar,
      "session_id"        integer,
      "name"              varchar,
      "company"           varchar,
      "email"             varchar NOT NULL,
      "phone"             varchar,
      "locale"            varchar,
      "brief_markdown"    varchar NOT NULL,
      "status"            "enum_project_briefs_status" DEFAULT 'draft',
      "crm_status"        "enum_project_briefs_crm_status" DEFAULT 'pending',
      "crm_item_id"       varchar,
      "translater_status" "enum_project_briefs_translater_status" DEFAULT 'skipped',
      "subject"           varchar,
      "emailed_at"        timestamp(3) with time zone,
      "updated_at"        timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at"        timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)
  await addConstraint(
    db,
    'project_briefs',
    'project_briefs_session_id_consult_sessions_id_fk',
    'FOREIGN KEY ("session_id") REFERENCES "public"."consult_sessions"("id") ON DELETE set null ON UPDATE no action',
  )
  await createIndex(db, 'project_briefs_session_idx', 'project_briefs', '"session_id"')
  await createIndex(db, 'project_briefs_updated_at_idx', 'project_briefs', '"updated_at"')
  await createIndex(db, 'project_briefs_created_at_idx', 'project_briefs', '"created_at"')

  // ── tech_consult_tickets ───────────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tech_consult_tickets" (
      "id"            serial PRIMARY KEY NOT NULL,
      "ticket_number" varchar,
      "email"         varchar NOT NULL,
      "locale"        varchar,
      "question"      varchar NOT NULL,
      "excerpt"       varchar,
      "session_id"    integer,
      "status"        "enum_tech_consult_tickets_status" DEFAULT 'open',
      "emailed_at"    timestamp(3) with time zone,
      "updated_at"    timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at"    timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)
  await addConstraint(
    db,
    'tech_consult_tickets',
    'tech_consult_tickets_session_id_consult_sessions_id_fk',
    'FOREIGN KEY ("session_id") REFERENCES "public"."consult_sessions"("id") ON DELETE set null ON UPDATE no action',
  )
  await createIndex(db, 'tech_consult_tickets_session_idx', 'tech_consult_tickets', '"session_id"')
  await createIndex(db, 'tech_consult_tickets_updated_at_idx', 'tech_consult_tickets', '"updated_at"')
  await createIndex(db, 'tech_consult_tickets_created_at_idx', 'tech_consult_tickets', '"created_at"')

  // ── consultant_settings global ─────────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "consultant_settings" (
      "id"                     serial PRIMARY KEY NOT NULL,
      "enabled"                boolean DEFAULT true,
      "anon_message_limit"     numeric DEFAULT 5,
      "verified_message_limit" numeric DEFAULT 30,
      "tech_consultant_email"  varchar,
      "updated_at"             timestamp(3) with time zone,
      "created_at"             timestamp(3) with time zone
    );
  `)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "consultant_settings_locales" (
      "bot_rules"              varchar,
      "greeting"               varchar,
      "otp_prompt"             varchar,
      "otp_code_prompt"        varchar,
      "otp_email_subject"      varchar,
      "otp_email_body"         varchar,
      "save_policy_notice"     varchar,
      "quota_exhausted_notice" varchar,
      "id"                     serial PRIMARY KEY NOT NULL,
      "_locale"                "_locales" NOT NULL,
      "_parent_id"             integer NOT NULL
    );
  `)
  await addConstraint(
    db,
    'consultant_settings_locales',
    'consultant_settings_locales_parent_id_fk',
    'FOREIGN KEY ("_parent_id") REFERENCES "public"."consultant_settings"("id") ON DELETE cascade ON UPDATE no action',
  )
  await createIndex(
    db,
    'consultant_settings_locales_locale_parent_id_unique',
    'consultant_settings_locales',
    '"_locale","_parent_id"',
    true,
  )

  // ── consultant_settings.briefSlots ─────────────────────────────────────────
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "consultant_settings_brief_slots" (
      "_order"     integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id"         varchar PRIMARY KEY NOT NULL,
      "slot_id"    varchar NOT NULL
    );
  `)
  await addConstraint(
    db,
    'consultant_settings_brief_slots',
    'consultant_settings_brief_slots_parent_id_fk',
    'FOREIGN KEY ("_parent_id") REFERENCES "public"."consultant_settings"("id") ON DELETE cascade ON UPDATE no action',
  )
  await createIndex(
    db,
    'consultant_settings_brief_slots_order_idx',
    'consultant_settings_brief_slots',
    '"_order"',
  )
  await createIndex(
    db,
    'consultant_settings_brief_slots_parent_id_idx',
    'consultant_settings_brief_slots',
    '"_parent_id"',
  )

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "consultant_settings_brief_slots_locales" (
      "question"   varchar NOT NULL,
      "hint"       varchar,
      "id"         serial PRIMARY KEY NOT NULL,
      "_locale"    "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );
  `)
  await addConstraint(
    db,
    'consultant_settings_brief_slots_locales',
    'consultant_settings_brief_slots_locales_parent_id_fk',
    'FOREIGN KEY ("_parent_id") REFERENCES "public"."consultant_settings_brief_slots"("id") ON DELETE cascade ON UPDATE no action',
  )
  // Postgres truncates index names at 63 chars — keep Payload's own spelling.
  await createIndex(
    db,
    'consultant_settings_brief_slots_locales_locale_parent_id_uni',
    'consultant_settings_brief_slots_locales',
    '"_locale","_parent_id"',
    true,
  )

  // ── payload_locked_documents_rels — admin edit locks ───────────────────────
  for (const [column, table] of [
    ['consult_sessions_id', 'consult_sessions'],
    ['project_briefs_id', 'project_briefs'],
    ['tech_consult_tickets_id', 'tech_consult_tickets'],
  ] as const) {
    await db.execute(sql`
      ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS ${sql.raw(`"${column}"`)} integer;
    `)
    await addConstraint(
      db,
      'payload_locked_documents_rels',
      `payload_locked_documents_rels_${table}_fk`,
      `FOREIGN KEY ("${column}") REFERENCES "public"."${table}"("id") ON DELETE cascade ON UPDATE no action`,
    )
    await createIndex(
      db,
      `payload_locked_documents_rels_${column}_idx`,
      'payload_locked_documents_rels',
      `"${column}"`,
    )
  }
}

// ── down ──────────────────────────────────────────────────────────────────────

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_xact_lock(${sql.raw(String(LOCK_ID))})`)

  for (const column of ['consult_sessions_id', 'project_briefs_id', 'tech_consult_tickets_id']) {
    await db.execute(sql`
      ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS ${sql.raw(`"${column}"`)};
    `)
  }

  for (const table of [
    'consultant_settings_brief_slots_locales',
    'consultant_settings_brief_slots',
    'consultant_settings_locales',
    'consultant_settings',
    'tech_consult_tickets',
    'project_briefs',
    'consult_sessions',
  ]) {
    await db.execute(sql`DROP TABLE IF EXISTS ${sql.raw(`"${table}"`)} CASCADE;`)
  }

  for (const type of [
    'enum_tech_consult_tickets_status',
    'enum_project_briefs_translater_status',
    'enum_project_briefs_crm_status',
    'enum_project_briefs_status',
    'enum_consult_sessions_handoff',
  ]) {
    await db.execute(sql`DROP TYPE IF EXISTS ${sql.raw(`"public"."${type}"`)};`)
  }
}
