/**
 * Agent discovery links (RFC 8288 / RFC 9727).
 * Used for homepage `Link` headers and `/.well-known/api-catalog`.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

export const API_CATALOG_PROFILE = 'https://www.rfc-editor.org/info/rfc9727'

/** Comma-separated Link header value for the homepage (RFC 8288). */
export const HOMEPAGE_LINK_HEADER = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</openapi.json>; rel="service-desc"; type="application/json"',
  '</llms.txt>; rel="service-doc"; type="text/plain"',
  '</llms.txt>; rel="describedby"; type="text/plain"',
].join(', ')

/** RFC 9264 linkset body for GET /.well-known/api-catalog */
export function buildApiCatalogLinkset() {
  return {
    linkset: [
      {
        anchor: `${SITE_URL}/api/mcp`,
        'service-desc': [
          {
            href: `${SITE_URL}/openapi.json`,
            type: 'application/json',
          },
        ],
        'service-doc': [
          {
            href: `${SITE_URL}/llms.txt`,
            type: 'text/plain',
          },
        ],
        describedby: [
          {
            href: `${SITE_URL}/llms.txt`,
            type: 'text/plain',
          },
        ],
        item: [
          {
            href: `${SITE_URL}/.well-known/mcp`,
            type: 'application/json',
          },
          {
            href: `${SITE_URL}/.well-known/acp.json`,
            type: 'application/json',
          },
        ],
      },
    ],
  }
}

/**
 * Agentic Commerce Protocol (ACP) discovery document.
 * Served at `/.well-known/acp.json` (and `/.well-known/acp`).
 * https://agenticcommerce.dev
 */
export function buildAcpDiscoveryDocument() {
  return {
    protocol: {
      name: 'acp',
      version: '2025-01',
      supported_versions: ['2025-01', '1.0.0', '0.1'],
    },
    api_base_url: `${SITE_URL}/api/acp`,
    transports: ['http', 'rest', 'mcp'],
    capabilities: {
      services: [
        'catalog',
        'checkout',
        'orders',
        'delegate_payment',
      ],
      extensions: [
        'currency_conversion',
        'localized_content',
      ],
    },
    merchant: {
      name: 'Erythro.ai',
      url: SITE_URL,
      contact: {
        email: 'order@erythro.ai',
        phone: '+972 50 530 83 05',
      },
    },
    endpoints: {
      catalog: `${SITE_URL}/order`,
      contact: `${SITE_URL}/contacts`,
      mcp: `${SITE_URL}/api/mcp`,
    },
    documentation_url: `${SITE_URL}/llms.txt`,
  }
}

/** Minimal OpenAPI 3 description of the public brand facts API. */
export function buildOpenApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Erythro.ai Brand API',
      version: '1.0.0',
      description:
        'Read-only brand facts for AI agents and MCP clients. Canonical human/LLM docs: /llms.txt',
      contact: {
        name: 'Erythro.ai',
        url: SITE_URL,
        email: 'order@erythro.ai',
      },
    },
    servers: [{ url: SITE_URL }],
    paths: {
      '/api/mcp': {
        get: {
          summary: 'Brand facts',
          description: 'Returns canonical company profile fields for agents.',
          operationId: 'getBrandFacts',
          responses: {
            '200': {
              description: 'Brand facts JSON',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      url: { type: 'string', format: 'uri' },
                      description: { type: 'string' },
                      location: { type: 'string' },
                      email: { type: 'string' },
                      phone: { type: 'string' },
                      services: {
                        type: 'array',
                        items: { type: 'string' },
                      },
                      sameAs: {
                        type: 'array',
                        items: { type: 'string', format: 'uri' },
                      },
                      canonicalPages: { type: 'object' },
                      correctionContact: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/.well-known/mcp': {
        get: {
          summary: 'MCP discovery manifest',
          description: 'SEP-1960-style MCP discovery metadata.',
          operationId: 'getMcpDiscovery',
          responses: {
            '200': {
              description: 'MCP discovery JSON',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },
      '/.well-known/acp.json': {
        get: {
          summary: 'ACP discovery document',
          description: 'Agentic Commerce Protocol (ACP) discovery metadata.',
          operationId: 'getAcpDiscovery',
          responses: {
            '200': {
              description: 'ACP discovery JSON',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
  }
}
