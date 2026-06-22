import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

async function run() {
  const qaDir = './qa'
  if (!fs.existsSync(qaDir)) {
    fs.mkdirSync(qaDir, { recursive: true })
  }

  console.log('Launching headless browser...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()

  console.log('Navigating to http://localhost:3003/...')
  try {
    await page.goto('http://localhost:3003/', { waitUntil: 'networkidle', timeout: 15000 })
  } catch (err) {
    console.error('Error connecting to http://localhost:3003/. Is the dev server running?')
    console.error(err.message)
    process.exit(1)
  }

  const coordinates = [
    { label: '01_services_intro_4000', y: 4000 },
    { label: '02_services_scrolling_5200', y: 5200 },
    { label: '03_letstalk_reveal_6200', y: 6200 },
    { label: '04_letstalk_scaled_7000', y: 7000 },
    { label: '05_letstalk_cta_7600', y: 7600 },
    { label: '06_solutions_sliding_8000', y: 8000 },
    { label: '07_solutions_full_8800', y: 8800 },
  ]

  for (const coord of coordinates) {
    console.log(`Scrolling to y = ${coord.y} (${coord.label})...`)
    await page.evaluate((targetY) => {
      window.scrollTo(0, targetY)
    }, coord.y)

    // Settle time for animations/ScrollTrigger scrub
    await page.waitForTimeout(600)

    const screenshotPath = path.join(qaDir, `${coord.label}.png`)
    await page.screenshot({ path: screenshotPath })
    console.log(`Saved screenshot: ${screenshotPath}`)
  }

  await browser.close()
  console.log('Visual QA verification completed. All screenshots saved in /qa.')
}

run().catch((err) => {
  console.error('Unhandled error in check-ui:', err)
  process.exit(1)
})
