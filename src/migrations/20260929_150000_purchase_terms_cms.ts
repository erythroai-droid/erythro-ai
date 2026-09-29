import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Footer purchase-terms notice (homepage + order form) and the paid-audit
 * paragraph on legal terms section 7. Both are editable in Payload admin.
 * Seed only fills empty footer copy and appends section 7 when the marker is absent.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_lock(202609291500)`)

  try {
    await db.execute(sql`
      ALTER TABLE "footer_locales"
      ADD COLUMN IF NOT EXISTS "purchase_terms_notice" varchar;
    `)

    await db.execute(sql`
      UPDATE "footer_locales"
      SET "purchase_terms_notice" = $notice_en$Erythro.ai, Eilat, Israel. A purchase on this site is a digital service for customers aged 18 or older. Delivery is by email, usually within a few business days, and nothing is shipped. You may cancel before the report is sent by writing to us. After it is sent, cancellation and any refund follow the Consumer Protection Law where it applies. Erythro.ai and its representatives are not liable for direct or indirect damage from use of a product bought on this site, except liability that Israeli law does not allow to be excluded.$notice_en$
      WHERE "_locale"::text = 'en'
        AND ("purchase_terms_notice" IS NULL OR btrim("purchase_terms_notice") = '');
    `)

    await db.execute(sql`
      UPDATE "footer_locales"
      SET "purchase_terms_notice" = $notice_ru$Erythro.ai, Эйлат, Израиль. Покупка на этом сайте — цифровая услуга для покупателей от 18 лет. Доставка по email, обычно в течение нескольких рабочих дней, без физической отправки. Отменить заказ можно до отправки отчёта, написав нам. После отправки отмена и возврат идут по Закону о защите прав потребителей, где он применяется. Erythro.ai и его представители не отвечают за прямой или косвенный ущерб от использования купленного на сайте продукта, кроме ответственности, которую израильское право не позволяет исключить.$notice_ru$
      WHERE "_locale"::text = 'ru'
        AND ("purchase_terms_notice" IS NULL OR btrim("purchase_terms_notice") = '');
    `)

    await db.execute(sql`
      UPDATE "footer_locales"
      SET "purchase_terms_notice" = $notice_he$Erythro.ai, אילת, ישראל. רכישה באתר זה היא שירות דיגיטלי ללקוחות בני 18 ומעלה. האספקה נעשית בדוא״ל, בדרך כלל בתוך כמה ימי עסקים, ואין משלוח פיזי. ניתן לבטל את העסקה לפני שליחת הדוח בפנייה אלינו. לאחר השליחה, ביטול והחזר כפופים לחוק הגנת הצרכן ככל שהוא חל. Erythro.ai ונציגיו אינם אחראים לנזק ישיר או עקיף הנובע משימוש במוצר שנרכש באתר, למעט אחריות שהדין הישראלי אינו מתיר לשלול.$notice_he$
      WHERE "_locale"::text = 'he'
        AND ("purchase_terms_notice" IS NULL OR btrim("purchase_terms_notice") = '');
    `)

    await db.execute(sql`
      UPDATE "legal_terms_sections_locales"
      SET "paragraphs" = "paragraphs" || E'\n' || $terms_en$A paid audit ordered on this site is a digital service for customers aged 18 or older. After the payment provider confirms the charge, we prepare the report and send it to the email address you entered. Delivery is electronic only, usually within a few business days; nothing is shipped. You may cancel before the report is sent by writing to the contact address on this page. After the report has been sent, cancellation and any refund follow the Consumer Protection Law where it applies, and a captured charge is refunded through the payment provider when the law or our written confirmation requires it. Personal data from the order is handled as described in the Privacy Policy on this site. Erythro.ai and its representatives are not liable for direct or indirect damage from use of a report or other product bought on this site, except liability that Israeli law does not allow to be excluded.$terms_en$
      WHERE "_locale"::text = 'en'
        AND "heading" LIKE '7.%'
        AND "paragraphs" IS NOT NULL
        AND btrim("paragraphs") <> ''
        AND position('A paid audit ordered on this site is a dig' IN "paragraphs") = 0;
    `)

    await db.execute(sql`
      UPDATE "legal_terms_sections_locales"
      SET "paragraphs" = "paragraphs" || E'\n' || $terms_ru$Платный аудит, заказанный на этом сайте, — цифровая услуга для покупателей от 18 лет. После подтверждения списания платёжным провайдером мы готовим отчёт и отправляем его на указанный email. Доставка только электронная, обычно в течение нескольких рабочих дней; ничего не отправляется по почте. Отменить заказ можно до отправки отчёта, написав на контактный адрес на этой странице. После отправки отчёта отмена и возврат идут по Закону о защите прав потребителей, где он применяется, а уже проведённое списание возвращается через платёжного провайдера, если этого требует закон или наше письменное подтверждение. Персональные данные заказа обрабатываются, как описано в Политике конфиденциальности на этом сайте. Erythro.ai и его представители не отвечают за прямой или косвенный ущерб от использования отчёта или другого продукта, купленного на сайте, кроме ответственности, которую израильское право не позволяет исключить.$terms_ru$
      WHERE "_locale"::text = 'ru'
        AND "heading" LIKE '7.%'
        AND "paragraphs" IS NOT NULL
        AND btrim("paragraphs") <> ''
        AND position('Платный аудит, заказанный на этом сайте' IN "paragraphs") = 0;
    `)

    await db.execute(sql`
      UPDATE "legal_terms_sections_locales"
      SET "paragraphs" = "paragraphs" || E'\n' || $terms_he$ביקורת בתשלום שמוזמנת באתר זה היא שירות דיגיטלי ללקוחות בני 18 ומעלה. לאחר שהסולק מאשר את החיוב, אנו מכינים את הדוח ושולחים אותו לכתובת הדוא״ל שהוזנה. האספקה אלקטרונית בלבד, בדרך כלל בתוך כמה ימי עסקים; אין משלוח פיזי. ניתן לבטל לפני שליחת הדוח באמצעות פנייה לכתובת הקשר בעמוד זה. לאחר שליחת הדוח, ביטול והחזר כפופים לחוק הגנת הצרכן ככל שהוא חל, וחיוב שכבר נסלק יוחזר דרך סולק התשלומים כאשר הדין או אישורנו בכתב מחייבים זאת. מידע אישי מההזמנה מטופל כמתואר במדיניות הפרטיות באתר. Erythro.ai ונציגיו אינם אחראים לנזק ישיר או עקיף הנובע משימוש בדוח או במוצר אחר שנרכש באתר, למעט אחריות שהדין הישראלי אינו מתיר לשלול.$terms_he$
      WHERE "_locale"::text = 'he'
        AND "heading" LIKE '7.%'
        AND "paragraphs" IS NOT NULL
        AND btrim("paragraphs") <> ''
        AND position('ביקורת בתשלום שמוזמנת באתר זה' IN "paragraphs") = 0;
    `)

    await db.execute(sql`
      UPDATE "legal_terms"
      SET "statement_date" = '2026-09-29'
      WHERE "statement_date" IS NULL OR btrim("statement_date") = '';
    `)
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(202609291500)`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "legal_terms_sections_locales"
    SET "paragraphs" = left(
      "paragraphs",
      length("paragraphs") - length(E'\n' || $terms_en$A paid audit ordered on this site is a digital service for customers aged 18 or older. After the payment provider confirms the charge, we prepare the report and send it to the email address you entered. Delivery is electronic only, usually within a few business days; nothing is shipped. You may cancel before the report is sent by writing to the contact address on this page. After the report has been sent, cancellation and any refund follow the Consumer Protection Law where it applies, and a captured charge is refunded through the payment provider when the law or our written confirmation requires it. Personal data from the order is handled as described in the Privacy Policy on this site. Erythro.ai and its representatives are not liable for direct or indirect damage from use of a report or other product bought on this site, except liability that Israeli law does not allow to be excluded.$terms_en$)
    )
    WHERE "_locale"::text = 'en'
      AND right("paragraphs", length($terms_en$A paid audit ordered on this site is a digital service for customers aged 18 or older. After the payment provider confirms the charge, we prepare the report and send it to the email address you entered. Delivery is electronic only, usually within a few business days; nothing is shipped. You may cancel before the report is sent by writing to the contact address on this page. After the report has been sent, cancellation and any refund follow the Consumer Protection Law where it applies, and a captured charge is refunded through the payment provider when the law or our written confirmation requires it. Personal data from the order is handled as described in the Privacy Policy on this site. Erythro.ai and its representatives are not liable for direct or indirect damage from use of a report or other product bought on this site, except liability that Israeli law does not allow to be excluded.$terms_en$))
        = $terms_en$A paid audit ordered on this site is a digital service for customers aged 18 or older. After the payment provider confirms the charge, we prepare the report and send it to the email address you entered. Delivery is electronic only, usually within a few business days; nothing is shipped. You may cancel before the report is sent by writing to the contact address on this page. After the report has been sent, cancellation and any refund follow the Consumer Protection Law where it applies, and a captured charge is refunded through the payment provider when the law or our written confirmation requires it. Personal data from the order is handled as described in the Privacy Policy on this site. Erythro.ai and its representatives are not liable for direct or indirect damage from use of a report or other product bought on this site, except liability that Israeli law does not allow to be excluded.$terms_en$;
  `)

  await db.execute(sql`
    ALTER TABLE "footer_locales"
    DROP COLUMN IF EXISTS "purchase_terms_notice";
  `)
}
