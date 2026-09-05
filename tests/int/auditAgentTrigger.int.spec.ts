import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/checkWebsite', () => ({
  checkWebsiteReachable: vi.fn(async () => ({ ok: true, hostname: 'shop.example' })),
}))

import {
  getAuditAgentBaseUrl,
  triggerAuditAgent,
} from '@/lib/auditAgentTrigger'
import { checkWebsiteReachable } from '@/lib/checkWebsite'
import { AGENT_SECRET_HEADER, AGENT_SIGNATURE_HEADER } from '@/lib/agentAuth'

describe('auditAgentTrigger', () => {
  const originalFetch = globalThis.fetch
  const env = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...env }
    delete process.env.AUDIT_AGENT_URL
    delete process.env.AGENT_SECRET_TOKEN
    delete process.env.AUDIT_AGENT_TIMEOUT_MS
    vi.mocked(checkWebsiteReachable).mockResolvedValue({
      ok: true,
      hostname: 'shop.example',
    })
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

  it('blocks when SSRF/DNS check fails', async () => {
    process.env.AGENT_SECRET_TOKEN = 'test-secret'
    vi.mocked(checkWebsiteReachable).mockResolvedValue({
      ok: false,
      reason: 'dns',
    })

    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const result = await triggerAuditAgent({
      submissionId: 1,
      targetUrl: 'https://shop.example',
    })

    expect(result).toEqual({ ok: false, reason: 'ssrf_dns' })
    expect(fetchMock).not.toHaveBeenCalled()
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
    expect(checkWebsiteReachable).toHaveBeenCalledWith('https://shop.example')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://agent-api.example.test/api/run-audit')
    expect(init.method).toBe('POST')
    const headers = init.headers as Record<string, string>
    expect(headers[AGENT_SECRET_HEADER]).toBe('test-secret')
    expect(headers[AGENT_SIGNATURE_HEADER]).toMatch(/^[a-f0-9]{64}$/)
    expect(JSON.parse(String(init.body))).toEqual({
      submissionId: 42,
      targetUrl: 'https://shop.example',
      locale: 'ru',
      planSlug: 'audit-free',
    })
  })
})
