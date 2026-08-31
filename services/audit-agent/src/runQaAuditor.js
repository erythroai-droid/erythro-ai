/**
 * Run Java QA_Auditor (Playwright) and return HTML + scorecard.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_QA_DIR = '/app/QA_Auditor'

/**
 * @param {string} planSlug
 * @returns {{ tier: 'FREE'|'DIAGNOSTIC'|'PRO', folder: string, pageCap: number }}
 */
export function planToTier(planSlug) {
  const slug = String(planSlug || 'audit-free').toLowerCase()
  if (slug.includes('pro')) return { tier: 'PRO', folder: 'pro', pageCap: 10 }
  if (slug.includes('diagnostic')) return { tier: 'DIAGNOSTIC', folder: 'diagnostic', pageCap: 5 }
  return { tier: 'FREE', folder: 'free', pageCap: 1 }
}

/**
 * @param {{
 *   targetUrl: string,
 *   reportLang?: string,
 *   planSlug?: string,
 *   timeoutMs?: number,
 * }} input
 */
export async function runQaAuditor(input) {
  const qaDir = process.env.QA_AUDITOR_DIR?.trim() || DEFAULT_QA_DIR
  const { tier, folder, pageCap } = planToTier(input.planSlug)
  const reportLang = normalizeLang(input.reportLang || 'en')
  const targetUrl = input.targetUrl?.trim()
  if (!targetUrl) throw new Error('TARGET_URL required')

  const timeoutMs = Number(input.timeoutMs || process.env.QA_AUDITOR_TIMEOUT_MS || 900_000)

  const env = {
    ...process.env,
    TARGET_URL: targetUrl,
    REPORT_LANG: reportLang,
    AUDIT_TIER: tier,
    AGENT_BROWSE_MAX_PAGES: String(pageCap),
    // Site locales to probe; keep small for free, broader for higher tiers
    LOCALES: pageCap <= 1 ? reportLang : 'en,ru,he',
  }

  console.log(
    `[qa-auditor] start tier=${tier} lang=${reportLang} pages=${pageCap} url=${targetUrl}`,
  )

  await fs.mkdir(path.join(qaDir, 'reports'), { recursive: true })

  await execMaven(qaDir, env, timeoutMs)

  const htmlPath = path.join(qaDir, 'reports', folder, `audit-report_${reportLang}.html`)
  const jsonPath = path.join(qaDir, 'reports', 'audit_data.json')

  let html = ''
  try {
    html = await fs.readFile(htmlPath, 'utf8')
  } catch {
    // fallback: generic HTML from collector
    const fallback = path.join(qaDir, 'reports', 'audit-report.html')
    html = await fs.readFile(fallback, 'utf8')
  }

  let score = 0
  let grade = null
  let summary = { tier: tier.toLowerCase(), reportLang, pageCap }
  try {
    const raw = JSON.parse(await fs.readFile(jsonPath, 'utf8'))
    const card = raw?.executive_scorecard || {}
    score = Number(card.overall_score ?? 0) || 0
    grade = card.grade ?? null
    summary = {
      ...summary,
      grade,
      overallScore: score,
      targetUrl: raw.target_url || targetUrl,
      timestamp: raw.timestamp || null,
      scales: card.scales || card.pillars || undefined,
    }
  } catch (err) {
    console.warn('[qa-auditor] could not parse audit_data.json:', err?.message || err)
  }

  if (!html || html.length < 100) {
    throw new Error(`QA_Auditor produced empty HTML (expected ${htmlPath})`)
  }

  // Web delivery is /api/audit/report/[id]/html — map filesystem-relative figma assets
  // to the Next proxy that reads from R2 (assets/figma-assets/*).
  html = html
    .replace(/(?:\.\.\/)+templates\/figma-assets\//g, '/api/audit/assets/figma-assets/')
    .replace(/\/api\/audit\/templates\/figma-assets\//g, '/api/audit/assets/figma-assets/')
    .replace(/\/templates\/figma-assets\//g, '/api/audit/assets/figma-assets/')

  console.log(`[qa-auditor] done score=${score} grade=${grade} htmlBytes=${html.length}`)
  return { html, score, grade, summary, htmlPath, jsonPath, tierFolder: folder }
}

function normalizeLang(lang) {
  const l = String(lang || 'en').toLowerCase()
  if (l.startsWith('ru')) return 'ru'
  if (l.startsWith('he') || l.startsWith('iw')) return 'he'
  return 'en'
}

function execMaven(cwd, env, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'mvn',
      ['-q', '-DskipTests', 'compile', 'exec:java', '-Dexec.mainClass=ai.erythro.AuditCollector'],
      {
        cwd,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (buf) => {
      const s = buf.toString('utf8')
      stdout += s
      process.stdout.write(s)
    })
    child.stderr.on('data', (buf) => {
      const s = buf.toString('utf8')
      stderr += s
      process.stderr.write(s)
    })

    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error(`QA_Auditor timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    child.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) resolve({ stdout, stderr })
      else {
        reject(
          new Error(
            `QA_Auditor exited ${code}: ${(stderr || stdout).slice(-1500)}`,
          ),
        )
      }
    })
  })
}
