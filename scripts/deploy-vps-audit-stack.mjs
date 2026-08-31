/**
 * Deploy Caddy + n8n (HTTPS) + audit-agent to Hostinger VPS via SSH/SFTP.
 *
 * Usage (PowerShell):
 *   $env:VPS_HOST='46.202.155.56'
 *   $env:VPS_USER='root'
 *   $env:VPS_PASSWORD='...'
 *   node scripts/deploy-vps-audit-stack.mjs
 *
 * Reads R2_* from local .env / .env.local. Does not print secret values.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { randomBytes } from 'node:crypto'
import { config as loadEnv } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

loadEnv({ path: join(root, '.env.local') })
loadEnv({ path: join(root, '.env') })

const require = createRequire(import.meta.url)
// paramiko is Python — use ssh2 via dynamic import after ensure
async function main() {
  const host = process.env.VPS_HOST?.trim() || '46.202.155.56'
  const username = process.env.VPS_USER?.trim() || 'root'
  const password = process.env.VPS_PASSWORD
  if (!password) {
    throw new Error('Set VPS_PASSWORD env to deploy')
  }

  const { Client } = await import('ssh2')
  const conn = new Client()

  await new Promise((resolve, reject) => {
    conn
      .on('ready', resolve)
      .on('error', reject)
      .connect({ host, port: 22, username, password, readyTimeout: 30000 })
  })

  const exec = (cmd) =>
    new Promise((resolve, reject) => {
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err)
        let out = ''
        let errOut = ''
        stream
          .on('close', (code) => {
            if (code !== 0) {
              reject(new Error(`cmd failed (${code}): ${cmd}\n${errOut || out}`))
            } else {
              resolve(out)
            }
          })
          .on('data', (d) => {
            out += d.toString()
          })
        stream.stderr.on('data', (d) => {
          errOut += d.toString()
        })
      })
    })

  const sftp = await new Promise((resolve, reject) => {
    conn.sftp((err, s) => (err ? reject(err) : resolve(s)))
  })

  const mkdirp = async (remotePath) => {
    await exec(`mkdir -p ${shellQuote(remotePath)}`)
  }

  const putFile = (localPath, remotePath) =>
    new Promise((resolve, reject) => {
      sftp.fastPut(localPath, remotePath, (err) => (err ? reject(err) : resolve()))
    })

  const putString = (remotePath, content) =>
    new Promise((resolve, reject) => {
      const stream = sftp.createWriteStream(remotePath)
      stream.on('error', reject)
      stream.on('close', resolve)
      stream.end(content)
    })

  console.log('[deploy] ensure proxy_network')
  await exec('docker network create proxy_network 2>/dev/null || true')

  console.log('[deploy] upload Caddy')
  await mkdirp('/home/caddy')
  await putFile(join(root, 'infra/caddy/Caddyfile'), '/home/caddy/Caddyfile')
  await putFile(join(root, 'infra/caddy/docker-compose.yml'), '/home/caddy/docker-compose.yml')

  console.log('[deploy] update n8n compose (keep n8n_data)')
  await putFile(join(root, 'infra/n8n/docker-compose.yml'), '/root/n8n/compose.yaml')

  console.log('[deploy] upload audit-agent')
  await mkdirp('/home/audit-agent/src')
  const agentRoot = join(root, 'services/audit-agent')
  await putFile(join(agentRoot, 'package.json'), '/home/audit-agent/package.json')
  await putFile(join(agentRoot, 'Dockerfile'), '/home/audit-agent/Dockerfile')
  await putFile(join(agentRoot, 'docker-compose.yml'), '/home/audit-agent/docker-compose.yml')
  for (const name of readdirSync(join(agentRoot, 'src'))) {
    const p = join(agentRoot, 'src', name)
    if (statSync(p).isFile()) {
      await putFile(p, `/home/audit-agent/src/${name}`)
    }
  }

  const agentSecret =
    process.env.AGENT_SECRET_TOKEN?.trim() || randomBytes(32).toString('hex')
  const r2Account = mustEnv('R2_ACCOUNT_ID')
  const r2Key = mustEnv('R2_ACCESS_KEY_ID')
  const r2Secret = mustEnv('R2_SECRET_ACCESS_KEY')
  const r2Bucket = process.env.R2_BUCKET?.trim() || 'erythro-audit-reports'
  const publicBase = process.env.R2_PUBLIC_BASE_URL?.trim() || ''

  const envBody = [
    'PORT=8080',
    `AGENT_SECRET_TOKEN=${agentSecret}`,
    `R2_ACCOUNT_ID=${r2Account}`,
    `R2_ACCESS_KEY_ID=${r2Key}`,
    `R2_SECRET_ACCESS_KEY=${r2Secret}`,
    `R2_BUCKET=${r2Bucket}`,
    publicBase ? `R2_PUBLIC_BASE_URL=${publicBase}` : '',
    'PAYLOAD_API_URL=https://erythro.ai',
    process.env.PAYLOAD_API_KEY?.trim()
      ? `PAYLOAD_API_KEY=${process.env.PAYLOAD_API_KEY.trim()}`
      : '# PAYLOAD_API_KEY=',
    '',
  ]
    .filter(Boolean)
    .join('\n')

  await putString('/home/audit-agent/.env', envBody + '\n')
  console.log('[deploy] wrote /home/audit-agent/.env (secrets not logged)')
  console.log(`[deploy] AGENT_SECRET_TOKEN length=${agentSecret.length} — save to Vercel as AGENT_SECRET_TOKEN`)

  // Write secret length marker locally for follow-up (not the secret itself if we can avoid)
  // Actually write to gitignored file for user to copy once
  await putStringLocal(join(root, 'services/audit-agent/.env.deployed.secret'), agentSecret)

  console.log('[deploy] start Caddy')
  await exec('cd /home/caddy && docker compose up -d')

  console.log('[deploy] recreate n8n on proxy_network (no public 5678)')
  await exec('cd /root/n8n && docker compose up -d --force-recreate')

  console.log('[deploy] build + start audit-agent')
  await exec('cd /home/audit-agent && docker compose up -d --build')

  console.log('[deploy] status')
  const status = await exec(
    'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"; docker network inspect proxy_network --format "{{range .Containers}}{{.Name}} {{end}}"',
  )
  console.log(status)

  conn.end()
  console.log('[deploy] done. Create DNS A records (DNS only) for n8n + agent-api → VPS IP before HTTPS works.')
}

function mustEnv(name) {
  const v = process.env[name]?.trim()
  if (!v) throw new Error(`Missing ${name} in local env`)
  return v
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\"'\"'`)}'`
}

function putStringLocal(path, content) {
  const { writeFileSync } = require('node:fs')
  writeFileSync(path, content, 'utf8')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
