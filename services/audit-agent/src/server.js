import http from 'node:http'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { config as loadEnv } from 'dotenv'
import { runAuditJob } from './runAudit.js'
import { assertPublicHttpUrl } from './ssrf.js'

loadEnv()

const PORT = Number(process.env.PORT || 8080)
const AGENT_SECRET = process.env.AGENT_SECRET_TOKEN?.trim() || ''
const REQUIRE_HMAC = process.env.AGENT_REQUIRE_HMAC === '1'

function timingSafeStringEqual(a, b) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function send(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

function unauthorized(res) {
  send(res, 401, { error: 'unauthorized' })
}

function checkSecret(req) {
  if (!AGENT_SECRET) return false
  const header = req.headers['x-agent-secret-key']
  return typeof header === 'string' && timingSafeStringEqual(header, AGENT_SECRET)
}

function checkSignature(rawBody, req) {
  const header = req.headers['x-agent-signature']
  if (typeof header !== 'string' || !header.trim()) return false
  const expected = createHmac('sha256', AGENT_SECRET).update(rawBody).digest('hex')
  const provided = header.trim().toLowerCase().replace(/^sha256=/i, '')
  return timingSafeStringEqual(provided, expected)
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

  if (req.method === 'GET' && url.pathname === '/health') {
    send(res, 200, { ok: true, service: 'audit-agent' })
    return
  }

  if (req.method === 'POST' && url.pathname === '/api/run-audit') {
    if (!checkSecret(req)) {
      unauthorized(res)
      return
    }

    let rawBody
    try {
      rawBody = await readRawBody(req)
    } catch {
      send(res, 400, { error: 'invalid_body' })
      return
    }

    const hasSig = typeof req.headers['x-agent-signature'] === 'string'
    if ((REQUIRE_HMAC || hasSig) && !checkSignature(rawBody, req)) {
      unauthorized(res)
      return
    }

    let body
    try {
      body = rawBody.length ? JSON.parse(rawBody.toString('utf8')) : {}
    } catch {
      send(res, 400, { error: 'invalid_json' })
      return
    }

    const submissionId = body.submissionId
    const targetUrl = typeof body.targetUrl === 'string' ? body.targetUrl.trim() : ''
    if (submissionId == null || !targetUrl) {
      send(res, 400, { error: 'submissionId_and_targetUrl_required' })
      return
    }

    const ssrf = await assertPublicHttpUrl(targetUrl)
    if (!ssrf.ok) {
      send(res, 400, { error: 'ssrf_blocked', reason: ssrf.reason })
      return
    }

    // Ack immediately — heavy work in background
    send(res, 202, { accepted: true, submissionId })

    setImmediate(() => {
      void runAuditJob({
        submissionId,
        targetUrl,
        locale: typeof body.locale === 'string' ? body.locale : undefined,
        planSlug: typeof body.planSlug === 'string' ? body.planSlug : undefined,
        clientEmail: typeof body.clientEmail === 'string' ? body.clientEmail : undefined,
        clientName: typeof body.clientName === 'string' ? body.clientName : undefined,
      })
    })
    return
  }

  send(res, 404, { error: 'not_found' })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[audit-agent] listening on :${PORT}`)
  if (!AGENT_SECRET) {
    console.warn('[audit-agent] AGENT_SECRET_TOKEN is empty — /api/run-audit will reject all requests')
  }
})
