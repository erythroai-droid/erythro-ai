/**
 * Resolve a Supabase DATABASE_URL that works from IPv4-only networks
 * (e.g. GitHub Actions). Direct db.*.supabase.co hosts are IPv6-only.
 *
 * If the URL already points at a pooler host, it is returned with
 * sslmode=no-verify. Otherwise we probe aws-0 / aws-1 / aws-2 session
 * poolers for the project region until one accepts the tenant.
 *
 * Env:
 *   DATABASE_URL     — required
 *   SUPABASE_REGION  — default ap-southeast-1
 */
import pg from 'pg'

const raw = process.env.DATABASE_URL?.trim()
const region = process.env.SUPABASE_REGION?.trim() || 'ap-southeast-1'

if (!raw) {
  console.error('DATABASE_URL is empty')
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

async function canConnect(url) {
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8_000,
  })
  try {
    await client.connect()
    await client.query('select 1')
    return true
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  fail: ${message}`)
    return false
  } finally {
    try {
      await client.end()
    } catch {
      // ignore
    }
  }
}

const direct = parseDirect(raw)

if (!direct) {
  const url = withSsl(raw)
  console.error(`Using provided URL host (not a direct db.*.supabase.co rewrite)`)
  if (!(await canConnect(url))) {
    console.error('Provided DATABASE_URL failed to connect')
    process.exit(1)
  }
  process.stdout.write(url)
  process.exit(0)
}

const clusters = ['aws-0', 'aws-1', 'aws-2']
for (const cluster of clusters) {
  const host = `${cluster}-${region}.pooler.supabase.com`
  const url = withSsl(
    `${direct.scheme}postgres.${direct.ref}:${direct.pass}@${host}:5432/${direct.dbname}`,
  )
  console.error(`Trying session pooler ${host} ...`)
  if (await canConnect(url)) {
    console.error(`Connected via ${host}`)
    process.stdout.write(url)
    process.exit(0)
  }
}

console.error(
  'No Supabase session pooler accepted this project. ' +
    'Copy the exact Session pooler URI from Supabase Dashboard → Connect ' +
    'and set it as the GitHub DATABASE_URL secret.',
)
process.exit(1)
