/**
 * Ping Supabase PostgreSQL database to prevent free-tier inactivity pause.
 *
 * Supabase free-tier projects pause after 7 days of inactivity.
 * This script connects to the DB, executes a query, and verifies connectivity.
 *
 * Usage:
 *   node scripts/ping-db.mjs
 *   pnpm db:ping
 *
 * Env:
 *   DATABASE_URL     — required (read from .env.local / .env if not in process.env)
 *   SUPABASE_REGION  — optional (default: ap-southeast-1)
 */
import dotenv from 'dotenv'
import pg from 'pg'
import https from 'node:https'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const raw = process.env.DATABASE_URL?.trim()
const region = process.env.SUPABASE_REGION?.trim() || 'ap-southeast-1'

if (!raw) {
  console.error('❌ Error: DATABASE_URL is empty. Please set DATABASE_URL.')
  process.exit(1)
}

function withSsl(url) {
  if (url.includes('sslmode=')) {
    return url.replace(/sslmode=require/g, 'sslmode=no-verify')
  }
  return url.includes('?') ? `${url}&sslmode=no-verify` : `${url}?sslmode=no-verify`
}

function parseDirect(url) {
  const m = url.match(
    /^(postgres(?:ql)?:\/\/)([^:]+):([^@]+)@db\.([a-z0-9]+)\.supabase\.co(?::\d+)?\/([^?]+)/i,
  )
  if (!m) return null
  return {
    scheme: m[1],
    user: m[2],
    pass: m[3],
    ref: m[4],
    dbname: m[5],
  }
}

function mask(url) {
  return url.replace(/:\/\/([^:]+):[^@]+@/, '://$1:***@')
}

async function pingPostgres(url) {
  const startTime = Date.now()
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10_000,
  })

  await client.connect()
  try {
    const res = await client.query('SELECT NOW() AS current_time, current_database() AS db_name, version() AS pg_version')
    const latency = Date.now() - startTime
    const row = res.rows[0]
    return {
      success: true,
      latencyMs: latency,
      currentTime: row.current_time,
      dbName: row.db_name,
      pgVersion: row.pg_version.split(' ')[0] + ' ' + row.pg_version.split(' ')[1],
    }
  } finally {
    try {
      await client.end()
    } catch {
      // ignore
    }
  }
}

async function pingRestApi(ref) {
  return new Promise((resolve) => {
    const start = Date.now()
    const req = https.get(`https://${ref}.supabase.co/auth/v1/health`, { timeout: 8000 }, (res) => {
      resolve({
        status: res.statusCode,
        latencyMs: Date.now() - start,
      })
    })
    req.on('error', (err) => {
      resolve({
        error: err.message,
        latencyMs: Date.now() - start,
      })
    })
    req.on('timeout', () => {
      req.destroy()
      resolve({
        error: 'timeout',
        latencyMs: Date.now() - start,
      })
    })
  })
}

async function main() {
  console.log('⚡ Starting Supabase Keepalive Ping...')
  const direct = parseDirect(raw)
  let projectRef = direct?.ref || null

  if (!projectRef) {
    const matchRef = raw.match(/postgres\.([a-z0-9]+):/i) || raw.match(/@([a-z0-9-]+)\.pooler\.supabase\.com/i)
    if (matchRef) projectRef = matchRef[1]
  }

  let connected = false
  let targetUrl = null

  if (!direct) {
    targetUrl = withSsl(raw)
    console.log(`📡 Connecting to provided URL: ${mask(targetUrl)}`)
    try {
      const info = await pingPostgres(targetUrl)
      console.log(`✅ Postgres alive! Latency: ${info.latencyMs}ms | DB: ${info.dbName} | Server time: ${info.currentTime}`)
      connected = true
    } catch (err) {
      console.warn(`⚠️ Direct connection attempt failed: ${err.message}`)
    }
  } else {
    const clusters = ['aws-0', 'aws-1', 'aws-2']
    for (const cluster of clusters) {
      const host = `${cluster}-${region}.pooler.supabase.com`
      const poolerUrl = withSsl(
        `${direct.scheme}postgres.${direct.ref}:${direct.pass}@${host}:5432/${direct.dbname}`,
      )
      console.log(`📡 Probing session pooler: ${host} ...`)
      try {
        const info = await pingPostgres(poolerUrl)
        console.log(`✅ Postgres alive via ${host}! Latency: ${info.latencyMs}ms | DB: ${info.dbName} | Server time: ${info.currentTime}`)
        connected = true
        break
      } catch (err) {
        console.warn(`  ⚠️ Failed on ${host}: ${err.message}`)
      }
    }
  }

  if (projectRef) {
    console.log(`🌐 Pinging Supabase HTTP endpoint (ref: ${projectRef})...`)
    const restRes = await pingRestApi(projectRef)
    if (restRes.status) {
      console.log(`✅ Supabase Auth/REST endpoint responded with HTTP ${restRes.status} in ${restRes.latencyMs}ms`)
    } else {
      console.log(`ℹ️ HTTP Ping info: ${restRes.error || 'no response'} (${restRes.latencyMs}ms)`)
    }
  }

  if (!connected) {
    console.error('❌ Failed to establish connection to Supabase database.')
    process.exit(1)
  }

  console.log('🎉 Supabase Keepalive completed successfully. Database is active.')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Fatal error during keepalive:', err)
  process.exit(1)
})
