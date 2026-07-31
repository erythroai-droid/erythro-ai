import * as migration_20260726_120000_add_portfolio_hero_media_mobile from './20260726_120000_add_portfolio_hero_media_mobile'
import * as migration_20260727_103500_add_site_settings_page_heroes from './20260727_103500_add_site_settings_page_heroes'
import * as migration_20260728_120000_portfolio_categories from './20260728_120000_portfolio_categories'
import * as migration_20260729_013500_fix_locked_docs_portfolio_categories from './20260729_013500_fix_locked_docs_portfolio_categories'
import * as migration_20260729_120000_add_legal_pages_globals from './20260729_120000_add_legal_pages_globals'
import * as migration_20260731_120000_legal_statement_date from './20260731_120000_legal_statement_date'

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
]
