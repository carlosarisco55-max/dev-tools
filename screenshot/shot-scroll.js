const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const filePath = process.argv[2];
  const outDir = process.argv[3];
  const url = 'file://' + path.resolve(filePath).replace(/\\/g, '/');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const height = await page.evaluate(() => document.body.scrollHeight);
  const fractions = [0, 0.15, 0.35, 0.55, 0.75, 0.95];
  for (let i = 0; i < fractions.length; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), height * fractions[i]);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, `fly-${i}.png`) });
  }
  console.log('errores:', errors.length);
  errors.forEach(e => console.log(' -', e));
  await browser.close();
})();
