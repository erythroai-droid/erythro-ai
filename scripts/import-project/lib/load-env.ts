import { config as loadEnv } from 'dotenv'

const envFileArg = process.argv.find((arg) => arg.startsWith('--env-file='))

loadEnv({ path: '.env.production.local' })
loadEnv()
if (envFileArg) {
  loadEnv({ path: envFileArg.slice('--env-file='.length), override: true })
}

// Scripts must not hang on Drizzle "Accept warnings and push schema?" against prod.
process.env.PAYLOAD_DISABLE_PUSH = '1'
