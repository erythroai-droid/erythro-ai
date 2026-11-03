import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkLabAccess, isPaidAuditCheckoutSlug } from '@/lib/auditLabAccess'

describe('isPaidAuditCheckoutSlug (PIT-150)', () => {
  it('checks Diagnostic, Pro and promo plans', () => {
    expect(isPaidAuditCheckoutSlug('audit-diagnostic')).toBe(true)
    expect(isPaidAuditCheckoutSlug('audit-pro')).toBe(true)
    expect(isPaidAuditCheckoutSlug('audit-pro-ads')).toBe(true)
  })
  it('skips Free, the manual contact plan and non-audit plans', () => {
    expect(isPaidAuditCheckoutSlug('audit-free')).toBe(false)
    expect(isPaidAuditCheckoutSlug('audit-manual')).toBe(false)
    expect(isPaidAuditCheckoutSlug('web-landing')).toBe(false)
    expect(isPaidAuditCheckoutSlug('')).toBe(false)
    expect(isPaidAuditCheckoutSlug(undefined)).toBe(false)
  })
})

describe('checkLabAccess (PIT-150)', () => {
  const env = { ...process.env }
  afterEach(() => {
    process.env = { ...env }
    vi.unstubAllGlobals()
  })

  it('reports a blocked site from the worker answer', async () => {
    process.env.AGENT_SECRET_TOKEN = 'test-secret'
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ blocked: true, protection: 'AWS WAF', status: 'HTTP 202' }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const res = await checkLabAccess('https://shirielectric.co.il')
    expect(res).toEqual({ checked: true, blocked: true, protection: 'AWS WAF', status: 'HTTP 202' })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toMatch(/\/api\/check-access$/)
    expect((init.headers as Record<string, string>)['x-agent-secret-key']).toBe('test-secret')
  })

  it('reports an open site', async () => {
    process.env.AGENT_SECRET_TOKEN = 'test-secret'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ blocked: false }), { status: 200 })))
    expect(await checkLabAccess('https://erythro.ai')).toEqual({ checked: true, blocked: false })
  })

  it('does not decide when the worker does not answer', async () => {
    process.env.AGENT_SECRET_TOKEN = 'test-secret'
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not found', { status: 404 })))
    expect(await checkLabAccess('https://erythro.ai')).toEqual({ checked: false, reason: 'http_404' })
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down') }))
    expect(await checkLabAccess('https://erythro.ai')).toEqual({ checked: false, reason: 'network_error' })
  })

  it('does not call the worker without a secret', async () => {
    delete process.env.AGENT_SECRET_TOKEN
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await checkLabAccess('https://erythro.ai')).toEqual({ checked: false, reason: 'missing_agent_secret' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
