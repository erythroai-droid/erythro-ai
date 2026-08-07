-- FAQ Section global (Payload slug: faq-section)
-- Safe to re-run: uses IF NOT EXISTS + upserts.
-- Answer field is Lexical richText (jsonb).

CREATE OR REPLACE FUNCTION faq_lexical_from_text(t text)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'root', jsonb_build_object(
      'type', 'root',
      'format', '',
      'indent', 0,
      'version', 1,
      'children', jsonb_build_array(
        jsonb_build_object(
          'type', 'paragraph',
          'format', '',
          'indent', 0,
          'version', 1,
          'children', CASE
            WHEN t IS NULL OR btrim(t) = '' THEN '[]'::jsonb
            ELSE jsonb_build_array(
              jsonb_build_object(
                'type', 'text',
                'text', t,
                'format', 0,
                'mode', 'normal',
                'style', '',
                'detail', 0,
                'version', 1
              )
            )
          END,
          'direction', null,
          'textFormat', 0
        )
      ),
      'direction', null
    )
  );
$$;

CREATE TABLE IF NOT EXISTS "faq_section" (
  "id" serial PRIMARY KEY,
  "updated_at" timestamp(3) with time zone,
  "created_at" timestamp(3) with time zone
);

CREATE TABLE IF NOT EXISTS "faq_section_locales" (
  "section_title" varchar,
  "section_subtitle" varchar,
  "id" serial PRIMARY KEY,
  "_locale" "_locales" NOT NULL,
  "_parent_id" integer NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "faq_section_locales"
    ADD CONSTRAINT "faq_section_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "faq_section"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "faq_section_locales_locale_parent_id_unique"
  ON "faq_section_locales" USING btree ("_locale", "_parent_id");

CREATE TABLE IF NOT EXISTS "faq_section_items" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "faq_section_items"
    ADD CONSTRAINT "faq_section_items_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "faq_section"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "faq_section_items_order_idx"
  ON "faq_section_items" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "faq_section_items_parent_id_idx"
  ON "faq_section_items" USING btree ("_parent_id");

CREATE TABLE IF NOT EXISTS "faq_section_items_locales" (
  "question" varchar NOT NULL,
  "answer" jsonb,
  "id" serial PRIMARY KEY,
  "_locale" "_locales" NOT NULL,
  "_parent_id" varchar NOT NULL
);

-- Migrate legacy varchar/text answer → Lexical jsonb
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'faq_section_items_locales'
      AND column_name = 'answer'
      AND data_type IN ('character varying', 'text')
  ) THEN
    ALTER TABLE "faq_section_items_locales" ALTER COLUMN "answer" DROP NOT NULL;
    ALTER TABLE "faq_section_items_locales"
      ALTER COLUMN "answer" TYPE jsonb
      USING CASE
        WHEN answer IS NULL OR btrim(answer::text) = '' THEN NULL
        WHEN left(btrim(answer::text), 1) = '{' THEN answer::text::jsonb
        ELSE faq_lexical_from_text(answer::text)
      END;
  END IF;
END $$;

DO $$ BEGIN
  ALTER TABLE "faq_section_items_locales"
    ADD CONSTRAINT "faq_section_items_locales_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "faq_section_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "faq_section_items_locales_locale_parent_id_unique"
  ON "faq_section_items_locales" USING btree ("_locale", "_parent_id");

