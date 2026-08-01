import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim())

describe.skipIf(!hasDatabase)('API', () => {
  let payload: Payload

  beforeAll(async () => {
    try {
      const payloadConfig = await config
      payload = await getPayload({ config: payloadConfig })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(
        `Failed to init Payload against DATABASE_URL. ` +
          `Check GitHub secret DATABASE_URL (password, host, ?sslmode=require). ` +
          `Original error: ${message}`,
        { cause: err },
      )
    }
  }, 90_000)

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })
})
