import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  getAuditAgentBaseUrl,
  triggerAuditAgent,
} from '@/lib/auditAgentTrigger'

describe('auditAgentTrigger', () => {
  const originalFetch = globalThis.fetch
  const env = process.env

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...env }
    delete process.env.AUDIT_AGENT_URL
    delete process.env.AGENT_SECRET_TOKEN
    delete process.env.AUDIT_AGENT_TIMEOUT_MS
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    process.env = env
  })

  it('defaults agent base URL', () => {
    expect(getAuditAgentBaseUrl()).toBe('https://agent-api.erythro.ai')
  })

  it('skips when secret missing', async () => {
    const result = await triggerAuditAgent({
      submissionId: 1,
      targetUrl: 'https://example.com',
    })
    expect(result).toEqual({ ok: false, reason: 'missing_agent_secret' })
  })

  it('POSTs to worker with secret header', async () => {
    process.env.AGENT_SECRET_TOKEN = 'test-secret'
    process.env.AUDIT_AGENT_URL = 'https://agent-api.example.test'

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
      text: async () => '',
    })
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const result = await triggerAuditAgent({
      submissionId: 42,
      targetUrl: 'https://shop.example',
      locale: 'ru',
      planSlug: 'audit-free',
    })

    expect(result).toEqual({ ok: true, status: 202 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://agent-api.example.test/api/run-audit')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['X-Agent-Secret-Key']).toBe(
      'test-secret',
    )
    expect(JSON.parse(String(init.body))).toEqual({
      submissionId: 42,
      targetUrl: 'https://shop.example',
      locale: 'ru',
      planSlug: 'audit-free',
    })
  })
})
