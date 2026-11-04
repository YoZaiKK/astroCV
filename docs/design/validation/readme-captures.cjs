// Run with: node docs/design/validation/run.cjs readme-captures.cjs
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/memoc/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://localhost:4321';
const output = path.resolve(__dirname, '../../..', 'public/images');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    for (const [device, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
      for (const theme of ['light', 'dark']) {
        const context = await browser.newContext({
          viewport: { width, height },
          deviceScaleFactor: 1,
          colorScheme: theme,
          storageState: { cookies: [], origins: [{ origin: base, localStorage: [{ name: 'theme', value: theme }] }] },
        });
        const page = await context.newPage();
        await page.goto(base + '/');
        await page.locator('[data-play]:enabled').waitFor({ state: 'attached' });
        await page.locator('mini-kanban .mk-task').first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(350);
        assert.equal(await page.locator('html').getAttribute('lang'), 'en');
        assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
        await page.screenshot({ path: path.join(output, `readme-${device}-${theme}.png`) });
        if (device === 'desktop') {
          await page.locator('#projects').screenshot({
            path: path.join(output, `readme-lab-${theme}.png`),
            style: '.site-header { position: static; } .skip-link { visibility: hidden; }',
          });
        }
        console.log(`Saved ${device} / ${theme} (${width} x ${height}, English)`);
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
