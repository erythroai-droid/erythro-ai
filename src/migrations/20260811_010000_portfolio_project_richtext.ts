import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Portfolio project detail copy → Lexical rich text:
 * - portfolio_projects_locales.summary / subtitle
 * - portfolio_projects_body_paragraphs_locales.text
 *
 * Existing plain varchar values are wrapped in a minimal Lexical document.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202608110100)`)

  try {
    await db.execute(sql`
      ALTER TABLE "portfolio_projects_locales"
      ALTER COLUMN "summary" DROP NOT NULL
    `)

    await db.execute(sql`
      ALTER TABLE "portfolio_projects_locales"
      ALTER COLUMN "summary" TYPE jsonb
      USING (
        CASE
          WHEN "summary" IS NULL OR BTRIM("summary"::text) = '' THEN NULL
          WHEN left(BTRIM("summary"::text), 1) = '{' THEN "summary"::jsonb
          ELSE jsonb_build_object(
            'root', jsonb_build_object(
              'type', 'root',
              'format', '',
              'indent', 0,
              'version', 1,
              'direction', NULL,
              'children', jsonb_build_array(
                jsonb_build_object(
                  'type', 'paragraph',
                  'format', '',
                  'indent', 0,
                  'version', 1,
                  'direction', NULL,
                  'textFormat', 0,
                  'children', jsonb_build_array(
                    jsonb_build_object(
                      'type', 'text',
                      'text', "summary"::text,
                      'format', 0,
                      'mode', 'normal',
                      'style', '',
                      'detail', 0,
                      'version', 1
                    )
                  )
                )
              )
            )
          )
        END
      )
    `)

    await db.execute(sql`
      ALTER TABLE "portfolio_projects_locales"
      ALTER COLUMN "subtitle" TYPE jsonb
      USING (
        CASE
          WHEN "subtitle" IS NULL OR BTRIM("subtitle"::text) = '' THEN NULL
          WHEN left(BTRIM("subtitle"::text), 1) = '{' THEN "subtitle"::jsonb
          ELSE jsonb_build_object(
            'root', jsonb_build_object(
              'type', 'root',
              'format', '',
              'indent', 0,
              'version', 1,
              'direction', NULL,
              'children', jsonb_build_array(
                jsonb_build_object(
                  'type', 'paragraph',
                  'format', '',
                  'indent', 0,
                  'version', 1,
                  'direction', NULL,
                  'textFormat', 0,
                  'children', jsonb_build_array(
                    jsonb_build_object(
                      'type', 'text',
                      'text', "subtitle"::text,
                      'format', 0,
                      'mode', 'normal',
                      'style', '',
                      'detail', 0,
                      'version', 1
                    )
                  )
                )
              )
            )
          )
        END
      )
    `)

    await db.execute(sql`
      ALTER TABLE "portfolio_projects_body_paragraphs_locales"
      ALTER COLUMN "text" DROP NOT NULL
    `)

    await db.execute(sql`
      ALTER TABLE "portfolio_projects_body_paragraphs_locales"
      ALTER COLUMN "text" TYPE jsonb
      USING (
        CASE
          WHEN "text" IS NULL OR BTRIM("text"::text) = '' THEN NULL
          WHEN left(BTRIM("text"::text), 1) = '{' THEN "text"::jsonb
          ELSE jsonb_build_object(
            'root', jsonb_build_object(
              'type', 'root',
              'format', '',
              'indent', 0,
              'version', 1,
              'direction', NULL,
              'children', jsonb_build_array(
                jsonb_build_object(
                  'type', 'paragraph',
                  'format', '',
                  'indent', 0,
                  'version', 1,
                  'direction', NULL,
                  'textFormat', 0,
                  'children', jsonb_build_array(
                    jsonb_build_object(
                      'type', 'text',
                      'text', "text"::text,
                      'format', 0,
                      'mode', 'normal',
                      'style', '',
                      'detail', 0,
                      'version', 1
                    )
                  )
                )
              )
            )
          )
        END
      )
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202608110100)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "portfolio_projects_body_paragraphs_locales"
    ALTER COLUMN "text" TYPE varchar
    USING (
      CASE
        WHEN "text" IS NULL THEN NULL
        ELSE COALESCE(
          (
            SELECT string_agg(node #>> '{}', ' ')
            FROM jsonb_path_query("text", '$.root.**.text') AS node
          ),
          "text"::text
        )
      END
    )
  `)

  await db.execute(sql`
    ALTER TABLE "portfolio_projects_locales"
    ALTER COLUMN "subtitle" TYPE varchar
    USING (
      CASE
        WHEN "subtitle" IS NULL THEN NULL
        ELSE COALESCE(
          (
            SELECT string_agg(node #>> '{}', ' ')
            FROM jsonb_path_query("subtitle", '$.root.**.text') AS node
          ),
          "subtitle"::text
        )
      END
    )
  `)

  await db.execute(sql`
    ALTER TABLE "portfolio_projects_locales"
    ALTER COLUMN "summary" TYPE varchar
    USING (
      CASE
        WHEN "summary" IS NULL THEN NULL
        ELSE COALESCE(
          (
            SELECT string_agg(node #>> '{}', ' ')
            FROM jsonb_path_query("summary", '$.root.**.text') AS node
          ),
          "summary"::text
        )
      END
    )
  `)
}
