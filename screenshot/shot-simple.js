const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const filePath = process.argv[2];
  const outPath = process.argv[3];
  const url = 'file://' + path.resolve(filePath).replace(/\\/g, '/');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 680, height: 700 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();
  console.log('done');
})();
