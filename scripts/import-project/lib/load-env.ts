import fs from 'node:fs'
import { config as loadEnv, parse as parseEnv } from 'dotenv'

/**
 * Vercel CLI writes the literal `[SENSITIVE]` for Production secrets it cannot
 * pull (PIT-111). dotenv will not override that with a later file, and pg then
 * tries to resolve the hostname "base". Fill those keys from `.env`, then
 * `.env.local`, and drop any placeholder that is still left.
 */
const PLACEHOLDER = '[SENSITIVE]'

const envFileArg = process.argv.find((arg) => arg.startsWith('--env-file='))

loadEnv({ path: '.env.production.local' })
loadEnv()
loadEnv({ path: '.env.local' })
if (envFileArg) {
  loadEnv({ path: envFileArg.slice('--env-file='.length), override: true })
}

function readEnvFile(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {}
  return parseEnv(fs.readFileSync(file))
}

function usable(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (value.includes(PLACEHOLDER)) return undefined
  return value
}

const fromEnv = readEnvFile('.env')
const fromLocal = readEnvFile('.env.local')

for (const [key, value] of Object.entries(process.env)) {
  if (typeof value !== 'string' || !value.includes(PLACEHOLDER)) continue
  const replacement = usable(fromEnv[key]) ?? usable(fromLocal[key])
  if (replacement) process.env[key] = replacement
  else delete process.env[key]
}

// Scripts must not hang on Drizzle "Accept warnings and push schema?" against prod.
process.env.PAYLOAD_DISABLE_PUSH = '1'
