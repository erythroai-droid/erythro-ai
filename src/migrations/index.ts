import * as migration_20260726_120000_add_portfolio_hero_media_mobile from './20260726_120000_add_portfolio_hero_media_mobile'
import * as migration_20260727_103500_add_site_settings_page_heroes from './20260727_103500_add_site_settings_page_heroes'

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
]
