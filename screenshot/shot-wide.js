const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const filePath = process.argv[2];
  const outPath = process.argv[3];
  const waitMs = parseInt(process.argv[4] || '2500', 10);
  const url = 'file://' + path.resolve(filePath).replace(/\\/g, '/');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: outPath });
  await browser.close();
  console.log('errores:', errors.length);
  errors.forEach(e => console.log(' -', e));
})();
