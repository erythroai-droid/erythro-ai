import { describe, expect, it } from 'vitest'
import { buildAcpDiscoveryDocument, buildApiCatalogLinkset, buildOpenApiDocument } from '@/lib/agentDiscovery'
import { GET as getAcpJson, HEAD as headAcpJson } from '@/app/.well-known/acp.json/route'
import { GET as getAcp } from '@/app/.well-known/acp/route'

describe('ACP Discovery Document', () => {
  it('builds a valid ACP discovery document conforming to the spec', () => {
    const doc = buildAcpDiscoveryDocument()

    // 1. protocol.name === 'acp' and protocol.version is defined
    expect(doc.protocol).toBeDefined()
    expect(doc.protocol.name).toBe('acp')
    expect(typeof doc.protocol.version).toBe('string')
    expect(doc.protocol.version.length).toBeGreaterThan(0)

    // 2. api_base_url is an absolute HTTP(S) URL
    expect(doc.api_base_url).toBeDefined()
    expect(doc.api_base_url).toMatch(/^https?:\/\//)

    // 3. transports is a non-empty array
    expect(Array.isArray(doc.transports)).toBe(true)
    expect(doc.transports.length).toBeGreaterThan(0)

    // 4. capabilities.services is a non-empty array
    expect(doc.capabilities).toBeDefined()
    expect(Array.isArray(doc.capabilities.services)).toBe(true)
    expect(doc.capabilities.services.length).toBeGreaterThan(0)
    expect(doc.capabilities.services).toContain('catalog')
  })

  it('serves HTTP 200 with application/json at /.well-known/acp.json', async () => {
    const res = getAcpJson()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/json')

    const body = await res.json()
    expect(body.protocol.name).toBe('acp')
    expect(body.protocol.version).toBeDefined()
    expect(body.api_base_url).toMatch(/^https?:\/\//)
    expect(Array.isArray(body.transports)).toBe(true)
    expect(body.transports.length).toBeGreaterThan(0)
    expect(Array.isArray(body.capabilities.services)).toBe(true)
    expect(body.capabilities.services.length).toBeGreaterThan(0)
  })

  it('supports HEAD request at /.well-known/acp.json', () => {
    const res = headAcpJson()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/json')
  })

  it('serves HTTP 200 with matching schema at /.well-known/acp alias', async () => {
    const res = getAcp()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/json')

    const body = await res.json()
    expect(body.protocol.name).toBe('acp')
    expect(body.api_base_url).toBeDefined()
  })

  it('includes ACP discovery in RFC 9264 api-catalog linkset and OpenAPI document', () => {
    const linkset = buildApiCatalogLinkset()
    const items = linkset.linkset[0].item
    const hasAcpItem = items.some((item) => item.href.endsWith('/.well-known/acp.json'))
    expect(hasAcpItem).toBe(true)

    const openApi = buildOpenApiDocument()
    expect(openApi.paths['/.well-known/acp.json']).toBeDefined()
  })
})