-- Ensure the single global row exists
INSERT INTO "faq_section" ("id", "updated_at", "created_at")
VALUES (1, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET "updated_at" = NOW();

-- Titles / subtitles
INSERT INTO "faq_section_locales" ("section_title", "section_subtitle", "_locale", "_parent_id")
VALUES
  ('FAQ', 'Quick answers to the questions we get most often before a project starts.', 'en', 1),
  ('ВОПРОСЫ И ОТВЕТЫ', 'Коротко отвечаем на частые вопросы перед стартом проекта.', 'ru', 1),
  ('שאלות נפוצות', 'תשובות קצרות לשאלות הנפוצות לפני תחילת פרויקט.', 'he', 1)
ON CONFLICT ("_locale", "_parent_id") DO UPDATE SET
  "section_title" = EXCLUDED."section_title",
  "section_subtitle" = EXCLUDED."section_subtitle";

-- Items (stable ids so re-seed is idempotent)
INSERT INTO "faq_section_items" ("_order", "_parent_id", "id")
VALUES
  (1, 1, 'faqitem00000000000000001'),
  (2, 1, 'faqitem00000000000000002'),
  (3, 1, 'faqitem00000000000000003'),
  (4, 1, 'faqitem00000000000000004')
ON CONFLICT ("id") DO UPDATE SET
  "_order" = EXCLUDED."_order",
  "_parent_id" = EXCLUDED."_parent_id";

INSERT INTO "faq_section_items_locales" ("question", "answer", "_locale", "_parent_id")
VALUES
  (
    'How long does it take to launch a project?',
    faq_lexical_from_text('Timeline depends on scope: a landing page usually takes a few weeks, while a CMS site with integrations and motion needs more time. After the brief, we provide a clear roadmap and milestones.'),
    'en', 'faqitem00000000000000001'
  ),
  (
    'Сколько времени занимает запуск проекта?',
    faq_lexical_from_text('Срок зависит от задачи: лендинг обычно занимает несколько недель, а сайт с CMS, интеграциями и анимацией требует больше времени. После брифа мы даем понятный план и этапы.'),
    'ru', 'faqitem00000000000000001'
  ),
  (
    'כמה זמן לוקח להשיק פרויקט?',
    faq_lexical_from_text('משך העבודה תלוי בהיקף: דף נחיתה לוקח בדרך כלל כמה שבועות, ואתר עם CMS, אינטגרציות ואנימציות דורש יותר זמן. אחרי הבריף אנחנו נותנים תוכנית עבודה ברורה ושלבים מסודרים.'),
    'he', 'faqitem00000000000000001'
  ),
  (
    'Do you only handle design, or can you deliver everything end-to-end?',
    faq_lexical_from_text('We can cover the full cycle: strategy, design, development, CMS, baseline SEO, motion, and launch. When needed, we also add branding, AI automation, and ongoing support.'),
    'en', 'faqitem00000000000000002'
  ),
  (
    'Работаете ли вы только с дизайном, или можете сделать все под ключ?',
    faq_lexical_from_text('Мы можем закрыть весь цикл: стратегия, дизайн, разработка, CMS, базовое SEO, анимации и запуск. При необходимости подключаем брендинг, AI-автоматизацию и дальнейшую поддержку.'),
    'ru', 'faqitem00000000000000002'
  ),
  (
    'אתם עובדים רק על עיצוב או גם על ביצוע מלא?',
    faq_lexical_from_text('אנחנו יכולים ללוות את כל התהליך: אסטרטגיה, עיצוב, פיתוח, CMS, SEO בסיסי, אנימציות והשקה. לפי הצורך נוסיף גם מיתוג, אוטומציה מבוססת AI ותמיכה בהמשך.'),
    'he', 'faqitem00000000000000002'
  ),
  (
    'Will we be able to edit the content ourselves later?',
    faq_lexical_from_text('Yes. We build editor-friendly structure and admin tooling, so your team can update copy, imagery, case studies, services, and SEO fields without a developer.'),
    'en', 'faqitem00000000000000003'
  ),
  (
    'Можно ли потом самостоятельно редактировать контент?',
    faq_lexical_from_text('Да. Мы закладываем editor-friendly структуру и админку, чтобы вы могли менять тексты, изображения, кейсы, услуги и SEO-поля без разработчика.'),
    'ru', 'faqitem00000000000000003'
  ),
  (
    'אפשר לערוך את התוכן לבד אחר כך?',
    faq_lexical_from_text('כן. אנחנו בונים מבנה אדיטורי נוח וממשק ניהול שמאפשר לעדכן טקסטים, תמונות, עבודות, שירותים ושדות SEO בלי לפנות למפתח.'),
    'he', 'faqitem00000000000000003'
  ),
  (
    'Do you take AI and automation projects too?',
    faq_lexical_from_text('Yes. In addition to websites, we build AI agents, n8n automations, CRM-connected flows, chat, and voice experiences when they create real business value.'),
    'en', 'faqitem00000000000000004'
  ),
  (
    'Берете ли вы проекты с AI и автоматизацией?',
    faq_lexical_from_text('Да. Мы делаем не только сайты, но и AI-агентов, n8n-автоматизацию, формы, CRM-связки, чат- и voice-сценарии, если это полезно для бизнеса.'),
    'ru', 'faqitem00000000000000004'
  ),
  (
    'אתם עושים גם פרויקטים עם AI ואוטומציה?',
    faq_lexical_from_text('כן. מעבר לאתרים, אנחנו בונים סוכני AI, אוטומציות n8n, חיבורים ל-CRM, תהליכי צ׳אט ו-voice כאשר זה תורם ישירות לעסק.'),
    'he', 'faqitem00000000000000004'
  )
ON CONFLICT ("_locale", "_parent_id") DO UPDATE SET
  "question" = EXCLUDED."question",
  "answer" = EXCLUDED."answer";

SELECT setval(pg_get_serial_sequence('faq_section', 'id'), GREATEST((SELECT MAX(id) FROM faq_section), 1));
