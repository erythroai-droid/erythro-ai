/**
 * Bust production Next/Vercel content cache.
 *
 * Usage:
 *   pnpm revalidate:site
 *   pnpm revalidate:site -- /portfolio/test-project
 */
import './lib/load-env'
import { pingSiteRevalidate } from './lib/ping-revalidate'

const extra = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
const paths = extra.length ? extra : ['/', '/portfolio']

pingSiteRevalidate(paths)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
