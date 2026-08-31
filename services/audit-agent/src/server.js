import http from 'node:http'
import { config as loadEnv } from 'dotenv'
import { runAuditJob } from './runAudit.js'

loadEnv()

const PORT = Number(process.env.PORT || 8080)
const AGENT_SECRET = process.env.AGENT_SECRET_TOKEN?.trim() || ''

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (err) {
        reject(err)
      }
    })
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
  return typeof header === 'string' && header === AGENT_SECRET
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

    let body
    try {
      body = await readJson(req)
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

    // Ack immediately — heavy work in background
    send(res, 202, { accepted: true, submissionId })

    setImmediate(() => {
      void runAuditJob({
        submissionId,
        targetUrl,
        locale: typeof body.locale === 'string' ? body.locale : undefined,
        planSlug: typeof body.planSlug === 'string' ? body.planSlug : undefined,
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
