import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Feature `full` becomes Lexical rich text (order-page description under Value).
 * Convert existing varchar plain text into minimal Lexical JSON documents.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_features_locales"
    ALTER COLUMN "full" TYPE jsonb
    USING (
      CASE
        WHEN "full" IS NULL OR BTRIM("full"::text) = '' THEN NULL
        WHEN left(BTRIM("full"::text), 1) = '{' THEN "full"::jsonb
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
                    'text', "full"::text,
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
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "solution_plans_features_locales"
    ALTER COLUMN "full" TYPE varchar
    USING (
      CASE
        WHEN "full" IS NULL THEN NULL
        ELSE COALESCE(
          (
            SELECT string_agg(node #>> '{}', ' ')
            FROM jsonb_path_query("full", '$.root.**.text') AS node
          ),
          "full"::text
        )
      END
    );
  `)
}
