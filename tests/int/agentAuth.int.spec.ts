import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  AGENT_SECRET_HEADER,
  bearerToken,
  reconcileRequestAuthorized,
} from '@/lib/agentAuth'

describe('reconcileRequestAuthorized', () => {
  const env = process.env

  beforeEach(() => {
    process.env = { ...env }
    process.env.AGENT_SECRET_TOKEN = 'agent-secret'
    delete process.env.CRON_SECRET
  })

  afterEach(() => {
    process.env = env
  })

  it('accepts the agent secret header', () => {
    const headers = new Headers({ [AGENT_SECRET_HEADER]: 'agent-secret' })
    expect(reconcileRequestAuthorized(headers)).toBe(true)
  })

  it('accepts Authorization Bearer matching CRON_SECRET', () => {
    process.env.CRON_SECRET = 'cron-secret'
    const headers = new Headers({ authorization: 'Bearer cron-secret' })
    expect(reconcileRequestAuthorized(headers)).toBe(true)
  })

  it('accepts Authorization Bearer matching AGENT_SECRET_TOKEN', () => {
    const headers = new Headers({ authorization: 'Bearer agent-secret' })
    expect(reconcileRequestAuthorized(headers)).toBe(true)
  })

  it('rejects missing or wrong credentials', () => {
    expect(reconcileRequestAuthorized(new Headers())).toBe(false)
    expect(reconcileRequestAuthorized(new Headers({ authorization: 'Bearer nope' }))).toBe(false)
  })
})

describe('bearerToken', () => {
  it('parses Bearer tokens', () => {
    expect(bearerToken('Bearer abc')).toBe('abc')
    expect(bearerToken('bearer xyz')).toBe('xyz')
    expect(bearerToken('Basic abc')).toBeNull()
    expect(bearerToken(null)).toBeNull()
  })
})
