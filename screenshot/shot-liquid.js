const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const filePath = process.argv[2];
  const url = 'file://' + path.resolve(filePath).replace(/\\/g, '/');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const el = document.querySelector('.liquid-panel');
    el.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'out/liquid-check.png' });
  await browser.close();
})();
