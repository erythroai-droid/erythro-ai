import * as migration_20260726_120000_add_portfolio_hero_media_mobile from './20260726_120000_add_portfolio_hero_media_mobile'
import * as migration_20260727_103500_add_site_settings_page_heroes from './20260727_103500_add_site_settings_page_heroes'
import * as migration_20260728_120000_portfolio_categories from './20260728_120000_portfolio_categories'
import * as migration_20260729_013500_fix_locked_docs_portfolio_categories from './20260729_013500_fix_locked_docs_portfolio_categories'
import * as migration_20260729_120000_add_legal_pages_globals from './20260729_120000_add_legal_pages_globals'
import * as migration_20260731_120000_legal_statement_date from './20260731_120000_legal_statement_date'
import * as migration_20260801_120000_solution_plan_order_fields from './20260801_120000_solution_plan_order_fields'
import * as migration_20260802_120000_solution_feature_full_richtext from './20260802_120000_solution_feature_full_richtext'
import * as migration_20260802_140000_solution_plan_includes from './20260802_140000_solution_plan_includes'
import * as migration_20260803_120000_addon_term_discounts from './20260803_120000_addon_term_discounts'
import * as migration_20260803_130000_fix_addon_discount_columns from './20260803_130000_fix_addon_discount_columns'
import * as migration_20260804_120000_feature_home_only from './20260804_120000_feature_home_only'
import * as migration_20260804_210000_addon_full_description from './20260804_210000_addon_full_description'
import * as migration_20260805_010000_addon_price_text from './20260805_010000_addon_price_text'
import * as migration_20260805_020000_addon_price_localized from './20260805_020000_addon_price_localized'
import * as migration_20260805_030000_addon_price_display_rename from './20260805_030000_addon_price_display_rename'
import * as migration_20260807_010000_header_nav_children from './20260807_010000_header_nav_children'
import * as migration_20260808_010000_header_nav_description from './20260808_010000_header_nav_description'
import * as migration_20260808_020000_site_settings_seo_title_localized from './20260808_020000_site_settings_seo_title_localized'

export const migrations = [
  {
    up: migration_20260726_120000_add_portfolio_hero_media_mobile.up,
    down: migration_20260726_120000_add_portfolio_hero_media_mobile.down,
    name: '20260726_120000_add_portfolio_hero_media_mobile',
  },
  {
    up: migration_20260727_103500_add_site_settings_page_heroes.up,
    down: migration_20260727_103500_add_site_settings_page_heroes.down,
    name: '20260727_103500_add_site_settings_page_heroes',
  },
  {
    up: migration_20260728_120000_portfolio_categories.up,
    down: migration_20260728_120000_portfolio_categories.down,
    name: '20260728_120000_portfolio_categories',
  },
  {
    up: migration_20260729_013500_fix_locked_docs_portfolio_categories.up,
    down: migration_20260729_013500_fix_locked_docs_portfolio_categories.down,
    name: '20260729_013500_fix_locked_docs_portfolio_categories',
  },
  {
    up: migration_20260729_120000_add_legal_pages_globals.up,
    down: migration_20260729_120000_add_legal_pages_globals.down,
    name: '20260729_120000_add_legal_pages_globals',
  },
  {
    up: migration_20260731_120000_legal_statement_date.up,
    down: migration_20260731_120000_legal_statement_date.down,
    name: '20260731_120000_legal_statement_date',
  },
  {
    up: migration_20260801_120000_solution_plan_order_fields.up,
    down: migration_20260801_120000_solution_plan_order_fields.down,
    name: '20260801_120000_solution_plan_order_fields',
  },
  {
    up: migration_20260802_120000_solution_feature_full_richtext.up,
    down: migration_20260802_120000_solution_feature_full_richtext.down,
    name: '20260802_120000_solution_feature_full_richtext',
  },
  {
    up: migration_20260802_140000_solution_plan_includes.up,
    down: migration_20260802_140000_solution_plan_includes.down,
    name: '20260802_140000_solution_plan_includes',
  },
  {
    up: migration_20260803_120000_addon_term_discounts.up,
    down: migration_20260803_120000_addon_term_discounts.down,
    name: '20260803_120000_addon_term_discounts',
  },
  {
    up: migration_20260803_130000_fix_addon_discount_columns.up,
    down: migration_20260803_130000_fix_addon_discount_columns.down,
    name: '20260803_130000_fix_addon_discount_columns',
  },
  {
    up: migration_20260804_120000_feature_home_only.up,
    down: migration_20260804_120000_feature_home_only.down,
    name: '20260804_120000_feature_home_only',
  },
  {
    up: migration_20260804_210000_addon_full_description.up,
    down: migration_20260804_210000_addon_full_description.down,
    name: '20260804_210000_addon_full_description',
  },
  {
    up: migration_20260805_010000_addon_price_text.up,
    down: migration_20260805_010000_addon_price_text.down,
    name: '20260805_010000_addon_price_text',
  },
  {
    up: migration_20260805_020000_addon_price_localized.up,
    down: migration_20260805_020000_addon_price_localized.down,
    name: '20260805_020000_addon_price_localized',
  },
  {
    up: migration_20260805_030000_addon_price_display_rename.up,
    down: migration_20260805_030000_addon_price_display_rename.down,
    name: '20260805_030000_addon_price_display_rename',
  },
  {
    up: migration_20260807_010000_header_nav_children.up,
    down: migration_20260807_010000_header_nav_children.down,
    name: '20260807_010000_header_nav_children',
  },
  {
    up: migration_20260808_010000_header_nav_description.up,
    down: migration_20260808_010000_header_nav_description.down,
    name: '20260808_010000_header_nav_description',
  },
  {
    up: migration_20260808_020000_site_settings_seo_title_localized.up,
    down: migration_20260808_020000_site_settings_seo_title_localized.down,
    name: '20260808_020000_site_settings_seo_title_localized',
  },
]
