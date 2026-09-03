import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  readTurnstileToken,
  TURNSTILE_SITEVERIFY_URL,
  TURNSTILE_TOKEN_FIELD,
  turnstileActionFromBody,
  verifyTurnstileToken,
} from '@/lib/turnstile'

describe('readTurnstileToken / turnstileActionFromBody', () => {
  it('reads the canonical token field', () => {
    expect(readTurnstileToken({ [TURNSTILE_TOKEN_FIELD]: '  tok  ' })).toBe('tok')
    expect(readTurnstileToken({ [TURNSTILE_TOKEN_FIELD]: 1 })).toBe('')
    expect(readTurnstileToken(null)).toBe('')
  })

  it('maps source to a Turnstile action', () => {
    expect(turnstileActionFromBody({ source: 'audit' })).toBe('audit')
    expect(turnstileActionFromBody({ source: 'order' })).toBe('order')
    expect(turnstileActionFromBody({ source: 'contact' })).toBe('contact')
    expect(turnstileActionFromBody({ source: 'other' })).toBe('contact')
    expect(turnstileActionFromBody(null)).toBe('contact')
  })
})

describe('verifyTurnstileToken', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('skips siteverify in non-production when no secret is set', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('TURNSTILE_SECRET', '')
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await verifyTurnstileToken({ token: '', action: 'contact' })
    expect(result.ok).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails closed in production when secret is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('TURNSTILE_SECRET', '')
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')

    const result = await verifyTurnstileToken({ token: 'tok', action: 'contact' })
    expect(result).toEqual({ ok: false, status: 403, message: 'Verification failed' })
  })

  it('rejects empty or oversized tokens', async () => {
    vi.stubEnv('TURNSTILE_SECRET', 'test-secret')
    vi.stubEnv('TURNSTILE_HOSTNAMES', 'localhost')

    expect(await verifyTurnstileToken({ token: '', action: 'contact' })).toMatchObject({
      ok: false,
      status: 403,
    })
    expect(
      await verifyTurnstileToken({ token: 'x'.repeat(2049), action: 'contact' }),
    ).toMatchObject({ ok: false, status: 403 })
  })

  it('accepts success with matching action and hostname', async () => {
    vi.stubEnv('TURNSTILE_SECRET', 'test-secret')
    vi.stubEnv('TURNSTILE_HOSTNAMES', 'localhost')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, action: 'audit', hostname: 'localhost' }),
      }),
    )

    const result = await verifyTurnstileToken({ token: 'tok', action: 'audit', remoteip: '1.1.1.1' })
    expect(result.ok).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      TURNSTILE_SITEVERIFY_URL,
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('rejects action or hostname mismatch', async () => {
    vi.stubEnv('TURNSTILE_SECRET', 'test-secret')
    vi.stubEnv('TURNSTILE_HOSTNAMES', 'localhost')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, action: 'contact', hostname: 'evil.example' }),
      }),
    )

    const result = await verifyTurnstileToken({ token: 'tok', action: 'contact' })
    expect(result).toEqual({ ok: false, status: 403, message: 'Verification failed' })
  })
})
