/**
 * Dump the project's Postgres database to backups/<timestamp>.dump (pg custom format).
 *
 * Restore with:
 *   pg_restore --clean --if-exists --no-owner -d "<uri>" backups/<file>.dump
 *
 * pg_dump must be at least as new as the server, so the script checks the server
 * version first and falls back to the matching postgres Docker image when the
 * local client is missing or too old.
 *
 * Env:
 *   DATABASE_URL     — required (read from .env.local / .env when not already set)
 *   BACKUP_DIR       — output directory, default ./backups
 *   BACKUP_SCHEMA    — schema to dump, default "public" (everything Payload owns)
 *   SUPABASE_REGION  — used when rewriting IPv6-only direct hosts (default ap-southeast-1)
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const raw = process.env.DATABASE_URL?.trim()
const outDir = path.resolve(process.env.BACKUP_DIR?.trim() || 'backups')
const schema = process.env.BACKUP_SCHEMA?.trim() || 'public'
const scriptsDir = path.dirname(fileURLToPath(import.meta.url))

if (!raw) {
  console.error('DATABASE_URL is empty — set it in .env.local or the environment')
  process.exit(1)
}

/**
 * Direct db.*.supabase.co hosts are IPv6-only. Docker (and many ISPs) only have
 * IPv4, so rewrite to a working session pooler — same helper as CI.
 */
function resolveReachableUrl(url) {
  const res = spawnSync(process.execPath, [path.join(scriptsDir, 'ci-resolve-supabase-url.mjs')], {
    encoding: 'utf8',
    env: { ...process.env, DATABASE_URL: url },
  })
  if (res.status !== 0) {
    const detail = (res.stderr || res.stdout || '').trim()
    throw new Error(detail || `ci-resolve-supabase-url exited ${res.status}`)
  }
  const resolved = (res.stdout || '').trim()
  if (!resolved) throw new Error('ci-resolve-supabase-url returned an empty URL')
  return resolved
}

/**
 * libpq rejects sslmode=no-verify (a node-postgres extension), and pg_dump needs
 * a session connection — the Supabase transaction pooler on 6543 will not do.
 */
function toLibpqUrl(url) {
  let next = url.replace(/([?&])sslmode=[^&]*/gi, '$1sslmode=require')
  if (!/[?&]sslmode=/i.test(next)) {
    next += next.includes('?') ? '&sslmode=require' : '?sslmode=require'
  }
  return next.replace(/(pooler\.supabase\.com):6543\b/i, '$1:5432')
}

/** node-postgres v3 connection strings read sslmode as verify-full, which Supabase certs fail. */
function stripSslmode(url) {
  return url
    .replace(/([?&])sslmode=[^&]*(&)?/gi, (_m, sep, tail) => (tail ? sep : ''))
    .replace(/[?&]$/, '')
}

function mask(url) {
  return url.replace(/:\/\/([^:]+):[^@]+@/, '://$1:***@')
}

function majorOf(version) {
  const m = String(version).match(/(\d+)/)
  return m ? Number(m[1]) : 0
}

async function serverMajor(url) {
  const client = new pg.Client({
    connectionString: stripSslmode(url),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  })
  await client.connect()
  try {
    const { rows } = await client.query('show server_version')
    return majorOf(rows[0].server_version)
  } finally {
    await client.end().catch(() => {})
  }
}

function localPgDumpMajor() {
  const res = spawnSync('pg_dump', ['--version'], { encoding: 'utf8' })
  if (res.error || res.status !== 0) return 0
  return majorOf(String(res.stdout).replace(/^\D*/, ''))
}

function hasDocker() {
  const res = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], {
    encoding: 'utf8',
  })
  return !res.error && res.status === 0
}

let resolved
try {
  resolved = resolveReachableUrl(raw)
} catch (err) {
  console.error(`Cannot resolve a reachable DATABASE_URL: ${err.message}`)
  process.exit(1)
}

const url = toLibpqUrl(resolved)
console.log(`Source: ${mask(url)}`)

const pgMajor = await serverMajor(url).catch((err) => {
  console.error(`Cannot reach the database: ${err.message}`)
  process.exit(1)
})
console.log(`Server: PostgreSQL ${pgMajor}`)

mkdirSync(outDir, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const fileName = `erythro-${stamp}.dump`
const dumpArgs = [
  url,
  '--format=custom',
  '--no-owner',
  '--no-privileges',
  `--schema=${schema}`,
]

const clientMajor = localPgDumpMajor()
let result

if (clientMajor >= pgMajor) {
  console.log(`Dumping with local pg_dump ${clientMajor} → ${path.join(outDir, fileName)}`)
  result = spawnSync('pg_dump', [...dumpArgs, `--file=${path.join(outDir, fileName)}`], {
    stdio: 'inherit',
  })
} else if (hasDocker()) {
  const reason = clientMajor ? `local pg_dump is ${clientMajor}` : 'pg_dump is not installed'
  console.log(`Dumping with docker postgres:${pgMajor} (${reason}) → ${path.join(outDir, fileName)}`)
  result = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '-v',
      `${outDir}:/backup`,
      `postgres:${pgMajor}`,
      'pg_dump',
      ...dumpArgs,
      `--file=/backup/${fileName}`,
    ],
    { stdio: 'inherit' },
  )
} else {
  console.error(
    `Need pg_dump ${pgMajor}+ or Docker. Install the PostgreSQL ${pgMajor} client ` +
      `(https://www.postgresql.org/download/) or start Docker Desktop and retry.`,
  )
  process.exit(1)
}

if (result.error || result.status !== 0) {
  console.error(`Backup failed: ${result.error?.message || `exit code ${result.status}`}`)
  process.exit(1)
}

console.log(`Backup written: ${path.join(outDir, fileName)}`)
