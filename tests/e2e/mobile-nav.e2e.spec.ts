import { expect, test } from '@playwright/test'

async function waitForSplashGone(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => !document.querySelector('.splash-bg'), null, {
    timeout: 20000,
  })
}

test.describe('Mobile navigation regressions', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('Hero Find out more scrolls to Let’s Talk, not Cases', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await waitForSplashGone(page)
    // SplashScreen.refreshScrollLayout() does scrollTo(0) 800ms after splash on <1024px.
    // Clicking inside that window is cancelled; humans wait longer (PIT-023).
    await page.waitForTimeout(1000)

    const findMore = page.locator('.hero-buttons button').first()
    await expect(findMore).toBeVisible()
    await findMore.click()

    // Mobile Let’s Talk is #contacts-mobile; #contacts is the hidden desktop overlay.
    const letsTalk = page.locator('#contacts-mobile')
    await expect(letsTalk).toBeVisible()
    await expect
      .poll(async () => letsTalk.evaluate((el) => el.getBoundingClientRect().top), {
        timeout: 8000,
      })
      .toBeLessThan(120)

    const casesTop = await page.locator('#cases').evaluate((el) => el.getBoundingClientRect().top)
    expect(casesTop).toBeLessThan(-40)
  })

  test('Services → Portfolio client nav starts at top (not footer)', async ({ page }) => {
    test.setTimeout(90000)
    await page.goto('http://localhost:3000/services/ai-automation')
    await waitForSplashGone(page)

    // Simulate deep scroll on the service page before navigating.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(200)
    const serviceScrollY = await page.evaluate(() => window.scrollY)
    expect(serviceScrollY).toBeGreaterThan(300)

    const portfolioCta = page.locator('#service-body a[href*="/portfolio"]').first()
    await expect(portfolioCta).toBeVisible()
    await portfolioCta.click()

    // Next.js <Link> is client-side: waitUntil "load" never fires again.
    await page.waitForURL(/\/portfolio\/?$/, { timeout: 20000, waitUntil: 'commit' })
    await waitForSplashGone(page)

    // After quick splash, scroll must reset — previous bug restored service scrollY.
    await expect
      .poll(async () => page.evaluate(() => window.scrollY), { timeout: 8000 })
      .toBeLessThan(80)

    await expect(page.locator('#portfolio')).toBeInViewport()
  })
})
